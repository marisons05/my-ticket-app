import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import EventImage from '../components/EventImage'


const DOTS = [
  { top: '8%',  left: '3%',  size: 10, delay: 0,   color: '#ff6b9d' },
  { top: '28%', left: '91%', size: 14, delay: 0.8, color: '#00d4ff' },
  { top: '58%', left: '95%', size: 10, delay: 1.4, color: '#ffd700' },
  { top: '75%', left: '5%',  size: 8,  delay: 0.5, color: '#b47dff' },
  { top: '18%', left: '48%', size: 16, delay: 1.1, color: '#ff6b9d' },
]

const ACCENTS = ['#b47dff', '#ff6b9d', '#00d4ff']

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
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  return (
    <>
      <style>{`
@keyframes floatNote {
          0%,100% { transform: translateY(0)    rotate(0deg);  opacity: 0.25; }
          50%      { transform: translateY(-22px) rotate(12deg); opacity: 0.6;  }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,0)       scale(1);   }
          33%      { transform: translate(40px,-30px) scale(1.1); }
          66%      { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0)        scale(1);    }
          33%      { transform: translate(-50px,20px) scale(1.05); }
          66%      { transform: translate(30px,-15px) scale(0.9);  }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.4), 0 4px 24px rgba(124,58,237,0.4); }
          50%      { box-shadow: 0 0 40px rgba(255,107,157,0.7), 0 4px 40px rgba(124,58,237,0.7); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ev-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.25);
        }
        .ev-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .ev-buy:hover { filter: brightness(1.15); transform: translateY(-2px); }
        .ev-buy { transition: all 0.2s ease; }
        .ev-section { animation: fadeUp 0.8s ease 0.1s both; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>

        {/* Background layer */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', left: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '45%', right: '8%',  width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.2) 0%, transparent 70%)', animation: 'orb2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '38%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%)', animation: 'orb1 14s ease-in-out infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          {DOTS.map((d, i) => (
            <div key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: d.size, height: d.size, borderRadius: '50%', background: d.color, boxShadow: `0 0 ${d.size * 2}px ${d.color}`, animation: `floatNote ${3.2 + i * 0.6}s ease-in-out ${d.delay}s infinite` }} />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 20 }}>
          <Navbar />
        </div>

        <div style={{ position: 'relative', zIndex: 10, padding: '40px 40px 80px' }}>

          {/* Hero section */}
          <section className="ev-section" style={{ marginBottom: 72, textAlign: 'center', padding: '60px 0 20px' }}>
            <p style={{ color: '#b47dff', fontSize: 11, letterSpacing: 6, marginBottom: 16, textTransform: 'uppercase', fontWeight: 700 }}>Premier Event Platform</p>
            <h1 style={{ color: 'white', fontSize: 56, fontWeight: 900, letterSpacing: -1, marginBottom: 20, lineHeight: 1.1 }}>
              Feel the<br />
              <span style={{ background: 'linear-gradient(135deg, #b47dff, #ff6b9d, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>energy.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Discover the best live music, club nights, and cultural events — all in one place.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/map" style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '13px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, animation: 'btnGlow 3s ease-in-out infinite', display: 'inline-block' }}>
                Explore the Map
              </Link>
              <Link href="/finder" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', padding: '13px 32px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', display: 'inline-block' }}>
                Find Events
              </Link>
            </div>
          </section>

          {/* Stats bar */}
          <section className="ev-section" style={{ marginBottom: 72 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 680, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { value: `${events?.length ?? 0}`, label: 'Events This Month' },
                { value: 'Riga', label: 'City Centre Focus' },
                { value: '24/7', label: 'Tickets Available' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, padding: '24px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Events grid */}
          <section className="ev-section">
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>What&apos;s on</p>
            <h2 style={{ color: 'white', fontSize: 36, fontWeight: 900, marginBottom: 28, letterSpacing: -0.5 }}>Upcoming Events</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
              {events?.map((event, i) => {
                const accent = ACCENTS[i % ACCENTS.length]
                return (
                  <div key={event.id} className="ev-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Image */}
                    <EventImage src={event.image_url} alt={event.title} seed={event.id} height={180} />
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, margin: '-24px -24px 16px' }} />
                      <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: 1 }}>{event.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 4 }}>📅 {formatEventDate(event.starts_at)}</p>
                      {(event.venues as {name:string}|null)?.name && (
                        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 8 }}>📍 {(event.venues as {name:string}).name}</p>
                      )}
                      {event.genre_tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {(event.genre_tags as string[]).map((tag: string) => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(180,125,255,0.15)', color: '#b47dff', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{tag}</span>
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
                            style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)`, color: 'white', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, animation: 'btnGlow 3s ease-in-out infinite', display: 'inline-block' }}
                          >
                            Get Tickets
                          </a>
                        ) : (
                          <Link
                            href={`/checkout?eventId=${encodeURIComponent(event.id)}`}
                            className="ev-buy"
                            style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)`, color: 'white', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, animation: 'btnGlow 3s ease-in-out infinite', display: 'inline-block' }}
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
