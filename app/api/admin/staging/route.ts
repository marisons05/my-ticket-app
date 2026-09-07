import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/importers/shared/supabaseAdmin'

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await getAdminUser(request)
  if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status') ?? 'pending'
  const source = url.searchParams.get('source') ?? ''
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('events_staging')
    .select('*, venues(name)', { count: 'exact' })
    .eq('review_status', status)
    // Events whose date has already passed have nothing left to review — keep them out of the queue.
    .gte('starts_at', new Date().toISOString())

  if (source) query = query.eq('source', source)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ rows: data, total: count, page, pageSize })
}

export async function POST(request: NextRequest) {
  const user = await getAdminUser(request)
  if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, action } = body as { id: string; action: 'approve' | 'reject' }

  if (!id || !['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'id and action (approve|reject) are required' }, { status: 400 })
  }

  const review_status = action === 'approve' ? 'approved' : 'rejected'

  // Mark staging row
  const { error: updateErr } = await supabaseAdmin
    .from('events_staging')
    .update({ review_status, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 })

  // On approve: promote to events immediately (no need to wait for next ingest run)
  if (action === 'approve') {
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('events_staging')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return Response.json({ ok: true, id, review_status, promoted: false })
    }

    const startDate = row.starts_at?.slice(0, 10)

    // Check for existing event (dedup: same title + venue + date)
    const { data: existing } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('normalized_title', row.normalized_title)
      .eq('venue_id', row.venue_id ?? '')
      .gte('starts_at', `${startDate}T00:00:00Z`)
      .lte('starts_at', `${startDate}T23:59:59Z`)
      .maybeSingle()

    if (existing) {
      // Merge: attach source to existing event
      await supabaseAdmin.from('event_sources').upsert(
        { event_id: existing.id, source: row.source, external_id: row.external_id, url: row.url },
        { onConflict: 'source,external_id' }
      )
      await supabaseAdmin
        .from('events')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      // Promote: insert new event + source
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('events')
        .insert({
          title: row.title,
          normalized_title: row.normalized_title,
          venue_id: row.venue_id,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          genre_tags: row.genre_tags,
          ticket_url: row.ticket_url,
          image_url: row.image_url,
          description: row.description,
          status: 'published',
          last_seen_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!insertErr && created) {
        await supabaseAdmin.from('event_sources').insert({
          event_id: created.id,
          source: row.source,
          external_id: row.external_id,
          url: row.url,
        })
      }
    }
  }

  return Response.json({ ok: true, id, review_status })
}
