import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const EQ_HEIGHTS = [28, 44, 22, 56, 38, 18, 60, 34, 50, 26, 46, 36, 54, 20, 40, 58, 30, 48, 24, 52, 34, 62, 28, 42, 18, 56, 38, 26, 50, 36, 44, 22]
const EQ_DURATIONS = [0.38, 0.52, 0.44, 0.36, 0.58, 0.42, 0.34, 0.56, 0.40, 0.48, 0.36, 0.54, 0.42, 0.60, 0.38, 0.46, 0.52, 0.34, 0.58, 0.40, 0.44, 0.36, 0.56, 0.42, 0.48, 0.38, 0.54, 0.34, 0.60, 0.40, 0.46, 0.52]
const EQ_DELAYS = [0, 0.10, 0.22, 0.08, 0.30, 0.16, 0.04, 0.26, 0.12, 0.34, 0.06, 0.20, 0.28, 0.14, 0.02, 0.24, 0.18, 0.32, 0.10, 0.06, 0.28, 0.16, 0.04, 0.22, 0.34, 0.08, 0.20, 0.30, 0.12, 0.24, 0.02, 0.18]

const GENRES = ['TECHNO', 'HOUSE', 'DRUM & BASS', 'AMBIENT', 'TRANCE', 'HIP-HOP', 'JAZZ FUSION', 'AFROBEAT', 'ELECTRONIC', 'EXPERIMENTAL']

const NOTES = [
  { symbol: '♪', top: '14%', left: '4%', size: 24, delay: 0, color: '#ff6b9d' },
  { symbol: '♫', top: '32%', left: '88%', size: 36, delay: 0.8, color: '#00d4ff' },
  { symbol: '♬', top: '62%', left: '93%', size: 28, delay: 1.4, color: '#ffd700' },
  { symbol: '♩', top: '78%', left: '6%', size: 20, delay: 0.5, color: '#b47dff' },
  { symbol: '𝄞', top: '22%', left: '50%', size: 44, delay: 1.1, color: '#ff6b9d' },
]

