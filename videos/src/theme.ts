import { staticFile } from 'remotion'

/** Couleurs de Bailio (client/src/constants/bailio-tokens.ts). */
export const C = {
  bg: '#faf7f2',
  surface: '#ffffff',
  night: '#1a1a2e',
  nightSoft: '#2e2e4a',
  ink: '#1a1a2e',
  inkMid: '#45455a',
  onDark: '#d6d1e0',
  owner: '#1a3270',
  ownerLight: '#eef1f8',
  caramel: '#c4976a',
  green: '#1b5e3b',
}

export const FPS = 30
export const W = 1080
export const H = 1920

export const serif = 'Cormorant Garamond'
export const sans = 'DM Sans'

/** Polices du site, servies depuis public/fonts (aucun appel à internet au rendu). */
export const fontFaces = `
@font-face { font-family: '${serif}'; font-style: italic; font-weight: 700; src: url('${staticFile('fonts/cormorant-garamond-latin-700-italic.woff2')}') format('woff2'); }
@font-face { font-family: '${sans}'; font-weight: 400; src: url('${staticFile('fonts/dm-sans-latin-400-normal.woff2')}') format('woff2'); }
@font-face { font-family: '${sans}'; font-weight: 500; src: url('${staticFile('fonts/dm-sans-latin-500-normal.woff2')}') format('woff2'); }
@font-face { font-family: '${sans}'; font-weight: 700; src: url('${staticFile('fonts/dm-sans-latin-700-normal.woff2')}') format('woff2'); }
`
