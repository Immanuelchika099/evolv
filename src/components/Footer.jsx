import { ArrowRight } from 'lucide-react'
import './Footer.css'

function Brand() {
  return (
    <a className="footer-brand-logo" href="#story" aria-label="EVOLV home">
      <img className="footer-brand-svg" src="/evolv-mark.svg" alt="" aria-hidden="true" />
      <span>EVOLV</span>
    </a>
  )
}

export default function Footer({ onContact }) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Brand />
        <p>Track your growth.<br />Become your next self.</p>
      </div>
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
