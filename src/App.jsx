import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Asterisk, Bell, Flame, CircleHelp, Camera, Upload, Check, ChevronLeft, Home, LineChart, LogOut, Plus, Settings, Sparkles, Target, TrendingUp, UserRound, Pencil, Trash2, Bot, Send, ArrowUp, ClipboardPlus, Copy, Volume2, VolumeX, Share2, HeartPulse, Apple, WalletCards, BriefcaseBusiness, Brain, Sprout, Moon, Droplets, Dumbbell, Footprints, Zap, Scale, Smile, Focus, NotebookPen, Receipt, PiggyBank, ArrowDownLeft, ArrowDownRight, ArrowUpRight, Activity, BookOpen, History, MoreHorizontal, Users, CheckCircle2, X, ChevronRight, Utensils, ExternalLink, Sunrise, CalendarClock } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LegalPage from './components/LegalPage'
import BottomNav from './components/BottomNav'
import DesktopSidebar from './components/DesktopSidebar'
import QuickLogSheet from './components/QuickLogSheet'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { DashboardPages } from './components/DashboardPages'
import EvolvAI from './components/ai/EvolvAI'
import ContactModal from './components/contact/ContactModal'
import PatternWaves from './components/PatternWaves/PatternWaves'
import CrystalizedBall from './components/CrystalizedBall'
import { AvatarPortrait, DEFAULT_AVATAR } from './components/AvatarStudio'
import './components/styles/WelcomeOnboarding.css'
import FlipCard from './components/FlipCard/FlipCard'
import { supabase } from './lib/supabase'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const systemStepIcons = { DEFINE: Target, BUILD: Sprout, TRACK: TrendingUp, EVOLVE: Sparkles }

function SystemStepIcon({ title }) {
  const Icon = systemStepIcons[title] || Sparkles
  return <span className="feature-step-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.7} /></span>
}

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
  avatarStyle: 'androgynous',
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

function AmbientSound({ active }) {
  const audioRef = useRef(null)
  const fadeTimerRef = useRef(null)
  const startingRef = useRef(false)
  const targetVolume = /Android/i.test(navigator.userAgent || '') ? 0.6 : 0.5

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  function fadeTo(target, duration = 220, pauseWhenDone = false) {
    const audio = audioRef.current
    if (!audio) return
    clearFadeTimer()

    const startVolume = audio.volume
    const steps = 14
    const stepDuration = Math.max(16, duration / steps)
    let step = 0

    fadeTimerRef.current = window.setInterval(() => {
      step += 1
      const progress = Math.min(step / steps, 1)
      audio.volume = Math.max(0, Math.min(1, startVolume + (target - startVolume) * progress))

      if (progress >= 1) {
        clearFadeTimer()
        if (pauseWhenDone) audio.pause()
      }
    }, stepDuration)
  }

  async function startAmbient() {
    const audio = audioRef.current
    if (!active || !audio || document.visibilityState === 'hidden') return

    // A tap/scroll must never restart or reset audio that is already playing.
    if (!audio.paused) {
      if (audio.volume < targetVolume && !fadeTimerRef.current) fadeTo(targetVolume, 900)
      return
    }
    if (startingRef.current) return

    startingRef.current = true
    clearFadeTimer()
    audio.volume = 0
    try {
      await audio.play()
      fadeTo(targetVolume, 900)
    } catch {
      // Browsers may block autoplay until the user's first natural interaction.
    } finally {
      startingRef.current = false
    }
  }

  function pauseAmbient() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      clearFadeTimer()
      return
    }
    fadeTo(0, 320, true)
  }

  useEffect(() => {
    const audio = new Audio('/audio/ambient.m4a')
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audioRef.current = audio

    const resumeAfterInteraction = () => {
      if (active && document.visibilityState !== 'hidden') startAmbient()
    }

    if (active) {
      startAmbient()
      // pointerdown covers modern Android browsers; touchstart is kept as fallback.
      document.addEventListener('pointerdown', resumeAfterInteraction, { passive: true })
      document.addEventListener('touchstart', resumeAfterInteraction, { passive: true })
      document.addEventListener('keydown', resumeAfterInteraction)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active) startAmbient()
      else pauseAmbient()
    }
    const onPageHide = () => {
      clearFadeTimer()
      audio.pause()
      audio.currentTime = 0
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('pointerdown', resumeAfterInteraction)
      document.removeEventListener('touchstart', resumeAfterInteraction)
      document.removeEventListener('keydown', resumeAfterInteraction)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      clearFadeTimer()
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [active])

  return null
}


const STREAK_KEYS = { app: 'evolv:streak:app', reflection: 'evolv:streak:reflection' }
function streakDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
function readStreakDays(kind) {
  try { const value = JSON.parse(localStorage.getItem(STREAK_KEYS[kind]) || '[]'); return new Set(Array.isArray(value) ? value : []) }
  catch { return new Set() }
}
async function recordStreakDay(kind) {
  const days = readStreakDays(kind)
  const today = streakDate()
  days.add(today)
  try { localStorage.setItem(STREAK_KEYS[kind], JSON.stringify([...days].sort())) } catch {}
  window.dispatchEvent(new CustomEvent('evolv-streak-updated'))
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('streak_activity_days').upsert({
      user_id: user.id,
      activity_type: kind,
      activity_date: today
    }, { onConflict: 'user_id,activity_type,activity_date', ignoreDuplicates: true })
    if (error) console.error('EVOLV streak sync failed:', error)
  } catch (error) {
    console.error('EVOLV streak sync failed:', error)
  }
}
function streakCurrent(days) {
  let date = new Date()
  if (!days.has(streakDate(date))) date.setDate(date.getDate() - 1)
  let count = 0
  while (days.has(streakDate(date))) { count += 1; date.setDate(date.getDate() - 1) }
  return count
}
function streakBest(days) {
  let best = 0, run = 0, previous = null
  for (const key of [...days].sort()) {
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    run = previous && Math.round((date - previous) / 86400000) === 1 ? run + 1 : 1
    best = Math.max(best, run); previous = date
  }
  return best
}
function StreakWidget() {
  const [open, setOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [days, setDays] = useState(() => ({ app: readStreakDays('app'), reflection: readStreakDays('reflection') }))
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const refresh = () => setDays({ app: readStreakDays('app'), reflection: readStreakDays('reflection') })
  useEffect(() => {
    let cancelled = false
    const loadRemoteStreaks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { recordStreakDay('app'); refresh(); return }
        const { data, error } = await supabase
          .from('streak_activity_days')
          .select('activity_type,activity_date')
          .eq('user_id', user.id)
        if (error) throw error
        if (cancelled) return
        const merged = { app: readStreakDays('app'), reflection: readStreakDays('reflection') }
        const remoteKeys = new Set()
        for (const row of data || []) {
          if (row.activity_type === 'app' || row.activity_type === 'reflection') {
            merged[row.activity_type].add(row.activity_date)
            remoteKeys.add(row.activity_type + ':' + row.activity_date)
          }
        }
        // Preserve any streak history previously stored on this device by syncing missing dates.
        const missingRows = []
        for (const kind of ['app', 'reflection']) {
          for (const date of merged[kind]) {
            if (!remoteKeys.has(kind + ':' + date)) missingRows.push({ user_id: user.id, activity_type: kind, activity_date: date })
          }
        }
        if (missingRows.length) {
          const { error: backfillError } = await supabase.from('streak_activity_days').insert(missingRows)
          if (backfillError && backfillError.code !== '23505') console.error('EVOLV streak history sync failed:', backfillError)
        }
        for (const kind of ['app', 'reflection']) {
          try { localStorage.setItem(STREAK_KEYS[kind], JSON.stringify([...merged[kind]].sort())) } catch {}
        }
        setDays(merged)
        await recordStreakDay('app')
        refresh()
      } catch (error) {
        console.error('EVOLV streak load failed:', error)
        if (!cancelled) { recordStreakDay('app'); refresh() }
      }
    }
    loadRemoteStreaks()
    window.addEventListener('evolv-streak-updated', refresh)
    return () => { cancelled = true; window.removeEventListener('evolv-streak-updated', refresh) }
  }, [])
  useEffect(() => {
    document.body.classList.toggle('streak-modal-open', open)
    if (!open) return () => document.body.classList.remove('streak-modal-open')
    const onKey = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.classList.remove('streak-modal-open')
    }
  }, [open])
  const appCurrent = streakCurrent(days.app)
  const reflectionCurrent = streakCurrent(days.reflection)
  const yearDays = [...days.app].filter(day => day.startsWith(String(today.getFullYear()))).length
  const hasWeek = offset => Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday); date.setDate(date.getDate() + i - offset * 7)
    return days.app.has(streakDate(date))
  }).some(Boolean)
  let weekCount = 0
  for (let offset = 0; offset < 60 && hasWeek(offset); offset++) weekCount++
  async function shareStreak() {
    const text = 'I’m on a ' + appCurrent + '-day streak on EVOLV.'
    try {
      if (navigator.share) await navigator.share({ title: 'EVOLV streak', text })
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
    } catch {}
  }
  return <>
    <button className="streak-chip" type="button" onClick={() => setOpen(true)} aria-label={'Open streaks. Current app streak: ' + appCurrent} aria-haspopup="dialog">
      <Flame size={19} strokeWidth={1.8} aria-hidden="true" /><span>{appCurrent}</span>
    </button>
    {open && createPortal(<div className="streak-modal-root">
      <button className="streak-overlay open" type="button" aria-label="Close streaks" onClick={() => setOpen(false)} />
      <section className="streak-sheet open" role="dialog" aria-modal="true" aria-label="Streaks">
        <div className="streak-head"><div className="streak-grab" /><div className="streak-tools">
          <button type="button" aria-label="How streaks work" aria-expanded={helpOpen} onClick={() => setHelpOpen(v => !v)}><CircleHelp size={21}/></button>
          <button type="button" aria-label="Share your streak" onClick={shareStreak}><Share2 size={21}/></button>
        </div></div>
        <h2>Streaks help you build your daily habit.</h2>
        {helpOpen && <p className="streak-help">Your app streak counts consecutive days you open EVOLV. Your reflection streak counts consecutive days you save a Daily Reflection. Miss a day and the count starts again.</p>}
        <div className="streak-stats">
          <div className="streak-stat"><div className="streak-now"><Flame size={30}/><span>{appCurrent}</span></div><div className="streak-name">App streak</div><div className="streak-best"><Flame size={16}/><b>{streakBest(days.app)}</b> Best</div></div>
          <div className="streak-stat"><div className="streak-now"><span className="streak-ring-icon"><span/></span><span>{reflectionCurrent}</span></div><div className="streak-name">Reflection streak</div><div className="streak-best"><span className="streak-ring-small"/><b>{streakBest(days.reflection)}</b> Best</div></div>
        </div>
        {weekCount > 0 && <p className="streak-weeks">{weekCount} {weekCount === 1 ? 'week' : 'weeks'} in a row</p>}
        <p className="streak-year">{yearDays} {yearDays === 1 ? 'day' : 'days'} in EVOLV this year</p>
        <div className="streak-week">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((name, index) => {
          const date = new Date(monday); date.setDate(monday.getDate() + index)
          const key = streakDate(date), isToday = key === streakDate(today)
          return <div key={name}><div className="name">{name}</div><div className={'cell' + (days.app.has(key) ? ' active' : '') + (isToday ? ' today' : '')}>{date.getDate()}</div></div>
        })}</div>
      </section>
    </div>, document.body)}
  </>
}

