import { useEffect } from 'react'
import { Home, CalendarClock, Sparkles, LineChart, UserRound, Bell, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import './DesktopSidebar.css'

const links = [
  { page: 'overview', label: 'Home', Icon: Home },
  { page: 'routine', label: 'Routine', Icon: CalendarClock },
  { page: 'ai', label: 'AI Companion', Icon: Sparkles },
  { page: 'progress', label: 'Progress', Icon: LineChart },
  { page: 'profile', label: 'Profile', Icon: UserRound },
  { page: 'notifications', label: 'Notifications', Icon: Bell },
]

export default function DesktopSidebar({ active, onNavigate, open, onToggle }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') onToggle(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onToggle])

  return (
    <div className="evolv-desktop-navigation">
      <button
        type="button"
        className="evolv-desktop-menu-toggle"
        aria-label={open ? 'Close dashboard navigation' : 'Open dashboard navigation'}
        aria-expanded={open}
        onClick={() => onToggle(!open)}
      >
        {open ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
      </button>
      {open && <>
        <button className="evolv-desktop-sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => onToggle(false)} />
        <aside className="evolv-desktop-sidebar" aria-label="Dashboard navigation">
          <div className="evolv-desktop-sidebar-head">
            <span className="evolv-desktop-sidebar-brand">evolv<span>.</span></span>
            <button type="button" className="evolv-desktop-sidebar-close" aria-label="Close navigation" onClick={() => onToggle(false)}><X size={18}/></button>
          </div>
          <p className="evolv-desktop-sidebar-label">WORKSPACE</p>
          <nav className="evolv-desktop-sidebar-links">
            {links.map(({ page, label, Icon }) => (
              <button
                key={page}
                type="button"
                className={active === page ? 'is-active' : ''}
                aria-current={active === page ? 'page' : undefined}
                onClick={() => { onNavigate(page); onToggle(false) }}
              >
                <Icon size={18} strokeWidth={1.8}/>
                <span>{label}</span>
                {active === page && <i aria-hidden="true" />}
              </button>
            ))}
          </nav>
          <div className="evolv-desktop-sidebar-foot">A little better, every day.</div>
        </aside>
      </>}
    </div>
  )
}
