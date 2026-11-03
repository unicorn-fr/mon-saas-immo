import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

/*
 * Logo (novembre 2026, pistes 2C + 6A) : une maison dont le toit est le coin replié d'une page de bail et dont la porte
 * est un trou de serrure ; puis « bailio » en Fraunces, le point du i remplacé par une serrure orange.
 * Construction sur une grille de 24 : marge 3, rayon d'angle 3, pente du toit 37° (celle du coin replié).
 * En couleurs sur fond clair ; `onDark` (maison blanche, serrure bleu nuit, nom blanc) sur un aplat sombre.
 * Jamais en couleurs sur un aplat de couleur. L'orange n'est porté que par le coin replié et la serrure.
 */
const HOUSE = 'M3 10.2 11 4.2a1.6 1.6 0 0 1 2 0L21 10.2V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z'
const FOLD = 'M12 3.6 21 10.2h-6.2A2.8 2.8 0 0 1 12 7.4Z'
const DOOR = 'M12 13.13a1.805 1.805 0 0 1 1.0925 3.2395l.6175 3.23h-3.42l.6175-3.23A1.805 1.805 0 0 1 12 13.13Z'
const KEYHOLE = 'M12 7.78a4.18 4.18 0 0 1 2.53 7.502l1.43 7.48h-7.92l1.43-7.48A4.18 4.18 0 0 1 12 7.78Z'

export function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <path d={HOUSE} fill={onDark ? BAI.surface : BAI.owner} />
      <path d={FOLD} fill={BAI.accent} />
      <path d={DOOR} fill={onDark ? BAI.night : BAI.surface} />
    </svg>
  )
}

/** « bailio » : i sans point (ı) surmonté d'une petite serrure orange, à la taille du point. */
function Wordmark() {
  return (
    <span aria-hidden style={{ whiteSpace: 'nowrap' }}>
      ba
      <span style={{ position: 'relative', display: 'inline-block' }}>
        ı
        <svg viewBox="0 0 24 24" focusable="false" style={{ position: 'absolute', left: '50%', top: '-0.03em', width: '0.38em', height: '0.38em', transform: 'translateX(-50%)' }}>
          <path d={KEYHOLE} fill={BAI.accent} />
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
    fontVariationSettings: "'SOFT' 100",
    fontWeight: 600,
    letterSpacing: '-0.025em',
    fontSize: size,
    color: onDark ? BAI.surface : BAI.ink,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.28),
  }
  const content = (
    <>
      <LogoMark size={Math.round(size * 1.05)} onDark={onDark} />
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