const ACCENTS = ['#b47dff', '#ff6b9d', '#00d4ff']

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
  const { data: events } = await supabase
    .from('events')
    .select('id, title, location, date, price')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(3)
  return (
    <>
      <style>{`
        @keyframes eqPulse {
          from { transform: scaleY(0.15); opacity: 0.5; }
          to   { transform: scaleY(1);    opacity: 1;   }
        }
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
        @keyframes glowPulse {
          0%,100% { text-shadow: 0 0 30px rgba(255,107,157,0.7), 0 0 60px rgba(124,58,237,0.5), 0 0 90px rgba(0,212,255,0.3); }
          50%      { text-shadow: 0 0 50px rgba(255,107,157,1),   0 0 100px rgba(124,58,237,0.8), 0 0 140px rgba(0,212,255,0.5); }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.4), 0 4px 24px rgba(124,58,237,0.4); }
          50%      { box-shadow: 0 0 40px rgba(255,107,157,0.7), 0 4px 40px rgba(124,58,237,0.7); }
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

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>

        {/* ── Background layer ── */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', left: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '45%', right: '8%',  width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,157,0.2) 0%, transparent 70%)', animation: 'orb2 22s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: '38%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%)', animation: 'orb1 14s ease-in-out infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          {NOTES.map((n, i) => (
            <div key={i} style={{ position: 'absolute', top: n.top, left: n.left, fontSize: n.size, color: n.color, animation: `floatNote ${3.2 + i * 0.6}s ease-in-out ${n.delay}s infinite`, userSelect: 'none' }}>
              {n.symbol}
            </div>
          ))}
        </div>

        {/* ── Navbar ── */}
        <nav style={{ position: 'relative', zIndex: 20, height: 70, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>THE MIX</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 4 }}>LIVE EVENTS</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" className="cta-ghost" style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'white', padding: '8px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Login
            </Link>
            <Link href="/login" className="cta-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '8px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700, animation: 'btnGlow 3s ease-in-out infinite' }}>
              Get Tickets
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="land-hero" style={{ position: 'relative', zIndex: 10, padding: '80px 40px 40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,107,157,0.35)', borderRadius: 20, padding: '5px 16px', marginBottom: 28, background: 'rgba(255,107,157,0.08)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b9d', display: 'inline-block', boxShadow: '0 0 8px #ff6b9d' }} />
            <span style={{ color: '#ff6b9d', fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>LIVE IN RIGA</span>
          </div>

          <h1 style={{ fontSize: 'clamp(64px, 12vw, 130px)', fontWeight: 900, color: 'white', letterSpacing: -3, lineHeight: 0.88, marginBottom: 10, animation: 'glowPulse 4s ease-in-out infinite' }}>
            THE MIX
          </h1>
          <p style={{ fontSize: 'clamp(12px, 2vw, 18px)', fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: 10, marginBottom: 28, textTransform: 'uppercase' }}>
            Live Events · Riga
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, maxWidth: 480, margin: '0 auto 56px', lineHeight: 1.75 }}>
            Curated underground raves, festivals, and live shows — your city&apos;s pulse in one place.
          </p>
        </section>

        {/* ── Equalizer ── */}
        <div className="land-eq" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5, height: 72, padding: '0 40px', marginBottom: 48 }}>
          {EQ_HEIGHTS.map((h, i) => (
            <div key={i} style={{
              width: 6,
              height: h,
              borderRadius: '3px 3px 0 0',
              background: i % 3 === 0 ? 'linear-gradient(to top, #ff6b9d, #7c3aed)' : i % 3 === 1 ? 'linear-gradient(to top, #7c3aed, #00d4ff)' : 'linear-gradient(to top, #00d4ff, #b47dff)',
              transformOrigin: 'bottom',
              animation: `eqPulse ${EQ_DURATIONS[i]}s ease-in-out ${EQ_DELAYS[i]}s infinite alternate`,
            }} />
          ))}
        </div>

        {/* ── CTAs ── */}
        <div className="land-cta" style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', padding: '0 40px 80px' }}>
          <Link href="/login" className="cta-primary" style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '16px 44px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 800, letterSpacing: 1, animation: 'btnGlow 3s ease-in-out infinite', display: 'inline-block' }}>
            GET TICKETS →
          </Link>
          <Link href="/login" className="cta-ghost" style={{ border: '2px solid rgba(255,255,255,0.18)', color: 'white', padding: '16px 44px', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 600, backdropFilter: 'blur(8px)', display: 'inline-block' }}>
            BROWSE EVENTS
          </Link>
        </div>

        {/* ── Stats ── */}
        <section style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)', padding: '44px 40px', display: 'flex', justifyContent: 'center', gap: 'clamp(32px, 8vw, 90px)', flexWrap: 'wrap' }}>
          {STATS.map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </section>

        {/* ── Genres ── */}
        <section style={{ position: 'relative', zIndex: 10, padding: '64px 40px 48px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 24, textTransform: 'uppercase' }}>What&apos;s on</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {GENRES.map((g, i) => {
              const colors = ['rgba(255,107,157,0.8)', 'rgba(0,212,255,0.8)', 'rgba(180,125,255,0.8)']
              const borders = ['rgba(255,107,157,0.35)', 'rgba(0,212,255,0.35)', 'rgba(180,125,255,0.35)']
              return (
                <span key={g} className="genre-pill" style={{ padding: '7px 18px', borderRadius: 100, border: '1px solid', borderColor: borders[i % 3], color: colors[i % 3], fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.7 }}>
                  {g}
                </span>
              )
            })}
          </div>
        </section>

        {/* ── Teaser cards ── */}
        <section style={{ position: 'relative', zIndex: 10, padding: '0 40px 80px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 4, marginBottom: 28, textAlign: 'center', textTransform: 'uppercase' }}>Upcoming highlights</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            {(events ?? []).map((event, i) => {
              const accent = ACCENTS[i % ACCENTS.length]
              return (
                <div key={event.id} className="land-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 28, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                  <h4 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: 1 }}>{event.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 4 }}>📅 {formatEventDate(event.date)}</p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 22 }}>📍 {event.location}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>€{event.price}</span>
                    <Link href="/login" style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)`, color: 'white', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      Get In
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '80px 40px 100px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(to bottom, transparent, rgba(6,0,14,0.9))' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎶</div>
          <h2 style={{ color: 'white', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: 14, lineHeight: 1.1 }}>
            Ready to feel it live?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontSize: 17, maxWidth: 400, margin: '0 auto 36px' }}>
            Create a free account and never miss a show in Riga.
          </p>
          <Link href="/login" className="cta-primary" style={{ background: 'linear-gradient(135deg, #ff6b9d, #7c3aed)', color: 'white', padding: '18px 54px', borderRadius: 14, textDecoration: 'none', fontSize: 18, fontWeight: 800, letterSpacing: 1, display: 'inline-block', animation: 'btnGlow 3s ease-in-out infinite' }}>
            JOIN THE MIX
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 20, letterSpacing: 1 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'rgba(255,107,157,0.6)', textDecoration: 'none', fontWeight: 600 }}>Log in →</Link>
          </p>
        </section>

      </main>
    </>
  )
}
