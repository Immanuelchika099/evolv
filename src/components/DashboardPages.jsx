import {
  ArrowRight, Bell, Camera, Upload, Check, ChevronLeft, ChevronRight, LogOut,
  Plus, Settings, Target, Pencil, Trash2, MessageCircle, HeartPulse, Apple,
  WalletCards, BriefcaseBusiness, Brain, Sprout, Moon, Droplets, Dumbbell,
  Footprints, Zap, Scale, Smile, Focus, NotebookPen, BookOpen, Receipt,
  PiggyBank, ArrowDownLeft, ArrowUpRight, Activity, Users, CheckCircle2,
  Utensils, Sparkles, Send, Sunrise, X
} from 'lucide-react'
import WeeklyProgressChart from './WeeklyProgressChart'
import './DashboardPages.css'

const Page = ({ pageProps }) => pageProps

export function DashboardPages({ active, pageProps }) {
  if (active === 'overview') return <HomePage pageProps={pageProps} />
  if (active === 'area') return <AreaPage pageProps={pageProps} />
  if (active === 'logs') return <LogsPage pageProps={pageProps} />
  if (active === 'log-detail') return <LogDetailPage pageProps={pageProps} />
  if (active === 'progress') return <ProgressPage pageProps={pageProps} />
  if (active === 'goals') return <GoalsPage pageProps={pageProps} />
  if (active === 'profile') return <ProfilePage pageProps={pageProps} />
  if (active === 'notifications') return <NotificationsPage pageProps={pageProps} />
  if (active === 'ai') return null
  return null
}

function HomePage({ pageProps }) {
  const { name, todayLogs, todayMeals, defs, icons, metricArea, valueText, openLog, goTo, areas, notificationTimes, onArticle } = pageProps
  return <div className="dashboard-home">
        <section className="dashboard-welcome"><div className="dashboard-welcome-copy"><span className="dashboard-eyebrow">Welcome back,</span><h1>{name.trim().split(/\s+/).map((part, index, parts) => <span key={`${part}-${index}`}>{part}{index === parts.length - 1 ? '.' : ''}</span>)}</h1></div></section>
        <section className="today-snapshot">
          <div className="today-snapshot-head"><div><span className="section-label">TODAY</span><h2>Your day, at a glance.</h2></div><span className="today-log-count">{todayLogs.length+todayMeals.length} logged</span></div>
          <div className="today-metrics">
            {defs.filter(d=>todayLogs.some(l=>l.metric_id===d.id)).slice(0,6).map(d=>{const l=todayLogs.find(x=>x.metric_id===d.id),M=icons[d.slug]||Sparkles;return <button key={d.id} className="today-metric" onClick={()=>openLog(metricArea[d.slug],d)}><span className="metric-row-icon" style={{'--metric-color':d.color||'#c8f36a'}}><M size={16}/></span><span><strong>{d.name}</strong><small>{valueText(l,d)}</small></span><ChevronRight size={14}/></button>})}
            {todayMeals.length>0&&<button className="today-metric" onClick={()=>openLog('nutrition',{slug:'meals',name:'Meal',value_type:'meal'})}><span className="metric-row-icon" style={{'--metric-color':'#ffd66b'}}><Utensils size={16}/></span><span><strong>Meals</strong><small>{todayMeals.length} logged</small></span><ChevronRight size={14}/></button>}
            {!todayLogs.length&&!todayMeals.length&&<div className="today-empty"><Sparkles size={18}/><p>Nothing logged yet. Start with one small thing.</p></div>}
          </div>
        </section>
        <section className="daily-brief-card">
          <div className="daily-brief-head"><div><span className="section-label">DAILY BRIEF</span><h2>Your day, so far.</h2></div><span className="daily-brief-status">{todayLogs.length+todayMeals.length} logged</span></div>
          <div className="daily-brief-grid">
            <div><span>SLEEP</span><strong>{(()=>{const d=defs.find(x=>x.slug==='sleep');const l=d&&todayLogs.find(x=>x.metric_id===d.id);return l?valueText(l,d):'Not logged'})()}</strong></div>
            <div><span>HYDRATION</span><strong>{(()=>{const d=defs.find(x=>x.slug==='water');const l=d&&todayLogs.find(x=>x.metric_id===d.id);return l?valueText(l,d):'Not logged'})()}</strong></div>
            <div><span>MOVEMENT</span><strong>{(()=>{const d=defs.find(x=>x.slug==='exercise');const l=d&&todayLogs.find(x=>x.metric_id===d.id);return l?valueText(l,d):'Not logged'})()}</strong></div>
            <div><span>EVENING</span><strong>{notificationTimes.reflectionTime}</strong></div>
          </div>
          <p>{todayLogs.length+todayMeals.length<3?'Small steps count. Log what feels useful and let EVOLV build the picture with you.':'You are building a clearer picture of your day. Keep going at your own pace.'}</p>
        </section>
        <section className="evolv-life-overview">{Object.entries(areas).map(([id,m])=>{const I=m.icon,rs=defs.filter(d=>metricArea[d.slug]===id);const tracked=rs.filter(d=>todayLogs.some(l=>l.metric_id===d.id)).length;const preview=id==='nutrition'?(todayMeals.length?todayMeals.length+' meals logged today':'Nothing logged yet'):rs.filter(d=>todayLogs.some(l=>l.metric_id===d.id)).slice(0,2).map(d=>d.name+' '+valueText(todayLogs.find(l=>l.metric_id===d.id),d)).join(' · ')||'Nothing logged today';return <button className="life-area-row" key={id} onClick={()=>{goTo('area');setArea(id)}}><span className="life-area-icon" style={{'--area-color':m.color}}><I size={17}/></span><span className="life-area-main"><strong>{m.title}</strong><small>{preview}</small></span><span className="life-area-values"><b>{id==='nutrition'?todayMeals.length:tracked}</b><small>{id==='nutrition'?'meals':'today'}</small></span><ChevronRight size={17}/></button>})}</section>
        <section className="today-action-strip"><div><span className="section-label">KEEP GOING</span><h2>What happened today?</h2><p>Record one thing. You can always add more later.</p></div><button className="button button-primary" onClick={()=>openLog()}><Plus size={16}/> Log something</button></section>
        <section className="daily-insight evolv-empty-insight"><span className="daily-insight-label">YOUR CLARITY BUILDS HERE</span><h2>{todayLogs.length+todayMeals.length<3?'Start with what’s real.':'You’re building a picture of your day.'}</h2><p>{todayLogs.length+todayMeals.length<3?'The more useful things you log, the more clearly Evolv can show patterns and changes over time.':'Keep logging naturally. Evolv will turn your history into observations when there is enough data to say something useful.'}</p></section>
      </div>
}

