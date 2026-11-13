/**
 * Design system Bailio, direction « Bleu clair » (13 novembre 2026, demandée par Enzo : l'allure des logiciels de
 * gestion locative du marché, sans rien en recopier) : docs/design/direction-artistique.md.
 * Fond bleuté, encre bleu nuit, un bleu franc pour les liens et l'action principale, titres en gras, bande bleu nuit.
 * Les noms des clés restent ceux des directions précédentes (owner = couleur de la marque, cta = action principale,
 * night = aplat sombre) : seules les valeurs ont changé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : tableau dans la direction artistique.
 */
export const BAI = {
  // Fonds
  bg: '#f4f7fd', // fond de l'espace (gris très clair) ; pages publiques sur `surface`
  surface: '#ffffff', // la feuille
  night: '#0b1638', // aplat sombre : menu latéral, bande inversée, pied de page
  nightLine: '#1f2c58',
  nightActive: '#16244f',
  nightSoft: '#22305e',
  // Texte
  ink: '#0d1b3e', // encre (18:1 sur blanc)
  inkMid: '#2b3a5c',
  inkSoft: '#56637f', // 6,5:1 sur blanc, 5,8:1 sur le fond
  onDark: '#f4f7fd',
  onDarkMuted: '#aebad6',
  onDarkNav: '#d3dbef',
  // Bordures
  border: '#e2e8f4',
  borderStrong: '#8590ab', // bord des champs et boutons à choix : 3,45:1 sur blanc (WCAG 1.4.11)
  divider: '#e8edf6',
  dividerSoft: '#eff3fa',
  rule: '#e2e8f4',
  skeleton: '#e8edf6',
  dashed: '#b8c2d9',
  timeline: '#e8edf6',
  inkTint: '#e8edf6',
  photoWarm: '#e6edfb',
  photoCool: '#e1e9f8',
  photoSand: '#edf2fc',
  // Bleu « stylo » : liens, sélection, progression, et le bouton de l'action principale (texte blanc, 6,7:1)
  owner: '#2563eb',
  ownerHover: '#1d4ed8',
  ownerLight: '#eaf1fe',
  ownerTint: '#eef4fe',
  ownerBorder: '#b3cbfa',
  // Menu latéral de l'espace : bleu plein, texte blanc (5,2:1), entrée en cours plus foncée (7,3:1)
  side: '#2563eb',
  sideActive: '#1a46c9',
  sideHover: '#1f55d9',
  sideLine: '#4b7ff0',
  // Action principale : le seul bouton plein bleu de l'écran
  cta: '#2563eb',
  ctaHover: '#1d4ed8',
  ctaInk: '#ffffff',
  ctaShadow: '0 8px 20px -8px rgba(37, 99, 235, 0.65)', // ombre bleutée sous le bouton principal
  cardShadow: '0 1px 2px rgba(13, 27, 62, 0.05), 0 24px 48px -28px rgba(13, 27, 62, 0.28)', // cartes blanches
  // Accent : bleu clair sur fond sombre (8,8:1 sur l'encre) ; sur fond clair, `accentInk`
  accent: '#8fb4ff',
  accentInk: '#2563eb',
  accentDark: '#1d4ed8',
  accentLight: '#eaf1fe',
  accentSoft: '#c6d8fd',
  // Vert « payé »
  green: '#17753f',
  greenLight: '#e7f5ec',
  greenOnDark: '#8fd6a9',
  greenDarkBg: '#123a2a',
  // Aplats de section : bleu très pâle et papier gris
  sky: '#eaf1fe',
  peach: '#f4f7fd',
  // Illustrations seulement
  coral: '#e2603f',
  coralInk: '#b03a20',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#c11f2b',
  errorLight: '#fdecec',
  errorTint: '#fbe0e1',
  overlay: 'rgba(13, 27, 62, 0.5)',
  // Inter (variable, licence OFL, servie par le site), titres en gras et texte.
  fontDisplay: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontBody: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  // Formes (rayons « soft » de la skill : cartes 20, champs 12, boutons 10)
  radius: 18,
  radiusField: 12,
  radiusBtn: 10,
  fold: 28,
  // Points de rupture
  bpMd: 768,
  bpLg: 1024,
} as const
