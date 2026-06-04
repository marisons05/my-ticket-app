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
          backgroundColor: loading ? '#374151' : '#7c3aed',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '10px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Redirecting to payment...' : `Pay €${price}`}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
    </div>
  )
}