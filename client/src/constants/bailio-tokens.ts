/**
 * Design system Bailio — tokens issus de la maquette « refonte propriétaire ».
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 */
export const BAI = {
  // Fonds
  bg: '#faf7f2', // fond de page (crème)
  surface: '#ffffff',
  night: '#1a1a2e', // encre principale, blocs sombres, CTA secondaires
  nightLine: '#34344f', // séparateurs sur fond sombre
  nightActive: '#2c2c48', // entrée active du menu latéral
  nightSoft: '#2e2e4a', // pastille et séparateur du menu latéral
  // Texte
  ink: '#1a1a2e',
  inkMid: '#45455a',
  inkSoft: '#5a5a6e',
  onDark: '#d6d1e0',
  onDarkMuted: '#b9b3c9',
  onDarkNav: '#c9c4d6', // liens du menu latéral
  // Bordures
  border: '#e3dccf',
  borderStrong: '#d7cfc1',
  divider: '#ebe4d8',
  dividerSoft: '#efe9df',
  rule: '#ddd5c7',
  skeleton: '#efeae2',
  dashed: '#c9bfae', // cadre pointillé, étape non remplie
  timeline: '#f0ebe2',
  inkTint: '#ece8f2', // étiquette neutre
  photoWarm: '#d9cfc0', // fond d'une vignette sans photo
  photoCool: '#c9d0de',
  photoSand: '#e7e1d6',
  // Accent propriétaire (bleu) — CTA principal
  owner: '#1a3270',
  ownerHover: '#0f1f4a',
  ownerLight: '#eef1f8',
  ownerTint: '#e8ecf6',
  ownerBorder: '#cfd6e6',
  // Caramel
  caramel: '#c4976a',
  caramelInk: '#8a5f36',
  caramelDark: '#7a5230',
  caramelLight: '#f5ece1',
  // Vert (validé, enregistré)
  green: '#1b5e3b',
  greenLight: '#e6f0ea',
  greenOnDark: '#9fd3b4',
  greenDarkBg: '#2c4a3a',
  // Erreur / avertissement
  error: '#9a3412',
  errorLight: '#fdf1ea',
  errorTint: '#fbeee4', // étiquette et encadré d'alerte
  overlay: 'rgba(26, 26, 46, 0.45)', // fond derrière une fenêtre
  // Typographies
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  // Points de rupture
  bpMd: 768,
  bpLg: 1024,
} as const
