import { Home, Plus, LineChart, UserRound } from 'lucide-react'
import './BottomNav.css'

function BottomNav({ active, onNavigate, onLog, avatarUrl = '' }) {
  return (
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
        className="log-nav-button"
        onClick={() => onNavigate('logs')}
      >
        <span><Plus size={21} /></span>
        <small>Log</small>
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
