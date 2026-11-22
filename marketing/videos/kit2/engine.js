/* Moteur des vidéos « kit2 » (depuis la semaine 48) : vraies personnes (vidéos Pexels, licence libre), objets 3D
   (obj3d.js), formats « mème » refaits avec nos propres textes, et trois habillages tirés de la direction du site
   qui alternent d'une vidéo à l'autre (nuit, journal, soleil). Données : window.SPEC (fichier <nom>.spec.js),
   window.WORDS et window.CAPTIONS (data.js, align.py). Rendu image par image : window.render(t). */
import * as O from './obj3d.js'

const S = window.SPEC, LAND = S.format === 'paysage'
const W = LAND ? 1920 : 1080, H = LAND ? 1080 : 1920, FPS = 30
document.documentElement.classList.add(LAND ? 'land' : 'port', 'look-' + S.look)
const LOOKS = {
  nuit: { bg: '#1e2b55', fg: '#f3eee6', em: '#f2b45c', pill: '#f2b45c', pillFg: '#1d2433' },
  journal: { bg: '#f3eee6', fg: '#1d2433', em: '#1e2b55', pill: '#1e2b55', pillFg: '#f3eee6' },
  soleil: { bg: '#f2b45c', fg: '#1d2433', em: '#ffffff', pill: '#1d2433', pillFg: '#f2b45c' },
}
const BGS = { night: LOOKS.nuit, linen: LOOKS.journal, sun: LOOKS.soleil, sky: { bg: '#dfe6f3', fg: '#1d2433', em: '#1e2b55', pill: '#1e2b55', pillFg: '#f3eee6' } }
const L = LOOKS[S.look]

const $ = (id) => document.getElementById(id)
const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b)
const eo = (x) => 1 - (1 - clamp(x)) ** 3
const back = (x) => { const c = 1.70158; x = clamp(x); return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2 }
const em = (s) => s.replace(/\*([^*]+)\*/g, '<em>$1</em>')

document.body.insertAdjacentHTML('beforeend', `
  <div id="bg" class="abs"></div>
  <img id="blur" class="abs" alt=""><img id="clip" class="abs" alt="">
  <canvas id="gl" class="abs" width="${W}" height="${H}"></canvas>
  <div id="shade" class="abs"></div>
  <div id="txt" class="abs"></div>
  <div id="cap" class="abs"></div>
  <div id="mark" class="abs"></div>
  <div id="wipe" class="abs"></div>
  <div id="prog" class="abs"></div>
  <div id="grain" class="abs"></div>`)
O.init($('gl'), W, H)

const B = `<svg viewBox="0 0 598 727" style="height:.74em;width:.61em;vertical-align:baseline"><path d="M51 727V67L195 0V727Z" fill="currentColor"/><path d="M120 727H298A270 270 0 0 0 298 187H120Z" fill="currentColor"/><rect x="195" y="329" width="229" height="256" rx="26" fill="#F2B45C"/><path d="M309.5 329V585M195 457H424" stroke="currentColor" stroke-width="34"/></svg>`
const wordmark = (size, color) => `<span style="font:700 ${size}px/1 Inter;letter-spacing:-.045em;color:${color}">${B}ailio</span>`

/* Scènes : début, fin, et la scène de fin ajoutée seule. */
const scenes = S.scenes.map((s, i) => ({ ...s, i }))
scenes.push({ kind: 'end', at: S.end, i: scenes.length })
scenes.forEach((s, i) => { s.until = i + 1 < scenes.length ? scenes[i + 1].at : S.duration })
window.SCENES = scenes
window.DURATION = S.duration

const pop = (t, t0, extra = '') => { const p = (t - t0) / 0.35; if (p <= 0) return 'opacity:0'; return `opacity:${clamp(p * 3)};transform:translateY(${(1 - eo(p)) * 40}px) scale(${0.9 + 0.1 * back(p)})${extra}` }

function textBlock(s, t, c) {
  const items = (s.items ?? []).map((it, k) => `<div class="item" style="${pop(t, it.at ?? s.at + 0.3 + k * 0.2)}"><span class="dot" style="background:${c.em === '#ffffff' ? '#1d2433' : c.em}"></span><span>${em(it.t)}</span></div>`).join('')
  const big = s.big ? `<div class="big" style="color:${s.bigColor ?? c.em};${pop(t, s.big.at ?? s.at + 0.4, ` rotate(${s.big.rot ?? -2}deg)`)}">${s.big.t}</div>` : ''
  return `${s.kicker ? `<div class="kicker" style="background:${c.pill};color:${c.pillFg};${pop(t, s.at + 0.05)}">${s.kicker}</div>` : ''}
    ${s.title ? `<div class="title" style="${pop(t, s.titleAt ?? s.at + 0.12)}">${em(s.title)}</div>` : ''}${big}
    ${s.sub ? `<div class="sub" style="${pop(t, s.sub.at)}">${em(s.sub.t)}</div>` : ''}<div class="items">${items}</div>`
}

