import fs from 'node:fs'
import { chromium } from 'playwright'

/**
 * Outils communs des parcours. L'API tourne en local sans service d'email : chaque email est écrit
 * dans son journal, d'où l'on relit les liens de connexion, de signature et les codes.
 */
export const BASE = process.env.E2E_BASE ?? 'http://localhost:5173'
export const API = process.env.E2E_API ?? 'http://localhost:5000/api'
export const API_LOG = process.env.E2E_API_LOG ?? '/tmp/bailio-api.log'
export const SHOTS = new URL('./captures/', import.meta.url).pathname
fs.mkdirSync(SHOTS, { recursive: true })

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** Taille du journal (en octets) : on ne relit que ce qui est écrit après. */
export const logSize = () => fs.statSync(API_LOG).size

/** Cherche un motif dans le journal de l'API, écrit après la position `after`. */
export async function fromLog(re, after, timeout = 15000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const text = fs.readFileSync(API_LOG).subarray(after).toString('utf8')
    const m = [...text.matchAll(re)]
    if (m.length) return m
    await wait(250)
  }
  throw new Error(`Introuvable dans le journal de l'API : ${re}`)
}

export async function launch() {
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
}

/** Relève les erreurs de la page : exceptions, erreurs console, réponses API en erreur. */
export function watch(page, errors, { allow = [] } = {}) {
  page.on('pageerror', (e) => errors.push(`exception ${page.url()} ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && !allow.some((a) => m.text().includes(a))) errors.push(`console ${page.url()} ${m.text()}`)
  })
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400 && !allow.some((a) => r.url().includes(a))) errors.push(`http ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`)
  })
}

export const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true })

/** Appel direct de l'API (préparation des données). */
export async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(API + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${j.message ?? ''}`)
  return j.data
}

/** Nouveau compte : lien magique demandé, relu dans le journal, vérifié. Renvoie le jeton de session. */
export async function newAccount(email = `e2e+${Date.now()}${Math.floor(Math.random() * 1000)}@example.fr`) {
  const before = logSize()
  await api('/auth/magic-link', { method: 'POST', body: { email, signup: true } })
  const [m] = await fromLog(/connexion\/lien\?jeton=([^\s)&]+)/g, before)
  const s = await api('/auth/magic-link/verify', { method: 'POST', body: { token: decodeURIComponent(m[1]) } })
  return { email, token: s.sessionToken }
}

/** Contexte de navigateur déjà connecté avec ce jeton de session. */
export async function signedInContext(browser, token, viewport = { width: 1280, height: 900 }) {
  const origin = new URL(BASE).origin
  return browser.newContext({ viewport, storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'bailio.session', value: token }] }] } })
}

