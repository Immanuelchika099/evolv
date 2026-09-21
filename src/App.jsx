import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronLeft, LogOut, Plus, Settings, Sparkles, Target, TrendingUp, UserRound } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { supabase } from './lib/supabase'
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
  const [article, setArticle] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [step, setStep] = useState(0)
  const [authMode, setAuthMode] = useState('signup')
  const [data, setData] = useState(() => {
    try { return { ...initialData, ...JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') } }
    catch { return initialData }
  })

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (view !== 'article') {
        gsap.from('.page-enter > *', { y: 24, opacity: 0, duration: .75, stagger: .06, ease: 'power3.out' })
      }
    }, root)
    return () => ctx.revert()
  }, [view, step])

  function openContact() {
    setContactSent(false)
    setContactOpen(true)
  }

  function closeContact() {
    setContactOpen(false)
  }

  function openPricing() {
    setArticle(null)
    localStorage.setItem('evolv-view', 'pricing')
    setView('pricing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function enterApp() {
    setArticle(null)
    setStep(0)
    localStorage.setItem('evolv-view', 'onboarding')
    setView('onboarding')
  }

  function returnHome() {
    setArticle(null)
    setStep(0)
    localStorage.setItem('evolv-view', 'landing')
    setView('landing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function openArticle(type, areaId = null) {
    if (type === 'features') {
      setArticle(null)
      localStorage.setItem('evolv-view', 'landing')
      setView('landing')
      window.setTimeout(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
      return
    }

    setArticle({ type, areaId })
    setView('article')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function closeArticle() {
    setArticle(null)
    setView('landing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function finishOnboarding() {
    localStorage.setItem('evolv-onboarding', JSON.stringify(data))
    localStorage.setItem('evolv-view', 'auth')
    setAuthMode('signup')
    setView('auth')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function finishAuth(user) {
    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: data.name.trim(),
      growth_areas: data.areas,
      focus: data.focus,
      first_goal: data.goal.trim(),
    })
    localStorage.setItem('evolv-view', 'dashboard')
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function logout() {
    localStorage.removeItem('evolv-view')
    setView('landing')
  }

  return (
    <main ref={root} className="app">
      <div className="noise" />
      {view !== 'onboarding' && view !== 'auth' && (
        <Navbar onStart={enterApp} onFeatures={() => openArticle('features')} onAreas={() => openArticle('areas')} onPricing={openPricing} onContact={openContact} onHome={returnHome} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      )}
      {view === 'landing' && <Landing onStart={enterApp} onArticle={openArticle} onPricing={openPricing} onContact={openContact} />}
      {view === 'pricing' && <PricingPage onStart={enterApp} onBack={returnHome} />}
      {view === 'article' && <ArticlePage article={article} onStart={enterApp} onBack={closeArticle} />}
      {view === 'auth' && <AuthPage mode={authMode} setMode={setAuthMode} data={data} onSuccess={finishAuth} onHome={returnHome} />}
      {view === 'onboarding' && (
        <Onboarding
          step={step}
          setStep={setStep}
          data={data}
          setData={setData}
          onFinish={finishOnboarding}
          onExit={returnHome}
        />
      )}
      {view === 'dashboard' && <Dashboard data={data} onLogout={logout} />}
      {contactOpen && <ContactModal contactSent={contactSent} setContactSent={setContactSent} onClose={closeContact} />}
    </main>
  )
}


function AuthPage({ mode, setMode, data, onSuccess, onHome }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    setMessage('')

    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })

    setSending(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    if (mode === 'signup' && !result.data.session) {
      setMessage('Check your email to confirm your account. Once confirmed, come back and sign in.')
      return
    }

    if (result.data.user) await onSuccess(result.data.user)
  }

  return (
    <div className="page-enter auth-page">
      <header className="onboard-head">
        <button className="auth-brand" onClick={onHome} aria-label="Back to EVOLV home"><Brand /></button>
        <span className="step-count">{mode === 'signup' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</span>
      </header>

      <section className="auth-content">
        <span className="section-label">{mode === 'signup' ? 'YOUR ACCOUNT' : 'YOUR SPACE'}</span>
        <h1>{mode === 'signup' ? <>Keep your<br /><em>journey yours.</em></> : <>Welcome<br /><em>back.</em></>}</h1>
        <p>{mode === 'signup'
          ? 'Create your account so the progress you build in EVOLV can stay connected to you.'
          : 'Sign in and continue from where you left off.'}</p>

        <form className="auth-form" onSubmit={submit}>
          <label><span>Email</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label><span>Password</span><input required minLength="6" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button className="button button-primary auth-submit" disabled={sending} type="submit">
            {sending ? 'Working…' : mode === 'signup' ? 'Create my account' : 'Sign in'} {!sending && <ArrowRight size={16} />}
          </button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage('') }}>
          {mode === 'signup' ? 'Already have an account? Sign in' : "New to EVOLV? Create an account"}
        </button>

        <button className="auth-back" onClick={onHome}><ChevronLeft size={15} /> Back to homepage</button>
      </section>

      <footer className="onboard-footer">
        <span>{data.name ? `BUILDING FOR ${data.name.toUpperCase()}` : 'EVOLV / YOUR NEXT SELF'}</span>
        <span>YOUR DATA, YOUR JOURNEY.</span>
      </footer>
    </div>
  )
}


function ContactModal({ contactSent, setContactSent, onClose }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submitContact(event) {
    event.preventDefault()
    setSending(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: form.get('name')?.trim(),
        email: form.get('email')?.trim(),
        message: form.get('message')?.trim(),
      })

    setSending(false)

    if (insertError) {
      setError('Something went wrong. Please try again.')
      return
    }

    setContactSent(true)
  }

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="contact-modal">
        <button className="contact-close" onClick={onClose} aria-label="Close contact form">×</button>
        {!contactSent ? (
          <form onSubmit={submitContact}>
            <span className="section-label">LET'S TALK</span>
            <h2 id="contact-title">What are you<br /><em>working on?</em></h2>
            <p className="contact-copy">Tell us a little about what you have in mind. Keep it simple.</p>
            <div className="contact-fields">
              <label><span>Name</span><input required name="name" placeholder="Your name" /></label>
              <label><span>Email</span><input required type="email" name="email" placeholder="you@example.com" /></label>
              <label><span>Message</span><textarea required name="message" placeholder="Tell us what you want to build, change or explore..." rows="4" /></label>
            </div>
            {error && <p className="contact-error" role="alert">{error}</p>}
            <button className="button button-primary contact-submit" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send message'} {!sending && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <div className="contact-success">
            <span className="contact-success-mark"><Check size={20} /></span>
            <span className="section-label">MESSAGE READY</span>
            <h2>Thanks for<br /><em>reaching out.</em></h2>
            <p>Your message has been captured. Your message has been sent successfully. Thanks for reaching out — we'll get back to you soon.</p>
            <button className="button button-primary" onClick={onClose}>Back to EVOLV <ArrowRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function Brand() {
  return <a className="brand" href="/"><span className="brand-mark"><span /></span><span>EVOLV</span></a>
}

function Landing({ onStart, onArticle, onPricing, onContact }) {
  const page = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
      intro.from('.hero-kicker', { y: 18, opacity: 0, duration: .5 }, '-=.35')
        .from('.hero-title .line', { yPercent: 110, opacity: 0, duration: .9, stagger: .1 }, '-=.25')
        .from('.hero-description', { y: 20, opacity: 0, duration: .6 }, '-=.5')
        .from('.hero-actions', { y: 16, opacity: 0, duration: .55 }, '-=.4')
        .from('.hero-visual', { scale: .92, opacity: 0, duration: 1 }, '-=.7')
      gsap.to('.hero-orb', { y: -14, rotation: 2, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.orb-ring', { rotation: 360, duration: 22, repeat: -1, ease: 'none' })
      gsap.to('.orb-ring-two', { rotation: -360, duration: 30, repeat: -1, ease: 'none' })
      gsap.utils.toArray('.story-reveal').forEach((el) => gsap.from(el, { y: 55, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%' } }))
      gsap.utils.toArray('.area').forEach((el, i) => gsap.from(el, { x: i % 2 ? 25 : -25, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }))
      gsap.utils.toArray('.feature-card').forEach((card) => gsap.fromTo(card, { y: 90, scale: .92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 55%', scrub: 1.1 } }))
    }, page)
    return () => ctx.revert()
  }, [])

  function openContact() {
    setContactSent(false)
    setContactOpen(true)
  }

  useLayoutEffect(() => {
    const handler = () => openContact()
    window.addEventListener('evolv:open-contact', handler)
    return () => window.removeEventListener('evolv:open-contact', handler)
  }, [])

  function submitContact(event) {
    event.preventDefault()
    setContactSent(true)
  }

  return (
    <div ref={page} className="page-enter landing">
      <section className="hero" style={{ paddingTop: '150px' }}>
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
        <div className="feature-steps">{[['01','DEFINE','Decide what matters in this season of your life.'],['02','BUILD','Turn intention into goals you can actually act on.'],['03','TRACK','See your momentum, progress and patterns over time.'],['04','EVOLVE','Reflect, adjust and keep becoming your next self.']].map(([num,title,text]) => <article className="feature-step feature-card" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={17} /></article>)}</div>
      </section>
      <section className="experience story-reveal">
        <div className="preview-copy"><span className="section-label">04 — YOUR SPACE</span><h2>A dashboard built around <em>your becoming.</em></h2><p>Once you enter EVOLV, everything becomes personal — your goals, your growth areas, your momentum and the story you're building day by day.</p><button className="button button-primary" onClick={onStart}>Create your space <ArrowRight size={16} /></button></div>
        <div className="mock-dashboard"><div className="mock-header"><span>EVOLV / OVERVIEW</span><span>YOUR MOMENTUM</span></div><div className="mock-main"><div className="mock-ring"><strong>72</strong><small>%</small><span>this week</span></div><div className="mock-tasks"><div><small>CURRENT FOCUS</small><b>Build with intention.</b></div><div className="task"><i /> Learn something new <span>IN PROGRESS</span></div><div className="task"><i /> Show up today <span>ACTIVE</span></div><div className="task"><i /> Review the week <span>FRI</span></div></div></div></div>
      </section>
      <section className="areas story-reveal" id="areas"><div className="section-heading"><span className="section-label">05 — YOUR WORLD</span><p>Choose what you're becoming.</p></div><div className="area-grid">{growthAreas.map((a,i)=><article className="area" key={a.id} onClick={() => onArticle('area', a.id)} role="button" tabIndex="0"><span>0{i+1}</span><div><h3>{a.title}</h3><p>{a.text}</p></div><ArrowRight size={18}/></article>)}</div></section>
      <section className="manifesto story-reveal"><span className="section-label">06 — KEEP GOING</span><h2>You don't need to become<br /><em>someone else.</em></h2><p>You need a place to become more of who you're capable of being.</p></section>
      <section className="faq story-reveal" id="faq"><div className="faq-head"><span className="section-label">07 — QUESTIONS</span><h2>Before you<br /><em>begin.</em></h2></div><div className="faq-list">{[['What exactly is EVOLV?','A personal growth tracker for turning goals and intentions into visible progress.'],['What can I track?','Career, skills, money, health, lifestyle, creative work and other areas that matter to you.'],['Does my progress stay saved?','Yes. Your account is designed to keep your goals and progress connected to you across sessions.'],['Can I change my goals later?','Absolutely. Growth changes with you, so your goals should be able to change too.'],['Is EVOLV a habit tracker?','It can support habits, but the bigger idea is your overall growth — goals, momentum, reflection and progress.']].map(([q,a]) => <details className="faq-item" key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
      <section className="final-cta story-reveal"><span className="section-label">08 — YOUR NEXT SELF</span><h2>Your next version<br /><em>starts here.</em></h2><button className="button button-primary" onClick={onStart}>Start evolving <ArrowRight size={17} /></button></section>
      <Footer onContact={onContact} />
    </div>
  )
}

function PricingPage({ onStart, onBack }) {
  const plans = [
    {
      name: 'STARTER',
      title: 'Build your foundation.',
      price: 'Free',
      description: 'A simple place to define what matters and start making progress visible.',
      features: ['Personal growth profile', 'Growth areas & focus', 'Goal creation', 'Basic progress tracking', 'Personal dashboard', 'Weekly momentum view'],
    },
    {
      name: 'PRO',
      title: 'Go deeper with your growth.',
      price: 'Coming soon',
      featured: true,
      description: 'For people ready to turn consistent effort into a system they can keep building on.',
      features: ['Everything in Starter', 'Unlimited goals', 'Detailed progress insights', 'Momentum & streak history', 'Goal reflections', 'Advanced growth tracking', 'Priority feature access'],
    },
    {
      name: 'EVOLV+',
      title: 'Your full growth system.',
      price: 'Coming soon',
      description: 'A more complete experience for people who want EVOLV woven into every part of their journey.',
      features: ['Everything in Pro', 'Advanced planning tools', 'Deeper personal insights', 'Long-term growth history', 'Expanded progress analytics', 'Early access to new features', 'Premium EVOLV experiences'],
    },
  ]

  return (
    <div className="pricing-page page-enter">

      <header className="pricing-hero">
        <span className="section-label">PLANS & PRICING</span>
        <h1>Choose the space<br /><em>you want to grow in.</em></h1>
        <p>EVOLV is being built in layers. Explore what each plan will include — pricing and availability are coming soon.</p>
        <div className="pricing-coming"><span></span> PRICING IS COMING SOON</div>
      </header>

      <main className="pricing-content">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? 'pricing-card featured' : 'pricing-card'} key={plan.name}>
              {plan.featured && <div className="pricing-popular">MOST COMPLETE</div>}
              <div className="pricing-card-top">
                <span className="pricing-plan">{plan.name}</span>
                <h2>{plan.title}</h2>
                <p>{plan.description}</p>
              </div>
              <div className="pricing-price">
                <strong>{plan.price}</strong>
                {plan.price === 'Free' && <span> / forever</span>}
              </div>
              <button className="pricing-card-cta" type="button" disabled>
                Coming soon <ArrowRight size={15}/>
              </button>
              <div className="pricing-divider" />
              <span className="pricing-includes">INCLUDES</span>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={15}/> {feature}</li>)}</ul>
            </article>
          ))}
        </div>

        <section className="pricing-comparison">
          <div>
            <span className="section-label">THE EVOLV MODEL</span>
            <h2>More than a<br /><em>subscription.</em></h2>
          </div>
          <div className="pricing-comparison-copy">
            <p>Each plan is designed around the same idea: your growth should become easier to see, understand and continue.</p>
            <div className="pricing-points">
              <div><span>01</span><b>Start simple</b><p>Build the habit of showing up before adding more complexity.</p></div>
              <div><span>02</span><b>Go deeper</b><p>Unlock richer tools when your goals and progress need more room.</p></div>
              <div><span>03</span><b>Keep evolving</b><p>Move between stages as your life changes. Your system should grow with you.</p></div>
            </div>
          </div>
        </section>

        <section className="pricing-faq">
          <span className="section-label">BEFORE YOU CHOOSE</span>
          <h2>Not ready yet?<br /><em>That's the point.</em></h2>
          <p>Nothing on this page can be purchased yet. The cards are intentionally non-clickable while EVOLV's plans are being finalised.</p>
          <button className="button button-ghost" onClick={onBack}>Explore EVOLV <ArrowRight size={16}/></button>
        </section>
      </main>

      <footer className="pricing-footer"><Brand /><span>© 2026 EVOLV — BUILT FOR BECOMING</span></footer>
    </div>
  )
}

function ArticlePage({ article, onStart, onBack }) {
  const isFeatures = article?.type === 'features'
  const area = growthAreas.find(a => a.id === article?.areaId)
  const title = isFeatures ? 'The system behind your becoming.' : area?.title || 'Growth areas'
  const eyebrow = isFeatures ? '03 — THE SYSTEM' : `05 — YOUR WORLD / ${area?.title?.toUpperCase() || 'GROWTH AREAS'}`

  const featureSections = [
    {
      heading: 'DEFINE',
      title: 'Give the goal a real shape.',
      text: '“I want to get better at coding” sounds motivating until Monday arrives and you do not know what to work on. EVOLV helps turn that thought into something concrete — for example, building one backend project, learning one concept, or finishing one lesson this week.'
    },
    {
      heading: 'BUILD',
      title: 'Make progress small enough to start.',
      text: 'Big goals become easier when they stop asking for your whole life at once. Instead of “I need to become financially stable,” you might start with “find one freelance opportunity this week” or “save my first ₦20,000.” Small actions create something you can actually repeat.'
    },
    {
      heading: 'TRACK',
      title: 'Let your progress become visible.',
      text: 'Most people remember the days they failed and forget the days they showed up. Tracking gives you a different picture. You can look back and see that you studied four times, finished two tasks, or moved a project forward even when the result was not immediate.'
    },
    {
      heading: 'EVOLVE',
      title: 'Change the plan without abandoning yourself.',
      text: 'Life changes. A goal that made sense three months ago may not fit anymore. EVOLV is built around adjustment, not perfection — review what is working, change what is not, and keep moving without feeling like you are starting from zero.'
    },
  ]

  const areaContent = {
    career: {
      intro: 'A career is rarely changed by one dramatic decision. It is usually shaped by the skills you build, the opportunities you notice and the work you keep showing up for.',
      sections: [
        ['WHY IT MATTERS', 'Maybe you know you want a better career but cannot explain what “better” means yet. Start there. More income, meaningful work, remote opportunities, leadership, independence — your definition gives your next step somewhere to go.'],
        ['MAKE IT VISIBLE', 'Imagine wanting to move into software engineering. Instead of keeping “learn coding” in your head for another year, turn it into visible steps: finish a JavaScript course, build a project, publish it, improve your CV and reach out to potential clients.'],
        ['KEEP MOVING', 'Your first opportunity may not be your dream role. Your first project may not be impressive. That is normal. The point is to create evidence that you are moving — one skill, project, application or conversation at a time.'],
      ]
    },
    skills: {
      intro: 'Skills change what you are capable of doing. Whether you are learning to code, design, communicate or manage money, the goal is not simply to consume information — it is to become able to do something you could not do before.',
      sections: [
        ['WHY IT MATTERS', 'There is a difference between watching ten tutorials and being able to build something yourself. Real growth happens when learning starts changing what you can actually do.'],
        ['MAKE IT VISIBLE', 'Say you want to learn backend development. Instead of “learn Express,” give yourself proof: build a small API, connect it to a database, create authentication and deploy it. Now your learning has become something real.'],
        ['KEEP MOVING', 'You will forget things. You will get stuck. You will write code that breaks. That is part of learning. Keep a record of what you attempted and what you solved, because competence is built through repeated contact with difficult things.'],
      ]
    },
    money: {
      intro: 'Money goals become less overwhelming when they stop being one giant number in your head and become decisions you can make today.',
      sections: [
        ['WHY IT MATTERS', '“I want to be rich” is difficult to act on. “I want to earn my first ₦100,000 from a skill” is much clearer. A useful money goal gives you a target, a reason and a next action.'],
        ['MAKE IT VISIBLE', 'Maybe you want to start earning online. Your first month might be about creating one strong service, building two examples, contacting ten relevant prospects and tracking what happens. That is far more actionable than simply hoping for more income.'],
        ['KEEP MOVING', 'Income can be inconsistent at the beginning. A quiet week does not automatically mean the plan failed. Look at what you can control — your offer, skills, outreach, spending and saving — then adjust based on what you learn.'],
      ]
    },
    life: {
      intro: 'Personal growth is not only about work. Sometimes the goal is simply to create a life that feels more intentional, organised and genuinely yours.',
      sections: [
        ['WHY IT MATTERS', 'You might want to read more, spend less time scrolling, travel, reconnect with people, organise your week or finally start a project you keep postponing. These goals matter because they shape how your ordinary days feel.'],
        ['MAKE IT VISIBLE', 'Instead of “I need to get my life together,” choose something you can see. Plan your week every Sunday. Read ten pages a day. Spend one evening without social media. Finish the thing you have been delaying.'],
        ['KEEP MOVING', 'A good life is not built from perfect weeks. Some weeks will be messy. The useful question is not “Did I do everything?” but “What is the next small thing that would move me back in the direction I want?”'],
      ]
    },
    health: {
      intro: 'Health is built in ordinary moments: the meal you choose, the walk you take, the sleep you protect and the habits you return to when life gets busy.',
      sections: [
        ['WHY IT MATTERS', 'You do not need an extreme transformation to start taking better care of yourself. A healthier routine can begin with something as ordinary as getting consistent sleep, moving your body more or making time to recover.'],
        ['MAKE IT VISIBLE', 'If your goal is to feel more energetic, turn that into actions you can actually see: walk three times this week, prepare better meals, drink enough water or create a consistent bedtime. The point is to make the intention measurable.'],
        ['KEEP MOVING', 'Missing a day does not erase the days you did well. Avoid the all-or-nothing mindset. Return to the routine, learn what interrupted it and make the next version easier to maintain.'],
      ]
    },
    creative: {
      intro: 'Creative work often stays trapped in ideas because there is always a reason to wait: better equipment, more time, more confidence or a better idea. Progress begins when the work leaves your head.',
      sections: [
        ['WHY IT MATTERS', 'Maybe you want to start a brand, make music, write, design, build an app or create content. The idea becomes real only when you give it a place in your schedule and allow yourself to make imperfect versions.'],
        ['MAKE IT VISIBLE', 'Instead of “start my brand,” define the next evidence of progress: choose the name, create three concepts, publish the first piece, build the landing page or show the idea to someone. Each step turns imagination into something other people can see.'],
        ['KEEP MOVING', 'Your early work may not look like the work you eventually become proud of. That is not a reason to hide it. Make, review, improve and make again. Creative confidence usually grows after the work, not before it.'],
      ]
    }
  }

  const content = isFeatures
    ? {
        intro: 'Growth sounds simple until real life gets in the way. EVOLV gives your intentions a structure you can return to when motivation fades, plans change and the week gets busy.',
        sections: featureSections
      }
    : (areaContent[article?.areaId] || {
        intro: 'Whatever you are working toward, progress becomes easier to understand when you give it a direction and a next step.',
        sections: [
          ['WHY IT MATTERS', 'Give this part of your life a clear place in the bigger picture.'],
          ['MAKE IT VISIBLE', 'Turn an idea into a goal you can act on and return to.'],
          ['KEEP MOVING', 'Use what you learn to adjust the next step rather than giving up.'],
        ]
      })



  return (
    <div className="article-page">

      <header className="article-hero">
        <div className="article-hero-copy">
          <span className="section-label article-kicker">{eyebrow}</span>
          <h1 className="article-title">{title}</h1>
          <p className="article-intro">{content.intro}</p>
        </div>
      </header>

      <main className="article-body">
        <div className="article-lead article-block">
          <span>01</span>
          <p>{isFeatures
            ? 'The point is not to become obsessed with productivity. It is to stop letting important goals disappear into the noise of everyday life.'
            : `Your ${area?.title?.toLowerCase() || 'growth'} deserves more than a vague promise to “do better.” Give it a direction, then give yourself a way to see that you are moving.`}
          </p>
        </div>

        <div className="article-grid">
          {content.sections.map(([heading, text], i) => {
            const item = isFeatures ? { heading, text } : { heading, text }
            return (
              <article className="article-block article-content-card" key={heading}>
                <span>0{i + 2}</span>
                <h2>{item.heading}</h2>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>

        <section className="article-example article-block">
          <span className="section-label">REAL LIFE</span>
          <h2>{isFeatures
            ? 'From “I should” to “I did.”'
            : `What this could look like in ${area?.title?.toLowerCase() || 'your life'}.`}
          </h2>
          <p>{isFeatures
            ? 'You open your notes and see “learn backend.” Three months later, nothing has changed. With a visible system, that idea can become: finish one lesson tonight → build a small API this weekend → connect a database next week → publish the project → look for the next opportunity. The goal did not change. Your relationship with it did.'
            : `The difference is often surprisingly small. Instead of keeping “I want to improve my ${area?.title?.toLowerCase() || 'life'}” as a thought, choose one thing you can do this week, record it, and return to it. Over time, those small pieces become evidence that your life is actually changing.`}
          </p>
        </section>

        <section className="article-end article-block">
          <span className="section-label">THE NEXT MOVE</span>
          <h2>Make it visible.<br/><em>Then make it real.</em></h2>
          <button className="button button-primary" onClick={onStart}>Start evolving <ArrowRight size={17}/></button>
        </section>
      </main>
    </div>
  )
}

function Onboarding({ step, setStep, data, setData, onFinish, onExit }) {
  const journey = [
    { label: 'THE BEGINNING', title: <>Before you build<br /><em>your next chapter.</em></>, copy: 'EVOLV starts with a simple question: what would you change if you actually had a place to work on it?', type: 'intro' },
    { label: 'MAKE IT YOURS', title: <>First, what should<br /><em>we call you?</em></>, copy: 'This becomes your space. Nothing here is about becoming someone else — it is about becoming more of who you want to be.', type: 'name' },
    { label: 'YOUR WORLD', title: <>Where do you want<br /><em>to move forward?</em></>, copy: 'Choose the parts of life that feel important in this season. You can change them whenever you want.', type: 'areas' },
    { label: 'YOUR DIRECTION', title: <>What are you<br /><em>ready for?</em></>, copy: 'Growth looks different from season to season. Pick the direction that feels most true right now.', type: 'focus' },
    { label: 'MAKE IT REAL', title: <>What is one thing<br /><em>you want to change?</em></>, copy: 'Give yourself something real to work toward. It does not need to be perfect — it just needs to matter.', type: 'goal' },
    { label: 'YOUR NEXT SELF', title: <>You're not starting<br /><em>from zero.</em></>, copy: 'You have a direction. You have something that matters. Now EVOLV can help you turn that intention into visible progress.', type: 'ready' },
  ]

  const current = journey[step]
  const total = journey.length
  const canContinue = current.type === 'intro' || current.type === 'ready'
    ? true
    : current.type === 'name'
      ? data.name.trim().length > 0
      : current.type === 'areas'
        ? data.areas.length > 0
        : current.type === 'focus'
          ? Boolean(data.focus)
          : data.goal.trim().length > 0

  function next() {
    if (!canContinue) return
    if (step < total - 1) setStep(step + 1)
    else onFinish()
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="page-enter onboarding">
      <header className="onboard-head">
        <button className="onboard-brand" onClick={() => setStep(0)} aria-label="Return to beginning of journey"><Brand /></button>
        <div className="onboard-head-actions">
          <div className="step-count">{step === 0 ? 'START' : `0${step} / 0${total - 1}`}</div>
          <button className="exit-journey" onClick={onExit}>
            Exit journey
          </button>
        </div>
      </header>

      <div className="onboard-progress">
        <i style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      <section className="onboard-content">
        <div className={`onboard-step ${current.type === 'areas' ? 'wide' : ''} ${current.type === 'intro' || current.type === 'ready' ? 'onboard-landing-step' : ''}`}>
          {step > 0 && (
            <button className="back-button" onClick={back} aria-label="Go to previous step">
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
          )}
          <span className="section-label">{current.label}</span>
          <h1>{current.title}</h1>
          <p>{current.copy}</p>

          {current.type === 'intro' && (
            <div className="journey-intro">
              <div className="journey-orbit"><span /><i /><b /></div>
              <div className="journey-note">
                <span>THE IDEA</span>
                <strong>Direction → Action → Progress</strong>
                <small>One step at a time.</small>
              </div>
            </div>
          )}

          {current.type === 'name' && (
            <div className="onboard-field-wrap">
              <input autoFocus value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="Your first name" />
              <span>We'll use this to make your space feel like yours.</span>
            </div>
          )}

          {current.type === 'areas' && (
            <div className="choice-grid">
              {growthAreas.map((a, i) => (
                <button
                  className={data.areas.includes(a.id) ? 'choice active' : 'choice'}
                  key={a.id}
                  onClick={() => setData({
                    ...data,
                    areas: data.areas.includes(a.id)
                      ? data.areas.filter(x => x !== a.id)
                      : [...data.areas, a.id]
                  })}
                >
                  <span className="choice-number">0{i + 1}</span>
                  <span>{a.title}</span>
                  <small>{a.text}</small>
                  {data.areas.includes(a.id) && <Check size={16} />}
                </button>
              ))}
            </div>
          )}

          {current.type === 'focus' && (
            <div className="focus-list">
              {['I want more clarity', 'I want to build discipline', 'I want to level up', 'I want to become consistent'].map(x => (
                <button className={data.focus === x ? 'focus active' : 'focus'} key={x} onClick={() => setData({ ...data, focus: x })}>
                  <span>{x}</span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}

          {current.type === 'goal' && (
            <div className="onboard-field-wrap">
              <textarea autoFocus value={data.goal} onChange={e => setData({ ...data, goal: e.target.value })} placeholder="e.g. Become confident with backend development" rows="3" />
              <span>Keep it simple. You can refine it once you're inside.</span>
            </div>
          )}

          {current.type === 'ready' && (
            <div className="journey-ready">
              <div className="ready-card">
                <span>YOUR STARTING POINT</span>
                <strong>{data.name || 'Your space'}</strong>
                <p>{data.goal || 'Your first goal'}</p>
                <div className="ready-meta">
                  <span>{data.areas.length} growth {data.areas.length === 1 ? 'area' : 'areas'}</span>
                  <span>{data.focus || 'Your direction'}</span>
                </div>
              </div>
              <p className="ready-small">Next, we'll create your account so your journey can stay connected to you.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="onboard-footer">
        <span>{step === 0 ? 'A DIFFERENT KIND OF START' : step === total - 1 ? 'READY WHEN YOU ARE' : 'YOUR JOURNEY / 0' + step}</span>
        <button className="button button-primary" disabled={!canContinue} onClick={next}>
          {step === 0 ? 'Begin the journey' : step === total - 1 ? 'Create my EVOLV account' : 'Continue'} <ArrowRight size={16} />
        </button>
      </footer>
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