async function setFrame(img, src) { if (img.dataset.src === src) return; img.dataset.src = src; img.src = src; await img.decode().catch(() => {}) }

window.render = async (t) => {
  const s = [...scenes].reverse().find((x) => t >= x.at) ?? scenes[0]
  const lt = t - s.at
  const c = s.kind === 'end' ? LOOKS.nuit : s.bg ? BGS[s.bg] : L
  document.body.style.setProperty('--fg', c.fg); document.body.style.setProperty('--em', c.em)
  $('bg').style.background = s.kind === 'end' ? `radial-gradient(circle at ${LAND ? '27% 50%' : '50% 27%'}, #34488a 0%, #1e2b55 42%, #141c3a 100%)` : c.bg
  $('prog').style.cssText = `width:${(t / S.duration) * 100}%;background:${S.look === 'soleil' ? '#1e2b55' : '#f2b45c'}`

  // Vidéo d'une vraie personne : images extraites par prep.cjs.
  const clipOn = s.kind === 'clip'
  $('clip').style.display = $('shade').style.display = clipOn ? 'block' : 'none'
  $('blur').style.display = clipOn && LAND ? 'block' : 'none'
  if (clipOn) {
    const n = Math.min(Math.floor(lt * FPS), Math.ceil((s.until - s.at) * FPS) + 3) + 1
    const src = `../clips/frames/${S.name}-${s.i}/${String(n).padStart(5, '0')}.jpg`
    await setFrame($('clip'), src); if (LAND) await setFrame($('blur'), src)
    const punch = s.bottom ? eo((t - s.bottom.at) / 0.18) * 0.05 * (1 - clamp((t - s.bottom.at - 0.4) / 0.6)) : 0
    $('clip').style.transform = `scale(${1.04 + lt * 0.012 + punch})`
  }
  // Objet 3D.
  const model = s.kind === 'obj' ? s.model : s.kind === 'end' ? 'badge' : null
  const pos = LAND ? { x: -4.3, y: 0, s: s.kind === 'end' ? 0.62 : s.model === 'logo' ? 0.62 : 1.45 } : { x: 0, y: s.kind === 'end' ? 2.6 : 1.75, s: s.kind === 'end' ? 0.46 : s.model === 'logo' ? 0.55 : 0.8 }
  O.show(model, s.arg, s.at, t, { ...pos, ...(s.pos ?? {}) })
  $('gl').style.display = model ? 'block' : 'none'

  // Textes.
  let html = ''
  if (s.kind === 'clip') {
    html = `<div class="meme" style="${pop(t, s.at + 0.05)}">${em(s.top)}</div>` +
      (s.bottom ? `<div class="punch" style="${pop(t, s.bottom.at, ' rotate(-2deg)')}">${em(s.bottom.t)}</div>` : '')
  } else if (s.kind === 'obj') html = `<div class="block">${textBlock(s, t, c)}</div>`
  else {
    const g = S.guideAt ?? s.at + 1
    html = `<div class="endbox"><div style="${pop(t, s.at + 0.25)}">${wordmark(LAND ? 120 : 130, '#f3eee6')}</div>
      <div class="sub2" style="${pop(t, s.at + 0.5)}">Une règle de propriétaire, chaque jour</div>
      <div class="cta" style="${pop(t, s.at + 0.1, ' rotate(-2deg)')}">+ S’abonner</div>
      <div class="url" style="${pop(t, g)}">Le guide complet, gratuit<br><b>bailio.fr/actualites</b></div>
      <div class="src" style="opacity:${eo((t - g - 0.5) / 0.4)}">${S.source} · Information générale, pas un conseil personnalisé.</div></div>`
  }
  $('txt').innerHTML = html

  // Sous-titres mot à mot (jamais sur la scène de fin).
  const cap = s.kind === 'end' ? null : window.CAPTIONS.find((g) => t >= g.s - 0.05 && t <= g.e + 0.25)
  $('cap').className = 'abs ' + (clipOn ? 'oncl' : '')
  $('cap').innerHTML = cap ? `<div class="capin">${cap.words.map((w, k) => { const on = t >= cap.ws[k] && (k + 1 >= cap.ws.length || t < cap.ws[k + 1]); return `<span class="${on ? 'on' : ''}" style="${on ? `background:${clipOn ? '#f2b45c' : c.pill};color:${clipOn ? '#1d2433' : c.pillFg}` : ''}">${w}</span>` }).join(' ')}</div>` : ''

  // Marque discrète et transition (bande soleil ou nuit qui balaie l'écran au changement de scène).
  $('mark').innerHTML = s.kind === 'end' ? '' : wordmark(LAND ? 40 : 46, clipOn ? '#ffffff' : c.fg)
  const w = (t - s.at + 0.16) / 0.42
  $('wipe').style.cssText = s.i > 0 && w > 0 && w < 1 ? `display:block;background:${s.i % 2 ? '#f2b45c' : '#1e2b55'};transform:translateX(${-120 + w * 240}%) skewX(-12deg)` : 'display:none'
}
window.ready = true
