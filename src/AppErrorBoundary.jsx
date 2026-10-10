import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('EVOLV app render failed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        background: '#000',
        color: '#f5f5f5',
        fontFamily: 'Manrope, sans-serif',
      }}>
        <section style={{ width: '100%', maxWidth: '440px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '.16em', color: '#8d8d8d' }}>EVOLV / RECOVERY</p>
          <h1 style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-.04em', margin: '18px 0 10px' }}>
            Your space hit a loading issue.
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#aaa' }}>
            Your account and saved progress have not been deleted. Reload EVOLV to try opening your dashboard again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '18px',
              minHeight: '48px',
              padding: '0 18px',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: '14px',
              background: '#f5f5f5',
              color: '#080808',
              font: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload EVOLV
          </button>
          <p style={{ marginTop: '18px', fontSize: '12px', lineHeight: 1.5, color: '#777', overflowWrap: 'anywhere' }}>
            Error: {String(this.state.error?.message || 'Unknown render error')}
          </p>
        </section>
      </main>
    )
  }
}
