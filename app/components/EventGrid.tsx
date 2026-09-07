'use client'

import { useState } from 'react'
import Link from 'next/link'
import EventImage from './EventImage'
import EventModal from './EventModal'

type Event = {
  id: string
  title: string
  starts_at: string
  ends_at?: string | null
  genre_tags: string[]
  ticket_url?: string | null
  image_url?: string | null
  description?: string | null
  venues?: { name: string; address?: string | null; lat?: number | null; lng?: number | null } | null
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default function EventGrid({ events }: { events: Event[] }) {
  const [selected, setSelected] = useState<Event | null>(null)

  return (
    <>
      <style>{`
        .ev-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,26,26,0.4), 0 0 20px 4px rgba(255,26,26,0.3);
        }
        .ev-card { transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: pointer; }
        .ev-buy:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ev-buy { transition: all 0.2s ease; }
        .ev-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        @media (min-width: 600px) { .ev-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
        @media (min-width: 1024px) { .ev-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .ev-grid { grid-template-columns: repeat(4, 1fr); } }
      `}</style>

      <div className="ev-grid">
        {events.map(event => (
          <div
            key={event.id}
            className="ev-card"
            onClick={() => setSelected(event)}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
          >
            <EventImage src={event.image_url} alt={event.title} seed={event.id} height={420} />
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ height: 2, background: 'linear-gradient(90deg, #ff1a1a, transparent)', margin: '-24px -24px 16px' }} />
              <h3 style={{ color: 'white', fontSize: 20, fontWeight: 900, marginBottom: 10, letterSpacing: 1 }}>{event.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>📅 {formatEventDate(event.starts_at)}</p>
              {(event.venues as { name: string } | null)?.name && (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 8 }}>📍 {(event.venues as { name: string }).name}</p>
              )}
              {event.genre_tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {event.genre_tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,26,26,0.15)', color: '#ff1a1a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{tag}</span>
                  ))}
                </div>
              )}
              {event.description && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>{(event.description as string).slice(0, 120)}{(event.description as string).length > 120 ? '…' : ''}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
                {event.ticket_url ? (
                  <a
                    href={event.ticket_url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ev-buy"
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'white', color: 'black', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'inline-block' }}
                  >
                    Get Tickets
                  </a>
                ) : (
                  <Link
                    href={`/checkout?eventId=${encodeURIComponent(event.id)}`}
                    className="ev-buy"
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'white', color: 'black', padding: '9px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'inline-block' }}
                  >
                    Buy Ticket
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