/** Un bail complet (aucune mention manquante), prêt à signer. */
export async function completeLease(token, { furnished = true } = {}) {
  const email = (await api('/auth/me', { token })).email
  await api('/profile', { method: 'PUT', token, body: { kind: 'PERSON', civility: 'MADAME', firstNames: 'Claire', lastName: 'Dubois', birthDate: '1978-06-02', birthPlace: 'Nîmes', address: '8 rue de l’Aiguillerie', postalCode: '34000', city: 'Montpellier', email, agent: { enabled: false } } })
  const p = await api('/properties', {
    method: 'POST',
    token,
    body: {
      label: 'Studio Sète',
      address: '14 quai de Bosc, 34200 Sète',
      postalCode: '34300',
      city: 'Sète',
      habitat: 'COLLECTIVE',
      legalRegime: 'COPRO',
      furnished,
      destination: 'HABITATION',
      copro: { syndic: 'Syndic', extractsProvided: true },
      constructionPeriod: 'AFTER_2005',
      surface: 37,
      rooms: 2,
      roomList: [{ name: 'Séjour' }, { name: 'Chambre' }],
      heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' },
      hotWater: { mode: 'INDIVIDUAL' },
      equipments: ['kitchen', 'hob', 'oven', 'smokeDetector'],
      annexes: [],
      commonAreas: ['elevator'],
      tv: 'COLLECTIVE',
      internet: 'FIBER',
      fiscalId: '341234567890',
      diagnostics: { dpe: { class: 'C', ges: 'B', date: '2024-06-01', costMin: 610, costMax: 870, costYear: 2023 }, erp: { date: '2026-09-01' }, electricity: { installOver15: false }, gas: { hasGas: false } },
      market: { tense: true },
      furniture: { present: ['bedding', 'blackout', 'hob', 'oven', 'fridge', 'dishes', 'utensils', 'table', 'shelves', 'lights', 'cleaning'] },
      smokeDetectors: 2,
      keys: '2 clés, 1 badge',
    },
  })
  const t = await api('/tenants', {
    method: 'POST',
    token,
    body: {
      propertyId: p.id,
      civility: 'MONSIEUR',
      firstNames: 'Lucas',
      lastName: 'Garnier',
      birthDate: '2004-05-12',
      birthPlace: 'Arles',
      email: `locataire+${Date.now()}@example.fr`,
      situation: 'STUDENT',
      living: 'ALONE',
      guarantee: 'CAUTION',
      guarantor: { civility: 'MONSIEUR', firstNames: 'Hervé', lastName: 'Garnier', address: '6 rue des Lavandes, 30000 Nîmes', email: `garant+${Date.now()}@example.fr`, engagement: 'SOLIDAIRE', duration: 'FIXED', until: '2029-09-05', maxCents: 2000000, signMode: 'ELECTRONIC' },
    },
  })
  const l = await api('/leases', { method: 'POST', token, body: { propertyId: p.id, tenantIds: [t.id], terms: { kind: furnished ? 'MEUBLE' : 'VIDE', startDate: '2026-10-06' } } })
  const v = await api(`/leases/${l.id}/terms`, {
    method: 'PUT',
    token,
    body: { rentCents: 51000, chargesCents: 5000, chargesMode: 'PROVISION', depositCents: furnished ? 102000 : 51000, paymentDay: 4, zone: { tense: true, control: false }, previous: { rentedWithin18Months: false }, works: { sinceLast: '' }, clauses: { resolutoire: true, solidarite: false, custom: [] }, signature: { place: 'Sète', mode: 'ELECTRONIC' },
      // Indice de référence fixé : sans accès à l'Insee (réseau fermé), il ne serait pas rempli.
      revision: { enabled: true, irlQuarter: '2026-Q2', irlValue: 146.68 } },
  })
  return { leaseId: l.id, propertyId: p.id, tenantId: t.id, lease: v }
}

/** Parcours d'un signataire sur /signer/:jeton : relecture, code, mention, signature. */
export async function signAs(browser, url, { name, mobile = false } = {}) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(url)
  await page.getByText('J’ai lu le document en entier.').click()
  await page.waitForTimeout(300)
  if (!(await page.getByText('Identité confirmée par le code').count())) {
    const before = logSize()
    await page.getByRole('button', { name: 'Recevoir mon code' }).click()
    const codes = await fromLog(/Code de signature : (\d{6})/g, before)
    await page.getByLabel('Code reçu par email').fill(codes.at(-1)[1])
    await page.getByRole('button', { name: 'Valider' }).click()
    await page.getByText('Identité confirmée par le code').waitFor()
  }
  // Photo du signataire, datée par le serveur
  if (!(await page.getByText(/Photo enregistrée le/).count())) {
    await page.getByLabel('Prendre une photo de vous').setInputFiles(new URL('./fixtures/selfie.jpg', import.meta.url).pathname)
    await page.getByText(/Photo enregistrée le/).waitFor()
  }
  const mention = (await page.locator('div', { hasText: /^« / }).last().innerText()).replace(/^« /, '').replace(/ »$/, '')
  await page.locator('textarea').fill(mention)
  const canvas = page.locator('canvas')
  await canvas.scrollIntoViewIfNeeded()
  const box = await canvas.boundingBox()
  await page.mouse.move(box.x + 20, box.y + 60)
  await page.mouse.down()
  for (let i = 0; i < 12; i++) await page.mouse.move(box.x + 30 + i * 15, box.y + 40 + (i % 2) * 40)
  await page.mouse.up()
  await page.getByText('J’accepte de signer ce document électroniquement.').click()
  await page.getByRole('button', { name: 'Signer le document' }).click()
  await page.getByText('C’est signé.').waitFor()
  if (name) await shot(page, `signe-${name}`)
  await ctx.close()
  return errors
}

