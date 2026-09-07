'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import EventImage from './EventImage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import 'leaflet/dist/leaflet.css'

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
)

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function VenueMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      mapInstanceRef.current = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 15)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:14px;height:14px;"><div style="position:absolute;inset:0;background:#000;border:2px solid #ff1a1a;border-radius:50%;"></div><div style="position:absolute;inset:-5px;border:1px solid rgba(255,26,26,0.5);border-radius:50%;animation:ping 1.8s ease-out infinite;"></div></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      L.marker([lat, lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<span style="font-family:monospace;color:white;font-size:12px">${name}</span>`, { className: 'event-popup' })
        .openPopup()
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, name])

  return (
    <>
      <style>{`
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .event-popup .leaflet-popup-content-wrapper {
          background: rgba(10,10,10,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          padding: 0;
        }
        .event-popup .leaflet-popup-content { margin: 8px 12px; }
        .event-popup .leaflet-popup-tip { background: rgba(10,10,10,0.97); }
        .event-popup .leaflet-popup-close-button { display: none; }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.9) !important;
          color: rgba(255,255,255,0.8) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover { background: rgba(255,26,26,0.4) !important; color: white !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.7) !important; color: rgba(255,255,255,0.3) !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
      `}</style>
      <div ref={mapRef} style={{ height: 240, width: '100%' }} />
    </>
  )
}

export default function EventModal({ event, onClose, hideVenueMap }: { event: Event; onClose: () => void; hideVenueMap?: boolean }) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function handleJoinGroupchat() {
    setJoining(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { error } = await supabase
        .from('groupchat_members')
        .upsert({ event_id: event.id, user_id: user.id }, { onConflict: 'event_id,user_id', ignoreDuplicates: true })

      if (error) {
        console.error('groupchat join error:', error)
        alert(`Could not join groupchat: ${error.message}`)
        setJoining(false)
        return
      }

      window.location.href = `/groupchats/${event.id}`
    } catch (e) {
      console.error('groupchat join exception:', e)
      setJoining(false)
    }
  }

  const venue = event.venues
  const hasMap = !hideVenueMap && venue?.lat && venue?.lng

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes slideUp { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,26,26,0.15)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 280, flexShrink: 0 }}>
          <EventImage src={event.image_url} alt={event.title} seed={event.id} height={280} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0d0d0d)' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: 36, height: 36,
              color: 'white', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, #ff1a1a, transparent)', margin: '0 -28px 20px' }} />

          {/* Genre tags */}
          {event.genre_tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {event.genre_tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,26,26,0.15)', color: '#ff1a1a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{tag}</span>
              ))}
            </div>
          )}

          <h2 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 16px', letterSpacing: 0.5 }}>{event.title}</h2>

          {/* Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
              📅 {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
              {event.ends_at ? ` – ${formatTime(event.ends_at)}` : ''}
            </p>
            {venue?.name && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                📍 {venue.name}{venue.address ? `, ${venue.address}` : ''}
              </p>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {event.description}
            </p>
          )}

          {/* Map */}
          {hasMap && (
            <div style={{ margin: '0 -28px 24px' }}>
              <div style={{ padding: '0 28px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 1, width: 20, background: '#ff1a1a' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', margin: 0 }}>Venue</p>
              </div>
              <VenueMap lat={Number(venue!.lat)} lng={Number(venue!.lng)} name={venue!.name} />
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleJoinGroupchat}
              disabled={joining}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
                cursor: joining ? 'default' : 'pointer',
                opacity: joining ? 0.6 : 1,
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={e => { if (!joining) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {joining ? 'Joining...' : 'Join Groupchat'}
            </button>

            {event.ticket_url ? (
              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                style={{ background: '#ff1a1a', color: 'white', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
                Get Tickets →
              </a>
            ) : (
              <Link href={`/checkout?eventId=${encodeURIComponent(event.id)}`}
                style={{ background: '#ff1a1a', color: 'white', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
                Buy Ticket →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
