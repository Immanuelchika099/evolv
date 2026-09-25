import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Camera, Upload, Check, ChevronLeft, Home, LineChart, LogOut, MessageCircle, Plus, Settings, Sparkles, Target, TrendingUp, UserRound, Bot, Send, ArrowUp, ClipboardPlus, Copy, Volume2, VolumeX, Share2, HeartPulse, Apple, WalletCards, BriefcaseBusiness, Brain, Sprout, Moon, Droplets, Dumbbell, Footprints, Zap, Scale, Smile, Focus, NotebookPen, Receipt, PiggyBank, ArrowDownLeft, ArrowUpRight, BookOpen, Users, CheckCircle2, X, ChevronRight, Utensils, ExternalLink, Sunrise } from 'lucide-react'
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
  const [isBooting, setIsBooting] = useState(true)
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

  async function ensureProfile(user) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (existing) return

    let saved = initialData
    try { saved = { ...initialData, ...JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') } } catch {}

    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: saved.name?.trim() || '',
      growth_areas: saved.areas || [],
      focus: saved.focus || '',
      first_goal: saved.goal?.trim() || '',
    })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBooting(false), 1350)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let mounted = true

    async function restoreAuth() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!mounted) return
      if (sessionData?.session?.user) {
        const user = sessionData.session.user
        const oauthIntent = sessionStorage.getItem('evolv-oauth-intent')

        if (oauthIntent === 'login') {
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

          if (profileError) {
            await supabase.auth.signOut()
            sessionStorage.removeItem('evolv-oauth-intent')
            sessionStorage.setItem(
              'evolv-auth-error',
              'We couldn’t verify your EVOLV account. Please create an account first, then return here to sign in with Google or GitHub.'
            )
            localStorage.setItem('evolv-view', 'auth')
            setAuthMode('login')
            setView('auth')
            return
          }

          if (!existingProfile) {
            await supabase.auth.signOut()
            sessionStorage.removeItem('evolv-oauth-intent')
            sessionStorage.setItem(
              'evolv-auth-error',
              'No EVOLV account was found for this Google or GitHub profile. Please create an account first, then come back and sign in.'
            )
            localStorage.setItem('evolv-view', 'auth')
            setAuthMode('login')
            setView('auth')
            return
          }

          await finishAuth(user, 'login')
          sessionStorage.removeItem('evolv-oauth-intent')
          return
        }

        await ensureProfile(user)
        localStorage.setItem('evolv-view', 'dashboard')
        setView('dashboard')
      }
    }

    restoreAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session?.user) {
        // A Google/GitHub attempt from the sign-in screen must be validated
        // against an existing EVOLV profile before entering the dashboard.
        // Do not let the auth event race ahead of restoreAuth and create a
        // new-account experience by sending the user straight into the app.
        if (sessionStorage.getItem('evolv-oauth-intent') === 'login') return

        localStorage.setItem('evolv-view', 'dashboard')
        setView('dashboard')
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (view !== 'article') {
        gsap.from('.page-enter > *', { y: 24, opacity: 1, duration: .75, stagger: .06, ease: 'power3.out' })
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

  function exploreLanding() {
    setArticle(null)
    localStorage.setItem('evolv-view', 'landing')
    setView('landing')
    window.setTimeout(() => {
      const story = document.getElementById('story')
      if (!story) return
      const top = story.getBoundingClientRect().top + window.scrollY - 32
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }, 40)
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

  async function finishAuth(user, authMode = 'signup') {
    if (authMode === 'signup') {
      await supabase.from('profiles').upsert({
        id: user.id,
        first_name: data.name.trim(),
        growth_areas: data.areas,
        focus: data.focus,
        first_goal: data.goal.trim(),
      })
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name,growth_areas,focus,first_goal')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setData({
          name: profile.first_name || '',
          areas: profile.growth_areas || [],
          focus: profile.focus || '',
          goal: profile.first_goal || '',
        })
      }
    }
    localStorage.setItem('evolv-view', 'dashboard')
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('evolv-view')
    localStorage.removeItem('evolv-onboarding')
    setView('landing')
    setData(initialData)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <main ref={root} className="app">
      {isBooting && <EvolvLoader />}
      <div className="noise" />
      {view !== 'onboarding' && view !== 'auth' && view !== 'dashboard' && (
        <Navbar onStart={enterApp} onSignIn={() => { setAuthMode('login'); setView('auth'); localStorage.setItem('evolv-view', 'auth'); window.scrollTo({ top: 0, behavior: 'instant' }) }} onFeatures={() => openArticle('features')} onAreas={() => openArticle('areas')} onPricing={openPricing} onContact={openContact} onHome={returnHome} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      )}
      {view === 'landing' && <Landing onStart={enterApp} onExplore={exploreLanding} onArticle={openArticle} onPricing={openPricing} onContact={openContact} />}
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
      {view === 'dashboard' && <Dashboard data={data} onLogout={logout} onArticle={openArticle} />}
      {contactOpen && <ContactModal contactSent={contactSent} setContactSent={setContactSent} onClose={closeContact} />}
    </main>
  )
}


function EvolvLoader() {
  return (
    <div className="evolv-loader" aria-label="Loading EVOLV">
      <div className="evolv-loader-core">
        <div className="evolv-loader-mark"><span /></div>
        <div className="evolv-loader-word">EVOLV</div>
        <div className="evolv-loader-line"><i /></div>
      </div>
    </div>
  )
}

