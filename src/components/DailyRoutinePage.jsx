import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, Apple, Bell, Check, ChevronRight, Clock3, Droplets, Moon, RotateCcw, Sunrise, Utensils, Waves } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './DailyRoutinePage.css'

const defaults = [
  { id: 'wake', label: 'Wake up', time: '06:30', group: 'Morning', enabled: true, icon: 'sunrise' },
  { id: 'water', label: 'Drink water', time: '07:00', group: 'Morning', enabled: true, icon: 'water' },
  { id: 'breakfast', label: 'Breakfast', time: '08:00', group: 'Meals', enabled: true, icon: 'meal' },
  { id: 'lunch', label: 'Lunch', time: '13:00', group: 'Meals', enabled: true, icon: 'meal' },
  { id: 'dinner', label: 'Dinner', time: '19:00', group: 'Meals', enabled: true, icon: 'meal' },
  { id: 'winddown', label: 'Wind down', time: '21:30', group: 'Evening', enabled: true, icon: 'moon' },
  { id: 'bedtime', label: 'Bedtime', time: '22:30', group: 'Evening', enabled: true, icon: 'moon' },
]

const iconMap = { sunrise: Sunrise, water: Droplets, meal: Utensils, moon: Moon }

function todayKey() {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

function formatDuration(value) {
  const total = Math.max(0, Math.round(Number(value || 0) * 60))
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return hours ? (minutes ? hours + 'h ' + minutes + 'm' : hours + 'h') : minutes + 'm'
}

export default function DailyRoutinePage({ pageProps }) {
  const { profile, logs = [], meals = [], defs = [], openLog, goTo, notificationsEnabled, setProfileMessage } = pageProps
  const storageKey = 'evolv-routine-' + (profile?.id || 'local')
  const [items, setItems] = useState(defaults)
  const [completed, setCompleted] = useState({})
  const [saved, setSaved] = useState(false)
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    try { return localStorage.getItem('evolv-routine-reminders-' + (profile?.id || 'local')) !== 'false' } catch { return true }
  })
  const date = todayKey()

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      const loadedItems = Array.isArray(stored.items) ? stored.items : defaults
      setItems(loadedItems)
      setCompleted(stored.completedDate === date ? (stored.completed || {}) : {})
      syncRoutineReminders(loadedItems, remindersEnabled)
    } catch {
      setItems(defaults)
      setCompleted({})
    }
  }, [storageKey, date])

  function persist(nextItems, nextCompleted = completed) {
    setItems(nextItems)
    setCompleted(nextCompleted)
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items: nextItems, completed: nextCompleted, completedDate: date }))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    } catch {
      setProfileMessage?.('Could not save this routine on your device.')
    }
  }

  async function syncRoutineReminders(nextItems, enabled = remindersEnabled) {
    const routineReminders = enabled ? nextItems.filter(item => item.enabled).map(item => ({
      id: item.id, label: item.label, time: item.time, enabled: true
    })) : []
    try {
      const stored = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}')
      const preferences = { ...stored, routineReminders }
      localStorage.setItem('evolv-notification-times', JSON.stringify(preferences))
      if (localStorage.getItem('evolv-notifications-enabled') !== 'true') return
      const registration = await navigator.serviceWorker?.ready
      const subscription = await registration?.pushManager?.getSubscription()
      if (!subscription) return
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos'
      const { error } = await supabase.functions.invoke('save-push-subscription', {
        body: { subscription: subscription.toJSON(), timezone, preferences, enabled: true }
      })
      if (error) throw error
    } catch (error) {
      console.error('Could not sync routine reminders:', error)
      setProfileMessage?.('Routine saved. Check notification settings to enable reminders.')
    }
  }

  function toggleRoutineReminders() {
    const next = !remindersEnabled
    setRemindersEnabled(next)
    try { localStorage.setItem('evolv-routine-reminders-' + (profile?.id || 'local'), String(next)) } catch {}
    syncRoutineReminders(items, next)
  }

  function updateItem(id, changes) {
    const nextItems = items.map(item => item.id === id ? { ...item, ...changes } : item)
    persist(nextItems)
    if (Object.prototype.hasOwnProperty.call(changes, 'time') || Object.prototype.hasOwnProperty.call(changes, 'enabled')) syncRoutineReminders(nextItems)
  }

  function toggleCompleted(id) {
    persist(items, { ...completed, [id]: !completed[id] })
  }

  function resetToday() {
    persist(items, {})
  }

  const enabledItems = items.filter(item => item.enabled)
  const completedCount = enabledItems.filter(item => completed[item.id]).length
  const progress = enabledItems.length ? Math.round(completedCount / enabledItems.length * 100) : 0
  const sleepDef = defs.find(item => item.slug === 'sleep')
  const sleepEntries = useMemo(() => logs
    .filter(item => sleepDef && String(item.metric_id) === String(sleepDef.id))
    .sort((a, b) => new Date(b.logged_at || b.created_at) - new Date(a.logged_at || a.created_at)), [logs, sleepDef])
  const latestSleep = sleepEntries[0]
  const todayMeals = meals.filter(item => {
    const stamp = item.logged_at || item.created_at
    return stamp && new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(stamp)) === date
  })
  const nextItem = enabledItems.filter(item => !completed[item.id]).sort((a, b) => a.time.localeCompare(b.time)).find(item => item.time >= new Date().toTimeString().slice(0, 5)) || enabledItems.find(item => !completed[item.id])

  function logSleep() {
    if (sleepDef) openLog('health', sleepDef)
    else setProfileMessage?.('Sleep tracking is not available yet. Please refresh and try again.')
  }

  function logMeal() {
    const mealDef = defs.find(item => item.slug === 'meals')
    openLog('nutrition', mealDef || { slug: 'meals', name: 'Meal', value_type: 'meal', color: '#ffd66b' })
  }

  return (
    <div className="daily-routine-page">
      <header className="routine-heading">
        <div>
          <span className="routine-eyebrow">YOUR DAY</span>
          <h1>Daily routine<span>.</span></h1>
        </div>
        <div className="routine-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
      </header>

      <section className="routine-progress-panel">
        <div className="routine-progress-top">
          <div><span className="routine-label">TODAY</span><h2>{progress === 100 ? 'All done.' : completedCount ? 'You’re making progress.' : 'One step at a time.'}</h2></div>
          <strong>{progress}%</strong>
        </div>
        <div className="routine-progress-track"><span style={{ width: progress + '%' }} /></div>
        <div className="routine-progress-bottom"><span>{completedCount} of {enabledItems.length} routine steps complete</span><button type="button" onClick={resetToday}><RotateCcw size={14}/> Reset today</button></div>
      </section>

      <section className="routine-insight-grid">
        <article className="routine-insight-card routine-sleep-card">
          <div className="routine-insight-icon"><Moon size={19}/></div>
          <span className="routine-label">SLEEP RECORD</span>
          <strong>{latestSleep ? formatDuration(latestSleep.value) : 'Not recorded'}</strong>
          <p>{latestSleep ? 'Last night' : 'No sleep logged yet'}</p>
          <button type="button" onClick={logSleep}>{latestSleep ? 'Log another night' : 'Record sleep'} <ChevronRight size={15}/></button>
        </article>
        <article className="routine-insight-card">
          <div className="routine-insight-icon meal-icon"><Apple size={19}/></div>
          <span className="routine-label">MEALS TODAY</span>
          <strong>{todayMeals.length} <small>{todayMeals.length === 1 ? 'meal' : 'meals'}</small></strong>
          <p>{todayMeals.length ? 'Logged today' : 'Nothing logged yet'}</p>
          <button type="button" onClick={logMeal}>Log a meal <ChevronRight size={15}/></button>
        </article>
      </section>

      <section className="routine-schedule-section">
        <div className="routine-section-heading"><div><span className="routine-label">YOUR SCHEDULE</span><h2>Set your rhythm.</h2></div><span className="routine-saved-state">{saved ? <><Check size={13}/> Saved</> : 'Saved on device'}</span></div>
        <div className="routine-schedule-list">
          {['Morning', 'Meals', 'Evening'].map(group => {
            const groupItems = items.filter(item => item.group === group).sort((a, b) => a.time.localeCompare(b.time))
            return <div className="routine-group" key={group}>
              <h3>{group}</h3>
              {groupItems.map(item => {
                const Icon = iconMap[item.icon] || Clock3
                return <article className={'routine-row' + (!item.enabled ? ' routine-row-disabled' : '') + (completed[item.id] ? ' routine-row-complete' : '')} key={item.id}>
                  <button type="button" className="routine-check" aria-label={(completed[item.id] ? 'Mark ' + item.label + ' incomplete' : 'Complete ' + item.label)} onClick={() => toggleCompleted(item.id)} disabled={!item.enabled}>{completed[item.id] ? <Check size={15}/> : <span/>}</button>
                  <span className="routine-row-icon"><Icon size={17}/></span>
                  <div className="routine-row-copy"><strong>{item.label}</strong></div>
                  <label className="routine-time"><span className="sr-only">{item.label} time</span><input type="time" value={item.time} onChange={event => updateItem(item.id, { time: event.target.value })} /></label>
                  <button type="button" className={'routine-toggle' + (item.enabled ? ' is-on' : '')} aria-pressed={item.enabled} aria-label={(item.enabled ? 'Disable ' : 'Enable ') + item.label} onClick={() => updateItem(item.id, { enabled: !item.enabled })}><span/></button>
                </article>
              })}
            </div>
          })}
        </div>
      </section>

      <section className="routine-reminder-control">
        <span className="routine-reminder-control-icon"><Bell size={17}/></span>
        <div><strong>10-minute reminders</strong><small>{remindersEnabled ? 'Before each enabled routine' : 'Reminders are off'}</small></div>
        <button type="button" className={'routine-toggle' + (remindersEnabled ? ' is-on' : '')} aria-pressed={remindersEnabled} aria-label={remindersEnabled ? 'Turn routine reminders off' : 'Turn routine reminders on'} onClick={toggleRoutineReminders}><span/></button>
      </section>

      <section className="routine-next-step">
        <div className="routine-next-icon"><AlarmClock size={20}/></div>
        <div><span className="routine-label">NEXT UP</span><h2>{nextItem ? nextItem.label : 'Your schedule is clear.'}</h2><p>{nextItem ? new Date('2000-01-01T' + nextItem.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Enable a routine to get started.'}</p></div>
      </section>

      <section className="routine-reminder-note">
        <div className="routine-reminder-icon"><Waves size={18}/></div>
        <div><strong>{notificationsEnabled ? 'Notifications are on' : 'Enable phone notifications'}</strong><p>{notificationsEnabled ? 'You’ll be reminded 10 minutes before enabled routines.' : 'Turn them on in settings to receive routine reminders.'}</p></div>
        <button type="button" onClick={() => goTo('profile')}>Settings <ChevronRight size={15}/></button>
      </section>
    </div>
  )
}
