import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import EventImage from '../components/EventImage'

export const dynamic = 'force-dynamic'

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default async function EventsPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*, venues(name)')
    .eq('status', 'published')
    .order('starts_at', { ascending: true })

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ev-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }
        .ev-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .ev-buy:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ev-buy { transition: all 0.2s ease; }
        .ev-section { animation: fadeUp 0.8s ease 0.1s both; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        <div style={{ padding: '40px 40px 80px' }}>

          {/* Hero section */}
          <section className="ev-section" style={{ marginBottom: 72, textAlign: 'center', padding: '60px 0 20px' }}>
            <p style={{ color: '#cc0000', fontSize: 11, letterSpacing: 6, marginBottom: 16, textTransform: 'uppercase', fontWeight: 700 }}>Premier Event Platform</p>
            <h1 style={{ color: 'white', fontSize: 56, fontWeight: 900, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1 }}>
              Feel the<br />
              <span style={{ color: '#cc0000' }}>energy.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Discover the best live music, club nights, and cultural events — all in one place.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/map" style={{ background: 'white', color: 'black', padding: '13px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'inline-block' }}>
                Explore the Map
              </Link>
              <Link href="/finder" style={{ background: 'transparent', color: 'white', padding: '13px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', display: 'inline-block' }}>
                Find Events
              </Link>
            </div>
          </section>

          {/* Stats bar */}
          <section className="ev-section" style={{ marginBottom: 72 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 680, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { value: `${events?.length ?? 0}`, label: 'Events This Month' },
                { value: 'Riga', label: 'City Centre Focus' },
                { value: '24/7', label: 'Tickets Available' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, padding: '24px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div style={{ color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Events grid */}
          <section className="ev-section">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>What&apos;s on</p>
            <h2 style={{ color: 'white', fontSize: 36, fontWeight: 900, marginBottom: 28, letterSpacing: -0.5 }}>Upcoming Events</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
              {events?.map((event) => {
                return (
                  <div key={event.id} className="ev-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Image */}
                    <EventImage src={event.image_url} alt={event.title} seed={event.id} height={180} />
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ height: 2, background: 'linear-gradient(90deg, #cc0000, transparent)', margin: '-24px -24px 16px' }} />
                      <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: 1 }}>{event.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>📅 {formatEventDate(event.starts_at)}</p>
                      {(event.venues as {name:string}|null)?.name && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>📍 {(event.venues as {name:string}).name}</p>
                      )}
                      {event.genre_tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {(event.genre_tags as string[]).map((tag: string) => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(204,0,0,0.15)', color: '#cc0000', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {event.description && (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{(event.description as string).slice(0, 120)}{(event.description as string).length > 120 ? '…' : ''}</p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                        {event.ticket_url ? (
                          <a
                            href={event.ticket_url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ev-buy"
                            style={{ background: 'white', color: 'black', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'inline-block' }}
                          >
                            Get Tickets
                          </a>
                        ) : (
                          <Link
                            href={`/checkout?eventId=${encodeURIComponent(event.id)}`}
                            className="ev-buy"
                            style={{ background: 'white', color: 'black', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'inline-block' }}
                          >
                            Buy Ticket
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
