'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export default function EventSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    startTransition(() => {
      if (q) {
        router.push(`/events?q=${encodeURIComponent(q)}`)
      } else {
        router.push('/events')
      }
    })
  }, [router])

  return (
    <input
      type="search"
      defaultValue={params.get('q') ?? ''}
      onChange={handleChange}
      placeholder="Search events…"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        padding: '10px 16px',
        color: 'white',
        fontSize: 14,
        fontFamily: 'var(--font-space-mono, monospace)',
        outline: 'none',
        width: 260,
      }}
    />
  )
}
