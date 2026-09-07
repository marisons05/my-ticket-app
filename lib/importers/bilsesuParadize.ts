/**
 * Importer: Biļešu Paradīze (bilesuparadize.lv)
 *
 * Uses their internal JSON API (POST /api/search/events) discovered via
 * browser Network tab. No HTML scraping needed.
 *
 * NOTE: This uses an undocumented internal API. Consider reaching out to
 * Biļešu Paradīze for an official data partnership — more stable long-term.
 *
 * Fetches all upcoming events, paginates until the API returns fewer results
 * than the page size, normalizes each event, and upserts to events_staging.
 */

import { normalizeEvent, type RawEvent } from './shared/normalizeEvent'
import { batchUpsertToStaging } from './shared/upsertToStaging'
import { rateLimitDelay, scraperUserAgent } from './shared/robotsCheck'
import { classifyBpEvent } from './shared/eventType'

const SOURCE = 'bilese_paradize'
const API_URL = 'https://www.bilesuparadize.lv/api/search/events'
const BASE_URL = 'https://www.bilesuparadize.lv'
const PAGE_SIZE = 100

interface BPEvent {
  id: string
  performance_id: number
  performance_titles: { lv: string; en: string; ru: string }
  venue_titles: { lv: string; en: string; ru: string }
  hall_titles: { lv: string; en: string; ru: string }
  address: string
  city: string
  date_time: string         // "2026-07-29 19:00:00" — Riga local time
  latitude: number | null
  longitude: number | null
  poster_image_url: { lv: string; en: string; ru: string }
  small_image_url: { lv: string; en: string; ru: string }
  category_ids: number[]
}

export async function runBilsesuParadize(): Promise<{ imported: number; skipped: number }> {
  let allEvents: BPEvent[]
  try {
    allEvents = await fetchAllEvents()
  } catch (err) {
    console.error(`[${SOURCE}] API fetch failed:`, err)
    return { imported: 0, skipped: 0 }
  }

  console.log(`[${SOURCE}] fetched ${allEvents.length} events from API`)

  const venueCache = new Map<string, string | null>()
  const normalized = []
  let skipped = 0

  for (const ev of allEvents) {
    try {
      const raw = toRawEvent(ev)
      if (!raw) { skipped++; continue }
      normalized.push(await normalizeEvent(raw, venueCache))
    } catch (err) {
      console.error(`[${SOURCE}] failed to normalize event id=${ev.id}:`, err)
      skipped++
    }
  }

  await batchUpsertToStaging(normalized)

  return { imported: normalized.length, skipped }
}

async function fetchAllEvents(): Promise<BPEvent[]> {
  const results: BPEvent[] = []
  let page = 1

  while (true) {
    const body = { page, limit: PAGE_SIZE }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'locale': 'lv',
        'User-Agent': scraperUserAgent(),
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/lv/pasakumi`,
        'x-requested-with': 'XMLHttpRequest',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API responded ${res.status} on page ${page}: ${text.slice(0, 200)}`)
    }

    const raw = await res.json()

    // Log first page response shape to help debug
    if (page === 1) {
      const shape = Array.isArray(raw)
        ? `array[${raw.length}] first keys: ${Object.keys(raw[0] ?? {}).slice(0, 6).join(', ')}`
        : `object keys: ${Object.keys(raw).slice(0, 8).join(', ')}`
      console.log(`[${SOURCE}] page 1 response shape:`, shape)
    }

    // Handle both plain array and wrapped {data:[]} response shapes
    const data: BPEvent[] = Array.isArray(raw) ? raw : (raw.data ?? raw.events ?? raw.results ?? [])

    if (data.length === 0) break

    results.push(...data)

    // If we got anything other than exactly PAGE_SIZE results, the API either
    // returned everything at once (>PAGE_SIZE) or we're on the last page (<PAGE_SIZE).
    if (data.length !== PAGE_SIZE) break

    page++
    await rateLimitDelay(1500)
  }

  return results
}

function toRawEvent(ev: BPEvent): RawEvent | null {
  const title = ev.performance_titles?.lv?.trim()
  if (!title) return null

  // date_time is Riga local time: "2026-07-29 19:00:00"
  const localStartsAt = ev.date_time?.replace(' ', 'T').slice(0, 16)
  if (!localStartsAt) return null

  const venueName =
    ev.venue_titles?.lv?.trim() ||
    ev.hall_titles?.lv?.trim() ||
    'Rīga'

  const imageUrl =
    ev.poster_image_url?.lv?.split('?')[0] ||  // strip cache-busting query string
    ev.small_image_url?.lv?.split('?')[0] ||
    undefined

  const ticketUrl = `${BASE_URL}/lv/events/${ev.id}`

  // See shared/eventType.ts: category_ids first, title-keyword fallback for
  // the ids that don't map to a clean event type.
  const genreTags = classifyBpEvent(ev.category_ids, title)

  return {
    title,
    localStartsAt,
    venueName,
    venueAddress: ev.address ?? undefined,
    venueLat: ev.latitude ?? undefined,
    venueLng: ev.longitude ?? undefined,
    ticketUrl,
    imageUrl,
    genreTags,
    source: SOURCE,
    externalId: String(ev.id),
    url: ticketUrl,
    rawPayload: ev,
  }
}
