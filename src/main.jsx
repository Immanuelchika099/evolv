import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import './auth-overrides.css'
import './direct-signup.css'
import './components/styles/WelcomeOnboarding.css'
import App from './App.jsx'
import './components/styles/Polish.css'
import AppErrorBoundary from './AppErrorBoundary.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
