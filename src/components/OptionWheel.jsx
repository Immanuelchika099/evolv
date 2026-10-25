import { useEffect, useRef, useState } from 'react'
import './OptionWheel.css'

/**
 * Lightweight text-only curved option wheel for Evolv's quick log menu.
 * Keeps the OptionWheel API used in the original reference snippet.
 */
export default function OptionWheel({
  items = [],
  defaultSelected = 0,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'right',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl,
  soundVolume = 0.5,
  onChange,
}) {
  const [selected, setSelected] = useState(defaultSelected)
  const [offset, setOffset] = useState(0)
  const startY = useRef(null)
  const startOffset = useRef(0)
  const wheelRef = useRef(null)
  const soundRef = useRef(null)

  useEffect(() => {
    setSelected(defaultSelected)
  }, [defaultSelected])

  useEffect(() => {
    if (!soundUrl) return
    const audio = new Audio(soundUrl)
    audio.preload = 'auto'
    audio.volume = Math.max(0, Math.min(1, soundVolume))
    soundRef.current = audio
    return () => {
      audio.pause()
      soundRef.current = null
    }
  }, [soundUrl, soundVolume])

  function normalize(index) {
    if (!items.length) return 0
    return loop ? (index + items.length) % items.length : Math.max(0, Math.min(items.length - 1, index))
  }

  function choose(index) {
    const next = normalize(index)
    setSelected(next)
    setOffset(0)
    onChange?.(next, items[next])
    if (soundRef.current) {
      try {
        soundRef.current.currentTime = 0
        soundRef.current.play().catch(() => {})
      } catch {}
    }
  }

  function onPointerDown(event) {
    if (!draggable) return
    startY.current = event.clientY
    startOffset.current = offset
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function onPointerMove(event) {
    if (startY.current == null || !draggable) return
    const delta = startY.current - event.clientY
    const steps = Math.round(delta / Math.max(20, fontSize * 5))
    setOffset(steps)
  }

  function onPointerUp() {
    if (startY.current == null) return
    const nextOffset = offset
    startY.current = null
    if (nextOffset) choose(selected + nextOffset)
    else setOffset(0)
  }

  const activeIndex = normalize(selected + offset)

  return (
    <div
      ref={wheelRef}
      className={`option-wheel option-wheel-${side}`}
      style={{
        '--wheel-font-size': `${fontSize}rem`,
        '--wheel-spacing': `${spacing}rem`,
        '--wheel-curve': curve,
        '--wheel-tilt': `${tilt}deg`,
        '--wheel-blur': `${blur}px`,
        '--wheel-fade': fade,
        '--wheel-smoothing': `${smoothing}ms`,
        '--wheel-inset': `${inset}px`,
        '--wheel-text': textColor,
        '--wheel-active': activeColor,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="listbox"
      aria-label="Choose what to log"
    >
      {items.map((item, index) => {
        const distance = index - activeIndex
        const absDistance = Math.abs(distance)
        const isActive = index === activeIndex
        const signedCurve = distance * curve
        const fadeOpacity = Math.max(0.18, 1 - absDistance * fade)
        return (
          <button
            type="button"
            role="option"
            aria-selected={isActive}
            className={`option-wheel-item${isActive ? ' is-active' : ''}`}
            key={item}
            onClick={() => choose(index)}
            style={{
              '--item-distance': distance,
              '--item-curve': `${signedCurve * 0.38}rem`,
              '--item-rotation': `${distance * (side === 'right' ? -tilt : tilt)}deg`,
              '--item-opacity': fadeOpacity,
              '--item-blur': isActive ? '0px' : `${Math.min(blur, absDistance * 0.55)}px`,
            }}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
