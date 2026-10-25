import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

/**
 * Logo horizontal : la page de bail au coin replié, puis le nom.
 * En couleurs sur fond clair ; `onDark` (page blanche, nom blanc) sur un aplat sombre. Jamais en couleurs sur un aplat de couleur.
 */
export function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  const page = onDark ? BAI.surface : BAI.owner
  const lines = onDark ? BAI.night : BAI.surface
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <path d="M7 1h9l7 7v9a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6Z" fill={page} />
      <path d="M16 1v4.5A2.5 2.5 0 0 0 18.5 8H23Z" fill={BAI.accent} />
      <path d="M6.5 12.5h8M6.5 16.5h11" stroke={lines} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ size = 28, onDark = false, to = '/' }: { size?: number; onDark?: boolean; to?: string | null }) {
  const style = {
    textDecoration: 'none',
    fontFamily: BAI.fontDisplay,
    fontVariationSettings: "'SOFT' 100",
    fontWeight: 600,
    letterSpacing: '-0.015em',
    fontSize: size,
    color: onDark ? BAI.surface : BAI.ink,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.3),
  }
  const content = (
    <>
      <LogoMark size={Math.round(size * 0.92)} onDark={onDark} />
      Bailio
    </>
  )
  return to ? (
    // Marge intérieure invisible : le logo reste touchable au doigt (44 px de haut).
    <Link to={to} style={{ ...style, padding: `${Math.max(0, Math.ceil((44 - size) / 2))}px 0` }} aria-label="Bailio, accueil">
      {content}
    </Link>
  ) : (
    <span style={style}>{content}</span>
  )
}
