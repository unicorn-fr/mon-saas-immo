// Logo de Bailio, en vecteurs : monogramme (le « b » maison) et logotype (« bailio », points des i en toits).
// Lettres d'Outfit Bold (licence OFL, public/fonts) converties en tracés : aucun besoin de la police pour afficher le logo.
// Écrit marque/logo/*.svg et src/marque/logo.json (tracés repris par les visuels Remotion).
// Usage : node scripts/logo.mjs
import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'

const ROOT = new URL('..', import.meta.url).pathname
const font = opentype.loadSync(path.join(ROOT, 'public/fonts/outfit-700.ttf'))
const BLEU = '#1a3270'
const CARAMEL = '#c4976a'
const ENCRE = '#1a1a2e'
const CREME = '#faf7f2'
const r = (n) => Math.round(n * 10) / 10

// Épaisseur du fût d'une lettre : celle du « l » à cette taille.
const stemOf = (size) => {
  const b = font.getPath('l', 0, 0, size).getBoundingBox()
  return b.x2 - b.x1
}
const xHeightOf = (size) => (font.tables.os2.sxHeight / font.unitsPerEm) * size

/** Toit : chevron tracé (trait d'épaisseur t, angles nets), de (x1, base) à (x2, base), pointe à hauteur h au-dessus. */
const toit = (x1, x2, base, h) => `M${r(x1)} ${r(base)} L${r((x1 + x2) / 2)} ${r(base - h)} L${r(x2)} ${r(base)}`
const toitSvg = (d, t, color) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r(t)}" stroke-linejoin="miter" stroke-miterlimit="10" stroke-linecap="butt"/>`

// ---- Monogramme : carré arrondi bleu, « b » blanc, toit caramel posé sur la panse (le fût fait cheminée).
function monogramme(size = 512, { fond = BLEU, lettre = '#ffffff', accent = CARAMEL, arrondi = 0.22 } = {}) {
  const fs_ = size * 0.6
  const bb = font.getPath('b', 0, 0, fs_).getBoundingBox()
  const stem = stemOf(fs_)
  const xh = xHeightOf(fs_)
  const w = bb.x2 - bb.x1
  const t = stem * 0.5
  const over = stem * 0.38
  const roofH = (w + 2 * over) * 0.36
  const base = -xh - stem * 0.42
  // Centrage : de la pointe du toit (ou du haut du fût) jusqu'au bas de la lettre.
  const top = Math.min(bb.y1, base - roofH - t)
  const ox = (size - w) / 2 - bb.x1
  const oy = (size - (bb.y2 - top)) / 2 - top
  const lettrePath = font.getPath('b', ox, oy, fs_).toPathData(1)
  const roof = toit(ox + bb.x1 - over, ox + bb.x2 + over, oy + base, roofH)
  const rx = r(size * arrondi)
  return {
    // Le toit passe derrière la lettre : le fût du « b » le traverse comme une cheminée.
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${fond ? `<rect width="${size}" height="${size}" rx="${rx}" fill="${fond}"/>` : ''}${toitSvg(roof, t, accent)}<path d="${lettrePath}" fill="${lettre}"/></svg>`,
    lettre: lettrePath,
    toit: roof,
    trait: r(t),
  }
}

// ---- Logotype : « bailio » avec des i sans point, chaque point remplacé par un petit toit.
function logotype(size = 200, couleur = BLEU, accent = CARAMEL) {
  const mot = 'baılıo'
  const stem = stemOf(size)
  const xh = xHeightOf(size)
  const tracking = -size * 0.012
  let x = 0
  const parts = []
  const toits = []
  const asc = font.getPath('b', 0, 0, size).getBoundingBox().y1 // haut des lettres montantes (négatif)
  for (const ch of mot) {
    const glyph = font.charToGlyph(ch)
    const p = glyph.getPath(x, 0, size)
    parts.push(p.toPathData(1))
    if (ch === 'ı') {
      const b = p.getBoundingBox()
      const cx = (b.x1 + b.x2) / 2
      const w = stem * 1.9
      toits.push(toit(cx - w / 2, cx + w / 2, -xh - stem * 0.5, w * 0.42))
    }
    x += (glyph.advanceWidth / font.unitsPerEm) * size + tracking
  }
  const trait = stem * 0.42
  const top = Math.min(asc, -xh - stem * 0.5 - stem * 1.9 * 0.42 - trait) - size * 0.04
  const bottom = size * 0.03
  const width = x - tracking + size * 0.02
  const height = bottom - top
  const d = parts.join(' ')
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(-size * 0.01)} ${r(top)} ${r(width)} ${r(height)}" width="${r(width)}" height="${r(height)}"><path d="${d}" fill="${couleur}"/>${toits.map((t) => toitSvg(t, trait, accent)).join('')}</svg>`,
    lettres: d,
    toits,
    trait: r(trait),
    viewBox: [r(-size * 0.01), r(top), r(width), r(height)],
  }
}