/**
 * Tunnel du début, une question par écran : chaque question est attendue par son titre, puis on y répond.
 * Un choix passe tout seul à la suivante ; un champ se valide avec « Continuer ».
 */
const ask = (page, title) => page.getByRole('heading', { name: title, exact: true }).waitFor()
const go = (page) => page.getByRole('button', { name: 'Continuer', exact: true }).click()
const choose = (page, name) => page.getByRole('button', { name, exact: true }).first().click()

export async function tunnelLogement(page, { address = '12 rue de la Loge, 34000 Montpellier', habitat = 'Un appartement', copro = 'Non', surface = '42', rooms = '2', period = '1990 à 2005', heating = 'Individuel', energy = 'Électricité', hotWater = 'Individuelle' } = {}) {
  await ask(page, 'Où se trouve le logement ?')
  await page.getByLabel('Adresse', { exact: true }).fill(address)
  await go(page)
  await ask(page, 'C’est un appartement ou une maison ?')
  await choose(page, habitat)
  await ask(page, 'Est-il en copropriété ?')
  await choose(page, copro)
  await ask(page, 'Quelle est sa surface habitable ?')
  await page.getByLabel('Surface habitable').fill(surface)
  await go(page)
  await ask(page, 'Combien de pièces principales ?')
  await choose(page, rooms)
  if (habitat === 'Un appartement') {
    await ask(page, 'Bâtiment, étage, porte ?')
    await go(page)
  }
  await ask(page, 'Quand a-t-il été construit ?')
  await choose(page, period)
  await ask(page, 'Le chauffage est individuel ou collectif ?')
  await choose(page, heating)
  await ask(page, 'Il fonctionne à quoi ?')
  await choose(page, energy)
  await ask(page, 'Et l’eau chaude ?')
  await choose(page, hotWater)
  await go(page)
}

export async function tunnelPersonnes(page, { landlord = ['Monique', 'Bernard'], address = '3 place de la Comédie, 34000 Montpellier', tenant = ['Karim', 'Haddad'], email = '' } = {}) {
  await ask(page, 'Comment vous appelez-vous ?')
  await page.getByLabel('Prénom', { exact: true }).fill(landlord[0])
  await page.getByLabel('Nom', { exact: true }).fill(landlord[1])
  await go(page)
  await ask(page, 'Votre adresse ?')
  await page.getByLabel('Votre adresse').fill(address)
  await go(page)
  await ask(page, 'Qui est votre locataire ?')
  await page.getByLabel('Prénom', { exact: true }).fill(tenant[0])
  await page.getByLabel('Nom', { exact: true }).fill(tenant[1])
  await go(page)
  await ask(page, 'Son email ?')
  if (email) await page.getByLabel('Son email').fill(email)
  await go(page)
  await ask(page, 'Quelqu’un d’autre signe le bail ?')
  await choose(page, 'Non, c’est tout')
}

export async function tunnelLoyer(page, { rent = '780', charges = '60', startDate = '2026-12-01' } = {}) {
  await ask(page, 'Quel est le loyer ?')
  await page.getByLabel('Loyer hors charges').fill(rent)
  await go(page)
  await ask(page, 'Et les charges ?')
  await page.getByLabel('Charges', { exact: true }).fill(charges)
  await page.getByRole('button', { name: 'Une provision' }).click()
  await go(page)
  await ask(page, 'Quand entre le locataire ?')
  await page.getByLabel("Date d'entrée du locataire").fill(startDate)
  await go(page)
  await ask(page, 'Tout est juste ?')
  await go(page)
}
