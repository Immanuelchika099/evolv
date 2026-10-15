import { useEffect, useRef, useState } from 'react'

const MODEL_URL = 'https://readyplayerme.github.io/visage/male.glb'
const VIEWER_URLS = [
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
  'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js'
]

// Keep one shared loader so React StrictMode or opening/closing the avatar editor
// cannot remove a script while it is still loading.
let viewerLoadPromise
function ensureModelViewer() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'))
  if (window.customElements?.get('model-viewer')) return Promise.resolve()

  if (!viewerLoadPromise) {
    viewerLoadPromise = new Promise((resolve, reject) => {
      let index = 0
      const tryNext = () => {
        if (window.customElements?.get('model-viewer')) {
          resolve()
          return
        }
        if (index >= VIEWER_URLS.length) {
          reject(new Error('The 3D viewer could not be loaded'))
          return
        }

        const src = VIEWER_URLS[index++]
        let script = [...document.scripts].find(item => item.src === src)
        if (script?.dataset.evolvLoaded === 'true') {
          window.customElements.whenDefined('model-viewer').then(resolve, tryNext)
          return
        }
        if (script) script.remove()

        script = document.createElement('script')
        script.type = 'module'
        script.src = src
        script.dataset.evolvModelViewer = 'true'
        script.onload = () => {
          window.customElements.whenDefined('model-viewer').then(resolve, tryNext)
        }
        script.onerror = tryNext
        document.head.appendChild(script)
      }
      tryNext()
    }).catch(error => {
      viewerLoadPromise = undefined
      throw error
    })
  }

  return viewerLoadPromise
}

export default function Avatar3D({ className = '', label = '3D avatar', interactive = false }) {
  const shellRef = useRef(null)
  const [viewerReady, setViewerReady] = useState(() => typeof window !== 'undefined' && Boolean(window.customElements?.get('model-viewer')))
  const [modelState, setModelState] = useState('loading')

  useEffect(() => {
    let cancelled = false
    ensureModelViewer()
      .then(() => { if (!cancelled) setViewerReady(true) })
      .catch(() => { if (!cancelled) setModelState('error') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!viewerReady) return undefined
    const viewer = shellRef.current?.querySelector('model-viewer')
    if (!viewer) return undefined

    let timeoutId
    const onLoad = () => {
      window.clearTimeout(timeoutId)
      setModelState('loaded')
    }
    const onError = () => {
      window.clearTimeout(timeoutId)
      setModelState('error')
    }

    viewer.addEventListener('load', onLoad)
    viewer.addEventListener('error', onError)

    // Some browsers finish loading the GLB before React attaches these listeners.
    if (viewer.loaded) onLoad()
    else {
      setModelState('loading')
      timeoutId = window.setTimeout(() => setModelState('error'), 18000)
    }

    return () => {
      window.clearTimeout(timeoutId)
      viewer.removeEventListener('load', onLoad)
      viewer.removeEventListener('error', onError)
    }
  }, [viewerReady])

  return (
    <div ref={shellRef} className={`evolv-avatar-3d-shell ${className}`} aria-label={label}>
      {modelState === 'loading' && <div className="evolv-avatar-3d-loading" aria-hidden="true"><span /></div>}
      {modelState === 'error' && (
        <div className="evolv-avatar-3d-error" role="status">
          <span>3D preview unavailable</span>
          <small>Check your connection and reopen the preview.</small>
        </div>
      )}
      {viewerReady && (
        <model-viewer
          src={MODEL_URL}
          alt={label}
          loading="eager"
          reveal="auto"
          camera-orbit="0deg 78deg 2.6m"
          camera-target="0m 1.1m 0m"
          field-of-view="30deg"
          shadow-intensity="0.55"
          exposure="1"
          environment-image="neutral"
          interpolation-decay="180"
          interaction-prompt={interactive ? 'auto' : 'none'}
          camera-controls={interactive ? '' : undefined}
          auto-rotate={!interactive ? '' : undefined}
          rotation-per-second="12deg"
          disable-zoom={!interactive ? '' : undefined}
          style={{ width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' }}
        />
      )}
    </div>
  )
}
