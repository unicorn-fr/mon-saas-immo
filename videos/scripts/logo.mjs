// Logo de Bailio, en vecteurs : « Bailio. » en Cormorant Garamond italique gras (la police du site, licence OFL),
// couleur encre, le point final en caramel. Lettres converties en tracés : aucun besoin de la police pour l'afficher.
// Écrit marque/logo/*.svg et src/marque/logo.json (tracés repris par les visuels Remotion).
// Usage : node scripts/logo.mjs
import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'

const ROOT = new URL('..', import.meta.url).pathname
const font = opentype.loadSync(path.join(ROOT, 'public/fonts/cormorant-garamond-latin-700-italic.woff'))
const ENCRE = '#1a1a2e'
const BLEU = '#1a3270'
const CARAMEL = '#c4976a'
const r = (n) => Math.round(n * 10) / 10

/** Mot + point caramel, à la taille donnée ; renvoie les tracés et la boîte englobante serrée. */
function mot(texte, size) {
  const lettres = font.getPath(texte, 0, 0, size)
  const adv = font.getAdvanceWidth(texte, size)
  const point = font.getPath('.', adv - size * 0.02, 0, size)
  const a = lettres.getBoundingBox()
  const b = point.getBoundingBox()
  const pad = size * 0.06
  const box = [a.x1 - pad, Math.min(a.y1, b.y1) - pad, Math.max(a.x2, b.x2) - a.x1 + 2 * pad, Math.max(a.y2, b.y2) - Math.min(a.y1, b.y1) + 2 * pad]
  return { lettres: lettres.toPathData(1), point: point.toPathData(1), box: box.map(r) }
}

const svgMot = (m, couleur, accent = CARAMEL, fond = null) => {
  const [x, y, w, h] = m.box
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${fond ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fond}"/>` : ''}<path d="${m.lettres}" fill="${couleur}"/><path d="${m.point}" fill="${accent}"/></svg>`
}

/** Pastille carrée « B. » (favicon, très petites tailles). */
function pastille(size = 512, fond = ENCRE, lettre = '#ffffff') {
  const m = mot('B', size * 0.78)
  const [x, y, w, h] = m.box
  const s = Math.min((size * 0.72) / w, (size * 0.72) / h)
  const tx = (size - w * s) / 2 - x * s
  const ty = (size - h * s) / 2 - y * s
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r(size * 0.2)}" fill="${fond}"/><g transform="translate(${r(tx)} ${r(ty)}) scale(${r(s * 1000) / 1000})"><path d="${m.lettres}" fill="${lettre}"/><path d="${m.point}" fill="${CARAMEL}"/></g></svg>`
}

const logo = mot('Bailio', 400)
const out = path.join(ROOT, 'marque/logo')
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
const files = {
  'bailio-logo.svg': svgMot(logo, ENCRE),
  'bailio-logo-bleu.svg': svgMot(logo, BLEU),
  'bailio-logo-blanc.svg': svgMot(logo, '#ffffff'),
  'bailio-pastille.svg': pastille(512),
  'bailio-pastille-claire.svg': pastille(512, '#faf7f2', ENCRE),
}
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, name), svg)
  console.log(`marque/logo/${name}`)
}
const b = mot('B', 400)
fs.writeFileSync(path.join(ROOT, 'src/marque/logo.json'), JSON.stringify({ mot: logo, pastille: b }))
console.log('src/marque/logo.json')
