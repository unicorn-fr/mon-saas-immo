/* Objets 3D des vidéos (three.js, construits en code : rien à télécharger, aucun droit à payer).
   Couleurs de la direction « Tombée du jour » du site : nuit, lin, soleil, encre. */
import * as THREE from 'three'
import { RoomEnvironment } from '../lib/RoomEnvironment.js'
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js'

export const COL = { night: 0x1e2b55, linen: 0xf3eee6, sun: 0xf2b45c, ink: 0x1d2433, sky: 0xdfe6f3, white: 0xffffff }
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...o })
const metal = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.85 })

/** Texture de texte (police du site, chargée avant). */
function textTex(lines, { w = 512, h = 512, bg = '#ffffff', fg = '#1d2433', font = '800 120px Inter', align = 'center', lineH = 1.15, pad = 40, extra } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h)
  if (extra) extra(g, w, h)
  g.fillStyle = fg; g.font = font; g.textAlign = align; g.textBaseline = 'middle'
  const size = parseInt(font.match(/(\d+)px/)[1])
  const total = lines.length * size * lineH
  lines.forEach((l, i) => g.fillText(l, align === 'center' ? w / 2 : pad, h / 2 - total / 2 + size * lineH * (i + 0.5)))
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

/* ---------- Modèles ---------- */
function coin(label = '€') {
  const g = new THREE.Group()
  const tex = textTex([label], { bg: '#f2b45c', fg: '#a86f1c', font: '900 300px Inter' })
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.28, 72), metal(COL.sun))
  m.rotation.x = Math.PI / 2; g.add(m)
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.7 })
  const f1 = new THREE.Mesh(new THREE.CircleGeometry(1.42, 72), face); f1.position.z = 0.142; g.add(f1)
  const f2 = new THREE.Mesh(new THREE.CircleGeometry(1.42, 72), face); f2.position.z = -0.142; f2.rotation.y = Math.PI; g.add(f2)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 16, 72), metal(0xd99a3e)); g.add(rim)
  return g
}
function stack() {
  const g = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.24, 64), metal(i % 2 ? 0xf2b45c : 0xe7a94e))
    c.position.set(Math.sin(i * 1.7) * 0.08, -1 + i * 0.26, Math.cos(i) * 0.08); g.add(c)
  }
  const top = coin('€'); top.scale.setScalar(0.75); top.position.set(1.2, 0.9, 0.6); top.rotation.set(-0.3, 0.6, 0.2); g.add(top)
  g.rotation.x = 0.35
  return g
}
function key() {
  const g = new THREE.Group(), m = metal(COL.sun)
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.24, 24, 64), m); head.position.x = -1.6; g.add(head)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.8, 24), m); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.5; g.add(shaft)
  for (const [x, h] of [[1.2, 0.5], [1.55, 0.35], [1.85, 0.55]]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.2), m); t.position.set(x, -h / 2, 0); g.add(t) }
  const tag = new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.4, 0.08, 4, 0.12), std(COL.night)); tag.position.set(-2.6, -1.1, 0); tag.rotation.z = 0.4; g.add(tag)
  g.scale.setScalar(0.82); g.position.x = 0.35
  const w = new THREE.Group(); w.add(g)
  return w
}
function house() {
  const g = new THREE.Group()
  const walls = new THREE.Mesh(new RoundedBoxGeometry(2.6, 2, 2.2, 4, 0.06), std(COL.linen)); g.add(walls)
  const roofM = std(COL.night)
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.18, 2.5, 3, 0.05), roofM); r.position.set(s * 0.68, 1.55, 0); r.rotation.z = -s * 0.68; g.add(r) }
  const gable = new THREE.Shape(); gable.moveTo(-1.3, 0); gable.lineTo(1.3, 0); gable.lineTo(0, 1.05); gable.closePath()
  for (const z of [1.1, -1.1]) { const gm = new THREE.Mesh(new THREE.ShapeGeometry(gable), std(COL.linen, { side: THREE.DoubleSide })); gm.position.set(0, 1, z); g.add(gm) }
  const win = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.75, 0.1, 3, 0.05), new THREE.MeshStandardMaterial({ color: COL.sun, emissive: COL.sun, emissiveIntensity: 0.9 })); win.position.set(-0.55, 0.2, 1.12); g.add(win)
  const cross = std(COL.linen); for (const [w, h] of [[0.06, 0.75], [0.75, 0.06]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), cross); c.position.set(-0.55, 0.2, 1.18); g.add(c) }
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1.15, 0.1, 3, 0.05), std(COL.night)); door.position.set(0.6, -0.42, 1.12); g.add(door)
  const chim = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.8, 0.35, 3, 0.04), std(COL.night)); chim.position.set(0.75, 1.95, -0.4); g.add(chim)
  return g
}
function doc(title = 'BAIL') {
  const g = new THREE.Group()
  const tex = textTex([], { w: 512, h: 700, bg: '#ffffff', extra: (c, w) => {
    c.fillStyle = '#1e2b55'; c.font = '800 92px Inter'; c.textAlign = 'left'; c.fillText(title, 48, 120)
    c.fillStyle = '#f2b45c'; c.fillRect(48, 160, 160, 14)
    c.fillStyle = '#c9cfdc'; for (let i = 0; i < 9; i++) c.fillRect(48, 230 + i * 46, i % 3 === 2 ? 260 : 410, 16)
    c.strokeStyle = '#1e2b55'; c.lineWidth = 6; c.beginPath(); c.moveTo(300, 640); c.bezierCurveTo(330, 580, 360, 680, 400, 620); c.bezierCurveTo(420, 600, 440, 640, 460, 615); c.stroke()
  } })
  const paper = new THREE.Mesh(new RoundedBoxGeometry(2.4, 3.3, 0.06, 3, 0.03), [std(COL.white), std(COL.white), std(COL.white), std(COL.white), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), std(COL.white)])
  g.add(paper)
  const back = new THREE.Mesh(new RoundedBoxGeometry(2.4, 3.3, 0.05, 3, 0.03), std(COL.sky)); back.position.set(0.25, -0.2, -0.12); back.rotation.z = -0.08; g.add(back)
  const pen = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 20), std(COL.night)); pen.add(body)
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 20), metal(COL.sun)); tip.position.y = -1.25; tip.rotation.x = Math.PI; pen.add(tip)
  pen.position.set(1.15, -0.7, 0.4); pen.rotation.z = 0.7; g.add(pen)
  return g
}
function calendar(label = '6') {
  const g = new THREE.Group()
  const tex = textTex([], { w: 512, h: 560, bg: '#ffffff', extra: (c, w, h) => {
    c.fillStyle = '#f2b45c'; c.fillRect(0, 0, w, 150)
    c.fillStyle = '#1e2b55'; let fs = 230; c.font = `900 ${fs}px Inter`; while (c.measureText(label).width > w * 0.84) { fs -= 8; c.font = `900 ${fs}px Inter` } c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, w / 2, 360)
  } })
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.6, 2.85, 0.3, 4, 0.12), [std(COL.white), std(COL.white), std(COL.white), std(COL.white), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), std(COL.white)])
  g.add(body)
  for (const x of [-0.7, 0.7]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 12, 32), metal(COL.night)); r.position.set(x, 1.45, 0); g.add(r) }
  return g
}
function phone() {
  const g = new THREE.Group()
  const tex = textTex([], { w: 360, h: 720, bg: '#1e2b55', extra: (c, w) => {
    c.fillStyle = '#f3eee6'; c.font = '700 44px Inter'; c.textAlign = 'center'; c.fillText('06 •• •• •• ••', w / 2, 300)
    c.fillStyle = '#f2b45c'; c.beginPath(); c.arc(w / 2, 470, 60, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#1e2b55'; c.font = '900 64px Inter'; c.fillText('✆', w / 2, 492)
  } })
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.7, 3.4, 0.22, 6, 0.25), [std(COL.ink), std(COL.ink), std(COL.ink), std(COL.ink), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.2 }), std(COL.ink)])
  g.add(body)
  return g
}
function envelope() {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.1, 0.12, 3, 0.04), std(0xffffff)); g.add(body)
  const edge = new THREE.Mesh(new RoundedBoxGeometry(3.3, 2.2, 0.08, 3, 0.05), std(COL.night)); edge.position.z = -0.05; g.add(edge)
  const flap = new THREE.Shape(); flap.moveTo(-1.6, 1.05); flap.lineTo(1.6, 1.05); flap.lineTo(0, -0.15); flap.closePath()
  const f = new THREE.Mesh(new THREE.ShapeGeometry(flap), std(COL.sky, { side: THREE.DoubleSide })); f.position.z = 0.07; g.add(f)
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 40), std(COL.sun, { metalness: 0.3 })); seal.rotation.x = Math.PI / 2; seal.position.set(0, -0.12, 0.1); g.add(seal)
  return g
}
function ban() {
  const g = new THREE.Group(), m = std(COL.ink, { roughness: 0.3 })
  g.add(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.22, 24, 80), m))
  const bar = new THREE.Mesh(new RoundedBoxGeometry(3, 0.42, 0.42, 3, 0.1), m); bar.rotation.z = Math.PI / 4; g.add(bar)
  const c = coin('€'); c.scale.setScalar(0.62); c.position.z = -0.4; g.add(c)
  return g
}
function gavel() {
  const g = new THREE.Group(), wood = std(0x6b4a2f, { roughness: 0.55 })
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 32), wood); head.rotation.z = Math.PI / 2; head.position.y = 0.9; g.add(head)
  for (const x of [-0.75, 0.75]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 32), metal(COL.sun)); b.rotation.z = Math.PI / 2; b.position.set(x, 0.9, 0); g.add(b) }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 20), wood); handle.position.y = -0.5; g.add(handle)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.35, 48), std(COL.night)); base.position.set(0.9, -1.8, 0); g.add(base)
  g.rotation.z = -0.5
  const w = new THREE.Group(); g.scale.setScalar(0.85); g.position.y = 0.55; w.add(g)
  return w
}
/** Le « b habité » du site, en relief : b lin, fenêtre allumée. */
function logo() {
  const g = new THREE.Group(), k = 1 / 160
  const P = (x, y) => [(x - 300) * k, (364 - y) * k]
  const stem = new THREE.Shape(); stem.moveTo(...P(51, 727)); stem.lineTo(...P(51, 67)); stem.lineTo(...P(195, 0)); stem.lineTo(...P(195, 727)); stem.closePath()
  const bowl = new THREE.Shape(); bowl.moveTo(...P(120, 727)); bowl.lineTo(...P(298, 727))
  const [cx, cy] = P(298, 457); bowl.absarc(cx, cy, 270 * k, -Math.PI / 2, Math.PI / 2, false); bowl.lineTo(...P(120, 187)); bowl.closePath()
  const hole = new THREE.Path(); const [wx, wy] = P(195, 585), [wx2, wy2] = P(424, 329); hole.moveTo(wx, wy); hole.lineTo(wx2, wy); hole.lineTo(wx2, wy2); hole.lineTo(wx, wy2); hole.closePath(); bowl.holes.push(hole)
  const opt = { depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 4 }
  const lin = std(COL.linen, { roughness: 0.35 })
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(stem, opt), lin), new THREE.Mesh(new THREE.ExtrudeGeometry(bowl, opt), lin))
  const win = new THREE.Mesh(new THREE.BoxGeometry(wx2 - wx, wy2 - wy, 0.3), new THREE.MeshStandardMaterial({ color: COL.sun, emissive: COL.sun, emissiveIntensity: 1.1 }))
  win.position.set((wx + wx2) / 2, (wy + wy2) / 2, 0.3); g.add(win)
  for (const [w, h, x, y] of [[0.07, wy - wy2, (wx + wx2) / 2, (wy + wy2) / 2], [wx2 - wx, 0.07, (wx + wx2) / 2, (wy + wy2) / 2]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), lin); c.position.set(x, y, 0.3); g.add(c) }
  g.children.forEach((m) => { if (m.geometry.type === 'ExtrudeGeometry') m.position.z = -0.27 })
  return g
}
const MAKERS = { coin, stack, key, house, doc, calendar, phone, envelope, ban, gavel, logo }

