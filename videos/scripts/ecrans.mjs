// Captures d'écran de Bailio (téléphone, haute définition) pour les vidéos, prises sur le site LOCAL
// avec le compte de démonstration de l'audit (tests/audit/seed.mjs). Usage : node videos/scripts/ecrans.mjs
import fs from 'node:fs'
import { api, completeLease, contextFor, CONFIGS, BASE, fromLog, logSize, newAccount, pw, settle, signAs } from '../../tests/audit/lib.mjs'

const OUT = new URL('../public/ecrans/', import.meta.url).pathname
const DEMO = new URL('../.demo.json', import.meta.url).pathname

/** Compte de démonstration propre (un logement, un bail signé, un loyer reçu), créé une fois sur l'API locale. */
async function demo() {
  if (fs.existsSync(DEMO)) return JSON.parse(fs.readFileSync(DEMO, 'utf8'))
  const { token } = await newAccount()
  const l = await completeLease(token, { furnished: true })
  await api(`/leases/${l.leaseId}/terms`, { method: 'PUT', token, body: { revision: { enabled: true, irlQuarter: '2026-Q2', irlValue: 146.68 } } })
  const before = logSize()
  const esign = await api(`/leases/${l.leaseId}/esign`, { method: 'POST', token })
  const links = await fromLog(/Relire et signer : (http:\/\/[^\s]+\/signer\/[^\s]+)/g, before)
  const browser = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  for (const [, url] of links) await signAs(browser, url.replace(/^https?:\/\/[^/]+/, BASE))
  await signAs(browser, BASE + esign.landlordUrl)
  await browser.close()
  const d = { owner: { token }, leaseId: l.leaseId, propertyId: l.propertyId }
  fs.writeFileSync(DEMO, JSON.stringify(d))
  return d
}
const seed = await demo()
const phone = CONFIGS.find((c) => c.id === 'iphone-portrait')
const shots = [
  { name: 'accueil', path: '/', who: null },
  { name: 'tunnel-type', path: '/commencer', who: null },
  { name: 'aujourdhui', path: '/espace', who: 'owner' },
  { name: 'bail', path: `/espace/baux/${seed.leaseId}`, who: 'owner' },
  { name: 'courriers', path: `/espace/baux/${seed.leaseId}/courriers`, who: 'owner' },
  { name: 'logement', path: `/espace/logements/${seed.propertyId}`, who: 'owner' },
  { name: 'argent', path: '/espace/argent', who: 'owner' },
  { name: 'annonce', path: `/espace/logements/${seed.propertyId}/annonce`, who: 'owner' },
]
for (const s of shots) {
  const ctx = await contextFor({ ...phone, opts: { ...phone.opts, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 } }, { token: s.who ? seed[s.who].token : undefined })
  const page = await ctx.newPage()
  await page.goto(BASE + s.path)
  await settle(page, 1500)
  await page.screenshot({ path: `${OUT}${s.name}.png` })
  await ctx.close()
  console.log('capture', s.name)
}
process.exit(0)
