import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import './CardNav.css'

function CardNav({ items = [], open }) {
  const panelRef = useRef(null)
  const cardsRef = useRef([])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const cards = cardsRef.current.filter(Boolean)
    const isMobile = window.matchMedia('(max-width: 768px)').matches

    gsap.killTweensOf([panel, ...cards])

    if (open) {
      gsap.set(panel, {
        visibility: 'visible',
        pointerEvents: 'auto',
        height: 0,
        opacity: 0,
        y: -8
      })

      gsap.set(cards, {
        y: 28,
        opacity: 0
      })

      const targetHeight = isMobile
        ? panel.querySelector('.evolv-card-nav-content')?.scrollHeight + 16 || 420
        : 304

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      })

      tl.to(panel, {
        height: targetHeight,
        opacity: 1,
        y: 0,
        duration: 0.42
      })

      tl.to(cards, {
        y: 0,
        opacity: 1,
        duration: 0.42,
        stagger: 0.07
      }, '-=0.2')

      return () => tl.kill()
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' }
    })

    tl.to(cards, {
      y: 20,
      opacity: 0,
      duration: 0.18,
      stagger: 0.035
    })

    tl.to(panel, {
      height: 0,
      opacity: 0,
      y: -8,
      duration: 0.3,
      onComplete: () => {
        panel.style.visibility = 'hidden'
        panel.style.pointerEvents = 'none'
      }
    }, '-=0.06')

    return () => tl.kill()
  }, [open, items.length])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!panelRef.current || !open) return
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      const targetHeight = isMobile
        ? panelRef.current.querySelector('.evolv-card-nav-content')?.scrollHeight + 16 || 420
        : 304

      gsap.to(panelRef.current, {
        height: targetHeight,
        duration: 0.25,
        ease: 'power2.out'
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open])

  return (
    <div
      ref={panelRef}
      className="evolv-card-nav-panel"
      aria-hidden={!open}
    >
      <div className="evolv-card-nav-content">
        {(items || []).slice(0, 3).map((item, idx) => (
          <div
            key={`${item.label}-${idx}`}
            ref={element => {
              cardsRef.current[idx] = element
            }}
            className="evolv-nav-card"
            style={{
              backgroundColor: item.bgColor,
              color: item.textColor
            }}
          >
            <div className="evolv-nav-card-label">{item.label}</div>

            <div className="evolv-nav-card-links">
              {(item.links || []).map((link, linkIndex) => {
                const content = (
                  <>
                    <ArrowUpRight
                      className="evolv-nav-card-link-icon"
                      aria-hidden="true"
                    />
                    <span>{link.label}</span>
                  </>
                )

                if (link.href) {
                  return (
                    <a
                      key={`${link.label}-${linkIndex}`}
                      className="evolv-nav-card-link"
                      href={link.href}
                      aria-label={link.ariaLabel}
                      onClick={link.onClick}
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <button
                    key={`${link.label}-${linkIndex}`}
                    type="button"
                    className="evolv-nav-card-link"
                    aria-label={link.ariaLabel}
                    onClick={link.onClick}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CardNav
