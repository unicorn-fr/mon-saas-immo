/**
 * Design system Bailio, direction « Tombée du jour » (15 novembre 2026, maquette docs/maquette/accueil-tombee-du-jour/) :
 * fond lin, encre bleu nuit, titres en Newsreader, liens bleu du soir, un seul bleu marine sobre (#1e2b55) pour tous les
 * aplats sombres et l'action principale (connexion, inscription, menu de l'espace, bandes, boutons), soleil sur fond sombre.
 * Remplace la direction « Bleu clair » ci-dessous (mêmes noms de clés, nouvelles valeurs).
 *
 * Ancienne direction « Bleu clair » (13 novembre 2026, demandée par Enzo : l'allure des logiciels de
 * gestion locative du marché, sans rien en recopier) : docs/design/direction-artistique.md.
 * Fond bleuté, encre bleu nuit, un bleu franc pour les liens et l'action principale, titres en gras, bande bleu nuit.
 * Les noms des clés restent ceux des directions précédentes (owner = couleur de la marque, cta = action principale,
 * night = aplat sombre) : seules les valeurs ont changé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : tableau dans la direction artistique.
 */
export const BAI = {
  // Plaque du logo, aux couleurs des plaques de rue parisiennes : émail bleu, filet blanc, cadre vert
  brand: '#22408c',
  brandFrame: '#1d5a3f',
  fontBrand: "'Bricolage Grotesque Variable', 'Inter Variable', system-ui, sans-serif",
  // Fonds
  bg: '#f3eee6', // fond lin de tout le site,
  surface: '#ffffff', // la feuille,
  night: '#1e2b55', // bleu marine sobre : panneaux, bandes, pied de page (le même bleu partout),
  nightLine: '#2f3d6c',
  nightActive: '#283666',
  nightSoft: '#36457a',
  // Texte
  ink: '#1d2433', // encre bleu nuit (15,5:1 sur blanc),
  inkMid: '#3a4152',
  inkSoft: '#5e6577', // 5,8:1 sur blanc, 5:1 sur le lin,
  onDark: '#f3eee6',
  onDarkMuted: '#b8b2a7',
  onDarkNav: '#e2dcd1',
  // Bordures
  border: '#e3dccf',
  borderStrong: '#837c6e', // bord des champs : 3,6:1 sur le lin (WCAG 1.4.11),
  divider: '#eae4d9',
  dividerSoft: '#f1ece3',
  rule: '#e3dccf',
  skeleton: '#eae4d9',
  dashed: '#bdb4a5',
  timeline: '#eae4d9',
  inkTint: '#eae4d9',
  photoWarm: '#efe6d6',
  photoCool: '#e6e8ee',
  photoSand: '#f1eadf',
  // Bleu « stylo » : liens, sélection, progression, et le bouton de l'action principale (texte blanc, 6,7:1)
  owner: '#2f4fb3', // bleu ciel du soir : liens, sélection (6,3:1 sur le lin),
  ownerHover: '#243f95',
  ownerLight: '#e8ecf8',
  ownerTint: '#eef1fa',
  ownerBorder: '#b9c4e8',
  // Menu latéral de l'espace : bleu plein, texte blanc (5,2:1), entrée en cours plus foncée (7,3:1)
  side: '#1e2b55', // menu latéral : le même bleu marine, texte blanc,
  sideActive: '#2f3d6c',
  sideHover: '#283666',
  sideLine: '#3a4878',
  // Action principale : le seul bouton plein bleu de l'écran
  cta: '#1e2b55', // action principale : bouton bleu marine, texte blanc (13:1),
  ctaHover: '#162146',
  ctaInk: '#ffffff',
  ctaShadow: '0 10px 24px -12px rgba(30, 43, 85, 0.55)',
  cardShadow: '0 1px 2px rgba(29, 36, 51, 0.05), 0 24px 48px -28px rgba(29, 36, 51, 0.3)',
  // Accent : bleu clair sur fond sombre (8,8:1 sur l'encre) ; sur fond clair, `accentInk`
  accent: '#f2b45c', // soleil, sur fond sombre seulement (8,5:1 sur l'encre),
  accentInk: '#8a5310', // soleil sur fond clair,
  accentDark: '#6e420c',
  accentLight: '#f8e7c9',
  accentSoft: '#f2d9ae',
  // Vert « payé »
  green: '#2f6b45',
  greenLight: '#e4efe6',
  greenOnDark: '#9fd3ae',
  greenDarkBg: '#1f3a2a',
  // Aplats de section : bleu très pâle et papier gris
  sky: '#e8ecf8',
  peach: '#f3eee6',
  // Illustrations seulement
  coral: '#e2603f',
  coralInk: '#b03a20',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#c11f2b',
  errorLight: '#fdecec',
  errorTint: '#fbe0e1',
  overlay: 'rgba(29, 36, 51, 0.55)',
  // Inter (variable, licence OFL, servie par le site), titres en gras et texte.
  fontDisplay: "'Newsreader Variable', 'Iowan Old Style', Georgia, serif",
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

/**
 * Nouvelle direction « Tombée du jour » (maquette `docs/maquette/accueil-tombee-du-jour/`) : fond lin, encre bleu
 * nuit, titres en Newsreader, plaque « bailio » bleue. Appliquée page par page, d'abord à l'inscription.
 */
export const DA2 = {
  linen: '#F3EEE6',
  plaster: '#E9E1D5',
  paper: '#FBF9F5',
  ink: '#1D2433',
  mid: '#4A5163',
  soft: '#5E6577',
  line: 'rgba(29, 36, 51, 0.14)',
  lineStrong: 'rgba(29, 36, 51, 0.6)',
  blue: '#22408C',
  blueFrame: '#1D5A3F',
  night: '#1E2B55',
  sky: '#2F4FB3',
  skyTint: '#E6EAF7',
  sun: '#F2B45C',
  sunInk: '#8A5310',
  sunTint: '#F8E7C9',
  white: '#FFFFFF',
  onNight: 'rgba(255, 255, 255, 0.78)',
  onNightSoft: 'rgba(255, 255, 255, 0.6)',
  nightLine: 'rgba(255, 255, 255, 0.18)',
  error: '#B3261E',
  shadow: '0 18px 40px -22px rgba(29, 36, 51, 0.45)',
  serif: "'Newsreader Variable', 'Iowan Old Style', Georgia, serif",
  sans: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  brand: "'Bricolage Grotesque Variable', 'Inter Variable', system-ui, sans-serif",
} as const
