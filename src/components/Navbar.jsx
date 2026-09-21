import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import './Navbar.css'

function Brand() {
  return (
    <a className="evolv-brand" href="#story" aria-label="EVOLV home">
      <span className="evolv-brand-mark"><span /></span>
      <span>EVOLV</span>
    </a>
  )
}

export default function Navbar({ onStart, onFeatures, onAreas, onPricing, onContact }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY
      if (current < 40) setVisible(true)
      else if (current > lastScroll.current + 3) {
        setVisible(false)
      } else if (current < lastScroll.current - 3) setVisible(true)
      lastScroll.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function close() { setOpen(false) }

  function run(action) {
    close()
    action()
  }

  return (
    <>
      <nav className={visible ? 'evolv-nav is-visible' : 'evolv-nav is-hidden'}>
        <Brand />
        <div className="evolv-nav-links" aria-label="Primary navigation">
          <a href="#story">Why EVOLV</a>
          <button type="button" onClick={onFeatures}>Features</button>
          <button type="button" onClick={onAreas}>Growth areas</button>
          <button type="button" onClick={onPricing}>Pricing</button>
          <button type="button" onClick={onContact}>Contact</button>
        </div>
        <div className="evolv-nav-actions">
          <button type="button" className="evolv-start" onClick={onStart}>Get started <ArrowRight size={15} /></button>
          <button type="button" className={open ? 'evolv-menu-toggle is-open' : 'evolv-menu-toggle'} onClick={() => setOpen(v => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            <span /><span />
          </button>
        </div>
      </nav>

      <div className={open ? 'evolv-mobile-menu is-open' : 'evolv-mobile-menu'} aria-hidden={!open}>
        <a href="#story" onClick={close}>Why EVOLV</a>
        <button type="button" onClick={() => run(onFeatures)}>Features</button>
        <button type="button" onClick={() => run(onAreas)}>Growth areas</button>
        <button type="button" onClick={() => run(onPricing)}>Pricing</button>
        <button type="button" onClick={() => run(onContact)}>Contact</button>
        <button type="button" className="evolv-mobile-start" onClick={() => run(onStart)}>Get started <ArrowRight size={15} /></button>
      </div>
    </>
  )
}
