import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'
import './Navbar.css'

function Brand({ onHome }) {
  return (
    <a
      className="evolv-brand"
      href="/"
      aria-label="EVOLV home"
      onClick={(event) => {
        event.preventDefault()
        onHome()
      }}
    >
      <img className="evolv-brand-svg" src="/evolv-mark.svg" alt="" aria-hidden="true" />
      <span>EVOLV</span>
    </a>
  )
}

export default function Navbar({ onStart, onSignIn, onFeatures, onAreas, onPricing, onContact, onHome, menuOpen, setMenuOpen }) {
  const open = menuOpen
  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY
      if (open) return
      if (current < 40) setVisible(true)
      else if (current > lastScroll.current + 3) {
        setVisible(false)
      } else if (current < lastScroll.current - 3) setVisible(true)
      lastScroll.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function close() { setMenuOpen(false) }

  function run(action) {
    close()
    action()
  }

  useEffect(() => {
    if (open) setVisible(true)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav className={open ? 'evolv-nav is-menu-open' : (visible ? 'evolv-nav is-visible' : 'evolv-nav is-hidden')}>
        <Brand onHome={onHome} />
        <div className="evolv-nav-links" aria-label="Primary navigation">
          <a href="#story">Why EVOLV</a>
          <button type="button" onClick={onFeatures}>Features</button>
          <button type="button" onClick={onAreas}>Growth areas</button>
          <button type="button" onClick={onPricing}>Pricing</button>
          <button type="button" onClick={onContact}>Contact</button>
        </div>
        <div className="evolv-nav-actions">
          <button type="button" className="evolv-start" onClick={onStart}>Get started <ArrowRight size={15} /></button>
          <button type="button" className={open ? 'evolv-menu-toggle is-open' : 'evolv-menu-toggle'} onClick={() => setMenuOpen(v => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            <span /><span />
          </button>
        </div>
      </nav>

      {open && createPortal(
        <div className="evolv-menu-layer" role="dialog" aria-modal="true" aria-label="EVOLV navigation menu">
          <div className="evolv-mobile-menu is-open">
            <a href="#story" onClick={close}>Why EVOLV</a>
            <button type="button" onClick={() => run(onFeatures)}>Features</button>
            <button type="button" onClick={() => run(onAreas)}>Growth areas</button>
            <button type="button" onClick={() => run(onPricing)}>Pricing</button>
            <button type="button" onClick={() => run(onContact)}>Contact</button>
            <button type="button" className="evolv-mobile-sign-in" onClick={() => run(onSignIn)}>Sign in</button>            <button type="button" className="evolv-mobile-start" onClick={() => run(onStart)}>Get started <ArrowRight size={15} /></button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
