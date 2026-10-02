import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Lien sans compte du locataire : attestations et accord pour la quittance par email, rangés avec le bail. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

const pdf = (name) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n') })

test('lien locataire : assurance, chaudière et accord enregistrés avec le bail', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId, tenantId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/properties/${propertyId}`, { method: 'PUT', token, body: { heating: { mode: 'INDIVIDUAL', energy: 'GAS' } } })
  const link = await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
  assert.ok(link.code && link.boiler)
  const from = logSize()
  await api(`/leases/${leaseId}/tenant-link/send`, { method: 'POST', token })
  const [[, url]] = await fromLog(/(http:\/\/[^\s]+\/locataire\/[A-Za-z0-9]+)/g, from)
  assert.ok(url.endsWith(link.code))

  // Le locataire, sans compte.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/locataire/${link.code}`)
  await page.getByRole('heading', { name: 'Vos documents de location' }).waitFor()
  const year = new Date().getFullYear() + 1
  const insurance = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Attestation d’assurance habitation' }) })
  await insurance.locator('input[type=file]').setInputFiles(pdf('assurance.pdf'))
  await insurance.getByLabel('Assureur').fill('MAIF')
  await insurance.getByLabel('Valable jusqu’au').fill(`${year}-09-30`)
  await insurance.getByRole('button', { name: 'Envoyer l’attestation' }).click()
  await page.getByText(`valable jusqu’au 30/09/${year}`).waitFor()
  const boiler = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Entretien de la chaudière' }) })
  await boiler.locator('input[type=file]').setInputFiles(pdf('chaudiere.pdf'))
  await boiler.getByLabel('Date de l’entretien').fill('2026-09-15')
  await boiler.getByRole('button', { name: 'Envoyer l’attestation' }).click()
  await page.getByText('Entretien du 15/09/2026').waitFor()
  await page.getByText('J’accepte de recevoir mes quittances de loyer par email.').click()
  await page.getByRole('button', { name: 'Donner mon accord' }).click()
  await page.getByRole('button', { name: 'Retirer mon accord' }).waitFor()
  await shot(page, 'lien-locataire')
  await ctx.close()
  assert.deepEqual(errors, [])

  // Chez le propriétaire : tout est déjà rangé.
  const tenant = await api(`/tenants/${tenantId}`, { token })
  assert.equal(tenant.file.insurance.expiresAt, `${year}-09-30`)
  assert.equal(tenant.file.insurance.insurer, 'MAIF')
  const property = await api(`/properties/${propertyId}`, { token })
  assert.equal(property.file.heating.lastMaintenance, '2026-09-15')
  const lease = await api(`/leases/${leaseId}`, { token })
  assert.ok(lease.facts.eReceiptConsent?.at)
  assert.equal(lease.documents.filter((d) => d.origin === 'UPLOADED').length, 2)
  const owner = await signedInContext(browser, token)
  const p2 = await owner.newPage()
  const errors2 = []
  watch(p2, errors2)
  await p2.goto(`${BASE}/espace/baux/${leaseId}`)
  await p2.getByText('Documents du locataire').waitFor()
  await p2.getByText(`jusqu’au 30/09/${year}`).first().waitFor()
  await owner.close()
  assert.deepEqual(errors2, [])

  // Lien désactivé : plus accessible.
  await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: false } })
  await assert.rejects(api(`/locataire/${link.code}`))
})

test('autres courriers : réclamation reprise de l’intervention, envoyée à l’artisan ; appel à la caution envoyé au garant', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/properties/${propertyId}/interventions`, { method: 'POST', token, body: { title: 'Remplacement du mitigeur', status: 'DONE', date: '2026-09-02', newContact: { name: 'Plomberie Martin', trade: 'plombier' } } })
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/${leaseId}/courriers?type=CONTRACTOR_CLAIM`)
  await page.getByLabel('Travaux réalisés').waitFor()
  assert.equal(await page.getByLabel('Travaux réalisés').inputValue(), 'Remplacement du mitigeur')
  assert.equal(await page.getByLabel('Nom de l’artisan ou de l’entreprise').inputValue(), 'Plomberie Martin')
  await page.getByLabel('Email', { exact: true }).fill('contact@plomberie-martin.fr')
  await page.getByLabel('Problèmes constatés').fill('fuite au raccord depuis l’intervention')
  await shot(page, 'reclamation-artisan')
  await page.getByRole('button', { name: 'Enregistrer et envoyer par email' }).click()
  await page.getByText('Courrier envoyé à contact@plomberie-martin.fr.').waitFor()
  await ctx.close()
  assert.deepEqual(errors, [])
  const contacts = await api('/contacts', { token })
  assert.equal(contacts.find((c) => c.name === 'Plomberie Martin').email, 'contact@plomberie-martin.fr')

  const defaults = await api(`/leases/${leaseId}/letters/defaults/GUARANTOR_CALL`, { token })
  const saved = await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { ...defaults.letter, amountCents: 56000, periods: ['2026-10'] } })
  const sent = await api(`/documents/${saved.documentId}/send`, { method: 'POST', token })
  assert.equal(sent.sentTo.length, 1)
  assert.match(sent.sentTo[0], /^garant\+/)
})
