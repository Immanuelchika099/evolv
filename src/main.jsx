import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import './auth-overrides.css'
import './direct-signup.css'
import './components/styles/WelcomeOnboarding.css'
import App from './App.jsx'
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt.jsx'
import './components/styles/Polish.css'
import AppErrorBoundary from './AppErrorBoundary.jsx'

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
