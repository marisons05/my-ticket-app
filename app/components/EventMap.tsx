'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import EventModal from './EventModal'

export default function EventMap({ events, height = '450px' }: { events: any[], height?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [modalEvent, setModalEvent] = useState<any | null>(null)

  // Keep events accessible in the click handler via ref
  const eventsRef = useRef<any[]>(events)
  useEffect(() => { eventsRef.current = events }, [events])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      mapInstanceRef.current = L.map(mapRef.current!, { zoomControl: true }).setView([56.9496, 24.1052], 13)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)

      setMapReady(true)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Event delegation — listen for expand button clicks inside Leaflet popups
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest('[data-expand-id]') as HTMLElement | null
      if (!btn) return
      const id = btn.getAttribute('data-expand-id')
      const event = eventsRef.current.find(ev => ev.id === id)
      if (event) setModalEvent(event)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      events.forEach(event => {
        const venue = event.venues
        const lat = venue?.lat
        const lng = venue?.lng
        if (!lat || !lng) return

        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:12px;height:12px;"><div style="position:absolute;inset:0;background:#000;border:2px solid #ff1a1a;border-radius:50%;"></div><div style="position:absolute;inset:-4px;border:1px solid rgba(255,26,26,0.5);border-radius:50%;animation:ping 1.8s ease-out infinite;"></div></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          popupAnchor: [0, -20]
        })

        const dateStr = event.starts_at
          ? new Date(event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : ''

        const imgHtml = event.image_url
          ? `<img src="${event.image_url}" alt="" style="width:100%;height:140px;object-fit:cover;display:block;border-radius:6px 6px 0 0;margin-bottom:10px;" />`
          : ''

        const marker = L.marker([lat, lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family:monospace;width:220px;background:#0d0d0d;color:white;border-radius:10px;overflow:hidden;padding:0;">
              ${imgHtml}
              <div style="padding:10px 12px 12px;">
                <strong style="font-size:13px;color:white;display:block;margin-bottom:6px;line-height:1.3">${event.title}</strong>
                <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block">📍 ${venue?.name ?? ''}</span>
                <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block;margin-top:2px">📅 ${dateStr}</span>
                <button data-expand-id="${event.id}" style="margin-top:10px;width:100%;background:#ff1a1a;border:none;color:white;font-size:11px;font-weight:700;letter-spacing:2px;padding:8px 0;border-radius:6px;cursor:pointer;font-family:monospace;">
                  EXPAND →
                </button>
              </div>
            </div>
          `, { className: 'event-popup', maxWidth: 240 })

        markersRef.current.push(marker)
      })
    })
  }, [events, mapReady])

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
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
          padding: 0;
        }
        .event-popup .leaflet-popup-content { margin: 0; }
        .event-popup .leaflet-popup-tip { background: rgba(10,10,10,0.97); }
        .event-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; z-index: 1; }
        .event-popup .leaflet-popup-close-button:hover { color: #ff1a1a !important; }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.9) !important;
          color: rgba(255,255,255,0.8) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(255,26,26,0.4) !important;
          color: white !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.7) !important;
          color: rgba(255,255,255,0.3) !important;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.5) !important; }
      `}</style>
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {modalEvent && <EventModal event={modalEvent} onClose={() => setModalEvent(null)} hideVenueMap />}
    </>
  )
}
