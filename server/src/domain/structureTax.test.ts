import { test } from 'node:test'
import assert from 'node:assert/strict'
import { easter, resultDeadline, sharesOf, sheetKind, structureTaxSheet } from './structureTax.js'

test('déclaration de résultat : 2e jour ouvré après le 1er mai, + 15 jours en ligne', () => {
  // Revenus 2025 : 1er mai 2026 un vendredi → lundi 4 (1er jour ouvré), mardi 5 mai (impots.gouv : échéance du 05/05/26)
  assert.deepEqual(resultDeadline(2025), { legal: '2026-05-05', online: '2026-05-20' })
  // Revenus 2026 : 1er mai 2027 un samedi → lundi 3, mardi 4 mai
  assert.equal(resultDeadline(2026).legal, '2027-05-04')
  // Pâques et Ascension (Pâques 2026 : 5 avril ; Ascension : 14 mai)
  assert.equal(easter(2026).toISOString().slice(0, 10), '2026-04-05')
  assert.equal(easter(2024).toISOString().slice(0, 10), '2024-03-31')
  // 2008 : Ascension le jeudi 1er mai, 1er mai jeudi → vendredi 2 (1er), lundi 5 mai (2e)
  assert.equal(resultDeadline(2007).legal, '2008-05-05')
})

test('fiche par structure : formulaires selon la structure et le régime', () => {
  assert.equal(sheetKind({ kind: 'PERSON' }), 'PERSONAL')
  assert.equal(sheetKind({ kind: 'COUPLE' }), 'PERSONAL')
  assert.equal(sheetKind({ kind: 'SCI', taxRegime: 'IR' }), 'SCI_IR')
  assert.equal(sheetKind({ kind: 'SCI', taxRegime: 'IS' }), 'IS')
  assert.equal(sheetKind({ kind: 'COMPANY', taxRegime: 'IS' }), 'IS')
  assert.equal(sheetKind({ kind: 'COMPANY', taxRegime: 'IR' }), 'COMPANY_IR')
  const totals = { rentCents: 12_000_00, chargesCents: 600_00, resultCents: 8_000_00, interestCents: 2_000_00, expensesCents: 2_600_00, furnished: false }
  assert.equal(structureTaxSheet({ kind: 'PERSON' }, totals, 2025), null)
  const sci = structureTaxSheet({ kind: 'SCI', taxRegime: 'IR', associates: [{ name: 'Claire', sharePct: 60 }, { name: 'Paul', sharePct: 40 }] }, totals, 2025)!
  assert.match(sci.steps[0].form!, /2072/)
  assert.match(sci.steps[0].deadline!, /20 mai 2026/)
  assert.ok(sci.steps[1].lines.some((l) => /4BA/.test(l.text ?? '')))
  assert.deepEqual(sci.shares, [{ name: 'Claire', pct: 60, resultCents: 4_800_00 }, { name: 'Paul', pct: 40, resultCents: 3_200_00 }])
  assert.match(structureTaxSheet({ kind: 'SCI', taxRegime: 'IS' }, totals, 2025)!.steps[0].form!, /2065/)
  assert.match(structureTaxSheet({ kind: 'COMPANY', taxRegime: 'IR', companyForm: 'SARL de famille' }, totals, 2025)!.steps[0].form!, /2031/)
})

test('parts des associés : arrondies au centime, sans associé vide', () => {
  assert.deepEqual(sharesOf({ associates: [{ name: 'A', sharePct: 33.33 }, { name: '', sharePct: null }] }, 1_000_00), [{ name: 'A', pct: 33.33, resultCents: 333_30 }])
})
