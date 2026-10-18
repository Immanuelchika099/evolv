import { useEffect } from 'react'
import { Activity, Apple, ChevronRight, Droplets, Dumbbell, Moon, MoreHorizontal, Sparkles, X } from 'lucide-react'
import './BottomNav.css'

const options = [
  { id: 'workout', title: 'Workout', description: 'Exercises, sets, reps and weights', icon: Dumbbell },
  { id: 'meal', title: 'Meal', description: 'Record what you ate', icon: Apple },
  { id: 'sleep', title: 'Sleep', description: 'Bedtime, wake-up and duration', icon: Moon },
  { id: 'water', title: 'Water', description: 'Log a glass, bottle or amount', icon: Droplets },
  { id: 'more', title: 'More activities', description: 'Mood, focus, spending and more', icon: MoreHorizontal },
  { id: 'ai', title: 'Ask AI instead', description: 'Describe it naturally to Evolv', icon: Sparkles, blue: true },
]

function QuickLogSheet({ open, onClose, onChoose }) {
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="quick-log-overlay" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="quick-log-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-log-title">
        <div className="quick-log-handle" aria-hidden="true" />
        <header className="quick-log-header">
          <div className="quick-log-header-copy">
            <span className="quick-log-eyebrow">QUICK LOG</span>
            <h2 id="quick-log-title">What would you like to log?</h2>
            <p>Choose a tracker or tell Evolv in your own words.</p>
          </div>
          <button className="quick-log-close" type="button" onClick={onClose} aria-label="Close logging options">
            <X size={18} />
          </button>
        </header>
        <div className="quick-log-options">
          {options.map(option => {
            const Icon = option.icon
            return (
              <button className="quick-log-option" type="button" key={option.id} onClick={() => onChoose(option.id)}>
                <span className={'quick-log-option-icon' + (option.blue ? ' is-blue' : '')} aria-hidden="true"><Icon size={19} strokeWidth={1.8} /></span>
                <span className="quick-log-option-copy"><strong>{option.title}</strong><small>{option.description}</small></span>
                <ChevronRight className="quick-log-option-arrow" size={17} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default QuickLogSheet
