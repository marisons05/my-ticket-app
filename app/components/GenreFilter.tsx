'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

export default function GenreFilter({ genres }: { genres: string[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = new Set(params.getAll('genre'))

  const toggle = useCallback((genre: string) => {
    const next = new Set(selected)
    if (next.has(genre)) next.delete(genre)
    else next.add(genre)

    const url = new URL(window.location.href)
    url.searchParams.delete('genre')
    next.forEach(g => url.searchParams.append('genre', g))

    startTransition(() => router.push(url.pathname + url.search))
  }, [router, selected])

  const clearAll = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('genre')
    startTransition(() => router.push(url.pathname + url.search))
    setOpen(false)
  }, [router])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeCount = selected.size

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: activeCount > 0 ? 'rgba(255,26,26,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${activeCount > 0 ? 'rgba(255,26,26,0.5)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 10,
          padding: '10px 16px',
          color: activeCount > 0 ? '#ff1a1a' : 'white',
          fontSize: 14,
          fontFamily: 'var(--font-space-mono, monospace)',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: 1,
          whiteSpace: 'nowrap',
        }}
      >
        FILTERS
        {activeCount > 0 && (
          <span style={{
            background: '#ff1a1a',
            color: 'white',
            fontSize: 10,
            fontWeight: 900,
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {activeCount}
          </span>
        )}
        <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: 16,
          minWidth: 220,
          zIndex: 100,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Genre</span>
            {activeCount > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ff1a1a', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-space-mono, monospace)', fontWeight: 700 }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {genres.map(genre => {
              const active = selected.has(genre)
              return (
                <button
                  key={genre}
                  onClick={() => toggle(genre)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: active ? 'rgba(255,26,26,0.12)' : 'transparent',
                    border: '1px solid',
                    borderColor: active ? 'rgba(255,26,26,0.4)' : 'transparent',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: active ? '#ff1a1a' : 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    fontFamily: 'var(--font-space-mono, monospace)',
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: 4,
                    border: `1px solid ${active ? '#ff1a1a' : 'rgba(255,255,255,0.3)'}`,
                    background: active ? '#ff1a1a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {active && <span style={{ color: 'white', fontSize: 9, lineHeight: 1 }}>✓</span>}
                  </span>
                  {genre}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
