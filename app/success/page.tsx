'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

function SuccessContent() {
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', animation: 'fadeUp 0.6s ease both', maxWidth: 480 }}>
        <div style={{ fontSize: 72, animation: 'pop 0.5s ease 0.2s both', display: 'inline-block', marginBottom: 24 }}>🎟️</div>
        <p style={{ color: '#cc0000', fontSize: 11, letterSpacing: 4, marginBottom: 12, textTransform: 'uppercase', fontWeight: 700 }}>Ticket Confirmed</p>
        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: 0.5 }}>
          You&apos;re in!
        </h1>
        {eventTitle && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 8 }}>
            {eventTitle}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Your ticket is confirmed. You&apos;ve been added to the event groupchat — say hi to your fellow attendees!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {eventId && done && (
            <Link
              href={`/groupchats/${eventId}`}
              style={{
                background: 'white',
                color: 'black',
                padding: '14px 32px',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.3,
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
  )
}

export default function SuccessPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-space-mono, monospace)',
      }}>
        <Navbar />

        <Suspense>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  )
}
