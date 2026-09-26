import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, Camera, Upload, Check, ChevronLeft, Home, LineChart, LogOut, MessageCircle, Plus, Settings, Sparkles, Target, TrendingUp, UserRound, Pencil, Trash2, Bot, Send, ArrowUp, ClipboardPlus, Copy, Volume2, VolumeX, Share2, HeartPulse, Apple, WalletCards, BriefcaseBusiness, Brain, Sprout, Moon, Droplets, Dumbbell, Footprints, Zap, Scale, Smile, Focus, NotebookPen, Receipt, PiggyBank, ArrowDownLeft, ArrowUpRight, Activity, BookOpen, History, MoreHorizontal, Users, CheckCircle2, X, ChevronRight, Utensils, ExternalLink, Sunrise } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { DashboardPages } from './components/DashboardPages'
import EvolvAI from './components/ai/EvolvAI'
import ContactModal from './components/contact/ContactModal'
import { supabase } from './lib/supabase'
import { scheduleEvolvAlarm, cancelEvolvAlarm, isNativeAlarmAvailable } from './lib/alarmBridge'
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

function getFirstName(value = '') {
  return String(value || '').trim().split(/\s+/)[0] || ''
}

function getProviderFirstName(user) {
  const metadata = user?.user_metadata || {}
  return getFirstName(
    metadata.given_name ||
    metadata.first_name ||
    metadata.full_name ||
    metadata.name ||
    ''
  )
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

    const providerFirstName = getProviderFirstName(user)
    const profileFirstName = providerFirstName || getFirstName(saved.name)

    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: profileFirstName,
      growth_areas: saved.areas || [],
      focus: saved.focus || '',
      first_goal: saved.goal?.trim() || '',
    })
  }

  useEffect(() => {
    document.documentElement.classList.toggle('evolv-android', /Android/i.test(navigator.userAgent))
    return () => document.documentElement.classList.remove('evolv-android')
  }, [])

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
    const rootEl = root.current
    if (!rootEl) return

    let ctx
    try {
      ctx = gsap.context(() => {
        if (view !== 'article' && view !== 'landing') {
          gsap.from('.page-enter > *', {
            y: 24,
            opacity: 1,
            duration: .75,
            stagger: .06,
            ease: 'power3.out',
          })
        }
      }, rootEl)
    } catch (error) {
      console.error('EVOLV page animation skipped:', error)
    }

    return () => ctx?.revert()
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
        first_name: getFirstName(data.name),
        growth_areas: data.areas,
        focus: data.focus,
        first_goal: data.goal.trim(),
      })
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name,growth_areas,focus,first_goal,avatar_url')
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
        <img className="evolv-loader-logo" src="/evolv-logo.svg" alt="EVOLV" />
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



function Brand() {
  return (
    <a className="brand" href="/" aria-label="EVOLV home">
      <img src="/evolv-logo.svg" alt="EVOLV" />
    </a>
  )
}


