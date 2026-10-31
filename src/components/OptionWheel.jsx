'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import './OptionWheel.css'

const DEFAULT_ITEMS = [
  'Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave',
  'Trance', 'Funk', 'Disco', 'Hip-Hop', 'Chillwave', 'Drum & Bass',
]

export default function OptionWheel({
  items = DEFAULT_ITEMS,
  defaultSelected = 3,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 135,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.5,
  className = '',
}) {
  const rootRef = useRef(null)
  const itemRefs = useRef([])
  const posRef = useRef(defaultSelected)
  const targetRef = useRef(defaultSelected)
  const rafRef = useRef(null)
  const lastRef = useRef(0)
  const cfgRef = useRef({})
  const onChangeRef = useRef(onChange)
  const selectedRef = useRef(defaultSelected)
  const lastNotifiedRef = useRef(defaultSelected)
  const wheelTimerRef = useRef(null)
  const dragRef = useRef(null)
  const dragMovedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const suppressClickTimerRef = useRef(null)
  const audioRef = useRef(null)
  const audioUrlRef = useRef('')
  const lastTickRef = useRef(0)
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected)
  const [isDragging, setIsDragging] = useState(false)

  const remPx = typeof window !== 'undefined'
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    : 16

  onChangeRef.current = onChange
  cfgRef.current = {
    count: items.length,
    items,
    // Match the actual rendered item size so drag distance maps predictably
    // to the visual spacing, including when CSS adjusts the displayed font.
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve, tilt, blur, fade, minOpacity, side, loop, smoothing,
    draggable, soundUrl, soundVolume,
  }

  const runFrame = useCallback((now) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05)
    lastRef.current = now
    const cfg = cfgRef.current
    const tau = Math.max(cfg.smoothing, 1) / 1000
    const k = 1 - Math.exp(-dt / tau)
    const target = targetRef.current
    const cur = posRef.current
    let next = cur + (target - cur) * k
    const settled = Math.abs(target - next) < 0.001
    if (settled) next = target
    posRef.current = next

    const els = itemRefs.current
    const n = cfg.count
    const mirror = cfg.side === 'right' ? -1 : 1
    const tiltRad = (cfg.tilt * Math.PI) / 180
    const radius = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0

    for (let i = 0; i < n; i += 1) {
      const el = els[i]
      if (!el) continue
      let d = i - next
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n
        if (d > n / 2) d -= n
      }
      const distance = Math.abs(d)
      let x = 0
      let y = d * cfg.rowH
      let rotation = 0
      if (radius > 0) {
        const angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad))
        y = radius * Math.sin(angle)
        x = -mirror * radius * (1 - Math.cos(angle)) * cfg.curve
        rotation = (mirror * angle * 180) / Math.PI
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - distance * cfg.fade))
      el.style.filter = cfg.blur > 0 ? `blur(${(distance * cfg.blur).toFixed(2)}px)` : 'none'
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(distance, 1)).toFixed(4))
    }

    rafRef.current = settled ? null : requestAnimationFrame(runFrame)
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(runFrame)
  }, [runFrame])

  const playTick = useCallback(() => {
    const { soundUrl: url, soundVolume: volume } = cfgRef.current
    if (!url) return
    const now = performance.now()
    if (now - lastTickRef.current < 70) return
    lastTickRef.current = now
    if (!audioRef.current || audioUrlRef.current !== url) {
      audioRef.current = new Audio(url)
      audioRef.current.preload = 'auto'
      audioUrlRef.current = url
    }
    const audio = audioRef.current
    audio.volume = Math.min(Math.max(volume, 0), 1)
    audio.currentTime = 0
    audio.play()?.catch(() => {})
  }, [])

  const applyTarget = useCallback((value, snap, notify = true) => {
    const cfg = cfgRef.current
    if (!cfg.count) return
    let nextValue = value
    if (!cfg.loop) nextValue = Math.min(Math.max(nextValue, 0), cfg.count - 1)
    if (snap) nextValue = Math.round(nextValue)
    targetRef.current = nextValue
    const index = ((Math.round(nextValue) % cfg.count) + cfg.count) % cfg.count
    if (index !== selectedRef.current) {
      selectedRef.current = index
      setSelectedIndex(index)
      playTick()
    }
    // During a drag, update the wheel visually but do not navigate away.
    // Notify the parent only when the interaction is committed/snapped.
    if (notify && snap && index !== lastNotifiedRef.current) {
      lastNotifiedRef.current = index
      onChangeRef.current?.(index, cfg.items[index])
    }
    startLoop()
  }, [startLoop, playTick])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      const cfg = cfgRef.current
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH))
      applyTarget(targetRef.current + step, false)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true, false), 140)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    }
  }, [applyTarget])

  const handlePointerDown = useCallback((event) => {
    if (!cfgRef.current.draggable) return
    dragRef.current = { y: event.clientY, start: targetRef.current, id: event.pointerId }
    dragMovedRef.current = false
    suppressClickRef.current = false
    if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current)
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch {}
    setIsDragging(true)
  }, [])

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaY = event.clientY - drag.y
    if (!dragMovedRef.current && Math.abs(deltaY) > 8) {
      dragMovedRef.current = true
      suppressClickRef.current = true
      rootRef.current?.setPointerCapture?.(drag.id)
    }
    // Slightly damp the gesture so a short swipe doesn't skip past the
    // option the user is aiming for. The release then snaps to the nearest row.
    if (dragMovedRef.current) {
      const sensitivity = 1
      applyTarget(drag.start - (deltaY * sensitivity) / cfgRef.current.rowH, false, false)
    }
  }, [applyTarget])

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (dragMovedRef.current) {
      applyTarget(targetRef.current, true, false)
      // iOS can dispatch a synthetic click after pointer release. Ignore only
      // that immediate click, then restore normal tap-to-select behavior.
      if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current)
      suppressClickTimerRef.current = setTimeout(() => {
        suppressClickRef.current = false
        dragMovedRef.current = false
      }, 220)
    }
  }, [applyTarget])

  const handleItemClick = useCallback((index) => {
    if (suppressClickRef.current || dragMovedRef.current) return
    const cfg = cfgRef.current
    if (!cfg.count) return
    const current = targetRef.current
    let delta = index - (((current % cfg.count) + cfg.count) % cfg.count)
    if (cfg.loop && cfg.count > 1) {
      if (delta > cfg.count / 2) delta -= cfg.count
      else if (delta < -cfg.count / 2) delta += cfg.count
    }
    // A category opens only from an intentional click/tap, never from drag release.
    applyTarget(current + delta, true, false)
    lastNotifiedRef.current = index
    onChangeRef.current?.(index, cfg.items[index])
  }, [applyTarget])

  const handleKeyDown = useCallback((event) => {
    let delta = null
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -1
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = 1
    if (delta == null) return
    event.preventDefault()
    applyTarget(Math.round(targetRef.current) + delta, true)
  }, [applyTarget])

  useEffect(() => {
    const initial = items.length ? Math.min(Math.max(defaultSelected, 0), items.length - 1) : 0
    posRef.current = initial
    targetRef.current = initial
    selectedRef.current = initial
    lastNotifiedRef.current = initial
    setSelectedIndex(initial)
    applyTarget(initial, false)
  }, [items, defaultSelected, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, applyTarget])

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    audioRef.current?.pause()
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current)
  }, [])

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${isDragging ? ' option-wheel--dragging' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ow-text-color': textColor,
        '--ow-active-color': activeColor,
        '--ow-font-size': `${fontSize}rem`,
        '--ow-inset': `${inset}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          ref={(element) => { itemRefs.current[index] = element }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
