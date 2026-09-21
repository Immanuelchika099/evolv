import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, LogOut, Plus, Settings, Sparkles, Target, TrendingUp, UserRound } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
  const page = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
      intro.from('.landing-nav', { y: -18, opacity: 0, duration: .8 })
        .from('.hero-kicker', { y: 18, opacity: 0, duration: .5 }, '-=.35')
        .from('.hero-title .line', { yPercent: 110, opacity: 0, duration: .9, stagger: .1 }, '-=.25')
        .from('.hero-description', { y: 20, opacity: 0, duration: .6 }, '-=.5')
        .from('.hero-actions', { y: 16, opacity: 0, duration: .55 }, '-=.4')
        .from('.hero-visual', { scale: .92, opacity: 0, duration: 1 }, '-=.7')

      gsap.to('.hero-orb', { y: -14, rotation: 2, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.orb-ring', { rotation: 360, duration: 22, repeat: -1, ease: 'none' })
      gsap.to('.orb-ring-two', { rotation: -360, duration: 30, repeat: -1, ease: 'none' })
      gsap.utils.toArray('.story-reveal').forEach((el) => {
        gsap.from(el, { y: 55, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%' } })
      })
      gsap.utils.toArray('.area, .feature-step').forEach((el, i) => {
        gsap.from(el, { x: i % 2 ? 25 : -25, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
      })
    }, page)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    let lastScroll = window.scrollY
    function handleScroll() {
      const currentScroll = window.scrollY
      if (currentScroll < 40) setNavVisible(true)
      else if (currentScroll > lastScroll + 3) {
        setNavVisible(false)
        setMenuOpen(false)
      } else if (currentScroll < lastScroll - 3) setNavVisible(true)
      lastScroll = currentScroll
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function closeMenu() { setMenuOpen(false) }

  return (
    <div ref={page} className="page-enter landing">
      <nav className={navVisible ? "landing-nav nav nav-visible" : "landing-nav nav nav-hidden"}>
        <Brand />
        <div className="nav-links">
          <a href="#story">Why EVOLV</a>
          <a href="#features">Features</a>
          <a href="#areas">Growth areas</a>
        </div>
        <div className="nav-actions">
          <button className="nav-login" onClick={onStart}>Enter EVOLV <ArrowRight size={15} /></button>
          <button className={menuOpen ? 'menu-button menu-open' : 'menu-button'} onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><span /><span /></button>
        </div>
      </nav>

      <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        <a href="#story" onClick={closeMenu}>Why EVOLV</a>
        <a href="#features" onClick={closeMenu}>Features</a>
        <a href="#areas" onClick={closeMenu}>Growth areas</a>
        <button onClick={() => { closeMenu(); onStart() }}>Get started <ArrowRight size={15} /></button>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> PERSONAL GROWTH, TRACKED</div>
          <h1 className="hero-title"><span className="line">Become the person</span><span className="line"><em>you keep imagining.</em></span></h1>
          <p className="hero-description">Your goals are easier to become when you can see them. EVOLV gives your growth a place to live, a rhythm to follow, and progress you can actually feel.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={onStart}>Start evolving <ArrowRight size={17} /></button><a className="button button-ghost" href="#story">Explore EVOLV ↓</a></div>
        </div>
        <div className="hero-visual"><div className="hero-aura" /><div className="hero-orb"><div className="orb-glow orb-core" /><div className="orb-ring" /><div className="orb-ring orb-ring-two" /><div className="orb-dot dot-one" /><div className="orb-dot dot-two" /></div><div className="hero-panel"><div className="panel-top"><span>YOUR MOMENTUM</span><span>THIS WEEK</span></div><div className="panel-score">72<span>%</span></div><div className="progress-line"><i /></div><div className="panel-bottom"><span>+18% from last week</span><b>On track</b></div></div></div>
      </section>

      <section className="story-intro story-reveal" id="story"><span className="section-label">01 — THE SHIFT</span><h2>You've always had<br /><em>somewhere to go.</em></h2><p>But ambition gets noisy. Goals sit in notes. Plans disappear into busy weeks. You start again. EVOLV is built to make the invisible part of growth visible.</p></section>

      <section className="story-statement story-reveal"><div className="statement-number">02</div><div><span className="section-label">MAKE IT VISIBLE</span><h2>Growth shouldn't live<br />inside your head.</h2><p>Give your goals a place to exist. See the days you showed up. Understand your momentum. Then keep going.</p></div></section>

      <section className="features-story story-reveal" id="features">
        <div className="section-heading"><span className="section-label">03 — THE SYSTEM</span><p>A simple rhythm for becoming.</p></div>
        <div className="feature-steps">
          {[['01','DEFINE','Decide what matters in this season of your life.'],['02','BUILD','Turn intention into goals you can actually act on.'],['03','TRACK','See your momentum, progress and patterns over time.'],['04','EVOLVE','Reflect, adjust and keep becoming your next self.']].map(([num,title,text]) => <article className="feature-step" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={17} /></article>)}
        </div>
      </section>

      <section className="experience story-reveal">
        <div className="preview-copy"><span className="section-label">04 — YOUR SPACE</span><h2>A dashboard built around <em>your becoming.</em></h2><p>Once you enter EVOLV, everything becomes personal — your goals, your growth areas, your momentum and the story you're building day by day.</p><button className="button button-primary" onClick={onStart}>Create your space <ArrowRight size={16} /></button></div>
        <div className="mock-dashboard"><div className="mock-header"><span>EVOLV / OVERVIEW</span><span>YOUR MOMENTUM</span></div><div className="mock-main"><div className="mock-ring"><strong>72</strong><small>%</small><span>this week</span></div><div className="mock-tasks"><div><small>CURRENT FOCUS</small><b>Build with intention.</b></div><div className="task"><i /> Learn something new <span>IN PROGRESS</span></div><div className="task"><i /> Show up today <span>ACTIVE</span></div><div className="task"><i /> Review the week <span>FRI</span></div></div></div></div>
      </section>

      <section className="areas story-reveal" id="areas"><div className="section-heading"><span className="section-label">05 — YOUR WORLD</span><p>Choose what you're becoming.</p></div><div className="area-grid">{growthAreas.map((a,i)=><article className="area" key={a.id}><span>0{i+1}</span><div><h3>{a.title}</h3><p>{a.text}</p></div><ArrowRight size={18}/></article>)}</div></section>

      <section className="manifesto story-reveal"><span className="section-label">06 — KEEP GOING</span><h2>You don't need to become<br /><em>someone else.</em></h2><p>You need a place to become more of who you're capable of being.</p></section>

      <section className="faq story-reveal" id="faq"><div className="faq-head"><span className="section-label">07 — QUESTIONS</span><h2>Before you<br /><em>begin.</em></h2></div><div className="faq-list">{[['What exactly is EVOLV?','A personal growth tracker for turning goals and intentions into visible progress.'],['What can I track?','Career, skills, money, health, lifestyle, creative work and other areas that matter to you.'],['Does my progress stay saved?','Yes. Your account is designed to keep your goals and progress connected to you across sessions.'],['Can I change my goals later?','Absolutely. Growth changes with you, so your goals should be able to change too.'],['Is EVOLV a habit tracker?','It can support habits, but the bigger idea is your overall growth — goals, momentum, reflection and progress.']].map(([q,a]) => <details className="faq-item" key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>

      <section className="final-cta story-reveal"><span className="section-label">08 — YOUR NEXT SELF</span><h2>Your next version<br /><em>starts here.</em></h2><button className="button button-primary" onClick={onStart}>Start evolving <ArrowRight size={17} /></button></section>

      <footer className="site-footer"><div className="footer-brand"><Brand /><p>Track your growth.<br />Become your next self.</p></div><div className="footer-links"><div><span>EXPLORE</span><a href="#story">Why EVOLV</a><a href="#features">Features</a><a href="#areas">Growth areas</a><a href="#faq">FAQ</a></div><div><span>CONNECT</span><a href="https://www.instagram.com/hi_imanw/" target="_blank" rel="noreferrer" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor"/></svg></a></div></div><div className="footer-bottom"><span>© 2026 EVOLV</span><span>BUILT FOR BECOMING</span></div></footer>
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
