'use client'

import { useState } from 'react'

export default function PayButton({ eventId, eventTitle, price }: {
  eventId: number | string
  eventTitle: string
  price: number
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, eventTitle, price }),
      })
      if (!res.ok) throw new Error('Failed to create checkout session')
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          background: loading ? 'rgba(255,255,255,0.1)' : 'white',
          color: loading ? 'rgba(255,255,255,0.5)' : 'black',
          padding: '15px 28px',
          borderRadius: '12px',
          border: 'none',
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: 0.5,
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'filter 0.2s, transform 0.2s',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'var(--font-space-mono, monospace)',
        }}
      >
        {loading ? 'Redirecting to payment...' : `Pay €${price}`}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
    </div>
  )
}