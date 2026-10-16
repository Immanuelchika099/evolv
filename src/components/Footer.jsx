import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
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
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return

    // UI-first: persistence and welcome-email delivery will be connected next.
    setSubmitted(true)
    setMessage('Thanks for your interest — newsletter sign-ups are coming soon.')
  }

  return (
    <section className="footer-newsletter" aria-labelledby="footer-newsletter-title">
      <div className="footer-newsletter-copy">
        <span className="footer-newsletter-eyebrow">STAY IN THE LOOP</span>
        <h2 id="footer-newsletter-title">Thoughtful updates to help you keep evolving.</h2>
      </div>
      <form className="footer-newsletter-form" onSubmit={handleSubmit}>
        <label className="footer-newsletter-label" htmlFor="footer-newsletter-email">Your email address</label>
        <div className="footer-newsletter-controls">
          <input
            id="footer-newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (submitted) {
                setSubmitted(false)
                setMessage('')
              }
            }}
            required
          />
          <button type="submit" className="footer-newsletter-submit">
            Subscribe <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        {message && (
          <p className="footer-newsletter-message" role="status">
            {submitted && <Check size={15} aria-hidden="true" />}
            {message}
          </p>
        )}
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
