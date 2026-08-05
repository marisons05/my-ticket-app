'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

type Chat = {
  event_id: string
  event: {
    title: string
    date: string
    location: string
  }
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default function GroupchatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data } = await supabase
        .from('tickets')
        .select('event_id, event:events(title, date, location)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })

      if (data) setChats(data as unknown as Chat[])
      setLoaded(true)
    }
    load()
  }, [])

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-row:hover { background: rgba(255,255,255,0.06) !important; }
        .chat-row { transition: background 0.15s; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>

        <Navbar />

        <div style={{ padding: '48px 24px 80px', maxWidth: 640, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 4, marginBottom: 6, textTransform: 'uppercase' }}>Community</p>
          <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, marginBottom: 32, letterSpacing: 1 }}>Groupchats</h1>

          {!loaded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: 1 - i * 0.25 }} />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 8 }}>No groupchats yet</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Buy a ticket to an event and you&apos;ll be added to that event&apos;s groupchat automatically.
              </p>
              <Link
                href="/events"
                style={{ background: 'white', color: 'black', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'inline-block' }}
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.5s ease both' }}>
              {chats.map(chat => (
                <Link
                  key={chat.event_id}
                  href={`/groupchats/${chat.event_id}`}
                  className="chat-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 14,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    🎵
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.event.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      {formatEventDate(chat.event.date)} · {chat.event.location}
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
