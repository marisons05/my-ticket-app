'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'
import RainCanvas from '../components/RainCanvas'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export const FINDER_LIKED_KEY = 'finder_liked_events'

function HideFooter() {
  useLayoutEffect(() => {
    const el = document.getElementById('site-footer')
    if (el) el.style.display = 'none'
    return () => {
      if (el) el.style.display = ''
    }
  }, [])
  return null
}


type Event = {
  id: string
  title: string
  starts_at: string
  venues: { name: string } | null
  description?: string
  image_url?: string
  ticket_url?: string
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default function FinderPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [likedEvents, setLikedEvents] = useState<Event[]>([])
  const [loaded, setLoaded] = useState(false)
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentDragX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(FINDER_LIKED_KEY)
    if (stored) setLiked(JSON.parse(stored))

    supabase.from('events').select('*, venues(name)').gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).then(({ data }) => {
      if (data) {
        setEvents(data)
        const stored = localStorage.getItem(FINDER_LIKED_KEY)
        const ids: string[] = stored ? JSON.parse(stored) : []
        setLikedEvents(data.filter((e: Event) => ids.includes(e.id)))
      }
      setLoaded(true)
    })
  }, [])

  function saveLiked(ids: string[], allEvents: Event[]) {
    localStorage.setItem(FINDER_LIKED_KEY, JSON.stringify(ids))
    setLiked(ids)
    setLikedEvents(allEvents.filter(e => ids.includes(e.id)))
  }

  function swipe(direction: 'left' | 'right', currentIndex: number, currentLiked: string[]) {
    if (exiting) return

    if (direction === 'right') {
      const event = events[currentIndex]
      if (event && !currentLiked.includes(event.id)) {
        saveLiked([...currentLiked, event.id], events)
      }
    }

    setExiting(direction)
    setDragX(0)
    setDragY(0)

    setTimeout(() => {
      setIndex(currentIndex + 1)
      setExiting(null)
    }, 320)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (exiting) return
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    currentDragX.current = 0
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    currentDragX.current = dx
    setDragX(dx)
    setDragY(dy)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = currentDragX.current

    if (dx > 100) {
      swipe('right', index, liked)
    } else if (dx < -100) {
      swipe('left', index, liked)
    } else {
      setDragX(0)
      setDragY(0)
    }
  }

  const current = events[index]
  const next = events[index + 1]
  const done = events.length > 0 && index >= events.length

  const likeOpacity = Math.min(Math.max(dragX / 110, 0), 1)
  const skipOpacity = Math.min(Math.max(-dragX / 110, 0), 1)

  let cardTransform: string
  let cardTransition: string

  if (exiting === 'right') {
    cardTransform = 'translate(150vw, -60px) rotate(30deg)'
    cardTransition = 'transform 0.32s ease-in'
  } else if (exiting === 'left') {
    cardTransform = 'translate(-150vw, -60px) rotate(-30deg)'
    cardTransition = 'transform 0.32s ease-in'
  } else if (isDragging.current) {
    cardTransform = `translate(${dragX}px, ${dragY * 0.4}px) rotate(${dragX / 22}deg)`
    cardTransition = 'none'
  } else {
    cardTransform = 'translate(0,0) rotate(0deg)'
    cardTransition = 'transform 0.35s cubic-bezier(.175,.885,.32,1.275)'
  }

  return (
    <>
      <HideFooter />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .finder-btn:hover { transform: scale(1.12) !important; }
        .finder-btn { transition: transform 0.15s ease; }
      `}</style>

      <RainCanvas />

      <main style={{
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        <Navbar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 56px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, animation: 'fadeUp 0.5s ease both', position: 'relative', width: '100%', maxWidth: 400 }}>
            <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>Event Finder</h1>
            <button
              onClick={() => setLibraryOpen(true)}
              style={{ position: 'absolute', right: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 18px', color: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-space-mono, monospace)', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <span style={{ color: '#ff1a1a', fontSize: 18 }}>♥</span>
              {liked.length > 0 ? <span style={{ color: 'white' }}>{liked.length}</span> : <span style={{ color: 'white' }}>Library</span>}
            </button>
          </div>

          {/* Card area */}
          {done ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>All caught up!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
                You&apos;ve seen all available events.
              </p>
              {liked.length > 0 && (
                <Link href="/account" style={{ background: 'white', color: 'black', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 700, display: 'inline-block' }}>
                  View {liked.length} Liked Event{liked.length !== 1 ? 's' : ''} →
                </Link>
              )}
            </div>
          ) : !loaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 20px', animation: 'fadeUp 0.5s ease both' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '100%', maxWidth: 400, height: i === 0 ? 100 : 60, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 1 - i * 0.25 }} />
              ))}
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 8 }}>Loading events…</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎵</div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>No upcoming events</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 280, margin: '0 auto 24px' }}>
                Check back soon — new events drop regularly.
              </p>
              <Link href="/events" style={{ background: 'white', color: 'black', padding: '11px 26px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'inline-block' }}>
                Browse All Events
              </Link>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              {/* Red ambient glow */}
              <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,26,26,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

              {/* Card behind (next event) */}
              {next && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(255,26,26,0.08)',
                  transform: 'scale(0.93) translateY(18px)',
                  transformOrigin: 'bottom center',
                  overflow: 'hidden',
                }}>
                  {next.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={next.image_url} alt="" style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block', opacity: 0.5 }} />
                  )}
                </div>
              )}

              {/* Active card */}
              {current && (
                <div
                  ref={cardRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{
                    position: 'relative',
                    borderRadius: 24,
                    background: 'rgba(10,10,10,0.98)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 24px 72px rgba(0,0,0,0.65), 0 0 80px rgba(255,26,26,0.12)',
                    overflow: 'hidden',
                    cursor: isDragging.current ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transform: cardTransform,
                    transition: cardTransition,
                    display: 'flex',
                    flexDirection: 'column',
                    touchAction: 'none',
                  }}
                >
                  {/* Like overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, rgba(0,220,100,0.3), rgba(0,180,80,0.08))',
                    border: '3px solid rgba(0,210,90,0.8)',
                    borderRadius: 24,
                    opacity: likeOpacity,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 72, filter: 'drop-shadow(0 0 24px rgba(0,220,100,0.9))', color: '#00dc64' }}>♥</span>
                  </div>

                  {/* Skip overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
                    background: 'linear-gradient(135deg, rgba(255,26,26,0.3), rgba(220,0,0,0.08))',
                    border: '3px solid rgba(255,26,26,0.8)',
                    borderRadius: 24,
                    opacity: skipOpacity,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 72, filter: 'drop-shadow(0 0 24px rgba(255,26,26,0.9))', color: '#ff1a1a' }}>✕</span>
                  </div>

                  {/* Event image */}
                  {current.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current.image_url} alt={current.title} draggable={false} style={{ width: '100%', height: 560, objectFit: 'cover', display: 'block', flexShrink: 0 }} />
                  )}

                  {/* Fade image into card */}
                  <div style={{ height: 56, marginTop: -56, background: 'linear-gradient(to bottom, transparent, rgba(10,10,10,0.98))', flexShrink: 0, pointerEvents: 'none' }} />

                  {/* Info */}
                  <div style={{ padding: '0 22px 20px' }}>
                    <div style={{ height: 2, background: 'linear-gradient(90deg, #ff1a1a, transparent)', margin: '-6px -22px 14px' }} />
                    <h2 style={{ color: 'white', fontSize: 21, fontWeight: 900, marginBottom: 8, letterSpacing: 0.3, lineHeight: 1.2 }}>
                      {current.title}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 3 }}>📅 {formatEventDate(current.starts_at)}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>📍 {current.venues?.name ?? 'Venue TBA'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {!done && current && (
            <div style={{ display: 'flex', gap: 20, marginTop: 28, alignItems: 'center', animation: 'fadeUp 0.5s ease 0.1s both' }}>
              <button
                onClick={() => swipe('left', index, liked)}
                disabled={!!exiting}
                className="finder-btn"
                aria-label="Skip"
                style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,26,26,0.1)', border: '2px solid rgba(255,26,26,0.35)', color: '#ff1a1a', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(255,26,26,0.15)' }}
              >
                ✕
              </button>

              <a
                href={current.ticket_url ?? `/checkout?eventId=${encodeURIComponent(current.id)}`}
                target={current.ticket_url ? '_blank' : undefined}
                rel={current.ticket_url ? 'noopener noreferrer' : undefined}
                style={{ padding: '10px 18px', borderRadius: 10, background: 'white', border: 'none', color: 'black', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Get Tickets
              </a>

              <button
                onClick={() => swipe('right', index, liked)}
                disabled={!!exiting}
                className="finder-btn"
                aria-label="Like"
                style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,220,100,0.1)', border: '2px solid rgba(0,200,80,0.35)', color: '#00dc64', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,200,80,0.15)' }}
              >
                ♥
              </button>
            </div>
          )}


        </div>
      </main>

      {/* Library drawer */}
      {libraryOpen && (
        <div
          onClick={() => setLibraryOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, backdropFilter: 'blur(4px)' }}
        />
      )}
      <div style={{
        position: 'fixed',
        top: 70,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: 420,
        background: '#0a0a0a',
        borderLeft: '1px solid rgba(255,255,255,0.09)',
        zIndex: 10001,
        transform: libraryOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>
        {/* Drawer header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>Finder</p>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: 0.5 }}>♥ Library</h2>
          </div>
          <button
            onClick={() => setLibraryOpen(false)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 36, height: 36, color: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px' }}>
          {likedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>♥</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No saved events yet. Swipe right on events you like!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {likedEvents.map(e => (
                <div key={e.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  {e.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image_url} alt={e.title} style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, flexShrink: 0, background: 'rgba(255,26,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎵</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, padding: '10px 12px' }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{formatEventDate(e.starts_at)} · {e.venues?.name ?? 'Venue TBA'}</p>
                  </div>
                  <div style={{ padding: '0 14px', flexShrink: 0 }}>
                    <Link
                      href={e.ticket_url ?? `/checkout?eventId=${encodeURIComponent(e.id)}`}
                      onClick={() => setLibraryOpen(false)}
                      style={{ background: 'white', color: 'black', padding: '6px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'block' }}
                    >
                      Get
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
