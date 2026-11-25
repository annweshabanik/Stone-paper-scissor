import React, { useEffect, useRef } from 'react'

export type ClashParticleType = 'rock_shatter' | 'laser_sparks' | 'paper_confetti' | 'draw_sparks'

interface ParticleSystemProps {
  type: ClashParticleType | null
  triggerKey: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  decay: number
  rotation: number
  vRot: number
  shape: 'circle' | 'shard' | 'confetti'
}

export const ParticleCanvas: React.FC<ParticleSystemProps> = ({ type, triggerKey }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!type || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = canvas.parentElement?.clientWidth || 400)
    const height = (canvas.height = canvas.parentElement?.clientHeight || 260)

    const particles: Particle[] = []
    const originX = width / 2
    const originY = height / 2

    const count = type === 'paper_confetti' ? 36 : type === 'rock_shatter' ? 42 : 28

    const colorPalettes: Record<ClashParticleType, string[]> = {
      rock_shatter: ['#22c55e', '#86efac', '#e2e8f0', '#94a3b8', '#10b981', '#38bdf8'],
      laser_sparks: ['#38bdf8', '#06b6d4', '#e0f2fe', '#f43f5e', '#a855f7'],
      paper_confetti: ['#c084fc', '#e9d5ff', '#38bdf8', '#f472b6', '#facc15', '#4ade80'],
      draw_sparks: ['#06b6d4', '#a855f7', '#f4f4f5'],
    }

    const palette = colorPalettes[type]

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 6 + 2.5
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'rock_shatter' ? 1.5 : 0),
        size: Math.random() * 5 + 3,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape:
          type === 'paper_confetti'
            ? 'confetti'
            : type === 'rock_shatter'
            ? 'shard'
            : 'circle',
      })
    }

    let animId: number
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      let alive = false
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.alpha <= 0) continue

        alive = true
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12 // gravity
        p.vx *= 0.98 // air drag
        p.alpha -= p.decay
        p.rotation += p.vRot

        ctx.save()
        ctx.globalAlpha = Math.max(p.alpha, 0)
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.shape === 'confetti') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else if (p.shape === 'shard') {
          ctx.beginPath()
          ctx.moveTo(0, -p.size)
          ctx.lineTo(p.size * 0.8, p.size * 0.6)
          ctx.lineTo(-p.size * 0.8, p.size * 0.6)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      if (alive) {
        animId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, width, height)
      }
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      if (ctx) ctx.clearRect(0, 0, width, height)
    }
  }, [type, triggerKey])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
    />
  )
}
