import { useEffect, useRef } from 'react'

/**
 * Lightweight canvas-based crystal/plasma sphere for the welcome hero.
 * Keeps the effect dependency-free and caps particle work on smaller devices.
 */
export default function CrystalizedBall({
  preset = 'plasma',
  color = '#E85A27',
  size = 0.7,
  crackle = 0.55,
  fill = 0.5,
  interactive = true,
  hoverStrength = 0.55,
  strands = 6,
  flares = 0.55,
  glow = 0.72,
  sparks = 0.38,
  particleCount = 5000,
  motion = 'rise',
  particleShape = 'square',
  depth = 0.6,
  sway = 0.45,
  twinkle = 0.5,
  haze = 0.58,
  dustSpeed = 0.8,
  speed = 0.72,
  intro = true,
  paused = false,
}) {
  const canvasRef = useRef(null)
  const hostRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    const context = canvas?.getContext('2d', { alpha: true, desynchronized: true })
    if (!canvas || !host || !context) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0, y: 0, active: false }
    const state = { width: 1, height: 1, dpr: 1, frame: 0, started: performance.now(), raf: 0 }
    const random = (min, max) => min + Math.random() * (max - min)
    const isSmall = window.matchMedia('(max-width: 760px)').matches
    const count = Math.min(Math.max(Number(particleCount) || 0, 500), isSmall ? 1900 : 3400)
    const particleList = Array.from({ length: count }, (_, index) => {
      const y = 1 - (index / Math.max(count - 1, 1)) * 2
      const radius = Math.sqrt(Math.max(0, 1 - y * y))
      const angle = Math.PI * (3 - Math.sqrt(5)) * index
      return {
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        phase: random(0, Math.PI * 2),
        scale: random(0.45, 1.45),
        drift: random(0.3, 1.2),
      }
    })
    const sparksList = Array.from({ length: Math.max(28, Math.round(count * 0.025)) }, () => ({
      angle: random(0, Math.PI * 2),
      radius: random(0.78, 1.3),
      y: random(-1.25, 1.25),
      phase: random(0, Math.PI * 2),
      speed: random(0.25, 1.1),
      size: random(0.5, 1.5),
    }))
    const rgb = (() => {
      const hex = color.replace('#', '')
      const value = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex
      const number = Number.parseInt(value, 16)
      return [(number >> 16) & 255, (number >> 8) & 255, number & 255]
    })()
    const orange = (alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
    let disposed = false

    function resize() {
      const rect = host.getBoundingClientRect()
      state.width = Math.max(1, rect.width)
      state.height = Math.max(1, rect.height)
      state.dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.25 : 1.6)
      canvas.width = Math.round(state.width * state.dpr)
      canvas.height = Math.round(state.height * state.dpr)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
    }

    function draw(now) {
      if (disposed) return
      state.raf = requestAnimationFrame(draw)
      if (paused) return
      const { width, height } = state
      const elapsed = reducedMotion ? 0 : (now - state.started) * 0.00022 * speed
      const introProgress = intro && !reducedMotion ? Math.min(1, Math.max(0, (now - state.started) / 1500)) : 1
      const reveal = 1 - Math.pow(1 - introProgress, 3)
      context.clearRect(0, 0, width, height)

      const cx = width * 0.5 + (pointer.active ? pointer.x * hoverStrength * 13 : 0)
      const cy = height * 0.47 + (pointer.active ? pointer.y * hoverStrength * 9 : 0)
      const radius = Math.min(width * 0.37, height * 0.38) * size * 1.45 * reveal
      if (radius < 1) return

      const atmosphere = context.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius * (2.4 + haze))
      atmosphere.addColorStop(0, orange(0.16 * glow))
      atmosphere.addColorStop(0.35, orange(0.065 * glow))
      atmosphere.addColorStop(1, orange(0))
      context.fillStyle = atmosphere
      context.fillRect(0, 0, width, height)

      const sphereGlow = context.createRadialGradient(
        cx - radius * 0.25, cy - radius * 0.34, radius * 0.02,
        cx, cy, radius * 1.05
      )
      sphereGlow.addColorStop(0, `rgba(255, 213, 178, ${0.18 * glow})`)
      sphereGlow.addColorStop(0.3, orange(0.1 * glow))
      sphereGlow.addColorStop(0.68, orange(0.035 * glow))
      sphereGlow.addColorStop(1, orange(0))
      context.fillStyle = sphereGlow
      context.beginPath()
      context.arc(cx, cy, radius * 1.08, 0, Math.PI * 2)
      context.fill()

      context.save()
      context.beginPath()
      context.arc(cx, cy, radius, 0, Math.PI * 2)
      context.clip()
      const core = context.createRadialGradient(cx - radius * 0.28, cy - radius * 0.35, 0, cx, cy, radius)
      core.addColorStop(0, `rgba(255, 226, 201, ${0.12 * fill})`)
      core.addColorStop(0.32, orange(0.07 * fill))
      core.addColorStop(0.76, orange(0.015 * fill))
      core.addColorStop(1, 'rgba(0,0,0,0)')
      context.fillStyle = core
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      const rotationY = elapsed * (motion === 'rise' ? 0.34 : 0.2) + (pointer.active ? pointer.x * 0.22 : 0)
      const rotationX = Math.sin(elapsed * 0.65) * sway * 0.16 + (pointer.active ? pointer.y * 0.16 : 0)
      const cosY = Math.cos(rotationY)
      const sinY = Math.sin(rotationY)
      const cosX = Math.cos(rotationX)
      const sinX = Math.sin(rotationX)
      const projected = particleList.map((particle) => {
        const x1 = particle.x * cosY - particle.z * sinY
        const z1 = particle.x * sinY + particle.z * cosY
        const y1 = particle.y * cosX - z1 * sinX
        const z2 = particle.y * sinX + z1 * cosX
        return { x: x1, y: y1, z: z2, particle }
      }).sort((a, b) => a.z - b.z)

      for (const point of projected) {
        const front = (point.z + 1) / 2
        const twinkleAlpha = 0.28 + ((Math.sin(elapsed * (1 + twinkle) + point.particle.phase) + 1) * 0.5) * twinkle
        const alpha = Math.max(0.025, twinkleAlpha * (0.18 + front * 0.78) * (0.55 + crackle * 0.6))
        const px = cx + point.x * radius
        const py = cy + point.y * radius
        const particleSize = Math.max(0.55, point.particle.scale * (0.55 + front * 0.65))
        context.globalAlpha = alpha
        context.fillStyle = front > 0.78 ? `rgba(255, 225, 199, ${0.72 + flares * 0.28})` : orange(0.9)
        if (particleShape === 'square') context.fillRect(px, py, particleSize, particleSize)
        else {
          context.beginPath()
          context.arc(px, py, particleSize * 0.55, 0, Math.PI * 2)
          context.fill()
        }
      }
      context.globalAlpha = 1

      /* Fine filament strands give the sphere a living plasma structure. */
      context.globalCompositeOperation = 'lighter'
      for (let strand = 0; strand < strands; strand += 1) {
        const phase = (strand / Math.max(strands, 1)) * Math.PI * 2
        context.beginPath()
        for (let point = 0; point <= 100; point += 1) {
          const t = point / 100
          const angle = t * Math.PI * 2 + phase + elapsed * (motion === 'rise' ? 0.42 : 0.24)
          const wave = Math.sin(t * Math.PI * 6 + phase + elapsed * 0.7) * crackle * 0.045
          const r = radius * (0.72 + wave + Math.sin(t * Math.PI) * 0.08)
          const x = cx + Math.cos(angle) * r * Math.cos(phase * 0.43)
          const y = cy + Math.sin(angle) * r * (0.65 + depth * 0.35) + (t - 0.5) * radius * 0.42
          if (point === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.strokeStyle = orange(0.09 + flares * 0.08)
        context.lineWidth = 0.7 + flares * 0.5
        context.stroke()
      }
      context.restore()
      context.globalCompositeOperation = 'source-over'

      /* Occasional sparks travel upward around the edge instead of filling the whole screen. */
      for (const spark of sparksList) {
        const rise = (elapsed * spark.speed * dustSpeed + spark.phase) % 1
        const angle = spark.angle + elapsed * 0.15
        const x = cx + Math.cos(angle) * radius * spark.radius
        const y = cy + Math.sin(angle) * radius * spark.radius * 0.86 - rise * radius * 0.35
        const alpha = (0.15 + ((Math.sin(elapsed * 2 + spark.phase) + 1) * 0.5) * 0.55) * sparks
        context.globalAlpha = alpha
        context.fillStyle = spark.phase > 2 ? '#FFD6BD' : orange(1)
        context.fillRect(x, y, spark.size, spark.size * 1.7)
      }
      context.globalAlpha = 1
    }

    function onPointerMove(event) {
      if (!interactive || reducedMotion) return
      const rect = host.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      pointer.active = true
    }
    function onPointerLeave() {
      pointer.active = false
      pointer.x = 0
      pointer.y = 0
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    host.addEventListener('pointermove', onPointerMove, { passive: true })
    host.addEventListener('pointerleave', onPointerLeave, { passive: true })
    resize()
    state.raf = requestAnimationFrame(draw)

    return () => {
      disposed = true
      cancelAnimationFrame(state.raf)
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [color, size, crackle, fill, interactive, hoverStrength, strands, flares, glow, sparks, particleCount, motion, particleShape, depth, sway, twinkle, haze, dustSpeed, speed, intro, paused, preset])

  return (
    <div className="crystalized-ball" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
