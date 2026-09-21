import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, LogOut, Plus, Settings, Sparkles, Target, TrendingUp, UserRound } from 'lucide-react'
import gsap from 'gsap'

const growthAreas = [
  { id: 'career', title: 'Career', text: 'Work, direction & ambition' },
  { id: 'skills', title: 'Skills', text: 'Learning & capability' },
  { id: 'money', title: 'Money', text: 'Income & financial goals' },
  { id: 'life', title: 'Life', text: 'Lifestyle & personal goals' },
  { id: 'health', title: 'Health', text: 'Energy & daily wellbeing' },
  { id: 'creative', title: 'Creative', text: 'Ideas, projects & expression' },
]

const initialData = {
  name: '',
  areas: [],
  focus: '',
  goal: '',
}

function App() {
  const root = useRef(null)
  const [view, setView] = useState(() => localStorage.getItem('evolv-view') || 'landing')
  const [step, setStep] = useState(0)
  const [data, setData] = useState(() => {
    try { return { ...initialData, ...JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') } }
    catch { return initialData }
  })

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-enter > *', { y: 24, opacity: 0, duration: .75, stagger: .06, ease: 'power3.out' })
    }, root)
    return () => ctx.revert()
  }, [view, step])

  function enterApp() {
    localStorage.setItem('evolv-view', 'onboarding')
    setView('onboarding')
  }

  function finishOnboarding() {
    localStorage.setItem('evolv-onboarding', JSON.stringify(data))
    localStorage.setItem('evolv-view', 'dashboard')
    setView('dashboard')
  }

  function logout() {
    localStorage.removeItem('evolv-view')
    setView('landing')
  }

  return (
    <main ref={root} className="app">
      <div className="noise" />
      {view === 'landing' && <Landing onStart={enterApp} />}
      {view === 'onboarding' && (
        <Onboarding
          step={step}
          setStep={setStep}
          data={data}
          setData={setData}
          onFinish={finishOnboarding}
        />
      )}
      {view === 'dashboard' && <Dashboard data={data} onLogout={logout} />}
    </main>
  )
}

function Brand() {
  return <a className="brand" href="/"><span className="brand-mark"><span /></span><span>EVOLV</span></a>
}

function Landing({ onStart }) {
  return (
    <div className="page-enter landing">
      <nav className="nav"><Brand /><div className="nav-links"><a href="#philosophy">Philosophy</a><a href="#areas">Growth areas</a></div><button className="nav-login" onClick={onStart}>Enter EVOLV <ArrowRight size={15} /></button></nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> PERSONAL GROWTH, TRACKED</div>
          <h1 className="hero-title">Become the person<br /><em>you keep imagining.</em></h1>
          <p className="hero-description">EVOLV turns ambition into something you can see, measure and return to — one goal, habit and decision at a time.</p>
          <button className="button button-primary" onClick={onStart}>Start evolving <ArrowRight size={17} /></button>
        </div>
        <div className="hero-visual">
          <div className="hero-orb"><div className="orb-glow orb-core" /><div className="orb-ring" /><div className="orb-ring orb-ring-two" /><div className="orb-dot dot-one" /><div className="orb-dot dot-two" /></div>
          <div className="hero-panel"><div className="panel-top"><span>YOUR MOMENTUM</span><span>THIS WEEK</span></div><div className="panel-score">72<span>%</span></div><div className="progress-line"><i /></div><div className="panel-bottom"><span>+18% from last week</span><b>On track</b></div></div>
        </div>
      </section>
      <section className="statement" id="philosophy"><span className="section-label">THE EVOLV PHILOSOPHY</span><h2>Growth shouldn't live<br />inside your head.</h2><p>Give your goals a place to exist. See the days you showed up. Understand your momentum. Then keep going.</p></section>
      <section className="areas" id="areas"><div className="section-heading"><span className="section-label">YOUR WORLD</span><p>Choose what you're becoming.</p></div><div className="area-grid">{growthAreas.slice(0,4).map((a,i)=><article className="area" key={a.id}><span>0{i+1}</span><div><h3>{a.title}</h3><p>{a.text}</p></div><ArrowRight size={18}/></article>)}</div></section>
      <footer><Brand /><p>Track your growth. Become your next self.</p><span>© 2026</span></footer>
    </div>
  )
}