function Landing({ onStart, onExplore, onArticle, onPricing, onContact }) {
  const page = useRef(null)

  useLayoutEffect(() => {
    const pageEl = page.current
    if (!pageEl) return

    let refreshTimer = null
    let loadHandler = null
    let ctx

    try {
      ctx = gsap.context(() => {
        gsap.timeline({ defaults: { ease: 'power4.out' } })
          .from('.hero-kicker', { y: 18, opacity: 0, duration: .5 })
          .from('.hero-title .line', { yPercent: 110, opacity: 0, duration: .9, stagger: .1 }, '-=.25')
          .from('.hero-description', { y: 20, opacity: 0, duration: .6 }, '-=.5')
          .from('.hero-actions', { y: 16, opacity: 0, duration: .55 }, '-=.4')
          .from('.hero-visual', { scale: .92, opacity: 0, duration: 1 }, '-=.7')

        gsap.to('.hero-outer-ring', {
          rotation: 360,
          duration: 22,
          repeat: -1,
          ease: 'none',
        })

        gsap.to('.evolv-hero-marquee-track', {
          xPercent: -50,
          duration: 18,
          repeat: -1,
          ease: 'none',
        })

        gsap.to('.evolv-scroll-marquee-track', {
          xPercent: -50,
          duration: 22,
          repeat: -1,
          ease: 'none',
        })

        const reveal = (selector, fromVars, toVars, options = {}) => {
          pageEl.querySelectorAll(selector).forEach((element, index) => {
            gsap.fromTo(
              element,
              fromVars,
              {
                ...toVars,
                delay: options.stagger ? index * options.stagger : 0,
                scrollTrigger: {
                  trigger: element,
                  start: options.start || 'top 88%',
                  end: options.end || 'top 68%',
                  toggleActions: 'play none none reverse',
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        }

        // Keep the sections in normal document flow. ScrollTrigger only adds
        // subtle movement; it never controls visibility.
        reveal('.story-reveal', { y: 24 }, {
          y: 0,
          duration: .75,
          ease: 'power3.out',
        })

        reveal('.feature-card', { y: 20, scale: .99 }, {
          y: 0,
          scale: 1,
          duration: .65,
          ease: 'power3.out',
        }, { start: 'top 90%', end: 'top 74%', stagger: .05 })

        // Section 5 stays horizontally stable. This avoids clipping its
        // contents against the viewport edge while still giving it motion.
        reveal('.area', { y: 18 }, {
          y: 0,
          duration: .65,
          ease: 'power3.out',
        }, { start: 'top 92%', end: 'top 76%' })

        reveal('.story-reveal h2, .story-reveal h3', { color: '#6f756f' }, {
          color: '#f4f1ea',
          duration: .8,
          ease: 'power2.out',
        }, { start: 'top 86%', end: 'top 70%' })

        const refresh = () => ScrollTrigger.refresh()
        refreshTimer = window.setTimeout(refresh, 120)
        loadHandler = refresh
        window.addEventListener('load', loadHandler)
      }, pageEl)
    } catch (error) {
      console.error('EVOLV homepage animation skipped:', error)
    }

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer)
      if (loadHandler) window.removeEventListener('load', loadHandler)
      ctx?.revert()
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
  const [notifications,setNotifications]=useState([])
  const [saving,setSaving]=useState(false)
  const [goalTitle,setGoalTitle]=useState('')
  const [goalDescription,setGoalDescription]=useState('')
  const [goalDueDate,setGoalDueDate]=useState('')
  const [editingGoal,setEditingGoal]=useState(null)
  const [profileName,setProfileName]=useState(data.name||'')
  const [profileMessage,setProfileMessage]=useState('')
  const [alarms,setAlarms]=useState([])
  const [alarmEnabled,setAlarmEnabled]=useState(()=>localStorage.getItem('evolv-alarms-enabled')==='true')
  const [alarmTitle,setAlarmTitle]=useState('')
  const [alarmDate,setAlarmDate]=useState(()=>new Date().toISOString().slice(0,10))
  const [alarmTime,setAlarmTime]=useState('')
  const [alarmRepeat,setAlarmRepeat]=useState('once')
  const [alarmNote,setAlarmNote]=useState('')
  const [alarmSaving,setAlarmSaving]=useState(false)
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
  const [selectedEntry,setSelectedEntry]=useState(null)
  const [editingEntry,setEditingEntry]=useState(null)
  const [manageLogsOpen,setManageLogsOpen]=useState(false)
  const dashboardMainRef=useRef(null)
  const goTo=(page)=>{
    setActive(page)
    setArea(null)
    setMetric(null)
    window.history.pushState({evolvDashboard:true,page},'',window.location.href)
    window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}))
  }

  useEffect(()=>{
    const currentPage=window.history.state?.evolvDashboard ? window.history.state.page : null
    if(currentPage) setActive(currentPage)
    else window.history.replaceState({evolvDashboard:true,page:'overview'},'',window.location.href)

    function handleDashboardBack(){
      const page=window.history.state?.evolvDashboard ? window.history.state.page : 'overview'
      setActive(page)
      setArea(null)
      setMetric(null)
      setLogOpen(false)
      window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}))
    }

    window.addEventListener('popstate',handleDashboardBack)
    return()=>window.removeEventListener('popstate',handleDashboardBack)
  },[])

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
    const [p,d,l,m,g,al,n]=await Promise.all([
      supabase.from('profiles').select('first_name,growth_areas,focus,first_goal').eq('id',u.id).maybeSingle(),
      supabase.from('metric_definitions').select('id,slug,name,area,unit,value_type,icon,color').eq('is_active',true).order('area').order('name'),
      supabase.from('metric_logs').select('id,metric_id,value,unit,note,metadata,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(500),
      supabase.from('meal_logs').select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(200),
      supabase.from('goals').select('id,title,description,status,progress,due_date,created_at,updated_at').order('created_at',{ascending:false})
      ,supabase.from('alarms').select('id,title,note,alarm_at,repeat_type,enabled,platform,native_id,created_at,updated_at').eq('user_id',u.id).order('alarm_at',{ascending:true})
    ]);if(!mounted)return;if(p.data){setProfile({...p.data,email:u.email||''});setProfileName(p.data.first_name||'')}setAlarms(al.data||[]);setAvatarUrl(p.data?.avatar_url||u.user_metadata?.avatar_url||localStorage.getItem('evolv-avatar-'+u.id)||'');setDefs(d.data||[]);setLogs(l.data||[]);setMeals(m.data||[]);setGoals(g.data||[]);if(d.error||l.error||m.error||g.error||al.error||n.error)setError('Some tracking data could not be loaded.');setLoading(false)}load();return()=>{mounted=false}},[onLogout])

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
  function openLog(a=null,m=null){setArea(a);setMetric(m);setEditingEntry(null);setSelectedEntry(null);setLogOpen(true);setError('')}
  function openEntry(item){
    const entry=item.entry
    const definition=item.type==='log'?defs.find(d=>d.id===entry.metric_id):null
    setSelectedEntry({type:item.type,entry,definition})
    goTo('log-detail')
  }
  function startEditEntry(item){
    const entry=item.entry
    const definition=item.type==='log'?defs.find(d=>d.id===entry.metric_id):null
    if(item.type==='log' && !definition)return
    setSelectedEntry(null)
    setEditingEntry({type:item.type,entry,definition})
    if(item.type==='meal'){
      setArea('nutrition')
      setMetric({slug:'meals',name:'Meal',value_type:'meal',color:'#ffb84d'})
    }else{
      setArea(metricArea[definition.slug]||definition.area)
      setMetric(definition)
    }
    setLogOpen(true)
    setError('')
  }
  async function deleteEntry(item){
    if(!window.confirm('Delete this entry? This cannot be undone.'))return
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const table=item.type==='meal'?'meal_logs':'metric_logs'
    const {error:x}=await supabase.from(table).delete().eq('id',item.entry.id).eq('user_id',u.id)
    if(x){setError(x.message);return}
    if(item.type==='meal')setMeals(current=>current.filter(x=>x.id!==item.entry.id))
    else setLogs(current=>current.filter(x=>x.id!==item.entry.id))
    setSelectedEntry(null)
    goTo('logs')
  }
  function handleLogSaved(kind,entry){
    const wasEditing=!!editingEntry
    if(kind==='meal') setMeals(current=>[entry,...current.filter(x=>x.id!==entry.id)])
    else setLogs(current=>[entry,...current.filter(x=>x.id!==entry.id)])
    setLogOpen(false)
    setMetric(null)
    setArea(null)
    setEditingEntry(null)
    if(wasEditing) setActive('logs')
  }
  async function createGoal(e){
    e.preventDefault()
    if(!goalTitle.trim())return
    setSaving(true)
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u){setSaving(false);return}
    const {data:g,error:x}=await supabase.from('goals').insert({
      user_id:u.id,title:goalTitle.trim(),description:goalDescription.trim()||null,
      due_date:goalDueDate||null,status:'active',progress:0
    }).select('id,title,description,status,progress,due_date,created_at,updated_at').single()
    setSaving(false)
    if(x){setError(x.message);return}
    setGoals(c=>[g,...c]);setGoalTitle('');setGoalDescription('');setGoalDueDate('')
  }
  function beginGoalEdit(g){
    setEditingGoal(g)
    setGoalTitle(g.title||'')
    setGoalDescription(g.description||'')
    setGoalDueDate(g.due_date||'')
  }
  async function saveGoalEdit(e){
    e.preventDefault()
    if(!editingGoal||!goalTitle.trim())return
    setSaving(true)
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u){setSaving(false);return}
    const {data:g,error:x}=await supabase.from('goals').update({
      title:goalTitle.trim(),description:goalDescription.trim()||null,due_date:goalDueDate||null,updated_at:new Date().toISOString()
    }).eq('id',editingGoal.id).eq('user_id',u.id).select('id,title,description,status,progress,due_date,created_at,updated_at').single()
    setSaving(false)
    if(x){setError(x.message);return}
    setGoals(c=>c.map(item=>item.id===g.id?g:item))
    setEditingGoal(null);setGoalTitle('');setGoalDescription('');setGoalDueDate('')
  }
  async function updateGoal(g,changes){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const {data:updated,error:x}=await supabase.from('goals').update({...changes,updated_at:new Date().toISOString()}).eq('id',g.id).eq('user_id',u.id).select('id,title,description,status,progress,due_date,created_at,updated_at').single()
    if(x){setError(x.message);return}
    setGoals(c=>c.map(item=>item.id===g.id?updated:item))
  }
  async function deleteGoal(g){
    if(!window.confirm('Delete this goal? This cannot be undone.'))return
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const {error:x}=await supabase.from('goals').delete().eq('id',g.id).eq('user_id',u.id)
    if(x){setError(x.message);return}
    setGoals(c=>c.filter(item=>item.id!==g.id))
  }
  async function saveProfile(e){e.preventDefault();if(!profileName.trim())return;const {data:a}=await supabase.auth.getUser();const {data:p,error:x}=await supabase.from('profiles').update({first_name:profileName.trim(),updated_at:new Date().toISOString()}).eq('id',a.user.id).select('first_name,growth_areas,focus,first_goal').single();if(x){setProfileMessage('Could not save your profile.');return}setProfile({...p,email:a.user.email||''});setProfileMessage('Profile saved.')}
  async function createAlarm(event){
    event.preventDefault()
    if(!alarmTitle.trim()||!alarmDate||!alarmTime)return
    const alarmAt=new Date(`${alarmDate}T${alarmTime}`)
    if(Number.isNaN(alarmAt.getTime())||alarmAt.getTime()<=Date.now()){
      setProfileMessage('Choose a future time for the alarm.')
      return
    }
    setAlarmSaving(true)
    setProfileMessage('')
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u){setAlarmSaving(false);return}

    const {data:created,error:x}=await supabase.from('alarms').insert({
      user_id:u.id,
      title:alarmTitle.trim(),
      note:alarmNote.trim()||null,
      alarm_at:alarmAt.toISOString(),
      repeat_type:alarmRepeat,
      enabled:true,
      platform:isNativeAlarmAvailable() ? 'native' : 'web', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos'
    }).select('id,title,note,alarm_at,repeat_type,enabled,platform,native_id,created_at,updated_at').single()

    if(x){setAlarmSaving(false);setProfileMessage(x.message);return}

    try{
      const scheduled=await scheduleEvolvAlarm(created)
      let saved={...created,native_id:scheduled.nativeId}
      if(scheduled.nativeId){
        const {data:updated}=await supabase.from('alarms').update({native_id:scheduled.nativeId,platform:'native',updated_at:new Date().toISOString()}).eq('id',created.id).select('id,title,note,alarm_at,repeat_type,enabled,platform,native_id,created_at,updated_at').single()
        if(updated)saved=updated
      }
      setAlarms(current=>[...current,saved].sort((a,b)=>new Date(a.alarm_at)-new Date(b.alarm_at)))
      setAlarmTitle('')
      setAlarmNote('')
      setAlarmRepeat('once')
      setAlarmTime('')
      setAlarmEnabled(true)
      localStorage.setItem('evolv-alarms-enabled','true')
      setProfileMessage(scheduled.native
        ? 'Alarm set on this device.'
        : 'Alarm saved. A true device alarm becomes active when Evolv is installed as the native app.')
    }catch(error){
      await supabase.from('alarms').delete().eq('id',created.id)
      setProfileMessage(error?.message||'EVOLV could not set that device alarm.')
    }finally{
      setAlarmSaving(false)
    }
  }

  async function toggleAlarmSystem(){
    const next=!alarmEnabled
    setAlarmEnabled(next)
    localStorage.setItem('evolv-alarms-enabled',String(next))
    if(!next){
      await Promise.all(alarms.map(alarm=>cancelEvolvAlarm(alarm)))
      await supabase.from('alarms').update({enabled:false,updated_at:new Date().toISOString()}).eq('user_id',(await supabase.auth.getUser()).data.user.id)
      setAlarms(current=>current.map(alarm=>({...alarm,enabled:false})))
      setProfileMessage('Evolv alarms turned off.')
      return
    }
    setProfileMessage(isNativeAlarmAvailable()
      ? 'Evolv alarms are on.'
      : 'Alarm system is on. Install Evolv as the native app to let the phone schedule true device alarms.')
  }

  async function toggleAlarm(alarm){
    if(!alarmEnabled)return
    if(alarm.enabled){
      await cancelEvolvAlarm(alarm)
      const {data:updated}=await supabase.from('alarms').update({enabled:false,updated_at:new Date().toISOString()}).eq('id',alarm.id).select('id,title,note,alarm_at,repeat_type,enabled,platform,native_id,created_at,updated_at').single()
      if(updated)setAlarms(current=>current.map(item=>item.id===alarm.id?updated:item))
      return
    }
    try{
      const scheduled=await scheduleEvolvAlarm({...alarm,enabled:true})
      const {data:updated}=await supabase.from('alarms').update({enabled:true,native_id:scheduled.nativeId,platform:scheduled.native?'native':'web',updated_at:new Date().toISOString()}).eq('id',alarm.id).select('id,title,note,alarm_at,repeat_type,enabled,platform,native_id,created_at,updated_at').single()
      if(updated)setAlarms(current=>current.map(item=>item.id===alarm.id?updated:item))
      if(!scheduled.native)setProfileMessage('This saved alarm needs the native Evolv app to become a true phone alarm.')
    }catch(error){setProfileMessage(error?.message||'Could not enable that alarm.')}
  }

  async function deleteAlarm(alarm){
    await cancelEvolvAlarm(alarm)
    const {error:x}=await supabase.from('alarms').delete().eq('id',alarm.id)
    if(!x)setAlarms(current=>current.filter(item=>item.id!==alarm.id))
  }

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

    setAvatarUploading(true)
    setProfileMessage('')

    try{
      // Every user gets one stable Storage object. Replacing the object keeps
      // the same permanent path instead of relying on browser-only state.
      const path=u.id+'/avatar'
      const storage= supabase.storage.from('avatars')
      const upload=await storage.upload(path,file,{
        upsert:true,
        contentType:file.type,
        cacheControl:'3600'
      })

      if(upload.error){
        console.error('EVOLV avatar upload failed:',upload.error)
        setProfileMessage('Could not upload your profile photo. Please try again.')
        return
      }

      const {data:publicData}=storage.getPublicUrl(path)
      const url=publicData?.publicUrl
      if(!url){
        setProfileMessage('Could not create a permanent profile photo URL.')
        return
      }

      // Cache-bust the image without changing the permanent Storage path.
      const displayUrl=url+'?v='+Date.now()

      const [{error:profileError},{error:authError}]=await Promise.all([
        supabase.from('profiles').update({avatar_url:url,updated_at:new Date().toISOString()}).eq('id',u.id),
        supabase.auth.updateUser({data:{avatar_url:url}})
      ])

      if(profileError||authError){
        console.error('EVOLV avatar profile save failed:',profileError||authError)
        setProfileMessage('The photo uploaded, but EVOLV could not save your profile link. Please try again.')
        return
      }

      setAvatarUrl(displayUrl)
      localStorage.setItem('evolv-avatar-'+u.id,displayUrl)
      setProfile(current=>current?{...current,avatar_url:url}:current)
      setProfileMessage('Profile photo updated.')
    }catch(error){
      console.error('EVOLV avatar update failed:',error)
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
    setProfileMessage('')

    try{
      const storage=supabase.storage.from('avatars')
      const {error:storageError}=await storage.remove([u.id+'/avatar'])
      const {error:profileError}=await supabase.from('profiles').update({
        avatar_url:null,
        updated_at:new Date().toISOString()
      }).eq('id',u.id)
      const {error:authError}=await supabase.auth.updateUser({data:{avatar_url:null}})

      if(storageError && storageError.statusCode!=='404'){
        console.error('EVOLV avatar removal failed:',storageError)
      }
      if(profileError||authError){
        console.error('EVOLV avatar profile removal failed:',profileError||authError)
        setProfileMessage('Could not fully remove your profile photo. Please try again.')
        return
      }

      localStorage.removeItem('evolv-avatar-'+u.id)
      setAvatarUrl('')
      setProfile(current=>current?{...current,avatar_url:null}:current)
      setProfileMessage('Profile photo removed.')
    }catch(error){
      console.error('EVOLV avatar removal failed:',error)
      setProfileMessage('Could not remove your profile photo.')
    }finally{
      setAvatarUploading(false)
    }
  }
  async function deleteAccount(){setDeleting(true);const {data:s}=await supabase.auth.getSession();const r=await fetch(import.meta.env.VITE_SUPABASE_URL+'/functions/v1/delete-account',{method:'POST',headers:{Authorization:'Bearer '+s.session.access_token,apikey:import.meta.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json'}});if(!r.ok){setDeleting(false);return}await supabase.auth.signOut();window.location.href='/'}

  const pageProps = {
    active, setActive, area, setArea, metric, setMetric, defs, logs, meals, goals, profile,
    loading, notifications, saving, goalTitle, setGoalTitle, goalDescription, setGoalDescription,
    goalDueDate, setGoalDueDate, editingGoal, setEditingGoal, profileName, setProfileName,
    profileMessage, alarms, alarmEnabled, alarmTitle, setAlarmTitle, alarmDate, setAlarmDate,
    alarmTime, setAlarmTime, alarmRepeat, setAlarmRepeat, alarmNote, setAlarmNote, alarmSaving,
    notificationsEnabled, notificationTimes, reflectionTime, reflectionOpen, reflectionStep,
    reflectionMood, reflectionFeeling, reflectionNote, reflectionSaving, avatarUrl, avatarUploading,
    avatarInputRef, deleteOpen, deleting, error, progressRange, setProgressRange, progressMetric,
    setProgressMetric, selectedEntry, editingEntry, manageLogsOpen, setManageLogsOpen, dashboardMainRef,
    goTo, areas, metricArea, icons, name, latest, today, todayLogs, todayMeals, valueText, openLog,
    openEntry, startEditEntry, deleteEntry, handleLogSaved, createGoal, beginGoalEdit, saveGoalEdit,
    updateGoal, deleteGoal, saveProfile, createAlarm, toggleAlarmSystem, toggleAlarm, deleteAlarm,
    toggleNotifications, toggleNotificationTime, saveNotificationTime, toggleQuietHours, saveQuietHour,
    openReflection, setReflectionOpen, deleteAccount, onLogout, onArticle, data,
    handleAvatarChange, removeAvatar, setDeleteOpen, setAlarmEnabled, setProfileMessage,
    WeeklyProgressChart,
  }

  return <div className={`page-enter dashboard ${active==='ai'?'dashboard-ai-active':''}`}>
    <header className="app-topbar"><button className="app-logo-button" onClick={()=>goTo('overview')} aria-label="Go to home"><Brand/></button><button className="notification-button" onClick={()=>goTo('notifications')} aria-label="Open notifications" title="Notifications"><Bell size={17}/></button></header>
    <main className="dash-main">
      {error&&<p className="auth-error" role="alert">{error}</p>}
      {active==='ai'
        ? <EvolvAI key="evolv-ai-page" profile={profile} goals={goals} checkins={[]} momentum={0} logs={logs} meals={meals} definitions={defs}/>
        : <DashboardPages active={active} pageProps={pageProps}/>
      }
    </main>
    {active!=='ai'&&<button type="button" className="ai-floating-button" onClick={()=>goTo('ai')} aria-label="Open Evolv AI" title="Talk to Evolv"><MessageCircle size={21}/></button>}
    {active!=='ai'&&<BottomNav active={active} onNavigate={goTo} onLog={openLog} avatarUrl={avatarUrl}/>}\n    <PWAInstallPrompt />
    {logOpen&&<LogSheet area={area} metric={metric} definitions={defs} saving={saving} setSaving={setSaving} editEntry={editingEntry} onArea={setArea} onMetric={setMetric} onSaved={handleLogSaved} onClose={()=>{if(!saving){setLogOpen(false);setMetric(null);setEditingEntry(null)}}}/>}
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

  if(slug==='energy') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>How much energy did you have?</strong><span>Use how you actually felt today — not a guess about what you should feel.</span></div>
    {choices('Energy level','energy',[
      {value:1,label:'Very low'},{value:2,label:'Low'},{value:3,label:'Okay'},{value:4,label:'Good'},{value:5,label:'High'}
    ])}
  </div>

  if(slug==='steps') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Track your movement.</strong><span>Enter the step count from your phone, smartwatch or fitness tracker.</span></div>
    {input('Steps today','steps','number','e.g. 6,240')}
  </div>

  if(slug==='water') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Log the water you actually drank.</strong><span>Use cups, bottles, millilitres or litres. EVOLV converts the entry to litres for your daily history.</span></div>
    {input('Amount','waterAmount','number','e.g. 4')}
    {choices('Measure','waterMeasure',[
      {value:'cup',label:'250 ml cup'},
      {value:'bottle',label:'500 ml bottle'},
      {value:'ml',label:'Millilitres'},
      {value:'liter',label:'Litres'}
    ])}
  </div>

  if(slug==='weight') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Record your current weight.</strong><span>Use kilograms and log the number shown by your scale. This is optional and only useful if you want to track it.</span></div>
    {input('Weight (kg)','weight','number','e.g. 68.5')}
  </div>

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
    <div className="special-log-intro"><strong>Track money you actually saved.</strong><span>Every entry becomes part of your savings history, so you can see what you put aside and what you are building toward.</span></div>
    {input('Amount saved','amount','number','e.g. 10,000')}
    {input('Saving for','goal','text','e.g. Laptop, emergency fund, trip')}
    {choices('Where did you save it?','account',[{value:'bank',label:'Bank account'},{value:'cash',label:'Cash'},{value:'wallet',label:'Savings wallet'},{value:'other',label:'Other'}])}
    {input('Note','note','text','e.g. First deposit this month')}
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

  if(slug==='mood') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>How are you feeling?</strong><span>Choose the mood that best describes you right now, then capture what may be influencing it.</span></div>
    {choices('Mood','level',[{value:1,label:'Very low'},{value:2,label:'Low'},{value:3,label:'Okay'},{value:4,label:'Good'},{value:5,label:'Great'}])}
    {choices('Mood label','moodLabel',[{value:'calm',label:'Calm'},{value:'happy',label:'Happy'},{value:'sad',label:'Sad'},{value:'anxious',label:'Anxious'},{value:'frustrated',label:'Frustrated'},{value:'excited',label:'Excited'},{value:'tired',label:'Tired'}])}
    {input('What influenced your mood?','context','text','e.g. Work went well')}
    {input('Energy','energyLabel','text','e.g. Low, steady, high')}
  </div>

  if(slug==='focus') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>What did you focus on?</strong><span>Make the session measurable: what you worked on, how long you stayed with it and what moved forward.</span></div>
    {input('Task or goal','task','text','e.g. Build the Evolv dashboard')}
    {input('Minutes focused','minutes','number','e.g. 45')}
    {input('What did you accomplish?','accomplishment','text','e.g. Finished the logging flow')}
  </div>

  if(slug==='reflection') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Reflect on your day.</strong><span>Capture what happened, what you learned and what you want to carry into tomorrow.</span></div>
    {input('What went well?','wentWell','text','e.g. I finished the feature I was avoiding')}
    {input('What was difficult?','difficult','text','e.g. I lost focus in the afternoon')}
    {input('What did you learn?','learned','text','e.g. I work better after a short walk')}
    {input('What do you want to do tomorrow?','tomorrow','text','e.g. Start the backend task before noon')}
  </div>

  if(slug==='stress') return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Understand the stress.</strong><span>Log the intensity, what triggered it, how it showed up and what helped.</span></div>
    {choices('Stress level','level',[{value:1,label:'Very low'},{value:2,label:'Low'},{value:3,label:'Moderate'},{value:4,label:'High'},{value:5,label:'Very high'}])}
    {input('What triggered it?','trigger','text','e.g. Deadline or difficult conversation')}
    {input('How did it show up?','body','text','e.g. Tight chest, racing thoughts')}
    {input('What helped?','helped','text','e.g. Walk, prayer, music, talking to someone')}
  </div>

  return <div className="special-metric-fields">
    <div className="special-log-intro"><strong>Log this.</strong><span>Add the details you want to remember.</span></div>
    {input('Value','value','number','0')}
  </div>
}

function ExerciseFields({values,setValues}){
  const exercises=['Push-ups','Pull-ups','Bench press','Bicep curls','Squats','Deadlift','Shoulder press','Lunges','Lat pulldown','Barbell row']
  const rows=values.exerciseRows||[]
  function updateRow(index,key,value){setValues(v=>({...v,exerciseRows:(v.exerciseRows||[]).map((row,i)=>i===index?{...row,[key]:value}:row)}))}
  function changeNumber(index,key,delta){
    const row=rows[index]
    const next=Math.max(0,(Number(row?.[key])||0)+delta)
    updateRow(index,key,next)
  }
  function addRow(){setValues(v=>({...v,exerciseRows:[...(v.exerciseRows||[]),{exercise:'Bench press',sets:3,reps:8,weight:''}]}))}
  function removeRow(index){setValues(v=>({...v,exerciseRows:(v.exerciseRows||[]).filter((_,i)=>i!==index)}))}
  const totalReps=rows.reduce((sum,row)=>sum+(Number(row.sets)||0)*(Number(row.reps)||0),0)
  return <div className="exercise-log-fields">
    <div className="special-log-intro"><strong>Real workout tracking.</strong><span>Log each exercise with sets, reps and weight so your gym sessions build a history you can actually use.</span></div>
    <div className="exercise-row-list">
      {rows.map((row,index)=><div className="exercise-entry" key={index}>
        <div className="exercise-entry-head"><span>EXERCISE {index+1}</span>{rows.length>1&&<button type="button" onClick={()=>removeRow(index)} aria-label="Remove exercise"><X size={15}/></button>}</div>
        <label className="log-input-label"><span>Exercise</span><select value={row.exercise} onChange={e=>updateRow(index,'exercise',e.target.value)}>{exercises.map(name=><option key={name}>{name}</option>)}</select></label>
        <div className="exercise-number-grid">
          {[['sets','Sets'],['reps','Reps']].map(([key,label])=><div className="exercise-picker" key={key}><span>{label}</span><div><button type="button" onClick={()=>changeNumber(index,key,-1)} aria-label={'Decrease '+label}>−</button><strong>{row[key]||0}</strong><button type="button" onClick={()=>changeNumber(index,key,1)} aria-label={'Increase '+label}>+</button></div></div>)}
        </div>
        <label className="log-input-label"><span>Weight <small>optional · kg</small></span><input type="number" min="0" step="0.5" value={row.weight??''} onChange={e=>updateRow(index,'weight',e.target.value)} placeholder="Bodyweight / 0"/></label>
      </div>)}
    </div>
    <button type="button" className="exercise-add-button" onClick={addRow}><Plus size={16}/> Add another exercise</button>
    <div className="exercise-total"><span>Total reps</span><strong>{totalReps}</strong></div>
  </div>
}

function LogHistoryModal({logs=[],meals=[],definitions=[],onClose,onOpenEntry}){
  const metricById=Object.fromEntries(definitions.map(d=>[d.id,d]))
  const items=[...logs.map(entry=>({type:'log',entry,date:new Date(entry.logged_at)})),...meals.map(entry=>({type:'meal',entry,date:new Date(entry.logged_at)}))].sort((a,b)=>b.date-a.date)
  function formatValue(item){
    if(item.type==='meal') return item.entry.description||'Meal logged'
    const def=metricById[item.entry.metric_id]
    const value=Number(item.entry.value)
    if(!def) return 'Entry logged'
    if(def.slug==='mood') return ({1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'}[value]||String(item.entry.value))
    if(def.slug==='sleep'){
      const minutes=Math.max(0,Math.round(value*60))
      const hours=Math.floor(minutes/60), mins=minutes%60
      return hours ? (mins?hours+'h '+mins+'m':hours+'h') : mins+'m'
    }
    if(def.value_type==='scale') return value+'/5'
    if(def.unit==='NGN') return '₦'+value.toLocaleString()
    return value.toLocaleString()+(def.unit?' '+def.unit:'')
  }
  return <div className="entry-detail-overlay log-history-overlay" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="entry-detail-sheet log-history-sheet">
      <div className="log-history-hero"><div className="log-history-orb"><NotebookPen size={20}/></div><button type="button" className="log-history-close" onClick={onClose} aria-label="Close previous logs"><X size={18}/></button></div>
      <div className="log-history-heading"><span className="section-label">YOUR HISTORY</span><h2>Previous logs.</h2><p>Open any entry to view, edit or delete it.</p></div>
      <div className="log-history-divider"><span>{items.length} {items.length===1?'entry':'entries'}</span><span>Newest first</span></div>
      {items.length ? <div className="log-history-list">{items.map((item,index)=>{
        const def=item.type==='log'?metricById[item.entry.metric_id]:null
        const label=item.type==='meal'?(item.entry.meal_type||'Meal'):def?.name||'Entry'
        return <button type="button" className="log-history-row" key={item.type+'-'+(item.entry.id||index)} onClick={()=>onOpenEntry(item)}><span className="log-history-row-icon">{item.type==='meal'?<Utensils size={16}/>:<Activity size={16}/>}</span><span className="log-history-row-copy"><strong>{label}</strong><small>{formatValue(item)}</small></span><time>{item.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}<br/>{item.date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</time><ChevronRight size={17}/></button>
      })}</div> : <div className="log-history-empty"><div className="log-history-empty-icon"><NotebookPen size={20}/></div><strong>No previous logs yet.</strong><p>Your saved health, life, money and meal entries will appear here.</p></div>}
      <div className="log-history-footer"><span>Tap an entry to view, edit or delete it.</span><button type="button" className="log-history-done" onClick={onClose}>Done</button></div>
    </section>
  </div>
}

function EntryDetailModal({item,onClose,onEdit,onDelete}){
  const {type,entry,definition}=item
  const date=entry.logged_at||entry.created_at
  const formatDate=value=>value?new Date(value).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—'
  const value=type==='meal'?(`${entry.meal_type||'Meal'} · ${entry.description||''}`):definition?.slug==='mood'?({1:'Very low',2:'Low',3:'Okay',4:'Good',5:'Great'}[Number(entry.value)]||entry.value):definition?`${Number(entry.value).toLocaleString()}${entry.unit?' '+entry.unit:''}`:'Entry'
  return <div className="entry-detail-overlay" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className="entry-detail-sheet">
      <div className="entry-detail-head"><div><span className="section-label">PREVIOUS LOG</span><h2>{type==='meal'?'Meal':definition?.name||'Entry'}</h2></div><button type="button" className="log-close" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      <div className="entry-detail-body"><div className="entry-detail-value">{value}</div><time>{formatDate(date)}</time>{type==='meal'&&<div className="entry-detail-grid">{entry.calories!=null&&<span><small>Calories</small><b>{entry.calories}</b></span>}{entry.protein_g!=null&&<span><small>Protein</small><b>{entry.protein_g} g</b></span>}{entry.carbs_g!=null&&<span><small>Carbs</small><b>{entry.carbs_g} g</b></span>}{entry.fat_g!=null&&<span><small>Fat</small><b>{entry.fat_g} g</b></span>}{entry.water_ml!=null&&<span><small>Water</small><b>{entry.water_ml} ml</b></span>}</div>}{entry.note&&<div className="entry-detail-note"><small>NOTE</small><p>{entry.note}</p></div>}</div>
      <div className="entry-detail-actions"><button type="button" onClick={onDelete} className="entry-delete-button">Delete</button><button type="button" onClick={onEdit} className="button button-primary">Edit log <ArrowRight size={15}/></button></div>
    </section>
  </div>
}

function LogSheet({area,metric,definitions,saving,setSaving,editEntry,onArea,onMetric,onSaved,onClose}){
  const [values,setValues]=useState({})
  const [error,setError]=useState('')
  const sheetRef=useRef(null)
  const editing=Boolean(editEntry)

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

  function toLocalDateTime(value){
    const date=new Date(value||Date.now())
    const offset=date.getTimezoneOffset()*60000
    return new Date(date.getTime()-offset).toISOString().slice(0,16)
  }
  function toTimeInput(value){
    const match=String(value||'').trim().match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)?/i)
    if(!match)return ''
    let hour=Number(match[1]);const period=match[3]?.toUpperCase()
    if(period==='PM'&&hour<12)hour+=12
    if(period==='AM'&&hour===12)hour=0
    return String(hour).padStart(2,'0')+':'+match[2]
  }
  useEffect(()=>{
    if(!editEntry)return
    if(editEntry.type==='meal'){
      const e=editEntry.entry
      setValues({meal_type:e.meal_type||'',description:e.description||'',calories:e.calories??'',protein_g:e.protein_g??'',carbs_g:e.carbs_g??'',fat_g:e.fat_g??'',water_ml:e.water_ml??'',note:e.note||'',logged_at:toLocalDateTime(e.logged_at)})
      return
    }
    const e=editEntry.entry
    const meta=e.metadata&&typeof e.metadata==='object'?e.metadata:{}
    const next={...meta,value:e.value??'',logged_at:toLocalDateTime(e.logged_at),note:e.note||''}
    if(editEntry.definition?.slug==='sleep'){
      const match=String(e.note||'').match(/Bedtime\\s+([^·]+)\\s+·\\s+Wake-up\\s+(.+)/i)
      if(match){next.bedtime=toTimeInput(match[1]);next.wake_up=toTimeInput(match[2]);next.wake_up_date=new Date(e.logged_at).toISOString().slice(0,10)}
    }
    if(editEntry.definition?.slug==='exercise'&&!next.exerciseRows?.length){
      next.exerciseRows=String(e.note||'').split(' · ').map(part=>{const m=part.match(/^(.+?):\\s*(\\d+)×(\\d+)(?:\\s*@\\s*([\\d.]+)kg)?$/);return m?{exercise:m[1],sets:m[2],reps:m[3],weight:m[4]||''}:null}).filter(Boolean)
    }
    setValues(next)
  },[editEntry])

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

  const specialMetric = ['exercise','income','spending','savings','bills','applications','learning','building','outreach','skills','habits','reading','social','personal','mood','focus','reflection','stress','energy','steps','water','weight'].includes(metric?.slug)

  function specialValue(){
    const slug=metric?.slug
    if(slug==='exercise') return (values.exerciseRows||[]).reduce((sum,row)=>sum+(Number(row.sets)||0)*(Number(row.reps)||0),0)
    if(slug==='energy') return Number(values.energy)
    if(slug==='steps') return Number(values.steps)
    if(slug==='water'){
      const amount=Number(values.waterAmount)
      const measure=values.waterMeasure||'cup'
      const litersPerUnit={cup:0.25,bottle:0.5,ml:0.001,liter:1}
      return amount*(litersPerUnit[measure]||0.25)
    }
    if(slug==='weight') return Number(values.weight)
    if(['income','spending','savings','bills'].includes(slug)) return Number(values.amount)
    if(['learning','building','reading','personal','focus'].includes(slug)) return Number(values.minutes)
    if(slug==='skills') return Number(values.confidence)
    if(slug==='habits') return Number(values.statusValue)
    if(slug==='social') return Number(values.quality)
    if(['applications','outreach'].includes(slug)) return 1
    if(['mood','stress'].includes(slug)) return Number(values.level)
    return Number(values.value)
  }

  function specialNote(){
    const slug=metric?.slug
    if(slug==='exercise') return (values.exerciseRows||[]).filter(row=>(Number(row.sets)||0)>0&&(Number(row.reps)||0)>0).map(row=>`${row.exercise}: ${row.sets}×${row.reps}${Number(row.weight)>0?' @ '+row.weight+'kg':''}`).join(' · ') || null
    if(slug==='energy') return values.energy ? `Energy: ${values.energy}/5` : null
    if(slug==='steps') return values.steps ? `Steps: ${Number(values.steps).toLocaleString()}` : null
    if(slug==='water'){
      const labels={cup:'250 ml cup',bottle:'500 ml bottle',ml:'ml',liter:'litre'}
      const amount=Number(values.waterAmount)
      return amount>0 ? `Water: ${amount} ${labels[values.waterMeasure||'cup']}` : null
    }
    if(slug==='weight') return values.weight ? `Weight: ${values.weight} kg` : null
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
    if(slug==='mood') return [clean(values.moodLabel)&&'Mood: '+clean(values.moodLabel),clean(values.context)&&'Influenced by: '+clean(values.context),clean(values.energyLabel)&&'Energy: '+clean(values.energyLabel),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='focus') return [clean(values.task)&&'Focus: '+clean(values.task),clean(values.durationLabel)&&'Duration: '+clean(values.durationLabel),clean(values.accomplishment)&&'Accomplished: '+clean(values.accomplishment),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='reflection') return [clean(values.wentWell)&&'Went well: '+clean(values.wentWell),clean(values.difficult)&&'Difficult: '+clean(values.difficult),clean(values.learned)&&'Learned: '+clean(values.learned),clean(values.tomorrow)&&'Tomorrow: '+clean(values.tomorrow),clean(values.note)].filter(Boolean).join(' · ')
    if(slug==='stress') return [clean(values.trigger)&&'Trigger: '+clean(values.trigger),clean(values.body)&&'How it showed up: '+clean(values.body),clean(values.helped)&&'Helped: '+clean(values.helped),clean(values.note)].filter(Boolean).join(' · ')
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

      const payload={user_id:u.id,meal_type:values.meal_type,description:values.description.trim(),calories:n('calories'),protein_g:n('protein_g'),carbs_g:n('carbs_g'),fat_g:n('fat_g'),water_ml:n('water_ml'),note:values.note?.trim()||null,logged_at:loggedAt,eaten_at:loggedAt}
      const query=editing ? supabase.from('meal_logs').update(payload).eq('id',editEntry.entry.id).eq('user_id',u.id) : supabase.from('meal_logs').insert(payload)
      const {data:meal,error:x}=await query.select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,metadata,logged_at,created_at').single()
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
      if(metric.slug==='exercise' && !(values.exerciseRows||[]).some(row=>(Number(row.sets)||0)>0&&(Number(row.reps)||0)>0)){
        setError('Add at least one exercise with sets and reps.')
        setSaving(false)
        return
      }
      if(!Number.isFinite(value)||(value<0)){
        setError('Complete the main detail before saving.')
        setSaving(false)
        return
      }
      const note=specialNote()||null
      const storedUnit=metric.slug==='water'?'L':metric.unit||null
      const payload={user_id:u.id,metric_id:metric.id,value,unit:storedUnit,note,metadata:values,logged_at:loggedAt.toISOString(),value_numeric:value}
      const query=editing ? supabase.from('metric_logs').update(payload).eq('id',editEntry.entry.id).eq('user_id',u.id) : supabase.from('metric_logs').insert(payload)
      const {data:entry,error:x}=await query.select('id,metric_id,value,unit,note,metadata,logged_at,created_at').single()
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

    const payload={user_id:u.id,metric_id:metric.id,value,unit:metric.slug==='sleep'?'hours':(metric.unit||null),note:sleepNote,metadata:values,logged_at:loggedAt.toISOString(),value_numeric:value}
    const query=editing ? supabase.from('metric_logs').update(payload).eq('id',editEntry.entry.id).eq('user_id',u.id) : supabase.from('metric_logs').insert(payload)
    const {data:entry,error:x}=await query.select('id,metric_id,value,unit,note,metadata,logged_at,created_at').single()
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
      : nextMetric.slug==='exercise'
         ? {logged_at:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),exerciseRows:[{exercise:'Push-ups',sets:3,reps:10,weight:''}]}
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
              {metric?(editing?'Edit '+metric.name.toLowerCase():'Log '+metric.name.toLowerCase()):area?areaMeta[area].title:'What do you want to track?'}
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
                      <ChevronRight className="log-card-chevron" size={22}/>
                    </span>
                    <span className="log-card-bottom">
                      <span className="log-card-count"><strong>{metricCount}</strong><small>{metricCount===1?'entry':'things to track'}</small></span>
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
                        <ChevronRight className="log-card-chevron" size={22}/>
                      </span>
                      <span className="log-card-bottom">
                        <span className="log-card-count"><strong>{hint}</strong><small>ready to record</small></span>
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
                <>{metric.slug==='exercise'?<ExerciseFields values={values} setValues={setValues}/>:<SpecialMetricFields metric={metric} values={values} setValues={setValues}/>}</>
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
              <span>{editing?'EDITING ENTRY':'PRIVATE ENTRY'}</span>
              <small>{editing?'Changes update this existing entry.':'Saved to your Evolv history.'}</small>
            </div>
            <button className="button button-primary log-save" type="button" onClick={save} disabled={saving}>
              {saving?'Saving…':editing?'Save changes':metric.value_type==='meal'?'Save meal':'Save log'}
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

export default App
