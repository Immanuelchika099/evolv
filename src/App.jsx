import { useLayoutEffect, useRef } from 'react'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import gsap from 'gsap'

const areas = [
  ['01', 'Career', 'Build work that moves you forward.'],
  ['02', 'Skills', 'Turn curiosity into real capability.'],
  ['03', 'Money', 'Create healthier financial momentum.'],
  ['04', 'Life', 'Design a life that feels like yours.'],
]

function App() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.nav, .hero-kicker, .hero-title, .hero-copy, .hero-actions, .hero-orb, .hero-panel', {
        y: 28,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
      })

      gsap.to('.orb-core', {
        scale: 1.08,
        opacity: 0.72,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.orb-ring', {
        rotate: 360,
        duration: 24,
        repeat: -1,
        ease: 'none',
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <main ref={root} className="site">
      <div className="noise" />

      <nav className="nav">
        <a className="brand" href="/" aria-label="Evolv home">
          <span className="brand-mark"><span /></span>
          <span>EVOLV</span>
        </a>

        <div className="nav-links">
          <a href="#philosophy">Philosophy</a>
          <a href="#areas">Growth areas</a>
        </div>

        <a className="nav-login" href="#start">Sign in <ArrowRight size={15} /></a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> PERSONAL GROWTH, TRACKED</div>
          <h1 className="hero-title">Become the person<br /><em>you keep imagining.</em></h1>
          <p className="hero-description">
            EVOLV turns ambition into something you can see, measure and return to —
            one goal, habit and decision at a time.
          </p>

          <div className="hero-actions" id="start">
            <a className="button button-primary" href="#dashboard">Start evolving <ArrowRight size={17} /></a>
            <a className="button button-ghost" href="#philosophy"><Play size={14} fill="currentColor" /> Explore</a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orb">
            <div className="orb-glow orb-core" />
            <div className="orb-ring" />
            <div className="orb-ring orb-ring-two" />
            <div className="orb-dot dot-one" />
            <div className="orb-dot dot-two" />
          </div>

          <div className="hero-panel">
            <div className="panel-top"><span>YOUR MOMENTUM</span><span>THIS WEEK</span></div>
            <div className="panel-score">72<span>%</span></div>
            <div className="progress-line"><i /></div>
            <div className="panel-bottom"><span>+18% from last week</span><b>On track</b></div>
          </div>
        </div>
      </section>

      <section className="statement" id="philosophy">
        <span className="section-label">THE EVOLV PHILOSOPHY</span>
        <h2>Growth shouldn't live<br />inside your head.</h2>
        <p>Give your goals a place to exist. See the days you showed up. Understand your momentum. Then keep going.</p>
      </section>

      <section className="areas" id="areas">
        <div className="section-heading">
          <span className="section-label">YOUR WORLD</span>
          <p>Choose what you're becoming.</p>
        </div>

        <div className="area-grid">
          {areas.map(([number, title, text]) => (
            <article className="area" key={title}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <ArrowRight size={18} />
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-preview" id="dashboard">
        <div className="preview-copy">
          <span className="section-label">THE DAILY VIEW</span>
          <h2>Know where you are.<br /><em>Know where you're going.</em></h2>
          <p>Goals, streaks, progress and patterns — brought together in one calm space.</p>
        </div>

        <div className="mock-dashboard">
          <div className="mock-header"><span>Good evening, Iman.</span><span>•••</span></div>
          <div className="mock-main">
            <div className="mock-ring"><strong>72</strong><small>%</small><span>weekly momentum</span></div>
            <div className="mock-tasks">
              <div><small>TODAY</small><b>Keep the promise.</b></div>
              <div className="task"><i /> Build something useful <span>Done</span></div>
              <div className="task"><i /> Learn for 30 minutes <span>Done</span></div>
              <div className="task"><i /> Review this week's goals <span>Next</span></div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <a className="brand" href="/"><span className="brand-mark"><span /></span><span>EVOLV</span></a>
        <p>Track your growth. Become your next self.</p>
        <span>© 2026</span>
      </footer>
    </main>
  )
}

export default App
