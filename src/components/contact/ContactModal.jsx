import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './ContactModal.css'

function ContactModal({ contactSent, setContactSent, onClose }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submitContact(event) {
    event.preventDefault()
    setSending(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: form.get('name')?.trim(),
        email: form.get('email')?.trim(),
        message: form.get('message')?.trim(),
      })

    setSending(false)

    if (insertError) {
      setError('Something went wrong. Please try again.')
      return
    }

    setContactSent(true)
  }

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="contact-modal">
        <button className="contact-close" onClick={onClose} aria-label="Close contact form">×</button>
        {!contactSent ? (
          <form onSubmit={submitContact}>
            <span className="section-label">LET'S TALK</span>
            <h2 id="contact-title">What are you<br /><em>working on?</em></h2>
            <p className="contact-copy">Tell us a little about what you have in mind. Keep it simple.</p>
            <div className="contact-fields">
              <label><span>Name</span><input required name="name" placeholder="Your name" /></label>
              <label><span>Email</span><input required type="email" name="email" placeholder="you@example.com" /></label>
              <label><span>Message</span><textarea required name="message" placeholder="Tell us what you want to build, change or explore..." rows="4" /></label>
            </div>
            {error && <p className="contact-error" role="alert">{error}</p>}
            <button className="button button-primary contact-submit" type="submit" disabled={sending}>
              {sending ? 'Sending…' : 'Send message'} {!sending && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <div className="contact-success">
            <span className="contact-success-mark"><Check size={20} /></span>
            <span className="section-label">MESSAGE READY</span>
            <h2>Thanks for<br /><em>reaching out.</em></h2>
            <p>Your message has been captured. Your message has been sent successfully. Thanks for reaching out — we'll get back to you soon.</p>
            <button className="button button-primary" onClick={onClose}>Back to EVOLV <ArrowRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactModal
