import { Home, CalendarClock, LineChart, UserRound, Target } from 'lucide-react'
import { createPortal } from 'react-dom'
import './BottomNav.css'

function BottomNav({ active, onNavigate, avatarUrl = '' }) {
  return createPortal(
    <nav className="evolv-bottom-nav" aria-label="App navigation">
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
        className={active === 'goals' ? 'bottom-active' : ''}
        onClick={() => onNavigate('goals')}
      >
        <span><Target size={19} /></span>
        <small>Goals</small>
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
    </nav>,
    document.body,
  )
}

export default BottomNav
