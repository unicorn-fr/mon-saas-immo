/**
 * Refait les captures de client/public/fonctionnalites/ (visite de l'accueil, pages Fonctionnalités, vidéo) sur un
 * compte d'exemple aux données fictives : Claire Dubois, 3 logements (Sète, Montpellier, Nîmes), un loyer en retard,
 * des candidats inventés. API et site lancés en local (voir e2e/README.md), puis :
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium node marketing/captures/fonctionnalites.mjs
 * Les zones mises en avant (`spot`) des contenus sont à vérifier après chaque nouvelle série.
 */
import { createRequire } from 'node:module'
import { BASE, api, completeLease, launch, newAccount } from '../../e2e/lib.mjs'
const sharp = createRequire(import.meta.url)('../../server/node_modules/sharp')
const OUT = new URL('../../client/public/fonctionnalites/', import.meta.url).pathname

const { token } = await newAccount()
await api('/account', { method: 'PATCH', token, body: { viewMode: 'PORTFOLIO' } })
const sete = await completeLease(token)
await api(`/leases/${sete.leaseId}/sign`, { method: 'POST', token })
for (const period of ['2026-10', '2026-11']) await api(`/leases/${sete.leaseId}/payments`, { method: 'POST', token, body: { period } })

// Montpellier, vide, loué depuis février : novembre en retard, relances automatiques activées.
const base = {
  habitat: 'COLLECTIVE', legalRegime: 'COPRO', furnished: false, destination: 'HABITATION', copro: { syndic: 'Syndic', extractsProvided: true }, constructionPeriod: 'AFTER_2005',
  rooms: 2, roomList: [{ name: 'Séjour' }, { name: 'Chambre' }], heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' },
  equipments: ['kitchen', 'hob', 'oven', 'smokeDetector'], annexes: [], commonAreas: ['elevator'], tv: 'COLLECTIVE', internet: 'FIBER',
  diagnostics: { dpe: { class: 'D', ges: 'C', date: '2024-03-01', costMin: 820, costMax: 1150, costYear: 2023 }, erp: { date: '2026-09-01' }, electricity: { installOver15: false }, gas: { hasGas: false } },
  market: { tense: true }, smokeDetectors: 2, keys: '2 clés',
}
const mtp = await api('/properties', { method: 'POST', token, body: { ...base, label: 'T3 Montpellier', address: '22 rue Foch, 34000 Montpellier', postalCode: '34000', city: 'Montpellier', furnished: false, surface: 64, rooms: 3, roomList: [{ name: 'Séjour' }, { name: 'Chambre 1' }, { name: 'Chambre 2' }], fiscalId: '341234567891' } })
const ines = await api('/tenants', { method: 'POST', token, body: { propertyId: mtp.id, civility: 'MADAME', firstNames: 'Inès', lastName: 'Moreau', birthDate: '1991-03-08', birthPlace: 'Lyon', email: `ines+${Date.now()}@example.fr`, situation: 'EMPLOYEE', living: 'ALONE', guarantee: 'VISALE' } })
const lm = await api('/leases', { method: 'POST', token, body: { propertyId: mtp.id, tenantIds: [ines.id], terms: { kind: 'VIDE', startDate: '2026-02-01' } } })
await api(`/leases/${lm.id}/terms`, { method: 'PUT', token, body: { rentCents: 91000, chargesCents: 6000, chargesMode: 'PROVISION', depositCents: 91000, paymentDay: 5, zone: { tense: true, control: false }, previous: { rentedWithin18Months: false }, works: { sinceLast: '' }, clauses: { resolutoire: true, solidarite: false, custom: [] }, signature: { place: 'Montpellier', mode: 'ELECTRONIC' }, revision: { enabled: true, irlQuarter: '2025-Q4', irlValue: 145.78 } } })
await api(`/leases/${lm.id}/sign`, { method: 'POST', token })
for (const m of ['02', '03', '04', '05', '06', '07', '08', '09', '10']) await api(`/leases/${lm.id}/payments`, { method: 'POST', token, body: { period: `2026-${m}` } })
await api(`/leases/${lm.id}/dunning`, { method: 'PUT', token, body: { enabled: true } })

