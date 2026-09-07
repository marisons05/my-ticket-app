/**
 * GET /api/ingest
 *
 * Called by Vercel Cron (weekly, Monday 06:00 UTC).
 * Runs all importers → dedup pass → stale-check pass in sequence.
 *
 * Secured by CRON_SECRET (same env var as the existing sync route).
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/importers/shared/supabaseAdmin'
import { runBilsesuParadize } from '@/lib/importers/bilsesuParadize'
import { runResidentAdvisor } from '@/lib/importers/residentAdvisor'
import { runFacebook } from '@/lib/importers/facebook'

export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') ??
    request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // ── 1. Run importers ────────────────────────────────────────
  try {
    results.bilsesuParadize = await runBilsesuParadize()
  } catch (err) {
    results.bilsesuParadize = { error: String(err) }
  }

  try {
    results.residentAdvisor = await runResidentAdvisor()
  } catch (err) {
    results.residentAdvisor = { error: String(err) }
  }

  try {
    results.facebook = await runFacebook()
  } catch (err) {
    results.facebook = { error: String(err) }
  }

  // Add more importers here as you build them:
  // results.fienta = await runFienta()
  // results.ticketPro = await runTicketPro()

  // ── 2. Dedup pass ────────────────────────────────────────────
  // Promote staging rows that have been approved and don't yet exist in events.
  // Cross-source dedup: if a match exists (same normalized_title + venue_id + date),
  // add the source to event_sources instead of creating a new events row.
  const dedupResult = await runDedupPass()
  results.dedup = dedupResult

  // ── 3. Stale-check pass ──────────────────────────────────────
  const staleResult = await runStalePass()
  results.stale = staleResult

  return Response.json({ ok: true, results })
}

// ── Dedup pass ───────────────────────────────────────────────

interface StagingRow {
  id: string
  normalized_title: string
  venue_id: string | null
  starts_at: string
  ends_at: string | null
  genre_tags: string[]
  ticket_url: string | null
  image_url: string | null
  description: string | null
  title: string
  source: string
  external_id: string
  url: string | null
}

async function runDedupPass(): Promise<{ promoted: number; merged: number; errors: number }> {
  // Fetch all approved staging rows not yet in event_sources
  const { data: pending, error: fetchErr } = await supabaseAdmin
    .from('events_staging')
    .select('id, normalized_title, venue_id, starts_at, ends_at, genre_tags, ticket_url, image_url, description, title, source, external_id, url')
    .eq('review_status', 'approved')
    .not('source', 'in', `(select source from event_sources where external_id = events_staging.external_id)`)

  if (fetchErr) {
    console.error('dedup fetch error:', fetchErr.message)
    return { promoted: 0, merged: 0, errors: 1 }
  }

  const rows = (pending ?? []) as StagingRow[]
  let promoted = 0
  let merged = 0
  let errors = 0

  for (const row of rows) {
    try {
      // Check if an event already exists with the same normalized_title + venue_id + date
      const startDate = row.starts_at.slice(0, 10)
      const { data: existing } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('normalized_title', row.normalized_title)
        .eq('venue_id', row.venue_id ?? '')
        .filter('starts_at', 'gte', `${startDate}T00:00:00Z`)
        .filter('starts_at', 'lte', `${startDate}T23:59:59Z`)
        .maybeSingle()

      if (existing) {
        // Merge: attach this source to the existing event and update last_seen_at
        await supabaseAdmin.from('event_sources').upsert(
          { event_id: existing.id, source: row.source, external_id: row.external_id, url: row.url },
          { onConflict: 'source,external_id' }
        )
        await supabaseAdmin
          .from('events')
          .update({
            last_seen_at: new Date().toISOString(),
            ...(row.image_url ? { image_url: row.image_url } : {}),
          })
          .eq('id', existing.id)
        merged++
      } else {
        // Promote: insert new event + event_source
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

        if (insertErr) throw insertErr

        await supabaseAdmin.from('event_sources').insert({
          event_id: created.id,
          source: row.source,
          external_id: row.external_id,
          url: row.url,
        })
        promoted++
      }
    } catch (err) {
      console.error(`dedup error for staging row ${row.id}:`, err)
      errors++
    }
  }

  return { promoted, merged, errors }
}

// ── Stale-check pass ─────────────────────────────────────────

async function runStalePass(): Promise<{ markedStale: number; archived: number }> {
  const now = new Date().toISOString()

  // Mark events whose date hasn't passed but weren't seen in this run as stale.
  // "This run" = last_seen_at older than 8 days (giving 1 day slack around the weekly cadence).
  const cutoff = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

  const { count: markedStale } = await supabaseAdmin
    .from('events')
    .update({ status: 'stale' })
    .eq('status', 'published')
    .lt('last_seen_at', cutoff)
    .gt('starts_at', now)  // date hasn't passed yet — still upcoming but no longer seen

  // Archive events whose date has passed (regardless of status)
  const { count: archived } = await supabaseAdmin
    .from('events')
    .update({ status: 'stale' })
    .in('status', ['published', 'draft'])
    .lt('starts_at', now)

  return { markedStale: markedStale ?? 0, archived: archived ?? 0 }
}
