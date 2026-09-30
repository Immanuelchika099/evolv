import { useEffect, useRef, useState } from 'react'
import CardNav from './CardNav/CardNav'
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
      <img className="evolv-brand-svg" src="/evolv-logo.svg" alt="EVOLV" />
    </a>
  )
}

export default function Navbar({
  onStart,
  onSignIn,
  onFeatures,
  onAreas,
  onPricing,
  onContact,
  onHome,
  menuOpen,
  setMenuOpen
}) {
  const open = menuOpen
  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY
      if (open) return

      if (current < 40) {
        setVisible(true)
      } else if (current > lastScroll.current + 3) {
        setVisible(false)
      } else if (current < lastScroll.current - 3) {
        setVisible(true)
      }

      lastScroll.current = current
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [open])

  useEffect(() => {
    if (open) setVisible(true)
  }, [open])

  function close() {
    setMenuOpen(false)
  }

  function run(action) {
    close()
    if (typeof action === 'function') action()
  }

  const navItems = [
    {
      label: 'EXPLORE',
      bgColor: '#0a0d0a',
      textColor: '#f3f1ea',
      links: [
        {
          label: 'Why EVOLV',
          ariaLabel: 'Why EVOLV',
          href: '#story',
          onClick: close
        },
        {
          label: 'Features',
          ariaLabel: 'Explore EVOLV features',
          onClick: () => run(onFeatures)
        }
      ]
    },
    {
      label: 'GROWTH',
      bgColor: '#10150d',
      textColor: '#f3f1ea',
      links: [
        {
          label: 'Growth areas',
          ariaLabel: 'Explore growth areas',
          onClick: () => run(onAreas)
        },
        {
          label: 'Pricing',
          ariaLabel: 'View EVOLV pricing',
          onClick: () => run(onPricing)
        }
      ]
    },
    {
      label: 'CONNECT',
      bgColor: '#0c120c',
      textColor: '#f3f1ea',
      links: [
        {
          label: 'Contact',
          ariaLabel: 'Contact EVOLV',
          onClick: () => run(onContact)
        },
        {
          label: 'Sign in',
          ariaLabel: 'Sign in to EVOLV',
          onClick: () => run(onSignIn)
        },
        {
          label: 'Get started',
          ariaLabel: 'Get started with EVOLV',
          onClick: () => run(onStart)
        }
      ]
    }
  ]

  return (
    <>
      <nav className={open ? 'evolv-nav is-menu-open' : (visible ? 'evolv-nav is-visible' : 'evolv-nav is-hidden')}>
        <Brand onHome={onHome} />

        <div className="evolv-nav-actions">
          <button
            type="button"
            className={open ? 'evolv-menu-toggle is-open' : 'evolv-menu-toggle'}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span /><span />
          </button>
        </div>
      </nav>

      <CardNav items={navItems} open={open} />
    </>
  )
}