/* ---------- Scène ---------- */
let renderer, scene, cam, holder, current = null
const cache = {}
export function init(canvas, w, h) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(w, h, false); renderer.setPixelRatio(1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace
  scene = new THREE.Scene()
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  cam = new THREE.PerspectiveCamera(30, w / h, 0.1, 100); cam.position.set(0, 0, 16)
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(5, 8, 10); scene.add(d)
  scene.add(new THREE.AmbientLight(0xffffff, 0.25))
  holder = new THREE.Group(); scene.add(holder)
}
const back = (x) => { const c = 1.70158, k = c + 1; x = Math.min(Math.max(x, 0), 1); return 1 + k * (x - 1) ** 3 + c * (x - 1) ** 2 }
/** Montre l'objet `name` (avec `arg`), entré à t0, centré en (x, y) dans le monde, taille s. */
export function show(name, arg, t0, t, { x = 0, y = 0, s = 1, spin = 0.6 } = {}) {
  if (!name) { renderer.clear(); renderer.render(new THREE.Scene(), cam); return }
  const id = name + '|' + (arg ?? '')
  if (!cache[id]) cache[id] = MAKERS[name](arg)
  if (current !== cache[id]) { if (current) holder.remove(current); current = cache[id]; holder.add(current) }
  const lt = t - t0, p = back(lt / 0.55)
  holder.position.set(x, y + Math.sin(lt * 1.6) * 0.12, 0)
  holder.scale.setScalar(s * Math.max(0.001, p))
  holder.rotation.set(0.12 + Math.sin(lt * 0.9) * 0.06, -0.5 + (1 - Math.min(lt / 0.8, 1)) * -1.2 + Math.sin(lt * spin) * 0.45, Math.sin(lt * 0.7) * 0.04)
  renderer.render(scene, cam)
}
