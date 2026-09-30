import { Component, type ReactNode } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Button, display } from './ui'

interface Props {
  children: ReactNode
  /** Change à chaque navigation : l'erreur est oubliée quand on change de page. */
  resetKey: string
}

/** Jamais de page vide : si une page plante, on l'explique et on propose de recharger. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }

  componentDidCatch(error: unknown) {
    console.error('[page]', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="stack" style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, background: BAI.bg, textAlign: 'center' }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Cette page n'a pas pu s'afficher.</h1>
        <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, maxWidth: 480 }}>
          Le site vient sans doute d'être mis à jour. Rechargez la page : ce que vous avez saisi est enregistré.
        </p>
        <Button onClick={() => window.location.reload()}>Recharger la page</Button>
      </div>
    )
  }
}
