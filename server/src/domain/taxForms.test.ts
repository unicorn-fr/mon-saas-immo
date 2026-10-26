import assert from 'node:assert/strict'
import { test } from 'node:test'
import { microBicCeilingCents, taxSummary, type TaxProperty } from './tax.js'
import { copyPlan, wholeEuros } from './taxForms.js'

const months = (n: number, rent: number, charges: number) => Array.from({ length: n }, () => ({ rentCents: rent, chargesCents: charges }))
const vide = (over: Partial<TaxProperty> = {}): TaxProperty => ({ id: 'v', name: 'T2', furnished: false, payments: months(12, 60000, 5000), expenses: [], ...over })

test('micro-foncier : une seule case, 4BE, loyers hors charges', () => {
  const plan = copyPlan({ year: 2026, summary: taxSummary(2026, [vide()]), addresses: {}, lmnp: null })
  assert.deepEqual(plan.map((g) => g.id), ['VIDE_MICRO'])
  assert.deepEqual(plan[0].entries.map((e) => [e.box, e.cents]), [['4BE', 720000]])
})

test('régime réel : colonnes de la 2044 par logement, puis report sur la 2042 (bénéfice en 4BA)', () => {
  const p = vide({ expenses: [{ category: 'TAX', amountCents: 90000, recoverableCents: 0 }], extra: { loanInterestCents: 500000, coproRegularizationCents: 3000 } })
  const plan = copyPlan({ year: 2026, summary: taxSummary(2026, [p]), addresses: { v: '3 rue Neuve, 34000 Montpellier' }, lmnp: null })
  assert.deepEqual(plan.map((g) => g.id), ['VIDE_2044', 'VIDE_2042'])
  const lines = plan[0].entries.map((e) => e.box)
  assert.deepEqual(lines, ['Immeuble 1', '211', '222', '227', '230', '250'])
  assert.equal(plan[0].entries[0].text, '3 rue Neuve, 34000 Montpellier')
  // La régularisation se saisit sans signe.
  assert.equal(plan[0].entries.find((e) => e.box === '230')!.cents, 3000)
  assert.equal(plan[1].entries[0].box, '4BA')
  assert.equal(plan[1].entries[0].cents, 720000 - 2000 - 90000 + 3000 - 500000)
})

test('déficit foncier : 4BC pour le revenu global, 4BB pour la part reportée (jamais 4BD)', () => {
  const p = vide({ expenses: [{ category: 'REPAIR', amountCents: 2_000_000, recoverableCents: 0 }] })
  const plan = copyPlan({ year: 2026, summary: taxSummary(2026, [p]), addresses: {}, lmnp: null })
  const report = plan.find((g) => g.id === 'VIDE_2042')!
  assert.deepEqual(report.entries.map((e) => e.box), ['4BC', '4BB'])
  assert.equal(report.entries[0].cents, 1_070_000)
  assert.equal(report.entries[1].cents, 2_000_000 + 2000 - 720000 - 1_070_000)
})

test('meublé : 5NI au micro-BIC, 5NA au réel ; plafond 83 600 € à partir des revenus 2026', () => {
  const m: TaxProperty = { id: 'm', name: 'Studio', furnished: true, payments: months(12, 50000, 4000), expenses: [] }
  const micro = copyPlan({ year: 2026, summary: taxSummary(2026, [m]), addresses: {}, lmnp: { better: 'MICRO', taxableCents: 0, deficitCents: 0 } })
  assert.deepEqual(micro[0].entries.map((e) => [e.box, e.cents]), [['5NI', 648000]])
  const real = copyPlan({ year: 2026, summary: taxSummary(2026, [m]), addresses: {}, lmnp: { better: 'REAL', taxableCents: 120000, deficitCents: 0 } })
  assert.equal(real[0].entries[0].box, '5NA')
  assert.equal(microBicCeilingCents(2025), 7_770_000)
  assert.equal(microBicCeilingCents(2026), 8_360_000)
  // 80 000 € de recettes : réel obligatoire en 2025, micro possible en 2026.
  const big: TaxProperty = { ...m, payments: months(10, 800000, 0) }
  assert.equal(taxSummary(2025, [big]).furnished!.microAllowed, false)
  assert.equal(taxSummary(2026, [big]).furnished!.microAllowed, true)
})

test('euros entiers, arrondis au plus proche', () => {
  assert.equal(wholeEuros(123449), 1234)
  assert.equal(wholeEuros(123450), 1235)
})
