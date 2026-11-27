import { useEffect, useMemo, useState } from 'react'
import {
  Activity, BookOpen, ChevronRight, Flame, Focus, Heart, NotebookPen, Target, TrendingUp
} from 'lucide-react'

function dateKey(date) {
  const d = new Date(date)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function longestStreak(dateSet) {
  const dates = [...dateSet].sort()
  let best = 0
  let run = 0
  let previous = null
  for (const key of dates) {
    const current = new Date(key + 'T00:00:00')
    const gap = previous ? Math.round((current - previous) / 86400000) : 0
    run = gap === 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = current
  }
  return best
}

function currentStreak(dateSet) {
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!dateSet.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (dateSet.has(dateKey(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

function MiniBars({ values = [], tone = 'orange' }) {
  const max = Math.max(1, ...values)
  return <span className={`hs-mini-bars tone-${tone}`} aria-hidden="true">
    {values.map((value, index) => <i key={index} className={index === values.length - 1 ? 'is-current' : ''} style={{ height: `${Math.max(8, value / max * 100)}%` }} />)}
  </span>
}

function PinCard({ title, tone, icon: Icon, value, unit, detail, onClick, graphic }) {
  return <button type="button" className={`hs-pin-card tone-${tone}`} onClick={onClick}>
    <span className="hs-card-top">
      <span className="hs-card-label"><Icon size={21} strokeWidth={2.5} />{title}</span>
      <span className="hs-card-detail">{detail}<ChevronRight size={18}/></span>
    </span>
    <span className="hs-card-bottom">
      <span className="hs-card-value">{value}<small>{unit}</small></span>
      {graphic}
    </span>
  </button>
}

function SummaryRow({ icon: Icon, tone, title, detail, onClick }) {
  return <button type="button" className="hs-summary-row" onClick={onClick}>
    <span className={`hs-row-icon tone-${tone}`}><Icon size={20}/></span>
    <span className="hs-row-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
    <ChevronRight size={20}/>
  </button>
}

export default function HealthSummaryHome({ pageProps }) {
  const [streakOpen, setStreakOpen] = useState(false)
  const {
    name, todayLogs = [], todayMeals = [], defs = [], icons = {}, metricArea = {},
    valueText = () => '', openLog = () => {}, openMoodCheckIn, goTo = () => {},
    logs = [], meals = [], goals = [], openReflection = () => {}, loading = false,
    returningAfterBreak = false, dismissReturnWelcome = () => {}
  } = pageProps

  const firstName = String(name || '').trim().split(/\s+/)[0] || 'there'
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const activeDateSet = new Set([...logs, ...meals].map(item => {
    const stamp = item.logged_at || item.created_at || item.date || item.recorded_at
    return stamp ? dateKey(stamp) : null
  }).filter(Boolean))
  const reflectionMetricIds = new Set(defs.filter(def => /reflection|mood|emotional-wellbeing/i.test(String(def.slug || def.name || ''))).map(def => String(def.id)))
  const reflectionDateSet = new Set(logs.filter(item => reflectionMetricIds.has(String(item.metric_id))).map(item => {
    const stamp = item.logged_at || item.created_at || item.date || item.recorded_at
    return stamp ? dateKey(stamp) : null
  }).filter(Boolean))
  const reflectionDays = currentStreak(reflectionDateSet)
  const bestAppStreak = longestStreak(activeDateSet)
  const year = new Date().getFullYear()
  const activeDaysThisYear = [...activeDateSet].filter(key => key.startsWith(String(year) + '-')).length
  const moodDef = defs.find(def => ['mood', 'feeling', 'emotional-wellbeing'].includes(String(def.slug || '').toLowerCase()))
  const moodToday = moodDef && todayLogs.find(log => String(log.metric_id) === String(moodDef.id))
  const todayCount = todayLogs.length + todayMeals.length
  const streakDays = useMemo(() => {
    const activeDates = new Set([...logs, ...meals].map(item => {
      const stamp = item.logged_at || item.created_at || item.date || item.recorded_at
      return stamp ? dateKey(stamp) : null
    }).filter(Boolean))
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    if (!activeDates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    let count = 0
    while (activeDates.has(dateKey(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [logs, meals])

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const now = new Date()
    const monday = new Date(now)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + index)
    const key = dateKey(monday)
    const count = [...logs, ...meals].filter(item => {
      const stamp = item.logged_at || item.created_at || item.date || item.recorded_at
      return stamp && dateKey(stamp) === key
    }).length
    return { key, label: monday.toLocaleDateString(undefined, { weekday: 'short' }), count }
  }), [logs, meals])
  const maxWeek = Math.max(1, ...week.map(day => day.count))
  useEffect(() => {
    const updateGlow = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / 300))
      document.documentElement.style.setProperty('--hs-scroll-progress', String(progress))
    }
    updateGlow()
    window.addEventListener('scroll', updateGlow, { passive: true })
    return () => window.removeEventListener('scroll', updateGlow)
  }, [])

  const now = new Date()

  const focusDef = defs.find(def => /focus/i.test(String(def.slug || def.name || '')))
  const focusToday = focusDef && todayLogs.find(log => String(log.metric_id) === String(focusDef.id))
  const latestFocus = focusToday ? valueText(focusToday, focusDef) : 'Not logged yet'
  const moodValue = moodToday && moodDef ? valueText(moodToday, moodDef) : 'Not checked in'

  const openMood = () => {
    if (openMoodCheckIn) openMoodCheckIn()
    else if (moodDef) openLog(metricArea[moodDef.slug] || 'health', moodDef)
    else openLog()
  }

  return <main className="hs-home">
    <header className="hs-home-heading">
      <div className="hs-home-heading-copy"><h1>Summary</h1></div>
      <button type="button" className="hs-home-avatar" onClick={() => goTo('profile')} aria-label="Open profile">{firstName.slice(0,1).toUpperCase()}</button>
    </header>

    {returningAfterBreak && <section className="hs-welcome-back">
      <span><strong>Welcome back.</strong><small>You don't need to catch up. Start with today.</small></span>
      <button type="button" onClick={dismissReturnWelcome} aria-label="Dismiss"><span>×</span></button>
    </section>}

    <section className="hs-section">
      <div className="hs-section-heading"><h2>Pinned</h2><button type="button" onClick={() => goTo('goals')}>Edit</button></div>
      <div className="hs-pin-grid">
        <PinCard title="Steps" tone="orange" icon={Flame} value={todayCount} unit=" entries" detail="Today" onClick={() => goTo('logs')} graphic={<MiniBars tone="orange" values={week.map(day => day.count)}/>} />
        <PinCard title="Walking Steadiness" tone="amber" icon={Activity} value={focusToday ? latestFocus : '—'} unit="" detail="Today" onClick={() => focusDef ? openLog(metricArea[focusDef.slug] || 'career', focusDef) : goTo('goals')} graphic={<span className="hs-orb tone-amber"><span/></span>} />
        <PinCard title="State of Mind" tone="teal" icon={Heart} value={moodToday ? moodValue : '—'} unit="" detail="Yesterday" onClick={openReflection} graphic={<span className="hs-reflection-mark"><Heart size={28} fill="currentColor"/></span>} />
        <PinCard title="Vitals" tone="rose" icon={Activity} value={streakDays} unit={streakDays === 1 ? ' day' : ' days'} detail="Current" onClick={() => setStreakOpen(true)} graphic={<MiniBars tone="rose" values={week.map(day => day.count)} />} />
      </div>
    </section>

    <section className="hs-section">
      <div className="hs-section-heading"><h2>Highlights</h2></div>
      <SummaryRow icon={Target} tone="violet" title="Goals" detail={`${activeGoals.length} active`} onClick={() => goTo('goals')}/>
    </section>

    <section className="hs-section">
      <div className="hs-section-heading"><h2>Highlights</h2></div>
      <article className="hs-highlight-card tone-orange">
        <div className="hs-highlight-title"><Activity size={21}/><span>Daily activity</span></div>
        <h3>{todayCount ? `${todayCount} today` : 'No activity yet'}</h3>
        <div className="hs-highlight-divider"/>
        <div className="hs-week-chart" role="img" aria-label={week.map(day => `${day.label}: ${day.count} activities`).join(', ')}>
          {week.map((day, index) => <div className="hs-week-column" key={day.key}>
            <span className="hs-week-bar-wrap"><i className={index === ((now.getDay() + 6) % 7) ? 'is-current' : ''} style={{ height: `${Math.max(5, day.count / maxWeek * 100)}%` }}/></span>
            <small>{day.label}</small>
          </div>)}
        </div>
      </article>

      <article className="hs-highlight-card tone-violet">
        <div className="hs-highlight-title"><TrendingUp size={21}/><span>Goal progress</span></div>
        <h3>{activeGoals.length ? `${activeGoals.length} active goals` : 'No active goals'}</h3>
        <div className="hs-highlight-divider"/>
        {activeGoals.length ? <div className="hs-goal-highlight-list">
          {activeGoals.slice(0, 3).map(goal => <div key={goal.id} className="hs-goal-highlight">
            <span><strong>{goal.title}</strong><small>{Math.max(0, Math.min(100, Number(goal.progress || 0)))}%</small></span>
            <i><b style={{ width: `${Math.max(0, Math.min(100, Number(goal.progress || 0)))}%` }}/></i>
          </div>)}
        </div> : <p className="hs-empty-note">Add a goal to get started.</p>}
      </article>
    </section>

    <SummaryRow icon={TrendingUp} tone="teal" title="Show All Progress" detail="" onClick={() => goTo('progress')}/>

    <section className="hs-secondary-actions">
      <SummaryRow icon={Heart} tone="rose" title="How are you feeling?" detail="" onClick={openMood}/>
      <SummaryRow icon={BookOpen} tone="violet" title="Faith & spiritual growth" detail="" onClick={() => goTo('faith')}/>
    </section>

    {streakOpen && <div className="hs-streak-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setStreakOpen(false) }}>
      <section className="hs-streak-sheet" role="dialog" aria-modal="true" aria-labelledby="hs-streak-title">
        <div className="hs-streak-grabber" />
        <div className="hs-streak-actions">
          <button type="button" aria-label="Close streak details" onClick={() => setStreakOpen(false)}>×</button>
          <button type="button" aria-label="Share streak" onClick={() => {
            const message = `My EVOLV streak is ${streakDays} days. One day at a time.`
            if (navigator.share) navigator.share({ title: 'My EVOLV streak', text: message }).catch(() => {})
            else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(message).catch(() => {})
          }}>↗</button>
        </div>
        <h2 id="hs-streak-title">Your streaks</h2>
        <div className="hs-streak-stats">
          <article><span className="hs-streak-symbol">🔥</span><strong>{streakDays}</strong><small>App streak</small><em>Best {bestAppStreak} days</em></article>
          <article><span className="hs-streak-symbol">☀</span><strong>{reflectionDays}</strong><small>Reflection streak</small><em>Keep showing up</em></article>
        </div>
        <div className="hs-streak-week">
          {week.map((day, index) => {
            const isToday = day.key === dateKey(new Date())
            return <div className={`hs-streak-day ${day.count ? 'is-done' : ''} ${isToday ? 'is-today' : ''}`} key={day.key}>
              <small>{day.label.slice(0, 1)}</small><span>{new Date(day.key + 'T00:00:00').getDate()}</span>
              {day.count > 0 && <b aria-hidden="true">🔥</b>}
            </div>
          })}
        </div>
        <div className="hs-streak-foot">
          <strong>{Math.floor(streakDays / 7)} weeks in a row</strong>
          <span>{activeDaysThisYear} days in EVOLV this year</span>
        </div>
      </section>
    </div>}
    <div className="hs-bottom-space" aria-hidden="true"/>
  </main>
}
