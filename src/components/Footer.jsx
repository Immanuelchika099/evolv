import { ArrowRight } from 'lucide-react'
import './Footer.css'
import GradientWaves from './GradientWaves/GradientWaves'

function Brand() {
  return (
    <a className="footer-brand-logo" href="#story" aria-label="EVOLV home">
      <img className="footer-brand-svg" src="/evolv-logo.svg" alt="EVOLV" />
    </a>
  )
}

export default function Footer({ onContact }) {
  return (
    <footer className="site-footer">
      <div className="footer-waves" aria-hidden="true">
        <GradientWaves
          horizonColor="#84CC16"
          waveColor="#000000"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.1}
        />
      </div>
      <div className="footer-waves-overlay" aria-hidden="true" />

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
