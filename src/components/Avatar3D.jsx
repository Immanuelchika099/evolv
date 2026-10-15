import { useEffect, useState } from 'react'

const MODEL_URL = 'https://readyplayerme.github.io/visage/male.glb'

export default function Avatar3D({ className = '', label = '3D avatar', interactive = false }) {
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && customElements?.get('model-viewer'))

  useEffect(() => {
    if (customElements.get('model-viewer')) {
      setReady(true)
      return
    }
    const existing = document.querySelector('script[data-evolv-model-viewer]')
    if (existing) {
      existing.addEventListener('load', () => setReady(true), { once: true })
      return
    }
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js'
    script.dataset.evolvModelViewer = 'true'
    script.onload = () => setReady(true)
    script.onerror = () => setReady(false)
    document.head.appendChild(script)
  }, [])

  return (
    <div className={`evolv-avatar-3d-shell ${className}`} aria-label={label}>
      {!ready && <div className="evolv-avatar-3d-loading" aria-hidden="true"><span /></div>}
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
        ar={undefined}
        style={{ width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' }}
      />
    </div>
  )
}
