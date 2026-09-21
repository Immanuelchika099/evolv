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
  const [article, setArticle] = useState(null)
  const [step, setStep] = useState(0)
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
      {view === 'landing' && <Landing onStart={enterApp} onArticle={openArticle} />}
      {view === 'article' && <ArticlePage article={article} onStart={enterApp} onBack={closeArticle} />}
      {view === 'onboarding' && (
        <Onboarding
          step={step}
          setStep={setStep}
          data={data}
          setData={setData}
          onFinish={finishOnboarding}
          onHome={returnHome}
        />
      )}
      {view === 'dashboard' && <Dashboard data={data} onLogout={logout} />}
    </main>
  )
}

function Brand() {
  return <a className="brand" href="/"><span className="brand-mark"><span /></span><span>EVOLV</span></a>
}

function Landing({ onStart, onArticle }) {
  const page = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactSent, setContactSent] = useState(false)

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

  useLayoutEffect(() => {
    let lastScroll = window.scrollY
    function handleScroll() {
      const currentScroll = window.scrollY
      if (currentScroll < 40) setNavVisible(true)
      else if (currentScroll > lastScroll + 3) { setNavVisible(false); setMenuOpen(false) }
      else if (currentScroll < lastScroll - 3) setNavVisible(true)
      lastScroll = currentScroll
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function closeMenu() { setMenuOpen(false) }

  function openContact() {
    setMenuOpen(false)
    setContactSent(false)
    setContactOpen(true)
  }

  function submitContact(event) {
    event.preventDefault()
    setContactSent(true)
  }

  return (
    <div ref={page} className="page-enter landing">
      <nav className={navVisible ? "landing-nav nav nav-visible" : "landing-nav nav nav-hidden"}>
        <Brand />
        <div className="nav-links">
          <a href="#story">Why EVOLV</a>
          <button onClick={() => onArticle('features')}>Features</button>
          <button onClick={() => onArticle('areas')}>Growth areas</button>
          <button onClick={openContact}>Contact</button>
        </div>
        <div className="nav-actions">
          <button className="nav-login" onClick={onStart}>Enter EVOLV <ArrowRight size={15} /></button>
          <button type="button" className={menuOpen ? 'menu-button menu-open' : 'menu-button'} onClick={() => setMenuOpen(prev => !prev)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}><span /><span /></button>
        </div>
      </nav>
      <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        <a href="#story" onClick={closeMenu}>Why EVOLV</a>
        <button onClick={() => { closeMenu(); onArticle('features') }}>Features</button>
        <button onClick={() => { closeMenu(); onArticle('areas') }}>Growth areas</button>
        <button onClick={openContact}>Contact</button>
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
      {contactOpen && (
        <div className="contact-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(e) => { if (e.target === e.currentTarget) setContactOpen(false) }}>
          <div className="contact-modal">
            <button className="contact-close" onClick={() => setContactOpen(false)} aria-label="Close contact form">×</button>
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
                <button className="button button-primary contact-submit" type="submit">Send message <ArrowRight size={16} /></button>
              </form>
            ) : (
              <div className="contact-success">
                <span className="contact-success-mark"><Check size={20} /></span>
                <span className="section-label">MESSAGE READY</span>
                <h2>Thanks for<br /><em>reaching out.</em></h2>
                <p>Your message has been captured. The next step is connecting this form to EVOLV's email/backend endpoint.</p>
                <button className="button button-primary" onClick={() => setContactOpen(false)}>Back to EVOLV <ArrowRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      )}
      <footer className="site-footer"><div className="footer-brand"><Brand /><p>Track your growth.<br />Become your next self.</p></div><div className="footer-links"><div><span>EXPLORE</span><a href="#story">Why EVOLV</a><button onClick={() => onArticle('features')}>Features</button><button onClick={() => onArticle('areas')}>Growth areas</button><button onClick={openContact}>Contact</button><a href="#faq">FAQ</a></div><div><span>CONNECT</span><a href="https://www.instagram.com/hi_imanw/" target="_blank" rel="noreferrer" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.4" cy="6.7" r="1" fill="currentColor"/></svg></a></div></div><div className="footer-bottom"><span>© 2026 EVOLV</span><span>BUILT FOR BECOMING</span></div></footer>
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
      <nav className="article-nav">
        <button className="article-back" onClick={onBack}><ChevronLeft size={16}/> Back to EVOLV</button>
        <Brand />
        <button className="article-start" onClick={onStart}>Start evolving <ArrowRight size={15}/></button>
      </nav>

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

function Onboarding({ step, setStep, data, setData, onFinish, onHome }) {
  const total = 4
  const next = () => step < total - 1 ? setStep(step + 1) : onFinish()
  const back = () => step > 0 ? setStep(step - 1) : onHome()
  const canContinue = [data.name.trim(), data.areas.length, data.focus, data.goal.trim()][step]

  return (
    <div className="page-enter onboarding">
      <header className="onboard-head"><Brand /><div className="step-count">0{step + 1} / 0{total}</div></header>
      <div className="progress-track"><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
      <section className="onboard-content">
        <button className="back-button" onClick={back}><ChevronLeft size={16}/> Back</button>
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
