import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, LoaderCircle, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export default function SelfieAvatar({ onApply }) {
  const cameraInput = useRef(null)
  const uploadInput = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [consented, setConsented] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => () => {
    if (photo?.url) URL.revokeObjectURL(photo.url)
  }, [photo?.url])

  function chooseFile(file) {
    setError('')
    setSuccess(false)
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setError('Please use a JPG, PNG, or WebP photo.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Choose a photo smaller than 5 MB.')
      return
    }
    setPhoto({ file, url: URL.createObjectURL(file) })
    setConsented(false)
  }

  async function analyze() {
    if (!photo || !consented || busy) return
    setBusy(true)
    setError('')
    setSuccess(false)
    try {
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
        reader.onerror = () => reject(new Error('Could not read this photo. Please choose it again.'))
        reader.readAsDataURL(photo.file)
      })
      const response = await fetch('/api/avatar-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType: photo.file.type })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not analyze this photo. Please try again.')
      onApply(payload.avatar)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Could not analyze this photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="selfie-avatar">
    <div className="selfie-avatar-heading">
      <span className="selfie-avatar-icon"><Camera size={17} /></span>
      <div><strong>Build from a selfie</strong><p>Let EVOLV suggest a look, then make it yours.</p></div>
    </div>
    <input ref={cameraInput} className="selfie-avatar-input" type="file" accept="image/*" capture="user" onChange={event => chooseFile(event.target.files?.[0])} />
    <input ref={uploadInput} className="selfie-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseFile(event.target.files?.[0])} />
    {!photo ? <div className="selfie-avatar-actions">
      <button type="button" onClick={() => cameraInput.current?.click()}><Camera size={16} /> Take a selfie</button>
      <button type="button" onClick={() => uploadInput.current?.click()}><ImagePlus size={16} /> Upload a photo</button>
    </div> : <div className="selfie-avatar-selected">
      <img src={photo.url} alt="Selected selfie preview" />
      <div className="selfie-avatar-selected-actions">
        <button type="button" onClick={() => cameraInput.current?.click()}><Camera size={14} /> Retake</button>
        <button type="button" onClick={() => uploadInput.current?.click()}><Upload size={14} /> Choose another</button>
        <button type="button" aria-label="Remove photo" onClick={() => { setPhoto(null); setConsented(false); setError(''); setSuccess(false) }}><X size={14} /></button>
      </div>
      <label className="selfie-avatar-consent"><input type="checkbox" checked={consented} onChange={event => setConsented(event.target.checked)} /><span>I agree to send this photo to EVOLV's AI provider to suggest avatar features. The photo isn't saved to my EVOLV profile.</span></label>
      <button type="button" className="selfie-avatar-analyze" disabled={!consented || busy} onClick={analyze}>{busy ? <><LoaderCircle size={16} className="selfie-avatar-spinner" /> Creating your look…</> : <><Sparkles size={16} /> Generate my avatar</>}</button>
    </div>}
    <div className="selfie-avatar-privacy"><ShieldCheck size={15} /><span>Your photo is used for this request only; EVOLV does not store it.</span></div>
    {error && <p className="selfie-avatar-message is-error" role="alert">{error}</p>}
    {success && <p className="selfie-avatar-message is-success" role="status">Your suggested look is ready. Fine-tune any feature below.</p>}
  </section>
}
