import { useEffect } from 'react'

const ATTEMPT_KEY = 'evolv-notification-permission-attempted'

function isInstalledApp() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Browsers require a user gesture before showing the native notification
 * permission prompt. In an installed PWA, request it on the user's first
 * interaction rather than showing a custom imitation or prompting in a loop.
 */
export default function NotificationPermissionPrompt() {
  useEffect(() => {
    if (!isInstalledApp()) return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission !== 'default') return

    try {
      if (localStorage.getItem(ATTEMPT_KEY) === '1') return
    } catch {
      // Continue if storage is unavailable; the browser permission still applies.
    }

    let handled = false

    const requestPermission = () => {
      if (handled) return
      handled = true
      document.removeEventListener('pointerdown', requestPermission)
      document.removeEventListener('keydown', requestPermission)

      try {
        localStorage.setItem(ATTEMPT_KEY, '1')
      } catch {
        // Permission state is still enforced by the browser.
      }

      try {
        // This call is made directly from a trusted user interaction so
        // supported browsers can display their real system permission prompt.
        void Notification.requestPermission().catch(() => {})
      } catch {
        // Unsupported/blocked environments should not interrupt app startup.
      }
    }

    document.addEventListener('pointerdown', requestPermission, { once: true, passive: true })
    document.addEventListener('keydown', requestPermission, { once: true })

    return () => {
      document.removeEventListener('pointerdown', requestPermission)
      document.removeEventListener('keydown', requestPermission)
    }
  }, [])

  return null
}
