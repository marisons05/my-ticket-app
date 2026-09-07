/**
 * Importer: Manual CSV / organizer form upload
 *
 * Expected CSV columns (header row required, order doesn't matter):
 *   title, starts_at, ends_at, venue_name, venue_address, genre_tags,
 *   ticket_url, image_url, description
 *
 * - starts_at / ends_at: Riga local time, "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm"
 * - genre_tags: pipe-separated, e.g. "jazz|live|concert"
 * - ends_at, venue_address, image_url, description: optional
 *
 * Usage:
 *   const result = await runCsvImport(csvString)
 */

import { normalizeEvent, type RawEvent } from './shared/normalizeEvent'
import { upsertToStaging } from './shared/upsertToStaging'

const SOURCE = 'manual_csv'

export async function runCsvImport(
  csv: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const rows = parseCsv(csv)
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const lineNum = i + 2  // +1 for header, +1 for 1-based
    try {
      const raw = rowToRawEvent(row, lineNum)
      const normalized = await normalizeEvent(raw)
      await upsertToStaging(normalized)
      imported++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Line ${lineNum}: ${msg}`)
      skipped++
    }
  }

  return { imported, skipped, errors }
}

function rowToRawEvent(row: Record<string, string>, lineNum: number): RawEvent {
  const title = row['title']?.trim()
  if (!title) throw new Error(`missing "title"`)

  const localStartsAt = normalizeDateTime(row['starts_at'])
  if (!localStartsAt) throw new Error(`missing or unparseable "starts_at"`)

  const localEndsAt = normalizeDateTime(row['ends_at']) ?? undefined
  const venueName = row['venue_name']?.trim() || 'Rīga'
  const genreTags = row['genre_tags']
    ? row['genre_tags'].split('|').map(t => t.trim()).filter(Boolean)
    : []

  // Use title + date as the external_id so re-uploads of the same event dedup correctly
  const externalId = `${title.toLowerCase().replace(/\s+/g, '-')}_${localStartsAt.slice(0, 10)}_line${lineNum}`

  return {
    title,
    localStartsAt,
    localEndsAt,
    venueName,
    venueAddress: row['venue_address']?.trim() || undefined,
    genreTags,
    ticketUrl: row['ticket_url']?.trim() || undefined,
    imageUrl: row['image_url']?.trim() || undefined,
    description: row['description']?.trim() || undefined,
    source: SOURCE,
    externalId,
    rawPayload: row,
  }
}

/** Normalize "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm" → "YYYY-MM-DDTHH:mm" */
function normalizeDateTime(s?: string): string | null {
  if (!s?.trim()) return null
  const normalized = s.trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) return normalized.slice(0, 16)
  return null
}

/** Minimal RFC 4180-compatible CSV parser (handles quoted fields with commas). */
function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  const headers = splitLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = splitLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() ?? '' })
    rows.push(row)
  }

  return rows
}

function splitLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      result.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}
