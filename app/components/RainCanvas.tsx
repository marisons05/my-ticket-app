'use client'

import { useEffect, useRef } from 'react'

interface Drop {
  x: number
  y: number
  speed: number
  length: number
  opacity: number
  width: number
}

interface Props {
  density?: number   // divisor for drop count — higher = fewer drops (default 5)
  maxOpacity?: number // max drop opacity (default 0.35)
  maxSpeed?: number   // max additional speed (default 1.2)
  fill?: boolean      // fill the parent element instead of the whole viewport (default false)
}

export default function RainCanvas({ density = 5, maxOpacity = 0.35, maxSpeed = 1.2, fill = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let drops: Drop[] = []

    function resize() {
      if (!canvas) return
      if (fill && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
      } else {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
      initDrops()
    }

    function initDrops() {
      if (!canvas) return
      drops = []
      const count = Math.floor(canvas.width / density)
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.4 + Math.random() * maxSpeed,
          length: 20 + Math.random() * 120,
          opacity: 0.04 + Math.random() * maxOpacity,
          width: 0.5 + Math.random() * 1.2,
        })
      }
    }

    function draw() {
      if (!canvas || !ctx) return

      // Fade the previous frame
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const drop of drops) {
        const gradient = ctx.createLinearGradient(drop.x, drop.y - drop.length, drop.x, drop.y)
        gradient.addColorStop(0, `rgba(180,0,0,0)`)
        gradient.addColorStop(0.5, `rgba(230,0,0,${drop.opacity * 0.7})`)
        gradient.addColorStop(1, `rgba(255,30,30,${drop.opacity})`)

        ctx.beginPath()
        ctx.strokeStyle = gradient
        ctx.lineWidth = drop.width
        ctx.moveTo(drop.x, drop.y - drop.length)
        ctx.lineTo(drop.x, drop.y)
        ctx.stroke()

        drop.y += drop.speed
        if (drop.y - drop.length > canvas.height) {
          drop.y = -drop.length
          drop.x = Math.random() * canvas.width
          drop.speed = 0.4 + Math.random() * 1.2
          drop.opacity = 0.08 + Math.random() * 0.35
        }
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    let ro: ResizeObserver | undefined
    if (fill && canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize)
      ro.observe(canvas.parentElement)
    } else {
      window.addEventListener('resize', resize)
    }

    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [fill])

  return (
    <canvas
      ref={canvasRef}
      style={
        fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }
          : { position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }
      }
      aria-hidden
    />
  )
}
