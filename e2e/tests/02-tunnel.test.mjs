import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, fromLog, launch, logSize, shot, watch } from '../lib.mjs'

/**
 * Tunnel public : le bail est créé « en préparation » (jamais considéré comme signé),
 * et l'adresse email est vérifiée par un lien avant toute création de compte.
 */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

test('tunnel → email confirmé → bail en préparation avec la liste « Il manque… »', async () => {
  // Réponses du tunnel, saisies par l'API (les écrans des étapes sont testés à la main).
  const created = await fetch(`${BASE.replace(/\/$/, '')}/api/drafts`, { method: 'POST' }).then((r) => r.json())
  const draftToken = created.data.token
  const data = {
    type: 'UNFURNISHED',
    property: { address: '12 rue de la Loge, 34000 Montpellier', postalCode: '34000', city: 'Montpellier', surface: 42.5, rooms: 2, dpeClass: 'D' },
    landlord: { firstName: 'Jean', lastName: 'Dupont', address: '8 avenue Foch, 75116 Paris' },
    tenants: [{ firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.fr' }],
    guarantor: null,
    rent: { rentCents: 78000, chargesCents: 6000, startDate: '2026-11-01', paymentDay: 5 },
    source: 'tunnel',
  }
  await fetch(`${BASE.replace(/\/$/, '')}/api/drafts/current`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Draft-Token': draftToken }, body: JSON.stringify({ data, step: 'recevoir' }) })

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript((t) => localStorage.setItem('bailio.draft', t), draftToken)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(BASE + '/commencer/recevoir')
  const email = `tunnel+${Date.now()}@example.fr`
  await page.getByLabel('Votre email').fill(email)
  const before = logSize()
  await page.getByRole('button', { name: 'Recevoir le lien' }).click()
  await page.getByText('Regardez vos emails.').waitFor()
  // Aucun compte n'existe tant que le lien n'est pas ouvert.
  const [link] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
  await page.goto(link[1].replace(/^http:\/\/[^/]+/, BASE))
  await page.getByText('Votre bail est enregistré').waitFor()
  await shot(page, 'tunnel-bienvenue')
  await page.getByRole('button', { name: 'Compléter mon bail' }).click()
  await page.waitForURL(/\/espace\/baux\//)
  await page.getByText('Avant de signer, il manque').waitFor()
  await shot(page, 'tunnel-bail-a-completer')
  const leaseId = page.url().split('/espace/baux/')[1].split(/[?#]/)[0]
  const token = await page.evaluate(() => localStorage.getItem('bailio.session'))
  const lease = await api(`/leases/${leaseId}`, { token })
  assert.equal(lease.status, 'DRAFT')
  assert.ok(lease.checklist.length > 0)
  const me = await api('/auth/me', { token })
  assert.equal(me.followUpActive, true, 'les rappels par email sont actifs par défaut')
  await ctx.close()
  assert.deepEqual(errors, [])
})
