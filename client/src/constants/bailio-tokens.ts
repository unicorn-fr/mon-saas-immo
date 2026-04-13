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
} as const

export type BaiTokens = typeof BAI
