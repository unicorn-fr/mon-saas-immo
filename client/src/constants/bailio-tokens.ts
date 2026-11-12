/**
 * Design system Bailio, direction « Maison habitée » (novembre 2026) : docs/design/direction-artistique.md.
 * Une couleur dominante, le vert forêt des volets et des jardins (sérieux, calme, durable), un fond « brume » vert très
 * pâle, et un seul accent chaud : le jaune « soleil » d'une fenêtre allumée, réservé à l'action principale et à ce qui
 * vient d'arriver de bon (un loyer reçu). La pêche et le corail ne servent qu'aux illustrations et aux personnes.
 * Les noms des clés restent ceux de la direction précédente (owner = couleur de la marque, cta = action principale,
 * night = aplat sombre) pour que toute l'application change d'un coup : seules les valeurs ont changé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : tableau dans la direction artistique.
 */
export const BAI = {
  // Fonds
  bg: '#eef3ef', // « brume » : fond de l'application (vert très pâle, ni gris froid ni crème)
  surface: '#ffffff', // « papier »
  night: '#163c34', // « forêt » : aplats sombres, menu latéral, texte des boutons soleil
  nightLine: '#2b5248', // séparateurs sur fond forêt
  nightActive: '#1f4a40', // entrée active du menu latéral
  nightSoft: '#2a5046', // pastille et séparateur du menu latéral
  // Texte
  ink: '#13241f', // « encre » (16:1 sur papier)
  inkMid: '#33453f',
  inkSoft: '#4a5c55', // 7:1 sur papier, 6,3:1 sur brume
  onDark: '#dce9e2',
  onDarkMuted: '#b7ccc2',
  onDarkNav: '#cbddd4', // liens du menu latéral
  // Bordures
  border: '#d9e3dd',
  borderStrong: '#7b8c85', // bord des champs et boutons à choix : 3,5:1 sur papier (WCAG 1.4.11)
  divider: '#e1e9e4',
  dividerSoft: '#eaf0ec',
  rule: '#d3ded8',
  skeleton: '#e4ece7',
  dashed: '#afc0b8', // cadre pointillé, étape non remplie
  timeline: '#e8efea',
  inkTint: '#e3ece6', // étiquette neutre
  photoWarm: '#ece3d6', // fond d'une vignette sans photo
  photoCool: '#d5e5dc',
  photoSand: '#efe8dc',
  // Vert « sauge » : couleur de la marque (liens, sélection, pastilles, progression). 6,3:1 sur papier.
  owner: '#2f6a58',
  ownerHover: '#23564a',
  ownerLight: '#e3efe8',
  ownerTint: '#dcebe2',
  ownerBorder: '#b4cfc2',
  // « Soleil » : le bouton de l'action principale, un seul par écran. Texte forêt dessus (7,6:1) ; jamais de blanc.
  cta: '#ffc444',
  ctaHover: '#ffb61f',
  ctaInk: '#163c34',
  // Accent soleil. `accent` sur fond forêt seulement ; sur fond clair, texte `accentInk` (ambre, 5,9:1).
  accent: '#ffc444',
  accentInk: '#8a5a00',
  accentDark: '#6e4700',
  accentLight: '#fff1cc',
  accentSoft: '#ffd878',
  // Vert « validé » (enregistré, payé)
  green: '#1e7a4f',
  greenLight: '#e2f3e8',
  greenOnDark: '#8fd6a9',
  greenDarkBg: '#1d4a33',
  // Aplats de section (texte `ink` ou `night` dessus) : « mousse » et « pêche »
  sky: '#dcebdf',
  peach: '#ffe3d3',
  // Corail : visages et détails des illustrations seulement ; en texte, `coralInk` (5,7:1)
  coral: '#e8664a',
  coralInk: '#b63e25',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#c11f2b',
  errorLight: '#fdecec',
  errorTint: '#fbe0e1', // étiquette et encadré d'alerte
  overlay: 'rgba(22, 60, 52, 0.5)', // fond derrière une fenêtre
  // Typographies : Bricolage Grotesque (titres, chiffres, mots-clés), Atkinson Hyperlegible Next (tout le reste,
  // pensée pour la lisibilité : lettres faciles à distinguer, utile à des lecteurs pressés).
  fontDisplay: "'Bricolage Grotesque Variable', 'Atkinson Hyperlegible Next Variable', sans-serif",
  fontBody: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
  // Formes : rayon des cartes, du coin replié (module « page de bail »), des champs
  radius: 24,
  radiusField: 14,
  fold: 28,
  // Points de rupture
  bpMd: 768,
  bpLg: 1024,
} as const
