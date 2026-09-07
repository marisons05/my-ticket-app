import { fromZonedTime } from 'date-fns-tz'
import { supabaseAdmin } from './supabaseAdmin'

const RIGA_TZ = 'Europe/Riga'

export interface RawEvent {
  title: string
  /** Local Riga time, e.g. "2024-09-14T21:00" or "2024-09-14T21:00:00" */
  localStartsAt: string
  localEndsAt?: string
  venueName: string
  venueAddress?: string
  venueLat?: number
  venueLng?: number
  ticketUrl?: string
  imageUrl?: string
  description?: string
  genreTags?: string[]
  source: string
  externalId: string
  url?: string
  rawPayload?: unknown
}

export interface NormalizedEvent {
  title: string
  normalizedTitle: string
  venueId: string | null
  startsAt: string   // UTC ISO string
  endsAt: string | null
  genreTags: string[]
  ticketUrl: string | null
  imageUrl: string | null
  description: string | null
  source: string
  externalId: string
  url: string | null
  rawPayload: unknown
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Convert a Riga local datetime string to a UTC ISO string. Handles DST. */
function rigaToUtc(local: string): string {
  // Ensure the string has seconds so date-fns-tz parses it unambiguously
  const padded = local.length === 16 ? `${local}:00` : local
  return fromZonedTime(padded, RIGA_TZ).toISOString()
}

/**
 * Resolve or create a venue row by fuzzy normalized-name match.
 * Returns the venue id, or null if venueName is blank.
 */
async function resolveVenue(raw: RawEvent, cache?: Map<string, string | null>): Promise<string | null> {
  if (!raw.venueName?.trim()) return null

  const normalized = normalizeText(raw.venueName)

  if (cache?.has(normalized)) return cache.get(normalized)!

  // 1. Exact match on normalized_name
  const { data: existing } = await supabaseAdmin
    .from('venues')
    .select('id')
    .eq('normalized_name', normalized)
    .maybeSingle()

  if (existing) { cache?.set(normalized, existing.id); return existing.id }

  // 2. Fuzzy: check if any existing normalized_name contains our string or vice versa
  const { data: fuzzy } = await supabaseAdmin
    .from('venues')
    .select('id, normalized_name')
    .or(`normalized_name.ilike.%${normalized}%,normalized_name.ilike.${normalized}%`)
    .limit(1)

  if (fuzzy && fuzzy.length > 0) { cache?.set(normalized, fuzzy[0].id); return fuzzy[0].id }

  // 3. Create new venue
  const { data: created, error } = await supabaseAdmin
    .from('venues')
    .insert({
      name: raw.venueName.trim(),
      normalized_name: normalized,
      address: raw.venueAddress ?? null,
      lat: raw.venueLat ?? null,
      lng: raw.venueLng ?? null,
    })
    .select('id')
    .single()

  if (error) {
    // Race condition: another concurrent insert won the unique constraint — retry lookup
    if (error.code === '23505') {
      const { data: retry } = await supabaseAdmin
        .from('venues')
        .select('id')
        .eq('normalized_name', normalized)
        .maybeSingle()
      const id = retry?.id ?? null
      cache?.set(normalized, id)
      return id
    }
    console.error('resolveVenue insert error:', error.message)
    cache?.set(normalized, null)
    return null
  }

  cache?.set(normalized, created.id)
  return created.id
}

export async function normalizeEvent(raw: RawEvent, venueCache?: Map<string, string | null>): Promise<NormalizedEvent> {
  const venueId = await resolveVenue(raw, venueCache)

  return {
    title: raw.title.trim(),
    normalizedTitle: normalizeText(raw.title),
    venueId,
    startsAt: rigaToUtc(raw.localStartsAt),
    endsAt: raw.localEndsAt ? rigaToUtc(raw.localEndsAt) : null,
    genreTags: raw.genreTags ?? [],
    ticketUrl: raw.ticketUrl ?? null,
    imageUrl: raw.imageUrl ?? null,
    description: raw.description ?? null,
    source: raw.source,
    externalId: raw.externalId,
    url: raw.url ?? null,
    rawPayload: raw.rawPayload ?? null,
  }
}
