'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

type Message = {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

type Event = {
  title: string
  date: string
  location: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function GroupchatPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      setUserId(user.id)

      // Load username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setUsername(profile?.username || user.email?.split('@')[0] || 'Anonymous')

      // Check ticket access
      const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle()

      if (!ticket) { setHasAccess(false); return }
      setHasAccess(true)

      // Load event info
      const { data: ev } = await supabase
        .from('events')
        .select('title, date, location')
        .eq('id', eventId)
        .single()
      if (ev) setEvent(ev)

      // Load existing messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (msgs) setMessages(msgs)

      // Subscribe to new messages
      channelRef.current = supabase
        .channel(`chat:${eventId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        })
        .subscribe()
    }
    init()
    return () => { channelRef.current?.unsubscribe() }
  }, [eventId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || !userId || sending) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({
      event_id: eventId,
      user_id: userId,
      username,
      content: text,
    })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (hasAccess === false) {
    return (
      <>
        <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>
          <Navbar />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Ticket required</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
              You need a ticket to this event to join its groupchat.
            </p>
            <Link href="/events" style={{ background: 'linear-gradient(135deg, #7c3aed, #ff6b9d)', color: 'white', padding: '12px 28px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Browse Events
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-bubble { animation: fadeUp 0.2s ease both; }
        .send-btn:hover { filter: brightness(1.15); }
        .send-btn { transition: filter 0.15s; }
        textarea:focus { outline: none; border-color: rgba(180,125,255,0.5) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <main style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #06000e 0%, #180838 40%, #2a0e5a 70%, #06000e 100%)',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', animation: 'orb1 18s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        {/* Navbar */}
        <div style={{ position: 'relative', zIndex: 20, flexShrink: 0 }}>
          <Navbar />
        </div>

        {/* Chat header */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(12px)', background: 'rgba(6,0,14,0.3)' }}>
          <Link href="/groupchats" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>‹</Link>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(255,107,157,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
            🎵
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event?.title ?? '...'}
            </p>
            {event && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {event.location}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && hasAccess && (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              No messages yet. Say hi! 👋
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === userId
            return (
              <div key={msg.id} className="msg-bubble" style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, marginBottom: 3, paddingLeft: 4 }}>
                    {msg.username}
                  </span>
                )}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe
                    ? 'linear-gradient(135deg, #7c3aed, #b347d6)'
                    : 'rgba(255,255,255,0.08)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: 14,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', background: 'rgba(6,0,14,0.5)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: '11px 16px',
              color: 'white',
              fontSize: 14,
              resize: 'none',
              maxHeight: 120,
              lineHeight: 1.5,
              fontFamily: 'inherit',
              overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="send-btn"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            ↑
          </button>
        </div>
      </main>
    </>
  )
}
