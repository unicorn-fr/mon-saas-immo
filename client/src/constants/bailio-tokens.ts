/**
 * Design system Bailio, direction « Midi » (octobre 2026) : docs/design/direction-artistique.md.
 * Pierre claire de Montpellier pour le fond, bleu canard des persiennes pour l'action, framboise du
 * laurier-rose pour l'accent, olive pour ce qui est validé. Aplats de couleur unie, pas de dégradé.
 * Toute couleur passe par BAI : aucune valeur hexadécimale en dur dans les composants.
 * Contrastes vérifiés (WCAG 2.1 AA) : voir le tableau de la direction artistique.
 */
export const BAI = {
  // Fonds
  bg: '#f4f4f0', // fond de page (pierre claire)
  surface: '#ffffff',
  night: '#0d2a2c', // canard nuit : blocs sombres, menu latéral, CTA secondaires
  nightLine: '#2a4a4c', // séparateurs sur fond sombre
  nightActive: '#1a3d40', // entrée active du menu latéral
  nightSoft: '#22474a', // pastille et séparateur du menu latéral
  // Texte
  ink: '#16201e',
  inkMid: '#3a4542',
  inkSoft: '#525d5a',
  onDark: '#d6e4e2',
  onDarkMuted: '#b3c7c4',
  onDarkNav: '#c7d9d6', // liens du menu latéral
  // Bordures
  border: '#dde1dc',
  borderStrong: '#78837f', // bord des champs et boutons à choix : contraste 3:1 minimum (WCAG 1.4.11)
  divider: '#e4e7e2',
  dividerSoft: '#ecefea',
  rule: '#d5dad4',
  skeleton: '#eaede8',
  dashed: '#b5bdb7', // cadre pointillé, étape non remplie
  timeline: '#edf0eb',
  inkTint: '#e6ebe9', // étiquette neutre
  photoWarm: '#e2ddd2', // fond d'une vignette sans photo
  photoCool: '#d3e0de',
  photoSand: '#e9e6dc',
  // Bleu canard (persiennes) : action principale
  owner: '#0f5257',
  ownerHover: '#0a3a3e',
  ownerLight: '#e7f0ef',
  ownerTint: '#dcebea',
  ownerBorder: '#b7d1cf',
  // Framboise (laurier-rose) : accent. `accent` seulement sur fond sombre ; sur fond clair `accentInk`.
  accent: '#f59bb4',
  accentInk: '#a3264d',
  accentDark: '#8a1f41',
  accentLight: '#fce3ea',
  // Olive (validé, enregistré)
  green: '#3b6a1d',
  greenLight: '#e9f0dc',
  greenOnDark: '#b8da8f',
  greenDarkBg: '#2b4a1c',
  // Aplats de section (texte `ink` ou `owner` dessus)
  pistache: '#d6e29c',
  rose: '#f8c9d5',
  // Erreur : le rouge ne sert qu'aux erreurs
  error: '#b42318',
  errorLight: '#fdecea',
  errorTint: '#fbe1dd', // étiquette et encadré d'alerte
  overlay: 'rgba(13, 42, 44, 0.5)', // fond derrière une fenêtre
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
