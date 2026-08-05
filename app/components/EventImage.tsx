'use client'

import { useState } from 'react'

type Props = {
  src?: string | null
  alt: string
  seed?: string
  height?: number
  style?: React.CSSProperties
}

export default function EventImage({ src, alt, height = 180, style }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: '100%', height, objectFit: 'cover', display: 'block', ...style }}
    />
  )
}
