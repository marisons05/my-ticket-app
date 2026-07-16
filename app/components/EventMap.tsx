'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

export default function EventMap({ events, height = '450px' }: { events: any[], height?: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapReady, setMapReady] = useState(false)

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      mapInstanceRef.current = L.map(mapRef.current!, { zoomControl: true }).setView([56.9496, 24.1052], 13)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)

      const tilePane = mapInstanceRef.current.getPane('tilePane') as HTMLElement | null
      if (tilePane) {
        tilePane.style.filter = 'hue-rotate(210deg) saturate(1.5) brightness(1.15)'
      }

      setMapReady(true)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers whenever events change or map becomes ready
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    import('leaflet').then(L => {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      events.filter(e => e.latitude && e.longitude).forEach(event => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:linear-gradient(135deg,#7c3aed,#ff6b9d);border-radius:50%;width:20px;height:20px;box-shadow:0 0 12px rgba(124,58,237,0.8),0 0 24px rgba(255,107,157,0.4),0 2px 6px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.3)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -20]
        })

        const marker = L.marker([event.latitude, event.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:170px;padding:6px 4px;background:#1a0a38;color:white;border-radius:8px">
              <strong style="font-size:14px;color:white">${event.title}</strong><br/>
              <span style="color:rgba(255,255,255,0.5);font-size:12px">📍 ${event.location}</span><br/>
              <span style="color:rgba(255,255,255,0.5);font-size:12px">📅 ${new Date(event.date).toLocaleDateString()}</span><br/>
              <span style="background:linear-gradient(135deg,#7c3aed,#ff6b9d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;font-size:15px">€${event.price}</span>
            </div>
          `, { className: 'purple-popup' })

        markersRef.current.push(marker)
      })
    })
  }, [events, mapReady])

  return (
    <>
      <style>{`
        .purple-popup .leaflet-popup-content-wrapper {
          background: rgba(26,10,56,0.95);
          border: 1px solid rgba(180,125,255,0.3);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(124,58,237,0.2);
          backdrop-filter: blur(12px);
          padding: 0;
        }
        .purple-popup .leaflet-popup-content { margin: 10px 14px; }
        .purple-popup .leaflet-popup-tip { background: rgba(26,10,56,0.95); }
        .purple-popup .leaflet-popup-close-button { color: rgba(255,255,255,0.4) !important; }
        .purple-popup .leaflet-popup-close-button:hover { color: #ff6b9d !important; }
        .leaflet-control-zoom a {
          background: rgba(26,10,56,0.9) !important;
          color: rgba(255,255,255,0.8) !important;
          border-color: rgba(180,125,255,0.3) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(124,58,237,0.5) !important;
          color: white !important;
        }
        .leaflet-control-attribution {
          background: rgba(26,10,56,0.7) !important;
          color: rgba(255,255,255,0.3) !important;
        }
        .leaflet-control-attribution a { color: rgba(180,125,255,0.7) !important; }
      `}</style>
      <div
        ref={mapRef}
        style={{
          height,
          width: '100%',
          borderRadius: height === '100%' ? 0 : '16px',
          overflow: 'hidden',
          boxShadow: height === '100%' ? 'none' : '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(180,125,255,0.15)',
          border: height === '100%' ? 'none' : '1px solid rgba(180,125,255,0.2)',

        }}
      />
    </>
  )
}