import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'

export function Logo({ size = 28, color = BAI.ink, to = '/' }: { size?: number; color?: string; to?: string | null }) {
  const style = { textDecoration: 'none', fontFamily: BAI.fontDisplay, fontStyle: 'italic' as const, fontWeight: 700, fontSize: size, color, lineHeight: 1 }
  return to ? (
    // Marge intérieure invisible : le logo reste touchable au doigt (44 px de haut).
    <Link to={to} style={{ ...style, display: 'inline-block', padding: `${Math.max(0, Math.ceil((44 - size) / 2))}px 0` }} aria-label="Bailio, accueil">
      Bailio
    </Link>
  ) : (
    <span style={style}>Bailio</span>
  )
}
