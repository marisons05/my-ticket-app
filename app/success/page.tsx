'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const [eventTitle, setEventTitle] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!eventId) return
    async function record() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: event } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single()
      if (event) setEventTitle(event.title)

      // Insert ticket (skip if already exists)
      const { data: existing } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle()

      if (!existing) {
        await supabase.from('tickets').insert({ user_id: user.id, event_id: eventId })
      }

      setDone(true)
    }
    record()
  }, [eventId])

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes btnGlow {
          0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.4), 0 4px 24px rgba(124,58,237,0.4); }
          50% { box-shadow: 0 0 40px rgba(255,107,157,0.7), 0 4px 40px rgba(124,58,237,0.7); }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', left: '12%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 20 }}>
          <Navbar />
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px' }}>
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.6s ease both', maxWidth: 480 }}>
            <div style={{ fontSize: 72, animation: 'pop 0.5s ease 0.2s both', display: 'inline-block', marginBottom: 24 }}>🎟️</div>
            <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: 0.5 }}>
              You&apos;re in!
            </h1>
            {eventTitle && (
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 8 }}>
                {eventTitle}
              </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
              Your ticket is confirmed. You&apos;ve been added to the event groupchat — say hi to your fellow attendees!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              {eventId && done && (
                <Link
                  href={`/groupchats/${eventId}`}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)',
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    animation: 'btnGlow 3s ease-in-out infinite',
                    display: 'inline-block',
                  }}
                >
                  Open Groupchat →
                </Link>
              )}
              <Link
                href="/events"
                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}
              >
                Back to events
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
