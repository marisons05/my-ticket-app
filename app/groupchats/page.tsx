'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../components/Navbar'
import EventImage from '../components/EventImage'
import RainCanvas from '../components/RainCanvas'
import Link from 'next/link'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

type EventRow = {
  id: string
  title: string
  starts_at: string
  image_url: string | null
  venues: { name: string } | null
}

type LastMessage = { content: string; username: string }

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ color: 'white', fontSize: 16, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
      {children}
    </p>
  )
}

function ChatRow({ event, joined, memberCount, lastMessage }: {
  event: EventRow
  joined: boolean
  memberCount: number
  lastMessage: LastMessage | null
}) {
  return (
    <Link
      href={`/groupchats/${event.id}`}
      className="chat-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 18px',
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        textDecoration: 'none',
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,26,26,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <EventImage src={event.image_url} alt={event.title} height={72} style={{ width: '100%', height: 72, objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.title}
          </p>
          {joined && (
            <span style={{ fontSize: 9, letterSpacing: 2, color: '#ff1a1a', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>Joined</span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: '0 0 6px' }}>
          {formatEventDate(event.starts_at)}{event.venues?.name ? ` · ${event.venues.name}` : ''} · {memberCount} member{memberCount !== 1 ? 's' : ''}
        </p>
        {lastMessage ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{lastMessage.username}:</span> {lastMessage.content}
          </p>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0, fontStyle: 'italic' }}>No messages yet</p>
        )}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, flexShrink: 0 }}>›</span>
    </Link>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 108, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', opacity: 1 - i * 0.3 }} />
      ))}
    </div>
  )
}

export default function GroupchatsPage() {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [allEvents, setAllEvents] = useState<EventRow[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessage>>({})
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [membersRes, eventsRes, allMembersRes, messagesRes] = await Promise.all([
        supabase.from('groupchat_members').select('event_id').eq('user_id', user.id),
        supabase.from('events').select('id, title, starts_at, image_url, venues(name)').eq('status', 'published').order('starts_at', { ascending: true }),
        supabase.from('groupchat_members').select('event_id'),
        supabase.from('messages').select('event_id, username, content, created_at').order('created_at', { ascending: false }).limit(500),
      ])

      if (membersRes.data) setJoinedIds(new Set(membersRes.data.map((r: { event_id: string }) => r.event_id)))
      if (eventsRes.data) setAllEvents(eventsRes.data as unknown as EventRow[])

      // Aggregate member counts
      if (allMembersRes.data) {
        const counts: Record<string, number> = {}
        for (const row of allMembersRes.data as { event_id: string }[]) {
          counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
        }
        setMemberCounts(counts)
      }

      // Pick last message per event
      if (messagesRes.data) {
        const last: Record<string, LastMessage> = {}
        for (const msg of messagesRes.data as { event_id: string; username: string; content: string }[]) {
          if (!last[msg.event_id]) last[msg.event_id] = { username: msg.username, content: msg.content }
        }
        setLastMessages(last)
      }

      setLoaded(true)
    }
    load()
  }, [])

  const joinedEvents = allEvents.filter(e => joinedIds.has(e.id))
  const browseEvents = allEvents
    .filter(e => !joinedIds.has(e.id))
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venues?.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-row:hover { transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,26,26,0.4), 0 0 20px 4px rgba(255,26,26,0.3); }
        .chat-row { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .search-input:focus { border-color: rgba(255,255,255,0.35) !important; }
        .search-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <main style={{ minHeight: '100vh', background: 'transparent', overflowX: 'hidden', fontFamily: 'var(--font-space-mono, monospace)' }}>
        <RainCanvas density={20} maxOpacity={0.12} maxSpeed={0.6} />
        <Navbar />

        <div style={{ padding: '48px 48px 80px', animation: 'fadeUp 0.3s ease both' }}>
          {!loaded ? (
            <Skeleton />
          ) : (
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Joined Groupchats */}
              <section style={{ flex: '1 1 340px', minWidth: 0 }}>
                <div style={{ marginBottom: 16 }}><SectionLabel>Joined Groupchats</SectionLabel></div>
                {joinedEvents.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '20px 0', lineHeight: 1.7 }}>
                    You haven&apos;t joined any groupchats yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {joinedEvents.map(event => (
                      <ChatRow key={event.id} event={event} joined memberCount={memberCounts[event.id] ?? 0} lastMessage={lastMessages[event.id] ?? null} />
                    ))}
                  </div>
                )}
              </section>

              {/* Divider */}
              <div style={{ width: 1, background: '#ff1a1a', flexShrink: 0, alignSelf: 'stretch', marginTop: '-48px', marginBottom: '-80px' }} />

              {/* Browse Groupchats */}
              <section style={{ flex: '1 1 340px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
                  <SectionLabel>Browse Groupchats</SectionLabel>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input"
                    style={{
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      padding: '7px 14px',
                      color: 'white',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      letterSpacing: 1,
                      width: 140,
                      outline: 'none',
                      transition: 'border-color 0.15s',
                      flexShrink: 0,
                    }}
                  />
                </div>
                {browseEvents.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '16px 0' }}>
                    {search ? `No events match "${search}".` : 'No other groupchats to browse.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {browseEvents.map(event => (
                      <ChatRow key={event.id} event={event} joined={false} memberCount={memberCounts[event.id] ?? 0} lastMessage={lastMessages[event.id] ?? null} />
                    ))}
                  </div>
                )}
              </section>

            </div>
          )}
        </div>
      </main>
    </>
  )
}