// Nîmes, libre : lien de candidature et trois candidats inventés.
const nim = await api('/properties', { method: 'POST', token, body: { ...base, label: 'T2 Nîmes', address: '5 rue de la Madeleine, 30000 Nîmes', postalCode: '30000', city: 'Nîmes', surface: 45, fiscalId: '301234567892', market: { tense: false }, rent: { rentCents: 62000, chargesCents: 4000 } } })
const { applyCode } = await api(`/properties/${nim.id}/apply-link`, { method: 'POST', token, body: { open: true } })
for (const [firstNames, lastName, income, guarantee] of [['Paul', 'Exemple', 300000, 'VISALE'], ['Sarah', 'Fictive', 210000, 'CAUTION'], ['Hugo', 'Démo', 150000, 'NONE']]) {
  await api(`/candidature/${applyCode}`, { method: 'POST', body: { firstNames, lastName, email: `${firstNames.toLowerCase()}@example.fr`, situation: 'EMPLOYEE', monthlyIncomeCents: income, guarantee, moveInDate: '2026-12-15', consent: true, guarantor: guarantee === 'CAUTION' ? { firstNames: 'Anne', lastName: 'Fictive' } : null } }).catch((e) => console.warn('candidat', e.message))
}

const browser = await launch()
// Contexte en français (dates des champs au format JJ/MM/AAAA), connecté au compte d'exemple.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', storageState: { cookies: [], origins: [{ origin: new URL(BASE).origin, localStorage: [{ name: 'bailio.session', value: token }] }] } })
const page = await ctx.newPage()
// `focus` : élément mis en avant ; sa position (en % de la capture) est affichée pour régler les `spot` des contenus.
const snap = async (name, path, ready, focus, { scrollTo = false } = {}) => {
  await page.goto(BASE + path)
  if (ready) await page.getByText(ready).first().waitFor({ timeout: 20000 }).catch(() => console.warn('pas trouvé', name, ready))
  await page.waitForLoadState('networkidle')
  if (focus && scrollTo) await focus(page).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120))
  await page.waitForTimeout(700)
  if (focus) {
    const b = await focus(page).first().boundingBox()
    if (b) console.log(name, 'spot', { x: +(b.x / 14.4).toFixed(1), y: +(b.y / 9).toFixed(1), w: +(b.width / 14.4).toFixed(1), h: +(b.height / 9).toFixed(1) })
  }
  const png = await page.screenshot()
  await sharp(png).webp({ quality: 82 }).toFile(`${OUT}${name}.webp`)
  console.log('capture', name)
}
await snap('today', '/espace', 'Bonjour Claire', (p) => p.locator('.today-main article, .today-main > div').filter({ hasText: 'Inès Moreau' }))
await snap('logements', '/espace/logements', 'T3 Montpellier')
await snap('patrimoine', '/espace/patrimoine', 'À surveiller', (p) => p.getByText('À surveiller').locator('xpath=ancestor::*[self::section or self::div][2]'))
await snap('argent', '/espace/argent', 'Loyers encaissés')
await snap('bail', `/espace/baux/${sete.leaseId}`, 'Loyers et quittances', (p) => p.locator('h1'))
await snap('quittances', `/espace/baux/${sete.leaseId}`, 'Loyers et quittances', (p) => p.getByText('Quittance par email dès que le loyer est noté reçu').locator('xpath=../..'))
await snap('relances', `/espace/baux/${lm.id}`, 'Loyers et quittances', (p) => p.getByText('Relancer automatiquement un loyer impayé').locator('xpath=../..'))
await snap('candidats', `/espace/logements/${nim.id}/candidats`, 'Paul Exemple', (p) => p.getByText('Paul Exemple').locator('xpath=ancestor::*[contains(@style,"border-radius")][1]'), { scrollTo: true })
await snap('annonce', `/espace/logements/${nim.id}/annonce`, 'Annonce')
// Déclaration : l'année en cours (loyers de 2026), l'ouverture se fait sur l'année précédente.
await page.goto(BASE + '/espace/argent/declaration')
await page.getByRole('button', { name: '2026', exact: true }).click()
await page.waitForLoadState('networkidle'); await page.waitForTimeout(1200)
await sharp(await page.screenshot()).webp({ quality: 82 }).toFile(`${OUT}impots.webp`)
console.log('capture impots')
await snap('releve', '/espace/argent/releve', 'relevé', (p) => p.locator('main .drop, main input[type=file]').locator('xpath=..'))
const edl = await api(`/leases/${sete.leaseId}/inventories`, { method: 'POST', token, body: { kind: 'ENTRY' } })
await snap('edl', `/edl/${edl.id}`, 'Le déroulé')
await ctx.close()
const pub = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' })
const pp = await pub.newPage()
await pp.goto(BASE + '/commencer'); await pp.waitForTimeout(1200)
{ const b = await pp.getByRole('button', { name: /Vide/ }).first().locator('xpath=..').boundingBox(); if (b) console.log('tunnel spot', { x: +(b.x / 14.4).toFixed(1), y: +(b.y / 9).toFixed(1), w: +(b.width / 14.4).toFixed(1), h: +(b.height / 9).toFixed(1) }) }
await sharp(await pp.screenshot()).webp({ quality: 82 }).toFile(`${OUT}tunnel.webp`)
console.log('capture tunnel')
await browser.close()
