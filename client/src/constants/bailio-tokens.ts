/**
 * Design system Bailio, direction « Midi » (octobre 2026) : docs/design/direction-artistique.md.
 * Palette « Confiance et élan », choisie d'après la recherche sur la couleur (sources dans la direction
 * artistique) : bleu sobre pour la confiance et la compétence, un seul orange vif réservé à l'action
 * principale pour qu'elle se détache (effet d'isolement), vert pour ce qui est fait. Aplats, pas de dégradé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : voir le tableau de la direction artistique.
 */
export const BAI = {
  // Fonds
  bg: '#f5f7fa', // fond de page (gris bleuté très clair)
  surface: '#ffffff',
  night: '#0f1f3d', // bleu nuit : blocs sombres, menu latéral, texte des boutons orange
  nightLine: '#2a3a5c', // séparateurs sur fond sombre
  nightActive: '#1c2f55', // entrée active du menu latéral
  nightSoft: '#24375e', // pastille et séparateur du menu latéral
  // Texte
  ink: '#16233f',
  inkMid: '#3b4659',
  inkSoft: '#5b6577',
  onDark: '#dbe3f1',
  onDarkMuted: '#b7c3d9',
  onDarkNav: '#c9d3e6', // liens du menu latéral
  // Bordures
  border: '#dfe4ec',
  borderStrong: '#7c8597', // bord des champs et boutons à choix : contraste 3:1 minimum (WCAG 1.4.11)
  divider: '#e5e9f0',
  dividerSoft: '#edf0f5',
  rule: '#d6dce6',
  skeleton: '#eaeef4',
  dashed: '#b8c0cd', // cadre pointillé, étape non remplie
  timeline: '#edf1f6',
  inkTint: '#e6ebf3', // étiquette neutre
  photoWarm: '#e9e2d8', // fond d'une vignette sans photo
  photoCool: '#d6e0ee',
  photoSand: '#ece7df',
  // Bleu confiance : couleur de la marque (liens, sélection, pastilles, progression)
  owner: '#1f4396',
  ownerHover: '#17336f',
  ownerLight: '#eaf0fb',
  ownerTint: '#e3ecfb',
  ownerBorder: '#bfd0ef',
  // Orange : le bouton de l'action principale, un seul par écran. Texte bleu nuit dessus (blanc illisible).
  cta: '#ff8a3d',
  ctaHover: '#ff7a24',
  ctaInk: '#0f1f3d',
  // Accent orange. `accent` seulement sur fond sombre ; sur fond clair `accentInk` ; sur un bloc bleu `accentSoft`.
  accent: '#ff8a3d',
  accentInk: '#c2410c',
  accentDark: '#9a3412',
  accentLight: '#ffedd5',
  accentSoft: '#ffb27a',
  // Vert (validé, enregistré)
  green: '#1f7a4a',
  greenLight: '#e3f3e8',
  greenOnDark: '#8fd6a9',
  greenDarkBg: '#1d4a33',
  // Aplats de section (texte `ink` ou `owner` dessus)
  sky: '#dbe7fb',
  peach: '#fde4cf',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#c11f2b',
  errorLight: '#fdecec',
  errorTint: '#fbe0e1', // étiquette et encadré d'alerte
  overlay: 'rgba(15, 31, 61, 0.5)', // fond derrière une fenêtre
  // Typographies : Fraunces (titres, accroches courtes), Figtree (tout le reste)
  fontDisplay: "'Fraunces Variable', Georgia, serif",
  fontBody: "'Figtree', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  // Formes : rayon des cartes, du coin replié (module « page de bail »), des champs
  radius: 24,
  radiusField: 14,
  fold: 28,
  // Points de rupture
  bpMd: 768,
  bpLg: 1024,
} as const
