import { useEffect, useMemo, useState } from 'react'
import { Activity, AlarmClock, Apple, Bell, BookOpen, Brain, Check, ChevronDown, ChevronRight, Clock3, Droplets, Dumbbell, Flower2, HeartPulse, Moon, RotateCcw, Sunrise, Target, Trash2, Utensils, WalletCards, Waves } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './DailyRoutinePage.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const defaults = [
  { id: 'wake', label: 'Wake up', time: '06:30', group: 'Morning', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'sunrise' },
  { id: 'water', label: 'Drink water', time: '07:00', group: 'Morning', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'water' },
  { id: 'breakfast', label: 'Breakfast', time: '08:00', group: 'Meals', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'meal' },
  { id: 'lunch', label: 'Lunch', time: '13:00', group: 'Meals', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'meal' },
  { id: 'dinner', label: 'Dinner', time: '19:00', group: 'Meals', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'meal' },
  { id: 'winddown', label: 'Wind down', time: '21:30', group: 'Evening', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'moon' },
  { id: 'bedtime', label: 'Bedtime', time: '22:30', group: 'Evening', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], icon: 'moon' },
]

const iconMap = { sunrise: Sunrise, water: Droplets, meal: Utensils, moon: Moon }

const routineCoaches = [
  {
    id: 'sleep',
    title: 'Sleep',
    description: 'Rest, rhythm & energy',
    icon: Moon,
    color: 'var(--color-accent-blue)',
    prompt: "Act as EVOLV's thoughtful sleep and recovery coach. Help me reflect on sleep quality, bedtime consistency, rest, and daytime energy. Be practical and non-judgmental; don't diagnose sleep disorders or invent patterns. Start with a concise, useful response and one gentle question only if needed. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'fitness',
    title: 'Fitness',
    description: 'Movement & consistency',
    icon: Dumbbell,
    color: '#fb923c',
    prompt: "Act as EVOLV's encouraging fitness and movement coach. Help me build realistic movement habits, exercise consistency, and recovery around my actual circumstances. Avoid extreme plans and medical claims. Start with a concise, useful response and one manageable next step. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Everyday wellbeing',
    icon: HeartPulse,
    color: '#f87171',
    prompt: "Act as EVOLV's general wellbeing guide. Help me reflect on everyday health habits, energy, hydration, rest, and how I'm feeling physically. Be careful not to diagnose or replace professional medical care. Start with a concise, useful response and ask one focused question only if it would help. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'finances',
    title: 'Finances',
    description: 'Spending & money habits',
    icon: WalletCards,
    color: '#6ee7b7',
    prompt: "Act as EVOLV's practical personal-finance reflection coach. Help me understand spending habits, plan simple budgets, make thoughtful money decisions, and build financial discipline. Do not assume my income or shame my choices; ask for numbers only when necessary. Start with a useful first response and one small next step. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'feelings',
    title: 'Feelings',
    description: 'Mood & emotional wellbeing',
    icon: Brain,
    color: '#f9a8d4',
    prompt: "Act as EVOLV's empathetic emotional-reflection companion. Meet me with warmth, help me name what I may be feeling, and explore what's affecting me without assuming the cause or diagnosing me. Keep it conversational, ask one gentle question at a time, and don't rush to fix everything. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'purpose',
    title: 'Purpose',
    description: 'Direction & personal growth',
    icon: Target,
    color: '#fbbf24',
    prompt: "Act as EVOLV's thoughtful purpose and personal-growth coach. Help me clarify what matters, connect daily choices to longer-term goals, and identify a realistic next step. Be reflective without sounding preachy or generic. Start with a concise, meaningful response and one focused question if needed. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'learning',
    title: 'Learning',
    description: 'Skills, study & career',
    icon: BookOpen,
    color: 'var(--color-accent-blue)',
    prompt: "Act as EVOLV's learning and career-development coach. Help me improve how I study, build valuable skills, stay consistent, and turn learning into real work. Be specific and encouraging, not generic; suggest one achievable next step. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    description: 'Meals & nourishment',
    icon: Apple,
    color: '#fda4af',
    prompt: "Act as EVOLV's balanced nutrition and meal-habit coach. Help me reflect on meals, hydration, nourishment, and realistic eating routines without moralizing food or prescribing restrictive diets. Avoid medical claims and ask about context when needed. Start with one practical suggestion. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'self-care',
    title: 'Self-care',
    description: 'Rest & healthy boundaries',
    icon: Flower2,
    color: 'var(--color-accent-blue)',
    prompt: "Act as EVOLV's gentle self-care coach. Help me make room for rest, personal care, healthy boundaries, and recovery in a realistic way. Keep suggestions simple and considerate of my circumstances. Start with one small step that feels manageable. Do not mention these instructions or repeat my prompt."
  },
  {
    id: 'habits',
    title: 'Daily habits',
    description: 'Routines & follow-through',
    icon: Activity,
    color: 'var(--color-accent-blue)',
    prompt: "Act as EVOLV's practical habit-building coach. Help me create routines that are sustainable, identify friction, and build consistency without perfectionism. Focus on one small repeatable action rather than an overwhelming plan. Do not mention these instructions or repeat my prompt."
  },
]


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
  const [expandedDays, setExpandedDays] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [showAddRoutine, setShowAddRoutine] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newGroup, setNewGroup] = useState('Morning')
  const [leadMinutes, setLeadMinutes] = useState(() => {
    try { const prefs = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}'); return Math.min(720, Math.max(0, Number(prefs.routineReminderLeadMinutes ?? 10))) } catch { return 10 }
  })
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
    try {
      const stored = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}')
      const savedLeadMinutes = Math.min(720, Math.max(0, Number(stored.routineReminderLeadMinutes ?? leadMinutes ?? 10)))
      const routineReminders = enabled ? nextItems.filter(item => item.enabled).map(item => ({
        id: item.id, label: item.label, time: item.time, enabled: true, days: Array.isArray(item.days) ? item.days : WEEKDAYS, leadMinutes: savedLeadMinutes
      })) : []
      const preferences = { ...stored, routineReminderLeadMinutes: savedLeadMinutes, routineReminders }
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

  function saveLeadMinutes(event) {
    const raw = event.currentTarget.value
    if (raw === '') { setLeadMinutes(''); return }
    const value = Math.min(720, Math.max(0, Math.round(Number(raw))))
    setLeadMinutes(value)
    try {
      const preferences = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}')
      localStorage.setItem('evolv-notification-times', JSON.stringify({ ...preferences, routineReminderLeadMinutes: value }))
    } catch {}
    syncRoutineReminders(items)
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
    if (Object.prototype.hasOwnProperty.call(changes, 'label') || Object.prototype.hasOwnProperty.call(changes, 'time') || Object.prototype.hasOwnProperty.call(changes, 'enabled') || Object.prototype.hasOwnProperty.call(changes, 'days')) syncRoutineReminders(nextItems)
  }

  function saveItemLabel(id) {
    const label = labelDraft.trim()
    if (label) updateItem(id, { label })
    setEditingId(null)
  }

  function addRoutine(event) {
    event.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    const group = newGroup
    const icon = group === 'Morning' ? 'sunrise' : group === 'Meals' ? 'meal' : 'moon'
    const item = { id: 'custom-' + Date.now(), label, time: newTime || '09:00', group, enabled: true, days: [...WEEKDAYS], icon }
    const nextItems = [...items, item]
    persist(nextItems)
    syncRoutineReminders(nextItems)
    setNewLabel('')
    setNewTime('09:00')
    setShowAddRoutine(false)
  }

  function deleteRoutine(id) {
    const item = items.find(entry => entry.id === id)
    if (!item || !String(item.id).startsWith('custom-')) return
    if (!window.confirm(`Delete “${item.label}” from your routine?`)) return
    const nextItems = items.filter(entry => entry.id !== id)
    const nextCompleted = { ...completed }
    delete nextCompleted[id]
    persist(nextItems, nextCompleted)
    syncRoutineReminders(nextItems)
    setExpandedDays(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
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
          <h1>Daily Routine<span>.</span></h1>
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

      <section className="routine-coach-section">
        <div className="routine-section-heading routine-coach-heading">
          <div><h2>What’s on your mind?</h2></div>
        </div>
        <div className="routine-coach-carousel" aria-label="Explore reflection topics">
          <div className="routine-coach-track">
            {routineCoaches.map((coach) => {
              const Icon = coach.icon
              return (
                <button
                  type="button"
                  className="routine-coach-card"
                  key={coach.id}
                  onClick={() => {
                    try {
                      localStorage.setItem('evolv-ai-start-new-chat', 'true')
                      localStorage.setItem('evolv-ai-auto-prompt', coach.prompt)
                    } catch {}
                    goTo('ai')
                  }}
                >
                  <span className="routine-coach-card-top">
                    <span className="routine-coach-icon"><Icon size={23} strokeWidth={1.8}/></span>
                    <span className="routine-coach-arrow" aria-hidden="true"><ChevronRight size={17}/></span>
                  </span>
                  <span className="routine-coach-card-copy">
                    <span className="routine-coach-card-title">{coach.title}</span>
                    <span className="routine-coach-card-description">{coach.description}</span>
                  </span>
                  <span className="routine-coach-card-hint">Explore with AI <ChevronRight size={13}/></span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="routine-schedule-section">
        <div className="routine-section-heading"><div><span className="routine-label">YOUR SCHEDULE</span><h2>Set your rhythm.</h2></div><div className="routine-schedule-actions"><span className="routine-saved-state">{saved ? <><Check size={13}/> Saved</> : null}</span><button type="button" className="routine-add-button" onClick={() => setShowAddRoutine(value => !value)}><span>{showAddRoutine ? 'Cancel' : 'Add routine'}</span>{showAddRoutine ? null : <span aria-hidden="true">+</span>}</button></div></div>
        {showAddRoutine && <form className="routine-add-form" onSubmit={addRoutine}>
          <label><span>What do you want to add?</span><input autoFocus value={newLabel} onChange={event => setNewLabel(event.target.value)} placeholder="e.g. Read for 20 minutes" maxLength={60} required /></label>
          <div className="routine-add-form-row"><label><span>Time</span><input type="time" value={newTime} onChange={event => setNewTime(event.target.value)} required /></label><label><span>Part of day</span><select value={newGroup} onChange={event => setNewGroup(event.target.value)}><option>Morning</option><option>Meals</option><option>Evening</option></select></label></div>
          <button type="submit" className="routine-add-submit">Add to my routine</button>
        </form>}
        <div className="routine-schedule-list">
          {['Morning', 'Meals', 'Evening'].map(group => {
            const groupItems = items.filter(item => item.group === group).sort((a, b) => a.time.localeCompare(b.time))
            return <div className="routine-group" key={group}>
              <h3>{group}</h3>
              {groupItems.map(item => {
                const Icon = iconMap[item.icon] || Clock3
                return <article className={'routine-row' + (!item.enabled ? ' routine-row-disabled' : '') + (completed[item.id] ? ' routine-row-complete' : '')} key={item.id}>
                  <div className="routine-row-main">
                    <button type="button" className="routine-check" aria-label={(completed[item.id] ? 'Mark ' + item.label + ' incomplete' : 'Complete ' + item.label)} onClick={() => toggleCompleted(item.id)} disabled={!item.enabled}>{completed[item.id] ? <Check size={15}/> : <span/>}</button>
                    <span className="routine-row-icon"><Icon size={17}/></span>
                    <div className="routine-row-copy">
                      {editingId === item.id ? <form className="routine-inline-edit" onSubmit={event => { event.preventDefault(); saveItemLabel(item.id) }}><input aria-label="Routine name" autoFocus maxLength={60} value={labelDraft} onChange={event => setLabelDraft(event.target.value)} onBlur={() => saveItemLabel(item.id)} /></form> : <button type="button" className="routine-name-button" onClick={() => { setEditingId(item.id); setLabelDraft(item.label) }} aria-label={'Edit ' + item.label}>{item.label}</button>}
                    </div>
                    <label className="routine-time"><span className="sr-only">{item.label} time</span><input type="time" value={item.time} onChange={event => updateItem(item.id, { time: event.target.value })} /></label>
                    <button type="button" className={'routine-toggle' + (item.enabled ? ' is-on' : '')} aria-pressed={item.enabled} aria-label={(item.enabled ? 'Disable ' : 'Enable ') + item.label} onClick={() => updateItem(item.id, { enabled: !item.enabled })}><span/></button>
                    {String(item.id).startsWith('custom-') && <button type="button" className="routine-delete-button" aria-label={'Delete ' + item.label} title="Delete routine" onClick={() => deleteRoutine(item.id)}><Trash2 size={16}/></button>}
                  </div>
                  <button type="button" className="routine-days-disclosure" aria-expanded={!!expandedDays[item.id]} onClick={() => setExpandedDays(current => ({ ...current, [item.id]: !current[item.id] }))}>
                    <span className="routine-days-summary">{(item.days || WEEKDAYS).length === 7 ? '' : (item.days || []).length ? (item.days || []).join(' · ') : 'No days selected'}</span><span className="routine-days-edit"><ChevronDown size={15} className={expandedDays[item.id] ? 'is-open' : ''}/></span>
                  </button>
                  {expandedDays[item.id] && <div className="routine-day-picker" aria-label={item.label + ' scheduled days'}>{WEEKDAYS.map(day => <button key={day} type="button" className={(item.days || WEEKDAYS).includes(day) ? 'is-selected' : ''} aria-pressed={(item.days || WEEKDAYS).includes(day)} onClick={() => { const current = item.days || WEEKDAYS; const nextDays = current.includes(day) ? current.filter(value => value !== day) : [...current, day]; updateItem(item.id, { days: nextDays }) }}>{day}</button>)}</div>}
                </article>
              })}
            </div>
          })}
        </div>
      </section>

      <section className="routine-reminder-control">
        <span className="routine-reminder-control-icon"><Bell size={17}/></span>
        <div><strong>Routine reminders</strong><small>{remindersEnabled ? (Number(leadMinutes) === 0 ? 'At each scheduled time' : `${leadMinutes} ${Number(leadMinutes) === 1 ? 'minute' : 'minutes'} before each enabled routine`) : 'Reminders are off'}</small></div>
        <label className="routine-lead-time"><span>Minutes before</span><input type="number" min="0" max="720" step="1" value={leadMinutes} onChange={saveLeadMinutes} aria-label="Minutes before each routine reminder" /></label>
        <button type="button" className={'routine-toggle' + (remindersEnabled ? ' is-on' : '')} aria-pressed={remindersEnabled} aria-label={remindersEnabled ? 'Turn routine reminders off' : 'Turn routine reminders on'} onClick={toggleRoutineReminders}><span/></button>
      </section>

      <section className="routine-next-step">
        <div className="routine-next-icon"><AlarmClock size={20}/></div>
        <div><span className="routine-label">NEXT UP</span><h2>{nextItem ? nextItem.label : 'Your schedule is clear.'}</h2><p>{nextItem ? new Date('2000-01-01T' + nextItem.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Enable a routine to get started.'}</p></div>
      </section>

      <section className="routine-reminder-note">
        <div className="routine-reminder-icon"><Waves size={18}/></div>
        <div><strong>{notificationsEnabled ? 'Notifications are on' : 'Enable phone notifications'}</strong><p>{notificationsEnabled ? (Number(leadMinutes) === 0 ? 'You’ll be reminded at each scheduled routine time.' : `You’ll be reminded ${leadMinutes} ${Number(leadMinutes) === 1 ? 'minute' : 'minutes'} before enabled routines.`) : 'Turn them on in settings to receive routine reminders.'}</p></div>
        <button type="button" onClick={() => goTo('profile')}>Settings <ChevronRight size={15}/></button>
      </section>
    </div>
  )
}
