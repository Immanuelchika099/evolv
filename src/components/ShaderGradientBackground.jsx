import { Component, useEffect, useMemo, useState } from 'react'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import './ShaderGradientBackground.css'

class ShaderGradientErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('EVOLV background shader disabled:', error)
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  return reduced
}

function usePageVisible() {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : !document.hidden
  )

  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

export default function ShaderGradientBackground() {
  const reducedMotion = useReducedMotion()
  const pageVisible = usePageVisible()

  const pixelDensity = useMemo(() => {
    if (typeof window === 'undefined') return 1
    return window.innerWidth < 800 ? 0.85 : 1.15
  }, [])

  const animate = !reducedMotion && pageVisible

  return (
    <div className="evolv-shader-bg" aria-hidden="true">
      <ShaderGradientErrorBoundary>
        {!reducedMotion && (
          <ShaderGradientCanvas
            className="evolv-shader-canvas"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            pixelDensity={pixelDensity}
            fov={45}
            gl={{
              antialias: false,
              powerPreference: 'low-power',
              alpha: true,
            }}
          >
            <ShaderGradient
              animate={animate ? 'on' : 'off'}
              type="plane"
              shader="defaults"
              uSpeed={0.08}
              uStrength={0.55}
              uDensity={0.72}
              uFrequency={2.2}
              uAmplitude={1.05}
              color1="#070707"
              color2="#17351F"
              color3="#C8F36A"
              reflection={0.08}
              cAzimuthAngle={245}
              cPolarAngle={105}
              cDistance={3.6}
              cameraZoom={1.05}
              lightType="3d"
              brightness={0.48}
              grain="off"
              zoomOut={false}
              toggleAxis={false}
              hoverState=""
              enableTransition={false}
            />
          </ShaderGradientCanvas>
        )}
      </ShaderGradientErrorBoundary>
    </div>
  )
}
