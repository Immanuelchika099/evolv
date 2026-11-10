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
        background: 'var(--bg)',
        color: 'var(--t1)',
        fontFamily: 'Manrope, sans-serif',
      }}>
        <section style={{ width: '100%', maxWidth: '440px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '.16em', color: 'var(--t3)' }}>EVOLV / RECOVERY</p>
          <h1 style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-.04em', margin: '18px 0 10px' }}>
            Your space hit a loading issue.
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--t2)' }}>
            Your account and saved progress have not been deleted. Reload EVOLV to try opening your dashboard again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '18px',
              minHeight: '48px',
              padding: '0 18px',
              border: '1px solid var(--edge)',
              borderRadius: '14px',
              background: 'var(--accent)',
              color: 'var(--accent-foreground)',
              font: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload EVOLV
          </button>
          <p style={{ marginTop: '18px', fontSize: '12px', lineHeight: 1.5, color: 'var(--t3)', overflowWrap: 'anywhere' }}>
            Error: {String(this.state.error?.message || 'Unknown render error')}
          </p>
        </section>
      </main>
    )
  }
}