function AreaPage({ pageProps }) {
  const { area, areas, defs, logs, meals, metricArea, latest, icons, openLog, goTo, onArticle } = pageProps
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
  const { defs, logs, meals, openEntry, startEditEntry, deleteEntry, goTo, setManageLogsOpen, manageLogsOpen } = pageProps
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
          <div className="logs-page-toolbar"><div><strong>{items.length}</strong><span>{items.length===1?'saved entry':'saved entries'}</span></div><span>Newest first</span></div>
          {items.length ? <div className="logs-page-list">{items.map((item,index)=>{
            const def=item.type==='log'?metricById[item.entry.metric_id]:null,label=item.type==='meal'?(item.entry.meal_type||'Meal'):def?.name||'Entry',M=item.type==='meal'?Utensils:(icons[def?.slug]||Activity)
            return <button type="button" className="logs-page-row" key={item.type+'-'+(item.entry.id||index)} onClick={()=>openEntry(item)}><span className="logs-page-icon"><M size={18}/></span><span className="logs-page-copy"><small>{item.type==='meal'?'NUTRITION':(def?.area||'LOG').toUpperCase()}</small><strong>{label}</strong><span>{formatValue(item)}</span></span><time>{item.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}<br/>{item.date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</time><ChevronRight size={18}/></button>
          })}</div> : <div className="logs-page-empty"><NotebookPen size={24}/><strong>No previous logs yet.</strong><p>Your saved health, life, money and meal entries will appear here.</p></div>}
        </section>
      })()
}

function LogDetailPage({ pageProps }) {
  const { selectedEntry, goTo, startEditEntry, deleteEntry } = pageProps
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
  const { progressRange, setProgressRange, progressMetric, setProgressMetric, logs, defs, goals, checkins = [], momentum = 0, goTo, valueText, WeeklyProgressChart: Chart = WeeklyProgressChart } = pageProps
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

          <div className="progress-overview-grid progress-simple-stats">
            <article className="progress-overview-card progress-overview-primary">
              <span className="section-label">GOAL PROGRESS</span>
              <strong>{activeGoals.length?goalProgress+'%':'—'}</strong>
              <p>Across your active goals.</p>
            </article>
            <article className="progress-overview-card">
              <span className="section-label">LOGGED</span>
              <strong>{thingsLogged}</strong>
              <p>Entries in {progressRange} days.</p>
            </article>
            <article className="progress-overview-card">
              <span className="section-label">ACTIVE DAYS</span>
              <strong>{activeDays}</strong>
              <p>Days you checked in.</p>
            </article>
          </div>

          <div className="progress-definition progress-simple-note">
            <span className="section-label">KEEP GOING</span>
            <p>Small, consistent steps are what Evolv is here to help you notice.</p>
          </div>
        </section>
      })()
}

