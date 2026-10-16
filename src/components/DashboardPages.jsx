import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, Bell, Camera, Upload, Check, ChevronLeft, ChevronRight,
  Plus, Settings, Target, Pencil, Trash2, MessageCircle, HeartPulse, Apple,
  WalletCards, BriefcaseBusiness, Brain, Sprout, Moon, Droplets, Dumbbell,
  Footprints, Zap, Scale, Smile, Focus, NotebookPen, BookOpen, Receipt,
  PiggyBank, ArrowDownLeft, ArrowUpRight, Activity, Users, CheckCircle2,
  Utensils, Sparkles, Send, Sunrise, X, LineChart, ChevronDown
} from 'lucide-react'
import './DashboardPages.css'
import { AvatarPortrait, DEFAULT_AVATAR } from './AvatarStudio'
import Avatar3D from './Avatar3D'
import '../styles/tokens.css'
import './styles/Profile.css'
import HoldButton from './HoldButton'
import ProfileSettingsPage from './ProfileSettingsPage'
import DailyRoutinePage from './DailyRoutinePage'
import DailyAIInsight from './DailyAIInsight'

export function DashboardPages({ active, pageProps }) {
  if (active === 'overview') return <HomePage pageProps={pageProps} />
  if (active === 'routine') return <DailyRoutinePage pageProps={pageProps} />
  if (active === 'area') return <AreaPage pageProps={pageProps} />
  if (active === 'logs') return <DailyRoutinePage pageProps={pageProps} />
  if (active === 'log-detail') return <DailyRoutinePage pageProps={pageProps} />
  if (active === 'progress') return <ProgressPage pageProps={pageProps} />
  if (active === 'goals') return <GoalsPage pageProps={pageProps} />
  if (active === 'profile') return <ProfileSettingsPage pageProps={pageProps} />
  if (active === 'notifications') return <NotificationsPage pageProps={pageProps} />
  if (active === 'ai') return null
  return null
}

