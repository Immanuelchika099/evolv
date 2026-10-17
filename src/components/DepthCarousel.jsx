import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import './DepthCarousel.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export default function DepthCarousel({
  items = [],
  renderItem,
  cardWidth = 340,
  cardHeight = 310,
  radius = 22,
  depth = 115,
  spread = 36,
  tilt = 7,
  perspective = 1400,
  visibleCards = 3,
  falloff = 0.22,
  blur = 1.5,
  duration = 850,
  ease = 'power3.out',
  autoplay = true,
  autoplayDelay = 10000,
  loop = true,
  showControls = false,
  showIndicators = true,
  onChange,
  className = '',
}) {
  const data = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const rootRef = useRef(null)
  const cardRefs = useRef([])
  const tweenRef = useRef(null)
  const timerRef = useRef(null)
  const positionRef = useRef(0)
  const focusRef = useRef(0)
  const dragRef = useRef(null)
  const configRef = useRef({})
  const callbackRef = useRef(onChange)
  const scaleRef = useRef(1)
  const reducedRef = useRef(false)
  const [active, setActive] = useState(0)

  callbackRef.current = onChange
  configRef.current = { count: data.length, depth, spread, tilt, visibleCards, falloff, blur, duration, ease, loop, cardWidth }

  const layout = useCallback(position => {
    const config = configRef.current
    const count = config.count
    if (!count) return
    for (let index = 0; index < count; index += 1) {
      const card = cardRefs.current[index]
      if (!card) continue
      let distance = index - position
      if (config.loop && count > 1) {
        distance = ((distance % count) + count) % count
        if (distance > count / 2) distance -= count
      }
      const absoluteDistance = Math.abs(distance)
      const visible = absoluteDistance <= config.visibleCards + 0.5
      const x = config.spread * distance
      const z = -config.depth * absoluteDistance
      const rotateY = config.tilt * Math.sign(distance) * Math.min(1, absoluteDistance)
      const opacity = visible ? Math.max(0.68, 1 - absoluteDistance * 0.08) : 0
      const brightness = Math.max(0.48, 1 - absoluteDistance * config.falloff)
      const blurAmount = Math.min(config.blur, absoluteDistance / Math.max(1, config.visibleCards) * config.blur)
      card.style.transform = `translate(-50%, -50%) scale(${scaleRef.current}) translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg)`
      card.style.opacity = String(opacity)
      card.style.filter = `brightness(${brightness.toFixed(2)}) blur(${blurAmount.toFixed(2)}px)`
      card.style.zIndex = String(1000 - Math.round(absoluteDistance * 10))
      card.style.pointerEvents = visible && opacity > 0.05 ? 'auto' : 'none'
      card.setAttribute('aria-hidden', String(index !== active))
    }
  }, [active])

  const moveTo = useCallback((rawIndex, animate = true) => {
    const config = configRef.current
    const count = config.count
    if (!count) return
    const index = config.loop ? ((rawIndex % count) + count) % count : clamp(rawIndex, 0, count - 1)
    let delta = index - positionRef.current
    if (config.loop && count > 1) {
      delta = ((delta % count) + count) % count
      if (delta > count / 2) delta -= count
    }
    tweenRef.current?.kill()
    const proxy = { position: positionRef.current }
    tweenRef.current = gsap.to(proxy, {
      position: positionRef.current + delta,
      duration: animate && !reducedRef.current ? config.duration / 1000 : 0,
      ease: config.ease,
      onUpdate: () => {
        positionRef.current = proxy.position
        layout(proxy.position)
      },
      onComplete: () => {
        positionRef.current = config.loop ? ((proxy.position % count) + count) % count : index
        layout(positionRef.current)
      },
    })
    if (index !== focusRef.current) {
      focusRef.current = index
      setActive(index)
      callbackRef.current?.(index, data[index])
    }
  }, [data, layout])

  const navigate = useCallback(step => moveTo(focusRef.current + step), [moveTo])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const resize = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width || root.clientWidth
      const availableCardWidth = Math.max(220, width - 26)
      scaleRef.current = clamp(availableCardWidth / cardWidth, 0.68, 1)
      layout(positionRef.current)
    })
    resize.observe(root)
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => resize.disconnect()
  }, [cardWidth, spread, layout])

  useEffect(() => {
    layout(positionRef.current)
  }, [layout, data.length, depth, spread, tilt, visibleCards, falloff, blur, cardWidth, cardHeight, radius])

  useEffect(() => {
    if (!autoplay || reducedRef.current || data.length < 2) return
    const root = rootRef.current
    let paused = false
    const pause = () => { paused = true }
    const resume = () => { paused = false }
    timerRef.current = window.setInterval(() => {
      if (!paused) navigate(1)
    }, Math.max(autoplayDelay, 1000))
    root?.addEventListener('mouseenter', pause)
    root?.addEventListener('mouseleave', resume)
    root?.addEventListener('focusin', pause)
    root?.addEventListener('focusout', resume)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      root?.removeEventListener('mouseenter', pause)
      root?.removeEventListener('mouseleave', resume)
      root?.removeEventListener('focusin', pause)
      root?.removeEventListener('focusout', resume)
    }
  }, [autoplay, autoplayDelay, data.length, navigate])

  useEffect(() => () => {
    tweenRef.current?.kill()
    if (timerRef.current) window.clearInterval(timerRef.current)
  }, [])

  const onPointerDown = event => {
    if (data.length < 2) return
    tweenRef.current?.kill()
    dragRef.current = { startX: event.clientX, startPosition: positionRef.current, moved: false, pointerId: event.pointerId }
  }
  const onPointerMove = event => {
    const drag = dragRef.current
    if (!drag) return
    const deltaX = event.clientX - drag.startX
    if (Math.abs(deltaX) > 5) {
      drag.moved = true
      rootRef.current?.setPointerCapture?.(drag.pointerId)
    }
    if (!drag.moved) return
    positionRef.current = drag.startPosition - deltaX / Math.max(cardWidth * 0.58 * scaleRef.current, 50)
    layout(positionRef.current)
  }
  const onPointerUp = () => {
    if (!dragRef.current) return
    const drag = dragRef.current
    dragRef.current = null
    if (drag.moved) moveTo(Math.round(positionRef.current))
  }
  const onKeyDown = event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1) }
  }

  if (!data.length) return null

  return (
    <div
      ref={rootRef}
      className={`depth-carousel ${className}`.trim()}
      style={{ '--dc-perspective': `${perspective}px`, '--dc-card-height': `${cardHeight}px`, '--dc-radius': `${radius}px` }}
      role="group"
      aria-roledescription="carousel"
      aria-label="Personalized AI insights"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="depth-carousel__stage">
        {data.map((item, index) => (
          <article
            key={item.id || item.title || index}
            ref={element => { cardRefs.current[index] = element }}
            className="depth-carousel__card"
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            aria-roledescription="slide"
            aria-label={`Insight ${index + 1} of ${data.length}`}
            aria-hidden={active !== index}
            onClick={() => {
              if (dragRef.current?.moved) return
              moveTo(index)
            }}
          >
            {renderItem ? renderItem(item, index, active === index) : <div className="depth-carousel__content"><h3>{item.title}</h3><p>{item.observation}</p></div>}
          </article>
        ))}
      </div>
      {showControls && data.length > 1 && (
        <>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--prev" aria-label="Previous insight" onClick={() => navigate(-1)}>‹</button>
          <button type="button" className="depth-carousel__arrow depth-carousel__arrow--next" aria-label="Next insight" onClick={() => navigate(1)}>›</button>
        </>
      )}
      {showIndicators && data.length > 1 && (
        <div className="depth-carousel__dots" aria-label="Insight slides">
          {data.map((item, index) => <button key={item.id || item.title || index} type="button" aria-label={`Show insight ${index + 1}`} aria-current={active === index ? 'true' : undefined} className={`depth-carousel__dot${active === index ? ' is-active' : ''}`} onClick={() => moveTo(index)} />)}
        </div>
      )}
    </div>
  )
}
