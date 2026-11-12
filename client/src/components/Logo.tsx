import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

/*
 * Logo, direction « Feuille et stylo » (novembre 2026, docs/design/direction-artistique.md) : une maison à l'encre aux
 * angles doux dont la fenêtre ronde est le bleu « stylo », puis « bailio » en Instrument Sans, le point du i remplacé
 * par la même fenêtre bleue.
 * Construction sur une grille de 24 : marge 3, rayon d'angle 4, toit à 40°, fenêtre de diamètre 6 centrée à 13,5.
 * En couleurs sur fond clair ; `onDark` (maison et nom clairs, fenêtre bleue) sur un aplat sombre.
 * Jamais en couleurs sur un aplat de couleur.
 */
const HOUSE = 'M3 11.4a2.6 2.6 0 0 1 .95-2.01l6.4-5.3a2.6 2.6 0 0 1 3.3 0l6.4 5.3A2.6 2.6 0 0 1 21 11.4V17a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'

export function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <path d={HOUSE} fill={onDark ? BAI.onDark : BAI.night} />
      <circle cx="12" cy="13.5" r="3" fill={BAI.cta} />
    </svg>
  )
}

/** « bailio » : i sans point (ı) surmonté de la fenêtre allumée. */
function Wordmark() {
  return (
    <span aria-hidden style={{ whiteSpace: 'nowrap' }}>
      ba
      <span style={{ position: 'relative', display: 'inline-block' }}>
        ı
        <svg viewBox="0 0 10 10" focusable="false" style={{ position: 'absolute', left: '50%', top: '0.02em', width: '0.24em', height: '0.24em', transform: 'translateX(-50%)' }}>
          <circle cx="5" cy="5" r="5" fill={BAI.cta} />
        </svg>
      </span>
      lio
    </span>
  )
}

export function Logo({ size = 28, onDark = false, to = '/' }: { size?: number; onDark?: boolean; to?: string | null }) {
  const style = {
    textDecoration: 'none',
    fontFamily: BAI.fontDisplay,
    fontWeight: 600,
    letterSpacing: '-0.04em',
    fontSize: size,
    color: onDark ? BAI.onDark : BAI.night,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.24),
  }
  const content = (
    <>
      <LogoMark size={Math.round(size * 1.1)} onDark={onDark} />
      <Wordmark />
    </>
  )
  return to ? (
    // Marge intérieure invisible : le logo reste touchable au doigt (44 px de haut).
    <Link to={to} style={{ ...style, padding: `${Math.max(0, Math.ceil((44 - size) / 2))}px 0` }} aria-label="Bailio, accueil">
      {content}
    </Link>
  ) : (
    <span style={style} role="img" aria-label="Bailio">
      {content}
    </span>
  )
}
