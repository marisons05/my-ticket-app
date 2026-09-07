/**
 * Best-effort "type of event" classifier.
 *
 * Feeds the `genre_tags` column, which already powers the genre filter on
 * /events (see app/events/page.tsx). Sources that don't hand us a clean
 * category (Biļešu Paradīze's `category_ids` are ~140 undocumented,
 * overlapping IDs mixing genre/festival/season tags with no public label
 * endpoint) get classified from the event title instead.
 *
 * Keep this list broad and human-auditable rather than chasing every
 * sub-genre — it only needs to answer "what kind of event is this".
 */

interface TypeRule {
  tag: string
  patterns: RegExp[]
}

// Order matters only in that more specific tags (opera, ballet, jazz...)
// are checked before the generic 'concert' catch-all.
const RULES: TypeRule[] = [
  { tag: 'opera', patterns: [/\bopera[s]?\b/i, /\boperete[si]?\b/i, /\boperett/i] },
  { tag: 'ballet', patterns: [/\bbalet[sa]?\b/i, /\bballet\b/i] },
  { tag: 'classical', patterns: [
    /\bfilharmonij/i, /\bsimfonisk/i, /\bkamerm[uū]zik/i, /\bkamerorķestr/i,
    /\bkoris\b/i, /\bkoru\b/i, /\bkorī\b/i, /\bērģe/i, /\bklasisk/i, /\borķestr/i,
    /\bbaroka\b/i, /\bkamerkoncert/i,
  ] },
  { tag: 'jazz', patterns: [/\bdže?za\b/i, /\bdže?zs\b/i, /\bjazz\b/i] },
  { tag: 'electronic', patterns: [
    /\belektron/i, /\btehno\b/i, /\btechno\b/i, /\bhouse\b/i, /\brave\b/i,
    /\bdj\b/i, /\btrance\b/i, /\bdrum ?('|a)?n ?bass\b/i,
  ] },
  { tag: 'film', patterns: [/\bkino\b/i, /\bfilma[s]?\b/i, /\bfilmas seans/i, /\bkinoseans/i] },
  { tag: 'circus', patterns: [/\bcirk[sa]\b/i, /\bcirka\b/i] },
  { tag: 'comedy', patterns: [/\bkom[eē]dij/i, /\bstendaps?\b/i, /\bstand[- ]?up\b/i] },
  { tag: 'dance', patterns: [/\bdeja[s]?\b/i, /\bdeju\b/i, /\bflamenko\b/i, /\bdejo\/?šov/i] },
  { tag: 'theatre', patterns: [/\bteātr/i, /\bizrāde[s]?\b/i, /\blug[au]\b/i, /\bmonoizrāde\b/i, /\btheatre\b/i, /\btheater\b/i] },
  { tag: 'children', patterns: [
    /\bbērniem\b/i, /\bbērnu\b/i, /\bģimenēm\b/i, /\bpasak[au]\b/i, /\bmazajiem\b/i,
  ] },
  { tag: 'exhibition', patterns: [/\bizstād/i] },
  { tag: 'sports', patterns: [/\bsupercross\b/i, /\bfutbol/i, /\bmotokross/i, /\bsports?\b/i] },
  { tag: 'workshop', patterns: [/\bmeistarklas/i, /\bdarbnīc/i, /\bworkshop\b/i] },
  { tag: 'gastronomy', patterns: [/\bdegustācij/i, /\bvīn[au]\b/i, /\bgastro/i] },
  { tag: 'concert', patterns: [/\bkoncert/i, /\bkoncertprogramma\b/i, /\bkoncertuzvedum/i] },
]

/**
 * Classify free-text (usually the event title) into zero or more type tags.
 * Returns tags in RULES priority order, deduplicated.
 */
export function inferEventType(...texts: (string | undefined | null)[]): string[] {
  const text = texts.filter(Boolean).join(' ')
  if (!text) return []

  const tags: string[] = []
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(text))) tags.push(rule.tag)
  }
  return tags
}

/**
 * Biļešu Paradīze's `category_ids` (POST /api/search/events) — reverse
 * engineered by sampling ~15k live events and reading the title patterns
 * within each id bucket (no public endpoint documents these). BP has ~140
 * ids total; many are festival/season/venue tags with no clean "type"
 * (e.g. Christmas concerts, subscription series) and are deliberately left
 * unmapped — those events fall back to inferEventType() on the title.
 *
 * Re-derive/update by re-running the sampling script if BP's taxonomy
 * changes: POST category_ids come back on every /api/search/events row.
 */
const BP_CATEGORY_TYPE: Record<number, string> = {
  1: 'opera', 2: 'opera', 3: 'ballet', 4: 'opera',
  5: 'theatre', 6: 'comedy', 7: 'comedy', 8: 'theatre', 9: 'theatre',
  10: 'children', 11: 'comedy',
  12: 'concert', 13: 'concert', 14: 'classical', 15: 'concert',
  16: 'jazz', 17: 'concert', 18: 'concert',
  19: 'dance', 20: 'dance', 21: 'dance', 22: 'dance',
  23: 'children', 24: 'sports',
  25: 'concert', 26: 'concert', 27: 'film',
  28: 'theatre', 29: 'theatre', 30: 'theatre', 31: 'theatre', 32: 'children',
  33: 'classical', 34: 'comedy',
  46: 'theatre', 47: 'theatre', 49: 'theatre', 50: 'classical',
  54: 'classical', 55: 'jazz', 56: 'classical', 63: 'circus',
  68: 'concert', 69: 'concert', 70: 'children', 71: 'concert', 72: 'concert',
  73: 'concert', 74: 'concert', 75: 'concert',
  79: 'classical', 82: 'children', 83: 'classical', 86: 'children', 87: 'children',
  89: 'jazz', 93: 'theatre', 94: 'children', 95: 'children',
  99: 'theatre', 110: 'classical', 114: 'theatre', 115: 'children', 117: 'children',
  118: 'classical', 119: 'dance', 121: 'classical', 130: 'exhibition',
  134: 'opera', 136: 'sports', 137: 'workshop', 138: 'gastronomy',
  139: 'classical', 140: 'classical',
}

/**
 * Classify a Biļešu Paradīze event: category ids first (they correctly
 * bucket bare-title theatre plays etc. that keyword matching would miss),
 * then fall back to title keywords for ids that aren't mapped above.
 */
export function classifyBpEvent(categoryIds: number[] | undefined, title: string): string[] {
  const fromCategories = (categoryIds ?? [])
    .map(id => BP_CATEGORY_TYPE[id])
    .filter((t): t is string => Boolean(t))

  const tags = new Set(fromCategories)
  if (tags.size === 0) {
    for (const t of inferEventType(title)) tags.add(t)
  }
  return Array.from(tags)
}
