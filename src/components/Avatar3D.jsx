import { useEffect, useRef, useState } from 'react'

const MODEL_URL = 'https://readyplayerme.github.io/visage/male.glb'
const VIEWER_URLS = [
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
  'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js'
]

export default function Avatar3D({ className = '', label = '3D avatar', interactive = false }) {
  const shellRef = useRef(null)
  const [viewerReady, setViewerReady] = useState(() => typeof window !== 'undefined' && Boolean(window.customElements?.get('model-viewer')))
  const [modelState, setModelState] = useState('loading')

  useEffect(() => {
    let cancelled = false
    let script = null

    if (window.customElements?.get('model-viewer')) {
      setViewerReady(true)
      return undefined
    }

    const loadViewer = (index = 0) => {
      if (cancelled) return
      if (index >= VIEWER_URLS.length) { setModelState('error'); return }
      const existing = document.querySelector('script[data-evolv-model-viewer]')
      if (existing) existing.remove()

      script = document.createElement('script')
      script.type = 'module'
      script.src = VIEWER_URLS[index]
      script.dataset.evolvModelViewer = 'true'
      script.onload = () => {
        if (!cancelled && window.customElements?.get('model-viewer')) setViewerReady(true)
        else if (!cancelled) loadViewer(index + 1)
      }
      script.onerror = () => loadViewer(index + 1)
      document.head.appendChild(script)
    }

    loadViewer()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const viewer = shellRef.current?.querySelector('model-viewer')
    if (!viewer) return undefined
    const onLoad = () => setModelState('loaded')
    const onError = () => setModelState('error')
    viewer.addEventListener('load', onLoad)
    viewer.addEventListener('error', onError)
    return () => {
      viewer.removeEventListener('load', onLoad)
      viewer.removeEventListener('error', onError)
    }
  }, [viewerReady])

  return (
    <div ref={shellRef} className={`evolv-avatar-3d-shell ${className}`} aria-label={label}>
      {modelState === 'loading' && <div className="evolv-avatar-3d-loading" aria-hidden="true"><span /></div>}
      {modelState === 'error' && (
        <div className="evolv-avatar-3d-error" role="img" aria-label={label}>
          <span className="evolv-avatar-3d-error-head" />
          <span className="evolv-avatar-3d-error-body" />
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
