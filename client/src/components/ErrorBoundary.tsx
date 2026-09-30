import { Component, type ReactNode } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Button, Spinner, display } from './ui'
import { recoverOnce, reportError } from '../lib/recover'

interface Props {
  children: ReactNode
  /** Change à chaque navigation : l'erreur est oubliée quand on change de page. */
  resetKey?: string
}

/** Jamais de page vide : si une page plante, on l'explique et on propose de recharger. */
export class ErrorBoundary extends Component<Props, { failed: boolean; reloading: boolean }> {
  state = { failed: false, reloading: false }

  static getDerivedStateFromError() {
    return { failed: true, reloading: true }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false, reloading: false })
  }

  componentDidCatch(error: unknown) {
    console.error('[page]', error)
    reportError(error, 'page')
    // Un rechargement complet affiche la page correctement : on le fait tout de suite, à la place du visiteur.
    if (!recoverOnce()) this.setState({ reloading: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    if (this.state.reloading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bg }}>
          <Spinner size={28} />
        </div>
      )
    }
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
