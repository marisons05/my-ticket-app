import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import RainCanvas from '@/app/components/RainCanvas'
import Navbar from '@/app/components/Navbar'


const GENRES = ['TECHNO', 'HOUSE', 'DRUM & BASS', 'AMBIENT', 'TRANCE', 'HIP-HOP', 'JAZZ FUSION', 'AFROBEAT', 'ELECTRONIC', 'EXPERIMENTAL']

const ACCENTS = ['#cc0000', 'rgba(255,255,255,0.7)', '#cc0000']

const STATS = [
  { n: '50+', label: 'EVENTS THIS MONTH' },
  { n: '12K+', label: 'TICKETS SOLD' },
  { n: '200+', label: 'ARTISTS FEATURED' },
  { n: '5★', label: 'AVERAGE RATING' },
]

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default async function LandingPage() {
  const { data: rawEvents } = await supabase
    .from('events')
    .select('id, title, starts_at, genre_tags, ticket_url, image_url, venues(name)')
    .gte('starts_at', new Date().toISOString())
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(3)

  const PLACEHOLDER_EVENTS = [
    { id: 'p1', title: 'Techno Night', starts_at: '2026-08-08T22:00:00Z', genre_tags: ['TECHNO'], ticket_url: null, image_url: null, venues: { name: 'Melnsils Club' } },
    { id: 'p2', title: 'Ambient Sessions', starts_at: '2026-08-09T20:00:00Z', genre_tags: ['AMBIENT'], ticket_url: null, image_url: null, venues: { name: 'Kaņepes Kultūras Centrs' } },
    { id: 'p3', title: 'Sunday Selectors', starts_at: '2026-08-10T18:00:00Z', genre_tags: ['HOUSE'], ticket_url: null, image_url: null, venues: { name: 'Boathouse' } },
  ]

  const events = (rawEvents && rawEvents.length > 0 ? rawEvents : PLACEHOLDER_EVENTS)
  return (
    <>
      <style>{`
        @keyframes glowPulse {
          0%,100% { text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 40px rgba(180,30,30,0.25), 0 0 80px rgba(180,30,30,0.1); }
          50%      { text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 60px rgba(200,40,40,0.35), 0 0 120px rgba(180,30,30,0.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .land-hero    { animation: fadeUp 0.9s ease 0.1s both; }
        .land-eq      { animation: fadeUp 0.9s ease 0.4s both; }
        .land-cta     { animation: fadeUp 0.9s ease 0.6s both; }
        .land-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.25);
        }
        .land-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .cta-primary:hover { filter: brightness(1.15); transform: translateY(-2px); }
        .cta-ghost:hover   { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
        .cta-primary, .cta-ghost { transition: all 0.2s ease; }
        .genre-pill:hover { opacity: 1 !important; }
        .genre-pill { transition: opacity 0.2s ease; }
      `}</style>

      <RainCanvas />

      <div style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-space-mono, monospace)' }}>
        <Navbar />

      <main style={{
        minHeight: '100vh',
        background: 'transparent',
      }}>

        {/* ── Hero ── */}
        <section className="land-hero" style={{ position: 'relative', zIndex: 10, padding: '80px 40px 40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(180,0,0,0.5)', borderRadius: 20, padding: '5px 16px', marginBottom: 28, background: 'rgba(140,0,0,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#cc0000', display: 'inline-block', boxShadow: '0 0 6px #cc0000' }} />
            <span style={{ color: '#ff2222', fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>LIVE IN RIGA</span>
          </div>

          <h1 style={{ fontSize: 'clamp(64px, 12vw, 130px)', fontWeight: 900, color: 'white', letterSpacing: -3, lineHeight: 0.88, marginBottom: 10, textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 60px rgba(160,20,20,0.3), 0 0 120px rgba(160,20,20,0.12)', fontFamily: 'var(--font-space-mono, monospace)' }}>
            THE MIX
          </h1>
          <p style={{ fontSize: 'clamp(12px, 2vw, 18px)', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 10, marginBottom: 28, textTransform: 'uppercase' }}>
            Live Events
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, maxWidth: 480, margin: '0 auto 56px', lineHeight: 1.75 }}>
            Curated underground raves, festivals, and live shows — your city&apos;s pulse in one place.
          </p>
        </section>


        {/* ── CTAs ── */}
        <div className="land-cta" style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', padding: '0 40px 80px' }}>
          <Link href="/login" className="cta-primary" style={{ background: 'white', color: 'black', padding: '16px 44px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 800, letterSpacing: 1, display: 'inline-block' }}>
            GET TICKETS →
          </Link>
          <Link href="/login" className="cta-ghost" style={{ border: '2px solid rgba(255,255,255,0.5)', color: 'white', padding: '16px 44px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 600, display: 'inline-block' }}>
            BROWSE EVENTS
          </Link>
        </div>


        {/* ── Black section ── */}
        <div style={{ position: 'relative', zIndex: 10, background: '#000' }}>

        {/* ── Genres ── */}
        <section style={{ padding: '64px 40px 48px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 24, textTransform: 'uppercase' }}>What&apos;s on</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {GENRES.map((g, i) => (
              <span key={g} className="genre-pill" style={{ padding: '7px 18px', borderRadius: 100, border: '1px solid', borderColor: i % 2 === 0 ? 'rgba(200,0,0,0.6)' : 'rgba(255,255,255,0.3)', color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.85 }}>
                {g}
              </span>
            ))}
          </div>
        </section>

        {/* ── Teaser cards ── */}
        <section style={{ padding: '0 40px 80px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 28, textAlign: 'center', textTransform: 'uppercase' }}>Upcoming highlights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            {events.map((event, i) => {
              const accent = ACCENTS[i % ACCENTS.length]
              const venue = (event.venues as { name: string } | null)?.name ?? 'Riga'
              const genre = event.genre_tags?.[0] ?? ''
              return (
                <div key={event.id} className="land-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* image */}
                  {event.image_url && (
                    <div style={{ width: '100%', height: 420, position: 'relative', overflow: 'hidden' }}>
                      <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {genre && <span style={{ position: 'absolute', top: 12, left: 12, color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: 2, background: accent, padding: '3px 10px', borderRadius: 4 }}>{genre.toUpperCase()}</span>}
                    </div>
                  )}
                  {!event.image_url && genre && (
                    <div style={{ padding: '12px 24px 0' }}>
                      <span style={{ color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: 2, background: accent, padding: '3px 10px', borderRadius: 4 }}>{genre.toUpperCase()}</span>
                    </div>
                  )}
                  {/* content */}
                  <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', textAlign: 'center', fontFamily: 'var(--font-space-mono, monospace)' }}>
                    <h4 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, fontFamily: 'var(--font-space-mono, monospace)' }}>{event.title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 2, fontFamily: 'var(--font-space-mono, monospace)' }}>{formatEventDate(event.starts_at)}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 20, fontFamily: 'var(--font-space-mono, monospace)' }}>{venue}</p>
                    <Link href={event.ticket_url ?? '/login'} style={{ marginTop: 'auto', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: 2, textDecoration: 'none', borderBottom: `1px solid ${accent}`, paddingBottom: 2, fontFamily: 'var(--font-space-mono, monospace)' }}>
                      GET TICKETS →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── How it works ── */}
        <section style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 48, textAlign: 'center', textTransform: 'uppercase' }}>How it works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, maxWidth: 900, margin: '0 auto' }}>
            {[
              { n: '01', title: 'Discover', body: 'Browse curated events happening in Riga — techno nights, live acts, underground raves.' },
              { n: '02', title: 'Book', body: 'Grab your ticket in seconds. No account needed to browse, just to buy.' },
              { n: '03', title: 'Show up', body: 'Your ticket lives in your account. Scan at the door, nothing to print.' },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ padding: '40px 32px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, color: '#cc0000', letterSpacing: 3, fontWeight: 700, marginBottom: 16 }}>{n}</div>
                <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: 1 }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── This week ── */}
        <section style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 900, letterSpacing: -1, textAlign: 'center', marginBottom: 48, lineHeight: 1 }}>
            This week in <span style={{ color: '#cc0000' }}>Riga.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, maxWidth: 900, width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { day: 'FRI', date: '08 AUG', name: 'Techno Night', venue: 'Melnsils Club', tag: 'TECHNO' },
              { day: 'SAT', date: '09 AUG', name: 'Ambient Sessions', venue: 'Kaņepes Kultūras Centrs', tag: 'AMBIENT' },
              { day: 'SUN', date: '10 AUG', name: 'Sunday Selectors', venue: 'Boathouse', tag: 'HOUSE' },
              { day: 'TUE', date: '12 AUG', name: 'Drum & Bass Night', venue: 'Depo', tag: 'D&B' },
            ].map(({ day, date, name, venue, tag }) => (
              <div key={name} style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', minWidth: 40 }}>
                    <div style={{ color: '#cc0000', fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>{day}</div>
                    <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{date.split(' ')[0]}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 1 }}>{date.split(' ')[1]}</div>
                  </div>
                  <div>
                    <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{venue}</div>
                  </div>
                </div>
                <span style={{ color: '#cc0000', fontSize: 9, fontWeight: 700, letterSpacing: 2, border: '1px solid rgba(200,0,0,0.4)', padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap' }}>{tag}</span>
              </div>
            ))}
          </div>
          <Link href="/events" style={{ marginTop: 32, color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
            View all events →
          </Link>
        </section>


        {/* ── Bottom CTA ── */}
        <section style={{ textAlign: 'center', padding: '80px 40px 100px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: 14, lineHeight: 1.1 }}>
            Ready to feel it live?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontSize: 17, maxWidth: 400, margin: '0 auto 36px' }}>
            Create a free account and never miss a show in Riga.
          </p>
          <Link href="/login" className="cta-primary" style={{ background: 'white', color: 'black', padding: '18px 54px', borderRadius: 14, textDecoration: 'none', fontSize: 18, fontWeight: 800, letterSpacing: 1, display: 'inline-block' }}>
            JOIN THE MIX
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20, letterSpacing: 1 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'rgba(255,107,157,0.6)', textDecoration: 'none', fontWeight: 600 }}>Log in →</Link>
          </p>
        </section>

</div>{/* end black section */}

      </main>
      </div>{/* end zIndex wrapper */}
    </>
  )
}
