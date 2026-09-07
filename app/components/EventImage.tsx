'use client'

import { useState } from 'react'
import RainCanvas from './RainCanvas'

type Props = {
  src?: string | null
  alt: string
  seed?: string
  height?: number
  style?: React.CSSProperties
}

export default function EventImage({ src, alt, height = 180, style }: Props) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
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

  // No image (or it failed to load): fall back to the site's own rain
  // background (RainCanvas, same as the landing page and finder) instead of
  // a blank void.
  return (
    <div
      style={{
        width: '100%',
        height,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
        ...style,
      }}
    >
      <RainCanvas fill density={3} maxOpacity={0.5} maxSpeed={1.5} />
    </div>
  )
}
