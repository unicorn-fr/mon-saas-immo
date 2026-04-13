/**
 * Bailio Design Tokens — Dashboard
 *
 * Source unique de vérité pour toutes les valeurs visuelles.
 * Importer { BAI } dans chaque fichier dashboard au lieu de déclarer
 * un objet local (M, T, S, NIGHT, etc.).
 *
 * Ne jamais écrire de valeur hex en dur dans un composant —
 * toujours passer par BAI.
 */
import type React from 'react'

export const BAI = {
  // ── Fonds ────────────────────────────────────────────────────────────────
  bgBase:       '#fafaf8',   // fond général de l'app
  bgSurface:    '#ffffff',   // cards, panneaux, sidebar claire
  bgMuted:      '#f4f2ee',   // zones légèrement estompées
  bgInput:      '#f8f7f4',   // fond des champs input

  // ── Texte ────────────────────────────────────────────────────────────────
  ink:          '#0d0c0a',   // texte principal
  inkMid:       '#5a5754',   // texte secondaire
  inkFaint:     '#9e9b96',   // placeholders, labels discrets

  // ── Couleur de nuit (sidebar) ─────────────────────────────────────────
  night:        '#1a1a2e',   // fond sidebar
  nightHover:   '#2a2a3e',   // hover items sidebar
  nightBorder:  '#2e2e46',   // séparateurs dans la sidebar

  // ── Caramel (marque, CTA, accent) ─────────────────────────────────────
  caramel:      '#c4976a',
  caramelHover: '#b07f54',
  caramelLight: '#fdf5ec',   // fond clair pour badges caramel
  caramelBorder:'#e8ccaa',

  // ── Bleu propriétaire ─────────────────────────────────────────────────
  owner:        '#1a3270',
  ownerHover:   '#142757',
  ownerLight:   '#eaf0fb',
  ownerBorder:  '#b8ccf0',

  // ── Vert locataire ────────────────────────────────────────────────────
  tenant:       '#1b5e3b',
  tenantLight:  '#edf7f2',
  tenantBorder: '#9fd4ba',

  // ── Statuts sémantiques ───────────────────────────────────────────────
  success:      '#1b5e3b',
  successLight: '#edf7f2',
  warning:      '#92400e',
  warningLight: '#fef9ec',   // fond warning (orange doux, cohérent avec caramel)
  error:        '#991b1b',
  errorLight:   '#fee2e2',
  info:         '#1a3270',
  infoLight:    '#eaf0fb',

  // ── Bordures ──────────────────────────────────────────────────────────
  border:       '#e4e1db',   // bordure standard
  borderStrong: '#c9c5bd',   // bordure accentuée

  // ── Typographie ───────────────────────────────────────────────────────
  fontDisplay:  "'Cormorant Garamond', Georgia, serif",
  fontBody:     "'DM Sans', system-ui, sans-serif",

  // ── Ombres ────────────────────────────────────────────────────────────
  shadowSm:     '0 1px 3px rgba(13,12,10,0.06)',
  shadowMd:     '0 1px 2px rgba(13,12,10,0.05), 0 4px 16px rgba(13,12,10,0.06)',
  shadowLg:     '0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10)',

  // ── Rayons ────────────────────────────────────────────────────────────
  radius:       8,           // px — radius standard (cards, inputs, boutons)
  radiusSm:     4,           // px — radius petit (badges, chips)
  radiusLg:     12,          // px — radius grand (modales, panels)

  // ── Transitions ───────────────────────────────────────────────────────
  transition:   'all .18s ease',

  // ── Verre poli (glassmorphism premium) ────────────────────────────────────
  glassLight:      'rgba(255, 255, 255, 0.72)',
  glassMid:        'rgba(255, 255, 255, 0.50)',
  glassDark:       'rgba(15, 14, 12, 0.55)',
  glassBorder:     'rgba(255, 255, 255, 0.45)',
  glassBorderDark: 'rgba(255, 255, 255, 0.18)',
  glassBlur:       'blur(18px)',
  glassBlurLight:  'blur(10px)',
  glassShadow:     '0 8px 32px rgba(13, 12, 10, 0.10), inset 0 1px 0 rgba(255,255,255,0.60)',
  glassShadowDark: '0 8px 32px rgba(13, 12, 10, 0.18), inset 0 1px 0 rgba(255,255,255,0.12)',

  // ── Breakpoints ───────────────────────────────────────────────────────────
  bpSm:  480,
  bpMd:  768,
  bpLg: 1024,
  bpXl: 1280,

  // ── Touch targets ─────────────────────────────────────────────────────────
  touchMin:  44,
  touchComf: 48,

  // ── Espacements fluides ───────────────────────────────────────────────────
  spaceFluidSm: 'clamp(8px, 2vw, 16px)',
  spaceFluidMd: 'clamp(16px, 3vw, 28px)',
  spaceFluidLg: 'clamp(24px, 4vw, 48px)',

  // ── Typographie fluide ────────────────────────────────────────────────────
  textH1:   'clamp(26px, 4vw, 42px)',
  textH2:   'clamp(20px, 2.5vw, 28px)',
  textH3:   'clamp(16px, 1.8vw, 20px)',
  textBody: 'clamp(13px, 1.2vw, 15px)',
  textSm:   'clamp(11px, 1vw, 13px)',
} as const

export type BaiTokens = typeof BAI

/**
 * Retourne les styles inline d'une surface en verre poli.
 * @param variant 'light' | 'mid' | 'dark' — opacité du fond
 * @param blur    'standard' | 'light' — intensité du flou (light = plus performant sur mobile)
 */
export function glassStyle(
  variant: 'light' | 'mid' | 'dark' = 'light',
  blur: 'standard' | 'light' = 'standard',
): React.CSSProperties {
  const bg      = variant === 'dark' ? BAI.glassDark : variant === 'mid' ? BAI.glassMid : BAI.glassLight
  const border  = variant === 'dark' ? BAI.glassBorderDark : BAI.glassBorder
  const shadow  = variant === 'dark' ? BAI.glassShadowDark : BAI.glassShadow
  const blurVal = blur === 'light' ? BAI.glassBlurLight : BAI.glassBlur
  return {
    background: bg,
    backdropFilter: blurVal,
    WebkitBackdropFilter: blurVal,
    border: `1px solid ${border}`,
    boxShadow: shadow,
  }
}
