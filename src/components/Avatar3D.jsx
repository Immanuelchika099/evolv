import './Avatar3D.css'
import { useEffect, useRef, useState } from 'react'

const FALLBACK_MODEL_URL = 'https://readyplayerme.github.io/visage/male.glb'
const VIEWER_URLS = [
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
  'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js'
]

let viewerLoadPromise
function ensureModelViewer() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'))
  if (window.customElements?.get('model-viewer')) return Promise.resolve()
  if (!viewerLoadPromise) {
    viewerLoadPromise = new Promise((resolve, reject) => {
      let index = 0
      const tryNext = () => {
        if (window.customElements?.get('model-viewer')) return resolve()
        if (index >= VIEWER_URLS.length) return reject(new Error('3D viewer unavailable'))
        const src = VIEWER_URLS[index++]
        const script = document.createElement('script')
        script.type = 'module'
        script.src = src
        script.onload = () => window.customElements.whenDefined('model-viewer').then(resolve, tryNext)
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

function localTextureUrl(url) {
  const basename = decodeURIComponent(String(url).split(/[\\/]/).pop() || '')
  const aliases = {
    'Std_Skin_Head_MicroNMask - Copy.jpg': 'Std_Skin_Head_MicroNMask - Copy.jpeg',
    'Std_Eye_L_Diffuse - C2opy.jpg': 'Std_Eye_L_Diffuse - C2opy.jpeg',
    'Std_Eyelash_Diffuse.jpg': 'Std_Eyelash_Diffuse.jpeg',
    'Std_Eyelash_Opacity.jpg': 'Std_Eyelash_Opacity.jpeg',
    'M_Legs_U_01_D.jpg': 'M_Legs_U_01_D.jpeg',
    'shoes_3_mat_albedo.jpg': 'shoes_3_mat_albedo.jpeg',
    'defaultMat1_albedo.jpg': 'defaultMat1_albedo.jpeg',
    'Std_Skin_Arm_Diffuse.jpg': 'Std_Skin_Arm_Diffuse.jpeg',
    'Std_Skin_Leg_Diffuse.jpg': 'Std_Skin_Leg_Diffuse.jpeg',
    'hair2_Opacity.jpg': 'hair2_Opacity.jpeg',
  }
  const filename = aliases[basename] || basename
  return `/models/frank/textures/${encodeURIComponent(filename).replaceAll('%2F', '/')}`
}

async function loadThreeAvatar(canvas, interactive, onReady, onError, aliveRef) {
  const [THREE, loaderModule] = await Promise.all([
    import('https://esm.sh/three@0.180.0'),
    import('https://esm.sh/three@0.180.0/examples/jsm/loaders/FBXLoader.js'),
  ])
  if (!aliveRef.current) return () => {}
  const { FBXLoader } = loaderModule
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 1.25, 4.8)
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  scene.add(new THREE.HemisphereLight(0xffffff, 0x343c4b, 2.1))
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.0)
  keyLight.position.set(3, 5, 5)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0xb8d5ff, 1.15)
  fillLight.position.set(-4, 2, 2)
  scene.add(fillLight)

  const manager = new THREE.LoadingManager()
  manager.setURLModifier(url => {
    if (/^https?:/i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
    return localTextureUrl(url)
  })
  const loader = new FBXLoader(manager)
  let model
  let mixer
  let animationFrame = 0
  let lastTime = 0
  let pointerDown = false
  let pointerX = 0
  let pointerY = 0
  let targetRotation = 0
  let targetTilt = 0
  let resizeObserver

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth)
    const height = Math.max(1, canvas.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.parentElement || canvas)
  resize()

  const onPointerDown = event => {
    if (!interactive) return
    pointerDown = true
    pointerX = event.clientX
    pointerY = event.clientY
    canvas.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = event => {
    if (!pointerDown || !interactive || !model) return
    targetRotation += (event.clientX - pointerX) * 0.009
    targetTilt = Math.max(-0.18, Math.min(0.18, targetTilt + (event.clientY - pointerY) * 0.003))
    pointerX = event.clientX
    pointerY = event.clientY
  }
  const onPointerUp = () => { pointerDown = false }
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)

  const cleanup = () => {
    cancelAnimationFrame(animationFrame)
    resizeObserver?.disconnect()
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerUp)
    if (model) {
      model.traverse(item => {
        if (!item.isMesh) return
        item.geometry?.dispose()
        const materials = Array.isArray(item.material) ? item.material : [item.material]
        materials.forEach(material => {
          if (!material) return
          Object.values(material).forEach(value => { if (value?.isTexture) value.dispose() })
          material.dispose?.()
        })
      })
      scene.remove(model)
    }
    renderer.dispose()
  }

  const render = time => {
    animationFrame = requestAnimationFrame(render)
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0
    lastTime = time
    if (mixer) mixer.update(delta)
    if (model) {
      if (!interactive && !pointerDown) targetRotation += delta * 0.16
      model.rotation.y += (targetRotation - model.rotation.y) * 0.08
      model.rotation.x += (targetTilt - model.rotation.x) * 0.08
      if (!mixer && !interactive) model.position.y = Math.sin(time * 0.0008) * 0.025
    }
    renderer.render(scene, camera)
  }
  animationFrame = requestAnimationFrame(render)

  try {
    model = await loader.loadAsync('/models/frank/Frank.fbx')
    if (!aliveRef.current) {
      model.traverse(item => {
        if (item.isMesh) {
          item.geometry?.dispose()
          const materials = Array.isArray(item.material) ? item.material : [item.material]
          materials.forEach(material => material?.dispose?.())
        }
      })
      return cleanup
    }
    model.traverse(item => {
      if (!item.isMesh) return
      item.castShadow = true
      item.receiveShadow = true
      const materials = Array.isArray(item.material) ? item.material : [item.material]
      materials.forEach(material => {
        if (!material) return
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace
        material.needsUpdate = true
      })
    })
    const bounds = new THREE.Box3().setFromObject(model)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const targetHeight = 2.45
    const scale = targetHeight / Math.max(size.y, 0.001)
    model.scale.setScalar(scale)
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
    scene.add(model)
    camera.position.set(0, targetHeight * 0.53, 4.35)
    camera.lookAt(0, targetHeight * 0.49, 0)
    if (model.animations?.length) {
      mixer = new THREE.AnimationMixer(model)
      mixer.clipAction(model.animations[0]).play()
    }
    onReady()
  } catch (error) {
    cleanup()
    onError(error)
    return () => {}
  }
  return cleanup
}