function Onboarding({ step, setStep, data, setData, onFinish }) {
  const total = 4
  const next = () => step < total - 1 ? setStep(step + 1) : onFinish()
  const back = () => step > 0 && setStep(step - 1)
  const canContinue = [data.name.trim(), data.areas.length, data.focus, data.goal.trim()][step]

  return (
    <div className="page-enter onboarding">
      <header className="onboard-head"><Brand /><div className="step-count">0{step + 1} / 0{total}</div></header>
      <div className="progress-track"><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
      <section className="onboard-content">
        <button className="back-button" onClick={back} disabled={step === 0}><ChevronLeft size={16}/> Back</button>
        {step === 0 && <div className="onboard-step"><span className="section-label">LET'S BEGIN</span><h1>First, what should<br /><em>we call you?</em></h1><p>This is your space. Make it feel personal.</p><input autoFocus value={data.name} onChange={e=>setData({...data,name:e.target.value})} placeholder="Your first name" /></div>}
        {step === 1 && <div className="onboard-step wide"><span className="section-label">YOUR WORLD</span><h1>What are you<br /><em>working on?</em></h1><p>Select the areas you want EVOLV to help you move forward in.</p><div className="choice-grid">{growthAreas.map(a=><button className={data.areas.includes(a.id)?'choice active':'choice'} key={a.id} onClick={()=>setData({...data,areas:data.areas.includes(a.id)?data.areas.filter(x=>x!==a.id):[...data.areas,a.id]})}><span>{a.title}</span><small>{a.text}</small>{data.areas.includes(a.id)&&<Check size={16}/>}</button>)}</div></div>}
        {step === 2 && <div className="onboard-step"><span className="section-label">YOUR DIRECTION</span><h1>What matters<br /><em>right now?</em></h1><p>Pick the feeling that best describes your current season.</p><div className="focus-list">{['I want more clarity','I want to build discipline','I want to level up','I want to become consistent'].map(x=><button className={data.focus===x?'focus active':'focus'} key={x} onClick={()=>setData({...data,focus:x})}>{x}<ArrowRight size={16}/></button>)}</div></div>}
        {step === 3 && <div className="onboard-step"><span className="section-label">MAKE IT REAL</span><h1>What is one thing<br /><em>you want to change?</em></h1><p>Don't overthink it. Start with something that matters.</p><textarea autoFocus value={data.goal} onChange={e=>setData({...data,goal:e.target.value})} placeholder="e.g. Become confident with backend development" rows="3" /></div>}
      </section>
      <footer className="onboard-footer"><span>YOUR DATA STAYS WITH YOU</span><button className="button button-primary" disabled={!canContinue} onClick={next}>{step === total-1 ? 'Enter my dashboard' : 'Continue'} <ArrowRight size={16}/></button></footer>
    </div>
  )
}

function Dashboard({ data, onLogout }) {
  const [active, setActive] = useState('overview')
  const name = data.name || 'there'
  const areaNames = data.areas.map(id => growthAreas.find(a=>a.id===id)?.title).filter(Boolean)

  return (
    <div className="page-enter dashboard">
      <aside className="sidebar"><Brand /><nav><button className={active==='overview'?'side-active':''} onClick={()=>setActive('overview')}><TrendingUp size={17}/> Overview</button><button className={active==='goals'?'side-active':''} onClick={()=>setActive('goals')}><Target size={17}/> Goals</button><button className={active==='profile'?'side-active':''} onClick={()=>setActive('profile')}><UserRound size={17}/> Profile</button></nav><button className="logout" onClick={onLogout}><LogOut size={16}/> Sign out</button></aside>
      <main className="dash-main">
        <header className="dash-header"><div><span className="section-label">YOUR SPACE</span><h1>Good evening, {name}.</h1></div><button className="icon-button"><Settings size={18}/></button></header>
        {active === 'overview' && <><section className="dash-hero"><div><span className="section-label">WEEKLY MOMENTUM</span><strong>0<span>%</span></strong><p>Your journey starts with one small promise.</p></div><div className="dash-circle"><span>START</span></div></section><section className="dash-grid"><article className="dash-card"><div className="card-head"><span>YOUR FOCUS</span><span>01</span></div><h2>{data.focus || 'Find your direction'}</h2><p>{data.goal}</p><div className="mini-progress"><i/></div></article><article className="dash-card"><div className="card-head"><span>ACTIVE AREAS</span><span>{String(areaNames.length).padStart(2,'0')}</span></div><div className="area-pills">{areaNames.map(a=><span key={a}>{a}</span>)}</div><button className="add-goal"><Plus size={15}/> Add a goal</button></article></section><section className="empty-state"><span>YOUR FIRST DAY</span><h2>Show up. Then do it again tomorrow.</h2><p>Your activity, streaks and progress will appear here as you use EVOLV.</p></section></>}
        {active === 'goals' && <section className="panel-page"><span className="section-label">GOALS</span><h2>Your goals</h2><div className="goal-empty"><Target size={24}/><p>Your first goal will live here.</p><button className="button button-primary"><Plus size={15}/> Create goal</button></div></section>}
        {active === 'profile' && <section className="panel-page"><span className="section-label">PROFILE</span><h2>{name}</h2><div className="profile-box"><p>Focus</p><strong>{data.focus}</strong><p>Growth areas</p><strong>{areaNames.join(' · ')}</strong><p>First goal</p><strong>{data.goal}</strong></div></section>}
      </main>
    </div>
  )
}

export default App