function App() {
  const root = useRef(null)
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(() => {
    try { return localStorage.getItem('evolv-ambient-sound-enabled') !== 'false' } catch { return true }
  })

  useEffect(() => {
    const syncAmbientSound = event => {
      if (typeof event.detail?.enabled === 'boolean') setAmbientSoundEnabled(event.detail.enabled)
      else {
        try { setAmbientSoundEnabled(localStorage.getItem('evolv-ambient-sound-enabled') !== 'false') } catch {}
      }
    }
    window.addEventListener('evolv-ambient-sound-updated', syncAmbientSound)
    return () => window.removeEventListener('evolv-ambient-sound-updated', syncAmbientSound)
  }, [])
  const [view, setView] = useState(() => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/'
    const savedView = localStorage.getItem('evolv-view')
    // The installed PWA starts at /dashboard so returning users reopen
    // their actual app, not the marketing site. Auth restoration below verifies
    // the saved Supabase session before deciding where that route should land.
    const initialView = savedView === 'onboarding' ? 'welcome' : savedView
    if (path === '/onboarding') return 'welcome'
    if (path === '/dashboard') return 'dashboard'
    return path === '/signup' ? 'onboarding' : (initialView || 'landing')
  })
  // Android's installed PWA already shows the app icon during its native
  // launch splash, so skip our React loader there to avoid a duplicate intro.
  // iOS home-screen web apps do not reliably show our branded intro, so show
  // the EVOLV loader on iPhone/iPad even when running in standalone mode.
  // Regular browser launches keep the same branded loader on both platforms.
  const [isBooting, setIsBooting] = useState(() => {
    try {
      const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      const fullscreen = window.matchMedia?.('(display-mode: fullscreen)').matches
      const minimalUi = window.matchMedia?.('(display-mode: minimal-ui)').matches
      const iosStandalone = window.navigator?.standalone === true
      const android = /Android/i.test(window.navigator?.userAgent || '')
      const installedPwa = standalone || fullscreen || minimalUi || iosStandalone

      // Only Android installed PWAs should rely exclusively on the native splash.
      return !(android && installedPwa)
    } catch {
      return true
    }
  })
  const [article, setArticle] = useState(null)
  const [legalDocument, setLegalDocument] = useState('terms')
  const [legalReturnView, setLegalReturnView] = useState('landing')
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [step, setStep] = useState(0)
  const [authMode, setAuthMode] = useState('signup')
  const directSignup = window.location.pathname.replace(/\/+$/, '') === '/signup'
  const [data, setData] = useState(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/signup') return initialData
    try { return { ...initialData, ...JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') } }
    catch { return initialData }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('evolv-android', /Android/i.test(navigator.userAgent))
    return () => document.documentElement.classList.remove('evolv-android')
  }, [])

  useEffect(() => {
    // Installed PWAs use the platform splash screen; the custom loader is
    // only for regular browser launches.
    if (!isBooting) return
    const timer = window.setTimeout(() => setIsBooting(false), 1350)
    return () => window.clearTimeout(timer)
  }, [isBooting])

  useEffect(() => {
    let mounted = true

    async function restoreAuth() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (!mounted) return
      if (sessionError) console.error('EVOLV session restore failed:', sessionError)

      if (!sessionData?.session?.user) {
        // A PWA launch at /dashboard must never fall through to the public
        // landing page when the session needs refreshing or the user signed out.
        const launchPath = window.location.pathname.replace(/\/+$/, '') || '/'
        if (launchPath === '/dashboard') {
          setAuthMode('login')
          localStorage.setItem('evolv-view', 'auth')
          setView('auth')
        }
        return
      }

      if (sessionData?.session?.user) {
        const user = sessionData.session.user

        // Founder-only, one-shot push test triggered by the explicit test URL.
        // The Edge Function independently verifies the authenticated founder ID.
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('founder-notification-test') === '1') {
          urlParams.delete('founder-notification-test')
          const remainingQuery = urlParams.toString()
          window.history.replaceState(
            {},
            '',
            window.location.pathname + (remainingQuery ? '?' + remainingQuery : '') + window.location.hash
          )
          const { data: testResult, error: testError } = await supabase.functions.invoke('founder-user-notifications', {
            body: { action: 'founder_current_count_test' },
          })
          if (testError) console.error('EVOLV founder notification test failed:', testError.message)
          else console.info('EVOLV founder notification test result:', testResult)
        }

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

        if (oauthIntent === 'signup') {
          await finishAuth(user, 'signup')
          sessionStorage.removeItem('evolv-oauth-intent')
          return
        }

        await finishAuth(user, 'restore')
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

        // Auth routing is handled by restoreAuth or the explicit submit handler.
        // Avoid racing those paths by sending every auth event straight to the dashboard.
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useLayoutEffect(() => {
    // Homepage animation is owned by Landing. Never let GSAP touch auth,
    // onboarding, dashboard, or other routed pages.
    if (view !== 'landing') return
  }, [view, step])

  // Every destination page must start at its own top. The scroll is done
  // after React has rendered the new page, so it cannot race the view change.
  useEffect(() => {
    if (view === 'landing' || view === 'dashboard') return

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  }, [view, article])

  function openLegal(documentType) {
    setLegalReturnView(view === 'auth' ? 'auth' : 'landing')
    setLegalDocument(documentType)
    localStorage.setItem('evolv-view', 'legal')
    setView('legal')
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  function closeLegal() {
    localStorage.setItem('evolv-view', legalReturnView)
    setView(legalReturnView)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

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
    localStorage.setItem('evolv-view', 'welcome')
    setView('welcome')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function openAuth(mode = 'signup') {
    setAuthMode(mode)
    localStorage.setItem('evolv-view', 'auth')
    setView('auth')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function returnHome() {
    if (window.location.pathname !== '/') window.history.replaceState({}, '', '/')
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

  function scrollLandingTo(id) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const section = document.getElementById(id)
        if (!section) return
        const top = section.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'smooth' })
      })
    })
  }

  function openArticle(type, areaId = null) {
    if (type === 'features') {
      setArticle(null)
      localStorage.setItem('evolv-view', 'landing')
      setView('landing')
      scrollLandingTo('features')
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

  async function finishOnboarding() {
    const completedData = { ...data, name: getFirstName(data.name) }
    localStorage.setItem('evolv-onboarding', JSON.stringify(completedData))
    localStorage.setItem('evolv-avatar-preferences', JSON.stringify(
      getAvatarPreset(completedData.avatarStyle || DEFAULT_AVATAR.presentation)
    ))

    // Complete the personal setup first; only then ask the user to create
    // an account or sign in. This marker survives the Google/GitHub redirect.
    localStorage.setItem('evolv-onboarding-ready-for-auth', 'true')
    if (window.location.pathname.replace(/\/+$/, '') === '/signup') {
      window.history.replaceState({}, '', '/')
    }
    setData(completedData)
    setAuthMode('signup')
    localStorage.setItem('evolv-view', 'auth')
    setView('auth')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function finishAuth(user, authMode = 'login') {
    // Only notify on an actual successful signup, never on routine app openings or logins.
    if (authMode === 'signup') {
      void supabase.functions.invoke('founder-user-notifications', {
        body: { action: 'auth_signup', user_id: user.id },
      }).then(({ error }) => {
        if (error) console.warn('EVOLV founder signup notification failed:', error.message)
      }).catch((error) => {
        console.warn('EVOLV founder signup notification request failed:', error)
      })
    }

    if (window.location.pathname.replace(/\/+$/, '') === '/signup') {
      window.history.replaceState({}, '', '/')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name,growth_areas,focus,first_goal,avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) console.error('EVOLV profile lookup failed:', profileError)

    // Users who completed onboarding before authentication should land
    // in the dashboard after OAuth, with their choices saved to the profile.
    const onboardingReady = localStorage.getItem('evolv-onboarding-ready-for-auth') === 'true'
    if ((authMode === 'signup' || !profile) && onboardingReady) {
      const saved = (() => {
        try { return { ...initialData, ...JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') } }
        catch { return { ...initialData, ...data } }
      })()
      const completedData = {
        ...saved,
        name: getFirstName(saved.name || getProviderFirstName(user)),
      }
      const { error: saveError } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: completedData.name,
        growth_areas: completedData.areas || [],
        focus: completedData.focus || '',
        first_goal: completedData.goal?.trim() || '',
      })
      if (saveError) console.error('EVOLV onboarding profile save failed:', saveError)
      setData(completedData)
      localStorage.setItem('evolv-onboarding', JSON.stringify(completedData))
      localStorage.removeItem('evolv-onboarding-ready-for-auth')
      localStorage.setItem('evolv-view', 'dashboard')
      setView('dashboard')
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    // A direct /signup visit can bypass the intro, so retain a safe fallback
    // for brand-new accounts that have not completed onboarding yet.
    if (authMode === 'signup' || !profile) {
      const nextData = {
        ...initialData,
        name: getProviderFirstName(user) || data.name || '',
        avatarStyle: 'androgynous',
      }
      setData(nextData)
      setStep(0)
      localStorage.setItem('evolv-view', 'onboarding')
      setView('onboarding')
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    const savedOnboarding = (() => {
      try { return JSON.parse(localStorage.getItem('evolv-onboarding') || '{}') }
      catch { return {} }
    })()
    setData({
      ...initialData,
      ...savedOnboarding,
      name: profile.first_name || savedOnboarding.name || getProviderFirstName(user),
      areas: profile.growth_areas || savedOnboarding.areas || [],
      focus: profile.focus || savedOnboarding.focus || '',
      goal: profile.first_goal || savedOnboarding.goal || '',
    })
    localStorage.setItem('evolv-view', 'dashboard')
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function logout() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      console.error('EVOLV sign-out failed:', error)
      throw new Error(error.message || 'EVOLV could not sign you out. Please try again.')
    }

    localStorage.removeItem('evolv-view')
    localStorage.removeItem('evolv-onboarding')
    sessionStorage.removeItem('evolv-oauth-intent')
    sessionStorage.removeItem('evolv-auth-error')
    setAuthMode('signup')
    setData(initialData)
    window.history.replaceState({}, '', '/signup')
    setView('auth')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <main ref={root} className="app">
      <AmbientSound active={ambientSoundEnabled && (view === 'welcome' || view === 'onboarding' || view === 'auth' || view === 'dashboard')} />
      {isBooting && <EvolvLoader />}
      <div className="noise" />
      {view !== 'welcome' && view !== 'onboarding' && view !== 'auth' && view !== 'dashboard' && view !== 'legal' && (
        <Navbar onStart={enterApp} onSignIn={() => { setMenuOpen(false); setAuthMode('login'); localStorage.setItem('evolv-view', 'auth'); setView('auth'); window.scrollTo({ top: 0, behavior: 'instant' }) }} onFeatures={() => openArticle('features')} onAreas={() => openArticle('areas')} onPricing={openPricing} onContact={openContact} onHome={returnHome} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      )}
      {view === 'landing' && <Landing onStart={enterApp} onExplore={exploreLanding} onArticle={openArticle} onPricing={openPricing} onContact={openContact} onLegal={openLegal} />}
      {view === 'pricing' && <PricingPage onStart={enterApp} onBack={returnHome} />}
      {view === 'article' && <ArticlePage article={article} onStart={enterApp} onBack={closeArticle} />}
      {view === 'legal' && <LegalPage documentType={legalDocument} onBack={closeLegal} />}
      {view === 'welcome' && <WelcomeScreen onGetStarted={() => { if (window.location.pathname === '/onboarding' || window.location.pathname === '/onboarding/') window.history.replaceState({}, '', '/'); setStep(0); setData((current) => ({ ...initialData, ...current })); localStorage.setItem('evolv-view', 'onboarding'); setView('onboarding'); window.scrollTo({ top: 0, behavior: 'instant' }) }} onSignIn={() => openAuth('login')} onExplore={() => { setView('landing'); localStorage.setItem('evolv-view', 'landing') }} />}
      {view === 'auth' && <AuthPage mode={authMode} setMode={setAuthMode} onSuccess={finishAuth} directSignup={directSignup} onLegal={openLegal} />}
      {view === 'onboarding' && (
        <Onboarding
          step={step}
          setStep={setStep}
          data={data}
          setData={setData}
          onFinish={finishOnboarding}
          onExit={() => openAuth('login')}
        />
      )}
      {view === 'dashboard' && <Dashboard data={data} onLogout={logout} onArticle={openArticle} isBooting={isBooting} />}
      {contactOpen && <ContactModal contactSent={contactSent} setContactSent={setContactSent} onClose={closeContact} />}
    </main>
  )
}


function EvolvLoader() {
  return (
    <div className="evolv-loader" aria-label="Loading EVOLV">
      <div className="evolv-loader-core">
        <span className="evolv-loader-wordmark" style={{ fontSize: "1.15rem", fontWeight: 500, letterSpacing: "0.08em", color: "rgba(255,255,255,0.82)", textTransform: "lowercase" }}>[evolv]</span>
      </div>
    </div>
  )
}

function AuthPage({ mode, setMode, onSuccess, directSignup = false, onLegal }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(() => {
    const storedError = sessionStorage.getItem('evolv-auth-error')
    if (storedError) sessionStorage.removeItem('evolv-auth-error')
    return storedError || ''
  })
  const [message, setMessage] = useState('')
  const [authStage, setAuthStage] = useState('choices')
  const [showPassword, setShowPassword] = useState(false)

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
      sessionStorage.setItem('evolv-oauth-intent', 'signup')
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
        if (result.data.user) {
          void supabase.functions.invoke('founder-user-notifications', {
            body: { action: 'auth_signup', user_id: result.data.user.id },
          }).then(({ error }) => {
            if (error) console.warn('EVOLV founder signup notification failed:', error.message)
          }).catch((error) => {
            console.warn('EVOLV founder signup notification request failed:', error)
          })
        }
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
    <div className={`page-enter auth-page${directSignup ? ' auth-direct-page' : ''}`}>
      <main className="auth-shell">
        <div className="auth-welcome-mark" aria-hidden="true">
          <img src="/evolv-mark.svg" alt="" />
        </div>
        <header className="auth-intro">
          <h1>Welcome to EVOLV</h1>
          <p>Sign in and continue creating</p>
        </header>

        <button className="auth-signup-banner" type="button" onClick={() => {
          setMode('signup')
          setAuthStage('choices')
          setError('')
          setMessage('')
        }}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 10h18v4H3zM5 14v7h14v-7M12 10v11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 10H7.7a2.2 2.2 0 1 1 2.2-2.2c0 1.1 2.1 2.2 2.1 2.2ZM12 10h4.3a2.2 2.2 0 1 0-2.2-2.2C14.1 8.9 12 10 12 10Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Sign up with work email &amp; start evolving</span>
          <svg className="auth-banner-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="auth-provider-stack">
          <button className="auth-provider-button" type="button" onClick={() => continueWithProvider('google')} disabled={sending}>
            <svg className="auth-provider-icon auth-google-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path fill="#FFFFFF" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2l6.6 5.1c3.9-3.6 6.1-8.9 6.1-15Z"/>
              <path fill="#FFFFFF" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4l-6.8 5.2C7.3 39.4 15.1 44 24 44Z"/>
              <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7l-6.8-5.2a20.1 20.1 0 0 0 0 27.4l6.8-5.2a12 12 0 0 1 0-10Z"/>
              <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4 15.1 4 7.3 8.6 3.9 15.3l6.8 5.2c1.6-4.8 6.1-8.4 13.3-8.4Z"/>
            </svg>
            <span>{sending ? 'Connecting…' : 'Continue with Google'}</span>
          </button>
          <button className="auth-provider-button" type="button" onClick={() => continueWithProvider('github')} disabled={sending}>
            <svg className="auth-provider-icon auth-github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.75-1.32-3.75-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.71-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.12 2.95.71.78 1.14 1.77 1.14 2.99 0 4.27-2.6 5.21-5.08 5.49.4.34.76 1.02.76 2.06v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/>
            </svg>
            <span>{sending ? 'Connecting…' : 'Continue with GitHub'}</span>
          </button>
        </div>

        <div className="auth-divider auth-divider-compact"><span>OR</span></div>

        {authStage === 'choices' ? (
          <form className="auth-quick-form" onSubmit={(event) => {
            event.preventDefault()
            if (!email.trim()) {
              setError('Enter your work email to continue.')
              return
            }
            setError('')
            setMessage('')
            setAuthStage(mode === 'signup' ? 'password' : 'email')
          }}>
            <label htmlFor="auth-work-email">Work email</label>
            <input id="auth-work-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email" required />
            <button className="auth-continue-button" type="submit" disabled={sending}>
              <span>Continue</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </form>
        ) : (
          <section className="auth-email-step">
            <button className="auth-step-back" type="button" onClick={() => { setAuthStage('choices'); setError(''); setMessage('') }}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
            <h2>{mode === 'signup' ? 'Create your password' : 'Sign in with email'}</h2>
            <p className="auth-step-copy">{mode === 'signup' ? 'Use at least 8 characters to secure your account.' : 'Enter your password to continue.'}</p>
            <form className="auth-form" onSubmit={submit}>
              {mode === 'login' ? (
                <label>
                  <span>Work email</span>
                  <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email" autoFocus />
                </label>
              ) : (
                <div className="auth-email-summary">
                  <span>Work email</span>
                  <strong>{email}</strong>
                  <button type="button" onClick={() => setAuthStage('choices')}>Change</button>
                </div>
              )}
              <label>
                <span>Password</span>
                <div className="auth-password-wrap">
                  <input required minLength={mode === 'signup' ? 8 : undefined} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </label>
              {mode === 'login' && <button className="forgot-password" type="button" onClick={requestPasswordReset} disabled={sending}>Forgot password?</button>}
              {error && <p className="auth-error" role="alert">{error}</p>}
              {message && <p className="auth-message" role="status">{message}</p>}
              <button className="auth-continue-button" type="submit" disabled={sending}>
                <span>{sending ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}</span>
                {!sending && <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            </form>
          </section>
        )}

        {authStage === 'choices' && error && <p className="auth-error" role="alert">{error}</p>}
        {authStage === 'choices' && message && <p className="auth-message" role="status">{message}</p>}

        <div className="auth-account-switch">
          <span>{mode === 'signup' ? 'Already have an account?' : 'New to EVOLV?'}</span>
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setAuthStage('choices'); setEmail(''); setPassword(''); setError(''); setMessage('') }}>
            {mode === 'signup' ? 'Log in' : 'Create account'}
          </button>
        </div>
        <p className="auth-legal"><button type="button" onClick={() => onLegal?.('terms')}>Terms of Service</button><span aria-hidden="true"> · </span><button type="button" onClick={() => onLegal?.('privacy')}>Privacy Policy</button></p>
      </main>
    </div>
  )
}




function Brand() {
  return (
    <a className="brand" href="/" aria-label="EVOLV home">
      <img src="/evolv-mark.svg" alt="EVOLV" />
    </a>
  )
}


function Landing({onStart, onExplore, onArticle, onPricing, onContact, onLegal}) {
  const page = useRef(null)

  useLayoutEffect(() => {
    const pageEl = page.current
    if (!pageEl) return

    let ctx
    try {
      ctx = gsap.context(() => {
        const q = selector => pageEl.querySelectorAll(selector)

        gsap.timeline({ defaults: { ease: 'power4.out' } })
          .from(q('.ev-hero-eyebrow'), { y: 18, opacity: 0, duration: .55 })
          .from(q('.ev-hero-title-line'), { yPercent: 115, opacity: 0, duration: 1, stagger: .09 }, '-=.2')
          .from(q('.ev-hero-copy'), { y: 28, opacity: 0, duration: .65 }, '-=.55')
          .from(q('.ev-hero-actions'), { y: 18, opacity: 0, duration: .55 }, '-=.42')
          .from(q('.ev-hero-stage'), { y: 45, scale: .96, opacity: 0, duration: 1 }, '-=.7')

        gsap.to(q('.ev-orbit'), {
          rotation: 360,
          duration: 28,
          repeat: -1,
          ease: 'none',
        })

        q('.ev-reveal').forEach((element) => {
          gsap.fromTo(element,
            { y: 70, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 88%',
                end: 'top 52%',
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          )
        })

        q('.ev-service-row').forEach((element, index) => {
          gsap.fromTo(element,
            { x: index % 2 ? 45 : -45, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 92%',
                end: 'top 62%',
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          )
        })

        q('.ev-stat-number').forEach((element) => {
          const target = Number(element.dataset.value || 0)
          const counter = { value: 0 }
          gsap.to(counter, {
            value: target,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 82%',
              once: true,
            },
            onUpdate: () => {
              element.textContent = Math.round(counter.value).toLocaleString()
            },
          })
        })

        ScrollTrigger.refresh()
      }, pageEl)
    } catch (error) {
      console.error('EVOLV landing animation error:', error)
    }

    return () => ctx?.revert()
  }, [])

  useLayoutEffect(() => {
    window.addEventListener('evolv:open-contact', onContact)
    return () => window.removeEventListener('evolv:open-contact', onContact)
  }, [onContact])

  return (
    <div ref={page} className="page-enter landing landing-v2">
      <section className="ev-hero">
        <div className="ev-hero-background" aria-hidden="true">
          <PatternWaves
            preset="silk"
            pattern="line"
            wave="silk"
            color="var(--color-accent-blue)"
            backgroundColor="#050505"
            opacity={0.12}
            fade="center"
            fadeSize={0.82}
            speed={0.12}
            depth={0.52}
            shine={0.18}
            interactive={false}
            intro
            className="ev-hero-pattern"
          />
        </div>

        <div className="ev-hero-content">
          <div className="ev-hero-eyebrow"><span>A LITTLE SPACE TO GROW</span></div>
          <h1 className="ev-hero-title">
            <span className="ev-hero-title-line">Become more.</span>
            <span className="ev-hero-title-line"><em>On purpose.</em></span>
          </h1>
          <p className="ev-hero-copy">Understand yourself a little better. Build gentle routines. Grow at your own pace.</p>
          <div className="ev-hero-actions">
            <button className="ev-btn ev-btn-solid" type="button" onClick={onStart}>Start evolving <ArrowRight size={17} /></button>
            <button className="ev-btn ev-btn-line" type="button" onClick={onExplore}>Take a look around <ArrowDownRight size={17} /></button>
          </div>
        </div>

        <div className="ev-scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="ev-marquee" aria-label="EVOLV principles">
        <div className="ev-marquee-track">
          {[0,1].map(copy => (
            <div className="ev-marquee-content" key={copy} aria-hidden={copy === 1}>
              <span>DEFINE WHAT MATTERS</span><i className="ev-marquee-star" aria-hidden="true"><Asterisk size={16} strokeWidth={1.7} /></i><span>BUILD WITH INTENTION</span><i className="ev-marquee-star" aria-hidden="true"><Asterisk size={16} strokeWidth={1.7} /></i><span>TRACK YOUR MOMENTUM</span><i className="ev-marquee-star" aria-hidden="true"><Asterisk size={16} strokeWidth={1.7} /></i><span>REFLECT &amp; EVOLVE</span><i className="ev-marquee-star" aria-hidden="true"><Asterisk size={16} strokeWidth={1.7} /></i>
            </div>
          ))}
        </div>
      </section>

      <section className="ev-statement ev-reveal" id="story">
        <div className="ev-section-index">01</div>
        <div className="ev-statement-copy">
          <span className="ev-label">THE SHIFT</span>
          <h2>Your growth deserves<br /><em>a place to live.</em></h2>
          <p>A quiet place to check in, find your rhythm and make room for what matters.</p>
        </div>
      </section>

      <section className="ev-system ev-reveal" id="features">
        <div className="ev-section-head"><div><span className="ev-label">02 — THE SYSTEM</span><h2>Four moves.<br /><em>One direction.</em></h2></div><p>No pressure to change everything. Just a few gentle steps, when you're ready.</p></div>
        <div className="ev-system-steps">
          <div><Target className="ev-system-step-icon" size={22} strokeWidth={1.7} aria-hidden="true" /><div className="ev-system-step-copy"><strong>Notice</strong><small>Check in with yourself.</small></div></div>
          <div><Sprout className="ev-system-step-icon" size={22} strokeWidth={1.7} aria-hidden="true" /><div className="ev-system-step-copy"><strong>Choose</strong><small>Focus on what matters.</small></div></div>
          <div><TrendingUp className="ev-system-step-icon" size={22} strokeWidth={1.7} aria-hidden="true" /><div className="ev-system-step-copy"><strong>Practice</strong><small>Take one small step.</small></div></div>
          <div><Sparkles className="ev-system-step-icon" size={22} strokeWidth={1.7} aria-hidden="true" /><div className="ev-system-step-copy"><strong>Reflect</strong><small>Learn as you go.</small></div></div>
        </div>
      </section>

      <section className="ev-experience ev-reveal">
        <div className="ev-experience-copy">
          <span className="ev-label">03 — INSIDE EVOLV</span>
          <h2>Everything you need.<br /><em>Nothing you don't.</em></h2>
          <p>Your goals and check-ins, together in one calm space.</p>
          <button className="ev-text-link" type="button" onClick={onStart}>Enter your space <ArrowRight size={16} /></button>
        </div>
        <div className="ev-device">
          <div className="ev-device-top">
            <span className="ev-device-brand">EVOLV <i>/</i> OVERVIEW</span>
            <span className="ev-device-period"><span className="ev-device-live-dot" />THIS WEEK</span>
          </div>
          <div className="ev-device-body">
            <div className="ev-device-progress">
              <span className="ev-device-kicker">WEEKLY PROGRESS</span>
              <div className="ev-device-progress-value"><strong>72</strong><span>%</span></div>
              <div className="ev-device-progress-track" role="img" aria-label="72 percent progress"><span /></div>
              <small>You're building a steady rhythm.</small>
            </div>
            <div className="ev-device-list" aria-label="This week's focus">
              <div><span className="ev-device-status is-active" aria-hidden="true"><Check size={13} /></span><b>Build with intention</b><i>ACTIVE</i></div>
              <div><span className="ev-device-status is-progress" aria-hidden="true"><span /></span><b>Learn something new</b><i>IN PROGRESS</i></div>
              <div><span className="ev-device-status is-active" aria-hidden="true"><Check size={13} /></span><b>Show up today</b><i>ACTIVE</i></div>
              <div><span className="ev-device-status is-upcoming" aria-hidden="true"><CalendarClock size={13} /></span><b>Review the week</b><i>FRI</i></div>
            </div>
          </div>
          <div className="ev-device-bottom">
            <div className="ev-device-change"><strong>+18%</strong><span>FROM LAST WEEK</span></div>
            <span className="ev-device-track-status"><span />ON TRACK</span>
          </div>
        </div>
      </section>

      <section className="ev-areas ev-reveal" id="areas">
        <div className="ev-section-head"><div><span className="ev-label">04 — YOUR WORLD</span><h2>Grow across<br /><em>what matters.</em></h2></div><p>One system for the different parts of your life — without forcing everything into the same routine.</p></div>
        <div className="ev-service-list">
          {growthAreas.map((area, index) => (
            <button className="ev-service-row" key={area.id} type="button" onClick={() => onArticle('area', area.id)}>
              <span>0{index + 1}</span><strong>{area.title}</strong><small>{area.text}</small><ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </section>

      <section className="ev-faq ev-reveal" id="faq">
        <div><span className="ev-label">06 — QUESTIONS</span><h2>Before you<br /><em>begin.</em></h2></div>
        <div className="ev-faq-list">
          {[['What exactly is EVOLV?','A personal growth tracker for turning goals and intentions into visible progress.'],['What can I track?','Career, skills, money, health, lifestyle, creative work and other areas that matter to you.'],['Does my progress stay saved?','Yes. Your account keeps your goals and progress connected to you across sessions.'],['Can I change my goals later?','Absolutely. Growth changes with you, so your goals should be able to change too.']].map(([q,a]) => (
            <details className="ev-faq-item" key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <section className="ev-marquee-slanted ev-reveal" aria-label="Design, technology and intelligence">
        <div className="ev-marquee-slanted-band">
          <div className="ev-marquee-slanted-track" aria-hidden="true">
            {[0, 1].map(copy => (
              <div className="ev-marquee-slanted-content" key={copy} aria-hidden={copy === 1}>
                <span>DESIGN</span><i className="ev-marquee-separator" aria-hidden="true" /><span>TECHNOLOGY</span><i className="ev-marquee-separator" aria-hidden="true" /><span>INTELLIGENCE</span><i className="ev-marquee-separator" aria-hidden="true" /><span>DESIGN</span><i className="ev-marquee-separator" aria-hidden="true" /><span>TECHNOLOGY</span><i className="ev-marquee-separator" aria-hidden="true" /><span>INTELLIGENCE</span><i className="ev-marquee-separator" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ev-final ev-reveal">
        <div className="ev-final-watermark">EVOLV</div>
        <span className="ev-label">07 — YOUR NEXT SELF</span>
        <h2>You don't need<br />a new life.<br /><em>Just a new rhythm.</em></h2>
        <button className="ev-btn ev-btn-solid" type="button" onClick={onStart}>Start evolving <ArrowRight size={17} /></button>
      </section>

      <Footer onContact={onContact} onLegal={onLegal} />
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

const onboardingGoals = [
  { id: 'sleep', title: 'Sleep & consistency', icon: Moon },
  { id: 'mood', title: 'Mood & wellbeing', icon: HeartPulse },
  { id: 'self-care', title: 'Self-care', icon: Sparkles },
  { id: 'career', title: 'Learning & career', icon: BookOpen },
  { id: 'spending', title: 'Spending', icon: WalletCards, symbol: '$' },
]

const avatarStylePresets = {
  masculine: { presentation: 'masculine', face: 'angular', hair: 'fade', hairColor: '#171311', accessory: 'none' },
  feminine: { presentation: 'feminine', face: 'oval', hair: 'long', hairColor: '#211812', accessory: 'earrings' },
  androgynous: { presentation: 'androgynous', face: 'oval', hair: 'curls', hairColor: '#211812', accessory: 'none' },
}

function getAvatarPreset(style = 'androgynous') {
  return { ...DEFAULT_AVATAR, ...(avatarStylePresets[style] || avatarStylePresets.androgynous) }
}

function WelcomeScreen({ onGetStarted, onSignIn, onExplore }) {
  return (
    <div className="evolv-welcome page-enter">
      <div className="evolv-welcome-background" aria-hidden="true">
        <div className="evolv-welcome-vignette" />
      </div>
      <header className="evolv-welcome-header">
        <button className="evolv-welcome-wordmark" type="button" onClick={onExplore} aria-label="Explore EVOLV website">
          <img src="/evolv-mark.svg" alt="EVOLV" />
        </button>
      </header>
      <main className="evolv-welcome-content evolv-welcome-content--cinematic">
        <div className="evolv-welcome-visual" aria-label="A glowing orange crystal of energy">
          <div className="evolv-welcome-visual-grain" aria-hidden="true" />
          <CrystalizedBall
            preset="plasma"
            color="#E85A27"
            size={0.7}
            crackle={0.55}
            fill={0.5}
            interactive
            hoverStrength={0.55}
            strands={6}
            flares={0.55}
            glow={0.72}
            sparks={0.38}
            particleCount={5000}
            motion="rise"
            particleShape="square"
            depth={0.6}
            sway={0.45}
            twinkle={0.5}
            haze={0.58}
            dustSpeed={0.8}
            speed={0.72}
            intro
            paused={false}
          />
        </div>
        <section className="evolv-welcome-message">
          <h1>Become who<br />you’re <em>capable of.</em></h1>
          <p>Build better habits, understand yourself, and make progress at your own pace.</p>
          <button className="evolv-welcome-cta" type="button" onClick={onGetStarted}>Get started <ArrowRight size={18} /></button>
        </section>
      </main>
    </div>
  )
}

function Onboarding({ step, setStep, data, setData, onFinish }) {
  const stages = [
    { eyebrow: '', title: <>What should we<br /><em>call you?</em></>, type: 'name' },
    { eyebrow: '', title: <>Small steps.<br /><em>Real progress.</em></>, copy: 'EVOLV helps you notice your patterns, build steadier routines, and make thoughtful changes without pressure.', type: 'approach' },
    { eyebrow: '', title: <>What matters to<br /><em>you right now?</em></>, type: 'goals' },
    { eyebrow: 'READY WHEN YOU ARE', title: <>You’re all set{data.name ? `, ${getFirstName(data.name)}` : ''}.<br /><em>Let’s begin.</em></>, copy: 'Your journey to becoming your next self starts here.', type: 'ready' },
  ]
  const current = stages[step] || stages[0]
  const canContinue = current.type !== 'name' || data.name.trim().length > 0
  const avatarStyle = data.avatarStyle || 'androgynous'

  function next() {
    if (!canContinue) return
    if (step < stages.length - 1) setStep(step + 1)
    else onFinish()
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="evolv-onboarding page-enter">
      <div className="evolv-onboarding-background" aria-hidden="true">
        <PatternWaves
          preset="silk"
          pattern="line"
          wave="silk"
          color="var(--color-accent-blue)"
          backgroundColor="#050505"
          opacity={0.12}
          fade="center"
          fadeSize={0.82}
          speed={0.12}
          depth={0.52}
          shine={0.18}
          interactive={false}
          intro
          className="evolv-onboarding-pattern"
        />
        <div className="evolv-welcome-vignette" />
      </div>
      <header className="evolv-onboarding-header">
        <img src="/evolv-mark.svg" alt="EVOLV" />
        <div className="evolv-onboarding-step">{step + 1}<span> / {stages.length}</span></div>
      </header>
      <div className="evolv-onboarding-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={stages.length} aria-valuenow={step + 1}>{stages.map((stage, index) => <i key={stage.type} className={index <= step ? 'is-complete' : ''} />)}</div>
      <main className="evolv-onboarding-main" key={current.type}>
        <button className="evolv-onboarding-back" type="button" onClick={back} disabled={step === 0} aria-label="Go back"><ChevronLeft size={17} /><span>Back</span></button>
        <section className={`evolv-onboarding-stage evolv-onboarding-${current.type}`}>
          {current.eyebrow && <span className="evolv-onboarding-eyebrow">{current.eyebrow}</span>}
          <h1>{current.title}</h1>
          {current.copy && <p className="evolv-onboarding-copy">{current.copy}</p>}
          {current.type === 'name' && (
            <label className="evolv-onboarding-name">
              <span>Your preferred name</span>
              <input autoFocus value={data.name} onChange={event => setData({ ...data, name: event.target.value })} onKeyDown={event => { if (event.key === 'Enter' && canContinue) next() }} placeholder="e.g. Iman" autoComplete="given-name" maxLength={40} />
            </label>
          )}
          {current.type === 'approach' && (
            <div className="evolv-onboarding-approach">
              <div className="evolv-onboarding-approach-orbit" aria-hidden="true">
                <span className="evolv-onboarding-orbit-ring evolv-onboarding-orbit-ring-one" />
                <span className="evolv-onboarding-orbit-ring evolv-onboarding-orbit-ring-two" />
                <span className="evolv-onboarding-orbit-core"><Sparkles size={29} strokeWidth={1.5} /></span>
                <span className="evolv-onboarding-orbit-dot" />
              </div>
              <div className="evolv-onboarding-approach-list">
                <div className="evolv-onboarding-approach-item">
                  <span className="evolv-onboarding-approach-icon"><HeartPulse size={20} /></span>
                  <span><strong>Understand your patterns</strong><small>Check in with your energy, mood, and everyday life.</small></span>
                </div>
                <div className="evolv-onboarding-approach-item">
                  <span className="evolv-onboarding-approach-icon"><TrendingUp size={20} /></span>
                  <span><strong>Build consistency</strong><small>Turn small, realistic actions into routines that last.</small></span>
                </div>
                <div className="evolv-onboarding-approach-item">
                  <span className="evolv-onboarding-approach-icon"><Sparkles size={20} /></span>
                  <span><strong>Adjust as you grow</strong><small>Use what you learn to decide what comes next.</small></span>
                </div>
              </div>
            </div>
          )}
          {current.type === 'goals' && (
            <div className="evolv-onboarding-goals">
              {onboardingGoals.map(goal => {
                const selected = (data.areas || []).includes(goal.id)
                return (
                  <button type="button" key={goal.id} className={`evolv-onboarding-goal${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => setData({ ...data, areas: selected ? data.areas.filter(id => id !== goal.id) : [...(data.areas || []), goal.id] })}>
                    <span className="evolv-onboarding-goal-symbol">{goal.symbol ? <span className="evolv-onboarding-goal-dollar" aria-hidden="true">{goal.symbol}</span> : <goal.icon size={23} strokeWidth={1.8} aria-hidden="true" />}</span>
                    <span className="evolv-onboarding-goal-text"><strong>{goal.title}</strong></span>
                    <span className="evolv-onboarding-goal-check">{selected ? <Check size={15} /> : <Plus size={15} />}</span>
                  </button>
                )
              })}
            </div>
          )}
          {current.type === 'ready' && (
            <div className="evolv-onboarding-ready">
              <div className="evolv-onboarding-ready-mark" aria-hidden="true"><span><Check size={30} strokeWidth={1.8} /></span></div>
              <strong>{getFirstName(data.name) || 'Your next self'}</strong>
              <span>{(data.areas || []).length ? `${data.areas.length} ${(data.areas || []).length === 1 ? 'focus area' : 'focus areas'} selected` : 'Your journey, your pace'}</span>
            </div>
          )}
        </section>
        <footer className="evolv-onboarding-footer">
          {current.type === 'goals' && <button className="evolv-onboarding-skip" type="button" onClick={() => setStep(stages.length - 1)}>Skip for now</button>}
          <button className="evolv-onboarding-continue" type="button" disabled={!canContinue} onClick={next}>
            {current.type === 'ready' ? 'Enter EVOLV' : current.type === 'name' ? 'Continue' : current.type === 'approach' ? 'Continue' : 'Choose goals'} <ArrowRight size={17} />
          </button>
        </footer>
      </main>
    </div>
  )
}

function Dashboard({ data, onLogout, onArticle, isBooting = false }) {
  const [active,setActive]=useState('overview')
  const [desktopSidebarOpen,setDesktopSidebarOpen]=useState(false)
  const [logOpen,setLogOpen]=useState(false)
  const [quickLogOpen,setQuickLogOpen]=useState(false)
  const [quickLogInitialScreen,setQuickLogInitialScreen]=useState('menu')

  useEffect(()=>{
    const openDashboardNavigation=()=>setDesktopSidebarOpen(true)
    window.addEventListener('evolv-open-dashboard-navigation',openDashboardNavigation)
    return()=>window.removeEventListener('evolv-open-dashboard-navigation',openDashboardNavigation)
  },[])

  useEffect(()=>{
    const openWorkoutTracker=()=>{
      setQuickLogInitialScreen('workouts')
      setQuickLogOpen(true)
    }
    window.addEventListener('evolv-open-workout-tracker',openWorkoutTracker)
    return()=>window.removeEventListener('evolv-open-workout-tracker',openWorkoutTracker)
  },[])
  const [area,setArea]=useState(null)
  const [metric,setMetric]=useState(null)
  const [defs,setDefs]=useState([])
  const [logs,setLogs]=useState([])
  const [meals,setMeals]=useState([])
  const [goals,setGoals]=useState([])
  const [goalCheckins,setGoalCheckins]=useState([])
  const [dailyReflections,setDailyReflections]=useState([])
  const [goalMilestones,setGoalMilestones]=useState([])
  const [goalPlans,setGoalPlans]=useState({})
  const [goalCoachLoading,setGoalCoachLoading]=useState({})
  const [goalMilestoneDrafts,setGoalMilestoneDrafts]=useState({})
  const [goalType,setGoalType]=useState('project')
  const [goalNextAction,setGoalNextAction]=useState('')
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
  const [notificationsEnabled,setNotificationsEnabled]=useState(()=>localStorage.getItem('evolv-notifications-enabled')==='true')
  const defaultNotificationTimes={morning:true,hydration:false,reflection:false,aiNotificationFrequency:1,morningTime:'08:00',aiAfternoonTime:'14:00',reflectionTime:'20:00',quietHours:true,quietStart:'23:00',quietEnd:'07:00'}
  const [notificationTimes,setNotificationTimes]=useState(()=>{try{return {...defaultNotificationTimes,...JSON.parse(localStorage.getItem('evolv-notification-times')||'{}')}}catch{return defaultNotificationTimes}})
  const [reflectionTime,setReflectionTime]=useState(()=>localStorage.getItem('evolv-reflection-time')||'22:30')
  const [reflectionOpen,setReflectionOpen]=useState(()=>new URLSearchParams(window.location.search).get('reflection')==='1')
  const [reflectionStep,setReflectionStep]=useState(-1)
  const [reflectionType,setReflectionType]=useState('mood')
  const [reflectionMood,setReflectionMood]=useState(null)
  const [reflectionFeeling,setReflectionFeeling]=useState('')
  const [reflectionNote,setReflectionNote]=useState('')
  const [reflectionSaving,setReflectionSaving]=useState(false)
  const [avatarUrl,setAvatarUrl]=useState('')
  const [avatarUploading,setAvatarUploading]=useState(false)
  const avatarInputRef=useRef(null)
  const [deleting,setDeleting]=useState(false)
  const [error,setError]=useState('')
  const [progressRange,setProgressRange]=useState(7)
  const [progressMetric,setProgressMetric]=useState(null)
  const [selectedEntry,setSelectedEntry]=useState(null)
  const [editingEntry,setEditingEntry]=useState(null)
  const [manageLogsOpen,setManageLogsOpen]=useState(false)
  const dashboardMainRef=useRef(null)
  const goTo=(requestedPage, requestedArea=null)=>{
    let page=requestedPage
    if(page==='logs' || page==='log-detail'){
      localStorage.setItem('evolv-ai-start-new-chat','true')
      localStorage.setItem('evolv-ai-pending-prompt', 'Help me review my recent progress conversationally. Ask what I want to understand or update, use the context you already have, and help me make a useful next step. Do not open a generic log list or form.')
      window.dispatchEvent(new CustomEvent('evolv:start-new-chat'))
      page='ai'
    }
    setActive(page)
    // Area detail screens are rendered by DashboardPages under the shared
    // "area" route; keep the selected area when navigating into that page.
    setArea(page==='area' && ['health','nutrition','career','mind','life'].includes(requestedArea) ? requestedArea : null)
    setMetric(null)

    // Use a real URL fragment for dashboard navigation. Android's PWA
    // back button needs distinct history entries; pushing the exact same
    // URL with only history.state is unreliable in standalone PWAs.
    const nextUrl = window.location.pathname + window.location.search + '#dashboard=' + encodeURIComponent(page)
    window.history.pushState({evolvDashboard:true,page},'',nextUrl)
  }

  // Reset the viewport after the new dashboard page has rendered.
  // Scrolling inside goTo() happened before React replaced the page,
  // which could leave the newly opened section halfway down.
  useLayoutEffect(()=>{
    window.scrollTo({top:0,left:0,behavior:'instant'})
  },[active])

  useEffect(()=>{
    const hashPage=()=>{
      const match=window.location.hash.match(/^#dashboard=(.+)$/)
      return match ? decodeURIComponent(match[1]) : null
    }

    const currentPage=window.history.state?.evolvDashboard
      ? window.history.state.page
      : hashPage()

    if(currentPage){
      setActive(currentPage)
    }else{
      window.history.replaceState(
        {evolvDashboard:true,page:'overview'},
        '',
        window.location.pathname + window.location.search + '#dashboard=overview'
      )
    }

    function handleDashboardBack(){
      const page=window.history.state?.evolvDashboard
        ? window.history.state.page
        : (hashPage() || 'overview')

      setActive(page)
      setArea(null)
      setMetric(null)
      setLogOpen(false)
      window.requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}))
    }

    window.addEventListener('popstate',handleDashboardBack)
    return()=>window.removeEventListener('popstate',handleDashboardBack)
  },[])

  const areas={
    health:{title:'Health',icon:HeartPulse,color:'#ff8f87'},
    nutrition:{title:'Nutrition',icon:Apple,color:'#ffd66b'},
    money:{title:'Money',icon:WalletCards,color:'var(--color-accent-blue)'},
    career:{title:'Career',icon:BriefcaseBusiness,color:'var(--color-accent-blue)'},
    mind:{title:'Mind',icon:Brain,color:'var(--color-accent-blue)'},
    life:{title:'Life',icon:Sprout,color:'var(--color-accent-blue)'}
  }
  const metricArea={sleep:'health',water:'health',steps:'health',exercise:'health',energy:'health',weight:'health',mood:'mind',focus:'mind',reflection:'mind',stress:'mind',learning:'career',building:'career',outreach:'career',applications:'career',skills:'career',income:'money',spending:'money',savings:'money',bills:'money',habits:'life',reading:'life',social:'life',personal:'life',meals:'nutrition'}
  const icons={sleep:Moon,water:Droplets,steps:Footprints,exercise:Dumbbell,energy:Zap,weight:Scale,mood:Smile,focus:Focus,reflection:NotebookPen,stress:Brain,learning:BookOpen,building:BriefcaseBusiness,outreach:Send,applications:Receipt,skills:Sparkles,income:ArrowDownLeft,spending:ArrowUpRight,savings:PiggyBank,bills:Receipt,habits:CheckCircle2,reading:BookOpen,social:Users,personal:Sprout,meals:Utensils}
  const name=profile?.first_name||data.name||'there'
  const latest=defs.reduce((acc,d)=>{const x=logs.find(l=>l.metric_id===d.id);if(x)acc[d.slug]=x;return acc},{})
  // Use the user's actual device timezone for the dashboard day. ISO slicing is UTC-based and can put late-night Lagos logs on the wrong date.
  const today=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
  const localDateKey=(value)=>value?new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)):''
  const todayLogs=logs.filter(x=>localDateKey(x.logged_at)===today)
  const todayMeals=meals.filter(x=>localDateKey(x.logged_at)===today)

  useEffect(()=>{
    async function refreshAiTracking(){
      const {data:a}=await supabase.auth.getUser()
      const u=a?.user
      if(!u)return
      const [{data:l},{data:m},{data:g},{data:gc},{data:gm},{data:dr}]=await Promise.all([
        supabase.from('metric_logs').select('id,metric_id,value,unit,note,metadata,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(500),
        supabase.from('meal_logs').select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(200),
        supabase.from('goals').select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').eq('user_id',u.id).order('created_at',{ascending:false}),
        supabase.from('goal_checkins').select('id,goal_id,user_id,checkin_date,note,created_at').eq('user_id',u.id).order('checkin_date',{ascending:false}).limit(2000),
        supabase.from('goal_milestones').select('id,goal_id,user_id,title,sort_order,is_completed,created_at,completed_at').eq('user_id',u.id).order('sort_order',{ascending:true}),
        supabase.from('daily_reflections').select('id,reflection_date,mood,day_feeling,note,created_at').eq('user_id',u.id).order('reflection_date',{ascending:false}).limit(30)
      ])
      if(l)setLogs(l)
      if(m)setMeals(m)
      if(g)setGoals(g)
      if(gc)setGoalCheckins(gc)
      if(gm)setGoalMilestones(gm)
      if(dr)setDailyReflections(dr)
    }

    window.addEventListener('evolv-tracking-updated',refreshAiTracking)
    return()=>window.removeEventListener('evolv-tracking-updated',refreshAiTracking)
  },[])

  useEffect(()=>{let mounted=true;async function load(){setLoading(true);const {data:a}=await supabase.auth.getUser();const u=a?.user;if(!u){await onLogout();return}
    const [p,d,l,m,g,n,gc,gm,dr]=await Promise.all([
      supabase.from('profiles').select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url').eq('id',u.id).maybeSingle(),
      supabase.from('metric_definitions').select('id,slug,name,area,unit,value_type,icon,color').eq('is_active',true).order('area').order('name'),
      supabase.from('metric_logs').select('id,metric_id,value,unit,note,metadata,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(500),
      supabase.from('meal_logs').select('id,meal_type,description,calories,protein_g,carbs_g,fat_g,water_ml,note,logged_at,created_at').eq('user_id',u.id).order('logged_at',{ascending:false}).limit(200),
      supabase.from('goals').select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').order('created_at',{ascending:false}),
      supabase.from('notification_delivery_log').select('id,delivery_date,kind,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(50),
      supabase.from('goal_checkins').select('id,goal_id,user_id,checkin_date,note,created_at').eq('user_id',u.id).order('checkin_date',{ascending:false}).limit(2000),
      supabase.from('goal_milestones').select('id,goal_id,user_id,title,sort_order,is_completed,created_at,completed_at').eq('user_id',u.id).order('sort_order',{ascending:true}),
      supabase.from('daily_reflections').select('id,reflection_date,mood,day_feeling,note,created_at').eq('user_id',u.id).order('reflection_date',{ascending:false}).limit(30)
     ]);if(!mounted)return;if(p.data){setProfile({...p.data,email:u.email||'',user_metadata:u.user_metadata||{}});setProfileName(p.data.first_name||'')}
    setAvatarUrl(p.data?.avatar_url||u.user_metadata?.avatar_url||localStorage.getItem('evolv-avatar-'+u.id)||'');
    setDefs(d.data||[]);
    setLogs(l.data||[]);setMeals(m.data||[]);setGoals(g.data||[]);setNotifications(n.data||[]);setGoalCheckins(gc.data||[]);setGoalMilestones(gm.data||[]);setDailyReflections(dr.data||[]);if(d.error||l.error||m.error||g.error||n.error||gc.error||gm.error||dr.error)setError('Some tracking data could not be loaded.');setLoading(false)}load();return()=>{mounted=false}},[onLogout])

  useEffect(()=>{
    if(active!=='notifications') return
    let mounted=true
    async function refreshNotifications(){
      const {data:a}=await supabase.auth.getUser()
      const u=a?.user
      if(!u)return
      const {data:n}=await supabase.from('notification_delivery_log').select('id,delivery_date,kind,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(50)
      if(mounted && n) setNotifications(n)
    }
    refreshNotifications()
    const timer=window.setInterval(refreshNotifications,30000)
    return()=>{mounted=false;window.clearInterval(timer)}
  },[active])

  async function deleteNotification(notification){
    if(!notification?.id) return
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u) return

    setNotifications(current=>current.filter(item=>item.id!==notification.id))
    const {error:x}=await supabase
      .from('notification_delivery_log')
      .delete()
      .eq('id',notification.id)
      .eq('user_id',u.id)

    if(x){
      setError('Could not delete that notification. Please try again.')
      setNotifications(current=>current.some(item=>item.id===notification.id)?current:[notification,...current])
    }
  }

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
  function openLog(a=null,m=null){
    const selected = m || (a ? defs.find(item => item.area === a) : null)
    let prompt = 'Help me check in on my day. Ask me one question at a time, understand what I tell you, and update my Evolv progress only when you have enough information. Do not give me a generic form.'
    if(selected?.slug === 'sleep'){
      prompt = 'Help me log my sleep in Evolv through conversation. Ask when I went to bed and when I woke up, one question at a time. Calculate the total sleep duration, confirm it with me, then save the sleep duration and bedtime/wake-up details using the available tracking tools. If I do not know an exact time, help me estimate only when I explicitly agree; never invent details. After saving, briefly interpret the duration against a healthy sleep routine.'
    }else if(selected?.slug === 'steps'){
      prompt = 'Help me log my daily steps in Evolv. Ask how many steps I have taken today, and whether the number comes from my phone, smartwatch, or fitness tracker. Do not invent or automatically claim access to device step data. Once I provide the count, confirm it and save the actual step count using the available tracking tool. If I do not know the count, help me find it on my device instead of showing a generic form.'
    }else if(selected?.slug === 'water'){
      prompt = 'Help me track my water intake in Evolv conversationally. Ask how much water I have had today using familiar amounts such as cups, bottles, millilitres, or litres. Convert the amount consistently, confirm the total, and save it using the available tracking tool. Ask one question at a time, and do not show a generic form or guess an amount.'
    }else if(selected?.slug === 'meals' || selected?.value_type === 'meal' || a === 'nutrition'){
      prompt = 'Help me record a meal in Evolv. Ask me naturally what I ate and roughly when, then save the meal using the available tool. Keep it conversational and do not show me a generic form.'
    }else if(selected){
      prompt = 'Help me update my Evolv ' + selected.name + ' record through conversation. Ask me what you need in plain language, one question at a time, then save it using the available tracking tool. Do not show me a generic form or ask me to enter a random value without context.'
    }
    localStorage.setItem('evolv-ai-start-new-chat','true')
    localStorage.setItem('evolv-ai-pending-prompt', prompt)
    window.dispatchEvent(new CustomEvent('evolv:start-new-chat'))
    setLogOpen(false)
    setEditingEntry(null)
    setSelectedEntry(null)
    goTo('ai')
    setError('')
  }
  function openQuickLogManual(choice){
    setQuickLogOpen(false)
    setQuickLogInitialScreen('menu')
    setError('')
    setEditingEntry(null)
    if(choice==='money'){
      goTo('money')
      return
    }
    if(['health','nutrition','career','mind','life'].includes(choice)){
      // Open the real area page directly. Its trackers are presented as simple
      // options, rather than opening another nested set of logging cards.
      goTo('area',choice)
      return
    }
    const selected=choice==='meal'
      ? {slug:'meals',name:'Meal',value_type:'meal'}
      : defs.find(item=>item.slug===choice)
    if(!selected){
      setError('That tracker is not available yet. Please refresh and try again.')
      return
    }
    if(['sleep','steps','water'].includes(selected.slug)){
      openLog(selected.area || 'health', selected)
      return
    }
    setArea(choice==='meal'?'nutrition':'health')
    setMetric(selected)
    setLogOpen(true)
  }

  function closeLogSheet(){
    setLogOpen(false)
    setArea(null)
    setMetric(null)
    setEditingEntry(null)
    setError('')
  }

  function openQuickLogAI(prompt){
    // Every Ask AI logging handoff starts a separate conversation.
    // Existing conversations remain available in AI chat history.
    localStorage.setItem('evolv-ai-start-new-chat','true')
    window.dispatchEvent(new CustomEvent('evolv:start-new-chat'))
    if(prompt) localStorage.setItem('evolv-ai-pending-prompt',prompt)
    setQuickLogOpen(false)
    setQuickLogInitialScreen('menu')
    setLogOpen(false)
    setEditingEntry(null)
    setSelectedEntry(null)
    setError('')
    goTo('ai')
  }
  function openEntry(item){
    const entry=item.entry
    const definition=item.type==='log'?defs.find(d=>d.id===entry.metric_id):null
    setSelectedEntry({type:item.type,entry,definition})
    goTo('log-detail')
  }
  function startEditEntry(item){
    const entry=item.entry
    const definition=item.type==='log'
      ? defs.find(d=>String(d.id)===String(entry.metric_id))
      : null

    if(item.type==='log' && !definition)return

    const entryLabel = item.type === 'meal' ? 'meal' : (definition?.name || 'progress')
    localStorage.setItem('evolv-ai-start-new-chat','true')
    localStorage.setItem('evolv-ai-pending-prompt', 'I want to update or correct my existing ' + entryLabel + ' record in Evolv. Help me do it conversationally. Ask what needs changing, confirm the details, and use the available tools if you can update it safely. Do not open a generic form.')
    window.dispatchEvent(new CustomEvent('evolv:start-new-chat'))
    setSelectedEntry(null)
    setEditingEntry(null)

    if(item.type==='meal'){
      setArea('nutrition')
      setMetric({slug:'meals',name:'Meal',value_type:'meal',color:'#ffb84d'})
    }else{
      setArea(metricArea[definition.slug]||definition.area)
      setMetric(definition)
    }

    setLogOpen(false)
    goTo('ai')
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
  async function checkInGoal(goal, rawNote = ''){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u||!goal?.id)return false
    const todayKey=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
    if(goalCheckins.some(item=>item.goal_id===goal.id && item.checkin_date===todayKey)){
      setError('You’ve already recorded this habit today. Your progress is already up to date.')
      return false
    }
    const note=String(rawNote||'').trim()
    const {data:entry,error:x}=await supabase.from('goal_checkins').insert({goal_id:goal.id,user_id:u.id,checkin_date:todayKey,note:note||null}).select('id,goal_id,user_id,checkin_date,note,created_at').single()
    if(x){setError(x.code==='23505'?'You’ve already recorded this habit today. Your progress is already up to date.':x.message);return false}
    setGoalCheckins(current=>[entry,...current])
    setError('')
    return true
  }
  async function addGoalMilestone(goal, rawTitle, requestedOrder){
    const title=String(rawTitle||'').trim()
    if(!title||!goal?.id)return false
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return false
    const current=goalMilestones.filter(item=>item.goal_id===goal.id)
    const {data:item,error:x}=await supabase.from('goal_milestones').insert({goal_id:goal.id,user_id:u.id,title,sort_order:Number.isInteger(requestedOrder)?requestedOrder:current.length}).select('id,goal_id,user_id,title,sort_order,is_completed,created_at,completed_at').single()
    if(x){setError(x.message);return false}
    setGoalMilestones(items=>[...items,item].sort((left,right)=>left.sort_order-right.sort_order))
    return true
  }
  async function toggleGoalMilestone(milestone){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const next=!milestone.is_completed
    const {data:item,error:x}=await supabase.from('goal_milestones').update({is_completed:next,completed_at:next?new Date().toISOString():null}).eq('id',milestone.id).eq('user_id',u.id).select('id,goal_id,user_id,title,sort_order,is_completed,created_at,completed_at').single()
    if(x){setError(x.message);return}
    const group=[...goalMilestones.filter(current=>current.goal_id===item.goal_id&&current.id!==item.id),item]
    setGoalMilestones(items=>items.map(current=>current.id===item.id?item:current))
    const progress=group.length?Math.round(group.filter(current=>current.is_completed).length/group.length*100):0
    const goal=goals.find(current=>current.id===item.goal_id)
    if(goal&&(goal.goal_type||'project')!=='habit')await updateGoal(goal,{progress,status:progress>=100?'completed':goal.status==='completed'?'active':goal.status})
  }
  async function deleteGoalMilestone(milestone){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const {error:x}=await supabase.from('goal_milestones').delete().eq('id',milestone.id).eq('user_id',u.id)
    if(x){setError(x.message);return}
    const remaining=goalMilestones.filter(item=>item.goal_id===milestone.goal_id&&item.id!==milestone.id)
    setGoalMilestones(items=>items.filter(item=>item.id!==milestone.id))
    const goal=goals.find(item=>item.id===milestone.goal_id)
    if(goal&&(goal.goal_type||'project')!=='habit'&&remaining.length){const progress=Math.round(remaining.filter(item=>item.is_completed).length/remaining.length*100);await updateGoal(goal,{progress,status:progress>=100?'completed':goal.status==='completed'?'active':goal.status})}
  }
  async function generateGoalPlan(goal){
    if(!goal?.id)return
    setGoalCoachLoading(current=>({...current,[goal.id]:true}))
    setError('')
    try{
      const existing=goalMilestones.filter(item=>item.goal_id===goal.id).map(item=>item.title)
      const prompt=['Act as the goal planning coach inside EVOLV. Create a realistic, specific plan for this user goal.','Return ONLY valid JSON with exactly this shape: {"next_action":"one concrete action the user can do next","milestones":["milestone 1","milestone 2","milestone 3"]}.','Provide 3 to 5 milestones for a project goal, or 3 to 5 repeatable checkpoints for a habit goal. Keep each short, concrete, and measurable where possible.','Do not invent current progress. Avoid motivational filler. Do not include markdown fences or text outside the JSON.','Goal type: '+(goal.goal_type||'project'),'Goal title: '+goal.title,'Description: '+(goal.description||'Not provided'),'Target date: '+(goal.due_date||'Not set'),'Current progress: '+(goal.progress||0)+'%','Recent check-ins: '+(goalCheckins.filter(item=>item.goal_id===goal.id).slice(0,14).map(item=>item.checkin_date).join(', ')||'None recorded'),'Current next action: '+(goal.next_action||'Not set'),'Existing milestones (avoid duplicating): '+(existing.join('; ')||'None')].join('\n')
      const {data:result,error:invokeError}=await supabase.functions.invoke('evolv-ai',{body:{messages:[{role:'user',content:prompt}],profile:{first_name:profile?.first_name||data.name||'',focus:profile?.focus||'',growth_areas:profile?.growth_areas||[]}}})
      if(invokeError)throw invokeError
      if(result?.error)throw new Error(result.error)
      const raw=String(result?.reply||'').replace(/^\s*```(?:json)?/i,'').replace(/```\s*$/,'').trim()
      const start=raw.indexOf('{'),end=raw.lastIndexOf('}')
      if(start<0||end<start)throw new Error('The coach returned an incomplete plan. Please try again.')
      const parsed=JSON.parse(raw.slice(start,end+1))
      const plan={next_action:String(parsed.next_action||'').trim(),milestones:Array.isArray(parsed.milestones)?parsed.milestones.map(item=>String(item).trim()).filter(Boolean).slice(0,5):[]}
      if(!plan.next_action||!plan.milestones.length)throw new Error('The coach returned an incomplete plan. Please try again.')
      setGoalPlans(current=>({...current,[goal.id]:plan}))
    }catch(error){setError(error?.message||'Could not build a goal plan right now. Please try again.')}finally{setGoalCoachLoading(current=>({...current,[goal.id]:false}))}
  }
  async function applyGoalPlan(goal){
    const plan=goalPlans[goal.id]
    if(!plan)return
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const {data:updated,error:x}=await supabase.from('goals').update({next_action:plan.next_action,updated_at:new Date().toISOString()}).eq('id',goal.id).eq('user_id',u.id).select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').single()
    if(x){setError(x.message);return}
    setGoals(current=>current.map(item=>item.id===goal.id?updated:item))
    let order=goalMilestones.filter(item=>item.goal_id===goal.id).length
    for(const title of plan.milestones){const exists=goalMilestones.some(item=>item.goal_id===goal.id&&item.title.toLowerCase()===title.toLowerCase());if(!exists){await addGoalMilestone(goal,title,order);order+=1}}
    setGoalPlans(current=>({...current,[goal.id]:null}))
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
      due_date:goalDueDate||null,status:'active',progress:0,goal_type:goalType,next_action:goalNextAction.trim()||null
    }).select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').single()
    setSaving(false)
    if(x){setError(x.message);return}
    setGoals(c=>[g,...c]);setGoalTitle('');setGoalDescription('');setGoalDueDate('');setGoalType('project');setGoalNextAction('')
  }
  function beginGoalEdit(g){
    setEditingGoal(g)
    setGoalTitle(g.title||'')
    setGoalDescription(g.description||'')
    setGoalDueDate(g.due_date||'')
    setGoalType(g.goal_type||'project')
    setGoalNextAction(g.next_action||'')
  }
  async function saveGoalEdit(e){
    e.preventDefault()
    if(!editingGoal||!goalTitle.trim())return
    setSaving(true)
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u){setSaving(false);return}
    const {data:g,error:x}=await supabase.from('goals').update({
      title:goalTitle.trim(),description:goalDescription.trim()||null,due_date:goalDueDate||null,goal_type:goalType,next_action:goalNextAction.trim()||null,updated_at:new Date().toISOString()
    }).eq('id',editingGoal.id).eq('user_id',u.id).select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').single()
    setSaving(false)
    if(x){setError(x.message);return}
    setGoals(c=>c.map(item=>item.id===g.id?g:item))
    setEditingGoal(null);setGoalTitle('');setGoalDescription('');setGoalDueDate('');setGoalType('project');setGoalNextAction('')
  }
  async function updateGoal(g,changes){
    const {data:a}=await supabase.auth.getUser()
    const u=a?.user
    if(!u)return
    const {data:updated,error:x}=await supabase.from('goals').update({...changes,updated_at:new Date().toISOString()}).eq('id',g.id).eq('user_id',u.id).select('id,title,description,status,progress,due_date,created_at,updated_at,goal_type,next_action').single()
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
  async function saveProfile(e,overrides={}){
    e?.preventDefault?.()
    const nextName=String(overrides.name??profileName).trim()
    const nextEmail=String(overrides.email??'').trim().toLowerCase()
    const nextBio=String(overrides.bio??'').trim()

    if(!nextName){
      setProfileMessage('Name is required.')
      throw new Error('Name is required.')
    }

    const {data:a,error:userError}=await supabase.auth.getUser()
    const u=a?.user
    if(userError||!u){
      setProfileMessage('Your session has expired. Please sign in again.')
      throw userError||new Error('Your session has expired.')
    }

    const {data:p,error:x}=await supabase
      .from('profiles')
      .update({first_name:nextName,updated_at:new Date().toISOString()})
      .eq('id',u.id)
      .select('id,first_name,growth_areas,focus,first_goal,created_at,avatar_url')
      .single()

    if(x){
      setProfileMessage('Could not save your profile.')
      throw x
    }

    const currentEmail=u.email||''
    const authPayload={data:{...(u.user_metadata||{}),bio:nextBio}}
    if(nextEmail && nextEmail!==currentEmail) authPayload.email=nextEmail

    const {data:updatedAuth,error:authError}=await supabase.auth.updateUser(authPayload)
    if(authError){
      setProfileMessage(authError.message||'Could not update your account details.')
      throw authError
    }

    setProfile({...p,email:updatedAuth?.user?.email||nextEmail||currentEmail,user_metadata:updatedAuth?.user?.user_metadata||authPayload.data})
    setProfileName(nextName)
    setProfileMessage(nextEmail&&nextEmail!==currentEmail?'Profile saved. Check your email to confirm the new address.':'Profile saved.')
  }
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
    let latestPreferences = {}
    try { latestPreferences = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}') } catch {}
    const next={...notificationTimes,...latestPreferences,...nextOverrides}
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
      let latestPreferences = {}
      try { latestPreferences = JSON.parse(localStorage.getItem('evolv-notification-times') || '{}') } catch {}
      const saved=await syncPushSettings({
        subscription:subscription.toJSON(),
        timezone,
        preferences:{...notificationTimes,...latestPreferences},
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

  async function saveNotificationFrequency(value){
    const frequency=Math.max(1,Math.min(6,Number(value)||1))
    const next={...notificationTimes,aiNotificationFrequency:frequency,morning:true,hydration:frequency>=4,reflection:frequency>=3}
    persistNotificationTimes(next)
    if(notificationsEnabled){
      const synced=await syncCurrentPushSettings(next)
      if(!synced) setProfileMessage('Saved on this device. EVOLV could not sync the notification schedule yet.')
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
    setReflectionStep(-1)
    setReflectionType('mood')
    setReflectionMood(null)
    setReflectionFeeling('')
    setReflectionNote('')
    setReflectionOpen(true)
    window.history.replaceState({},'',window.location.pathname)
  }

  function closeReflection(){
    setReflectionOpen(false)
    setReflectionStep(-1)
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
      mood:({depressed:1,sad:1,numb:2,overwhelmed:2,anxious:2,mixed:3,normal:3,calm:4,hopeful:4,happy:5})[reflectionMood] ?? 3,
      day_feeling:reflectionType==='mood'?(reflectionFeeling||null):null,
      note:reflectionNote.trim()||null,
      updated_at:new Date().toISOString()
    },{onConflict:'user_id,reflection_date'})
    setReflectionSaving(false)
    if(reflectionError){
      setProfileMessage('Your reflection could not be saved. Please try again.')
      return
    }
    recordStreakDay('reflection')
    closeReflection()
    setProfileMessage('Reflection saved.')

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
  async function deleteAccount(){
    if(deleting) return false
    setDeleting(true)

    try{
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const session = sessionData?.session

      if(sessionError) throw sessionError
      if(!session?.access_token) throw new Error('Your session has expired. Sign in again before deleting your account.')

      // Use the shared Supabase client so the function URL, API key and current
      // access token are supplied consistently with the rest of EVOLV.
      const { data: deletionData, error: deletionError } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      })

      if(deletionError){
        let detail = ''
        try {
          const response = deletionError.context
          if(response && typeof response.clone === 'function'){
            const body = await response.clone().json()
            detail = body?.error || body?.message || body?.details || ''
          }
        } catch {}
        throw new Error(detail || deletionError.message || 'The delete-account service rejected the request.')
      }
      if(deletionData?.error) throw new Error(deletionData.error)
      if(deletionData?.success === false) throw new Error(deletionData.message || 'EVOLV could not delete your account.')

      // The account is gone. Clear the local session and device-only state.
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if(signOutError) console.warn('EVOLV account was deleted, but local sign-out returned an error:', signOutError)

      localStorage.removeItem('evolv-view')
      localStorage.removeItem('evolv-onboarding')
      localStorage.removeItem('evolv-notifications-enabled')
      localStorage.removeItem('evolv-notification-times')
      localStorage.removeItem('evolv-reflection-time')
      sessionStorage.removeItem('evolv-oauth-intent')
      sessionStorage.removeItem('evolv-auth-error')

      // Return to account creation after the deleted account has been cleared.
      localStorage.setItem('evolv-view','auth')
      window.location.href='/signup'
      return true
    }catch(error){
      console.error('EVOLV account deletion failed:',error)
      throw new Error(error?.message || 'Could not delete your EVOLV account. Please try again.')
    }finally{
      setDeleting(false)
    }
  }

  useEffect(()=>{
    function handleProfileUpdated(event){
      const detail=event.detail||{}
      if(detail.first_name)setProfileName(detail.first_name)
      if(Object.prototype.hasOwnProperty.call(detail,'avatar_url'))setAvatarUrl(detail.avatar_url||'')
      setProfile(current=>current?{...current,...detail}:current)
    }
    window.addEventListener('evolv-profile-updated',handleProfileUpdated)
    return()=>window.removeEventListener('evolv-profile-updated',handleProfileUpdated)
  },[])

  const pageProps = {
    active, setActive, area, setArea, metric, setMetric, defs, logs, meals, goals, goalCheckins, goalMilestones, goalPlans, goalCoachLoading, goalMilestoneDrafts, setGoalMilestoneDrafts, goalType, setGoalType, goalNextAction, setGoalNextAction, profile,
    loading, notifications, saving, goalTitle, setGoalTitle, goalDescription, setGoalDescription,
    goalDueDate, setGoalDueDate, editingGoal, setEditingGoal, profileName, setProfileName,
    profileMessage,
    notificationsEnabled, notificationTimes, reflectionTime, reflectionOpen, reflectionStep,
    reflectionMood, reflectionFeeling, reflectionNote, reflectionSaving, avatarUrl, avatarUploading,
    avatarInputRef, deleting, error, progressRange, setProgressRange, progressMetric,
    setProgressMetric, selectedEntry, editingEntry, manageLogsOpen, setManageLogsOpen, dashboardMainRef,
    goTo, areas, metricArea, icons, name, latest, today, todayLogs, todayMeals, dailyReflections, valueText, openLog,
    openEntry, startEditEntry, deleteEntry, handleLogSaved, createGoal, beginGoalEdit, saveGoalEdit,
    updateGoal, deleteGoal, checkInGoal, addGoalMilestone, toggleGoalMilestone, deleteGoalMilestone, generateGoalPlan, applyGoalPlan, saveProfile,
    toggleNotifications, toggleNotificationTime, saveNotificationTime, saveNotificationFrequency, toggleQuietHours, saveQuietHour, deleteNotification,
    openReflection, setReflectionOpen, deleteAccount, onLogout, onArticle, data,
    handleAvatarChange, removeAvatar, setProfileMessage,
    WeeklyProgressChart,
  }

  return <div className={`page-enter dashboard ${active==='ai'?'dashboard-ai-active':''}`}>
    <DesktopSidebar active={active} onNavigate={goTo} open={desktopSidebarOpen} onToggle={setDesktopSidebarOpen}/>
    {active !== 'ai' && active !== 'profile' && <header className="app-topbar"><button className="app-logo-button" onClick={()=>goTo('overview')} aria-label="Go to home"><Brand/></button><div className="app-topbar-actions"><button className="routine-nav-button" onClick={()=>goTo('routine')} aria-label="Open daily routine" title="Daily routine"><CalendarClock size={18}/><span>Routine</span></button><StreakWidget/><button className="notification-button" onClick={()=>goTo('notifications')} aria-label="Open notifications" title="Notifications"><Bell size={17}/></button></div></header>}
    <main className="dash-main">
      {error&&<p className="auth-error" role="alert">{error}</p>}
      {active==='ai'
        ? <EvolvAI key="evolv-ai-page" profile={profile} goals={goals} checkins={goalCheckins} reflections={dailyReflections} momentum={new Set([...logs.map(item=>localDateKey(item.logged_at||item.created_at)),...meals.map(item=>localDateKey(item.logged_at||item.created_at)),...goalCheckins.map(item=>item.checkin_date)].filter(date=>date && date >= localDateKey(new Date(Date.now()-6*86400000)))).size} logs={logs} meals={meals} definitions={defs}/>
        : <DashboardPages active={active} pageProps={pageProps}/>
      }
    </main>
    {active!=='ai'&&<BottomNav active={active} onNavigate={goTo} avatarUrl={avatarUrl}/>}
    {!isBooting&&active!=='ai'&&!reflectionOpen&&!logOpen&&createPortal(<button type="button" className={"evolv-floating-log evolv-floating-log-intro"+(quickLogOpen?" is-open":"")} onClick={()=>{if(quickLogOpen){setQuickLogOpen(false);setQuickLogInitialScreen('menu')}else{setQuickLogInitialScreen('menu');setQuickLogOpen(true)}}} aria-label={quickLogOpen?"Close log menu":"Log an activity"} aria-expanded={quickLogOpen}><span className="evolv-floating-log-icon">{quickLogOpen?<X size={22} strokeWidth={2.4}/>:<Plus size={22} strokeWidth={2.4}/>}</span><span>Log</span></button>, document.body)}
    {quickLogOpen&&createPortal(<QuickLogSheet initialScreen={quickLogInitialScreen} onClose={()=>{setQuickLogOpen(false);setQuickLogInitialScreen('menu')}} onLogWithAI={openQuickLogAI} onLogManual={openQuickLogManual} />, document.body)}
    {logOpen&&<LogSheet area={area} metric={metric} definitions={defs} saving={saving} setSaving={setSaving} editEntry={editingEntry} onArea={setArea} onMetric={setMetric} onSaved={handleLogSaved} onClose={closeLogSheet}/>}
    <PWAInstallPrompt />
    
    {reflectionOpen&&<DailyReflectionSheet step={reflectionStep} setStep={setReflectionStep} mood={reflectionMood} setMood={setReflectionMood} feeling={reflectionFeeling} setFeeling={setReflectionFeeling} note={reflectionNote} setNote={setReflectionNote} saving={reflectionSaving} type={reflectionType} setType={setReflectionType} onSave={saveReflection} onClose={closeReflection}/>}
  </div>
}

function DailyReflectionSheet({step,setStep,mood,setMood,feeling,setFeeling,note,setNote,saving,type,setType,onSave,onClose}){
  const [currentTime,setCurrentTime]=useState(()=>new Date())
  const [emotionValue,setEmotionValue]=useState(50)
  useEffect(()=>{
    let timer
    const tick=()=>{
      const now=new Date()
      setCurrentTime(now)
      timer=window.setTimeout(tick,60000-(now.getSeconds()*1000+now.getMilliseconds())+50)
    }
    const onVisibility=()=>{if(!document.hidden){window.clearTimeout(timer);tick()}}
    tick()
    document.addEventListener('visibilitychange',onVisibility)
    return ()=>{window.clearTimeout(timer);document.removeEventListener('visibilitychange',onVisibility)}
  },[])
  const timeLabel=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(currentTime)
  const emotionLevels=[
    {label:'Very unpleasant',emoji:'😖',mood:'sad'},
    {label:'Unpleasant',emoji:'😟',mood:'sad'},
    {label:'Slightly unpleasant',emoji:'😕',mood:'anxious'},
    {label:'Neutral',emoji:'😐',mood:'normal'},
    {label:'Slightly pleasant',emoji:'🙂',mood:'happy'},
    {label:'Pleasant',emoji:'😊',mood:'happy'},
    {label:'Very pleasant',emoji:'😄',mood:'hopeful'}
  ]
  // Keep the hue map centralized so the emotional colour range is easy to tune.
  const HUES=[[0,268],[20,225],[40,165],[55,110],[65,62],[75,40],[100,26]]
  const hueAt=value=>{
    for(let index=1;index<HUES.length;index++){
      if(value<=HUES[index][0]){
        const [aValue,aHue]=HUES[index-1]
        const [bValue,bHue]=HUES[index]
        return aHue+(bHue-aHue)*(value-aValue)/(bValue-aValue)
      }
    }
    return HUES[HUES.length-1][1]
  }
  const emotionIndex=Math.min(6,Math.floor(emotionValue/(100/7)))
  const selectedEmotion=emotionLevels[emotionIndex]
  const emotionHue=hueAt(emotionValue)
  const characters=[
    {emoji:'😌',x:'10%',y:'8%',size:42,duration:'4.6s',delay:'0s'},
    {emoji:'😄',x:'27%',y:'0%',size:56,duration:'5.4s',delay:'.6s'},
    {emoji:'🤔',x:'2%',y:'43%',size:46,duration:'5s',delay:'1.1s'},
    {emoji:'😴',x:'35%',y:'64%',size:36,duration:'4.2s',delay:'.3s'},
    {emoji:'🥰',x:'42%',y:'15%',size:70,duration:'5.8s',delay:'.9s'},
    {emoji:'😎',x:'69%',y:'2%',size:55,duration:'4.9s',delay:'1.4s'},
    {emoji:'😵‍💫',x:'84%',y:'43%',size:40,duration:'5.2s',delay:'.2s'},
  ]
  function chooseEmotion(value){
    const nextValue=Math.max(0,Math.min(100,Number(value)))
    const nextIndex=Math.min(6,Math.floor(nextValue/(100/7)))
    setEmotionValue(nextValue)
    setMood(emotionLevels[nextIndex].mood)
    setFeeling(emotionLevels[nextIndex].label)
  }
  function startSelectedFlow(){
    if(type==='emotion'){
      chooseEmotion(emotionValue)
      setStep(0)
      return
    }
    // TODO: Design the dedicated Mood screen. Keep the user's selection intact meanwhile.
    setStep(2)
  }
  function emitEmotionEvent(name,detail){
    document.dispatchEvent(new CustomEvent(name,{detail,bubbles:true}))
  }
  function goBackToChoice(){
    emitEmotionEvent('emotionstep:back')
    setStep(-1)
  }
  function closeReflection(){
    emitEmotionEvent('emotionstep:close')
    onClose()
  }
  function continueEmotion(){
    emitEmotionEvent('emotionstep:next',{value:emotionValue,label:selectedEmotion.label,emoji:selectedEmotion.emoji})
    setMood(selectedEmotion.mood)
    setFeeling(selectedEmotion.label)
    setStep(1)
  }
  return <div className="reflection-overlay" role="dialog" aria-modal="true" aria-label="Daily reflection">
    <div className={'reflection-sheet'+(step===-1?' reflection-sheet-intro':'')+(step===0?' reflection-sheet-emotion':'')}>
      <div className="reflection-sheet-handle"/>
      {step===-1 ? <>
        <button type="button" className="mood-card-close" onClick={closeReflection} aria-label="Close reflection"><X size={18}/></button>
        <div className="mood-card-stage" aria-hidden="true">{characters.map((item,index)=><span key={index} className="mood-card-character" style={{'--mc-x':item.x,'--mc-y':item.y,'--mc-size':item.size+'px','--mc-duration':item.duration,'--mc-delay':item.delay}}>{item.emoji}</span>)}</div>
        <h2 className="mood-card-title">Log an Emotion<br/>or Mood</h2>
        <div className="mood-card-options" role="radiogroup" aria-label="What do you want to log?">
          <button type="button" role="radio" aria-checked={type==='emotion'} className={'mood-card-option'+(type==='emotion'?' selected':'')} onClick={()=>setType('emotion')}>
            <span className="mood-card-option-label"><Activity size={17}/> Emotion</span>
            <span className="mood-card-option-headline">How you feel right now</span>
            <span className="mood-card-option-time">{timeLabel}</span>
            <Check className="mood-card-check" size={23}/>
          </button>
          <button type="button" role="radio" aria-checked={type==='mood'} className={'mood-card-option'+(type==='mood'?' selected':'')} onClick={()=>setType('mood')}>
            <span className="mood-card-option-label"><Sunrise size={17}/> Mood</span>
            <span className="mood-card-option-headline">How you’ve felt overall today</span>
            <Check className="mood-card-check" size={23}/>
          </button>
        </div>
        <button className="mood-card-next" type="button" onClick={startSelectedFlow}>Next <ArrowRight size={17}/></button>
      </> : step===0 ? <>
        <section className="emo-step" aria-labelledby="emo-title" style={{'--emo-h':emotionHue,'--emo-glow':(0.12+emotionValue/100*0.18).toFixed(3),'--emo-scale':(0.84+emotionValue/100*0.16).toFixed(3)}}>
          <header className="emo-step__bar">
            <button className="emo-btn" type="button" onClick={goBackToChoice} aria-label="Back"><ChevronLeft size={20}/></button>
            <span className="emo-step__bartitle">Emotion</span>
            <button className="emo-btn" type="button" onClick={closeReflection} aria-label="Close"><X size={18}/></button>
          </header>
          <h3 className="emo-step__title" id="emo-title">Choose how you’re<br className="emo-title-break"/> feeling right now</h3>
          <div className="emo-step__emoji-stage" aria-hidden="true">
            <span className="emo-step__emoji" key={selectedEmotion.emoji}>{selectedEmotion.emoji}</span>
          </div>
          <p className="emo-step__label" aria-live="polite">{selectedEmotion.label}</p>
          <div className="emo-slider">
            <input type="range" min="0" max="100" step="1" value={emotionValue} onChange={event=>chooseEmotion(event.target.value)} aria-label="How pleasant do you feel right now" aria-valuetext={selectedEmotion.label}/>
          </div>
          <div className="emo-step__ends"><span>Very unpleasant</span><span>Very pleasant</span></div>
          <button className="emo-step__next" type="button" onClick={continueEmotion}>Next <ArrowRight size={17}/></button>
        </section>
      </> : step===2 ? <>
        <header className="emo-step__bar emo-step__todo-bar">
          <button className="emo-btn" type="button" onClick={()=>setStep(-1)} aria-label="Back"><ChevronLeft size={20}/></button>
          <span className="emo-step__bartitle">Mood</span>
          <button className="emo-btn" type="button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </header>
        <div className="reflection-step emo-mood-todo">
          <span className="reflection-kicker">COMING NEXT</span>
          <h2>The Mood check-in</h2>
          <p>This screen is not designed yet. Your Mood selection is still selected, so you can go back without losing it.</p>
          {/* TODO: Design the separate Mood screen; do not reuse the Emotion check-in. */}
          <div className="reflection-step-actions"><button type="button" className="reflection-back" onClick={goBackToChoice}><ChevronLeft size={15}/> Back</button></div>
        </div>
      </> : <>
        <div className="reflection-sheet-head"><div><span className="section-label">EMOTION CHECK-IN</span><span className="reflection-step-label">2 / 2</span></div><button type="button" className="reflection-close" onClick={onClose} aria-label="Close reflection"><X size={18}/></button></div>
        <div className="reflection-step">
          <span className="reflection-kicker">A LITTLE SPACE</span>
          <h2>Anything on your mind?</h2>
          <p>Want to add context to how you feel right now? This is optional.</p>
          <textarea className="reflection-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="Write anything you want to remember…" rows={5}/>
          <div className="reflection-step-actions"><button type="button" className="reflection-back" onClick={()=>setStep(0)}><ChevronLeft size={15}/> Back</button><button className="button button-primary reflection-next" type="button" onClick={onSave} disabled={saving}>{saving?'Saving…':'Save reflection'} {!saving&&<Check size={16}/>}</button></div>
        </div>
        <div className="reflection-progress"><span className="active"/><span className="active"/></div>
      </>}
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
    <div className="special-log-intro"><strong>Make space for connection.</strong><span>Capture the kind of social time you had, who it was with and how it left you feeling.</span></div>
    {input('Who were you with?','person','text','e.g. Friends, family, colleagues')}
    {choices('What kind of connection was this?','connectionType',[
      {value:'catch-up',label:'Catch-up'},{value:'event',label:'Event'},{value:'conversation',label:'Conversation'},
      {value:'call',label:'Call'},{value:'new-connection',label:'New connection'},{value:'family-time',label:'Family time'}
    ])}
    {input('What did you do?','activity','text','e.g. Dinner, played football, talked for hours')}
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
    <div className="special-log-intro"><strong>How are you feeling?</strong><span>No ratings. Choose the words that feel closest to your actual experience.</span></div>
    {choices('Your mood','moodLabel',[
      {value:'happy',label:'Happy'},{value:'normal',label:'Feeling normal'},{value:'mixed',label:'Mixed feelings'},
      {value:'hopeful',label:'Hopeful'},{value:'calm',label:'Calm'},{value:'anxious',label:'Anxious'},
      {value:'overwhelmed',label:'Overwhelmed'},{value:'frustrated',label:'Frustrated'},
      {value:'sad',label:'Sad'},{value:'depressed',label:'Depressed'},{value:'numb',label:'Numb'},{value:'tired',label:'Tired'}
    ])}
    {input('What might be affecting how you feel?','context','text','e.g. Sleep, work, relationships, or nothing specific')}
    {choices('Energy right now','energyLabel',[
      {value:'low',label:'Low'},{value:'steady',label:'Steady'},{value:'high',label:'High'}
    ])}
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
  const workoutSections={
    chest:{label:'Chest day',exercises:['Barbell bench press','Incline dumbbell press','Dumbbell bench press','Chest fly','Cable crossover','Push-ups','Dips']},
    back:{label:'Back day',exercises:['Pull-ups','Lat pulldown','Barbell row','Seated cable row','Single-arm dumbbell row','Face pulls','Deadlift']},
    legs:{label:'Leg day',exercises:['Back squat','Front squat','Romanian deadlift','Leg press','Walking lunges','Bulgarian split squat','Leg extension','Leg curl','Calf raises']},
    shoulders:{label:'Shoulders',exercises:['Overhead press','Dumbbell shoulder press','Arnold press','Lateral raises','Front raises','Rear delt fly','Upright row']},
    arms:{label:'Arms',exercises:['Barbell curl','Dumbbell curls','Hammer curls','Tricep pushdown','Skull crushers','Overhead tricep extension','Dips']},
    core:{label:'Core',exercises:['Plank','Hanging knee raises','Leg raises','Cable crunches','Russian twists','Bicycle crunches','Ab wheel rollout']},
    full:{label:'Full body',exercises:['Squats','Deadlift','Bench press','Pull-ups','Overhead press','Dumbbell row','Walking lunges']}
  }
  const rows=values.exerciseRows||[]
  const workoutType=values.workoutType||'chest'
  const availableExercises=workoutSections[workoutType]?.exercises||workoutSections.chest.exercises
  function updateRow(index,key,value){setValues(v=>({...v,exerciseRows:(v.exerciseRows||[]).map((row,i)=>i===index?{...row,[key]:value}:row)}))}
  function changeNumber(index,key,delta){const row=rows[index];const next=Math.max(0,(Number(row?.[key])||0)+delta);updateRow(index,key,next)}
  function changeWorkoutType(type){const firstExercise=workoutSections[type]?.exercises?.[0]||'Barbell bench press';setValues(v=>({...v,workoutType:type,exerciseRows:(v.exerciseRows||[]).map((row,index)=>index===0?{...row,exercise:workoutSections[type].exercises.includes(row.exercise)?row.exercise:firstExercise}:row)}))}
  function addRow(){setValues(v=>({...v,exerciseRows:[...(v.exerciseRows||[]),{exercise:availableExercises[0],sets:3,reps:8,weight:''}]}))}
  function removeRow(index){setValues(v=>({...v,exerciseRows:(v.exerciseRows||[]).filter((_,i)=>i!==index)}))}
  const totalReps=rows.reduce((sum,row)=>sum+(Number(row.sets)||0)*(Number(row.reps)||0),0)
  return <div className="exercise-log-fields">
    <div className="workout-compact-heading"><strong>Workout</strong><span>Choose a focus and record your sets.</span></div>
    <div className="log-field-group workout-section-picker"><div className="log-field-title"><span>Training focus</span></div><div className="workout-section-grid">{Object.entries(workoutSections).map(([key,section])=><button type="button" key={key} className={workoutType===key?'active':''} onClick={()=>changeWorkoutType(key)}>{section.label}</button>)}</div></div>
    <div className="exercise-session-label"><span>{workoutSections[workoutType].label}</span></div>
    <div className="exercise-row-list">{rows.map((row,index)=><div className="exercise-entry" key={index}>
      <div className="exercise-entry-head"><span>Exercise {index+1}</span>{rows.length>1&&<button type="button" onClick={()=>removeRow(index)} aria-label="Remove exercise"><X size={15}/></button>}</div>
      <label className="log-input-label"><span>Exercise</span><select value={row.exercise} onChange={e=>updateRow(index,'exercise',e.target.value)}>{availableExercises.map(name=><option key={name}>{name}</option>)}</select></label>
      <div className="exercise-number-grid">{[['sets','Sets'],['reps','Reps']].map(([key,label])=><div className="exercise-picker" key={key}><span>{label}</span><div><button type="button" onClick={()=>changeNumber(index,key,-1)} aria-label={'Decrease '+label}>−</button><strong>{row[key]||0}</strong><button type="button" onClick={()=>changeNumber(index,key,1)} aria-label={'Increase '+label}>+</button></div></div>)}</div>
      <label className="log-input-label"><span>Weight <small>optional · kg</small></span><input type="number" min="0" step="0.5" value={row.weight??''} onChange={e=>updateRow(index,'weight',e.target.value)} placeholder="0"/></label>
    </div>)}</div>
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

  useEffect(()=>{
    const body=document.body
    const scrollY=window.scrollY
    const previous={overflow:body.style.overflow,position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width}
    body.style.overflow='hidden'
    body.style.position='fixed'
    body.style.top=`-${scrollY}px`
    body.style.left='0'
    body.style.right='0'
    body.style.width='100%'
    return()=>{
      body.style.overflow=previous.overflow
      body.style.position=previous.position
      body.style.top=previous.top
      body.style.left=previous.left
      body.style.right=previous.right
      body.style.width=previous.width
      window.scrollTo(0,scrollY)
    }
  },[])

  const areaMeta={
    health:{title:'Health',icon:HeartPulse,color:'#ff6b72',description:'Sleep, movement, hydration and everyday wellbeing.'},
    nutrition:{title:'Nutrition',icon:Apple,color:'#F5B84B',description:'Meals, nourishment and the details you want to remember.'},
    money:{title:'Money',icon:WalletCards,color:'#34D399',description:'Income, spending, savings and the bills you need to stay on top of.'},
    career:{title:'Career',icon:BriefcaseBusiness,color:'var(--color-accent-blue)',description:'Applications, learning, projects, skills and outreach.'},
    mind:{title:'Mind',icon:Brain,color:'var(--color-accent-blue)',description:'Mood, focus, reflection and the moments that shape your inner life.'},
    life:{title:'Life',icon:Sprout,color:'#4ADE80',description:'Habits, reading, people and time spent on yourself.'}
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

  const metricIconColors={
    sleep:'#F5B84B',water:'var(--color-accent-blue)',steps:'#F59E0B',exercise:'#FF6B6B',energy:'#FACC15',weight:'#2DD4BF',
    mood:'#FB7185',focus:'var(--color-accent-blue)',reflection:'var(--color-accent-blue)',stress:'#F97316',
    learning:'var(--graph-blue-cyan)',building:'var(--graph-blue-light)',outreach:'#F472B6',applications:'#FBBF24',skills:'#34D399',
    income:'#34D399',spending:'#FB7185',savings:'#2DD4BF',bills:'#FBBF24',
    habits:'#A3E635',reading:'var(--color-accent-blue)',social:'#F472B6',personal:'#2DD4BF',meals:'#FB923C'
  }

  const rows=definitions.filter(d=>metricArea[d.slug]===area && d.slug!=='exercise')

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
    if(editEntry || !metric || Object.keys(values).length) return
    const now=new Date()
    const loggedAt=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16)
    if(metric.value_type==='meal' || metric.slug==='meals'){
      setValues({meal_type:'breakfast',description:'',calories:'',protein_g:'',carbs_g:'',fat_g:'',water_ml:'',note:'',logged_at:loggedAt})
    }else if(metric.slug==='sleep'){
      setValues({bedtime:'23:00',wake_up:'07:00',wake_up_date:new Date().toISOString().slice(0,10)})
    }else if(metric.slug==='water'){
      setValues({logged_at:loggedAt,waterAmount:'',waterMeasure:'cup'})
    }else{
      setValues({logged_at:loggedAt})
    }
  },[metric,editEntry,values])

  useEffect(()=>{
    const previousOverflow=document.body.style.overflow
    document.body.style.overflow='hidden'

    function handleKey(event){
      if(event.key==='Escape'&&!saving) onClose()
    }

    window.addEventListener('keydown',handleKey)
    window.setTimeout(()=>sheetRef.current?.querySelector('button,input,textarea')?.focus(),80)

    return ()=>{
      document.body.style.overflow=previousOverflow
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
    if(slug==='mood') {
      const moodScores={depressed:1,sad:1.5,numb:2,overwhelmed:2,anxious:2.5,frustrated:2.5,tired:2.5,mixed:3,normal:3,calm:3.5,hopeful:4,happy:5}
      return moodScores[values.moodLabel] ?? 3
    }
    if(slug==='stress') return Number(values.level)
    return Number(values.value)
  }

  function specialNote(){
    const slug=metric?.slug
    if(slug==='exercise'){
      const workoutLabels={chest:'Chest day',back:'Back day',legs:'Leg day',shoulders:'Shoulders',arms:'Arms',core:'Core',full:'Full body'}
      const exercises=(values.exerciseRows||[])
        .filter(row=>(Number(row.sets)||0)>0&&(Number(row.reps)||0)>0)
        .map(row=>row.exercise+': '+row.sets+'×'+row.reps+(Number(row.weight)>0?' @ '+row.weight+'kg':''))
      return [values.workoutType&&'Workout: '+(workoutLabels[values.workoutType]||values.workoutType),...exercises].filter(Boolean).join(' · ') || null
    }
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
    if(slug==='social') return [clean(values.person)&&'With: '+clean(values.person),clean(values.connectionType)&&'Connection: '+clean(values.connectionType),clean(values.activity)&&'Activity: '+clean(values.activity),clean(values.note)].filter(Boolean).join(' · ')
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
      if(!Number.isFinite(value)||(value<0)||(metric.slug==='water'&&value<=0)){
        setError(metric.slug==='water'?'Enter an amount of water greater than zero.':'Complete the main detail before saving.')
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

    if(!Number.isFinite(value)||(metric.slug==='sleep'&&(!Number.isFinite(sleepMinutes)||sleepMinutes<=0))||(metric.value_type==='scale'&&metric.slug!=='sleep'&&(value<1||value>5))){
      setError(metric.slug==='sleep'?'Choose a bedtime and wake-up time.':metric.value_type==='scale'&&metric.slug!=='sleep'?'Choose a valid option.':'Enter a valid value.')
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
      : nextMetric.slug==='exercise' ? {logged_at:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),workoutType:'chest',exerciseRows:[{exercise:'Barbell bench press',sets:3,reps:8,weight:''}]}
         : {logged_at:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)})
    setError('')
  }

  const I=metric?(icons[metric.slug]||Sparkles):(area?areaMeta[area].icon:ClipboardPlus)

  return (
    <div
      className={`log-overlay log-page-mode ${metric?.slug==='exercise'?'workout-log-active':''}`}
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
                          <span className="log-choice-icon" style={{'--area-color':metricIconColors[d.slug]||d.color||areaMeta[area].color}}><M size={22}/></span>
                          <strong style={{'--card-color':d.color||areaMeta[area].color}}>{d.name}</strong>
                        </span>
                        <ChevronRight className="log-card-chevron" size={22}/>
                      </span>
                      <span className="log-card-bottom">
                        <span className="log-card-count"><strong>{hint}</strong></span>
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
                      <span className="log-card-count"><strong>Meal entry</strong></span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {metric&&metric.value_type!=='meal'&&(
            <div className="log-form">
              <div className="log-selected-metric">
                <span className="log-choice-icon" style={{'--metric-color':metric.color||'var(--color-accent-blue)'}}><I size={19}/></span>
                <div><strong>{metric.name}</strong><small>{metric.unit||'Your entry'}</small></div>
              </div>

              {specialMetric?(
                <>{metric.slug==='exercise'?<ExerciseFields values={values} setValues={setValues}/>:<SpecialMetricFields metric={metric} values={values} setValues={setValues}/>}</>
              ):metric.value_type==='scale'&&metric.slug!=='sleep'?(
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
            <button className="button button-primary log-save" type="button" onClick={save} disabled={saving}>
              {saving?'Saving…':editing?'Save changes':'Save '+metric.name}
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
              <stop offset="0%" stopColor="color-mix(in srgb, var(--color-accent-blue) 28.000000000000004%, transparent)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--color-accent-blue) 0%, transparent)" />
            </linearGradient>
          </defs>
          <path d={`${path} L 280 108 L 20 108 Z`} fill="url(#weeklyFlowFill)" />
          <path d={path} fill="none" stroke="color-mix(in srgb, var(--color-accent-blue) 95%, transparent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(point => (
            <circle key={point.key} cx={point.x} cy={point.y} r={point.count ? 4 : 2.5} fill="color-mix(in srgb, var(--color-accent-blue) 100%, transparent)" />
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
