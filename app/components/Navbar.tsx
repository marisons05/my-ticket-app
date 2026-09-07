'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient, type User } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <style>{`
        .nav-item {
          display: block;
          padding: 11px 20px;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          transition: background 0.15s;
        }
        .nav-item:hover { background: rgba(255,255,255,0.07); }
        .nav-item-danger { color: #ff1a1a !important; }
        .nav-item-danger:hover { background: rgba(255,26,26,0.08) !important; }
        .nav-hamburger span {
          display: block; width: 22px; height: 2px;
          background: white; border-radius: 2px; transition: opacity 0.2s;
        }
        .nav-hamburger:hover span { opacity: 0.7; }
      `}</style>

      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        height: 70,
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(0,0,0,0.6)',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <div style={{ width: 80 }} />

        <Link href="/" style={{ textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 700, letterSpacing: 2, textAlign: 'center' }}>THE MIX</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 4, textAlign: 'center', width: '100%' }}>LIVE EVENTS</span>
          </div>
        </Link>

        {ready && (
          user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                className="nav-hamburger"
                onClick={() => setOpen(o => !o)}
                aria-label="Menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: 5 }}
              >
                <span /><span /><span />
              </button>

              {open && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 12, padding: '8px', minWidth: 190,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                }}>
                  <Link href="/" className="nav-item" onClick={() => setOpen(false)}>Home</Link>
                  <Link href="/events" className="nav-item" onClick={() => setOpen(false)}>Events</Link>
                  <Link href="/finder" className="nav-item" onClick={() => setOpen(false)}>Finder</Link>
                  <Link href="/map" className="nav-item" onClick={() => setOpen(false)}>Map</Link>
                  <Link href="/groupchats" className="nav-item" onClick={() => setOpen(false)}>Groupchats</Link>
                  <Link href="/account" className="nav-item" onClick={() => setOpen(false)}>Account</Link>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 8px' }} />
                  <button onClick={handleLogout} className="nav-item nav-item-danger">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/login" style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Login
              </Link>
              <Link href="/login" style={{ background: 'white', color: 'black', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                Sign Up
              </Link>
            </div>
          )
        )}
      </nav>
    </>
  )
}
