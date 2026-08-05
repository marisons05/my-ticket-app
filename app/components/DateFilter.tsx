'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function DateFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fromParam = params.get('dateFrom')
  const toParam = params.get('dateTo')

  const [startDate, setStartDate] = useState<Date | null>(fromParam ? new Date(fromParam) : null)
  const [endDate, setEndDate] = useState<Date | null>(toParam ? new Date(toParam) : null)

  const hasFilter = !!(fromParam || toParam)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function apply(start: Date | null, end: Date | null) {
    const url = new URL(window.location.href)
    url.searchParams.delete('dateFrom')
    url.searchParams.delete('dateTo')
    if (start) url.searchParams.set('dateFrom', start.toISOString().split('T')[0])
    if (end) url.searchParams.set('dateTo', end.toISOString().split('T')[0])
    startTransition(() => router.push(url.pathname + url.search))
  }

  function clear() {
    setStartDate(null)
    setEndDate(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('dateFrom')
    url.searchParams.delete('dateTo')
    startTransition(() => router.push(url.pathname + url.search))
    setOpen(false)
  }

  function formatLabel() {
    if (!fromParam && !toParam) return 'DATES'
    const fmt = (s: string) => {
      const d = new Date(s)
      return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()}`
    }
    if (fromParam && toParam) return `${fmt(fromParam)} – ${fmt(toParam)}`
    if (fromParam) return `From ${fmt(fromParam)}`
    return `Until ${fmt(toParam!)}`
  }

  return (
    <>
      <style>{`
        .dp-dark .react-datepicker {
          background: #111;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          font-family: var(--font-space-mono, monospace);
          box-shadow: 0 24px 60px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .dp-dark .react-datepicker__header {
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-top: 14px;
        }
        .dp-dark .react-datepicker__current-month,
        .dp-dark .react-datepicker__day-name {
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .dp-dark .react-datepicker__current-month { color: white; font-size: 13px; margin-bottom: 6px; }
        .dp-dark .react-datepicker__day {
          color: rgba(255,255,255,0.75);
          border-radius: 6px;
          width: 36px;
          line-height: 36px;
          margin: 1px;
          font-size: 13px;
        }
        .dp-dark .react-datepicker__day:hover {
          background: rgba(255,26,26,0.2);
          color: white;
        }
        .dp-dark .react-datepicker__day--selected,
        .dp-dark .react-datepicker__day--range-start,
        .dp-dark .react-datepicker__day--range-end {
          background: #ff1a1a !important;
          color: white !important;
          font-weight: 700;
        }
        .dp-dark .react-datepicker__day--in-range {
          background: rgba(255,26,26,0.15);
          color: white;
          border-radius: 0;
        }
        .dp-dark .react-datepicker__day--in-selecting-range {
          background: rgba(255,26,26,0.12);
          color: white;
        }
        .dp-dark .react-datepicker__day--keyboard-selected {
          background: rgba(255,26,26,0.3);
          color: white;
        }
        .dp-dark .react-datepicker__day--disabled { color: rgba(255,255,255,0.2); }
        .dp-dark .react-datepicker__navigation-icon::before { border-color: rgba(255,255,255,0.5); }
        .dp-dark .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #ff1a1a; }
        .dp-dark .react-datepicker__day--outside-month { color: rgba(255,255,255,0.2); }
        .dp-dark .react-datepicker__triangle { display: none; }
        .dp-dark .react-datepicker__month-container { padding: 8px; }
      `}</style>

      <div ref={ref} style={{ position: 'relative' }} className="dp-dark">
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: hasFilter ? 'rgba(255,26,26,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${hasFilter ? 'rgba(255,26,26,0.5)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 10,
            padding: '10px 16px',
            color: hasFilter ? '#ff1a1a' : 'white',
            fontSize: 14,
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

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            background: '#111',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: 16,
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
                {startDate && !endDate ? 'Pick end date' : 'Pick date range'}
              </span>
              {(startDate || endDate) && (
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
                if (start && end) {
                  apply(start, end)
                  setOpen(false)
                }
              }}
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              selectsRange
              inline
              minDate={new Date()}
              calendarClassName="dp-dark-cal"
            />
          </div>
        )}
      </div>
    </>
  )
}