export default function Avatar3D({ className = '', label = '3D avatar', interactive = false }) {
  const shellRef = useRef(null)
  const aliveRef = useRef(false)
  const [modelState, setModelState] = useState('loading')
  const [fallbackReady, setFallbackReady] = useState(false)

  useEffect(() => {
    const shell = shellRef.current
    const canvas = shell?.querySelector('canvas')
    if (!canvas) return undefined
    aliveRef.current = true
    setModelState('loading')
    let stop = () => {}
    loadThreeAvatar(canvas, interactive, () => setModelState('loaded'), () => {
      if (!aliveRef.current) return
      setModelState('fallback')
      ensureModelViewer().then(() => {
        if (aliveRef.current) setFallbackReady(true)
      }).catch(() => {
        if (aliveRef.current) setModelState('error')
      })
    }, aliveRef).then(cleanup => { stop = cleanup || (() => {}) })
    return () => {
      aliveRef.current = false
      stop()
    }
  }, [interactive])

  return (
    <div ref={shellRef} className={`evolv-avatar-3d-shell ${className}`} aria-label={label}>
      <canvas className="evolv-avatar-3d-canvas" aria-label={label} role="img" />
      {modelState === 'loading' && <div className="evolv-avatar-3d-loading" aria-hidden="true"><span /></div>}
      {modelState === 'error' && (
        <div className="evolv-avatar-3d-error" role="status">
          <span>3D preview unavailable</span>
          <small>Check your connection and reopen the preview.</small>
        </div>
      )}
      {fallbackReady && modelState === 'fallback' && (
        <model-viewer
          src={FALLBACK_MODEL_URL}
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' }}
        />
      )}
    </div>
  )
}