function GoalsPage({ pageProps }) {
  const { goTo, goalTitle, setGoalTitle, goalDescription, setGoalDescription, goalDueDate, setGoalDueDate, createGoal, editingGoal, saving, saveGoalEdit, goals, updateGoal, beginGoalEdit, deleteGoal } = pageProps
  return <section className="panel-page dashboard-panel goals-page"><button className="area-back" onClick={()=>goTo('progress')}><ChevronLeft size={16}/> Progress</button><span className="section-label">DIRECTION</span><h2>Goals.</h2><p className="panel-intro">Choose what you want to work toward.</p><form className="goal-create-form" onSubmit={editingGoal?saveGoalEdit:createGoal}>
          <input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} placeholder="What would you like to work toward?" required/>
          <textarea value={goalDescription} onChange={e=>setGoalDescription(e.target.value)} placeholder="Add a little more, if you like" rows="3"/>
          <label className="goal-date-field"><span>Target date <small>optional</small></span><input type="date" value={goalDueDate} onChange={e=>setGoalDueDate(e.target.value)}/></label>
          <div className="goal-form-actions"><button className="button button-primary" disabled={saving} type="submit">{editingGoal?<><Check size={15}/> {saving?'Saving…':'Save changes'}</>:<><Plus size={15}/> {saving?'Saving…':'Add goal'}</>}</button>{editingGoal&&<button type="button" className="goal-cancel-button" onClick={()=>{setEditingGoal(null);setGoalTitle('');setGoalDescription('');setGoalDueDate('')}}>Cancel</button>}</div>
        </form>
        <div className="goal-list">{goals.map(g=><article className="goal-item" key={g.id}>
          <div className="goal-item-top"><div><span className="goal-status-copy">{g.status==='completed'?'Completed':g.status==='paused'?'Paused':'In progress'}</span><h3>{g.title}</h3>{g.description&&<p>{g.description}</p>}{g.due_date&&<small className="goal-due-copy">Due {new Date(g.due_date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</small>}</div><strong>{g.progress||0}%</strong></div>
          <div className="mini-progress"><i style={{width:Math.min(100,Math.max(0,Number(g.progress)||0))+'%'}}/></div>
          <div className="goal-item-actions">
            <label><span>Progress</span><input type="range" min="0" max="100" value={Math.min(100,Math.max(0,Number(g.progress)||0))} onChange={e=>updateGoal(g,{progress:Number(e.target.value),status:Number(e.target.value)>=100?'completed':'active'})}/></label>
            <select value={g.status||'active'} onChange={e=>updateGoal(g,{status:e.target.value})} aria-label="Goal status"><option value="active">In progress</option><option value="paused">Paused</option><option value="completed">Completed</option></select>
            <button type="button" onClick={()=>beginGoalEdit(g)} aria-label={'Edit '+g.title}><Pencil size={15}/> Edit</button>
            <button type="button" className="goal-delete-button" onClick={()=>deleteGoal(g)} aria-label={'Delete '+g.title}><Trash2 size={15}/> Delete</button>
          </div>
        </article>)}{!goals.length&&<div className="goal-empty"><Target size={22}/><p>Nothing here yet. Add your first goal above.</p></div>}</div></section>
}

function ProfilePage({ pageProps }) {
  const {
    profileName, setProfileName, profile, data, avatarUrl, avatarInputRef, avatarUploading,
    handleAvatarChange, removeAvatar, saveProfile, profileMessage, alarmEnabled, toggleAlarmSystem,
    alarmTitle, setAlarmTitle, alarmDate, setAlarmDate, alarmTime, setAlarmTime, alarmRepeat, setAlarmRepeat,
    alarmNote, setAlarmNote, alarmSaving, createAlarm, alarms, toggleAlarm, deleteAlarm,
    notificationsEnabled, toggleNotifications, notificationTimes, saveNotificationTime, toggleNotificationTime,
    saveQuietHour, toggleQuietHours, openReflection, deleteOpen, setDeleteOpen, deleteAccount, deleting, onLogout
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

  <div className="settings-section alarms-settings-section">
    <div className="settings-section-head"><div><span className="section-label">TIME-BASED ALARMS</span><h3>Alarms</h3></div><Bell size={20}/></div>
    <div className="notification-master-row">
      <div><strong>Alarm system</strong><span>Separate from daily notifications. On native Evolv, these are scheduled by the phone.</span></div>
      <button type="button" className={alarmEnabled?'settings-toggle active':'settings-toggle'} onClick={toggleAlarmSystem} aria-pressed={alarmEnabled}><span /></button>
    </div>
    <div className={alarmEnabled?'notification-preferences':'notification-preferences disabled'}>
      <form className="evolv-alarm-create" onSubmit={createAlarm}>
        <div className="special-log-intro"><strong>Set an alarm</strong><span>For example: “Exercise” at 6:30 PM. The native version uses the device alarm/notification system rather than an Evolv sound file.</span></div>
        <label className="log-input-label"><span>What is the alarm for?</span><input value={alarmTitle} onChange={e=>setAlarmTitle(e.target.value)} placeholder="e.g. Exercise session" required disabled={!alarmEnabled}/></label>
        <div className="alarm-date-time-grid">
          <label className="log-input-label"><span>Date</span><input type="date" value={alarmDate} onChange={e=>setAlarmDate(e.target.value)} required disabled={!alarmEnabled}/></label>
          <label className="log-input-label"><span>Time</span><input type="time" value={alarmTime} onChange={e=>setAlarmTime(e.target.value)} required disabled={!alarmEnabled}/></label>
        </div>
        <label className="log-input-label"><span>Repeat</span><select value={alarmRepeat} onChange={e=>setAlarmRepeat(e.target.value)} disabled={!alarmEnabled}><option value="once">Doesn't repeat</option><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Every week</option></select></label>
        <label className="log-input-label"><span>Note <small>optional</small></span><textarea value={alarmNote} onChange={e=>setAlarmNote(e.target.value)} placeholder="e.g. Start with your warm-up." rows="3" disabled={!alarmEnabled}/></label>
        <button className="button button-primary" type="submit" disabled={!alarmEnabled||alarmSaving}>{alarmSaving?'Setting alarm…':'Set alarm'} <ArrowRight size={16}/></button>
      </form>

      <div className="evolv-alarm-list">
        <div className="evolv-alarm-list-head"><strong>Upcoming alarms</strong><span>{alarms.filter(a=>a.enabled).length} active</span></div>
        {!alarms.length&&<div className="progress-empty-inline"><Bell size={20}/><div><strong>No alarms yet.</strong><p>Create one for your next exercise, study session or routine.</p></div></div>}
        {alarms.map(alarm=>{
          const when=new Date(alarm.alarm_at)
          return <div className="evolv-alarm-row" key={alarm.id}>
            <div className="evolv-alarm-time"><strong>{when.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</strong><span>{when.toLocaleDateString([], {month:'short',day:'numeric'})}</span></div>
            <div className="evolv-alarm-copy"><strong>{alarm.title}</strong><span>{alarm.repeat_type==='daily'?'Every day':alarm.repeat_type==='weekly'?'Every week':alarm.repeat_type==='weekdays'?'Weekdays':'One time'}{alarm.note?' · '+alarm.note:''}</span></div>
            <button type="button" className={alarm.enabled?'settings-toggle active':'settings-toggle'} onClick={()=>toggleAlarm(alarm)} aria-label={alarm.enabled?'Disable alarm':'Enable alarm'}><span/></button>
            <button type="button" className="settings-outline-button" onClick={()=>deleteAlarm(alarm)} aria-label="Delete alarm"><X size={15}/></button>
          </div>
        })}
      </div>
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
    <div className="settings-action-row">
      <div><strong>Sign out</strong><span>Sign out of EVOLV on this device.</span></div>
      <button className="settings-outline-button" type="button" onClick={onLogout}><LogOut size={15}/> Sign out</button>
    </div>
    <div className="settings-action-row danger">
      <div><strong>Delete account</strong><span>Permanently remove your account and saved information.</span></div>
      <button className="settings-delete-button" type="button" onClick={()=>setDeleteOpen(true)}>Delete</button>
    </div>
  </div>

  {deleteOpen&&<div className="settings-delete-overlay" role="dialog" aria-modal="true">
    <div className="settings-delete-modal">
      <span className="section-label">DELETE ACCOUNT</span>
      <h3>Delete your account?</h3>
      <p>This permanently removes your account and saved information.</p>
      <div className="settings-delete-actions">
        <button onClick={()=>setDeleteOpen(false)}>Cancel</button>
        <button className="settings-delete-confirm" onClick={deleteAccount} disabled={deleting}>{deleting?'Deleting…':'Delete account'}</button>
      </div>
    </div>
  </div>}
</section>
}

function NotificationsPage({ pageProps }) {
  const { notifications, goTo } = pageProps
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
              <div><span>{item.kind.toUpperCase()} · {new Date(item.delivery_date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span><strong>{copy.title}</strong><p>{copy.body}</p></div>
            </article>
          }) : <div className="notifications-empty"><Bell size={24}/><strong>No notifications yet.</strong><p>When EVOLV sends a reminder, it will appear here.</p></div>}
        </div>
      </section>
}
