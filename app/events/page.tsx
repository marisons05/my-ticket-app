import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import EventSearch from '../components/EventSearch'
import GenreFilter from '../components/GenreFilter'
import DateFilter from '../components/DateFilter'
import EventGrid from '../components/EventGrid'

export const dynamic = 'force-dynamic'

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string | string[]; dateFrom?: string; dateTo?: string }> }) {
  const { q, genre, dateFrom, dateTo } = await searchParams
  const selectedGenres = genre ? (Array.isArray(genre) ? genre : [genre]) : []

  let query = supabase
    .from('events')
    .select('*, venues(name, address, lat, lng)')
    .eq('status', 'published')
    .order('starts_at', { ascending: true })

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (dateFrom) {
    query = query.gte('starts_at', new Date(dateFrom).toISOString())
  } else {
    // Default: never show events that have already happened.
    query = query.gte('starts_at', new Date().toISOString())
  }
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    query = query.lte('starts_at', end.toISOString())
  }

  const { data: events } = await query

  // Collect all unique genres from every event for the filter UI
  const allGenres = Array.from(
    new Set((events ?? []).flatMap(e => (e.genre_tags as string[]) ?? []))
  ).sort()

  // Apply genre filter client-side after fetch (genre_tags is an array column)
  const filtered = selectedGenres.length > 0
    ? (events ?? []).filter(e =>
        selectedGenres.some(g => (e.genre_tags as string[])?.includes(g))
      )
    : (events ?? [])

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ev-section { animation: fadeUp 0.8s ease 0.1s both; }
        input[type="search"]::-webkit-search-cancel-button { filter: invert(1); }
        input[type="search"]::placeholder { color: rgba(255,255,255,0.3); }
        input[type="search"]:focus { border-color: rgba(255,255,255,0.4) !important; }
        .ev-page-pad { padding: 24px 16px 80px; }
        @media (min-width: 600px) { .ev-page-pad { padding: 40px 32px 80px; } }
        .ev-header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-direction: column; gap: 16px; }
        @media (min-width: 768px) { .ev-header-row { flex-direction: row; align-items: center; } }
        .ev-filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        <div className="ev-page-pad">

          {/* Events grid */}
          <section className="ev-section">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>What&apos;s on</p>
            <div className="ev-header-row">
              <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>Upcoming Events</h2>
              <div className="ev-filters">
                <Suspense>
                  <EventSearch />
                </Suspense>
                <Suspense>
                  <DateFilter />
                </Suspense>
                <Suspense>
                  <GenreFilter genres={allGenres} />
                </Suspense>
              </div>
            </div>

            {filtered.length > 0 ? (
              <EventGrid events={filtered as any} />
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, marginTop: 40 }}>
                {q || selectedGenres.length > 0 || dateFrom || dateTo ? 'No events match your filters.' : 'No upcoming events.'}
              </p>
            )}
          </section>

        </div>
      </main>
    </>
  )
}
