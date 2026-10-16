// Audit ponctuel (pas un test de la CI) : chaque page à 360, 768 et 1280 px, débordements horizontaux relevés.
import fs from 'node:fs'
import { BASE, api, completeLease, launch, newAccount, signedInContext, wait } from './lib.mjs'

const OUT = process.argv[2] ?? '/tmp/responsive'
fs.mkdirSync(OUT, { recursive: true })

const { token } = await newAccount()
const { leaseId, propertyId, tenantId } = await completeLease(token)
const pub = ['/', '/commencer', '/connexion', '/importer', '/contact', '/mentions-legales', '/confidentialite', '/prix-et-remboursement', '/inscription']
const priv = [
  '/espace', '/espace/logements', `/espace/logements/${propertyId}`, `/espace/logements/${propertyId}/fiche`, `/espace/logements/${propertyId}/annonce`,
  `/espace/logements/${propertyId}/candidats`, `/espace/logements/${propertyId}/emprunt`, `/espace/logements/${propertyId}/aides`, '/espace/logements/nouveau',
  '/espace/locataires', `/espace/locataires/${tenantId}`, `/espace/locataires/${tenantId}/fiche`, '/espace/locataires/nouveau',
  `/espace/baux/${leaseId}`, `/espace/baux/${leaseId}/contrat`, `/espace/baux/${leaseId}/courriers`, `/espace/baux/${leaseId}/etat-des-lieux`, '/espace/baux/nouveau',
  '/espace/argent', '/espace/argent/bilan', '/espace/argent/declaration', '/espace/argent/releve', '/espace/argent/facture', '/espace/argent/repartir',
  '/espace/documents', '/espace/carnet', '/espace/compte', '/espace/compte/profil', '/espace/compte/acces', '/espace/structures', '/espace/patrimoine', '/espace/situations', '/espace/actions', '/espace/corbeille',
]
const WIDTHS = [360, 768, 1280]
const browser = await launch()
const report = []
for (const w of WIDTHS) {
  const ctx = await signedInContext(browser, token, { width: w, height: 900 })
  const anon = await browser.newContext({ viewport: { width: w, height: 900 } })
  for (const [path, c] of [...pub.map((p) => [p, anon]), ...priv.map((p) => [p, ctx])]) {
    const page = await c.newPage()
    await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {})
    await wait(400)
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const over = []
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect()
        if (!b.width || getComputedStyle(el).position === 'fixed') continue
        if (b.right > vw + 1 || b.left < -1) {
          let p = el.parentElement, clipped = false
          while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { clipped = true; break } p = p.parentElement }
          if (!clipped) over.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} « ${(el.textContent || '').trim().slice(0, 40)} » ${Math.round(b.left)}→${Math.round(b.right)}`)
        }
      }
      const small = [...document.querySelectorAll('button, a, input, select, [role=button]')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.height < 32 && getComputedStyle(e).display !== 'inline' }).length
      return { scroll: document.documentElement.scrollWidth, vw, over: over.slice(0, 6), small, title: document.title }
    })
    const name = `${w}${path.replace(/[^a-z0-9]+/gi, '_')}`
    if (w === 360 && (r.over.length || r.scroll > r.vw)) await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
    report.push({ w, path, ...r })
    await page.close()
  }
  await ctx.close(); await anon.close()
}
await browser.close()
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1))
for (const r of report) if (r.scroll > r.vw || r.over.length) console.log(`${r.w}px ${r.path} : largeur ${r.scroll}/${r.vw}\n   ${r.over.join('\n   ')}`)
console.log('pages', report.length, 'avec débordement', report.filter((r) => r.scroll > r.vw || r.over.length).length)
