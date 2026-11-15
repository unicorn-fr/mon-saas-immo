import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

/*
 * Logo (novembre 2026, docs/design/direction-artistique.md) : une tuile bleue aux angles arrondis qui porte un « b »
 * blanc. Le haut de sa hampe est taillé en biais, comme la pente d'un toit : l'initiale de Bailio et une maison en un
 * seul signe. Puis « bailio » en Inter 700, serré, sans ornement.
 * Construction sur une grille de 32 : tuile de rayon 8,5 ; hampe de 4,4 de large, de 9,2 à 13,6, taillée à 45° ;
 * panse : cercle de rayon 4,8 centré en (18,3 ; 19), trait de 4,2. La tuile reste bleue sur fond clair comme sur
 * fond sombre ; seul le nom passe en clair avec `onDark`. Sur le menu bleu de l'espace (`onBlue`), tuile blanche et « b » bleu. Lisible dès 16 px (favicon).
 */
export function LogoMark({ size = 28, onBlue = false }: { size?: number; onDark?: boolean; onBlue?: boolean }) {
  const tile = onBlue ? BAI.surface : BAI.owner
  const ink = onBlue ? BAI.owner : BAI.surface
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <rect width="32" height="32" rx="8.5" fill={tile} />
      <path d="M9.2 25.2V9.9L13.6 5.6v19.6z" fill={ink} />
      <circle cx="18.3" cy="19" r="4.8" fill="none" stroke={ink} strokeWidth="4.2" />
    </svg>
  )
}

/**
 * Logo de la direction « Tombée du jour » : la plaque « bailio », comme une plaque de rue. Tuile bleue, filet blanc,
 * nom en Bricolage Grotesque 800. Identique sur fond clair, sur fond sombre et sur le menu de l'espace.
 */
export function Logo({ size = 28, to = '/' }: { size?: number; onDark?: boolean; onBlue?: boolean; to?: string | null }) {
  const plate = (
    <span aria-hidden style={{ display: 'inline-flex', background: BAI.brand, borderRadius: Math.round(size * 0.4), padding: Math.max(2, Math.round(size * 0.13)) }}>
      <span style={{ border: `${size >= 24 ? 2 : 1.5}px solid ${BAI.surface}`, borderRadius: Math.round(size * 0.3), padding: `${Math.round(size * 0.14)}px ${Math.round(size * 0.42)}px ${Math.round(size * 0.18)}px`, font: `800 ${Math.round(size * 0.78)}px/1 ${BAI.fontBrand}`, letterSpacing: '-0.03em', color: BAI.surface }}>
        bailio
      </span>
    </span>
  )
  const style = { textDecoration: 'none', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }
  return to ? (
    // Marge intérieure invisible : le logo reste touchable au doigt (44 px de haut).
    <Link to={to} style={{ ...style, minHeight: 44 }} aria-label="Bailio, accueil">
      {plate}
    </Link>
  ) : (
    <span style={style} role="img" aria-label="Bailio">
      {plate}
    </span>
  )
}