function AuthPage({ mode, setMode, data, onSuccess, onHome }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(() => {
    const storedError = sessionStorage.getItem('evolv-auth-error')
    if (storedError) sessionStorage.removeItem('evolv-auth-error')
    return storedError || ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    function resetOAuthLoading() {
      setSending(false)
    }

    function handlePageShow(event) {
      if (event.persisted) resetOAuthLoading()
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('popstate', resetOAuthLoading)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('popstate', resetOAuthLoading)
    }
  }, [])

  async function continueWithProvider(provider) {
    setSending(true)
    setError('')
    setMessage('')

    // Remember that this OAuth attempt was explicitly made from the
    // sign-in screen. After the provider redirects back, App validates
    // that an EVOLV profile already exists before allowing access.
    if (mode === 'login') {
      sessionStorage.setItem('evolv-oauth-intent', 'login')
    } else {
      sessionStorage.removeItem('evolv-oauth-intent')
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })

    if (oauthError) {
      sessionStorage.removeItem('evolv-oauth-intent')
      setError(oauthError.message || `Could not continue with ${provider}. Please try again.`)
      setSending(false)
    }
  }

  async function requestPasswordReset() {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError('Enter your email first.')
      return
    }

    setSending(true)
    setError('')
    setMessage('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    })

    setSending(false)

    if (resetError) {
      setError(resetError.message || 'Could not send the password reset email. Please try again.')
      return
    }

    setMessage('Password reset instructions have been sent to your email.')
  }

  async function submit(event) {
    event.preventDefault()
    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setError('Enter your email and password to continue.')
      return
    }

    setSending(true)
    setError('')
    setMessage('')

    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        : await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (result.error) {
        console.error('EVOLV auth error:', {
          message: result.error.message,
          code: result.error.code,
          status: result.error.status,
          name: result.error.name,
        })

        const code = result.error.code || ''
        if (code === 'signup_disabled') {
          setError('Account creation is currently disabled. Check your EVOLV authentication settings.')
        } else if (code === 'email_provider_disabled') {
          setError('Email sign-up is not enabled yet. Check EVOLV authentication settings.')
        } else if (code === 'weak_password') {
          setError('That password is too weak. Please choose a stronger password.')
        } else if (code === 'user_already_exists') {
          setError('An account with this email already exists. Try signing in instead.')
        } else if (code === 'over_email_send_rate_limit') {
          setError('Too many confirmation emails have been requested. Please wait a little and try again.')
        } else {
          setError(result.error.message || 'EVOLV could not create your account. Please try again.')
        }
        return
      }

      if (mode === 'signup' && !result.data.session) {
        setMessage('Your account was created. Check your email to confirm it, then come back and sign in.')
        return
      }

      if (result.data.user) {
        try {
          await onSuccess(result.data.user, mode)
        } catch (profileError) {
          console.error('EVOLV profile setup failed:', profileError)
          setError(profileError?.message || 'Your account was created, but we could not finish setting up your EVOLV profile.')
        }
      }
    } catch (submitError) {
      console.error('EVOLV authentication request failed:', submitError)

      const message = submitError?.message || ''
      if (/failed to fetch|network|load failed/i.test(message)) {
        setError('EVOLV could not reach its authentication service. Check your connection and try again.')
      } else {
        setError(message || 'Something went wrong while creating your account. Please try again.')
      }
    } finally {
      setSending(false)
    }
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
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>

          {mode === 'login' && (
            <button className="forgot-password" type="button" onClick={requestPasswordReset} disabled={sending}>
              Forgot password?
            </button>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button className="button button-primary auth-submit" disabled={sending} type="submit">
            {sending
              ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
              : (mode === 'signup' ? 'Create account' : 'Sign in')}
            {!sending && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-divider"><span>OR</span></div>
        <button className="google-auth-button" type="button" onClick={() => continueWithProvider('google')} disabled={sending}>
          <img className="auth-provider-logo google-provider-logo" src="/google-g-logo.svg" alt="" aria-hidden="true" />
          Continue with Google
        </button>
        <button className="google-auth-button" type="button" onClick={() => continueWithProvider('github')} disabled={sending}>
          <img className="auth-provider-logo github-provider-logo" src="/github-mark.svg" alt="" aria-hidden="true" />
          Continue with GitHub
        </button>

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
  return (
    <a className="brand" href="/" aria-label="EVOLV home">
      <img src="/evolv-mark.svg" alt="" aria-hidden="true" />
      <span>EVOLV</span>
    </a>
  )
}


function Landing({ onStart, onExplore, onArticle, onPricing, onContact }) {
  const page = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
      intro.from('.hero-kicker', { y: 18, opacity: 0, duration: .5 }, '-=.35')
        .from('.hero-title .line', { yPercent: 110, opacity: 0, duration: .9, stagger: .1 }, '-=.25')
        .from('.hero-description', { y: 20, opacity: 0, duration: .6 }, '-=.5')
        .from('.hero-actions', { y: 16, opacity: 0, duration: .55 }, '-=.4')
        .from('.hero-visual', { scale: .92, opacity: 0, duration: 1 }, '-=.7')
      gsap.to('.hero-outer-ring', { rotation: 360, duration: 22, repeat: -1, ease: 'none' })
      // Keep the marquee independent from the page-scroll animations.
      // IMPORTANT: do not return from this GSAP context callback here — that
      // would skip every ScrollTrigger created below.
      let cleanupMarquee = null
      const marqueeTrack = page.current?.querySelector('.evolv-scroll-marquee-track')
      if (marqueeTrack) {
        let marqueeX = 0
        let lastTime = performance.now()

        const getLoopDistance = () => marqueeTrack.scrollWidth / 2
        const wrapMarquee = (value) => {
          const distance = getLoopDistance()
          if (!distance) return 0
          return gsap.utils.wrap(-distance, 0, value)
        }

        const animateMarquee = () => {
          const now = performance.now()
          const elapsed = Math.min(40, now - lastTime)
          lastTime = now
          marqueeX = wrapMarquee(marqueeX - (0.022 * elapsed))
          gsap.set(marqueeTrack, { x: marqueeX })
        }

        gsap.ticker.add(animateMarquee)
        cleanupMarquee = () => gsap.ticker.remove(animateMarquee)
      }


      gsap.utils.toArray('.story-reveal').forEach((el) => gsap.from(el, { y: 55, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%' } }))
      // Scroll-driven text reveal: the homepage copy starts subdued and brightens as it enters focus.
      const revealTextGroups = [
        { selector: '.story-reveal h2, .story-reveal h3', from: '#6f756f', to: '#f4f1ea' },
        { selector: '.story-reveal p, .section-heading p, .area p', from: '#656b65', to: '#b9bdb6' },
        { selector: '.story-reveal .section-label, .statement-number', from: '#555d57', to: '#9aa39a' },
        { selector: '.faq-item summary', from: '#727872', to: '#f0eee7' },
        { selector: '.faq-item p', from: '#5f655f', to: '#aeb3ac' }
      ]

      revealTextGroups.forEach(({ selector, from, to }) => {
        gsap.utils.toArray(selector).forEach((text) => {
          gsap.fromTo(text, { color: from }, {
            color: to,
            ease: 'none',
            scrollTrigger: {
              trigger: text,
              start: 'top 82%',
              end: 'top 48%',
              scrub: 0.7
            }
          })
        })
      })
      gsap.utils.toArray('.area').forEach((el, i) => gsap.from(el, { x: i % 2 ? 25 : -25, opacity: 0, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }))
      gsap.utils.toArray('.feature-card').forEach((card) => gsap.fromTo(card, { y: 90, scale: .92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 55%', scrub: 1.1 } }))
    }, page)
    return () => {
      if (typeof cleanupMarquee === 'function') cleanupMarquee()
      ctx.revert()
    }
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
          <div className="hero-actions"><button className="button button-primary hero-action-button" type="button" onClick={(event) => { event.stopPropagation(); onStart() }} aria-label="Start evolving with EVOLV">Start evolving <ArrowRight size={17} /></button><button className="button button-ghost hero-action-button" type="button" onClick={(event) => { event.stopPropagation(); onExplore() }} aria-label="Explore EVOLV">Explore EVOLV ↓</button></div>
        </div>
        <div className="hero-visual"><div className="hero-aura" /><div className="hero-outer-ring" aria-hidden="true" /><div className="hero-panel"><div className="panel-top"><span>YOUR PROGRESS</span><span>THIS WEEK</span></div><div className="panel-score">72<span>%</span></div><div className="progress-line"><i /></div><div className="panel-bottom"><span>+18% from last week</span><b>On track</b></div></div></div>
      </section>
      <section className="evolv-hero-marquee" aria-label="EVOLV values">
        <div className="evolv-hero-marquee-track">
          <div className="evolv-hero-marquee-content">
            <span>YOUR GOALS</span><i>•</i><span>YOUR PACE</span><i>•</i><span>YOUR LIFE</span><i>•</i><span>SMALL STEPS</span><i>•</i><span>REAL PROGRESS</span><i>•</i>
          </div>
          <div className="evolv-hero-marquee-content" aria-hidden="true">
            <span>YOUR GOALS</span><i>•</i><span>YOUR PACE</span><i>•</i><span>YOUR LIFE</span><i>•</i><span>SMALL STEPS</span><i>•</i><span>REAL PROGRESS</span><i>•</i>
          </div>
        </div>
      </section>
      <section className="story-intro story-reveal" id="story"><span className="section-label">01 — THE SHIFT</span><h2>You've always had<br /><em>somewhere to go.</em></h2><p>But ambition gets noisy. Goals sit in notes. Plans disappear into busy weeks. You start again. EVOLV is built to make the invisible part of growth visible.</p></section>
      <section className="story-statement story-reveal"><div className="statement-number">02</div><div><span className="section-label">MAKE IT VISIBLE</span><h2>Growth shouldn't live<br />inside your head.</h2><p>Give your goals a place to exist. See the days you showed up. Understand your momentum. Then keep going.</p></div></section>
      <section className="features-story story-reveal" id="features">
        <div className="section-heading"><span className="section-label">03 — THE SYSTEM</span></div>
        <div className="feature-steps">{[['01','DEFINE','Decide what matters in this season of your life.'],['02','BUILD','Turn intention into goals you can actually act on.'],['03','TRACK','See your momentum, progress and patterns over time.'],['04','EVOLVE','Reflect, adjust and keep becoming your next self.']].map(([num,title,text]) => <article className="feature-step feature-card" key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={17} /></article>)}</div>
      </section>
      <section className="experience story-reveal">
        <div className="preview-copy"><span className="section-label">04 — YOUR SPACE</span><h2>A dashboard built around <em>your becoming.</em></h2><p>Once you enter EVOLV, everything becomes personal — your goals, your growth areas, your momentum and the story you're building day by day.</p><button className="button button-primary" onClick={onStart}>Create your space <ArrowRight size={16} /></button></div>
        <div className="mock-dashboard"><div className="mock-header"><span>EVOLV / OVERVIEW</span><span>YOUR PROGRESS</span></div><div className="mock-main"><div className="mock-ring"><strong>72</strong><small>%</small><span>this week</span></div><div className="mock-tasks"><div><small>CURRENT FOCUS</small><b>Build with intention.</b></div><div className="task"><i /> Learn something new <span>IN PROGRESS</span></div><div className="task"><i /> Show up today <span>ACTIVE</span></div><div className="task"><i /> Review the week <span>FRI</span></div></div></div></div>
      </section>
      <section className="areas story-reveal" id="areas"><div className="section-heading"><span className="section-label">05 — YOUR WORLD</span></div><div className="area-grid">{growthAreas.map((a,i)=><article className="area" key={a.id} onClick={() => onArticle('area', a.id)} role="button" tabIndex="0"><span>0{i+1}</span><div><h3>{a.title}</h3><p>{a.text}</p></div><ArrowRight size={18}/></article>)}</div></section>
      <section className="manifesto story-reveal"><span className="section-label">06 — KEEP GOING</span><h2>You don't need to become<br /><em>someone else.</em></h2><p>You need a place to become more of who you're capable of being.</p></section>
      <section className="faq story-reveal" id="faq"><div className="faq-head"><span className="section-label">07 — QUESTIONS</span><h2>Before you<br /><em>begin.</em></h2></div><div className="faq-list">{[['What exactly is EVOLV?','A personal growth tracker for turning goals and intentions into visible progress.'],['What can I track?','Career, skills, money, health, lifestyle, creative work and other areas that matter to you.'],['Does my progress stay saved?','Yes. Your account is designed to keep your goals and progress connected to you across sessions.'],['Can I change my goals later?','Absolutely. Growth changes with you, so your goals should be able to change too.'],['Is EVOLV a habit tracker?','It can support habits, but the bigger idea is your overall growth — goals, momentum, reflection and progress.']].map(([q,a]) => <details className="faq-item" key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
      <section className="evolv-scroll-marquee" aria-label="EVOLV principles">
        <div className="evolv-scroll-marquee-viewport">
          <div className="evolv-scroll-marquee-track">
            <div className="evolv-scroll-marquee-content">
              <span>DEFINE WHAT MATTERS</span><i>✦</i><span>BUILD WITH INTENTION</span><i>✦</i><span>TRACK YOUR MOMENTUM</span><i>✦</i><span>REFLECT &amp; EVOLVE</span><i>✦</i>
            </div>
            <div className="evolv-scroll-marquee-content" aria-hidden="true">
              <span>DEFINE WHAT MATTERS</span><i>✦</i><span>BUILD WITH INTENTION</span><i>✦</i><span>TRACK YOUR MOMENTUM</span><i>✦</i><span>REFLECT &amp; EVOLVE</span><i>✦</i>
            </div>
          </div>
        </div>
      </section>
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
  const isMood = article?.type === 'mood'
  const isHealthReading = isMood || ['health','nutrition'].includes(article?.areaId)
  const area = growthAreas.find(a => a.id === article?.areaId)
  const title = isFeatures ? 'The system behind your becoming.' : isMood ? 'When your mood feels heavy.' : article?.areaId === 'health' ? 'Your health, understood.' : article?.areaId === 'nutrition' ? 'Your food, understood.' : area?.title || 'Growth areas'
  const eyebrow = isFeatures ? '03 — THE SYSTEM' : isMood ? 'YOUR HEALTH / MOOD' : article?.areaId === 'health' ? 'YOUR HEALTH / THE BASICS' : article?.areaId === 'nutrition' ? 'YOUR HEALTH / NUTRITION' : `05 — YOUR WORLD / ${area?.title?.toUpperCase() || 'GROWTH AREAS'}`

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

  const healthLibrary = {
    health: {
      intro: 'Your health is not one number. It is a collection of everyday signals — sleep, movement, energy, stress and the routines that help you feel more like yourself.',
      sections: [
        ['START WITH THE BASICS', 'You do not need to rebuild your entire routine at once. Sleep, regular meals, movement, hydration and time to recover are practical places to begin noticing what your body and mind need.'],
        ['LOOK FOR PATTERNS', 'One day rarely tells the whole story. A few weeks of simple logs can make routines easier to see: when you sleep better, when your energy changes, or when movement becomes more consistent.'],
        ['MAKE THE NEXT STEP SMALL', 'Choose one action that fits your actual day. A short walk, a regular meal, a little more water or protecting your bedtime can be more useful than an unrealistic plan you cannot maintain.']
      ],
      resources: [
        { title: 'Self-care for health and well-being', source: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/self-care-health-interventions', text: 'An overview of everyday self-care and healthy lifestyle choices.' },
        { title: 'Caring for Your Mental Health', source: 'National Institute of Mental Health', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health', text: 'Practical guidance on sleep, movement, connection, stress and getting support.' },
        { title: 'Taking Care of Your Body', source: 'CDC', url: 'https://cdc.gov/howrightnow/taking-care/index.html', text: 'Accessible guidance on sleep, nutrition and physical activity.' }
      ]
    },
    nutrition: {
      intro: 'Food is part of your everyday life. A useful food log should help you understand your routine, not make you feel like every meal needs a score.',
      sections: [
        ['BALANCE, NOT PERFECTION', 'Healthy eating can look different across cultures, budgets and lifestyles. WHO describes healthy diets through principles such as adequacy, balance, moderation and diversity rather than one perfect menu.'],
        ['NOTICE YOUR ROUTINE', 'Logging what you actually eat can help you see whether meals are regular, where variety is missing, or when you tend to skip food. You do not have to count every calorie to learn something useful.'],
        ['MAKE IT PRACTICAL', 'Think about what is available to you. A balanced meal can be built from familiar foods, including staples, beans and other legumes, vegetables or fruit, and protein sources such as eggs, fish or meat.']
      ],
      resources: [
        { title: 'Healthy diet', source: 'World Health Organization', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet', text: 'Current WHO guidance on adequacy, balance, moderation and diversity.' },
        { title: 'What are healthy diets?', source: 'WHO & FAO', url: 'https://www.who.int/publications/i/item/9789240101876', text: 'A detailed joint explanation of healthy diet principles and cultural context.' },
        { title: 'Improve Your Emotional Well-Being', source: 'CDC', url: 'https://www.cdc.gov/emotional-well-being/improve-your-emotional-well-being/index.html', text: 'Guidance connecting regular meals, physical activity, sleep and emotional wellbeing.' }
      ]
    }
  }

  const moodContent = {
    intro: 'A low day does not need to become a verdict about your life. Your mood is something you can notice, understand and respond to — gently, one small step at a time.',
    sections: [
      ['NOTICE WITHOUT JUDGING', 'You do not have to force yourself to feel positive. Start by naming what is actually there: low, stressed, tired, okay, joyful, disconnected or something else. Naming a feeling can make it easier to decide what you need next.'],
      ['LOOK FOR THE CONTEXT', 'Sleep, food, movement, stress, relationships, money, work and your surroundings can all be useful pieces of context. Evolv is not trying to diagnose the reason you feel a certain way; it helps you notice patterns in your own life when there is enough information.'],
      ['CHOOSE ONE SMALL RESPONSE', 'When everything feels like too much, shrink the next step. Drink some water. Eat something. Step outside. Take a short walk. Message someone you trust. Rest. Do one useful thing, then let that be enough for now. Small actions can be a way back into your day, not a test you have to pass.'],
      ['YOU DO NOT HAVE TO DO THIS ALONE', 'If low mood keeps affecting your everyday life, lasts for a couple of weeks, gets worse, or you are struggling to cope, talking with a healthcare professional or someone you trust can be an important next step.']
    ],
    resources: [
      { title: 'Caring for your mental health', source: 'National Institute of Mental Health', url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health', text: 'Practical guidance on self-care, sleep, movement, connection and when to seek professional help.' },
      { title: 'Low mood, sadness and depression', source: 'NHS', url: 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/low-mood-sadness-depression/', text: 'A clear guide to low mood, small steps that may help, and when extra support may be needed.' },
      { title: 'Sadness & depression', source: 'CDC', url: 'https://www.cdc.gov/emotional-well-being/managing-difficult-emotions/sadness-depression.html', text: 'Simple ideas for caring for yourself, noticing emotions and staying connected.' }
    ]
  }

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
    : isMood
      ? moodContent
      : isHealthReading && healthLibrary[article?.areaId]
        ? healthLibrary[article?.areaId]
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
        <button className="article-back" onClick={onBack}><ChevronLeft size={16}/> Back to EVOLV</button>
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
            : isMood
              ? 'You are allowed to have a difficult day without turning it into a difficult life. Start with what is true today, then look for one kind thing you can do next.'
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
          <span className="section-label">{isMood ? 'A SMALL RESET' : 'REAL LIFE'}</span>
          <h2>{isFeatures
            ? 'From “I should” to “I did.”'
            : isMood
              ? 'You do not have to fix everything tonight.'
              : `What this could look like in ${area?.title?.toLowerCase() || 'your life'}.`}
          </h2>
          <p>{isFeatures
            ? 'You open your notes and see “learn backend.” Three months later, nothing has changed. With a visible system, that idea can become: finish one lesson tonight → build a small API this weekend → connect a database next week → publish the project → look for the next opportunity. The goal did not change. Your relationship with it did.'
            : isMood
              ? 'Try a smaller question: “What would make the next hour a little kinder?” Maybe it is a meal, a shower, fresh air, music, prayer or a conversation with someone safe. You do not need to solve your whole future before you are allowed to feel a little better.'
              : `The difference is often surprisingly small. Instead of keeping “I want to improve my ${area?.title?.toLowerCase() || 'life'}” as a thought, choose one thing you can do this week, record it, and return to it. Over time, those small pieces become evidence that your life is actually changing.`}
          </p>
        </section>
        {isHealthReading&&<section className="article-resources article-block">
          <div className="article-resource-head"><div><span className="section-label">GO DEEPER</span><h2>Good places to keep reading.</h2><p>These are trusted health resources. They are here to help you learn, not to label you.</p></div></div>
          <div className="article-resource-grid">{(isMood?moodContent.resources:healthLibrary[article?.areaId]?.resources||[]).map(resource=><a className="article-resource-card" href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>
            <div><span>{resource.source}</span><h3>{resource.title}</h3><p>{resource.text}</p></div><ExternalLink size={17}/></a>)}</div>
        </section>}

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
        <div className="onboard-stage">
          {step > 0 && (
            <div className="onboard-back-row">
              <button className="back-button" onClick={back} aria-label={`Go back to step ${step}`}>
                <span className="back-icon"><ChevronLeft size={14} /></span>
                <span className="back-label">Back</span>
              </button>
              <span className="back-context">{current.label}</span>
            </div>
          )}
          <div className={`onboard-step ${current.type === 'areas' ? 'wide' : ''} ${current.type === 'intro' || current.type === 'ready' ? 'onboard-landing-step' : ''}`}>
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

function Dashboard({ data, onLogout, onArticle }) {
  const [active,setActive]=useState('overview')
  const [logOpen,setLogOpen]=useState(false)
  const [area,setArea]=useState(null)
  const [metric,setMetric]=useState(null)
  const [defs,setDefs]=useState([])
  const [logs,setLogs]=useState([])
  const [meals,setMeals]=useState([])
  const [goals,setGoals]=useState([])
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [goalTitle,setGoalTitle]=useState('')
  const [goalDescription,setGoalDescription]=useState('')
  const [profileName,setProfileName]=useState(data.name||'')
  const [profileMessage,setProfileMessage]=useState('')
  const [notificationsEnabled,setNotificationsEnabled]=useState(()=>localStorage.getItem('evolv-notifications-enabled')==='true')
  const defaultNotificationTimes={morning:true,hydration:true,reflection:true,morningTime:'08:00',hydrationTime:'13:00',reflectionTime:'22:30',quietHours:true,quietStart:'23:00',quietEnd:'07:00'}
  const [notificationTimes,setNotificationTimes]=useState(()=>{try{return {...defaultNotificationTimes,...JSON.parse(localStorage.getItem('evolv-notification-times')||'{}')}}catch{return defaultNotificationTimes}})
  const [reflectionTime,setReflectionTime]=useState(()=>localStorage.getItem('evolv-reflection-time')||'22:30')
  const [reflectionOpen,setReflectionOpen]=useState(()=>new URLSearchParams(window.location.search).get('reflection')==='1')
  const [reflectionStep,setReflectionStep]=useState(0)
  const [reflectionMood,setReflectionMood]=useState(null)
  const [reflectionFeeling,setReflectionFeeling]=useState('')
  const [reflectionNote,setReflectionNote]=useState('')
  const [reflectionSaving,setReflectionSaving]=useState(false)
  const [avatarUrl,setAvatarUrl]=useState('')
  const [avatarUploading,setAvatarUploading]=useState(false)
  const avatarInputRef=useRef(null)
  const [deleteOpen,setDeleteOpen]=useState(false)
  const [deleting,setDeleting]=useState(false)
  const [error,setError]=useState('')
  const [progressRange,setProgressRange]=useState(7)
  const [progressMetric,setProgressMetric]=useState(null)
  const dashboardMainRef=useRef(null)
  const bottomNavRef=useRef(null)
  const goTo=(page)=>{setActive(page);setArea(null);setMetric(null);window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}))}

  useEffect(()=>{
    const nav=bottomNavRef.current
    if(!nav) return
    // All tabs now use the same quiet glass active state as Profile.
  },[active,avatarUrl])

  const areas={
    health:{title:'Health',icon:HeartPulse,color:'#ff8f87'},
    nutrition:{title:'Nutrition',icon:Apple,color:'#ffd66b'},
    money:{title:'Money',icon:WalletCards,color:'#62e6bd'},
    career:{title:'Career',icon:BriefcaseBusiness,color:'#63d9ff'},
    mind:{title:'Mind',icon:Brain,color:'#9b7cff'},
    life:{title:'Life',icon:Sprout,color:'#62e6bd'}
  }
  const metricArea={sleep:'health',water:'health',steps:'health',exercise:'health',energy:'health',weight:'health',mood:'mind',focus:'mind',reflection:'mind',stress:'mind',learning:'career',building:'career',outreach:'career',applications:'career',skills:'career',income:'money',spending:'money',savings:'money',bills:'money',habits:'life',reading:'life',social:'life',personal:'life',meals:'nutrition'}
  const icons={sleep:Moon,water:Droplets,steps:Footprints,exercise:Dumbbell,energy:Zap,weight:Scale,mood:Smile,focus:Focus,reflection:NotebookPen,stress:Brain,learning:BookOpen,building:BriefcaseBusiness,outreach:Send,applications:Receipt,skills:Sparkles,income:ArrowDownLeft,spending:ArrowUpRight,savings:PiggyBank,bills:Receipt,habits:CheckCircle2,reading:BookOpen,social:Users,personal:Sprout,meals:Utensils}
  const name=profile?.first_name||data.name||'there'
  const latest=defs.reduce((acc,d)=>{const x=logs.find(l=>l.metric_id===d.id);if(x)acc[d.slug]=x;return acc},{})
  const today=new Date().toISOString().slice(0,10)
  const todayLogs=logs.filter(x=>x.logged_at?.slice(0,10)===today)
  const todayMeals=meals.filter(x=>x.logged_at?.slice(0,10)===today)

  useEffect(()=>{let mounted=true;async function load(){setLoading(true);const {data:a}=await supabase.auth.getUser();const u=a?.user;if(!u){await onLogout();return}
    const [p,d,l,m,g]=await Promise.all([
      supabase.from('profiles').select('first_name,growth_areas,focus,first_goal').eq('id',u.id).maybeSingle(),
      supabase.from('metric_definitions').select('id,slug,name,area,unit,value_type,icon,color').eq('is_active',true).order('area').order('name'),
      supabase.from('metric_logs').select('id,metric_id,value,unit,note,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(500),
      supabase.from('meal_logs').select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(200),
      supabase.from('goals').select('id,title,description,status,progress,due_date,created_at,updated_at').order('created_at',{ascending:false})
    ]);if(!mounted)return;if(p.data){setProfile({...p.data,email:u.email||''});setProfileName(p.data.first_name||'')}setAvatarUrl(u.user_metadata?.avatar_url||localStorage.getItem('evolv-avatar-'+u.id)||'');setDefs(d.data||[]);setLogs(l.data||[]);setMeals(m.data||[]);setGoals(g.data||[]);if(d.error||l.error||m.error)setError('Some tracking data could not be loaded.');setLoading(false)}load();return()=>{mounted=false}},[onLogout])

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const requested=params.get('log')
    if(!requested||!defs.length) return
    const d=defs.find(item=>item.slug===requested)
    if(d){
      openLog(metricArea[d.slug]||d.area,d)
      window.history.replaceState({},'',window.location.pathname)
    }
  },[defs])

  function valueText(log,d){if(!log)return '—';const v=Number(log.value);if(d.slug==='sleep'){const total=Math.max(0,Math.round(v*60)),h=Math.floor(total/60),m=total%60;if(h&&m)return h+'h '+m+'m';if(h)return h+'h';return m+'m'}if(d.value_type==='duration'){const total=Math.max(0,Math.round(v)),h=Math.floor(total/60),m=total%60;if(h&&m)return h+'h '+m+'m';if(h)return h+'h';return m+'m'}if(d.value_type==='scale')return v+'/5';if(d.unit==='NGN')return '₦'+v.toLocaleString();return v.toLocaleString()+(d.unit?' '+d.unit:'')}
  function openLog(a=null,m=null){setArea(a);setMetric(m);setLogOpen(true);setError('')}
  function handleLogSaved(kind,entry){
    if(kind==='meal') setMeals(current=>[entry,...current.filter(x=>x.id!==entry.id)])
    else setLogs(current=>[entry,...current.filter(x=>x.id!==entry.id)])
    setLogOpen(false)
    setMetric(null)
    setArea(null)
  }
  async function createGoal(e){e.preventDefault();if(!goalTitle.trim())return;setSaving(true);const {data:a}=await supabase.auth.getUser();const {data:g,error:x}=await supabase.from('goals').insert({user_id:a.user.id,title:goalTitle.trim(),description:goalDescription.trim()||null}).select('id,title,description,status,progress,due_date,created_at,updated_at').single();setSaving(false);if(x){setError(x.message);return}setGoals(c=>[g,...c]);setGoalTitle('');setGoalDescription('')}
  async function saveProfile(e){e.preventDefault();if(!profileName.trim())return;const {data:a}=await supabase.auth.getUser();const {data:p,error:x}=await supabase.from('profiles').update({first_name:profileName.trim(),updated_at:new Date().toISOString()}).eq('id',a.user.id).select('first_name,growth_areas,focus,first_goal').single();if(x){setProfileMessage('Could not save your profile.');return}setProfile({...p,email:a.user.email||''});setProfileMessage('Profile saved.')}
  async function syncPushSettings(payload){
    try{
      const {error:pushError}=await supabase.functions.invoke('save-push-subscription',{body:payload})
      if(pushError) throw pushError
      return true
    }catch(pushError){
      console.error('EVOLV push sync failed:',pushError)
      return false
    }
  }

  function persistNotificationTimes(next){
    setNotificationTimes(next)
    localStorage.setItem('evolv-notification-times',JSON.stringify(next))
  }

  async function syncCurrentPushSettings(nextOverrides={}){
    const next={...notificationTimes,...nextOverrides}
    if(next.reflectionTime) setReflectionTime(next.reflectionTime)
    persistNotificationTimes(next)
    if(!notificationsEnabled) return true
    const registration=await navigator.serviceWorker.ready
    const subscription=await registration.pushManager.getSubscription()
    if(!subscription) return false
    const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Lagos'
    return syncPushSettings({
      subscription:subscription.toJSON(),
      timezone,
      preferences:next,
      reflectionTime:next.reflectionTime||reflectionTime,
      enabled:true
    })
  }

  function urlBase64ToUint8Array(base64String){
    const padding='='.repeat((4-base64String.length%4)%4)
    const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/')
    const raw=window.atob(base64)
    return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))
  }

  async function toggleNotifications(){
    if(notificationsEnabled){
      setNotificationsEnabled(false)
      localStorage.setItem('evolv-notifications-enabled','false')
      await syncPushSettings({enabled:false})
      setProfileMessage('Daily notifications turned off.')
      return
    }

    if(!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)){
      setProfileMessage('Push notifications are not supported in this browser.')
      return
    }

    let vapidPublicKey=import.meta.env.VITE_VAPID_PUBLIC_KEY

    try{
      if(!vapidPublicKey){
        const {data:pushConfig,error:configError}=await supabase.functions.invoke('save-push-subscription',{body:{action:'config'}})
        if(configError) throw configError
        vapidPublicKey=pushConfig?.vapidPublicKey
      }

      if(!vapidPublicKey){
        setProfileMessage('Push notifications are not configured on EVOLV yet. Please try again after the push setup is completed.')
        return
      }

      const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission()
      if(permission!=='granted'){
        setProfileMessage('Allow notifications in your browser settings to turn this on.')
        return
      }

      const registration=await navigator.serviceWorker.ready
      let subscription=await registration.pushManager.getSubscription()

      if(!subscription){
        subscription=await registration.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(vapidPublicKey)
        })
      }

      const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Lagos'
      const saved=await syncPushSettings({
        subscription:subscription.toJSON(),
        timezone,
        preferences:notificationTimes,
        reflectionTime,
        enabled:true
      })

      if(!saved){
        setProfileMessage('Your browser allowed notifications, but EVOLV could not save the push subscription yet.')
        return
      }

      setNotificationsEnabled(true)
      localStorage.setItem('evolv-notifications-enabled','true')
      setProfileMessage('Notifications enabled. EVOLV can now reach you even when the app is closed.')
    }catch(pushError){
      console.error('EVOLV push subscription failed:',pushError)
      setProfileMessage(pushError?.message||'EVOLV could not enable push notifications. Please try again.')
    }
  }

  async function toggleNotificationTime(key){
    const next={...notificationTimes,[key]:!notificationTimes[key]}
    persistNotificationTimes(next)
    if(notificationsEnabled){
      const synced=await syncCurrentPushSettings(next)
      if(!synced) setProfileMessage('Saved on this device. EVOLV could not sync the reminder settings yet.')
    }
  }

  async function saveNotificationTime(key,event){
    const value=event.currentTarget.value
    if(!value) return
    const next={...notificationTimes,[key]:value}
    if(key==='reflectionTime'){
      setReflectionTime(value)
      localStorage.setItem('evolv-reflection-time',value)
    }
    persistNotificationTimes(next)
    if(!notificationsEnabled){
      setProfileMessage('Turn notifications on to schedule your daily reminders.')
      return
    }
    try{
      const synced=await syncCurrentPushSettings(next)
      setProfileMessage(synced?'Reminder time saved.':'EVOLV could not sync that reminder time. Please try again.')
    }catch{
      setProfileMessage('EVOLV could not sync that reminder time. Please try again.')
    }
  }

  async function toggleQuietHours(){
    const next={...notificationTimes,quietHours:!notificationTimes.quietHours}
    persistNotificationTimes(next)
    if(notificationsEnabled) await syncCurrentPushSettings(next)
  }

  async function saveQuietHour(key,event){
    const value=event.currentTarget.value
    const next={...notificationTimes,[key]:value}
    persistNotificationTimes(next)
    if(notificationsEnabled) await syncCurrentPushSettings(next)
  }

  function openReflection(){
    setReflectionStep(0)
    setReflectionMood(null)
    setReflectionFeeling('')
    setReflectionNote('')
    setReflectionOpen(true)
    window.history.replaceState({},'',window.location.pathname)
  }

  function closeReflection(){
    setReflectionOpen(false)
    setReflectionStep(0)
    if(new URLSearchParams(window.location.search).get('reflection')){
      window.history.replaceState({},'',window.location.pathname)
    }
  }

  async function saveReflection(){
    setReflectionSaving(true)
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u){setReflectionSaving(false);return}
    const reflectionDate=new Date().toLocaleDateString('en-CA')
    const {error:reflectionError}=await supabase.from('daily_reflections').upsert({
      user_id:u.id,
      reflection_date:reflectionDate,
      mood:reflectionMood,
      day_feeling:reflectionFeeling||null,
      note:reflectionNote.trim()||null,
      updated_at:new Date().toISOString()
    },{onConflict:'user_id,reflection_date'})
    setReflectionSaving(false)
    if(reflectionError){
      setProfileMessage('Your reflection could not be saved. Please try again.')
      return
    }
    closeReflection()
    setProfileMessage('Reflection saved. You showed up for yourself today.')
  }
  async function handleAvatarChange(event){
    const file=event.target.files?.[0]
    if(!file)return
    if(!file.type.startsWith('image/')){setProfileMessage('Please choose an image file.');return}
    if(file.size>8*1024*1024){setProfileMessage('Choose an image smaller than 8 MB.');return}
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    setAvatarUploading(true);setProfileMessage('')
    try{
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'
      const path=u.id+'/avatar.'+ext
      const upload=await supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'})
      if(!upload.error){
        const {data:publicData}=supabase.storage.from('avatars').getPublicUrl(path)
        const url=publicData.publicUrl+'?v='+Date.now()
        await supabase.auth.updateUser({data:{avatar_url:url}})
        setAvatarUrl(url)
        localStorage.setItem('evolv-avatar-'+u.id,url)
        setProfileMessage('Profile photo updated.')
      }else{
        const reader=new FileReader()
        reader.onload=async()=>{const url=String(reader.result||'');setAvatarUrl(url);localStorage.setItem('evolv-avatar-'+u.id,url);setProfileMessage('Profile photo updated on this device.')}
        reader.readAsDataURL(file)
      }
    }catch{
      setProfileMessage('Could not update your profile photo.')
    }finally{
      setAvatarUploading(false)
      if(avatarInputRef.current)avatarInputRef.current.value=''
    }
  }
  async function removeAvatar(){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    setAvatarUploading(true)
    try{await supabase.auth.updateUser({data:{avatar_url:null}})}catch{}
    localStorage.removeItem('evolv-avatar-'+u.id)
    setAvatarUrl('')
    setProfileMessage('Profile photo removed.')
    setAvatarUploading(false)
  }
  async function deleteAccount(){setDeleting(true);const {data:s}=await supabase.auth.getSession();const r=await fetch(import.meta.env.VITE_SUPABASE_URL+'/functions/v1/delete-account',{method:'POST',headers:{Authorization:'Bearer '+s.session.access_token,apikey:import.meta.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'}});if(!r.ok){setDeleting(false);return}await supabase.auth.signOut();window.location.href='/'}

  return <div className={`page-enter dashboard ${active==='ai'?'dashboard-ai-active':''}`}>
    <header className="app-topbar"><button className="app-logo-button" onClick={()=>goTo('overview')} aria-label="Go to home"><Brand/></button><button className="notification-button" onClick={()=>goTo('ai')} aria-label="Open Evolv AI" title="Talk to Evolv"><MessageCircle size={17}/></button></header>
    <main className="dash-main">
      {error&&<p className="auth-error" role="alert">{error}</p>}
      {active==='overview'&&<div className="dashboard-home">
        <section className="dashboard-welcome"><div className="dashboard-welcome-copy"><span className="dashboard-eyebrow">Welcome back,</span><h1>{name}.</h1></div></section>
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
      </div>}
      {active==='area'&&(()=>{
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
      })()}
      {active==='progress'&&(()=>{
        const now=new Date()
        const periodStart=new Date(now)
        periodStart.setHours(0,0,0,0)
        periodStart.setDate(periodStart.getDate()-(progressRange-1))
        const previousStart=new Date(periodStart)
        previousStart.setDate(previousStart.getDate()-progressRange)
        const previousEnd=new Date(periodStart)
        previousEnd.setMilliseconds(-1)

        const metricById=Object.fromEntries(defs.map(d=>[d.id,d]))
        const periodLogs=logs.filter(l=>new Date(l.logged_at)>=periodStart&&new Date(l.logged_at)<=now)
        const previousLogs=logs.filter(l=>new Date(l.logged_at)>=previousStart&&new Date(l.logged_at)<=previousEnd)
        const periodMeals=meals.filter(m=>new Date(m.logged_at)>=periodStart&&new Date(m.logged_at)<=now)
        const previousMeals=meals.filter(m=>new Date(m.logged_at)>=previousStart&&new Date(m.logged_at)<=previousEnd)
        const activeGoals=goals.filter(g=>g.status==='active')
        const completedGoals=goals.filter(g=>g.status==='completed')
        const goalProgress=activeGoals.length?Math.round(activeGoals.reduce((sum,g)=>sum+Math.min(100,Math.max(0,Number(g.progress)||0)),0)/activeGoals.length):0

        const activeDaySet=new Set([...periodLogs.map(l=>new Date(l.logged_at).toISOString().slice(0,10)),...periodMeals.map(m=>new Date(m.logged_at).toISOString().slice(0,10))])
        const previousDaySet=new Set([...previousLogs.map(l=>new Date(l.logged_at).toISOString().slice(0,10)),...previousMeals.map(m=>new Date(m.logged_at).toISOString().slice(0,10))])
        const thingsLogged=periodLogs.length+periodMeals.length
        const previousCount=previousLogs.length+previousMeals.length
        const activeDays=activeDaySet.size
        const activityChange=thingsLogged-previousCount

        const sumSlugs=new Set(['exercise','learning','building','outreach','applications','skills','income','spending','savings','bills','habits','reading','social','personal','reflection','focus'])
        const directionFor=d=>sumSlugs.has(d.slug)?'sum':'average'
        const aggregate=(items,d)=>{
          const values=items.filter(l=>l.metric_id===d.id).map(l=>Number(l.value)).filter(Number.isFinite)
          if(!values.length)return null
          return directionFor(d)==='sum'?values.reduce((a,b)=>a+b,0):values.reduce((a,b)=>a+b,0)/values.length
        }

        const candidates=defs.filter(d=>periodLogs.some(l=>l.metric_id===d.id))
        const selected=metricById[progressMetric]&&candidates.some(d=>d.slug===progressMetric)?metricById[progressMetric]:candidates[0]
        const currentValue=selected?aggregate(periodLogs,selected):null
        const previousValue=selected?aggregate(previousLogs,selected):null
        const delta=currentValue!=null&&previousValue!=null?currentValue-previousValue:null
        const percent=delta!=null&&previousValue!==0?(delta/Math.abs(previousValue))*100:null

        const displayMetric=(value,d)=>{
          if(value==null)return '—'
          if(d.slug==='sleep'){
            const totalMinutes=Math.max(0,Math.round(Number(value)*60))
            const h=Math.floor(totalMinutes/60),m=totalMinutes%60
            if(h&&m)return h+'h '+m+'m'
            if(h)return h+'h'
            return m+'m'
          }
          if(d.value_type==='duration'){
            const total=Math.max(0,Math.round(value)),h=Math.floor(total/60),m=total%60
            if(h&&m)return h+'h '+m+'m'
            if(h)return h+'h'
            return m+'m'
          }
          if(d.value_type==='scale')return value.toFixed(1)+'/5'
          if(d.unit==='NGN')return '₦'+Math.round(value).toLocaleString()
          return Number.isInteger(value)?value.toLocaleString():value.toFixed(1)+(d.unit?' '+d.unit:'')
        }

        const daily=Array.from({length:Math.min(progressRange,30)},(_,i)=>{
          const day=new Date(periodStart)
          day.setDate(periodStart.getDate()+i)
          const next=new Date(day)
          next.setDate(day.getDate()+1)
          const dayLogs=periodLogs.filter(l=>new Date(l.logged_at)>=day&&new Date(l.logged_at)<next)
          const dayMeals=periodMeals.filter(m=>new Date(m.logged_at)>=day&&new Date(m.logged_at)<next)
          return {
            key:day.toISOString().slice(0,10),
            label:day.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3),
            date:day.getDate(),
            count:dayLogs.length+dayMeals.length,
            value:selected?aggregate(dayLogs,selected):null
          }
        })

        const maxCount=Math.max(1,...daily.map(d=>d.count))
        const chartWidth=760
        const chartHeight=190
        const points=daily.map((d,i)=>{
          const x=daily.length===1?chartWidth/2:24+(i*(chartWidth-48)/(daily.length-1))
          const y=24+((maxCount-d.count)/maxCount)*(chartHeight-48)
          return {...d,x,y}
        })
        const path=points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

        const recentActivity=[
          ...periodLogs.map(entry=>({type:'log',date:new Date(entry.logged_at),entry})),
          ...periodMeals.map(entry=>({type:'meal',date:new Date(entry.logged_at),entry}))
        ].sort((a,b)=>b.date-a.date).slice(0,8)

        const trendStatement=selected&&delta!=null
          ? `${selected.name} is ${delta===0?'unchanged':delta>0?'up':'down'} ${delta===0?'from the previous period':displayMetric(Math.abs(delta),selected)+' compared with the previous period'}.`
          : 'Log the same metric more than once to see a real comparison here.'

        return <section className="panel-page dashboard-panel progress-page">
          <div className="progress-heading">
            <span className="section-label">PROGRESS</span>
            <h2>Your progress.</h2>
            <p>A clear view of your goals, activity and the things you are actually tracking.</p>
          </div>

          <div className="progress-range-switch" role="tablist" aria-label="Progress time range">
            {[7,30,90].map(days=><button key={days} className={progressRange===days?'active':''} onClick={()=>setProgressRange(days)}>{days}D</button>)}
          </div>

          <div className="progress-overview-grid">
            <article className="progress-overview-card progress-overview-primary">
              <span className="section-label">GOAL PROGRESS</span>
              <strong>{activeGoals.length?goalProgress+'%':'—'}</strong>
              <p>{activeGoals.length?'Average across your active goals.':'Create a goal to start measuring direction.'}</p>
            </article>
            <article className="progress-overview-card">
              <span className="section-label">ENTRIES</span>
              <strong>{thingsLogged}</strong>
              <p>Logs recorded in the last {progressRange} days.</p>
            </article>
            <article className="progress-overview-card">
              <span className="section-label">ACTIVE DAYS</span>
              <strong>{activeDays}<small> / {progressRange}</small></strong>
              <p>Days with at least one recorded entry.</p>
            </article>
          </div>

          <section className="progress-section-card progress-goals-card">
            <div className="progress-section-head">
              <div><span className="section-label">YOUR GOALS</span><h3>Where you are going.</h3></div>
              <button type="button" onClick={()=>goTo('goals')}>Manage goals <ArrowRight size={14}/></button>
            </div>

            {activeGoals.length ? (
              <div className="progress-goal-list">
                {activeGoals.slice(0,5).map(goal=>{
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
                <div><strong>No active goals yet.</strong><p>Your goals give Progress something concrete to measure.</p></div>
                <button type="button" className="button button-primary" onClick={()=>goTo('goals')}><Plus size={15}/> Add goal</button>
              </div>
            )}

            {completedGoals.length>0&&<p className="progress-completed-note">{completedGoals.length} goal{completedGoals.length===1?'':'s'} completed. Keep building from there.</p>}
          </section>

          <section className="progress-section-card progress-activity-card">
            <div className="progress-section-head">
              <div><span className="section-label">ACTIVITY</span><h3>How consistently are you logging?</h3></div>
              <span>{activityChange===0?'No change':activityChange>0?'+'+activityChange:activityChange} vs previous {progressRange}D</span>
            </div>

            <div className="progress-activity-summary">
              <div><strong>{thingsLogged}</strong><span>Total entries</span></div>
              <div><strong>{activeDays}</strong><span>Active days</span></div>
              <div><strong>{candidates.length}</strong><span>Metrics tracked</span></div>
            </div>

            <div className="progress-activity-chart" aria-label="Daily entries for this period">
              {daily.map(day=><div className="progress-activity-day" key={day.key}>
                <div className="progress-activity-bar"><i style={{height:Math.max(day.count?10:2,(day.count/maxCount)*100)+'%'}}/></div>
                <b>{day.label}</b>
                <small>{day.date}</small>
                <span>{day.count}</span>
              </div>)}
            </div>
          </section>

          {selected ? (
            <section className="progress-section-card progress-trend-card">
              <div className="progress-section-head">
                <div><span className="section-label">MEASURED TREND</span><h3>{selected.name}</h3></div>
                <span>{directionFor(selected)==='sum'?'Total':'Average'}</span>
              </div>

              <div className="progress-metric-picker">
                {candidates.slice(0,10).map(d=><button key={d.id} className={selected.id===d.id?'active':''} onClick={()=>setProgressMetric(d.slug)}>{d.name}</button>)}
              </div>

              <div className="progress-period-summary">
                <div><span>Current period</span><strong>{displayMetric(currentValue,selected)}</strong></div>
                <div><span>Previous period</span><strong>{displayMetric(previousValue,selected)}</strong></div>
                <div><span>Change</span><strong className={delta==null?'neutral':delta>0?'up':delta<0?'down':'neutral'}>{delta==null?'—':delta===0?'No change':(delta>0?'↑ ':'↓ ')+displayMetric(Math.abs(delta),selected)}</strong>{percent!=null&&<small>{percent>0?'+':''}{percent.toFixed(0)}%</small>}</div>
              </div>

              <div className="progress-chart-card">
                <div className="progress-chart-top"><div><span className="section-label">ENTRY FREQUENCY</span><p>How often you recorded something during this period.</p></div><span>{progressRange} days</span></div>
                <div className="progress-line-chart">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label={`Daily entries over ${progressRange} days`}>
                    <path d={path} fill="none" stroke="rgba(200,243,106,.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {points.filter((_,i)=>progressRange<=7||i===0||i===points.length-1||i%Math.max(1,Math.floor(points.length/6))===0).map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill="#c8f36a"/>)}
                  </svg>
                  <div className="progress-chart-labels">{points.filter((_,i)=>progressRange<=7||i===0||i===points.length-1||i%Math.max(1,Math.floor(points.length/6))===0).map((p,i)=><span key={i}>{p.label} {p.date}</span>)}</div>
                </div>
              </div>

              <div className="progress-fact">
                <span className="section-label">WHAT THE DATA SAYS</span>
                <p>{trendStatement}</p>
              </div>
            </section>
          ) : (
            <section className="progress-section-card progress-empty-large">
              <TrendingUp size={24}/>
              <h3>Your trends start with your first few logs.</h3>
              <p>Log the things that matter to you. Evolv will compare real entries over time instead of inventing a score.</p>
              <button className="button button-primary" onClick={()=>openLog()}><Plus size={15}/> Log something</button>
            </section>
          )}

          <section className="progress-section-card progress-recent-card">
            <div className="progress-section-head">
              <div><span className="section-label">RECENT ACTIVITY</span><h3>What you recorded.</h3></div>
              <span>Last {progressRange}D</span>
            </div>

            {recentActivity.length ? (
              <div className="progress-recent-list">
                {recentActivity.map((item,index)=>{
                  const entry=item.entry
                  const def=item.type==='log'?metricById[entry.metric_id]:null
                  const shown=item.type==='meal'
                    ? (entry.meal_type||'Meal')+' · '+entry.description
                    : def?.slug==='mood'
                      ? ({1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'}[Number(entry.value)]||displayMetric(Number(entry.value),def))
                      : def?displayMetric(Number(entry.value),def):'Entry'
                  return <div className="progress-recent-row" key={entry.id||index}>
                    <span className="progress-recent-icon">{item.type==='meal'?<Utensils size={17}/>:<LineChart size={17}/>}</span>
                    <div><strong>{def?.name||'Meal'}</strong><p>{shown}</p></div>
                    <time>{item.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time>
                  </div>
                })}
              </div>
            ) : (
              <div className="progress-empty-inline"><Activity size={22}/><div><strong>No activity in this period.</strong><p>Once you log something, it will appear here.</p></div></div>
            )}
          </section>

          <div className="progress-definition">
            <span className="section-label">HOW PROGRESS WORKS</span>
            <p><strong>Goals</strong> show how far you have moved toward what you said you wanted. <strong>Activity</strong> counts real entries you record. <strong>Trends</strong> compare your actual measurements with an earlier period. Evolv does not turn your life into one arbitrary score.</p>
          </div>
        </section>
      })()}
      {active==='goals'&&<section className="panel-page dashboard-panel goals-page"><button className="area-back" onClick={()=>goTo('progress')}><ChevronLeft size={16}/> Progress</button><span className="section-label">DIRECTION</span><h2>Goals.</h2><p className="panel-intro">Choose what you want to work toward.</p><form className="goal-create-form" onSubmit={createGoal}><input value={goalTitle} onChange={e=>setGoalTitle(e.target.value)} placeholder="What would you like to work toward?" required/><textarea value={goalDescription} onChange={e=>setGoalDescription(e.target.value)} placeholder="Add a little more, if you like" rows="3"/><button className="button button-primary" disabled={saving} type="submit"><Plus size={15}/>{saving?'Saving…':'Add goal'}</button></form><div className="goal-list">{goals.map(g=><article className="goal-item" key={g.id}><div className="goal-item-top"><div><span className="goal-status-copy">{g.status==='completed'?'Completed':'In progress'}</span><h3>{g.title}</h3>{g.description&&<p>{g.description}</p>}</div><strong>{g.progress||0}%</strong></div><div className="mini-progress"><i style={{width:(g.progress||0)+'%'}}/></div></article>)}{!goals.length&&<div className="goal-empty"><Target size={22}/><p>Nothing here yet. Add your first goal above.</p></div>}</div></section>}
      {active==='profile'&&<section className="panel-page dashboard-panel settings-page">
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
</section>}
      {active==='ai'&&<EvolvAI profile={profile} goals={goals} checkins={[]} momentum={0} logs={logs} meals={meals} definitions={defs}/>} 
    </main>
    {active!=='ai'&&<nav ref={bottomNavRef} className="app-bottom-nav" aria-label="App navigation"><button className={active==='overview'?'bottom-active':''} onClick={()=>goTo('overview')}><span><Home size={19}/></span><small>Home</small></button><button className="log-nav-button" onClick={()=>openLog()}><span><Plus size={21}/></span><small>Log</small></button><button className={active==='progress'?'bottom-active':''} onClick={()=>goTo('progress')}><span><LineChart size={19}/></span><small>Progress</small></button><button className={`bottom-profile-nav-button ${active==='profile'?'bottom-active':''}`} onClick={()=>goTo('profile')}><span className="bottom-profile-icon">{avatarUrl?<img src={avatarUrl} alt="" className="bottom-profile-image"/>:<UserRound size={19}/>}</span><small>You</small></button></nav>}
    {logOpen&&<LogSheet area={area} metric={metric} definitions={defs} saving={saving} setSaving={setSaving} onArea={setArea} onMetric={setMetric} onSaved={handleLogSaved} onClose={()=>{if(!saving){setLogOpen(false);setMetric(null)}}}/>}
    {reflectionOpen&&<DailyReflectionSheet step={reflectionStep} setStep={setReflectionStep} mood={reflectionMood} setMood={setReflectionMood} feeling={reflectionFeeling} setFeeling={setReflectionFeeling} note={reflectionNote} setNote={setReflectionNote} saving={reflectionSaving} onSave={saveReflection} onClose={closeReflection}/>}
  </div>
}

function DailyReflectionSheet({step,setStep,mood,setMood,feeling,setFeeling,note,setNote,saving,onSave,onClose}){
  const moods=[{value:1,label:'Rough',emoji:'😔'},{value:2,label:'Low',emoji:'😕'},{value:3,label:'Okay',emoji:'😐'},{value:4,label:'Good',emoji:'🙂'},{value:5,label:'Great',emoji:'😊'}]
  const feelings=['Calm','Okay','Stressful','Energised','Heavy','Productive']
  return <div className="reflection-overlay" role="dialog" aria-modal="true" aria-label="Daily reflection">
    <div className="reflection-sheet">
      <div className="reflection-sheet-handle"/>
      <div className="reflection-sheet-head"><div><span className="section-label">DAILY REFLECTION</span><span className="reflection-step-label">{step+1} / 3</span></div><button type="button" className="reflection-close" onClick={onClose} aria-label="Close reflection"><X size={18}/></button></div>
      {step===0&&<div className="reflection-step"><span className="reflection-kicker">BEFORE YOU WIND DOWN</span><h2>How are you feeling tonight?</h2><p>A small pause. No right answer. Just where you are.</p><div className="reflection-mood-grid">{moods.map(item=><button type="button" key={item.value} className={mood===item.value?'selected':''} onClick={()=>setMood(item.value)}><span>{item.emoji}</span><small>{item.label}</small></button>)}</div><button className="button button-primary reflection-next" type="button" disabled={!mood} onClick={()=>setStep(1)}>Continue <ArrowRight size={16}/></button></div>}
      {step===1&&<div className="reflection-step"><span className="reflection-kicker">LOOKING BACK</span><h2>How did today feel overall?</h2><p>Pick the feeling that comes closest.</p><div className="reflection-feeling-grid">{feelings.map(item=><button type="button" key={item} className={feeling===item?'selected':''} onClick={()=>setFeeling(item)}>{item}</button>)}</div><div className="reflection-step-actions"><button type="button" className="reflection-back" onClick={()=>setStep(0)}><ChevronLeft size={15}/> Back</button><button className="button button-primary reflection-next" type="button" disabled={!feeling} onClick={()=>setStep(2)}>Continue <ArrowRight size={16}/></button></div></div>}
      {step===2&&<div className="reflection-step"><span className="reflection-kicker">A LITTLE SPACE</span><h2>Anything on your mind?</h2><p>Leave a note for yourself, or simply finish here.</p><textarea className="reflection-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Write anything you want to remember…" rows={5}/><div className="reflection-step-actions"><button type="button" className="reflection-back" onClick={()=>setStep(1)}><ChevronLeft size={15}/> Back</button><button className="button button-primary reflection-next" type="button" onClick={onSave} disabled={saving}>{saving?'Saving…':'Save reflection'} {!saving&&<Check size={16}/>}</button></div></div>}
      <div className="reflection-progress"><span className="active"/><span className={step>=1?'active':''}/><span className={step>=2?'active':''}/></div>
    </div>
  </div>
}

function SpecialMetricFields({metric,values,setValues}){
  const slug=metric?.slug
  const set=(key,value)=>setValues(v=>({...v,[key]:value}))
  const input=(label,key,type='text',placeholder='')=>(
    <label className="log-input-label">
      <span>{label}</span>
      <input type={type} value={values[key]??''} onChange={e=>set(key,e.target.value)} placeholder={placeholder}/>
    </label>
  )
  const choices=(label,key,items)=>(
    <div className="log-field-group">
      <div className="log-field-title"><span>{label}</span></div>
      <div className="special-choice-grid">
        {items.map(item=>(
          <button type="button" key={item.value} className={values[key]===item.value?'active':''} onClick={()=>set(key,item.value)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )

  if(slug==='income') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Money in.</strong><span>Record income when it actually lands.</span></div>
    {input('Amount','amount','number','0')}
    {input('Where did it come from?','source','text','e.g. Freelance client')}
    {choices('Category','category',[
      {value:'work',label:'Work'},{value:'business',label:'Business'},{value:'freelance',label:'Freelance'},
      {value:'gift',label:'Gift'},{value:'other',label:'Other'}
    ])}
  </div>

  if(slug==='spending') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Money out.</strong><span>Capture what you spent and why.</span></div>
    {input('Amount','amount','number','0')}
    {input('Merchant or reason','merchant','text','e.g. Transport')}
    {choices('Category','category',[
      {value:'food',label:'Food'},{value:'transport',label:'Transport'},{value:'shopping',label:'Shopping'},
      {value:'education',label:'Education'},{value:'subscriptions',label:'Subscriptions'},{value:'family',label:'Family'},
      {value:'other',label:'Other'}
    ])}
    {choices('Paid via','payment',[
      {value:'transfer',label:'Bank transfer'},{value:'card',label:'Card'},{value:'cash',label:'Cash'},
      {value:'mobile',label:'Mobile money'},{value:'other',label:'Other'}
    ])}
  </div>

  if(slug==='savings') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Put money aside.</strong><span>Keep a record of what you saved and what it is for.</span></div>
    {input('Amount saved','amount','number','0')}
    {input('Saving for','goal','text','e.g. New MacBook')}
  </div>

  if(slug==='bills') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Stay ahead of bills.</strong><span>Record the payment, provider and current status.</span></div>
    {input('Amount','amount','number','0')}
    {input('Bill or payment','bill','text','e.g. Internet')}
    {input('Provider','provider','text','e.g. MTN')}
    {choices('Status','status',[
      {value:'paid',label:'Paid'},{value:'due',label:'Due'},{value:'part-paid',label:'Part-paid'}
    ])}
  </div>

  if(slug==='applications') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Career application.</strong><span>Keep the opportunity, stage and next move together.</span></div>
    {input('Company or organisation','company','text','e.g. Google')}
    {input('Role','role','text','e.g. Frontend Developer')}
    {choices('Status','status',[
      {value:'saved',label:'Saved'},{value:'applied',label:'Applied'},{value:'interview',label:'Interview'},
      {value:'assessment',label:'Assessment'},{value:'offer',label:'Offer'},{value:'rejected',label:'Rejected'}
    ])}
    {input('Next step','nextStep','text','e.g. Follow up Friday')}
  </div>

  if(slug==='learning') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Learning session.</strong><span>Capture what you worked on, how long you spent and what stayed with you.</span></div>
    {input('What did you learn?','topic','text','e.g. Express middleware')}
    {input('Minutes','minutes','number','0')}
    {input('Key takeaway','learned','text','What did you understand better?')}
  </div>

  if(slug==='building') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Build something.</strong><span>Record the project work that moves your ideas forward.</span></div>
    {input('Project','project','text','e.g. Evolv')}
    {input('Minutes spent','minutes','number','0')}
    {input('Milestone','milestone','text','e.g. Finished logging flow')}
  </div>

  if(slug==='outreach') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Make the connection.</strong><span>Track who you reached out to and what happened next.</span></div>
    {input('Who did you contact?','person','text','e.g. Potential client')}
    {choices('Platform','platform',[
      {value:'instagram',label:'Instagram'},{value:'linkedin',label:'LinkedIn'},{value:'email',label:'Email'},
      {value:'whatsapp',label:'WhatsApp'},{value:'other',label:'Other'}
    ])}
    {choices('Outcome','outcome',[
      {value:'sent',label:'Sent'},{value:'replied',label:'Replied'},{value:'call',label:'Call booked'},
      {value:'interested',label:'Interested'},{value:'no-response',label:'No response'}
    ])}
  </div>

  if(slug==='skills') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Skill check-in.</strong><span>Record the skill you are developing and how confident you feel today.</span></div>
    {input('Skill','skill','text','e.g. React')}
    {choices('Confidence','confidence',[
      {value:1,label:'New'},{value:2,label:'Learning'},{value:3,label:'Getting there'},
      {value:4,label:'Confident'},{value:5,label:'Strong'}
    ])}
  </div>

  if(slug==='habits') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Habit check-in.</strong><span>Keep it simple: done, partly done or skipped.</span></div>
    {input('Habit','habit','text','e.g. Read for 20 minutes')}
    {choices('Status','statusValue',[
      {value:1,label:'Done'},{value:0.5,label:'Partly'},{value:0,label:'Skipped'}
    ])}
  </div>

  if(slug==='reading') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Reading session.</strong><span>Save the resource and the idea worth carrying forward.</span></div>
    {input('Book, article or resource','book','text','e.g. Atomic Habits')}
    {input('Minutes','minutes','number','0')}
    {input('Takeaway','takeaway','text','What stood out?')}
  </div>

  if(slug==='social') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>People matter.</strong><span>Record meaningful time with someone and how it felt.</span></div>
    {input('Who were you with?','person','text','e.g. Friend')}
    {input('Context','context','text','e.g. Dinner together')}
    {choices('How did it feel?','quality',[
      {value:1,label:'Draining'},{value:2,label:'Low'},{value:3,label:'Okay'},{value:4,label:'Good'},{value:5,label:'Great'}
    ])}
  </div>

  if(slug==='personal') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Time for yourself.</strong><span>Log an activity that mattered to you today.</span></div>
    {input('Activity','activity','text','e.g. Walked by the beach')}
    {input('Minutes','minutes','number','0')}
  </div>

  if(slug==='focus') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Deep focus.</strong><span>Capture the task and the time you gave it your attention.</span></div>
    {input('What did you focus on?','task','text','e.g. Build the dashboard')}
    {input('Minutes','minutes','number','0')}
  </div>

  if(slug==='reflection') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Reflection.</strong><span>Give one thought a place to live instead of letting it disappear.</span></div>
    {input('What are you reflecting on?','prompt','text','What is on your mind?')}
  </div>

  if(slug==='stress') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Stress check-in.</strong><span>Notice the intensity and what may have contributed to it.</span></div>
    {input('What triggered it?','trigger','text','e.g. Deadline')}
    {choices('Intensity','level',[
      {value:1,label:'Very low'},{value:2,label:'Low'},{value:3,label:'Moderate'},{value:4,label:'High'},{value:5,label:'Very high'}
    ])}
  </div>

  return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Log this.</strong><span>Add the details you want to remember.</span></div>
    {input('Value','value','number','0')}
  </div>
}

function LogSheet({area,metric,definitions,saving,setSaving,onArea,onMetric,onSaved,onClose}){
  const [values,setValues]=useState({})
  const [error,setError]=useState('')
  const sheetRef=useRef(null)

  const areaMeta={
    health:{title:'Health',icon:HeartPulse,color:'#ff6b72',description:'Sleep, movement, hydration and everyday wellbeing.'},
    nutrition:{title:'Nutrition',icon:Apple,color:'#ffb84d',description:'Meals, nourishment and the details you want to remember.'},
    money:{title:'Money',icon:WalletCards,color:'#63d8b0',description:'Income, spending, savings and the bills you need to stay on top of.'},
    career:{title:'Career',icon:BriefcaseBusiness,color:'#63c8ff',description:'Applications, learning, projects, skills and outreach.'},
    mind:{title:'Mind',icon:Brain,color:'#9b7cff',description:'Mood, focus, reflection and the moments that shape your inner life.'},
    life:{title:'Life',icon:Sprout,color:'#7bdc9f',description:'Habits, reading, people and time spent on yourself.'}
  }

  const metricArea={
    sleep:'health',water:'health',steps:'health',exercise:'health',energy:'health',weight:'health',
    mood:'mind',focus:'mind',reflection:'mind',stress:'mind',
    learning:'career',building:'career',outreach:'career',applications:'career',skills:'career',
    income:'money',spending:'money',savings:'money',bills:'money',
    habits:'life',reading:'life',social:'life',personal:'life',meals:'nutrition'
  }

  const icons={
    sleep:Moon,water:Droplets,steps:Footprints,exercise:Dumbbell,energy:Zap,weight:Scale,
    mood:Smile,focus:Focus,reflection:NotebookPen,stress:Brain,
    learning:BookOpen,building:BriefcaseBusiness,outreach:Send,applications:Receipt,skills:Sparkles,
    income:ArrowDownLeft,spending:ArrowUpRight,savings:PiggyBank,bills:Receipt,
    habits:CheckCircle2,reading:BookOpen,social:Users,personal:Sprout
  }

  const rows=definitions.filter(d=>metricArea[d.slug]===area)

  useEffect(()=>{
    const previousOverflow=document.body.style.overflow
    const previousTouchAction=document.body.style.touchAction
    document.body.style.overflow='hidden'
    document.body.style.touchAction='none'

    function handleKey(event){
      if(event.key==='Escape'&&!saving) onClose()
    }

    window.addEventListener('keydown',handleKey)
    window.setTimeout(()=>sheetRef.current?.querySelector('button,input,textarea')?.focus(),80)

    return ()=>{
      document.body.style.overflow=previousOverflow
      document.body.style.touchAction=previousTouchAction
      window.removeEventListener('keydown',handleKey)
    }
  },[onClose,saving])

  const specialMetric = ['income','spending','savings','bills','applications','learning','building','outreach','skills','habits','reading','social','personal','focus','reflection','stress'].includes(metric?.slug)

  function specialValue(){
    const slug=metric?.slug
    if(['income','spending','savings','bills'].includes(slug)) return Number(values.amount)
    if(['learning','building','reading','personal','focus'].includes(slug)) return Number(values.minutes)
    if(slug==='skills') return Number(values.confidence)
    if(slug==='habits') return Number(values.statusValue)
    if(slug==='social') return Number(values.quality)
    if(['applications','outreach','reflection'].includes(slug)) return 1
    if(slug==='stress') return Number(values.level)
    return Number(values.value)
  }

  function specialNote(){
    const slug=metric?.slug
    const clean=v=>String(v||'').trim()
    if(slug==='income') return [clean(values.source)&&'Source: '+clean(values.source),clean(values.category)&&'Category: '+clean(values.category),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='spending') return [clean(values.merchant)&&'Merchant: '+clean(values.merchant),clean(values.category)&&'Category: '+clean(values.category),clean(values.payment)&&'Paid via: '+clean(values.payment),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='savings') return [clean(values.goal)&&'For: '+clean(values.goal),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='bills') return [clean(values.bill)&&'Bill: '+clean(values.bill),clean(values.provider)&&'Provider: '+clean(values.provider),clean(values.status)&&'Status: '+clean(values.status),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='applications') return [clean(values.company)&&'Company: '+clean(values.company),clean(values.role)&&'Role: '+clean(values.role),clean(values.status)&&'Status: '+clean(values.status),clean(values.nextStep)&&'Next: '+clean(values.nextStep),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='learning') return [clean(values.topic)&&'Topic: '+clean(values.topic),clean(values.learned)&&'Learned: '+clean(values.learned),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='building') return [clean(values.project)&&'Project: '+clean(values.project),clean(values.milestone)&&'Milestone: '+clean(values.milestone),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='outreach') return [clean(values.person)&&'Who: '+clean(values.person),clean(values.platform)&&'Platform: '+clean(values.platform),clean(values.outcome)&&'Outcome: '+clean(values.outcome),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='skills') return [clean(values.skill)&&'Skill: '+clean(values.skill),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='habits') return [clean(values.habit)&&'Habit: '+clean(values.habit),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='reading') return [clean(values.book)&&'Reading: '+clean(values.book),clean(values.takeaway)&&'Takeaway: '+clean(values.takeaway),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='social') return [clean(values.person)&&'With: '+clean(values.person),clean(values.context)&&'Context: '+clean(values.context),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='personal') return [clean(values.activity)&&'Activity: '+clean(values.activity),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='focus') return [clean(values.task)&&'Focus: '+clean(values.task),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='reflection') return [clean(values.prompt)&&'Reflection: '+clean(values.prompt),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='stress') return [clean(values.trigger)&&'Trigger: '+clean(values.trigger),clean(values.note)].filter(Boolean).join(' · ')
    return clean(values.note)
  }

  async function save(){
    setError('')
    if(!metric)return

    setSaving(true)

    const {data:a}=await supabase.auth.getUser()
    const u=a?.user

    if(!u){
      setError('Your session has expired.')
      setSaving(false)
      return
    }

    if(metric.value_type==='meal'){
      if(!values.meal_type){
        setError('Choose breakfast, lunch, dinner or snack.')
        setSaving(false)
        return
      }

      if(!values.description?.trim()){
        setError('Add what you ate first.')
        setSaving(false)
        return
      }

      const n=k=>values[k]===''||values[k]==null?null:Number(values[k])
      const loggedAt=values.logged_at?new Date(values.logged_at).toISOString():new Date().toISOString()

      const {data:meal,error:x}=await supabase.from('meal_logs').insert({
        user_id:u.id,
        meal_type:values.meal_type,
        description:values.description.trim(),
        calories:n('calories'),
        protein_g:n('protein_g'),
        carbs_g:n('carbs_g'),
        fat_g:n('fat_g'),
        water_ml:n('water_ml'),
        note:values.note?.trim()||null,
        logged_at:loggedAt,
        eaten_at:loggedAt
      }).select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at').single()

      setSaving(false)

      if(x){
        setError(x.message)
        return
      }

      onSaved?.('meal',meal)
      return
    }

    if(specialMetric){
      const value=specialValue()
      const loggedAt=values.logged_at?new Date(values.logged_at):new Date()
      if(!Number.isFinite(value)||(value<0)){
        setError('Complete the main detail before saving.')
        setSaving(false)
        return
      }
      const note=specialNote()||null
      const {data:entry,error:x}=await supabase.from('metric_logs').insert({user_id:u.id,metric_id:metric.id,value,unit:metric.unit||null,note,logged_at:loggedAt.toISOString(),value_numeric:value}).select('id,metric_id,value,unit,note,logged_at,created_at').single()
      setSaving(false)
      if(x){setError(x.message);return}
      onSaved?.('metric',entry)
      return
    }

    const sleepMinutes=metric.slug==='sleep'
      ? calculateSleepDuration(values.bedtime,values.wake_up)
      : null
    const value=metric.slug==='sleep'
      ? sleepMinutes/60
      : Number(values.value)

    if(!Number.isFinite(value)||(metric.slug==='sleep'&&(!Number.isFinite(sleepMinutes)||sleepMinutes<=0))||(metric.value_type==='scale'&&(value<1||value>5))){
      setError(metric.slug==='sleep'?'Choose a bedtime and wake-up time.':metric.value_type==='scale'?'Choose 1 to 5.':'Enter a valid value.')
      setSaving(false)
      return
    }

    const loggedAt=metric.slug==='sleep'
      ? (values.wake_up_date ? new Date(`${values.wake_up_date}T${values.wake_up}`) : new Date())
      : (values.logged_at?new Date(values.logged_at):new Date())

    const sleepNote=metric.slug==='sleep'
      ? `Bedtime ${formatSleepTime(values.bedtime)} · Wake-up ${formatSleepTime(values.wake_up)}`
      : values.note?.trim()||null

    const {data:entry,error:x}=await supabase.from('metric_logs').insert({
      user_id:u.id,
      metric_id:metric.id,
      value,
      unit:metric.slug==='sleep'?'hours':(metric.unit||null),
      note:sleepNote,
      logged_at:loggedAt.toISOString(),
      value_numeric:value
    }).select('id,metric_id,value,unit,note,logged_at,created_at').single()

    setSaving(false)

    if(x){
      setError(x.message)
      return
    }

    onSaved?.('metric',entry)
  }

  function formatSleepTime(value){
    if(!value)return '—'
    const [hour,minute]=value.split(':').map(Number)
    const date=new Date()
    date.setHours(hour,minute,0,0)
    return date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})
  }

  function calculateSleepDuration(bedtime,wakeUp){
    if(!bedtime||!wakeUp)return null
    const [bh,bm]=bedtime.split(':').map(Number)
    const [wh,wm]=wakeUp.split(':').map(Number)
    let minutes=(wh*60+wm)-(bh*60+bm)
    if(minutes<=0)minutes+=24*60
    return minutes
  }

  function selectMetric(nextMetric){
    onMetric(nextMetric)
    setValues(nextMetric.slug==='sleep'
      ? {bedtime:'23:00',wake_up:'07:00',wake_up_date:new Date().toISOString().slice(0,10)}
      : {logged_at:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)})
    setError('')
  }

  const I=metric?(icons[metric.slug]||Sparkles):(area?areaMeta[area].icon:ClipboardPlus)

  return (
    <div
      className="log-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-sheet-title"
      onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)onClose()}}
    >
      <section ref={sheetRef} className="log-sheet">
        <div className="log-sheet-handle" aria-hidden="true"><span /></div>

        <header className="log-sheet-head">
          <div className="log-sheet-heading">
            <span className="section-label">{metric?metric.name.toUpperCase():area?areaMeta[area].title.toUpperCase():'LOG'}</span>
            <h2 id="log-sheet-title">
              {metric?'Log '+metric.name.toLowerCase():area?areaMeta[area].title:'What do you want to track?'}
            </h2>
            <p>{metric ? (specialMetric ? 'Capture the real-world detail, not just a number.' : 'A small entry is enough. Keep it real.') : area ? areaMeta[area].description : 'Choose an area of your life, then pick the thing you want to record.'}</p>
          </div>

          <button className="log-close" type="button" onClick={onClose} disabled={saving} aria-label="Close logging sheet">
            <X size={18}/>
          </button>
        </header>

        <div className="log-sheet-scroll">
          {!area&&!metric&&(
            <div className="log-card-list">
              {Object.entries(areaMeta).map(([id,m])=>{
                const I2=m.icon
                const metricCount=definitions.filter(d=>metricArea[d.slug]===id).length + (id==='nutrition' ? 1 : 0)
                return (
                  <button className="log-health-card" type="button" key={id} onClick={()=>{onArea(id);onMetric(null)}}>
                    <span className="log-card-top">
                      <span className="log-card-title">
                        <span className="log-choice-icon" style={{'--area-color':m.color}}><I2 size={22}/></span>
                        <strong style={{'--card-color':m.color}}>{m.title}</strong>
                      </span>
                      <span className="log-card-date">TODAY</span>
                      <ChevronRight className="log-card-chevron" size={22}/>
                    </span>
                    <span className="log-card-bottom">
                      <span className="log-card-count"><strong>{metricCount}</strong><small>{metricCount===1?'entry':'things to track'}</small></span>
                      <span className="log-card-description">{m.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {area&&!metric&&(
            <div className="log-picker-view">
              <button className="log-back" type="button" onClick={()=>onArea(null)}>
                <ChevronLeft size={15}/> All areas
              </button>

              <div className="log-card-list">
                {rows.map(d=>{
                  const M=icons[d.slug]||Sparkles
                  const hint=d.slug==='sleep'?'Bedtime + wake-up':d.value_type==='duration'?'Duration':d.value_type==='scale'?'1–5 scale':d.unit||'Daily entry'
                  return (
                    <button className="log-health-card log-metric-card" type="button" key={d.id} onClick={()=>selectMetric(d)}>
                      <span className="log-card-top">
                        <span className="log-card-title">
                          <span className="log-choice-icon" style={{'--area-color':d.color||areaMeta[area].color}}><M size={22}/></span>
                          <strong style={{'--card-color':d.color||areaMeta[area].color}}>{d.name}</strong>
                        </span>
                        <span className="log-card-date">LOG</span>
                        <ChevronRight className="log-card-chevron" size={22}/>
                      </span>
                      <span className="log-card-bottom">
                        <span className="log-card-count"><strong>{hint}</strong><small>ready to record</small></span>
                        <span className="log-card-description">Add a simple entry and keep building your history.</span>
                      </span>
                    </button>
                  )
                })}

                {area==='nutrition'&&(
                  <button className="log-health-card log-metric-card" type="button" onClick={()=>selectMetric({slug:'meals',name:'Meal',value_type:'meal'})}>
                    <span className="log-card-top">
                      <span className="log-card-title">
                        <span className="log-choice-icon" style={{'--area-color':'#ffb84d'}}><Utensils size={22}/></span>
                        <strong style={{'--card-color':'#ffb84d'}}>Meal</strong>
                      </span>
                      <span className="log-card-date">LOG</span>
                      <ChevronRight className="log-card-chevron" size={22}/>
                    </span>
                    <span className="log-card-bottom">
                      <span className="log-card-count"><strong>Meal entry</strong><small>ready to record</small></span>
                      <span className="log-card-description">Record what you ate without turning food into a score.</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {metric&&metric.value_type!=='meal'&&(
            <div className="log-form">
              <div className="log-selected-metric">
                <span className="log-choice-icon" style={{'--metric-color':metric.color||'#c8f36a'}}><I size={19}/></span>
                <div><strong>{metric.name}</strong><small>{metric.unit||'Your entry'}</small></div>
              </div>

              {specialMetric?(
                <SpecialMetricFields metric={metric} values={values} setValues={setValues}/>
              ):metric.value_type==='scale'?(
                <div className="log-field-group">
                  <div className="log-field-title"><span>{metric.slug==='mood'?'How are you feeling?':'How would you rate it?'}</span><small>{metric.slug==='mood'?'Choose what feels closest':'1–5'}</small></div>
                  {metric.slug==='mood'?(
                    <div className="mood-scale-picker" aria-label="Choose your mood">
                      {[
                        {value:1,emoji:'😞',label:'Very low'},
                        {value:2,emoji:'😕',label:'Low'},
                        {value:3,emoji:'😐',label:'Okay'},
                        {value:4,emoji:'🙂',label:'Good'},
                        {value:5,emoji:'😄',label:'Great'},
                      ].map(option=>(
                        <button type="button" key={option.value} className={Number(values.value)===option.value?'active':''} onClick={()=>setValues(v=>({...v,value:option.value}))}>
                          <span aria-hidden="true">{option.emoji}</span><small>{option.label}</small>
                        </button>
                      ))}
                    </div>
                  ): (
                    <div className="scale-picker">
                      {[1,2,3,4,5].map(n=>(
                        <button type="button" key={n} className={Number(values.value)===n?'active':''} onClick={()=>setValues(v=>({...v,value:n}))}>{n}</button>
                      ))}
                    </div>
                  )}
                </div>

              ):metric.slug==='sleep'?(
                <div className="sleep-schedule-picker">
                  <div className="log-field-title">
                    <span>Sleep schedule</span>
                    <small>Choose when you went to bed and woke up</small>
                  </div>
                  <div className="sleep-time-grid">
                    <div className="sleep-time-card">
                      <span className="sleep-time-icon"><Moon size={17}/></span>
                      <span className="sleep-time-copy"><b>Bedtime</b><small>When you went to sleep</small></span>
                      <div className="sleep-time-control">
                        <button type="button" className="sleep-time-display" aria-label="Choose bedtime">
                          {formatSleepTime(values.bedtime)}
                        </button>
                        <input className="sleep-native-time" aria-label="Bedtime" type="time" step="300" value={values.bedtime||''} onChange={e=>setValues(v=>({...v,bedtime:e.target.value}))}/>
                      </div>
                    </div>
                    <div className="sleep-time-card">
                      <span className="sleep-time-icon"><Sunrise size={17}/></span>
                      <span className="sleep-time-copy"><b>Wake-up</b><small>When you woke up</small></span>
                      <div className="sleep-time-control">
                        <button type="button" className="sleep-time-display" aria-label="Choose wake-up time">
                          {formatSleepTime(values.wake_up)}
                        </button>
                        <input className="sleep-native-time" aria-label="Wake-up time" type="time" step="300" value={values.wake_up||''} onChange={e=>setValues(v=>({...v,wake_up:e.target.value}))}/>
                      </div>
                    </div>
                  </div>
                  {calculateSleepDuration(values.bedtime,values.wake_up)!=null&&(
                    <div className="sleep-duration-result">
                      <span>Sleep duration</span>
                      <strong>{Math.floor(calculateSleepDuration(values.bedtime,values.wake_up)/60)}h {calculateSleepDuration(values.bedtime,values.wake_up)%60}m</strong>
                    </div>
                  )}
                </div>
              ):(
                <label className="log-input-label">
                  <span>{metric.value_type==='duration'?'Minutes':metric.unit==='NGN'?'Amount':'Value'}</span>
                  <input autoFocus type="number" min="0" step="any" value={values.value||''} onChange={e=>setValues(v=>({...v,value:e.target.value}))} placeholder={metric.unit==='NGN'?'0':'0'}/>
                </label>
              )}

              {metric.slug!=='sleep'&&<label className="log-input-label">
                <span>When</span>
                <input type="datetime-local" value={values.logged_at||''} onChange={e=>setValues(v=>({...v,logged_at:e.target.value}))}/>
              </label>}

              <label className="log-input-label">
                <span>Note <small>optional</small></span>
                <textarea rows="3" value={values.note||''} onChange={e=>setValues(v=>({...v,note:e.target.value}))} placeholder="Anything worth remembering?"/>
              </label>

              {error&&<p className="log-error" role="alert">{error}</p>}
            </div>
          )}

          {metric&&metric.value_type==='meal'&&(
            <div className="log-form">
              <div className="log-field-group">
                <div className="log-field-title"><span>What kind of meal?</span></div>
                <div className="meal-type-row">
                  {['breakfast','lunch','dinner','snack'].map(t=>(
                    <button type="button" key={t} className={values.meal_type===t?'active':''} onClick={()=>setValues(v=>({...v,meal_type:t}))}>{t}</button>
                  ))}
                </div>
              </div>

              <label className="log-input-label">
                <span>What did you eat?</span>
                <textarea autoFocus rows="3" value={values.description||''} onChange={e=>setValues(v=>({...v,description:e.target.value}))} placeholder="e.g. Rice, chicken and vegetables"/>
              </label>

              <div className="optional-nutrition">
                <label className="log-input-label"><span>Calories <small>optional</small></span><input type="number" min="0" value={values.calories||''} onChange={e=>setValues(v=>({...v,calories:e.target.value}))}/></label>
                <label className="log-input-label"><span>Protein (g) <small>optional</small></span><input type="number" min="0" value={values.protein_g||''} onChange={e=>setValues(v=>({...v,protein_g:e.target.value}))}/></label>
              </div>

              <label className="log-input-label">
                <span>When</span>
                <input type="datetime-local" value={values.logged_at||''} onChange={e=>setValues(v=>({...v,logged_at:e.target.value}))}/>
              </label>

              <label className="log-input-label">
                <span>Note <small>optional</small></span>
                <textarea rows="2" value={values.note||''} onChange={e=>setValues(v=>({...v,note:e.target.value}))} placeholder="Anything worth remembering?"/>
              </label>

              {error&&<p className="log-error" role="alert">{error}</p>}
            </div>
          )}
        </div>

        {metric&&(
          <footer className="log-sheet-footer">
            <div>
              <span>PRIVATE ENTRY</span>
              <small>Saved to your Evolv history.</small>
            </div>
            <button className="button button-primary log-save" type="button" onClick={save} disabled={saving}>
              {saving?'Saving…':metric.value_type==='meal'?'Save meal':'Save log'}
              <Check size={15}/>
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}
function WeeklyProgressChart({ checkins = [], goals = [] }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const count = checkins.filter(item => item.checkin_date === key).length
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      date: date.getDate(),
      count,
    }
  })

  const maxCount = Math.max(1, ...days.map(day => day.count))
  const points = days.map((day, index) => {
    const x = 20 + (index * 260 / 6)
    const y = 92 - ((day.count / maxCount) * 62)
    return { ...day, x, y }
  })
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const total = days.reduce((sum, day) => sum + day.count, 0)
  const activeDays = days.filter(day => day.count > 0).length
  const avgProgress = goals.length ? Math.round(goals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / goals.length) : 0

  return (
    <div className="weekly-progress-chart">
      <div className="weekly-chart-summary">
        <div><strong>{avgProgress}%</strong><span>overall progress</span></div>
        <div><strong>{activeDays}/7</strong><span>days you showed up</span></div>
        <div><strong>{total}</strong><span>check-ins this week</span></div>
      </div>
      <div className="weekly-chart-visual">
        <svg viewBox="0 0 300 125" preserveAspectRatio="none" role="img" aria-label="Weekly check-in progress chart">
          <defs>
            <linearGradient id="weeklyFlowFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(82,190,145,.28)" />
              <stop offset="100%" stopColor="rgba(82,190,145,0)" />
            </linearGradient>
          </defs>
          <path d={`${path} L 280 108 L 20 108 Z`} fill="url(#weeklyFlowFill)" />
          <path d={path} fill="none" stroke="rgba(103,218,170,.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(point => (
            <circle key={point.key} cx={point.x} cy={point.y} r={point.count ? 4 : 2.5} fill="rgba(103,218,170,1)" />
          ))}
        </svg>
        <div className="weekly-chart-days">
          {points.map(point => <span key={point.key}><b>{point.label}</b><small>{point.date}</small></span>)}
        </div>
      </div>
      <div className="weekly-flow-note">
        <span className="weekly-flow-dot" />
        <span>{activeDays ? `You've shown up ${activeDays} day${activeDays === 1 ? '' : 's'} this week.` : 'Your first check-in starts here.'}</span>
      </div>
    </div>
  )
}

function EvolvCalendarBridge({ event, onCancel, onAdded }) {
  if (!event) return null

  async function addEvent() {
    try {
      const payload = {
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        notes: event.notes || '',
        location: event.location || '',
      }

      const plugin = window.Capacitor?.Plugins?.EvolvCalendar
      if (plugin?.createEvent) {
        await plugin.createEvent(payload)
        onAdded?.()
        return
      }

      if (window.webkit?.messageHandlers?.evolvCalendar?.postMessage) {
        window.webkit.messageHandlers.evolvCalendar.postMessage(payload)
        onAdded?.()
        return
      }

      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('The event time is invalid.')

      const pad = value => String(value).padStart(2, '0')
      const toIcsDate = date => (
        date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) + 'T' +
        pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + 'Z'
      )
      const escapeIcs = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EVOLV//Calendar//EN','BEGIN:VEVENT',
        `UID:evolv-${Date.now()}@${window.location.hostname}`,
        `DTSTAMP:${toIcsDate(new Date())}`,`DTSTART:${toIcsDate(start)}`,`DTEND:${toIcsDate(end)}`,
        `SUMMARY:${escapeIcs(event.title)}`,
        ...(event.notes ? [`DESCRIPTION:${escapeIcs(event.notes)}`] : []),
        ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
        'END:VEVENT','END:VCALENDAR',
      ].join('\\r\\n')

      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${String(event.title || 'evolv-event').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'evolv-event'}.ics`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      onAdded?.()
    } catch (error) {
      console.error('EVOLV calendar event failed:', error)
    }
  }

  return (
    <div className="ai-calendar-confirm" role="dialog" aria-label="Confirm calendar event">
      <div className="ai-calendar-confirm-copy">
        <span className="ai-calendar-label">ADD TO CALENDAR</span>
        <strong>{event.title}</strong>
        <span>{event.displayTime}</span>
        {event.notes ? <small>{event.notes}</small> : null}
      </div>
      <div className="ai-calendar-confirm-actions">
        <button type="button" onClick={onCancel}>Not now</button>
        <button type="button" className="ai-calendar-add" onClick={addEvent}>Add to Calendar</button>
      </div>
    </div>
  )
}

function EvolvAI({ profile, goals = [], checkins = [], momentum = 0, logs = [], meals = [], definitions = [] }) {
  const firstName = profile?.first_name || 'there'
  const [chatId, setChatId] = useState(() => {
    try {
      return localStorage.getItem('evolv-ai-chat-id') || crypto.randomUUID()
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
  })
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${firstName}. What’s on your mind? We can take it one thing at a time.` },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [typing, setTyping] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState('')
  const [speakingMessage, setSpeakingMessage] = useState('')
  const [pendingCalendarEvent, setPendingCalendarEvent] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('evolv-ai-chat-id', chatId)
    let mounted = true
    async function loadMessages() {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return
      const { data } = await supabase
        .from('ai_messages')
        .select('id,role,content')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (mounted && data?.length) setMessages(data)
    }
    loadMessages()
    return () => { mounted = false }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, typing])

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
  }, [])

  function startNewChat() {
    window.speechSynthesis?.cancel()
    setSpeakingMessage('')
    setCopiedMessage('')
    setTyping(false)
    setSending(false)
    setError('')
    setPendingCalendarEvent(null)
    setInput('')
    try {
      setChatId(crypto.randomUUID())
    } catch {
      setChatId(`${Date.now()}-${Math.random().toString(36).slice(2)}`)
    }
    setMessages([
      { role: 'assistant', content: `Hey ${firstName}. What’s on your mind? We can take it one thing at a time.` },
    ])
  }

  async function copyMessage(content, key) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessage(key)
      window.setTimeout(() => setCopiedMessage(current => current === key ? '' : current), 1400)
    } catch {
      setError('Could not copy that message. Please try again.')
    }
  }

  function speakMessage(content, key) {
    if (!('speechSynthesis' in window)) {
      setError('Voice playback is not supported on this device/browser.')
      return
    }

    if (speakingMessage === key) {
      window.speechSynthesis.cancel()
      setSpeakingMessage('')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeakingMessage(key)
    utterance.onend = () => setSpeakingMessage(current => current === key ? '' : current)
    utterance.onerror = () => setSpeakingMessage(current => current === key ? '' : current)
    window.speechSynthesis.speak(utterance)
  }

  async function shareMessage(content, key) {
    try {
      if (navigator.share) {
        await navigator.share({ text: content })
        return
      }
      await navigator.clipboard.writeText(content)
      setCopiedMessage(key)
      window.setTimeout(() => setCopiedMessage(current => current === key ? '' : current), 1400)
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setError('Could not share that message. Please try again.')
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    setTyping(false)
    setError('')

    const { data: authData } = await supabase.auth.getSession()
    const token = authData?.session?.access_token
    const userId = authData?.session?.user?.id

    if (!token || !userId) {
      setSending(false)
      setError('Your session has expired. Please sign in again.')
      return
    }

    await supabase.from('ai_messages').insert({ user_id: userId, chat_id: chatId, role: 'user', content: text })

    const metricById = Object.fromEntries(definitions.map(definition => [definition.id, definition]))
    const recentLogs = logs.slice(0, 40).map(log => {
      const definition = metricById[log.metric_id]
      return {
        metric: definition?.name || 'Metric',
        slug: definition?.slug || null,
        value: Number(log.value),
        unit: log.unit || definition?.unit || null,
        note: log.note || null,
        loggedAt: log.logged_at,
      }
    })
    const recentMeals = meals.slice(0, 20).map(meal => ({
      type: meal.meal_type,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein_g,
      waterMl: meal.water_ml,
      loggedAt: meal.logged_at,
    }))

    const progressContext = {
      momentum,
      totalGoals: goals.length,
      activeGoals: goals.filter(goal => goal.status === 'active').map(goal => ({