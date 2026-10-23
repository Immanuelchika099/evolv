import { useEffect, useRef } from 'react'
import './BlinkingSquares.css'

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map(char => char + char).join('') : value
  const number = Number.parseInt(normalized, 16)
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 }
}

export default function BlinkingSquares({
  direction = 'top',
  gridSize = 58,
  squareSize = 0.48,
  fadeStart = 0,
  fadeEnd = 1,
  falloff = 1.6,
  minBrightness = 0.28,
  twinkleSpeed = 0.7,
  twinkleStrength = 0.55,
  intensity = 0.65,
  opacity = 0.42,
  squareColor = 'var(--color-accent-blue)',
  dpr = 1.5,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !parent || !ctx) return

    let frameId
    let resizeObserver
    let cells = []
    let width = 0
    let height = 0
    const rgb = hexToRgb(squareColor)

    function resize() {
      const rect = parent.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, dpr)
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      const cellSize = Math.max(width, height) / Math.max(8, Math.round(gridSize))
      const columns = Math.ceil(width / cellSize)
      const rows = Math.ceil(height / cellSize)
      cells = Array.from({ length: columns * rows }, (_, index) => ({
        x: index % columns,
        y: Math.floor(index / columns),
        phase: Math.random() * Math.PI * 2,
        speed: 0.65 + Math.random() * 0.7,
      }))
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height)
      const cellSize = Math.max(width, height) / Math.max(8, Math.round(gridSize))
      const size = cellSize * squareSize
      const offset = (cellSize - size) / 2
      const timeSeconds = time / 1000
      const rows = Math.max(1, Math.ceil(height / cellSize) - 1)

      for (const cell of cells) {
        const px = cell.x * cellSize + offset
        const py = cell.y * cellSize + offset
        const normalized = direction === 'top'
          ? 1 - cell.y / rows
          : cell.y / rows
        const fade = Math.min(1, Math.max(0, (normalized - fadeStart) / Math.max(0.001, fadeEnd - fadeStart)))
        const density = Math.pow(fade, falloff)
        if (density <= 0.01 || px > width || py > height) continue

        const wave = 0.5 + 0.5 * Math.sin(cell.phase + timeSeconds * Math.PI * 2 * twinkleSpeed * cell.speed)
        const brightness = minBrightness + (1 - minBrightness) * (1 - twinkleStrength + wave * twinkleStrength)
        const alpha = Math.min(1, density * brightness * intensity * opacity)
        if (alpha <= 0.005) continue
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
        ctx.fillRect(px, py, size, size)
      }
      frameId = requestAnimationFrame(draw)
    }

    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(parent)
    frameId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
    }
  }, [direction, gridSize, squareSize, fadeStart, fadeEnd, falloff, minBrightness, twinkleSpeed, twinkleStrength, intensity, opacity, squareColor, dpr])

  return <canvas ref={canvasRef} className="evolv-blinking-squares" aria-hidden="true" />
}
