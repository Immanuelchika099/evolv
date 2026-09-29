import { useEffect, useRef, useState } from 'react'
import './HoldButton.css'

function HoldButton({
  children,
  doneLabel = 'Done',
  backgroundColor = '#27272a',
  fillColor = '#EF4444',
  textColor = '#f5f5f5',
  fillTextColor = '#ffffff',
  size = 'md',
  radius = 14,
  fillDirection = 'right',
  holdTime = 2000,
  releaseTime = 200,
  pressScale = 0.97,
  wave = true,
  waveAmplitude = 6,
  glow = true,
  resetAfter = 1200,
  onHold,
  disabled = false,
  className = '',
}) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [pressing, setPressing] = useState(false)
  const timerRef = useRef(null)
  const rafRef = useRef(null)
  const startRef = useRef(0)
  const completedRef = useRef(false)

  function clearHold() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
  }

  function finish() {
    if (completedRef.current) return
    completedRef.current = true
    clearHold()
    setPressing(false)
    setProgress(1)
    setDone(true)
    onHold?.()
    if (resetAfter > 0) {
      window.setTimeout(() => {
        completedRef.current = false
        setDone(false)
        setProgress(0)
      }, resetAfter)
    }
  }

  function tick(now) {
    const elapsed = now - startRef.current
    const next = Math.min(1, elapsed / holdTime)
    setProgress(next)
    if (next >= 1) {
      finish()
      return
    }
    rafRef.current = window.requestAnimationFrame(tick)
  }

  function startHold(event) {
    if (disabled || done || completedRef.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    clearHold()
    completedRef.current = false
    setPressing(true)
    setProgress(0)
    startRef.current = performance.now()
    rafRef.current = window.requestAnimationFrame(tick)
    timerRef.current = window.setTimeout(finish, holdTime + 30)
  }

  function cancelHold() {
    if (completedRef.current) return
    clearHold()
    setPressing(false)
    window.setTimeout(() => setProgress(0), releaseTime)
  }

  useEffect(() => () => clearHold(), [])

  const direction = fillDirection === 'left' ? 'to left' : fillDirection === 'up' ? 'to top' : fillDirection === 'down' ? 'to bottom' : 'to right'
  const fillStyle = {
    '--hold-bg': backgroundColor,
    '--hold-fill': fillColor,
    '--hold-text': textColor,
    '--hold-fill-text': fillTextColor,
    '--hold-radius': `${radius}px`,
    '--hold-progress': `${progress * 100}%`,
    '--hold-scale': pressing ? pressScale : 1,
    '--hold-wave': `${waveAmplitude}px`,
    '--hold-direction': direction,
  }

  return (
    <button
      type="button"
      className={`hold-button hold-button-${size} ${pressing ? 'is-pressing' : ''} ${done ? 'is-done' : ''} ${glow ? 'has-glow' : ''} ${wave ? 'has-wave' : ''} ${className}`}
      style={fillStyle}
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <span className="hold-button-fill" aria-hidden="true" />
      <span className="hold-button-label">
        <span className="hold-button-normal">{done ? doneLabel : children}</span>
        <span className="hold-button-progress" aria-hidden="true">{done ? doneLabel : children}</span>
      </span>
    </button>
  )
}

export default HoldButton
