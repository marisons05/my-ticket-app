'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

export default function EventMap({ events, height = '450px' }: { events: any[], height?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapReady, setMapReady] = useState(false)

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
          html: `<div style="position:relative;width:12px;height:12px;"><div style="position:absolute;inset:0;background:#000;border:2px solid #cc0000;border-radius:50%;"></div><div style="position:absolute;inset:-4px;border:1px solid rgba(204,0,0,0.5);border-radius:50%;animation:ping 1.8s ease-out infinite;"></div></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          popupAnchor: [0, -20]
        })

        const dateStr = event.starts_at ? new Date(event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

        const marker = L.marker([lat, lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family:monospace;min-width:180px;padding:8px 4px;background:#0a0a0a;color:white;border-radius:8px">
              <strong style="font-size:14px;color:white;display:block;margin-bottom:6px">${event.title}</strong>
              <span style="color:rgba(255,255,255,0.4);font-size:12px;display:block">📍 ${venue?.name ?? ''}</span>
              <span style="color:rgba(255,255,255,0.4);font-size:12px;display:block;margin-top:2px">📅 ${dateStr}</span>
              ${event.ticket_url ? `<a href="${event.ticket_url}" target="_blank" style="display:inline-block;margin-top:10px;color:white;font-size:11px;font-weight:700;letter-spacing:2px;text-decoration:none;border-bottom:1px solid #cc0000;padding-bottom:2px">GET TICKETS →</a>` : ''}
            </div>
          `, { className: 'event-popup' })

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
        .event-popup .leaflet-popup-content { margin: 12px 16px; }
        .event-popup .leaflet-popup-tip { background: rgba(10,10,10,0.97); }
        .event-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; }
        .event-popup .leaflet-popup-close-button:hover { color: #cc0000 !important; }
        .leaflet-control-zoom a {
          background: rgba(0,0,0,0.9) !important;
          color: rgba(255,255,255,0.8) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(204,0,0,0.4) !important;
          color: white !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.7) !important;
          color: rgba(255,255,255,0.3) !important;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.5) !important; }
      `}</style>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
      />
    </>
  )
}
