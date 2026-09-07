import { supabaseAdmin } from './supabaseAdmin'
import type { NormalizedEvent } from './normalizeEvent'

const BATCH_SIZE = 500

function toRow(event: NormalizedEvent) {
  return {
    title: event.title,
    normalized_title: event.normalizedTitle,
    venue_id: event.venueId,
    venue_name: null,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    genre_tags: event.genreTags,
    ticket_url: event.ticketUrl,
    image_url: event.imageUrl,
    description: event.description,
    source: event.source,
    external_id: event.externalId,
    url: event.url,
    raw_payload: event.rawPayload,
    review_status: 'pending',
  }
}

export async function batchUpsertToStaging(events: NormalizedEvent[]): Promise<void> {
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin
      .from('events_staging')
      .upsert(batch.map(toRow), { onConflict: 'source,external_id' })
    if (error) throw new Error(`batchUpsertToStaging failed (batch ${i}): ${error.message}`)
  }
}

/**
 * Upsert a normalized event into events_staging.
 * Uses (source, external_id) as the conflict target.
 * Existing rows are updated in place so re-runs are idempotent.
 */
export async function upsertToStaging(event: NormalizedEvent): Promise<void> {
  const { error } = await supabaseAdmin
    .from('events_staging')
    .upsert(toRow(event), { onConflict: 'source,external_id' })

  if (error) {
    throw new Error(`upsertToStaging failed [${event.source}/${event.externalId}]: ${error.message}`)
  }
}
