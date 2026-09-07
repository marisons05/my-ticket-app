/**
 * POST /api/admin/backfill-images
 *
 * One-off: fetches current RA events, extracts images from the `images` array,
 * and updates image_url on any matching events row (matched via event_sources).
 * Safe to call multiple times.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RA_GRAPHQL = 'https://ra.co/graphql'
const RIGA_AREA_ID = 560

const RA_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://ra.co/events/lv/riga',
  Origin: 'https://ra.co',
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return Response.json({ error: 'Admin only' }, { status: 403 })

  const today = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Fetch all RA events with images
  const allListings: { event: { id: string; images: { filename?: string; type?: string }[] } }[] = []
  let page = 1
  while (true) {
    const res = await fetch(RA_GRAPHQL, {
      method: 'POST',
      headers: RA_HEADERS,
      body: JSON.stringify({
        query: `query($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
          eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
            data { event { id images { filename type } } }
          }
        }`,
        variables: {
          filters: { areas: { eq: RIGA_AREA_ID }, listingDate: { gte: today, lte: future } },
          pageSize: 50,
          page,
        },
      }),
    })
    const json = await res.json()
    const data = json.data?.eventListings?.data ?? []
    allListings.push(...data)
    if (data.length < 50) break
    page++
  }

  let updated = 0
  let skipped = 0

  for (const { event } of allListings) {
    const imageUrl = event.images?.find((img) => img.type === 'FLYERFRONT')?.filename
    if (!imageUrl) { skipped++; continue }

    // Find the events row via event_sources
    const { data: source } = await supabase
      .from('event_sources')
      .select('event_id')
      .eq('source', 'resident_advisor')
      .eq('external_id', String(event.id))
      .maybeSingle()

    if (!source?.event_id) { skipped++; continue }

    const { error } = await supabase
      .from('events')
      .update({ image_url: imageUrl })
      .eq('id', source.event_id)
      .is('image_url', null)

    if (!error) updated++
    else skipped++
  }

  return Response.json({ ok: true, updated, skipped, total: allListings.length })
}
