import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Rien n'est à ressaisir : brouillons des courriers gardés, faits repris d'un courrier à l'autre. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

async function preview(token, leaseId, body) {
  const r = await fetch(`${API}/leases/${leaseId}/letters/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.status
}

test('une saisie de courrier est retrouvée après rechargement de la page', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/${leaseId}/courriers?type=NUISANCE`)
  await page.getByLabel('Troubles constatés').fill('musique forte après 22 heures')
  await page.getByText('Votre saisie est enregistrée automatiquement').waitFor()
  await page.reload()
  assert.equal(await page.getByLabel('Troubles constatés').inputValue(), 'musique forte après 22 heures')
  await shot(page, 'courrier-brouillon')
  await page.getByText('Repartir des valeurs proposées par Bailio').click()
  await page.waitForFunction(() => !document.body.innerText.includes('Votre saisie est enregistrée automatiquement'))
  assert.equal(await page.getByLabel('Troubles constatés').inputValue(), '')
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('congé du locataire enregistré : repris pour le justificatif et le solde de tout compte', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { type: 'TENANT_NOTICE', receivedDate: '2026-11-03', reduced: true, reducedReason: 'mutation professionnelle' } })
  const proof = await api(`/leases/${leaseId}/letters/defaults/SHORT_NOTICE_PROOF`, { token })
  assert.equal(proof.letter.receivedDate, '2026-11-03')
  assert.equal(proof.letter.reason, 'mutation professionnelle')
  const deposit = await api(`/leases/${leaseId}/letters/defaults/DEPOSIT_RETURN`, { token })
  assert.equal(deposit.letter.keysDate, '2026-12-03')
  assert.equal(deposit.title, 'Restitution du dépôt de garantie et solde de tout compte')
  // Reçu du dépôt : montant du bail, puis date et moyen retenus après enregistrement
  await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { type: 'DEPOSIT_RECEIPT', amountCents: 51000, receivedDate: '2026-10-06', method: 'virement' } })
  const receipt = await api(`/leases/${leaseId}/letters/defaults/DEPOSIT_RECEIPT`, { token })
  assert.equal(receipt.letter.method, 'virement')
  // Appel à la caution : adressé au garant
  const call = await api(`/leases/${leaseId}/letters/defaults/GUARANTOR_CALL`, { token })
  assert.match(call.recipient.name, /Mercier/)
  assert.match(call.recipient.address, /Rochefort-du-Gard/)
  // Chaque nouveau document se génère
  for (const body of [
    { type: 'RENT_CERTIFICATE', since: '2026-10-06', rentCents: 51000, chargesCents: 5000, upToDate: true },
    { type: 'E_RECEIPT_CONSENT', email: 'locataire@example.fr' },
    { type: 'SMOKE_DETECTOR', count: 2 },
    { type: 'BOILER', lastServiceDate: null },
    { type: 'DAMAGE_REPAIR', items: [{ label: 'porte fendue' }], delayDays: 30 },
    { type: 'NUISANCE', facts: 'bruit', delayDays: 8 },
    { type: 'OWNER_CHANGE', newOwnerName: 'M. Martin', newOwnerAddress: 'Lyon', effectiveDate: '2026-12-01' },
    { type: 'GUARANTOR_CALL', amountCents: 56000, periods: ['novembre 2026'], delayDays: 15 },
  ]) assert.equal(await preview(token, leaseId, body), 200, body.type)
})

test('annexes officielles publiques', async () => {
  for (const n of ['notice-information', 'reparations-locatives', 'charges-recuperables']) {
    const r = await fetch(`${API}/${n}.pdf`)
    assert.equal(r.status, 200, n)
    assert.match(r.headers.get('content-type'), /pdf/)
  }
})
