import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RA_GRAPHQL = 'https://ra.co/graphql'
// Riga area ID on RA (from area(areaUrlName:"riga", countryUrlCode:"lv"))
const RIGA_AREA_ID = 560

const RA_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Referer: 'https://ra.co/events/lv/riga',
  Origin: 'https://ra.co',
  'Accept-Language': 'en-US,en;q=0.9',
}

// eventListings returns EventListing wrappers; the actual event lives under .event
const EVENTS_QUERY = `
  query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
    eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
      data {
        listingDate
        event {
          id
          title
          date
          startTime
          cost
          content
          flyerFront
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

async function fetchRAEvents(): Promise<RAEventListing[]> {
  const today = new Date().toISOString().slice(0, 10)
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

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
        pageSize: 50,
        page: 1,
      },
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`RA GraphQL request failed: ${res.status}`)
  }

  const json = await res.json()

  if (json.errors?.length) {
    throw new Error(`RA GraphQL error: ${json.errors[0].message}`)
  }

  return json.data?.eventListings?.data ?? []
}

function parsePrice(cost: string | number | null | undefined): number {
  if (cost == null || cost === '') return 0
  if (typeof cost === 'number') return cost
  const match = String(cost).match(/\d+(?:[.,]\d+)?/)
  return match ? parseFloat(match[0].replace(',', '.')) : 0
}

export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') ??
    request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let listings: RAEventListing[]
  try {
    listings = await fetchRAEvents()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }

  if (listings.length === 0) {
    return Response.json({ synced: 0, message: 'No upcoming events found on RA for Riga' })
  }

  // Dedup against existing DB rows — avoids needing a unique DB constraint
  const { data: existing } = await supabase.from('events').select('title, date')
  const existingKeys = new Set(
    (existing ?? []).map((e: { title: string; date: string }) => `${e.title}|${e.date}`)
  )

  const toInsert = listings
    .filter((l) => l.event != null)
    .map((l) => {
      const ev = l.event!
      const date = ev.startTime ?? ev.date ?? null
      return {
        title: ev.title ?? 'Untitled RA Event',
        date,
        location: ev.venue?.name ?? ev.venue?.address ?? 'Riga',
        description: ev.content ?? null,
        image_url: ev.flyerFront ?? null,
        price: parsePrice(ev.cost),
        latitude: ev.venue?.location?.latitude ?? null,
        longitude: ev.venue?.location?.longitude ?? null,
      }
    })
    .filter((ev) => ev.date && !existingKeys.has(`${ev.title}|${ev.date}`))

  if (toInsert.length === 0) {
    return Response.json({ synced: 0, message: 'All RA events already in database' })
  }

  const { error } = await supabase.from('events').insert(toInsert)
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ synced: toInsert.length })
}

// ----- Types -----

interface RAEvent {
  id?: string
  title?: string
  date?: string
  startTime?: string
  cost?: string | number
  content?: string
  flyerFront?: string
  venue?: {
    name?: string
    address?: string
    location?: { latitude?: number; longitude?: number }
  }
}

interface RAEventListing {
  listingDate?: string
  event?: RAEvent
}
