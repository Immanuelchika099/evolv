import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import './auth-overrides.css'
import './direct-signup.css'
import './components/styles/WelcomeOnboarding.css'
import App from './App.jsx'
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.jsx'
import './components/styles/Polish.css'
import AppErrorBoundary from './AppErrorBoundary.jsx'
import './index.css' // Global design tokens and theme overrides load last

const syncThemeColor = () => {
  const meta = document.querySelector('meta[name="theme-color"]')
  const canvasColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (meta && canvasColor) meta.setAttribute('content', canvasColor)
}
syncThemeColor()
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
const syncSystemThemeColor = () => {
  if ((localStorage.getItem('evolv-theme-preference') || 'system') === 'system') {
    requestAnimationFrame(syncThemeColor)
  }
}
themeMedia.addEventListener?.('change', syncSystemThemeColor)
window.addEventListener('storage', event => {
  if (event.key === 'evolv-theme-preference') requestAnimationFrame(syncThemeColor)
})

if (Capacitor.getPlatform() === 'ios') {
  void Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {})
}

// Keep the installed web app at a fixed scale. These guards target browser
// zoom gestures only; normal one-finger scrolling and app controls remain usable.
const preventZoomGesture = (event) => event.preventDefault()
document.addEventListener('gesturestart', preventZoomGesture, { passive: false })
document.addEventListener('gesturechange', preventZoomGesture, { passive: false })
document.addEventListener('gestureend', preventZoomGesture, { passive: false })

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
      <NotificationPermissionPrompt />
    </AppErrorBoundary>
  </StrictMode>,
)
