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
  }

  async function continueInstall() {
    if (ios) {
      // iOS has no web API for opening the native Add to Home Screen sheet.
      // Keep the user in Evolv and reveal a short, clear Safari walkthrough.
      setShowInstructions(true)
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

  return createPortal(
    <div className="pwa-install-wrap" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <section className="pwa-install-card">
        <div className="pwa-install-copy">
          <h1 id="pwa-install-title">Welcome to Evolv</h1>
          <p>{ios
            ? (showInstructions
              ? 'Add Evolv to your Home Screen in a few quick steps.'
              : 'Keep Evolv one tap away by adding it to your iPhone Home Screen.')
            : 'For the best experience, install Evolv on your device.'}</p>

          {ios && showInstructions ? (
            <div className="pwa-install-steps">
              <div className="pwa-install-step">
                <span className="pwa-install-step-number">1.</span>
                <span className="pwa-install-step-content">Open this page in <strong>Safari</strong> if you are using another browser or an in-app browser.</span>
              </div>
              <div className="pwa-install-step">
                <span className="pwa-install-step-number">2.</span>
                <span className="pwa-install-step-content">Tap the <strong>Share</strong> button <span className="pwa-share-symbol" aria-label="Share"><Share size={19} strokeWidth={2.1} /></span></span>
              </div>
              <div className="pwa-install-step">
                <span className="pwa-install-step-number">3.</span>
                <span className="pwa-install-step-content">Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span>
              </div>
              <p className="pwa-install-hint">iPhone does not let websites open this system menu automatically. These steps finish the installation.</p>
            </div>
          ) : ios ? (
            <div className="pwa-install-steps">
              <div className="pwa-install-step">
                <span className="pwa-install-step-content">Your iPhone will guide you through the final step. It only takes a moment.</span>
              </div>
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

          <button className="pwa-install-button" type="button" onClick={ios && showInstructions ? dismiss : continueInstall} disabled={busy}>
            {busy ? 'Opening…' : ios && showInstructions ? 'Got it' : ios ? 'Show me how' : 'Continue'}
          </button>

          <button className="pwa-install-later" type="button" onClick={dismiss}>Maybe later</button>
        </div>
      </section>
    </div>,
    document.body
  )
}
