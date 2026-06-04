'use client'

import { useEffect, useRef } from 'react'

export default function EventMap({ events }: { events: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')

      mapInstanceRef.current = L.map(mapRef.current!).setView([56.9496, 24.1052], 13)

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        attribution: '© Stadia Maps © OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current)

      events.filter(e => e.latitude && e.longitude).forEach(event => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:linear-gradient(135deg,#7c3aed,#ff6b9d);border-radius:50%;width:20px;height:20px;box-shadow:0 0 8px rgba(124,58,237,0.6),0 2px 6px rgba(0,0,0,0.5);border:2px solid black"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -20]
        })

        L.marker([event.latitude, event.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px;padding:4px">
              <strong style="font-size:15px">${event.title}</strong><br/>
              <span style="color:#555;font-size:13px">📍 ${event.location}</span><br/>
              <span style="color:#555;font-size:13px">📅 ${new Date(event.date).toLocaleDateString()}</span><br/>
              <span style="color:#3d1f7a;font-weight:bold;font-size:15px">€${event.price}</span>
            </div>
          `)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      style={{height: '450px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}
    />
  )
}