import { Home, CalendarClock, Sparkles, LineChart, UserRound } from 'lucide-react'
import './BottomNav.css'
import './LiquidGlassNav.css'

function BottomNav({ active, onNavigate, avatarUrl = '' }) {
  return (
    <nav className="evolv-bottom-nav" aria-label="App navigation">
      <liquid-glass
        className="evolv-liquid-glass-surface"
        preset="frosted"
        aria-hidden="true"
      />

      <button
        type="button"
        className={active === 'overview' ? 'bottom-active' : ''}
        onClick={() => onNavigate('overview')}
      >
        <span><Home size={19} /></span>
        <small>Home</small>
      </button>

      <button
        type="button"
        className={active === 'routine' ? 'bottom-active' : ''}
        onClick={() => onNavigate('routine')}
      >
        <span><CalendarClock size={19} /></span>
        <small>Routine</small>
      </button>

      <button
        type="button"
        className={active === 'ai' ? 'bottom-active' : ''}
        onClick={() => onNavigate('ai')}
      >
        <span><Sparkles size={18} /></span>
        <small>AI</small>
      </button>

      <button
        type="button"
        className={active === 'progress' ? 'bottom-active' : ''}
        onClick={() => onNavigate('progress')}
      >
        <span><LineChart size={19} /></span>
        <small>Progress</small>
      </button>

      <button
        type="button"
        className={`bottom-profile-nav-button ${active === 'profile' ? 'bottom-active' : ''}`}
        onClick={() => onNavigate('profile')}
      >
        <span className="bottom-profile-icon">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="bottom-profile-image" />
            : <UserRound size={19} />}
        </span>
        <small>You</small>
      </button>
    </nav>
  )
}

export default BottomNav
