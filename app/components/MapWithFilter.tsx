'use client'

import { useState, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import EventMap from './EventMap'

export default function MapWithFilter({ events }: { events: any[] }) {
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(null)
  const [appliedTo, setAppliedTo] = useState<Date | null>(null)

  const filtered = useMemo(() => {
    return events.filter(e => {
      const d = e.date ? new Date(e.date) : null
      if (!d) return true
      if (appliedFrom) {
        const fromStart = new Date(appliedFrom)
        fromStart.setHours(0, 0, 0, 0)
        if (d < fromStart) return false
      }
      if (appliedTo) {
        const toEnd = new Date(appliedTo)
        toEnd.setHours(23, 59, 59, 999)
        if (d > toEnd) return false
      }
      return true
    })
  }, [events, appliedFrom, appliedTo])

  const isFiltered = appliedFrom || appliedTo
  const isDirty = from !== appliedFrom || to !== appliedTo

  function handleApply() {
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  function handleClear() {
    setFrom(null)
    setTo(null)
    setAppliedFrom(null)
    setAppliedTo(null)
  }

  return (
    <>
      <style>{`
        .map-dp .react-datepicker {
          background: rgba(18, 4, 40, 0.98);
          border: 1px solid rgba(180,125,255,0.3);
          border-radius: 14px;
          font-family: inherit;
          box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 30px rgba(124,58,237,0.2);
          overflow: hidden;
        }
        .map-dp .react-datepicker__header {
          background: rgba(124,58,237,0.15);
          border-bottom: 1px solid rgba(180,125,255,0.2);
          border-radius: 0;
          padding-top: 12px;
        }
        .map-dp .react-datepicker__current-month {
          color: white;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 1px;
        }
        .map-dp .react-datepicker__day-name {
          color: rgba(180,125,255,0.6);
          font-size: 11px;
          font-weight: 700;
          width: 2rem;
        }
        .map-dp .react-datepicker__day {
          color: rgba(255,255,255,0.75);
          border-radius: 8px;
          width: 2rem;
          line-height: 2rem;
          font-size: 13px;
          transition: background 0.15s;
        }
        .map-dp .react-datepicker__day:hover {
          background: rgba(124,58,237,0.4);
          color: white;
        }
        .map-dp .react-datepicker__day--selected,
        .map-dp .react-datepicker__day--keyboard-selected {
          background: linear-gradient(135deg, #7c3aed, #ff6b9d);
          color: white;
          font-weight: 700;
        }
        .map-dp .react-datepicker__day--outside-month {
          color: rgba(255,255,255,0.2);
        }
        .map-dp .react-datepicker__navigation-icon::before {
          border-color: rgba(180,125,255,0.7);
        }
        .map-dp .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        .map-dp-popper {
          z-index: 99999 !important;
        }
        .map-dp .react-datepicker__triangle { display: none; }
        .map-dp-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(180,125,255,0.3);
          border-radius: 10px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 14px;
          outline: none;
          cursor: pointer;
          width: 130px;
          caret-color: #b47dff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .map-dp-input:focus {
          border-color: rgba(180,125,255,0.7);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
        }
        .map-dp-input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          background: 'rgba(6,0,14,0.8)',
          borderBottom: '1px solid rgba(180,125,255,0.2)',
          backdropFilter: 'blur(12px)',
          flexWrap: 'wrap',
          zIndex: 10,
          position: 'relative',
        }}>
          <span style={{ color: 'rgba(180,125,255,0.7)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
            Filter by date
          </span>

          <div className="map-dp" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>From</label>
            <DatePicker
              selected={from}
              onChange={(d: Date | null) => setFrom(d)}
              selectsStart
              startDate={from}
              endDate={to}
              placeholderText="Any date"
              dateFormat="dd MMM yyyy"
              className="map-dp-input"
              popperClassName="map-dp map-dp-popper"
              portalId="dp-portal"
            />
          </div>

          <div className="map-dp" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>To</label>
            <DatePicker
              selected={to}
              onChange={(d: Date | null) => setTo(d)}
              selectsEnd
              startDate={from}
              endDate={to}
              minDate={from ?? undefined}
              placeholderText="Any date"
              dateFormat="dd MMM yyyy"
              className="map-dp-input"
              popperClassName="map-dp map-dp-popper"
              portalId="dp-portal"
            />
          </div>

          <button
            onClick={handleApply}
            disabled={!isDirty && !from && !to}
            style={{
              background: isDirty ? 'linear-gradient(135deg, #7c3aed, #ff6b9d)' : 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(180,125,255,0.4)',
              borderRadius: 10,
              color: isDirty ? 'white' : 'rgba(180,125,255,0.4)',
              fontSize: 13,
              fontWeight: 700,
              padding: '9px 20px',
              cursor: isDirty ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            Apply
          </button>

          {isFiltered && (
            <button
              onClick={handleClear}
              style={{
                background: 'rgba(255,107,157,0.1)',
                border: '1px solid rgba(255,107,157,0.3)',
                borderRadius: 10,
                color: '#ff6b9d',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 16px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}

          <span style={{ marginLeft: 'auto', color: 'rgba(180,125,255,0.6)', fontSize: 12, fontWeight: 600 }}>
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
