'use client'

import { useState } from 'react'

type Props = {
  src?: string | null
  alt: string
  seed: string
  height?: number
  style?: React.CSSProperties
}

function seedToNum(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h) % 900 + 10
}

export default function EventImage({ src, alt, seed, height = 180, style }: Props) {
  const picsum = `https://picsum.photos/id/${seedToNum(seed)}/600/400`
  const [imgSrc, setImgSrc] = useState(src || picsum)
  const [useFallback, setUseFallback] = useState(false)

  if (useFallback) {
    return (
      <div style={{
        width: '100%', height,
        background: 'linear-gradient(135deg, #b47dff44, #7c3aed66)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>
        <span style={{ fontSize: 48, opacity: 0.5 }}>🎵</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== picsum) {
          setImgSrc(picsum)
        } else {
          setUseFallback(true)
        }
      }}
      style={{ width: '100%', height, objectFit: 'cover', display: 'block', ...style }}
    />
  )
}
