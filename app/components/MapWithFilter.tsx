'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import EventMap from './EventMap'

export default function MapWithFilter({ events }: { events: any[] }) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (
        ref.current && !ref.current.contains(t) &&
        dropdownRef.current && !dropdownRef.current.contains(t)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function openDropdown() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 8 + window.scrollY, left: r.left + window.scrollX })
    }
    setOpen(o => !o)
  }

  const filtered = useMemo(() => {
    return events.filter(e => {
      const d = e.starts_at ? new Date(e.starts_at) : null
      if (!d) return true
      if (startDate) {
        const s = new Date(startDate); s.setHours(0, 0, 0, 0)
        if (d < s) return false
      }
      if (endDate) {
        const en = new Date(endDate); en.setHours(23, 59, 59, 999)
        if (d > en) return false
      }
      return true
    })
  }, [events, startDate, endDate])

  const hasFilter = startDate || endDate

  function clear() {
    setStartDate(null)
    setEndDate(null)
    setOpen(false)
  }

  function formatLabel() {
    if (!startDate && !endDate) return 'DATES'
    const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()}`
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`
    if (startDate) return `From ${fmt(startDate)}`
    return `Until ${fmt(endDate!)}`
  }

  return (
    <>
      <style>{`
        .map-dp .react-datepicker {
          background: #111;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          font-family: var(--font-space-mono, monospace);
          box-shadow: 0 24px 60px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .map-dp .react-datepicker__header {
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-top: 14px;
        }
        .map-dp .react-datepicker__current-month { color: white; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
        .map-dp .react-datepicker__day-name { color: rgba(255,255,255,0.35); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .map-dp .react-datepicker__day { color: rgba(255,255,255,0.75); border-radius: 6px; width: 36px; line-height: 36px; margin: 1px; font-size: 13px; }
        .map-dp .react-datepicker__day:hover { background: rgba(255,26,26,0.2); color: white; }
        .map-dp .react-datepicker__day--selected,
        .map-dp .react-datepicker__day--range-start,
        .map-dp .react-datepicker__day--range-end { background: #ff1a1a !important; color: white !important; font-weight: 700; }
        .map-dp .react-datepicker__day--in-range { background: rgba(255,26,26,0.15); color: white; border-radius: 0; }
        .map-dp .react-datepicker__day--in-selecting-range { background: rgba(255,26,26,0.12); color: white; }
        .map-dp .react-datepicker__day--keyboard-selected { background: rgba(255,26,26,0.3); color: white; }
        .map-dp .react-datepicker__day--disabled { color: rgba(255,255,255,0.2); }
        .map-dp .react-datepicker__day--outside-month { color: rgba(255,255,255,0.2); }
        .map-dp .react-datepicker__navigation-icon::before { border-color: rgba(255,255,255,0.5); }
        .map-dp .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #ff1a1a; }
        .map-dp .react-datepicker__triangle { display: none; }
        .map-dp .react-datepicker__month-container { padding: 8px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
          position: 'relative',
          fontFamily: 'var(--font-space-mono, monospace)',
        }}>
          {/* Date range picker */}
          <div ref={ref} style={{ position: 'relative' }} className="map-dp">
            <button
              ref={btnRef}
              onClick={openDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: hasFilter ? 'rgba(255,26,26,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${hasFilter ? 'rgba(255,26,26,0.5)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 10,
                padding: '9px 16px',
                color: hasFilter ? '#ff1a1a' : 'white',
                fontSize: 13,
                fontFamily: 'var(--font-space-mono, monospace)',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {formatLabel()}
              {hasFilter && (
                <span
                  onClick={e => { e.stopPropagation(); clear() }}
                  style={{ fontSize: 14, opacity: 0.7, lineHeight: 1, cursor: 'pointer' }}
                >×</span>
              )}
              {!hasFilter && <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>}
            </button>

            {open && dropdownPos && createPortal(
              <div ref={dropdownRef} style={{
                position: 'absolute',
                top: dropdownPos.top,
                left: dropdownPos.left,
                zIndex: 99999,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14,
                padding: 16,
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                fontFamily: 'var(--font-space-mono, monospace)',
              }} className="map-dp">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
                    {startDate && !endDate ? 'Pick end date' : 'Pick date range'}
                  </span>
                  {hasFilter && (
                    <button onClick={clear} style={{ background: 'none', border: 'none', color: '#ff1a1a', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-space-mono, monospace)', fontWeight: 700 }}>
                      Clear
                    </button>
                  )}
                </div>
                <DatePicker
                  selected={startDate}
                  onChange={(dates) => {
                    const [start, end] = dates as [Date | null, Date | null]
                    setStartDate(start)
                    setEndDate(end)
                    if (start && end) setOpen(false)
                  }}
                  startDate={startDate ?? undefined}
                  endDate={endDate ?? undefined}
                  selectsRange
                  inline
                  minDate={new Date()}
                />
              </div>,
              document.body
            )}
          </div>

          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600 }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Map */}
        <div style={{ flex: 1 }}>
          <EventMap events={filtered} height="100%" />
        </div>
      </div>
    </>
  )
}
