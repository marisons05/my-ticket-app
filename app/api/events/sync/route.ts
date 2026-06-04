import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
)

// --- Eventbrite ---
async function fetchEventbrite() {
  const TOKEN = process.env['EVENTBRITE_TOKEN'] ?? ''
  if (!TOKEN) {
    console.error('Missing EVENTBRITE_TOKEN')
    return []
  }

  const orgRes = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })

  if (!orgRes.ok) {
    console.error('Eventbrite org lookup error:', orgRes.status, await orgRes.text())
    return []
  }

  const orgData = await orgRes.json()
  const orgId: string | undefined = orgData.organizations?.[0]?.id

  if (!orgId) {
    console.log('No Eventbrite organization found')
    return []
  }

  const res = await fetch(
    `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?status=live&expand=venue,organizer`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  )

  if (!res.ok) {
    console.error('Eventbrite events error:', res.status, await res.text())
    return []
  }

  const data = await res.json()
  const events: any[] = data.events ?? []
  console.log(`Found ${events.length} events from Eventbrite`)

  return events.map((e: any) => ({
    source: 'eventbrite',
    external_id: String(e.id),
    name: e.name?.text ?? 'Untitled Event',
    artist: e.organizer?.name ?? null,
    venue: e.venue?.name ?? null,
    city: e.venue?.address?.city ?? 'Riga',
    lat: parseFloat(e.venue?.latitude ?? '56.9496'),
    lng: parseFloat(e.venue?.longitude ?? '24.1052'),
    country: 'Latvia',
    event_date: e.start?.utc ?? null,
    url: e.url ?? null,
    image_url: e.logo?.url ?? null,
  }))
}

// --- Bandsintown ---
const LATVIAN_ARTISTS = [
  'Brainstorm', 'Prāta Vētra', 'Jumprava', 'Instrumenti',
  'Carnival Youth', 'Singapūras Satīns', 'FACT', 'Dzelzs Vilks',
  'Citi Zēni', 'Sudden Lights', 'Tautumeitas', 'Labvēlīgais Tips',
  'Musiqq', 'Triana Park', 'Aminata', 'Intars Busulis',
  'Lauris Reiniks', 'Markus Riva', 'Samanta Tīna', 'Ralfs Eilands',
  'Dons', 'Fomins un Kleins', 'Tumsa', 'Līvi',
  'Cosmos', 'Pērkons', 'Rīgas Modes', 'Eolika',
  'Satelīts', 'Suns Viņā Pusē', 'Laura Rizzotto', 'Carousel',
  'Tautas Klubs', 'Ansamblis Rudens', 'Mikrofons', 'Olga Rajecka',
  'Sabīne Berezina', 'Linda Leen', 'Renārs Kaupers', 'Māra Upmane-Holšteina',
]

async function fetchBandsintown() {
  const APP_ID = process.env['BANDSINTOWN_APP_ID'] ?? 'latvia_events_app'

  const results = await Promise.all(
    LATVIAN_ARTISTS.map(async (artist) => {
      try {
        const res = await fetch(
          `https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}/events?app_id=${APP_ID}`
        )
        if (!res.ok) {
          console.log(`Bandsintown ${artist}: HTTP ${res.status}`)
          return []
        }
        const events = await res.json()
        if (!Array.isArray(events)) {
          console.log(`Bandsintown ${artist}: unexpected response`, JSON.stringify(events).slice(0, 200))
          return []
        }

        return events
          .filter((e: any) =>
            e.venue?.country === 'Latvia' || e.venue?.country === 'LV'
          )
          .map((e: any) => ({
            source: 'bandsintown',
            external_id: String(e.id),
            name: `${artist} at ${e.venue?.name ?? 'Unknown Venue'}`,
            artist,
            venue: e.venue?.name ?? null,
            city: e.venue?.city ?? 'Riga',
            lat: parseFloat(e.venue?.latitude ?? '56.9496'),
            lng: parseFloat(e.venue?.longitude ?? '24.1052'),
            country: 'Latvia',
            event_date: e.datetime ?? null,
            url: e.url ?? null,
            image_url: e.artist?.image_url ?? null,
          }))
      } catch {
        return []
      }
    })
  )

  const flat = results.flat()
  console.log(`Found ${flat.length} events from Bandsintown`)
  return flat
}

// --- Deduplicate ---
function dedupe(events: any[]) {
  const seen = new Set()
  return events.filter((e) => {
    const key = [
      e.name?.toLowerCase().trim(),
      e.event_date?.slice(0, 10),
      e.venue?.toLowerCase().trim(),
    ].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// --- Route handler ---
export async function GET() {
  try {
    const [eventbriteEvents, bandsintownEvents] = await Promise.all([
      fetchEventbrite(),
      fetchBandsintown(),
    ])

    const allEvents = dedupe([...eventbriteEvents, ...bandsintownEvents])
    console.log(`Total after dedup: ${allEvents.length} events`)

    const { error } = await supabase
      .from('music_events')
      .upsert(allEvents, { onConflict: 'source,external_id', ignoreDuplicates: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      synced: allEvents.length,
      breakdown: {
        eventbrite: eventbriteEvents.length,
        bandsintown: bandsintownEvents.length,
      },
    })
  } catch (err: any) {
    console.error('Sync error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
