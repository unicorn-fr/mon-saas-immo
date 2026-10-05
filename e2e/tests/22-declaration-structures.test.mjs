import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Déclaration par structure : un logement détenu par une SCI à l'impôt sur le revenu sort de la déclaration
 * personnelle et reçoit sa fiche (2072, date limite, part de chaque associé).
 */
test('déclaration : logements de la SCI à part, fiche 2072 et parts des associés', async () => {
  const { token } = await newAccount()
  const { propertyId, leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-11', amountCents: 56000, receivedAt: '2026-11-04' } })
  const year = 2026
  const before = await api(`/money/tax?year=${year}`, { token })
  assert.equal(before.properties.length, 1)
  assert.equal(before.structures.length, 0)

  // Le logement passe dans une SCI à l'IR détenue à 60/40
  const sci = await api('/structures', { method: 'POST', token, body: { kind: 'SCI', sciFamily: true, company: { name: 'Les Tilleuls', form: 'SCI' }, associates: [{ name: 'Claire', sharePct: 60 }, { name: 'Paul', sharePct: 40 }] } })
  await api(`/properties/${propertyId}/structure`, { method: 'PUT', token, body: { structureId: sci.id } })
  const after = await api(`/money/tax?year=${year}`, { token })
  assert.equal(after.properties.length, 0, 'plus de loyers dans la déclaration personnelle')
  const sheet = after.structures[0].sheet
  assert.match(sheet.steps[0].form, /2072/)
  assert.match(sheet.steps[0].deadline, /mai 2027/)
  const result = sheet.steps[0].lines.find((l) => /Résultat foncier/.test(l.label)).cents
  assert.deepEqual(sheet.shares.map((s) => s.resultCents), [Math.round(result * 0.6), Math.round(result * 0.4)])

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/argent/declaration`)
  await page.getByRole('button', { name: String(year) }).click()
  await page.getByRole('heading', { name: 'SCI Les Tilleuls' }).waitFor()
  await page.getByText('Aide à vérifier').waitFor()
  await page.getByText(/2072-S/).waitFor()
  await page.getByText('Claire (60 %)').waitFor()
  await shot(page, 'declaration-sci')
  await browser.close()
  assert.deepEqual(errors, [])
})
