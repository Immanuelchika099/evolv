import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share } from 'lucide-react'
import './PWAInstallPrompt.css'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function getAndroidLaunchIntent() {
  const destination = new URL(window.location.href)
  destination.searchParams.delete('evolv-install-complete')
  const fallback = new URL(destination.href)
  fallback.searchParams.set('evolv-install-complete', '1')
  const path = `${destination.pathname}${destination.search}${destination.hash}`

  return `intent://${destination.host}${path}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`
}

function openInstalledAndroidApp() {
  window.location.href = getAndroidLaunchIntent()
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [busy, setBusy] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (!isMobile() || isStandalone()) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('evolv-install-complete') === '1') {
      params.delete('evolv-install-complete')
      const cleanUrl = `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', cleanUrl)
      setInstalled(true)
      setVisible(true)
      return
    }

    const iosDevice = isIOS()
    const androidDevice = isAndroid()
    setIos(iosDevice)

    const dismissedUntil = Number(localStorage.getItem('evolv-install-dismissed-until') || 0)
    if (dismissedUntil > Date.now()) return

    let launchTimer

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }

    function handleInstalled() {
      setInstallEvent(null)
      setVisible(false)
      setInstalled(true)
      localStorage.removeItem('evolv-install-dismissed-until')

      // Android browsers keep the current tab open after installation.
      // Try handing the same URL to Android so the installed PWA can open.
      // If the browser cannot transfer it, the intent fallback shows a
      // lightweight screen with a manual retry instead of silently failing.
      if (androidDevice) {
        launchTimer = window.setTimeout(openInstalledAndroidApp, 2200)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    if (iosDevice) {
      const timer = window.setTimeout(() => setVisible(true), 700)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
      }
    }

    if (androidDevice) {
      const timer = window.setTimeout(() => setVisible(true), 1200)
      return () => {
        window.clearTimeout(timer)
        window.clearTimeout(launchTimer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [visible])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(
      'evolv-install-dismissed-until',
      String(Date.now() + 1000 * 60 * 60 * 24 * 7)
    )
    setVisible(false)
    setShowInstructions(false)
    setInstalled(false)
  }

  async function continueInstall() {
    if (ios) {
      // iOS requires the user to use Safari's Share menu.
      dismiss()
      return
    }

    if (installEvent) {
      setBusy(true)
      try {
        const promptEvent = installEvent
        setInstallEvent(null)
        await promptEvent.prompt()
        const result = await promptEvent.userChoice
        if (result?.outcome === 'accepted') {
          // appinstalled will attempt to open the newly installed app.
          setVisible(false)
          setShowInstructions(false)
          return
        }
      } catch {
        // Fall back to browser-menu instructions below.
      } finally {
        setBusy(false)
      }
    }

    setShowInstructions(true)
  }

  return createPortal(
    <div className="pwa-install-wrap" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <section className="pwa-install-card">
        <div className="pwa-install-copy">
          {installed ? (
            <>
              <h1 id="pwa-install-title">Evolv is installed</h1>
              <p>Your app is ready. If Android did not open it automatically, tap below to try opening the installed app.</p>
              <button className="pwa-install-button" type="button" onClick={openInstalledAndroidApp}>
                Open Evolv
              </button>
              <button className="pwa-install-later" type="button" onClick={dismiss}>Continue in browser</button>
            </>
          ) : (
            <>
              <h1 id="pwa-install-title">Welcome to Evolv</h1>
              <p>For the best experience we strongly recommend installing the web app:</p>

              {ios ? (
                <div className="pwa-install-steps">
                  <div className="pwa-install-step">
                    <span className="pwa-install-step-number">1.</span>
                    <span className="pwa-install-step-content">Tap <span className="pwa-share-symbol" aria-label="Share"><Share size={19} strokeWidth={2.1} /></span></span>
                  </div>
                  <div className="pwa-install-step">
                    <span className="pwa-install-step-number">2.</span>
                    <span className="pwa-install-step-content">Tap <strong>Add to Home Screen</strong></span>
                  </div>
                  <p className="pwa-install-hint">Use Safari's Share button, then choose Add to Home Screen.</p>
                </div>
              ) : showInstructions ? (
                <div className="pwa-install-steps">
                  <div className="pwa-install-step">
                    <span className="pwa-install-step-number">1.</span>
                    <span className="pwa-install-step-content">Open your browser menu.</span>
                  </div>
                  <div className="pwa-install-step">
                    <span className="pwa-install-step-number">2.</span>
                    <span className="pwa-install-step-content">Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                  </div>
                </div>
              ) : (
                <div className="pwa-install-steps">
                  <div className="pwa-install-step">
                    <span className="pwa-install-step-number">1.</span>
                    <span className="pwa-install-step-content">Tap Continue to open your browser's install prompt.</span>
                  </div>
                </div>
              )}

              <button className="pwa-install-button" type="button" onClick={continueInstall} disabled={busy}>
                {busy ? 'Opening…' : 'Continue'}
              </button>
              <button className="pwa-install-later" type="button" onClick={dismiss}>Maybe later</button>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  )
}
