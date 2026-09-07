const USER_AGENT = 'TheMixBot/1.0 (music event discovery; contact marisons6767@gmail.com)'
const cache = new Map<string, { allowed: boolean; fetchedAt: number }>()
const TTL_MS = 60 * 60 * 1000 // 1 hour

/** Returns the User-Agent string all importers should use. */
export function scraperUserAgent(): string {
  return USER_AGENT
}

/**
 * Returns true if USER_AGENT is permitted to fetch `targetUrl` according to
 * the site's robots.txt. Defaults to true on fetch errors (permissive fail).
 */
export async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  const origin = new URL(targetUrl).origin
  const cached = cache.get(origin)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.allowed

  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      // No robots.txt → permitted
      cache.set(origin, { allowed: true, fetchedAt: Date.now() })
      return true
    }

    const text = await res.text()
    const allowed = parseRobotsTxt(text, USER_AGENT, targetUrl)
    cache.set(origin, { allowed, fetchedAt: Date.now() })
    return allowed
  } catch {
    // Network error → assume permitted, log for visibility
    console.warn(`robots.txt fetch failed for ${origin}, assuming allowed`)
    cache.set(origin, { allowed: true, fetchedAt: Date.now() })
    return true
  }
}

/** Minimal robots.txt parser covering Disallow/Allow for a given agent. */
function parseRobotsTxt(txt: string, agent: string, targetUrl: string): boolean {
  const path = new URL(targetUrl).pathname
  const agentLower = agent.toLowerCase()
  const lines = txt.split(/\r?\n/)

  let inRelevantBlock = false
  let longestMatchLength = -1
  let allowed = true  // default: permitted

  for (const raw of lines) {
    const line = raw.replace(/#.*/, '').trim()
    if (!line) continue

    const [field, ...rest] = line.split(':')
    const key = field.trim().toLowerCase()
    const value = rest.join(':').trim()

    if (key === 'user-agent') {
      inRelevantBlock = value === '*' || agentLower.includes(value.toLowerCase())
      continue
    }

    if (!inRelevantBlock) continue

    if (key === 'disallow' || key === 'allow') {
      if (!value || !path.startsWith(value)) continue
      if (value.length > longestMatchLength) {
        longestMatchLength = value.length
        allowed = key === 'allow'
      }
    }
  }

  return allowed
}

/**
 * Enforce a minimum delay between requests to the same host.
 * Call this between consecutive fetches to the same site.
 */
export function rateLimitDelay(ms = 2000): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
