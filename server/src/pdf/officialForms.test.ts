import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PDFDocument } from 'pdf-lib'
import { taxSummary } from '../domain/tax.js'
import { filled1447, filled2044, lines2044 } from '../services/taxForms.js'

const months = (n: number, rent: number, charges: number) => Array.from({ length: n }, () => ({ rentCents: rent, chargesCents: charges }))

test('2044 officielle : lignes d’un logement, totaux cohérents, PDF de 4 pages', async () => {
  const s = taxSummary(2025, [{ id: 'a', name: 'T3', furnished: false, payments: months(12, 92000, 9000), expenses: [{ category: 'TAX', amountCents: 98000, recoverableCents: 12000 }], extra: { loanInterestCents: 412000, coproRegularizationCents: 5000 } }])
  const v = lines2044(s.properties[0])
  assert.equal(v['211'], 1_104_000)
  assert.equal(v['230'], 5000)
  assert.equal(v['240'], 2000 + 86000 - 5000)
  assert.equal(v['263'], v['215'] - v['240'] - v['250'])
  assert.equal(v['263'], s.properties[0].resultCents)
  const pdf = await PDFDocument.load(await filled2044({ year: 2025, owner: 'Julien Fabre', ownerAddress: '5 rue de la Loge, 34000 Montpellier', summary: s, addresses: { a: '48 boulevard des Arceaux' } }))
  assert.equal(pdf.getPageCount(), 4)
})

test('1447-C-SD : champs remplis (commune, activité NACE, date, surface), cases propriétaire et meublé', async () => {
  const bytes = await filled1447({ owner: 'Julien Fabre', ownerAddress: '5 rue de la Loge, 34000 Montpellier', propertyAddress: '12 rue de l’Université', postalCode: '34000', city: 'Montpellier', house: false, surface: 28, startDate: '2026-05-01', yearlyReceiptsCents: 720000 })
  const form = (await PDFDocument.load(bytes)).getForm()
  assert.equal(form.getTextField('a1').getText(), '34')
  assert.equal(form.getTextField('a2').getText(), 'Montpellier')
  assert.equal(form.getTextField('a10').getText(), '6820A')
  assert.equal(form.getTextField('date1').getText(), '01/05/2026')
  assert.equal(form.getTextField('b14').getText(), '7200')
  assert.equal(form.getTextField('c7').getText(), '28')
  assert.ok(form.getCheckBox('cac2').isChecked())
})
