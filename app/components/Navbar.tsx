'use client'

import { useEffect, useState } from 'react'
import { createClient, type User } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUsername(profile.username)
          })
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav style={{ height: 70, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', background: 'rgba(6,0,14,0.4)' }}>

      <Link href="/events" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>THE MIX</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 4 }}>LIVE EVENTS</span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/finder" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', letterSpacing: 0.3 }}>
          ♥ Finder
        </Link>
        {user ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
              {username || user.email}
            </span>
            <Link
              href="/account"
              style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'white', padding: '8px 18px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
            >
              My Account
            </Link>
            <button
              onClick={handleLogout}
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '8px 18px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'white', padding: '8px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Login
            </Link>
            <Link href="/login" style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '8px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Get Tickets
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
