#!/usr/bin/env python3
"""
Génère l'accueil « Tombée du jour » du site à partir de la maquette validée
(docs/maquette/accueil-tombee-du-jour/index.html). À relancer après chaque retouche de la maquette :

    python3 scripts/accueil-dusk.py

Produit :
- client/src/pages/accueil/dusk.css : les styles de la maquette, limités à `.dusk` (rien ne déborde sur le reste du site),
  polices servies par le site (Newsreader, Bricolage Grotesque, Inter) ;
- client/public/accueil/facade.html : la façade et ses vitres (lourdes, chargées à part, mises en cache) ;
- client/src/pages/accueil/duskMain.ts : le contenu sous la façade (prix repris de config.ts) ;
- client/src/pages/accueil/duskScript.ts : les animations de la maquette, avec GSAP installé dans le projet
  (aucun script tiers), arrêtées proprement quand on quitte la page.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/maquette/accueil-tombee-du-jour/index.html'
OUT = ROOT / 'client/src/pages/accueil'
PUB = ROOT / 'client/public/accueil'
html = SRC.read_text()

# ── Styles ────────────────────────────────────────────────────────────────────
css = html[html.index('<style>') + 7: html.index('</style>')]
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
css = css.replace('"Newsreader"', '"Newsreader Variable"').replace('"Bricolage Grotesque"', '"Bricolage Grotesque Variable"').replace('"Inter"', '"Inter Variable"')
css = css.replace('url(img/', 'url(/accueil/img/')


def scope_selector(sel: str) -> str:
    s = sel.strip()
    if not s:
        return s
    if s in (':root', 'html', 'body'):
        return '.dusk'
    if s.startswith('html') or s.startswith('body'):
        s = re.sub(r'^(html|body)', '', s)
        return '.dusk' + s
    m = re.match(r'^\.(scene|anime)\b(.*)$', s)
    if m:
        return '.dusk.' + m.group(1) + m.group(2)
    if s.startswith(('*', '::', ':', '[')):
        return '.dusk ' + s
    return '.dusk ' + s


def scope(block: str) -> str:
    out, i, n = [], 0, len(block)
    while i < n:
        j = block.find('{', i)
        if j < 0:
            out.append(block[i:])
            break
        head = block[i:j].strip()
        # bloc correspondant
        depth, k = 1, j + 1
        while depth and k < n:
            if block[k] == '{':
                depth += 1
            elif block[k] == '}':
                depth -= 1
            k += 1
        body = block[j + 1:k - 1]
        if head.startswith('@media') or head.startswith('@supports'):
            out.append(head + '{' + scope(body) + '}')
        elif head.startswith('@'):
            out.append(head + '{' + body + '}')
        else:
            sels = ','.join(scope_selector(x) for x in head.split(','))
            out.append(sels + '{' + body + '}')
        i = k
    return '\n'.join(out)


scoped = scope(css)
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'dusk.css').write_text('/* Généré par scripts/accueil-dusk.py depuis la maquette : ne pas modifier à la main. */\n' + scoped + '\n')

# ── Façade (fond du haut de page) ─────────────────────────────────────────────
head_start = html.index('<header class="wa" id="haut">') + len('<header class="wa" id="haut">')
head_end = html.index('<div class="in" style="width:100%;display:grid;grid-template-rows:auto 1fr">')
facade = html[head_start:head_end].strip().replace('src="img/', 'src="/accueil/img/').replace('href="img/', 'href="/accueil/img/')
PUB.mkdir(parents=True, exist_ok=True)
(PUB / 'facade.html').write_text(facade + '\n')

# ── Contenu sous la façade ────────────────────────────────────────────────────
sprite = html[html.index('<svg width="0" height="0"'): html.index('<!-- ================= Accueil A')].strip()
main = html[html.index('<main id="parcours">') + len('<main id="parcours">'): html.index('<footer class="fin">')].strip()
fin = html[html.index('<footer class="fin">'): html.index('</main>', html.index('<footer class="fin">'))].strip()
fin = re.sub(r'<div class="fin-bas">.*?</div>', '', fin, flags=re.S)
fin = fin.replace('<a class="btn soleil" href="#haut">Créer mon bail</a>', '<a class="btn soleil" href="/commencer">Créer mon bail</a>')
fin = fin.replace('<footer class="fin">', '<section class="fin" aria-label="Commencer">').replace('</footer>', '</section>')
main = re.sub(r'<!--.*?-->', '', main, flags=re.S)
main = main.replace('src="img/', 'src="/accueil/img/')
# Prix repris de config.ts au moment de l'affichage.
main = main.replace('<span data-choc="3.49" data-dec="2">3,49</span>', '<span data-choc="${P.monthly}" data-dec="2">${P.monthlyText}</span>')
main = main.replace('<section class="prix-s" aria-labelledby="prix-t">', '<section class="prix-s" id="tarifs" aria-labelledby="prix-t">')
main = main.replace('<p class="monte">Choisissez votre nombre de logements.</p>', '<p class="monte">Choisissez votre nombre de logements. ${P.trial}, sans carte bancaire.</p>')
for s in (sprite, main, fin):
    assert '`' not in s

ts = '''// Généré par scripts/accueil-dusk.py depuis la maquette : ne pas modifier à la main.
export interface DuskPrices {
  monthly: number
  monthlyText: string
  yearly: number
  capMonthly: number
  capYearly: number
  trial: string
}

export const SPRITE = `''' + sprite + '''`

export const MAIN = (P: DuskPrices) => `''' + main.replace('\\', '\\\\') + '''
''' + fin + '''`
'''
(OUT / 'duskMain.ts').write_text(ts)

# ── Script ────────────────────────────────────────────────────────────────────
js = html[html.index('<script>\n(() => {') + len('<script>\n(() => {'): html.rindex('})();')]
js = js.replace("if (!reduce && window.gsap) document.documentElement.classList.add('scene');", "if (!reduce) root.classList.add('scene');")
js = js.replace("document.documentElement.classList.add('anime')", "root.classList.add('anime')")
js = js.replace("if (!reduce && window.gsap && window.ScrollTrigger) {", "if (!reduce) {")
js = js.replace("gsap.registerPlugin(ScrollTrigger);", '')
js = js.replace("new IntersectionObserver(", 'new IO(').replace('new MutationObserver(', 'new MO(')
js = js.replace('<img src="img/', '<img src="/accueil/img/')
js = js.replace("addEventListener('load', () => ScrollTrigger.refresh());", "window.addEventListener('load', refresh); cleanups.push(() => window.removeEventListener('load', refresh));")
js = js.replace("if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());", "if (document.fonts) document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh() });")
for a, b in [('k * 34.90, 299', 'k * P.yearly, P.capYearly'), ('k * 3.49, 29.90', 'k * P.monthly, P.capMonthly'), ('(1 - 3.49 /', '(1 - P.monthly /')]:
    assert a in js, a
    js = js.replace(a, b)
assert 'img/' not in js.replace('/accueil/img/', ''), 'chemin d’image non repris'

script = '''// @ts-nocheck
// Généré par scripts/accueil-dusk.py depuis la maquette : ne pas modifier à la main.
// Les animations de la maquette, telles quelles, avec GSAP installé dans le projet. Tout s'arrête au départ de la page :
// minuteurs, observateurs, défilements épinglés (gsap.context).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { DuskPrices } from './duskMain'

gsap.registerPlugin(ScrollTrigger)

export function mountDusk(root: HTMLElement, P: DuskPrices): () => void {
  let alive = true
  const timers = new Set<number>()
  const cleanups: Array<() => void> = []
  const setTimeout = (f: () => void, ms?: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      if (alive) f()
    }, ms)
    timers.add(id)
    return id
  }
  const clearTimeout = (id: number) => {
    window.clearTimeout(id)
    timers.delete(id)
  }
  const observers: Array<{ disconnect(): void }> = []
  class IO extends IntersectionObserver {
    constructor(cb: IntersectionObserverCallback, o?: IntersectionObserverInit) {
      super(cb, o)
      observers.push(this)
    }
  }
  class MO extends MutationObserver {
    constructor(cb: MutationCallback) {
      super(cb)
      observers.push(this)
    }
  }
  const refresh = () => alive && ScrollTrigger.refresh()
  const ctx = gsap.context(() => {
''' + js + '''
  }, root)
  return () => {
    alive = false
    timers.forEach((id) => window.clearTimeout(id))
    observers.forEach((o) => o.disconnect())
    cleanups.forEach((f) => f())
    ctx.revert()
  }
}
'''
(OUT / 'duskScript.ts').write_text(script)
print('ok', len(scoped), len(facade), len(main), len(js))
