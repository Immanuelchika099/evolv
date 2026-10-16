import { useEffect, useState } from 'react'
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

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isMobile() || isStandalone()) return

    const iosDevice = isIOS()
    const androidDevice = isAndroid()
    setIos(iosDevice)

    const dismissedUntil = Number(localStorage.getItem('evolv-install-dismissed-until') || 0)
    if (dismissedUntil > Date.now()) return

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }

    function handleInstalled() {
      setVisible(false)
      setInstallEvent(null)
      localStorage.removeItem('evolv-install-dismissed-until')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    // iOS does not expose a native install prompt, so explain its
    // Share → Add to Home Screen flow directly in the welcome screen.
    if (iosDevice) {
      const timer = window.setTimeout(() => setVisible(true), 700)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
      }
    }

    // Some Android browsers do not expose beforeinstallprompt.
    if (androidDevice) {
      const timer = window.setTimeout(() => setVisible(true), 1200)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(
      'evolv-install-dismissed-until',
      String(Date.now() + 1000 * 60 * 60 * 24 * 7)
    )
    setVisible(false)
    setShowInstructions(false)
  }

  async function continueInstall() {
    if (ios) {
      // iOS requires the user to use Safari's Share menu; a website
      // cannot open Add to Home Screen or install itself automatically.
      dismiss()
      return
    }

    if (installEvent) {
      setBusy(true)
      try {
        installEvent.prompt()
        const result = await installEvent.userChoice
        if (result?.outcome === 'accepted') {
          setVisible(false)
          setInstallEvent(null)
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

  return (
    <div className="pwa-install-wrap" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <section className="pwa-install-card">
        <div className="pwa-install-copy">
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
        </div>
      </section>
    </div>
  )
}
