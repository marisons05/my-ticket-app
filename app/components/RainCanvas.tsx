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

export default function RainCanvas() {
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
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDrops()
    }

    function initDrops() {
      if (!canvas) return
      drops = []
      const count = Math.floor(canvas.width / 5)
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.4 + Math.random() * 1.2,
          length: 20 + Math.random() * 120,
          opacity: 0.08 + Math.random() * 0.35,
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

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  )
}
