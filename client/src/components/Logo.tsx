import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

/*
 * Logo (novembre 2026, docs/design/direction-artistique.md) : une tuile bleue aux angles arrondis qui porte un « b »
 * blanc. Le haut de sa hampe est taillé en biais, comme la pente d'un toit : l'initiale de Bailio et une maison en un
 * seul signe. Puis « bailio » en Instrument Sans 600, serré, sans ornement.
 * Construction sur une grille de 32 : tuile de rayon 8,5 ; hampe de 4,4 de large, de 9,2 à 13,6, taillée à 45° ;
 * panse : cercle de rayon 4,8 centré en (18,3 ; 19), trait de 4,2. La tuile reste bleue sur fond clair comme sur
 * fond sombre ; seul le nom passe en clair avec `onDark`. Lisible dès 16 px (favicon).
 */
export function LogoMark({ size = 28 }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <rect width="32" height="32" rx="8.5" fill={BAI.owner} />
      <path d="M9.2 25.2V9.9L13.6 5.6v19.6z" fill={BAI.surface} />
      <circle cx="18.3" cy="19" r="4.8" fill="none" stroke={BAI.surface} strokeWidth="4.2" />
    </svg>
  )
}

export function Logo({ size = 28, onDark = false, to = '/' }: { size?: number; onDark?: boolean; to?: string | null }) {
  const style = {
    textDecoration: 'none',
    fontFamily: BAI.fontDisplay,
    fontWeight: 600,
    letterSpacing: '-0.045em',
    fontSize: size,
    color: onDark ? BAI.onDark : BAI.ink,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.3),
  }
  const content = (
    <>
      <LogoMark size={Math.round(size * 1.12)} />
      <span aria-hidden>bailio</span>
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
