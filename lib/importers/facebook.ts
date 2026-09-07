/**
 * Importer: Facebook Events (Graph API v19)
 *
 * Polls a curated list of Riga venue/promoter Facebook Pages for upcoming events.
 * Uses an App Access Token (APP_ID|APP_SECRET) — no user OAuth needed for public pages.
 *
 * To add a venue: append to RIGA_PAGES below. The pageId is the username or numeric
 * ID from the page URL (e.g. facebook.com/kanepekulturavieta → "kanepekulturavieta").
 *
 * Env vars required: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 */

import { normalizeEvent, type RawEvent } from './shared/normalizeEvent'
import { upsertToStaging } from './shared/upsertToStaging'
import { inferEventType } from './shared/eventType'

const SOURCE = 'facebook'
const GRAPH_API = 'https://graph.facebook.com/v19.0'
const EVENTS_FIELDS = 'id,name,start_time,end_time,place,cover,description,ticket_uri'
const PAGE_LIMIT = 50

interface RigaPage {
  pageId: string
  venueName: string
  genres: string[]
}

// ── Add Riga venues/promoters here ────────────────────────────────────────────
const RIGA_PAGES: RigaPage[] = [
  { pageId: 'kanepekulturavieta',  venueName: 'Kaņepe Kultūrvieta',  genres: ['electronic', 'indie'] },
  { pageId: 'nabaklab',            venueName: 'Nabaklab',             genres: ['electronic'] },
  { pageId: 'melnaPiektdiena',     venueName: 'Melnā Piektdiena',     genres: ['electronic'] },
  { pageId: 'ClubEssentialRiga',   venueName: 'Essential',            genres: ['electronic', 'house'] },
  { pageId: 'fabrikalv',           venueName: 'Fabrika',              genres: ['electronic', 'indie'] },
  { pageId: 'folkklubs.ala.pagrabs', venueName: 'Folkklubs Ala Pagrabs', genres: ['folk', 'indie'] },
]
// ─────────────────────────────────────────────────────────────────────────────

interface FBPlace {
  name?: string
  location?: { latitude?: number; longitude?: number; street?: string }
}

interface FBCover {
  source?: string
}

interface FBEvent {
  id: string
  name: string
  start_time: string   // ISO 8601 with tz offset, e.g. "2026-08-15T22:00:00+0300"
  end_time?: string
  place?: FBPlace
  cover?: FBCover
  description?: string
  ticket_uri?: string
}

interface FBPaging {
  cursors?: { after?: string }
  next?: string
}

export async function runFacebook(): Promise<{ imported: number; skipped: number }> {
  const token = appToken()
  if (!token) {
    console.error(`[${SOURCE}] FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set — skipping`)
    return { imported: 0, skipped: 0 }
  }

  let imported = 0
  let skipped = 0

  for (const page of RIGA_PAGES) {
    let events: FBEvent[]
    try {
      events = await fetchPageEvents(page.pageId, token)
    } catch (err) {
      console.error(`[${SOURCE}] failed to fetch page ${page.pageId}:`, err)
      skipped++
      continue
    }

    console.log(`[${SOURCE}] ${page.pageId}: ${events.length} events`)

    for (const ev of events) {
      try {
        const raw = toRawEvent(ev, page)
        if (!raw) { skipped++; continue }
        const normalized = await normalizeEvent(raw)
        await upsertToStaging(normalized)
        imported++
      } catch (err) {
        console.error(`[${SOURCE}] failed to import event id=${ev.id}:`, err)
        skipped++
      }
    }
  }

  return { imported, skipped }
}

async function fetchPageEvents(pageId: string, token: string): Promise<FBEvent[]> {
  const results: FBEvent[] = []
  let url: string | null =
    `${GRAPH_API}/${pageId}/events` +
    `?fields=${EVENTS_FIELDS}` +
    `&time_filter=upcoming` +
    `&limit=${PAGE_LIMIT}` +
    `&access_token=${token}`

  while (url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Graph API ${res.status} for page ${pageId}: ${body.slice(0, 200)}`)
    }

    const json = await res.json() as { data?: FBEvent[]; paging?: FBPaging; error?: { message: string } }

    if (json.error) throw new Error(json.error.message)

    const batch = json.data ?? []
    results.push(...batch)

    // Cursor-based pagination
    url = json.paging?.next ?? null
  }

  return results
}

function toRawEvent(ev: FBEvent, page: RigaPage): RawEvent | null {
  if (!ev.name?.trim() || !ev.start_time) return null

  const venueName = ev.place?.name?.trim() || page.venueName

  // page.genres is a per-venue prior (e.g. "Essential" is usually electronic),
  // but a page can host an off-genre event — layer in what the title itself says.
  const genreTags = Array.from(new Set([...page.genres, ...inferEventType(ev.name, ev.description)]))

  return {
    title: ev.name.trim(),
    localStartsAt: isoToRigaLocal(ev.start_time),
    localEndsAt: ev.end_time ? isoToRigaLocal(ev.end_time) : undefined,
    venueName,
    venueAddress: ev.place?.location?.street ?? undefined,
    venueLat: ev.place?.location?.latitude ?? undefined,
    venueLng: ev.place?.location?.longitude ?? undefined,
    imageUrl: ev.cover?.source ?? undefined,
    description: ev.description ?? undefined,
    genreTags,
    ticketUrl: ev.ticket_uri ?? `https://www.facebook.com/events/${ev.id}`,
    source: SOURCE,
    externalId: ev.id,
    url: `https://www.facebook.com/events/${ev.id}`,
    rawPayload: ev,
  }
}

/** Convert any ISO 8601 string (with or without tz offset) to a Riga local "YYYY-MM-DDTHH:mm" string. */
function isoToRigaLocal(iso: string): string {
  const date = new Date(iso)
  const fmt = new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Riga',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  return fmt.format(date).replace(' ', 'T')
}

function appToken(): string | null {
  const id = process.env.FACEBOOK_APP_ID
  const secret = process.env.FACEBOOK_APP_SECRET
  if (!id || !secret) return null
  return `${id}|${secret}`
}
