import { Link } from 'react-router-dom'
import { BAI, DA2 } from '../constants/bailio-tokens'

/*
 * Logo (16 novembre 2026, direction « Le b habité ») : le « b » de Bailio est une maison. Sa hampe est taillée en
 * pente de toit, sa panse porte une fenêtre allumée (quatre carreaux, croisillons de la couleur du b). Le même b
 * ouvre le nom entier, « bailio » en Inter 700, et sert seul d'icône (favicon, téléphone : public/favicon.svg).
 * Construit sur les proportions du b d'Inter 700 (unités de 1 000 : hampe de 51 à 195, hauteur 727, panse de 540,
 * chasse 598), pour se fondre dans « ailio ». Fenêtre en soleil (DA2.sun) partout ; le reste suit le fond.
 */
export const B_PATHS = {
  viewBox: '0 0 598 727',
  stem: 'M51 727V67L195 0V727Z',
  bowl: 'M120 727H298A270 270 0 0 0 298 187H120Z',
  window: { x: 195, y: 329, w: 229, h: 256, r: 26 },
  mullions: 'M309.5 329V585M195 457H424',
}

/** Le b habité, à la taille du texte (1em de corps) : posé sur la ligne de base. */
export function BGlyph({ color, style }: { color: string; style?: React.CSSProperties }) {
  const w = B_PATHS.window
  return (
    <svg viewBox={B_PATHS.viewBox} aria-hidden focusable="false" style={{ width: '0.598em', height: '0.727em', display: 'inline-block', verticalAlign: 'baseline', overflow: 'visible', ...style }}>
      <path d={B_PATHS.stem} fill={color} />
      <path d={B_PATHS.bowl} fill={color} />
      <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.r} fill={DA2.sun} />
      <path d={B_PATHS.mullions} stroke={color} strokeWidth={34} />
    </svg>
  )
}

/** L'icône seule : le b habité sur une tuile bleu nuit (onBlue : tuile blanche). */
export function LogoMark({ size = 28, onBlue = false }: { size?: number; onDark?: boolean; onBlue?: boolean }) {
  const tile = onBlue ? BAI.surface : DA2.ink
  const ink = onBlue ? DA2.ink : DA2.linen
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: size * 0.24, background: tile, display: 'inline-grid', placeItems: 'center', flexShrink: 0, fontSize: size * 0.82, lineHeight: 1 }}>
      <BGlyph color={ink} style={{ marginTop: size * 0.02 }} />
    </span>
  )
}

/** Le nom entier : le b habité puis « ailio ». Encre bleu nuit ; en clair sur fond sombre (onDark) et sur le menu bleu (onBlue). */
export function Wordmark({ size = 28, light = false }: { size?: number; light?: boolean }) {
  const color = light ? DA2.linen : DA2.ink
  return (
    <span aria-hidden style={{ font: `700 ${Math.round(size * 1.02)}px/1 ${BAI.fontBody}`, letterSpacing: '-0.045em', color, whiteSpace: 'nowrap', display: 'inline-block' }}>
      <BGlyph color={color} style={{ marginRight: '0.012em' }} />
      ailio
    </span>
  )
}

export function Logo({ size = 28, to = '/', onDark = false, onBlue = false }: { size?: number; onDark?: boolean; onBlue?: boolean; to?: string | null }) {
  const mark = <Wordmark size={size} light={onDark || onBlue} />
  const style = { textDecoration: 'none', display: 'inline-flex', alignItems: 'center', lineHeight: 1 }
  return to ? (
    // Marge intérieure invisible : le logo reste touchable au doigt (44 px de haut).
    <Link to={to} style={{ ...style, minHeight: 44 }} aria-label="Bailio, accueil">
      {mark}
    </Link>
  ) : (
    <span style={style} role="img" aria-label="Bailio">
      {mark}
    </span>
  )
}
