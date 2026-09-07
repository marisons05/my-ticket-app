/**
 * Importer: Resident Advisor (ra.co)
 *
 * Uses RA's GraphQL API to fetch upcoming events in Riga (area ID 560).
 * Fetches 90 days ahead, paginates until exhausted, routes each event
 * through normalizeEvent() → upsertToStaging() for admin review.
 *
 * RA covers primarily electronic / club events. Complement with other
 * sources for classical, pop, theatre etc.
 */

import { fromZonedTime } from 'date-fns-tz'
import { normalizeEvent, type RawEvent } from './shared/normalizeEvent'
import { upsertToStaging } from './shared/upsertToStaging'

const SOURCE = 'resident_advisor'
const RA_GRAPHQL = 'https://ra.co/graphql'
const RIGA_AREA_ID = 560
const PAGE_SIZE = 50
const DAYS_AHEAD = 90

const RA_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://ra.co/events/lv/riga',
  Origin: 'https://ra.co',
  'Accept-Language': 'en-US,en;q=0.9',
}

const EVENTS_QUERY = `
  query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
    eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
      data {
        event {
          id
          title
          date
          startTime
          endTime
          content
          images {
            filename
            type
          }
          venue {
            name
            address
            location {
              latitude
              longitude
            }
          }
        }
      }
    }
  }
`

interface RAVenue {
  name?: string
  address?: string
  location?: { latitude?: number; longitude?: number }
}

interface RAImage {
  filename?: string
  type?: string
}

interface RAEvent {
  id?: string
  title?: string
  date?: string       // "2026-08-15"
  startTime?: string  // "2026-08-15T22:00:00.000Z" (UTC)
  endTime?: string
  content?: string
  images?: RAImage[]
  venue?: RAVenue
}

interface RAListing {
  event?: RAEvent
}

export async function runResidentAdvisor(): Promise<{ imported: number; skipped: number }> {
  let listings: RAListing[]
  try {
    listings = await fetchAllListings()
  } catch (err) {
    console.error(`[${SOURCE}] fetch failed:`, err)
    return { imported: 0, skipped: 0 }
  }

  console.log(`[${SOURCE}] fetched ${listings.length} listings`)

  let imported = 0
  let skipped = 0

  for (const listing of listings) {
    const ev = listing.event
    if (!ev?.title || !ev?.id) { skipped++; continue }

    try {
      const raw = toRawEvent(ev)
      if (!raw) { skipped++; continue }
      const normalized = await normalizeEvent(raw)
      await upsertToStaging(normalized)
      imported++
    } catch (err) {
      console.error(`[${SOURCE}] failed to import RA event id=${ev.id}:`, err)
      skipped++
    }
  }

  return { imported, skipped }
}

async function fetchAllListings(): Promise<RAListing[]> {
  const today = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + DAYS_AHEAD * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const results: RAListing[] = []
  let page = 1

  while (true) {
    const res = await fetch(RA_GRAPHQL, {
      method: 'POST',
      headers: RA_HEADERS,
      body: JSON.stringify({
        query: EVENTS_QUERY,
        variables: {
          filters: {
            areas: { eq: RIGA_AREA_ID },
            listingDate: { gte: today, lte: future },
          },
          pageSize: PAGE_SIZE,
          page,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) throw new Error(`RA GraphQL request failed: ${res.status}`)

    const json = await res.json()
    if (json.errors?.length) throw new Error(`RA GraphQL error: ${json.errors[0].message}`)

    const data: RAListing[] = json.data?.eventListings?.data ?? []
    results.push(...data)

    if (data.length < PAGE_SIZE) break  // last page

    page++
  }

  return results
}

function toRawEvent(ev: RAEvent): RawEvent | null {
  // RA gives us startTime in UTC ("2026-08-15T22:00:00.000Z")
  // Convert to Riga local time string so normalizeEvent's rigaToUtc round-trips correctly
  const startsAt = ev.startTime ?? (ev.date ? `${ev.date}T22:00:00.000Z` : null)
  if (!startsAt) return null

  const localStartsAt = utcToRigaLocal(startsAt)

  const localEndsAt = ev.endTime ? utcToRigaLocal(ev.endTime) : undefined

  return {
    title: ev.title!.trim(),
    localStartsAt,
    localEndsAt,
    venueName: ev.venue?.name?.trim() || 'Rīga',
    venueAddress: ev.venue?.address ?? undefined,
    venueLat: ev.venue?.location?.latitude ?? undefined,
    venueLng: ev.venue?.location?.longitude ?? undefined,
    imageUrl: ev.images?.find(img => img.type === 'FLYERFRONT')?.filename ?? undefined,
    description: ev.content ?? undefined,
    genreTags: ['electronic'],
    ticketUrl: `https://ra.co/events/${ev.id}`,
    source: SOURCE,
    externalId: String(ev.id),
    url: `https://ra.co/events/${ev.id}`,
    rawPayload: ev,
  }
}

/** Convert a UTC ISO string to a Riga local datetime string "YYYY-MM-DDTHH:mm" */
function utcToRigaLocal(utcStr: string): string {
  const utcDate = new Date(utcStr)
  // Format in Riga timezone
  const fmt = new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Riga',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  return fmt.format(utcDate).replace(' ', 'T')
}
