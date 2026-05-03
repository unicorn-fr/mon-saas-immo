import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { BAI } from '../constants/bailio-tokens'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BAI.bgBase,
          fontFamily: BAI.fontBody,
          padding: 24,
        }}>
          <div style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 12,
            padding: '32px 28px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel,
              marginBottom: 8,
            }}>
              Erreur
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 24, color: BAI.ink, marginBottom: 12,
            }}>
              Une erreur est survenue
            </h2>
            <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
              {this.state.error?.message || 'Erreur inattendue lors du chargement de la page.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.history.back() }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8,
                background: BAI.night, color: '#ffffff',
                fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                border: 'none', cursor: 'pointer',
              }}
            >
              Retour
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
