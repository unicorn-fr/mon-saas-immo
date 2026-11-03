/* Kit « stickers » Bailio : aplats de couleur vifs, contours épais, ombres franches, mots qui claquent. Rendu image par image. */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const back = (x) => { x = clamp(x); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }
const lerp = (a, b, x) => a + (b - a) * x
const $ = (id) => document.getElementById(id)
const C = { cream: '#fbf6ec', night: '#0f1f3d', blue: '#1f4396', sky: '#dbe7fb', orange: '#ff8a3d', peach: '#fde4cf', ink: '#16233f', green: '#1f7a4a', mint: '#8fd6a9', white: '#ffffff', soft: '#ffb27a' }
const OUT = `6px solid ${C.night}`, SH = (n = 12) => `${n}px ${n}px 0 ${C.night}`

function W(word, n = 1) {
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%€]/g, '')
  let k = 0
  for (const w of window.WORDS) if (norm(w.t) === norm(word) && ++k === n) return w.s
  console.warn('mot introuvable', word, n); return 0
}
/* Autocollant : boîte à contour épais et ombre franche, apparition qui « claque » */
function sticker(inner, { bg = C.white, color = C.night, rot = -3, pad = '22px 36px', radius = 26, size = 56, t0 = 0, t = 0, shadow = 12 } = {}) {
  const p = (t - t0) / .32
  if (p <= 0) return ''
  const s = p >= 1 ? 1 + .02 * Math.sin((t - t0) * 5) : lerp(1.6, 1, back(p))
  return `<div style="display:inline-block;background:${bg};color:${color};border:${OUT};border-radius:${radius}px;box-shadow:${SH(shadow)};padding:${pad};font-weight:900;font-size:${size}px;line-height:1.05;opacity:${clamp(p * 4)};transform:rotate(${rot + (1 - clamp(p)) * 8}deg) scale(${s})">${inner}</div>`
}
/* Mot qui claque (titres) */
function slam(text, t0, t, { size = 140, color = C.night, font = 'Fraunces', italic = false, per = .12, stroke = false } = {}) {
  return text.split(' ').map((w, i) => {
    const p = (t - t0 - i * per) / .28
    if (p <= 0) return `<span style="display:inline-block;opacity:0">${w}</span>`
    return `<span style="display:inline-block;margin-right:.22em;opacity:${clamp(p * 4)};transform:scale(${lerp(2.2, 1, back(p))}) rotate(${(1 - clamp(p)) * -10}deg);${stroke ? `-webkit-text-stroke:5px ${C.night};paint-order:stroke fill;` : ''}">${w}</span>`
  }).join('').replace(/^/, `<span style="font-family:${font};font-weight:${font === 'Fraunces' ? 800 : 900};font-style:${italic ? 'italic' : 'normal'};font-size:${size}px;line-height:.98;color:${color};letter-spacing:-.02em;font-variation-settings:'SOFT' 100,'WONK' 1">`) + '</span>'
}
const BURST = (size, color, rot = 0) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)"><path d="${Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2, r = i % 2 ? 36 : 50; return `${i ? 'L' : 'M'}${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}` }).join(' ')}Z" fill="${color}" stroke="${C.night}" stroke-width="3"/></svg>`
const SQUIG = (w, color, p = 1) => `<svg width="${w}" height="60" viewBox="0 0 ${w} 60"><path d="${Array.from({ length: Math.ceil(w / 40) + 1 }, (_, i) => `${i ? 'Q' : 'M'} ${i ? `${i * 40 - 20} ${i % 2 ? 6 : 54},` : ''}${i * 40} 30`).join(' ')}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="3000" stroke-dashoffset="${3000 * (1 - clamp(p))}"/></svg>`
const DOTS = (color, op = .25) => `radial-gradient(${color} 22%, transparent 24%) 0 0/34px 34px`
const LOGO = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M3 10.2 11 4.2a1.6 1.6 0 0 1 2 0L21 10.2V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill="#ffffff" stroke="${C.night}" stroke-width=".6"/><path d="M12 3.6 21 10.2h-6.2A2.8 2.8 0 0 1 12 7.4Z" fill="${C.orange}"/><path d="M12 13.13a1.805 1.805 0 0 1 1.0925 3.2395l.6175 3.23h-3.42l.6175-3.23A1.805 1.805 0 0 1 12 13.13Z" fill="${C.night}"/></svg>`

document.body.insertAdjacentHTML('beforeend', `
  <div id="stage" style="position:absolute;inset:0;overflow:hidden"></div>
  <div id="burst" style="position:absolute;inset:0;pointer-events:none;z-index:50"></div>
  <div id="cap" style="position:absolute;left:40px;right:40px;top:1430px;z-index:55;text-align:center"></div>
  <div id="prog" style="position:absolute;left:0;top:0;height:14px;background:${C.orange};border-bottom:4px solid ${C.night};z-index:58"></div>`)

let built = null
window.render = function (t) {
  const S = window.SCENES
  let i = S.findIndex((s, k) => t >= s.start && (k === S.length - 1 || t < S[k + 1].start)); if (i < 0) i = 0
  const sc = S[i], lt = t - sc.start, stage = $('stage')
  if (built !== i) { stage.style.background = sc.bg || C.cream; stage.innerHTML = `<div id="scene" style="position:absolute;inset:0">${sc.html()}</div>`; built = i }
  $('scene').style.transform = `rotate(${Math.sin(t * .5) * .4}deg) scale(${1.015 + .015 * Math.sin(t * .3)})`
  sc.update(lt, t)
  // Transition : disque de couleur qui s'ouvre depuis un coin
  const bz = $('burst')
  if (i > 0 && lt < .42) { const p = eio(lt / .42), c = sc.burst || C.orange; bz.innerHTML = `<div style="position:absolute;inset:0;background:${c};clip-path:circle(${(1 - p) * 140}% at ${i % 2 ? '100% 0%' : '0% 100%'})"></div>` } else bz.innerHTML = ''
  $('prog').style.width = `${(t / window.DURATION) * 100}%`
  // Sous-titres en autocollants
  const cap = $('cap'), CAPS = window.CAPTIONS
  const g = CAPS.find((x, k) => t >= x.s - .05 && t < (CAPS[k + 1] ? CAPS[k + 1].s - .05 : x.e + .4))
  if (!g || sc.noCaption) { cap.innerHTML = ''; return }
  cap.style.top = (sc.capTop || 1430) + 'px'
  const p = (t - g.s + .05) / .16
  cap.innerHTML = `<div style="display:inline-block;background:${C.white};border:${OUT};border-radius:22px;box-shadow:${SH(9)};padding:14px 26px;font-weight:900;font-size:62px;line-height:1.1;color:${C.night};transform:rotate(${(CAPS.indexOf(g) % 2 ? 1.5 : -1.5)}deg) scale(${lerp(1.25, 1, back(p))})">` +
    g.words.map((w, k) => { const on = t >= g.ws[k] - .03 && (k === g.words.length - 1 || t < g.ws[k + 1] - .03); return `<span style="color:${on ? C.orange : C.night};${on ? `-webkit-text-stroke:2px ${C.night};paint-order:stroke fill;` : ''}">${w}</span>` }).join(' ') + '</div>'
}

/* Fin commune */
function endScene(start, guideAt, source, sub = true) {
  return { start, bg: C.blue, burst: C.blue, noCaption: true, html: () => `<div class="abs" style="inset:0;background:${DOTS('rgba(255,255,255,.12)')}"></div><div class="abs" id="e" style="left:0;right:0;top:380px;text-align:center"></div>`,
    update(lt, t) {
      const g = guideAt - start
      if (sub && lt < g) {
        $('e').innerHTML = `<div style="margin-top:120px">${sticker('+ S’abonner', { bg: C.orange, size: 104, pad: '30px 64px', rot: -4, t0: start + .05, t, shadow: 16 })}</div>
          <div style="margin-top:80px">${sticker('1 règle de proprio', { bg: C.white, size: 58, rot: 3, t0: start + .35, t })}</div>
          <div style="margin-top:30px">${sticker('chaque semaine', { bg: C.peach, size: 58, rot: -2, t0: start + .55, t })}</div>`
      } else {
        const s = sub ? guideAt : start
        $('e').innerHTML = `<div style="display:inline-block;transform:scale(${lerp(.3, 1, back((t - s) / .45))}) rotate(${(1 - eo((t - s) / .5)) * -20}deg)">${LOGO(230)}</div>
          <div style="font-family:Fraunces;font-weight:800;font-size:130px;color:#fff;-webkit-text-stroke:5px ${C.night};paint-order:stroke fill;margin-top:10px;opacity:${eo((t - s - .2) / .3)}">bailio</div>
          <div style="margin-top:46px">${sticker('Le guide complet, gratuit', { bg: C.white, size: 54, rot: -2, t0: s + .4, t })}</div>
          <div style="margin-top:34px">${sticker('bailio.fr/guides', { bg: C.orange, size: 76, pad: '26px 54px', rot: 2, t0: s + .65, t, shadow: 14 })}</div>
          <div style="margin-top:60px;font-size:30px;font-weight:800;color:#fff;opacity:${eo((t - s - .9) / .4)}">${source}</div>`
      }
    } }
}
