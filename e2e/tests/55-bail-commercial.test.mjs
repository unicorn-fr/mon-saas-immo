import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { API, BASE, api, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const pdfText = async (path, token) => {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(r.status, 200)
  return execFileSync('pdftotext', ['-', '-'], { input: Buffer.from(await r.arrayBuffer()) }).toString().replace(/\s+/g, ' ')
}

/**
 * Local commercial (docs/legal/bail-commercial.md) : ajouté en quatre étapes, bail commercial de 9 ans payé par
 * trimestre avec TVA, contrat PDF propre (Code de commerce), une échéance tous les trois mois, quittance du trimestre
 * TVA comprise, courriers de la loi de 1989 refusés, relances automatiques non proposées.
 */
test('bail commercial : ajout du local, bail de 9 ans par trimestre avec TVA, quittance du trimestre', async () => {
  const { token } = await newAccount()
  const email = (await api('/auth/me', { token })).email
  await api('/profile', { method: 'PUT', token, body: { kind: 'PERSON', civility: 'MADAME', firstNames: 'Claire', lastName: 'Dubois', address: '8 rue de l’Aiguillerie', postalCode: '34000', city: 'Montpellier', email, agent: { enabled: false } } })

  const browser = await launch()
  const errors = []
  let propertyId
  try {
    const ctx = await signedInContext(browser, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/logements/nouveau`)
    await page.getByRole('button', { name: 'Un local commercial ou des bureaux' }).click()
    await page.getByRole('heading', { name: 'Où se trouve le local ?' }).waitFor()
    await page.getByLabel('Adresse', { exact: true }).fill('8 rue de la Loge, 34000 Montpellier')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Quel local louez-vous ?' }).waitFor()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByText('Indiquez le type de local.').waitFor()
    await page.getByRole('button', { name: 'Commerce ou artisanat' }).click()
    await page.getByLabel('Activité autorisée dans le local').fill('Boulangerie, pâtisserie')
    await page.getByLabel('Surface').fill('60')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Quel loyer demandez-vous ?' }).waitFor()
    await page.getByLabel('Loyer hors charges et hors taxes, par mois').fill('1500')
    await page.getByLabel('Charges, par mois', { exact: true }).fill('0')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Ce local', exact: true }).waitFor({ timeout: 20000 }).catch(async () => {
      // Dernière étape (photos) : on termine.
      await page.getByRole('button', { name: /^Enregistrer/ }).click()
      await page.getByRole('heading', { name: 'Ce local', exact: true }).waitFor()
    })
    propertyId = page.url().split('/').pop().split('?')[0]
    await shot(page, 'local-commercial')
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])

  const p = await api(`/properties/${propertyId}`, { token })
  assert.equal(p.file.nature, 'COMMERCIAL')
  assert.equal(p.file.commercial.use, 'RETAIL')
  assert.equal(p.file.rent.depositCents, 450000, 'un trimestre proposé')
  assert.deepEqual(p.leaseMissing, [])

  const t = await api('/tenants', { method: 'POST', token, body: { propertyId, civility: 'MADAME', firstNames: 'Sophie', lastName: 'Leroy', email: `preneur+${Date.now()}@example.fr`, living: 'ALONE', guarantee: 'NONE' } })
  await assert.rejects(api('/leases', { method: 'POST', token, body: { propertyId, tenantIds: [t.id], terms: { kind: 'VIDE' } } }))
  const l = await api('/leases', { method: 'POST', token, body: { propertyId, tenantIds: [t.id], terms: { startDate: '2026-10-01' } } })
  let v = await api(`/leases/${l.id}`, { token })
  assert.equal(v.kind, 'COMMERCIAL')
  assert.equal(v.terms.durationMonths, 108)
  assert.equal(v.terms.paymentFrequency, 'QUARTERLY')
  assert.equal(v.terms.commercial.index, 'ILC')
  assert.equal(v.computed.noticeMonths, 6)
  assert.match(v.computed.renewal, /durée indéterminée/)
  // Dépôt au-delà d'un trimestre refusé ; TVA choisie
  await assert.rejects(api(`/leases/${l.id}/terms`, { method: 'PUT', token, body: { depositCents: 600000 } }))
  v = await api(`/leases/${l.id}/terms`, { method: 'PUT', token, body: { paymentDay: 1, commercial: { index: 'ILC', vat: true }, clauses: { custom: [] }, signature: { place: 'Montpellier', mode: 'PAPER' } } })

  // Créer un bail : durée de 9 à 12 ans, périodicité, TVA, options du bail commercial
  const b2 = await launch()
  try {
    const ctx = await signedInContext(b2, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/baux/nouveau?id=${l.id}&etape=3`)
    await page.getByText('Un local commercial se loue avec un bail commercial', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('group', { name: 'Durée du bail' }).waitFor()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Quel est le loyer ?' }).waitFor()
    await page.getByRole('group', { name: 'Le loyer se paie' }).first().waitFor()
    assert.equal(await page.getByText('La commune est-elle en zone tendue ?').count(), 0)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Les options du bail' }).waitFor()
    await page.getByRole('group', { name: 'Indice de révision' }).waitFor()
    await shot(page, 'bail-commercial-options')
  } finally {
    await b2.close()
  }
  assert.deepEqual(errors, [])

  const contract = await pdfText(`/leases/${l.id}/lease.pdf`, token)
  assert.match(contract, /BAIL COMMERCIAL/)
  assert.match(contract, /Boulangerie, pâtisserie/)
  assert.match(contract, /durée de 9 ans/)
  assert.match(contract, /payable par trimestre/)
  assert.match(contract, /taxe sur la valeur ajoutée au taux de 20 %/)
  assert.doesNotMatch(contract, /Notice d’information|2015-587|Dépenses énergétiques/)

  // Signé : une échéance par trimestre, TVA comprise (1 500 × 3 × 1,2 = 5 400 €)
  await api(`/leases/${l.id}/sign`, { method: 'POST', token })
  await api(`/leases/${l.id}/payments`, { method: 'POST', token, body: { period: '2026-11' } })
  const pays = (await api(`/leases/${l.id}`, { token })).payments
  assert.equal(pays.length, 1)
  assert.equal(pays[0].period, '2026-10', 'rangé sur le premier mois du trimestre')
  assert.equal(pays[0].amountCents, 540000)
  const receipt = await pdfText(`/leases/${l.id}/receipts/2026-10.pdf`, token)
  assert.match(receipt, /Quittance de loyer/i)
  assert.match(receipt, /propriétaire du local/)
  assert.match(receipt, /TVA à 20 %/)
  assert.match(receipt, /5 400,00 €/)
  assert.match(receipt, /31 décembre 2026/)
  assert.doesNotMatch(receipt, /article 21/)

  // Courriers de la loi de 1989 refusés ; relances automatiques non proposées
  await assert.rejects(api(`/leases/${l.id}/letters/preview`, { method: 'POST', token, body: { type: 'BOILER' } }))
  await assert.rejects(api(`/leases/${l.id}/dunning`, { method: 'PUT', token, body: { enabled: true } }))
  const aids = await api(`/properties/${propertyId}/aids`, { token })
  assert.deepEqual(aids.aids, [])
})
