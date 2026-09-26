import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
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
  const [android, setAndroid] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (!isMobile() || isStandalone()) return

    const iosDevice = isIOS()
    const androidDevice = isAndroid()

    setIos(iosDevice)
    setAndroid(androidDevice)

    const dismissedUntil = Number(localStorage.getItem('evolv-install-dismissed-until') || 0)
    if (dismissedUntil > Date.now()) return

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS does not expose beforeinstallprompt, so give Safari users
    // the same install path with clear Add to Home Screen guidance.
    if (iosDevice) {
      const timer = window.setTimeout(() => setVisible(true), 900)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    // Android browsers that do not expose beforeinstallprompt can still
    // install from their browser menu.
    if (androidDevice) {
      const timer = window.setTimeout(() => setVisible(true), 1400)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    if (!visible) return

    function handleInstalled() {
      setVisible(false)
      setInstallEvent(null)
      setShowInstructions(false)
    }

    window.addEventListener('appinstalled', handleInstalled)
    return () => window.removeEventListener('appinstalled', handleInstalled)
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

  async function installAndroid() {
    if (!installEvent) {
      setShowInstructions(true)
      return
    }

    installEvent.prompt()
    const result = await installEvent.userChoice.catch(() => null)

    if (result?.outcome === 'accepted') {
      setVisible(false)
      setInstallEvent(null)
      setShowInstructions(false)
    } else {
      setShowInstructions(true)
    }
  }

  const title = ios
    ? 'Make Evolv feel like an app.'
    : 'Add Evolv to your Home Screen.'

  const description = ios
    ? 'Keep Evolv one tap away and open your journey in its own web-app experience.'
    : 'Get a faster, cleaner way back to your journey without opening the browser first.'

  return (
    <div className="pwa-install-wrap" role="dialog" aria-modal="false" aria-label="Install Evolv">
      <section className="pwa-install-card">
        <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Not now">
          <X size={17} />
        </button>

        <div className="pwa-install-icon" aria-hidden="true">
          <img src="/evolv-mark.svg" alt="" />
        </div>

        <div className="pwa-install-copy">
          <span className="pwa-install-label">BETTER ON YOUR HOME SCREEN</span>
          <h2>{title}</h2>
          <p>{description}</p>

          {showInstructions ? (
            <div className="pwa-install-steps">
              {ios ? (
                <>
                  <div><strong>1</strong><span>Open Evolv in <b>Safari</b>.</span></div>
                  <div><strong>2</strong><span>Tap <b>Share</b> <Share size={14} /> at the bottom of Safari.</span></div>
                  <div><strong>3</strong><span>Choose <b>Add to Home Screen</b>, then tap Add.</span></div>
                </>
              ) : (
                <>
                  <div><strong>1</strong><span>Open your browser menu.</span></div>
                  <div><strong>2</strong><span>Choose <b>Add to Home screen</b> or <b>Install app</b>.</span></div>
                  <div><strong>3</strong><span>Confirm <b>Install</b>.</span></div>
                </>
              )}
            </div>
          ) : (
            <button
              className="pwa-install-button"
              type="button"
              onClick={ios ? () => setShowInstructions(true) : installAndroid}
            >
              <Download size={17} />
              {ios ? 'Show me how' : 'Add Evolv'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
