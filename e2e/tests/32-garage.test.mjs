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
 * Garage loué seul : ajouté en trois étapes, contrat de droit commun (Code civil) sans DPE ni notice, préavis du
 * contrat, quittance avec la mention de franchise de TVA, courriers propres au logement refusés.
 */
test('garage loué seul : ajout, contrat, quittance', async () => {
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
    await page.getByRole('button', { name: 'Un garage, un box ou une place' }).click()
    await page.getByRole('heading', { name: 'Où se trouve-t-il ?' }).waitFor()
    await page.getByLabel('Adresse', { exact: true }).fill('3 rue Foch, 34000 Montpellier')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'C’est…' }).waitFor()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByText('Indiquez s’il s’agit d’un garage, d’un box ou d’une place.').waitFor()
    await page.getByRole('button', { name: 'Box fermé' }).click()
    await page.getByLabel('Numéro (facultatif)').fill('12')
    await page.getByLabel('Niveau (facultatif)').fill('-1')
    await page.getByLabel('Clés, badges ou télécommandes remis (facultatif)').fill('1 télécommande')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Quel loyer demandez-vous ?' }).waitFor()
    await page.getByText('article 293 B du code général des impôts', { exact: false }).waitFor()
    await page.getByLabel('Loyer hors charges, par mois').fill('90')
    await page.getByLabel('Charges, par mois', { exact: true }).fill('0')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Enregistrer le garage' }).click()
    await page.getByRole('heading', { name: 'Ce garage', exact: true }).waitFor()
    propertyId = page.url().split('/').pop()
    // Pas d'onglet Diagnostics pour un garage
    assert.equal(await page.getByRole('tab', { name: 'Diagnostics' }).count(), 0)
    await shot(page, 'garage')
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])

  const p = await api(`/properties/${propertyId}`, { token })
  assert.equal(p.file.nature, 'PARKING')
  assert.equal(p.file.parking.type, 'BOX')
  assert.deepEqual(p.diagnostics, [])
  assert.deepEqual(p.leaseMissing, [])
  assert.equal(p.file.rent.depositCents, 9000) // un mois proposé par défaut

  const t = await api('/tenants', { method: 'POST', token, body: { propertyId, civility: 'MONSIEUR', firstNames: 'Lucas', lastName: 'Garnier', email: `locataire+${Date.now()}@example.fr`, living: 'ALONE', guarantee: 'NONE' } })
  // Un bail d'habitation est refusé pour un garage
  await assert.rejects(api('/leases', { method: 'POST', token, body: { propertyId, tenantIds: [t.id], terms: { kind: 'VIDE' } } }))
  const l = await api('/leases', { method: 'POST', token, body: { propertyId, tenantIds: [t.id], terms: { startDate: '2026-10-06' } } })
  let v = await api(`/leases/${l.id}`, { token })
  assert.equal(v.kind, 'PARKING')
  assert.equal(v.terms.durationMonths, 12)
  assert.equal(v.computed.noticeMonths, 1)
  assert.deepEqual(v.computed.rentIssues, [])
  v = await api(`/leases/${l.id}/terms`, { method: 'PUT', token, body: { noticeMonths: 2, chargesMode: 'FORFAIT', chargesCents: 0, clauses: { custom: [] }, signature: { place: 'Montpellier', mode: 'PAPER' } } })
  assert.equal(v.computed.noticeMonths, 2)
  assert.equal(v.computed.renewal, 'Reconduit tacitement pour 1 an')
  await assert.rejects(api(`/leases/${l.id}/terms`, { method: 'PUT', token, body: { kind: 'MEUBLE' } }))

  // Créer un bail : durée et préavis du contrat, sans zone tendue ni locataire précédent
  const b2 = await launch()
  try {
    const ctx = await signedInContext(b2, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/baux/nouveau?id=${l.id}&etape=3`)
    await page.getByText('Un garage loué seul a son propre contrat', { exact: false }).waitFor()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('group', { name: 'Durée du contrat' }).waitFor()
    await page.getByRole('button', { name: '2 mois' }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Quel est le loyer ?' }).waitFor()
    assert.equal(await page.getByText('La commune est-elle en zone tendue ?').count(), 0)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Les options du contrat' }).waitFor()
    await shot(page, 'garage-contrat')
  } finally {
    await b2.close()
  }
  assert.deepEqual(errors, [])

  const contract = await pdfText(`/leases/${l.id}/lease.pdf`, token)
  assert.match(contract, /CONTRAT DE LOCATION D’UN EMPLACEMENT DE STATIONNEMENT/)
  assert.match(contract, /Box fermé n° 12, niveau -1/)
  assert.match(contract, /préavis de 2 mois/)
  assert.match(contract, /TVA non applicable, article 293 B du code général des impôts/)
  assert.doesNotMatch(contract, /Notice d’information|2015-587|Dépenses énergétiques/)

  await api(`/leases/${l.id}/sign`, { method: 'POST', token })
  await api(`/leases/${l.id}/payments`, { method: 'POST', token, body: { period: '2026-10' } })
  const receipt = await pdfText(`/leases/${l.id}/receipts/2026-10.pdf`, token)
  assert.match(receipt, /Quittance de loyer/i)
  assert.match(receipt, /propriétaire de l’emplacement/)
  assert.match(receipt, /TVA non applicable, article 293 B/)
  assert.doesNotMatch(receipt, /article 21/)

  // Congé : préavis du contrat, sans motif ; courriers du logement refusés
  const d = await api(`/leases/${l.id}/letters/defaults/NOTICE_TO_LEAVE`, { token })
  assert.match(d.note, /2 mois avant la fin, préavis du contrat/)
  await assert.rejects(api(`/leases/${l.id}/letters/preview`, { method: 'POST', token, body: { type: 'BOILER' } }))
  const aids = await api(`/properties/${propertyId}/aids`, { token })
  assert.deepEqual(aids.aids, [])
})