function HomePage({ pageProps }) {
  const {
    name, todayLogs = [], todayMeals = [], defs = [], icons = {}, metricArea = {},
    valueText, openLog, goTo, setArea, areas = {}, loading, logs = [], meals = [],
    goals = []
  } = pageProps

  const firstName = String(name || '').trim().split(/\\s+/)[0] || 'there'
  const [now, setNow] = useState(() => new Date())
  const [avatarStyle, setAvatarStyle] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('evolv-avatar-preferences') || '{}')
      return { ...DEFAULT_AVATAR, ...saved }
    } catch { return { ...DEFAULT_AVATAR } }
  })
  useEffect(() => {
    const syncAvatar = () => {
      try { setAvatarStyle({ ...DEFAULT_AVATAR, ...JSON.parse(localStorage.getItem('evolv-avatar-preferences') || '{}') }) } catch {}
    }
    window.addEventListener('evolv-avatar-updated', syncAvatar)
    return () => window.removeEventListener('evolv-avatar-updated', syncAvatar)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const greeting = now.getHours() >= 5 && now.getHours() < 12
    ? 'Good morning' : now.getHours() >= 12 && now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const moodMetric = defs.find(def => ['mood', 'feeling', 'emotional-wellbeing'].includes(String(def.slug || '').toLowerCase()))
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const recentActivity = [
    ...todayLogs.map((log, index) => {
      const def = defs.find(item => String(item.id) === String(log.metric_id))
      return def ? { key: `log-${log.id || index}`, title: def.name, detail: valueText(log, def), icon: icons[def.slug] || Activity, onClick: () => openLog(metricArea[def.slug], def) } : null
    }).filter(Boolean),
    ...todayMeals.map((meal, index) => ({
      key: `meal-${meal.id || index}`,
      title: meal.description || 'Meal logged',
      detail: meal.meal_type || 'Nutrition',
      icon: Utensils,
      onClick: () => openLog('nutrition', { slug: 'meals', name: 'Meal', value_type: 'meal' })
    }))
  ].slice(0, 3)

  function startCheckIn(selectedMood = '') {
    const mood = String(selectedMood || '').trim().toLowerCase()
    const moodPrompts = {
      good: "I checked in on EVOLV and I'm feeling good today. Start a gentle, conversational check-in. Ask one question at a time about what's helping me feel this way, without turning it into a long questionnaire. Only save a mood record after confirming the details with me.",
      okay: "I checked in on EVOLV and I'm feeling okay today. Help me understand how I'm doing with one gentle question at a time. Don't assume I'm happy or sad, and don't turn this into a long questionnaire. Only save a mood record after confirming the details with me.",
      low: "I checked in on EVOLV and I'm feeling low today. Respond with warmth, without diagnosing me or trying to fix everything at once. Ask one gentle question at a time about what might be weighing on me. Don't assume the cause, and only save a mood record after confirming the details with me.",
      stressed: "I checked in on EVOLV and I'm feeling stressed today. Help me slow down and understand what's putting pressure on me. Ask one gentle question at a time, then help me find one manageable next step. Don't diagnose me or assume the cause. Only save a mood record after confirming the details with me."
    }
    if (mood && moodPrompts[mood]) {
      localStorage.setItem('evolv-ai-pending-prompt', moodPrompts[mood])
      goTo('ai')
      return
    }
    if (moodMetric) openLog(metricArea[moodMetric.slug] || 'health', moodMetric)
    else openLog()
  }

  return (
    <div className="dashboard-home calm-home">
      <section className="calm-home-welcome calm-home-welcome-avatar">
        <div className="calm-home-welcome-copy">
          <span className="calm-home-greeting">{greeting}</span>
          <h1>{firstName}<span>.</span></h1>
          <p>A fresh moment, at your pace.</p>
        </div>
        <div className={`evolv-mascot-wrap glow-${avatarStyle.glow}`}>
          <span className="evolv-mascot-halo" aria-hidden="true" />
          <Avatar3D className="evolv-mascot evolv-custom-portrait" label="Your 3D EVOLV companion" />
        </div>
      </section>

      <section className="calm-checkin" aria-labelledby="calm-checkin-title">
        <h2 id="calm-checkin-title">How are you feeling?</h2>
        <p>Choose what feels closest.</p>
        <div className="calm-mood-options">
          {[
            { label: 'Good', mood: 'good', note: 'Feeling good' },
            { label: 'Okay', mood: 'okay', note: 'Taking it as it comes' },
            { label: 'Low', mood: 'low', note: 'A little heavy' },
            { label: 'Stressed', mood: 'stressed', note: 'A lot on my mind' }
          ].map(option => (
            <button type="button" key={option.mood} onClick={() => startCheckIn(option.label)} className={'calm-mood-option mood-' + option.mood} aria-label={`Check in: feeling ${option.label.toLowerCase()}`}>
              <span className="calm-mood-avatar-wrap" aria-hidden="true">
                <AvatarPortrait preferences={avatarStyle} expression={option.mood} className="calm-mood-avatar" />
              </span>
              <small>{option.label}</small>
            </button>
          ))}
        </div>
      </section>

      <DailyAIInsight dataLoading={loading} name={name} defs={defs} logs={logs} meals={meals} goals={goals} valueText={valueText} goTo={goTo} />

      <section className="calm-home-focus" aria-label="Your growth at a glance">
        <div className="calm-focus-heading">
          <div><h2>Your goals</h2></div>
          <button type="button" onClick={() => goTo('goals')} aria-label="View your goals"><ArrowRight size={18}/></button>
        </div>
        {activeGoals.length ? (
          <div className="calm-goal-snapshot">
            <div className="calm-goal-snapshot-top">
              <span className="calm-focus-mark"><Target size={19}/></span>
              <div className="calm-goal-snapshot-copy">
                <strong>{activeGoals[0].title}</strong>
                <small>{activeGoals.length > 1 ? `+ ${activeGoals.length - 1} more active ${activeGoals.length - 1 === 1 ? 'goal' : 'goals'}` : 'Your current focus'}</small>
              </div>
              <span className="calm-goal-percent">{Math.max(0, Math.min(100, Number(activeGoals[0].progress || 0)))}%</span>
            </div>
            <div className="calm-goal-progress-track" role="progressbar" aria-label={`Progress on ${activeGoals[0].title}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, Number(activeGoals[0].progress || 0)))}>
              <span style={{ width: `${Math.max(0, Math.min(100, Number(activeGoals[0].progress || 0)))}%` }} />
            </div>
            <button type="button" className="calm-goal-view-all" onClick={() => goTo('goals')}>View goals <ArrowRight size={14}/></button>
          </div>
        ) : (
          <button type="button" className="calm-goal-empty" onClick={() => goTo('goals')}>
            <span className="calm-focus-mark"><Target size={19}/></span>
            <span><strong>Set your first goal</strong><small>Start with one thing that matters.</small></span>
            <ArrowRight size={17}/>
          </button>
        )}
      </section>

      <section className="calm-home-activity">
        <div className="calm-focus-heading">
          <div><h2>Today</h2></div>
          <button type="button" onClick={() => goTo('logs')} aria-label="View check-in history"><ArrowRight size={18}/></button>
        </div>
        {loading ? (
          <p className="calm-activity-note">Bringing your day together…</p>
        ) : recentActivity.length ? (
          <div className="calm-activity-list">
            {recentActivity.map(item => {
              const Icon = item.icon
              return <button type="button" className="calm-activity-item" key={item.key} onClick={item.onClick}>
                <span><Icon size={17}/></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ChevronRight size={16}/>
              </button>
            })}
          </div>
        ) : (
          <button type="button" className="calm-activity-empty" onClick={startCheckIn}>
            <span className="calm-empty-plus"><Plus size={18}/></span>
            <span><strong>Nothing to catch up on.</strong><small>Whenever you're ready, start with one check-in.</small></span>
            <ArrowRight size={17}/>
          </button>
        )}
      </section>

    </div>
  )
}

function AreaPage({ pageProps }) {
  const { area, areas, defs, logs, meals, metricArea, latest, icons, valueText, openLog, goTo, onArticle } = pageProps
  return (()=>{
        const currentArea=areas[area]?area:'health'
        const m=areas[currentArea],I=m.icon
        const rs=defs.filter(d=>metricArea[d.slug]===currentArea)
        const areaLogs=logs.filter(l=>rs.some(d=>d.id===l.metric_id))
        const healthSections=[
          {title:'Body',slugs:['sleep','water','steps','exercise','energy','weight'],text:'The physical signals that help you understand how your body is doing.'},
          {title:'Emotional wellbeing',slugs:['mood','stress'],text:'Notice how you feel without judging it. Mood is information, not a verdict.'},
          {title:'Mind',slugs:['focus','reflection'],text:'Track focus and reflection when they help you understand your mental load.'}
        ]
        const nutritionMeals=meals.slice(0,20)
        const mealDays=new Set(meals.map(x=>x.logged_at?.slice(0,10)).filter(Boolean)).size
        const mealTypes=['breakfast','lunch','dinner','snack']
        const mealCount=meals.length
        const healthMetric=slug=>defs.find(d=>d.slug===slug)
        const healthLatest=slug=>{const d=healthMetric(slug);return d?latest[slug]:null}
        return <section className="panel-page dashboard-panel area-detail-page">
          <button className="area-back" onClick={()=>goTo('overview')}><ChevronLeft size={16}/> Home</button>
          <div className="area-detail-head">
            <span className="life-area-icon large" style={{'--area-color':m.color}}><I size={20}/></span>
            <span className="section-label">YOUR {m.title.toUpperCase()}</span>
            <h2>{m.title}</h2>
            <p>{currentArea==='health'?'Understand your body, emotions and everyday wellbeing.':currentArea==='nutrition'?'See what you are actually eating, without turning food into a score.':'Only the things you choose to track.'}</p>
          </div>

          {currentArea==='health'&&<>
            <div className="health-command-row">
              <div><span className="section-label">TODAY</span><h3>Your wellbeing, one signal at a time.</h3><p>There is no perfect day. Start by noticing what is real.</p></div>
              <button className="button button-primary" onClick={()=>openLog('health')}><Plus size={16}/> Log health</button>
            </div>
            <div className="health-section-list">
              {healthSections.map(section=>{
                const available=section.slugs.map(healthMetric).filter(Boolean)
                return <section className="health-subsection" key={section.title}>
                  <div className="health-subsection-head"><div><span className="section-label">{section.title.toUpperCase()}</span><h3>{section.title}</h3></div><p>{section.text}</p></div>
                  <div className="metric-detail-list">
                    {available.map(d=>{const M=icons[d.slug]||Sparkles;const l=healthLatest(d.slug);return <div className={d.slug==='mood'?'health-metric-wrap mood-metric-wrap':'health-metric-wrap'} key={d.id}>
                      <button className="metric-detail-row health-metric-row" onClick={()=>openLog('health',d)}>
                        <span className="metric-row-icon" style={{'--metric-color':d.color||m.color}}><M size={17}/></span>
                        <span><strong>{d.name}</strong><small>{l?valueText(l,d):'Not logged yet'}</small></span>
                        <span className="health-row-action">{l?'View history':'Log'}</span><ChevronRight size={16}/>
                      </button>
                      {d.slug==='mood'&&<button className="mood-reading-button" onClick={()=>openArticle('mood','health')}><BookOpen size={15}/> Read something uplifting <ArrowRight size={14}/></button>}
                    </div>})}
                  </div>
                </section>
              })}
            </div>
            <section className="health-reading-strip">
              <div><span className="section-label">EXPLORE HEALTH</span><h3>Understand the signals, not just the numbers.</h3><p>Short, friendly explainers grounded in trusted health guidance.</p></div>
              <button className="health-reading-link" onClick={()=>onArticle?.('area','health')}>Read health guide <ArrowRight size={15}/></button>
            </section>
            <section className="wellbeing-guide">
              <span className="section-label">UNDERSTANDING YOUR WELLBEING</span>
              <h3>Your feelings are worth noticing.</h3>
              <p>Mood, stress, sleep, movement and connection can all be useful pieces of the picture. Evolv records what you choose to notice; it does not diagnose you or turn one difficult day into a definition of who you are.</p>
              <div className="wellbeing-guide-grid">
                <div><strong>Notice</strong><span>How do you feel?</span></div>
                <div><strong>Understand</strong><span>What might be influencing today?</span></div>
                <div><strong>Respond</strong><span>What small thing could support you?</span></div>
              </div>
            </section>
          </>}

          {currentArea==='nutrition'&&<>
            <div className="nutrition-overview">
              <div><span className="section-label">YOUR FOOD LOG</span><h3>Eat with awareness, not pressure.</h3><p>Record meals simply. Add nutrition details only when they are useful to you.</p></div>
              <button className="button button-primary" onClick={()=>openLog('nutrition',{slug:'meals',name:'Meal',value_type:'meal'})}><Plus size={16}/> Log a meal</button>
            </div>
            <div className="nutrition-stats">
              <div><strong>{mealCount}</strong><span>meals logged</span></div>
              <div><strong>{mealDays}</strong><span>days recorded</span></div>
              <div><strong>{meals.filter(x=>x.water_ml).length}</strong><span>meals with water logged</span></div>
            </div>
            <div className="nutrition-meal-types">
              {mealTypes.map(type=><div key={type}><span>{type}</span><strong>{meals.filter(x=>x.meal_type===type).length}</strong></div>)}
            </div>
            <section className="meal-history">
              <div className="health-subsection-head"><div><span className="section-label">RECENT MEALS</span><h3>What you’ve eaten.</h3></div><p>{mealCount?'Your latest entries, newest first.':'Your meal history will appear here.'}</p></div>
              {nutritionMeals.length?<div className="meal-history-list">{nutritionMeals.map(meal=><article className="meal-history-row" key={meal.id}>
                <span className="meal-type-dot">{(meal.meal_type||'meal').slice(0,1).toUpperCase()}</span>
                <div><strong>{meal.description}</strong><small>{meal.meal_type||'Meal'} · {new Date(meal.logged_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></div>
                <span className="meal-nutrition">{meal.calories?meal.calories+' kcal':''}{meal.protein_g?' · '+meal.protein_g+'g protein':''}</span>
              </article>)}</div>:<div className="nutrition-empty"><Utensils size={22}/><p>Nothing logged yet. Start with your next meal.</p></div>}
            </section>
            <section className="nutrition-note"><span className="section-label">A GENTLER APPROACH</span><h3>Food is part of your life, not a grade.</h3><p>Calories and macros are optional details. A simple meal description is enough to begin noticing your routine.</p></section>
          </>}

          {!['health','nutrition'].includes(currentArea)&&<><div className="metric-detail-list">{rs.map(d=>{const M=icons[d.slug]||Sparkles;return <button className="metric-detail-row" key={d.id} onClick={()=>openLog(currentArea,d)}><span className="metric-row-icon" style={{'--metric-color':d.color||m.color}}><M size={17}/></span><span><strong>{d.name}</strong><small>{latest[d.slug]?valueText(latest[d.slug],d):'Log '+d.name.toLowerCase()}</small></span><ChevronRight size={16}/></button>})}</div><div className="area-note"><span>ONE STEP AT A TIME</span><p>You do not need to measure everything. Track what helps you understand your life.</p></div></>}
        </section>
      })()
}

function LogsPage({ pageProps }) {
  const {
    defs = [], logs = [], meals = [], icons = {}, openEntry = () => {},
    startEditEntry, deleteEntry, goTo = () => {}, openLog = () => {}
  } = pageProps
  return (()=>{
        const metricById=Object.fromEntries(defs.map(d=>[d.id,d]))
        const items=[...logs.map(entry=>({type:'log',entry,date:new Date(entry.logged_at)})),...meals.map(entry=>({type:'meal',entry,date:new Date(entry.logged_at)}))].sort((a,b)=>b.date-a.date)
        const formatValue=item=>{
          if(item.type==='meal') return item.entry.description||'Meal logged'
          const def=metricById[item.entry.metric_id],value=Number(item.entry.value)
          if(!def) return 'Entry logged'
          if(def.slug==='mood') return ({1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'}[value]||String(item.entry.value))
          if(def.slug==='sleep'){const minutes=Math.max(0,Math.round(value*60)),hours=Math.floor(minutes/60),mins=minutes%60;return hours?(mins?hours+'h '+mins+'m':hours+'h'):mins+'m'}
          if(def.value_type==='scale') return value+'/5'
          if(def.unit==='NGN') return '₦'+value.toLocaleString()
          return value.toLocaleString()+(def.unit?' '+def.unit:'')
        }
        return <section className="panel-page dashboard-panel logs-page">
          <button className="area-back" onClick={()=>goTo('progress')}><ChevronLeft size={16}/> Progress</button>
          <div className="logs-page-hero"><span className="section-label">YOUR HISTORY</span><h2>Previous logs.</h2><p>A quiet record of the things you chose to notice. Open an entry for the full story.</p></div>
          <div className="logs-page-toolbar">
            <div><strong>{items.length}</strong><span>{items.length===1?'saved entry':'saved entries'}</span></div>
            <div className="logs-page-toolbar-actions"><span>Newest first</span><button type="button" className="button button-primary" onClick={()=>openLog()}><Plus size={15}/> Log something</button></div>
          </div>
          {items.length ? <div className="logs-page-list">{items.map((item,index)=>{
            const def=item.type==='log'?metricById[item.entry.metric_id]:null,label=item.type==='meal'?(item.entry.meal_type||'Meal'):def?.name||'Entry',M=item.type==='meal'?Utensils:(icons[def?.slug]||Activity)
            return <button type="button" className="logs-page-row" key={item.type+'-'+(item.entry.id||index)} onClick={()=>openEntry(item)}><span className="logs-page-icon"><M size={18}/></span><span className="logs-page-copy"><small>{item.type==='meal'?'NUTRITION':(def?.area||'LOG').toUpperCase()}</small><strong>{label}</strong><span>{formatValue(item)}</span></span><time>{item.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}<br/>{item.date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</time><ChevronRight size={18}/></button>
          })}</div> : <div className="logs-page-empty"><NotebookPen size={24}/><strong>No previous logs yet.</strong><p>Your saved health, life, money and meal entries will appear here.</p></div>}
        </section>
      })()
}

function LogDetailPage({ pageProps }) {
  const { selectedEntry, goTo, startEditEntry, deleteEntry, icons } = pageProps
  return selectedEntry&&(()=>{
        const {type,entry,definition}=selectedEntry,date=entry.logged_at||entry.created_at,title=type==='meal'?'Meal':definition?.name||'Entry',M=type==='meal'?Utensils:(icons[definition?.slug]||Activity)
        const value=type==='meal'?(entry.description||'Meal logged'):definition?.slug==='mood'?({1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'}[Number(entry.value)]||String(entry.value)):definition?(Number(entry.value).toLocaleString()+(entry.unit?' '+entry.unit:'')):'Entry logged'
        return <section className="panel-page dashboard-panel log-detail-page">
          <button className="area-back" onClick={()=>goTo('logs')}><ChevronLeft size={16}/> Previous logs</button>
          <div className="log-detail-hero"><div className="log-detail-icon"><M size={22}/></div><span className="section-label">{type==='meal'?'NUTRITION':(definition?.area||'LOG').toUpperCase()}</span><h2>{title}.</h2><p>{type==='meal'?'A saved meal from your personal history.':'A saved check-in from your personal history.'}</p></div>
          <div className="log-detail-sections">
            <section className="log-detail-card log-detail-primary"><span className="section-label">WHAT YOU LOGGED</span><strong>{value}</strong><time>{date?new Date(date).toLocaleString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—'}</time></section>
            {type==='meal'&&<section className="log-detail-card"><span className="section-label">NUTRITION DETAILS</span><div className="log-detail-stats">{[['Calories',entry.calories!=null?entry.calories+' kcal':null],['Protein',entry.protein_g!=null?entry.protein_g+' g':null],['Carbs',entry.carbs_g!=null?entry.carbs_g+' g':null],['Fat',entry.fat_g!=null?entry.fat_g+' g':null],['Water',entry.water_ml!=null?entry.water_ml+' ml':null]].filter(x=>x[1]!=null).map(([label,val])=><div key={label}><span>{label}</span><strong>{val}</strong></div>)}</div></section>}
            <section className="log-detail-card"><span className="section-label">NOTE</span><p className="log-detail-note">{entry.note||'No note was added to this entry.'}</p></section>
          </div>
          <div className="log-detail-actions"><button type="button" className="log-detail-delete" onClick={()=>deleteEntry(selectedEntry)}><Trash2 size={16}/> Delete</button><button type="button" className="button button-primary" onClick={()=>startEditEntry(selectedEntry)}><Pencil size={16}/> Edit log <ArrowRight size={15}/></button></div>
        </section>
      })()
}

function ProgressPage({ pageProps }) {
  const { progressRange, setProgressRange, progressMetric, setProgressMetric, logs, meals, defs, goals, checkins = [], momentum = 0, goTo, valueText, WeeklyProgressChart: Chart } = pageProps
  const heatmapScrollRef = useRef(null)
  const [heatmapNow, setHeatmapNow] = useState(() => new Date())
  const [goalGraphRange, setGoalGraphRange] = useState('year')
  const [expandedProgressCard, setExpandedProgressCard] = useState('goal-progress')
  useEffect(() => {
    const timer = window.setInterval(() => setHeatmapNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])
  const dateKey = (date) => new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date)
  const heatmapActivity = [
    ...((pageProps.logs || []).map(item => ({ date: item.logged_at || item.created_at }))),
    ...((pageProps.meals || []).map(item => ({ date: item.logged_at || item.created_at })))
  ].filter(item => item.date && !Number.isNaN(new Date(item.date).getTime()))
  const heatmapActivityByDay = heatmapActivity.reduce((map, item) => {
    const key = dateKey(new Date(item.date))
    map[key] = (map[key] || 0) + 1
    return map
  }, {})

  // The graph reflects deliberate, saved goal check-ins rather than edits.
  const goalActivityByDay = (pageProps.goalCheckins || []).reduce((map, item) => {
    const key = item.checkin_date || (item.created_at ? dateKey(new Date(item.created_at)) : '')
    if (key) map[key] = (map[key] || 0) + 1
    return map
  }, {})
  const goalGraphDays = (() => {
    const end = new Date(heatmapNow)
    end.setHours(0, 0, 0, 0)
    const count = goalGraphRange === 'week' ? 7 : goalGraphRange === 'month' ? 30 : 365
    const start = new Date(end)
    start.setDate(start.getDate() - count + 1)
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = dateKey(date)
      return { key, date, count: goalActivityByDay[key] || 0 }
    })
  })()
  const goalActiveDays = goalGraphDays.filter(day => day.count > 0).length
  const goalActionsInRange = goalGraphDays.reduce((sum, day) => sum + day.count, 0)
  const heatmapYear = heatmapNow.getFullYear()
  const heatmapYearStart = new Date(heatmapYear, 0, 1)
  const heatmapStart = new Date(heatmapYearStart)
  heatmapStart.setDate(heatmapStart.getDate() - heatmapStart.getDay())
  const heatmapEnd = new Date(heatmapYear, 11, 31)
  const heatmap = []
  for (const date = new Date(heatmapStart); date <= heatmapEnd; date.setDate(date.getDate() + 1)) {
    const day = new Date(date)
    const key = dateKey(day)
    heatmap.push({ key, count: heatmapActivityByDay[key] || 0, date: day })
  }
  const heatmapMonthLabels = Array.from({ length: 12 }, (_, month) => {
    const date = new Date(heatmapYear, month, 1)
    const dayOffset = Math.round((date - heatmapStart) / 86400000)
    return { key: dateKey(date), date, index: dayOffset }
  })
  useEffect(() => {
    const scrollToCurrentMonth = () => {
      const container = heatmapScrollRef.current
      if (!container) return
      const firstOfMonth = new Date(heatmapNow.getFullYear(), heatmapNow.getMonth(), 1)
      const dayOffset = Math.round((firstOfMonth - heatmapStart) / 86400000)
      const weekColumn = Math.floor(dayOffset / 7)
      const styles = window.getComputedStyle(container.querySelector('.home-heatmap-grid'))
      const cellWidth = parseFloat(styles.gridAutoColumns) || 16
      const columnGap = parseFloat(styles.columnGap) || 5
      container.scrollLeft = Math.max(0, weekColumn * (cellWidth + columnGap) - (cellWidth + columnGap) * 2)
    }
    const frame = window.requestAnimationFrame(scrollToCurrentMonth)
    window.addEventListener('resize', scrollToCurrentMonth)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', scrollToCurrentMonth)
    }
  }, [heatmapNow.getFullYear(), heatmapNow.getMonth()])

  return (()=>{
        const now=new Date()
        const periodStart=new Date(now)
        periodStart.setHours(0,0,0,0)
        periodStart.setDate(periodStart.getDate()-(progressRange-1))
        const periodLogs=logs.filter(l=>new Date(l.logged_at)>=periodStart&&new Date(l.logged_at)<=now)
        const periodMeals=meals.filter(m=>new Date(m.logged_at)>=periodStart&&new Date(m.logged_at)<=now)
        const activeGoals=goals.filter(g=>g.status==='active')
        const goalProgress=activeGoals.length
          ? Math.round(activeGoals.reduce((sum,g)=>sum+Math.min(100,Math.max(0,Number(g.progress)||0)),0)/activeGoals.length)
          : 0
        const activeDaySet=new Set([
          ...periodLogs.map(l=>new Date(l.logged_at).toISOString().slice(0,10)),
          ...periodMeals.map(m=>new Date(m.logged_at).toISOString().slice(0,10))
        ])
        const thingsLogged=periodLogs.length+periodMeals.length
        const activeDays=activeDaySet.size

        return <section className="panel-page dashboard-panel progress-page">
          <div className="progress-heading">
            <span className="section-label">PROGRESS</span>
            <h2>Your progress.</h2>
            <p>See the few things that matter most.</p>
            <button type="button" className="manage-logs-button" onClick={()=>goTo('logs')}>
              <span className="manage-logs-button-icon"><NotebookPen size={17}/></span>
              <span className="manage-logs-button-copy"><strong>Previous logs</strong><small>View, edit or delete</small></span>
              <span className="manage-logs-button-arrow"><ChevronRight size={17}/></span>
            </button>
          </div>

          <section className="home-heatmap-card progress-heatmap-card" aria-label="Yearly activity">
            <div className="home-heatmap-heading">
              <h2>Activity</h2>
              <div className="home-heatmap-total"><strong>{heatmapActivity.length}</strong><span>check-ins</span></div>
            </div>
            <div className="home-heatmap-scroll" ref={heatmapScrollRef}>
              <div className="home-heatmap-months" aria-hidden="true">
                {heatmapMonthLabels.map(item => <span key={item.key} style={{ gridColumnStart: Math.floor(item.index / 7) + 1 }}>{item.date.toLocaleDateString(undefined, { month: 'short' })}</span>)}
              </div>
              <div className="home-heatmap-grid" role="img" aria-label={`Contribution graph across ${heatmapYear}`}>
                {heatmap.map(day => <span key={day.key} className={`home-heatmap-cell level-${day.count === 0 ? 0 : day.count === 1 ? 1 : day.count <= 3 ? 2 : day.count <= 5 ? 3 : 4}`} title={`${day.count} check-ins · ${day.date.toLocaleDateString()}`}/>)}
              </div>
            </div>
            <div className="home-heatmap-footer"><span>Less <i className="level-0"/><i className="level-1"/><i className="level-2"/><i className="level-3"/><i className="level-4"/> More</span><span>{new Set(heatmap.filter(day => day.count > 0 && day.date >= new Date(heatmapNow.getFullYear(), heatmapNow.getMonth(), heatmapNow.getDate() - 6)).map(day => day.key)).size}/7 this week</span></div>
          </section>

          <section className="home-heatmap-card goal-heatmap-card" aria-label="Goal contribution graph">
            <div className="home-heatmap-heading goal-heatmap-heading">
              <div><h2>Goal activity</h2><p>Small steps, recorded over time.</p></div>
              <div className="home-heatmap-total"><strong>{goalActiveDays}</strong><span>active days</span></div>
            </div>
            <div className="goal-heatmap-toolbar">
              <div className="goal-heatmap-summary"><strong>{goalActionsInRange}</strong><span>goal check-ins</span></div>
              <div className="goal-heatmap-range" role="group" aria-label="Goal activity time range">
                {['week', 'month', 'year'].map(range => <button key={range} type="button" className={goalGraphRange === range ? 'is-active' : ''} aria-pressed={goalGraphRange === range} onClick={() => setGoalGraphRange(range)}>{range.charAt(0).toUpperCase() + range.slice(1)}</button>)}
              </div>
            </div>
            <div className={`goal-heatmap-scroll ${goalGraphRange === 'year' ? 'is-year' : ''}`}>
              <div className={`goal-heatmap-grid goal-heatmap-${goalGraphRange}`} role="group" aria-label={`Goal activity over the past ${goalGraphRange === 'week' ? '7 days' : goalGraphRange === 'month' ? '30 days' : 'year'}`}>
                {goalGraphDays.map(day => <span key={day.key} className={`goal-heatmap-cell level-${day.count === 0 ? 0 : day.count === 1 ? 1 : day.count === 2 ? 2 : day.count <= 4 ? 3 : 4}`} title={`${day.count} goal check-in${day.count === 1 ? '' : 's'} · ${day.date.toLocaleDateString()}`} aria-label={`${day.count} goal check-in${day.count === 1 ? '' : 's'} on ${day.date.toLocaleDateString()}`} />)}
              </div>
            </div>
            <div className="goal-heatmap-footer"><span>{goalGraphDays[0]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {goalGraphDays[goalGraphDays.length - 1]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span className="goal-heatmap-legend">Less <i className="level-0"/><i className="level-1"/><i className="level-2"/><i className="level-3"/><i className="level-4"/> More</span></div>
            <p className="goal-heatmap-note">Tracks the days you deliberately checked in on a goal. Earlier activity isn’t backfilled.</p>
          </section>

          <section className="progress-section-card progress-goals-card">
            <div className="progress-section-head">
              <div><span className="section-label">GOALS</span><h3>Your direction.</h3></div>
              <button type="button" onClick={()=>goTo('goals')}>Manage <ArrowRight size={14}/></button>
            </div>

            {activeGoals.length ? (
              <div className="progress-goal-list">
                {activeGoals.slice(0,4).map(goal=>{
                  const value=Math.min(100,Math.max(0,Number(goal.progress)||0))
                  return <article className="progress-goal-row" key={goal.id}>
                    <div className="progress-goal-row-top">
                      <div><strong>{goal.title}</strong>{goal.due_date&&<span>Due {new Date(goal.due_date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span>}</div>
                      <b>{value}%</b>
                    </div>
                    <div className="progress-goal-track"><i style={{width:value+'%'}}/></div>
                  </article>
                })}
              </div>
            ) : (
              <div className="progress-empty-inline">
                <Target size={22}/>
                <div><strong>No goals yet.</strong><p>Add a goal when you are ready.</p></div>
                <button type="button" className="button button-primary" onClick={()=>goTo('goals')}><Plus size={15}/> Add goal</button>
              </div>
            )}
          </section>

          <div className="progress-overview-grid progress-simple-stats progress-accordion" aria-label="Progress details">
            {[
              { id: 'goal-progress', label: 'GOAL PROGRESS', value: activeGoals.length ? goalProgress + '%' : '—', detail: 'Across your active goals.' },
              { id: 'logged', label: 'LOGGED', value: thingsLogged, detail: `Entries in ${progressRange} days.` },
              { id: 'active-days', label: 'ACTIVE DAYS', value: activeDays, detail: 'Days you checked in.' }
            ].map((item, index) => {
              const isOpen = expandedProgressCard === item.id
              return (
                <article className={`progress-overview-card progress-accordion-card ${isOpen ? 'is-open' : 'is-closed'}`} key={item.id}>
                  <button
                    type="button"
                    className="progress-accordion-trigger"
                    aria-expanded={isOpen}
                    aria-controls={`progress-panel-${item.id}`}
                    onClick={() => setExpandedProgressCard(isOpen ? null : item.id)}
                  >
                    <span className="section-label">{item.label}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                  <div
                    className="progress-accordion-panel"
                    id={`progress-panel-${item.id}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="progress-accordion-panel-inner">
                      <strong>{item.value}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

        </section>
      })()
}

function GoalsPage({ pageProps }) {
  const [expandedGoalId, setExpandedGoalId] = useState(null)
  const { goTo, goalTitle, setGoalTitle, goalDescription, setGoalDescription, goalDueDate, setGoalDueDate, goalType, setGoalType, goalNextAction, setGoalNextAction, createGoal, editingGoal, setEditingGoal, saving, saveGoalEdit, goals, goalCheckins = [], goalMilestones = [], goalPlans = {}, goalCoachLoading = {}, goalMilestoneDrafts = {}, setGoalMilestoneDrafts, updateGoal, beginGoalEdit, deleteGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone, generateGoalPlan, applyGoalPlan, checkInGoal } = pageProps
  const resetForm = () => { setEditingGoal(null); setGoalTitle(''); setGoalDescription(''); setGoalDueDate(''); setGoalType('project'); setGoalNextAction('') }
  const dateKey = date => new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
  return <section className="panel-page dashboard-panel goals-page">
    <button className="area-back" onClick={()=>goTo('progress')}><ChevronLeft size={16}/> Progress</button>
    <span className="section-label">YOUR GOALS</span><h2>Goals</h2>
    <form className="goal-create-form" onSubmit={editingGoal?saveGoalEdit:createGoal}>
      <div className="goal-type-choice" role="group" aria-label="Goal structure">
        <button type="button" className={goalType==='project'?'is-active':''} aria-pressed={goalType==='project'} onClick={()=>setGoalType('project')}><BriefcaseBusiness size={17}/><span><strong>Project</strong></span></button>
        <button type="button" className={goalType==='habit'?'is-active':''} aria-pressed={goalType==='habit'} onClick={()=>setGoalType('habit')}><Sprout size={17}/><span><strong>Habit</strong></span></button>
      </div>
      <input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} placeholder={goalType==='habit'?'What do you want to practise?':'What do you want to accomplish?'} required/>
      <textarea value={goalDescription} onChange={e=>setGoalDescription(e.target.value)} placeholder="Why does this matter? (optional)" rows="3"/>
      <label className="goal-next-action-field"><span>Next action</span><input value={goalNextAction} onChange={e=>setGoalNextAction(e.target.value)} placeholder="What is the very next step?"/></label>
      <label className="goal-date-field"><span>Target date <small>optional</small></span><input type="date" value={goalDueDate} onChange={e=>setGoalDueDate(e.target.value)}/></label>
      <div className="goal-form-actions"><button className="button button-primary" disabled={saving} type="submit">{editingGoal?<><Check size={15}/> {saving?'Saving…':'Save changes'}</>:<><Plus size={15}/> {saving?'Saving…':'Add goal'}</>}</button>{editingGoal&&<button type="button" className="goal-cancel-button" onClick={resetForm}>Cancel</button>}</div>
    </form>
    <div className="goal-list">{goals.map(g=>{
      const isHabit=(g.goal_type||'project')==='habit'
      const milestones=goalMilestones.filter(item=>item.goal_id===g.id)
      const completedMilestones=milestones.filter(item=>item.is_completed).length
      const lastSevenDays=new Set(goalCheckins.filter(item=>item.goal_id===g.id&&item.checkin_date>=dateKey(new Date(Date.now()-6*86400000))).map(item=>item.checkin_date))
      const isExpanded = expandedGoalId === g.id
      return <article className={`goal-item goal-accordion-item ${isExpanded ? 'is-expanded' : 'is-collapsed'}`} key={g.id}>
        <button type="button" className="goal-accordion-trigger" aria-expanded={isExpanded} onClick={() => setExpandedGoalId(current => current === g.id ? null : g.id)}>
          <span className="goal-accordion-heading"><span className="goal-accordion-status">{g.status==='completed'?'Completed':g.status==='archived'?'Archived':'In progress'} · {isHabit?'Habit':'Project'}</span><strong>{g.title}</strong></span>
          <ChevronDown size={18} aria-hidden="true" className="goal-accordion-chevron" />
        </button>
        <div className="goal-item-content"><div className="goal-item-content-inner">
        <div className="goal-item-top"><div>{g.description&&<p>{g.description}</p>}{g.due_date&&<small className="goal-due-copy">Target {new Date(g.due_date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</small>}</div><strong>{isHabit?lastSevenDays.size+'/7':Math.min(100,Math.max(0,Number(g.progress)||0))+'%'}</strong></div>
        <div className="mini-progress"><i style={{width:(isHabit?lastSevenDays.size/7*100:Math.min(100,Math.max(0,Number(g.progress)||0)))+'%'}}/></div>
        <div className="goal-next-action"><span>NEXT ACTION</span><p className={g.next_action?'':'is-empty'}>{g.next_action||'Add a next step, or plan it with AI.'}</p></div>
        {isHabit&&<div className="goal-habit-week"><div className="goal-milestone-heading"><span>CONSISTENCY</span><small>{lastSevenDays.size}/7 days this week</small></div><div>{Array.from({length:7},(_,index)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-(6-index));const key=dateKey(date);return <i key={key} className={lastSevenDays.has(key)?'is-done':''} title={date.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}/>})}</div><button type="button" className="goal-checkin-button" disabled={g.status==='completed'||lastSevenDays.has(dateKey(new Date()))} onClick={()=>checkInGoal(g)}><Check size={15}/>{lastSevenDays.has(dateKey(new Date()))?'Checked in today':'Log today’s practice'}</button></div>}
        <div className="goal-milestone-section"><div className="goal-milestone-heading"><span>{isHabit?'PRACTICE STRUCTURE':'MILESTONES'}</span><small>{completedMilestones}/{milestones.length} complete</small></div>{milestones.map(item=><div className={'goal-milestone-row'+(item.is_completed?' is-complete':'')} key={item.id}><label><input type="checkbox" checked={item.is_completed} onChange={()=>toggleGoalMilestone(item)}/><span>{item.title}</span></label><button type="button" aria-label={'Delete milestone '+item.title} onClick={()=>deleteGoalMilestone(item)}><X size={14}/></button></div>)}<form className="goal-add-milestone" onSubmit={async event=>{event.preventDefault();const title=goalMilestoneDrafts[g.id]||'';if(await addGoalMilestone(g,title))setGoalMilestoneDrafts(current=>({...current,[g.id]:''}))}}><input value={goalMilestoneDrafts[g.id]||''} onChange={event=>setGoalMilestoneDrafts(current=>({...current,[g.id]:event.target.value}))} placeholder={isHabit?'Add a routine step':'Add a milestone'} aria-label={isHabit?'New routine step':'New milestone'} maxLength={180}/><button type="submit" disabled={!(goalMilestoneDrafts[g.id]||'').trim()}><Plus size={15}/> Add</button></form></div>
        {goalPlans[g.id]&&<div className="goal-ai-plan"><div className="goal-ai-plan-heading"><Sparkles size={16}/><strong>Proposed plan</strong></div><p className="goal-ai-next"><b>Next action</b>{goalPlans[g.id].next_action}</p><ol>{goalPlans[g.id].milestones.map((title,index)=><li key={index}>{title}</li>)}</ol><button type="button" className="goal-apply-plan" onClick={()=>applyGoalPlan(g)}><Check size={15}/> Save plan to this goal</button></div>}
        <div className="goal-coach-row"><button type="button" onClick={()=>generateGoalPlan(g)} disabled={!!goalCoachLoading[g.id]}><Sparkles size={15}/>{goalCoachLoading[g.id]?'Building your plan…':'Plan with AI'}</button>{!isHabit&&g.status!=='completed'&&<button type="button" className="goal-checkin-button" onClick={()=>checkInGoal(g)}><Check size={15}/> Log a step</button>}</div>
        <div className="goal-item-actions"><select value={g.status||'active'} onChange={e=>updateGoal(g,{status:e.target.value})} aria-label="Goal status"><option value="active">In progress</option><option value="completed">Completed</option><option value="archived">Archived</option></select><button type="button" onClick={()=>beginGoalEdit(g)} aria-label={'Edit '+g.title}><Pencil size={15}/> Edit</button><button type="button" className="goal-delete-button" onClick={()=>deleteGoal(g)} aria-label={'Delete '+g.title}><Trash2 size={15}/> Delete</button></div>
        </div></div>
      </article>
    })}{!goals.length&&<div className="goal-empty"><Target size={22}/><p>No goals yet. Add your first one above.</p></div>}</div>
  </section>
}

function ProfilePage({ pageProps }) {
  const {
    profileName, setProfileName, profile, data, avatarUrl, avatarInputRef, avatarUploading,
    handleAvatarChange, removeAvatar, saveProfile, profileMessage,
    notificationsEnabled, toggleNotifications, notificationTimes, reflectionTime, saveNotificationTime, toggleNotificationTime,
    saveQuietHour, toggleQuietHours, openReflection, deleteAccount, deleting, onLogout
  } = pageProps
  return <section className="panel-page dashboard-panel settings-page">
  <div className="settings-heading">
    <span className="section-label">YOUR SPACE</span>
    <h2>Profile.</h2>
    <p>A home for the person behind your EVOLV journey.</p>
  </div>

  <div className="profile-hero-card">
    <div className="profile-avatar-wrap">
      <button className="profile-avatar-button" type="button" onClick={()=>avatarInputRef.current?.click()} aria-label="Change profile photo" disabled={avatarUploading}>
        {avatarUrl?<img src={avatarUrl} alt="" className="profile-avatar-image"/>:<span className="profile-avatar">{(profileName||'E').trim().charAt(0).toUpperCase()}</span>}
        <span className="profile-avatar-camera"><Camera size={17}/></span>
      </button>
      <input ref={avatarInputRef} className="profile-avatar-input" type="file" accept="image/*" onChange={handleAvatarChange}/>
      <div className="profile-photo-actions">
        <button type="button" onClick={()=>avatarInputRef.current?.click()} disabled={avatarUploading}><Upload size={15}/>{avatarUploading?'Uploading…':'Change photo'}</button>
        {avatarUrl&&<button type="button" onClick={removeAvatar} disabled={avatarUploading}>Remove</button>}
      </div>
    </div>
    <div className="profile-hero-copy">
      <span className="section-label">EVOLV MEMBER</span>
      <h3>{profileName||'Your name'}</h3>
      <p>{profile?.email||'Your account email'}</p>
      <small>Personalise your space with a photo and keep your journey recognisably yours.</small>
    </div>
    <div className="profile-hero-status"><span></span> Active</div>
  </div>

  <div className="profile-facts-grid">
    <div><span>FOCUS</span><strong>{profile?.focus||data.focus||'Choose your direction'}</strong></div>
    <div><span>GROWTH AREAS</span><strong>{(profile?.growth_areas||data.areas||[]).length || 0} selected</strong></div>
    <div><span>FIRST GOAL</span><strong>{profile?.first_goal||data.goal||'Add your first goal'}</strong></div>
  </div>

  <div className="settings-section">
    <div className="settings-section-head">
      <div><span className="section-label">ACCOUNT</span><h3>Personal details</h3></div>
      <Settings size={20}/>
    </div>
    <div className="settings-card">
      <form onSubmit={saveProfile}>
        <label><span>First name</span><input value={profileName} onChange={e=>setProfileName(e.target.value)} /></label>
        <div className="profile-account-email">
          <span>ACCOUNT EMAIL</span>
          <strong>{profile?.email||'Connected to your EVOLV account'}</strong>
        </div>
        <button className="button button-primary" type="submit">Save changes</button>
        {profileMessage&&<p className="auth-message">{profileMessage}</p>}
      </form>
    </div>
  </div>



  <div className="settings-section notifications-settings-section">
    <div className="settings-section-head"><div><span className="section-label">REMINDERS</span><h3>Notifications</h3></div><Bell size={20}/></div>
    <div className="notification-master-row"><div><strong>Daily reminders</strong><span>Three thoughtful check-ins, spaced through your day.</span></div><button type="button" className={notificationsEnabled?'settings-toggle active':'settings-toggle'} onClick={toggleNotifications} aria-pressed={notificationsEnabled}><span /></button></div>
    <div className={notificationsEnabled?'notification-preferences':'notification-preferences disabled'}>
      <div className="notification-preference notification-preference-timed"><div><strong>Morning</strong><span>Start the day with intention.</span></div><div className="notification-time-control"><input type="time" value={notificationTimes.morningTime} onChange={e=>saveNotificationTime('morningTime',e)} disabled={!notificationsEnabled||!notificationTimes.morning}/><button type="button" onClick={()=>toggleNotificationTime('morning')} className={notificationTimes.morning?'settings-toggle active':'settings-toggle'} disabled={!notificationsEnabled}><span /></button></div></div>
      <div className="notification-preference notification-preference-timed"><div><strong>Midday reset</strong><span>A gentle hydration and check-in moment.</span></div><div className="notification-time-control"><input type="time" value={notificationTimes.hydrationTime} onChange={e=>saveNotificationTime('hydrationTime',e)} disabled={!notificationsEnabled||!notificationTimes.hydration}/><button type="button" onClick={()=>toggleNotificationTime('hydration')} className={notificationTimes.hydration?'settings-toggle active':'settings-toggle'} disabled={!notificationsEnabled}><span /></button></div></div>
      <div className="notification-preference notification-preference-timed"><div><strong>Evening reflection</strong><span>Close the day with a quiet check-in.</span></div><div className="notification-time-control"><input type="time" value={notificationTimes.reflectionTime||reflectionTime} onChange={e=>saveNotificationTime('reflectionTime',e)} disabled={!notificationsEnabled||!notificationTimes.reflection}/><button type="button" onClick={()=>toggleNotificationTime('reflection')} className={notificationTimes.reflection?'settings-toggle active':'settings-toggle'} disabled={!notificationsEnabled}><span /></button></div></div>
      <div className="notification-quiet-row"><div><strong>Quiet hours</strong><span>EVOLV will never interrupt this window.</span></div><div className="notification-quiet-controls"><input type="time" value={notificationTimes.quietStart} onChange={e=>saveQuietHour('quietStart',e)} disabled={!notificationsEnabled||!notificationTimes.quietHours}/><span>to</span><input type="time" value={notificationTimes.quietEnd} onChange={e=>saveQuietHour('quietEnd',e)} disabled={!notificationsEnabled||!notificationTimes.quietHours}/><button type="button" onClick={toggleQuietHours} className={notificationTimes.quietHours?'settings-toggle active':'settings-toggle'} disabled={!notificationsEnabled}><span /></button></div></div>
      <button className="reflection-preview-button" type="button" onClick={openReflection}><Moon size={15}/> Try tonight's reflection now</button>
    </div>
  </div>

  <div className="settings-section settings-danger">
    <div className="settings-action-row settings-hold-row">
      <div><strong>Sign out</strong><span>Sign out of EVOLV on this device.</span></div>
      <HoldButton
        doneLabel="Signed out"
        backgroundColor="#27272a"
        fillColor="#ffffff"
        textColor="#f5f5f5"
        fillTextColor="#050505"
        size="md"
        radius={14}
        fillDirection="right"
        holdTime={2000}
        releaseTime={200}
        pressScale={0.97}
        wave
        waveAmplitude={6}
        glow
        resetAfter={1200}
        onHold={onLogout}
      >
        Sign out
      </HoldButton>
    </div>
    <div className="settings-action-row settings-hold-row danger">
      <div><strong>Delete account</strong><span>Hold to permanently remove your account and saved information.</span></div>
      <HoldButton
        doneLabel="Deleted"
        backgroundColor="#27272a"
        fillColor="#EF4444"
        textColor="#f5f5f5"
        fillTextColor="#ffffff"
        size="md"
        radius={14}
        fillDirection="right"
        holdTime={2000}
        releaseTime={200}
        pressScale={0.97}
        wave
        waveAmplitude={6}
        glow
        resetAfter={1200}
        onHold={deleteAccount}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete account'}
      </HoldButton>
    </div>
  </div>
</section>
}

function NotificationsPage({ pageProps }) {
  const { notifications = [], goTo, deleteNotification } = pageProps
  return <section className="panel-page dashboard-panel notifications-page">
        <button className="area-back" onClick={()=>goTo('overview')}><ChevronLeft size={16}/> Home</button>
        <div className="notifications-page-hero">
          <span className="section-label">YOUR NOTIFICATIONS</span>
          <h2>Notifications.</h2>
          <p>See what EVOLV has sent you. Your reminder settings stay in Profile.</p>
        </div>
        <div className="notifications-page-list">
          {notifications.length ? notifications.map(item=>{
            const copy={
              morning:{title:'Start your day with intention.',body:'A small reminder from EVOLV to check in with yourself and choose what matters today.'},
              hydration:{title:'Take a small reset.',body:'A gentle moment to drink some water, breathe and check in with how your day is going.'},
              reflection:{title:'Time to wind down.',body:'Your evening reflection is ready. Take a quiet moment to notice how today felt.'}
            }[item.kind]||{title:'A note from EVOLV.',body:'You have a new reminder from EVOLV.'}
            return <article className="notification-page-row" key={item.id}>
              <span className="notification-page-icon"><Bell size={17}/></span>
              <div className="notification-page-copy"><span>{item.kind.toUpperCase()} · {new Date(item.delivery_date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><strong>{copy.title}</strong><p>{copy.body}</p></div>
              <button type="button" className="notification-page-delete" onClick={()=>deleteNotification?.(item)} aria-label="Delete notification" title="Delete notification"><Trash2 size={16}/></button>
            </article>
          }) : <div className="notifications-empty"><Bell size={24}/><strong>No notifications yet.</strong><p>When EVOLV sends a reminder, it will appear here.</p></div>}
        </div>
      </section>
}
