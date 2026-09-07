'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Navbar from '../../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StagingRow {
  id: string
  title: string
  starts_at: string
  venue_id: string | null
  venues: { name: string } | null
  source: string
  external_id: string
  ticket_url: string | null
  image_url: string | null
  description: string | null
  genre_tags: string[]
  review_status: string
  created_at: string
  url: string | null
}

type FilterStatus = 'pending' | 'approved' | 'rejected'
type FilterSource = '' | 'resident_advisor' | 'bilese_paradize'

const SOURCE_LABELS: Record<FilterSource, string> = {
  '': 'All sources',
  'resident_advisor': 'RA',
  'bilese_paradize': 'Biļešu Paradīze',
}

export default function StagingReviewPage() {
  const [rows, setRows] = useState<StagingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<FilterStatus>('pending')
  const [source, setSource] = useState<FilterSource>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    fetchRows()
  }, [page, status, source]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAuthError('Not logged in.'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      setAuthError('Access denied — admin only.')
      setLoading(false)
    }
  }

  async function fetchRows() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const params = new URLSearchParams({ status, page: String(page) })
    if (source) params.set('source', source)
    const res = await fetch(`/api/admin/staging?${params}`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })
    const json = await res.json()
    if (res.ok) { setRows(json.rows ?? []); setTotal(json.total ?? 0) }
    setLoading(false)
  }

  async function act(id: string, action: 'approve' | 'reject') {
    setActionLoading(id)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/admin/staging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ id, action }),
    })
    setActionLoading(null)
    fetchRows()
  }

  if (authError) return (
    <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-mono, monospace)' }}>
      <Navbar />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, position: 'absolute' }}>{authError}</p>
    </main>
  )

  const totalPages = Math.ceil(total / 50)

  return (
    <>
      <style>{`
        .stg-page-pad { padding: 24px 16px 80px; }
        @media (min-width: 600px) { .stg-page-pad { padding: 40px 32px 80px; } }
        .stg-tab { font-family: var(--font-space-mono, monospace); }
        .stg-tab:hover { background: rgba(255,255,255,0.12) !important; }
        .stg-approve:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .stg-reject:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .stg-approve, .stg-reject { transition: all 0.2s ease; }
        .stg-card { transition: box-shadow 0.25s ease; }
        .stg-card:hover { box-shadow: 0 0 0 1px rgba(255,26,26,0.4), 0 0 20px 4px rgba(255,26,26,0.15); }
      `}</style>

      <main style={{ minHeight: '100vh', background: '#000', fontFamily: 'var(--font-space-mono, monospace)' }}>
        <Navbar />

        <div className="stg-page-pad" style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>Admin</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
            Event Staging Queue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 28, fontSize: 13 }}>
            {total} row{total !== 1 ? 's' : ''} · Review imported events before they go live.
          </p>

          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['pending', 'approved', 'rejected'] as FilterStatus[]).map(s => (
              <button
                key={s}
                className="stg-tab"
                onClick={() => { setStatus(s); setPage(1) }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.09)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  background: status === s ? 'white' : 'rgba(255,255,255,0.03)',
                  color: status === s ? '#000' : 'white',
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Source filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginRight: 4 }}>Source:</span>
            {(['', 'resident_advisor', 'bilese_paradize'] as FilterSource[]).map(src => (
              <button
                key={src || 'all'}
                className="stg-tab"
                onClick={() => { setSource(src); setPage(1) }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.09)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  background: source === src ? 'rgba(255,26,26,0.15)' : 'rgba(255,255,255,0.03)',
                  color: source === src ? '#ff1a1a' : 'rgba(255,255,255,0.5)',
                }}
              >
                {SOURCE_LABELS[src]}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          ) : rows.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>No {status} events.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rows.map(row => (
                <div key={row.id} className="stg-card" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 18,
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: row.image_url ? '100px 1fr auto' : '1fr auto',
                  gap: 16,
                  alignItems: 'start',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #ff1a1a, transparent)' }} />

                  {row.image_url && (
                    <img
                      src={row.image_url}
                      alt=""
                      style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}

                  <div>
                    <p style={{ fontWeight: 900, fontSize: 17, color: 'white', marginBottom: 6, letterSpacing: 0.5 }}>{row.title}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      📅 {new Date(row.starts_at).toLocaleString('en-GB', { timeZone: 'Europe/Riga', dateStyle: 'medium', timeStyle: 'short' })}
                      {row.venues?.name ? ` · ${row.venues.name}` : ''}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                      Source: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{row.source}</strong> · ID: {row.external_id}
                    </p>
                    {row.genre_tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {row.genre_tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,26,26,0.15)', color: '#ff1a1a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {row.description && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4, lineHeight: 1.6 }}>
                        {row.description.slice(0, 200)}{row.description.length > 200 ? '…' : ''}
                      </p>
                    )}
                    {row.url && (
                      <a href={row.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#ff1a1a', marginTop: 8, display: 'inline-block', fontWeight: 600 }}>
                        View source ↗
                      </a>
                    )}
                  </div>

                  {status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 90 }}>
                      <button
                        className="stg-approve"
                        onClick={() => act(row.id, 'approve')}
                        disabled={actionLoading === row.id}
                        style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-space-mono, monospace)' }}
                      >
                        {actionLoading === row.id ? '…' : 'Approve'}
                      </button>
                      <button
                        className="stg-reject"
                        onClick={() => act(row.id, 'reject')}
                        disabled={actionLoading === row.id}
                        style={{ background: '#ff1a1a', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-space-mono, monospace)' }}
                      >
                        {actionLoading === row.id ? '…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 28, justifyContent: 'center', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-space-mono, monospace)', fontSize: 13 }}
              >
                ← Prev
              </button>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-space-mono, monospace)', fontSize: 13 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
