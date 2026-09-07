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

type EventInfo = {
  title: string
  starts_at: string
  image_url: string | null
  venues: { name: string } | null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function GroupchatPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [joining, setJoining] = useState(false)
  const [sending, setSending] = useState(false)
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setUsername(profile?.username || user.email?.split('@')[0] || 'Anonymous')

      const [evRes, memberRes, countRes] = await Promise.all([
        supabase.from('events').select('title, starts_at, image_url, venues(name)').eq('id', eventId).single(),
        supabase.from('groupchat_members').select('id').eq('user_id', user.id).eq('event_id', eventId).maybeSingle(),
        supabase.from('groupchat_members').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
      ])

      if (evRes.data) setEvent(evRes.data as unknown as EventInfo)
      setMemberCount(countRes.count ?? null)

      setIsMember(!!memberRes.data)

      // Load messages and subscribe for everyone
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (msgs) setMessages(msgs)

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

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

  async function handleJoin() {
    setJoining(true)
    const { error } = await supabase
      .from('groupchat_members')
      .upsert({ event_id: eventId, user_id: userId }, { onConflict: 'event_id,user_id', ignoreDuplicates: true })

    if (error) {
      alert(`Could not join: ${error.message}`)
      setJoining(false)
      return
    }

    setMemberCount(c => (c ?? 0) + 1)
    setIsMember(true)
    setJoining(false)
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || !userId || sending) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({ event_id: eventId, user_id: userId, username, content: text })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (isMember === null) {
    return (
      <main style={{ minHeight: '100vh', background: '#000', fontFamily: 'var(--font-space-mono, monospace)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          Loading...
        </div>
      </main>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        footer { display: none !important; }
        .msg-bubble { animation: fadeUp 0.2s ease both; }
        .send-btn:hover { filter: brightness(1.15); }
        .send-btn { transition: filter 0.15s; }
        textarea:focus { outline: none; border-color: rgba(255,26,26,0.4) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        .join-btn:hover { background: #cc0000 !important; }
        .join-btn { transition: background 0.15s; }
      `}</style>

      <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', overflowX: 'hidden', fontFamily: 'var(--font-space-mono, monospace)' }}>

        <div style={{ flexShrink: 0 }}>
          <Navbar />
        </div>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
          <Link href="/groupchats" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>‹</Link>
          {event?.image_url ? (
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,26,26,0.2)', border: '1px solid rgba(255,26,26,0.3)', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {event?.title ?? '...'}
            </p>
            {event && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>
                {new Date(event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {event.venues?.name ? ` · ${event.venues.name}` : ''}
                {memberCount !== null ? ` · ${memberCount} member${memberCount !== 1 ? 's' : ''}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              No messages yet.
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
                  background: isMe ? '#ff1a1a' : 'rgba(255,255,255,0.08)',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: 'white', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
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

        {/* Bottom bar */}
        <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.7)' }}>
          {isMember ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
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
                  width: 42, height: 42, borderRadius: 12,
                  background: input.trim() ? '#ff1a1a' : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: 'white', flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                ↑
              </button>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="join-btn"
              style={{
                width: '100%',
                background: '#ff1a1a',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: joining ? 'default' : 'pointer',
                opacity: joining ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {joining ? 'Joining...' : 'Join Groupchat'}
            </button>
          )}
        </div>
      </main>
    </>
  )
}
