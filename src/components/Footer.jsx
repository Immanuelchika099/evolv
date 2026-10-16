import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Footer.css'

function Brand() {
  return (
    <a className="footer-brand-logo" href="#story" aria-label="EVOLV home">
      <img className="footer-brand-svg" src="/evolv-logo.svg" alt="EVOLV" />
    </a>
  )
}

function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || isSubmitting) return

    setIsSubmitting(true)
    setMessage('')

    const { data, error } = await supabase.functions.invoke('newsletter-signup', {
      body: { email: email.trim() },
    })

    if (error || data?.error) {
      setMessage(data?.error || 'Could not subscribe. Try again.')
    } else {
      setMessage("You're on the list.")
      setEmail('')
    }

    setIsSubmitting(false)
  }

  return (
    <section className="footer-newsletter" aria-labelledby="footer-newsletter-title">
      <h2 id="footer-newsletter-title">Stay in the loop.</h2>
      <form className="footer-newsletter-form" onSubmit={handleSubmit}>
        <label className="footer-newsletter-label" htmlFor="footer-newsletter-email">Email address</label>
        <input
          className="footer-newsletter-honeypot"
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="footer-newsletter-controls">
          <input
            id="footer-newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setMessage('')
            }}
            required
          />
          <button type="submit" className="footer-newsletter-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Joining…' : 'Subscribe'} {!isSubmitting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
        {message && <p className="footer-newsletter-message" role="status">{message}</p>}
      </form>
    </section>
  )
}

export default function Footer({ onContact }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Brand />
        <p>Track your growth.<br />Become your next self.</p>
      </div>
      <NewsletterSignup />
      <div className="footer-links">
        <div>
          <span>EXPLORE</span>
          <a href="#story">About EVOLV</a>
          <a href="#faq">Terms of Service</a>
          <a href="#faq">Privacy Policy</a>
        </div>
        <div>
          <span>CONNECT</span>
          <a href="https://www.instagram.com/hi_imanw/" target="_blank" rel="noreferrer" className="footer-social">@hi_imanw</a>
          <button type="button" className="footer-contact" onClick={onContact}>Contact <ArrowRight size={13} /></button>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 EVOLV</span><span>BUILT FOR BECOMING</span></div>
    </footer>
  )
}