// ---- Logo horizontal : monogramme + logotype.
function horizontal({ fond = null, mot = BLEU } = {}) {
  // Sur fond bleu, le monogramme passe en blanc (carré blanc, « b » bleu).
  const m = mot === BLEU ? monogramme(512) : monogramme(512, { fond: '#ffffff', lettre: BLEU })
  const l = logotype(300, mot)
  const [vx, vy, vw, vh] = l.viewBox
  const H = 512
  const scale = (H * 0.86) / vh
  const gap = 110
  const W = 512 + gap + vw * scale
  const inner = `<g>${m.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g><g transform="translate(${r(512 + gap - vx * scale)} ${r(H * 0.07 - vy * scale)}) scale(${r(scale * 1000) / 1000})"><path d="${l.lettres}" fill="${mot}"/>${l.toits.map((t) => toitSvg(t, l.trait, CARAMEL)).join('')}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(W)} ${H}" width="${r(W)}" height="${H}">${fond ? `<rect width="${r(W)}" height="${H}" fill="${fond}"/>` : ''}${inner}</svg>`
}

const out = path.join(ROOT, 'marque/logo')
fs.mkdirSync(out, { recursive: true })
const files = {
  'bailio-monogramme.svg': monogramme(512).svg,
  'bailio-monogramme-creme.svg': monogramme(512, { fond: CREME, lettre: BLEU }).svg,
  'bailio-monogramme-nu.svg': monogramme(512, { fond: null, lettre: BLEU }).svg,
  'bailio-logotype.svg': logotype(300).svg,
  'bailio-logotype-blanc.svg': logotype(300, '#ffffff').svg,
  'bailio-logotype-encre.svg': logotype(300, ENCRE).svg,
  'bailio-logo.svg': horizontal(),
  'bailio-logo-blanc.svg': horizontal({ mot: '#ffffff' }),
}
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(out, name), svg)
  console.log(`marque/logo/${name}`)
}
const m = monogramme(512)
const l = logotype(300)
fs.writeFileSync(path.join(ROOT, 'src/marque/logo.json'), JSON.stringify({ monogramme: { lettre: m.lettre, toit: m.toit, trait: m.trait }, logotype: { lettres: l.lettres, toits: l.toits, trait: l.trait, viewBox: l.viewBox } }))
console.log('src/marque/logo.json')

// Icônes Lucide (licence ISC, lucide.dev) utilisées par les visuels : tracés extraits dans src/marque/icones.json.
const ICONES = ['file-text', 'pen-line', 'receipt-euro', 'clipboard-check', 'lightbulb', 'circle-play', 'star', 'circle-help', 'sparkles', 'house', 'bell-ring', 'key-round', 'check']
const icones = {}
for (const nom of ICONES) {
  const svg = fs.readFileSync(path.join(ROOT, `node_modules/lucide-static/icons/${nom}.svg`), 'utf8')
  icones[nom] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').trim()
}
fs.writeFileSync(path.join(ROOT, 'src/marque/icones.json'), JSON.stringify(icones))
console.log('src/marque/icones.json')
