import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Rien n'est saisi deux fois : le loyer de la fiche du logement passe dans l'annonce et le bail ; le locataire remplit lui-même son dossier. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

const PROPERTY = { label: 'T2 Pézenas', address: '5 rue Conti, 34120 Pézenas', postalCode: '34120', city: 'Pézenas', habitat: 'COLLECTIVE', legalRegime: 'MONO', furnished: false, constructionPeriod: '1990_2005', surface: 45, rooms: 2, heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' }, equipments: ['kitchen', 'smokeDetector'], smokeDetectors: 1, tv: 'COLLECTIVE', internet: 'FIBER', diagnostics: { dpe: { class: 'C', ges: 'C' } }, rent: { rentCents: 62000, chargesCents: 4000, chargesMode: 'PROVISION', depositCents: 62000, paymentDay: 3 } }

test('loyer saisi une fois dans la fiche : repris par l’annonce et le bail, mis à jour depuis le bail', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: PROPERTY })
  const ad = await api(`/properties/${p.id}/ad`, { token })
  assert.equal(ad.settings.rentCents, 62000)
  assert.match(ad.ad.text, /660 € par mois charges comprises/)
  const t = await api('/tenants', { method: 'POST', token, body: { propertyId: p.id, firstNames: 'Inès', lastName: 'Roux', guarantee: 'NONE' } })
  const l = await api('/leases', { method: 'POST', token, body: { propertyId: p.id, tenantIds: [t.id], terms: { kind: 'VIDE', startDate: '2026-11-01' } } })
  const lease = await api(`/leases/${l.id}`, { token })
  assert.equal(lease.terms.rentCents, 62000)
  assert.equal(lease.terms.chargesCents, 4000)
  assert.equal(lease.terms.depositCents, 62000)
  assert.equal(lease.terms.paymentDay, 3)
  // Changé dans le bail : la fiche du logement (et donc la prochaine annonce) suit
  await api(`/leases/${l.id}/terms`, { method: 'PUT', token, body: { rentCents: 64000, depositCents: 64000 } })
  const after = await api(`/properties/${p.id}`, { token })
  assert.equal(after.file.rent.rentCents, 64000)
  assert.equal(after.file.rent.chargesCents, 4000)
})

test('le locataire remplit lui-même son dossier, avec les mêmes informations que le propriétaire', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: PROPERTY })
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/locataires/nouveau?logement=${p.id}`)
  await page.getByText('Mon locataire le remplit lui-même').click()
  const email = `ines.${Date.now()}@example.fr`
  await page.getByLabel('Email du locataire').fill(email)
  await page.getByRole('button', { name: 'Envoyer le lien au locataire' }).click()
  await page.getByText('Lien envoyé.').waitFor()
  await page.waitForURL(/\/espace\/locataires\/[0-9a-f-]{36}$/)
  const tenantId = page.url().split('/').pop()
  await ctx.close()
  const t = await api(`/tenants/${tenantId}`, { token })
  assert.equal(t.file.email, email)
  const link = (await api(`/tenants/${tenantId}/missing`, { token })).link
  assert.ok(link?.url, 'lien du dossier créé')
  const formCode = link.url.split('/').pop()
  const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const v = await visitor.newPage()
  watch(v, errors)
  await v.goto(`${BASE}/dossier/${formCode}`)
  await v.getByText('Votre dossier de location').waitFor()
  await v.getByLabel('Prénom(s)').first().fill('Inès')
  await v.getByLabel('Nom de naissance').fill('Roux')
  await v.getByText('En couple ou en famille').click()
  await v.getByText('Une personne (parent, ami…)').click()
  await v.getByRole('link', { name: 'Créer mon DossierFacile' }).waitFor()
  await v.getByRole('button', { name: 'Enregistrer' }).first().click()
  await v.getByRole('heading', { name: 'Votre garant', exact: true }).waitFor()
  await v.getByLabel('Lien avec vous').fill('Mère')
  await shot(v, 'dossier-locataire-complet')
  await v.getByRole('button', { name: 'Enregistrer' }).nth(1).click()
  await v.getByText('Enregistré.').last().waitFor()
  await visitor.close()
  const done = await api(`/tenants/${tenantId}`, { token })
  assert.equal(done.file.lastName, 'Roux')
  assert.equal(done.file.living, 'COUPLE')
  assert.equal(done.file.guarantee, 'CAUTION')
  assert.equal(done.file.guarantor.link, 'Mère')
  assert.ok(done.file.review.includes('living'))
  assert.deepEqual(errors, [])
})
