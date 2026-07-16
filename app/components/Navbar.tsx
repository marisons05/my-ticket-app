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
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
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
    window.location.href = '/login'
  }

  const itemStyle: React.CSSProperties = {
    display: 'block',
    padding: '11px 20px',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: 8,
    transition: 'background 0.15s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  }

  return (
    <nav style={{ height: 70, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', background: 'rgba(6,0,14,0.4)' }}>

      <Link href="/events" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>THE MIX</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 4 }}>LIVE EVENTS</span>
        </div>
      </Link>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2 }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: 'rgba(18,4,40,0.97)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px', minWidth: 180,
            backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}>
            <Link href="/events" style={itemStyle} onClick={() => setOpen(false)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Home
            </Link>
            <Link href="/finder" style={itemStyle} onClick={() => setOpen(false)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Finder
            </Link>
            <Link href="/map" style={itemStyle} onClick={() => setOpen(false)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Map
            </Link>
            <Link href="/groupchats" style={itemStyle} onClick={() => setOpen(false)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Groupchats
            </Link>

            {user ? (
              <>
                <Link href="/account" style={itemStyle} onClick={() => setOpen(false)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  My Account
                </Link>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 8px' }} />
                <button onClick={handleLogout} style={{ ...itemStyle, color: '#ff6b9d' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,157,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={itemStyle} onClick={() => setOpen(false)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Login
                </Link>
                <Link href="/login" style={{ ...itemStyle, color: '#d4a8ff' }} onClick={() => setOpen(false)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(180,125,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Get Tickets
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
