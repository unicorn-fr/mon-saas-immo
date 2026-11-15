/* Semaine 47 : plans décrits en données, mis en forme avec les outils de kit.js (sticker, slam, endScene).
   PLAN(liste) : chaque plan démarre sur un mot de la voix ; ses éléments apparaissent chacun sur leur mot. */
const BG = { night: [C.night, C.blue, 'rgba(255,255,255,.07)'], blue: [C.blue, C.blue, 'rgba(255,255,255,.10)'], orange: [C.orange, C.orange, 'rgba(15,31,61,.10)'], cream: [C.cream, C.orange, null], sky: [C.sky, C.blue, null], peach: [C.peach, C.orange, null] }
const LAND = document.documentElement.classList.contains('paysage')
const TOPS = LAND ? { 1: [330], 2: [200, 520], 3: [130, 380, 630], 4: [100, 290, 480, 670] } : { 1: [600], 2: [420, 860], 3: [320, 700, 1080], 4: [260, 560, 860, 1160] }
const at = (x) => (typeof x === 'number' ? x : Array.isArray(x) ? W(x[0], x[1]) : W(x))
function PLAN(list) {
  return list.map((p) => {
    const [bg, burst, dots] = BG[p.bg]
    const start = at(p.on) - (p.lead ?? .3)
    const tops = p.tops ?? TOPS[p.items.length]
    return {
      start: Math.max(0, start),
      bg, burst,
      ...(LAND ? { capTop: 905 } : {}),
      html: () => `${dots ? `<div class="abs" style="inset:0;background:${DOTS(dots)}"></div>` : ''}` + p.items.map((_, i) => `<div class="abs" id="i${i}" style="left:${LAND ? 160 : 60}px;right:${LAND ? 160 : 60}px;top:${tops[i]}px;text-align:center"></div>`).join(''),
      update(lt, t) {
        p.items.forEach((it, i) => {
          const t0 = it.at === undefined ? Math.max(0, start) + .1 + i * .15 : at(it.at)
          $('i' + i).innerHTML = it.slam
            ? slam(it.slam, t0, t, { size: it.size ?? 120, color: it.color ?? (p.bg === 'night' || p.bg === 'blue' || p.bg === 'orange' ? C.white : C.night), stroke: p.bg === 'orange' })
            : sticker(it.s, { bg: it.bg ?? C.white, color: it.color ?? C.night, size: it.size ?? 70, rot: it.rot ?? (i % 2 ? 3 : -3), pad: it.pad ?? '22px 44px', t0, t, shadow: 14 })
        })
      },
    }
  })
}
