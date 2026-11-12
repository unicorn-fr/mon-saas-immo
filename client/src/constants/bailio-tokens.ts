/**
 * Design system Bailio, direction « Feuille et stylo » (novembre 2026) : docs/design/direction-artistique.md.
 * Palette « white-link-blue » de la skill taste (design-taste-frontend, library/palettes.json, faite pour le logiciel
 * et la finance) : une feuille blanche, une encre noire, un seul bleu « stylo bille » pour les liens et l'action
 * principale. Comme un bail qu'on relit et qu'on signe. Rien d'autre ne porte de couleur, sauf le vert « payé » et le
 * rouge des erreurs.
 * Les noms des clés restent ceux des directions précédentes (owner = couleur de la marque, cta = action principale,
 * night = aplat sombre) pour que toute l'application change d'un coup : seules les valeurs ont changé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : tableau dans la direction artistique.
 */
export const BAI = {
  // Fonds
  bg: '#f4f4f4', // fond de l'espace (gris très clair) ; pages publiques sur `surface`
  surface: '#ffffff', // la feuille
  night: '#111111', // aplat sombre : menu latéral, bande inversée, pied de page
  nightLine: '#2a2a2a',
  nightActive: '#232323',
  nightSoft: '#2e2e2e',
  // Texte
  ink: '#111111', // encre (18:1 sur blanc)
  inkMid: '#3a3a3a',
  inkSoft: '#5f5f5f', // 6,5:1 sur blanc, 5,8:1 sur le fond
  onDark: '#f4f4f4',
  onDarkMuted: '#b5b5b5',
  onDarkNav: '#d6d6d6',
  // Bordures
  border: '#e4e4e4',
  borderStrong: '#8a8a8a', // bord des champs et boutons à choix : 3,45:1 sur blanc (WCAG 1.4.11)
  divider: '#ececec',
  dividerSoft: '#f0f0f0',
  rule: '#e0e0e0',
  skeleton: '#ececec',
  dashed: '#bdbdbd',
  timeline: '#ededed',
  inkTint: '#ececec',
  photoWarm: '#efebe5',
  photoCool: '#e6eaf2',
  photoSand: '#f1eee8',
  // Bleu « stylo » : liens, sélection, progression, et le bouton de l'action principale (texte blanc, 6,7:1)
  owner: '#1a4be0',
  ownerHover: '#143bb3',
  ownerLight: '#eef2fe',
  ownerTint: '#e3e9fd',
  ownerBorder: '#b9c9f7',
  // Action principale : le seul bouton plein bleu de l'écran
  cta: '#1a4be0',
  ctaHover: '#143bb3',
  ctaInk: '#ffffff',
  // Accent : bleu clair sur fond sombre (8,8:1 sur l'encre) ; sur fond clair, `accentInk`
  accent: '#8fb0ff',
  accentInk: '#1a4be0',
  accentDark: '#143bb3',
  accentLight: '#eef2fe',
  accentSoft: '#c9d7fc',
  // Vert « payé »
  green: '#1a7f45',
  greenLight: '#e7f5ec',
  greenOnDark: '#8fd6a9',
  greenDarkBg: '#173a26',
  // Aplats de section : bleu très pâle et papier gris
  sky: '#eef2fe',
  peach: '#f4f4f4',
  // Illustrations seulement
  coral: '#e2603f',
  coralInk: '#b03a20',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#c11f2b',
  errorLight: '#fdecec',
  errorTint: '#fbe0e1',
  overlay: 'rgba(17, 17, 17, 0.5)',
  // Instrument Sans (skill taste : « design and productivity software », précise et amicale), titres et texte.
  fontDisplay: "'Instrument Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontBody: "'Instrument Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  // Formes (rayons « soft » de la skill : cartes 20, champs 12, boutons 10)
  radius: 20,
  radiusField: 12,
  radiusBtn: 10,
  fold: 28,
  // Points de rupture
  bpMd: 768,
  bpLg: 1024,
} as const
