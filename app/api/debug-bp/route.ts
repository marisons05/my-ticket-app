// Temporary debug endpoint — shows raw BP API response so we can calibrate the importer.
// DELETE this file once the importer is working correctly.
import { NextRequest } from 'next/server'

const API_URL = 'https://www.bilesuparadize.lv/api/search/events'
const BASE_URL = 'https://www.bilesuparadize.lv'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try several request body formats to see which one returns events
  const attempts = [
    { page: 1, limit: 10 },
    { keywords: '', page: 1 },
    {},
    { keywords: 'muzika' },
  ]

  const results: Record<string, unknown> = {}

  for (const body of attempts) {
    const key = JSON.stringify(body)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'locale': 'lv',
          'Origin': BASE_URL,
          'Referer': `${BASE_URL}/lv/pasakumi`,
          'x-requested-with': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      })

      const raw = await res.json()
      const isArray = Array.isArray(raw)
      results[key] = {
        status: res.status,
        isArray,
        length: isArray ? raw.length : null,
        topLevelKeys: isArray ? null : Object.keys(raw),
        firstItemKeys: isArray && raw.length > 0 ? Object.keys(raw[0]).slice(0, 10) : null,
        sample: isArray ? raw.slice(0, 1) : raw,
      }
    } catch (err) {
      results[key] = { error: String(err) }
    }
  }

  return Response.json(results)
}
