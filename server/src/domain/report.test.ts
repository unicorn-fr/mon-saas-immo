import assert from 'node:assert/strict'
import { test } from 'node:test'
import { propertyReport } from './report.js'

test('bilan : résultat, occupation, rendement brut et prévision de l’année suivante', () => {
  const r = propertyReport({
    id: 'a',
    name: 'Studio',
    year: 2026,
    purchasePriceCents: 12_000_000,
    payments: Array.from({ length: 3 }, (_, i) => ({ period: `2026-${10 + i}`, rentCents: 51000, chargesCents: 5000 })),
    expenses: [
      { category: 'TAX', amountCents: 90000, recoverableCents: 15000 },
      { category: 'REPAIR', amountCents: 20000, recoverableCents: 0 },
    ],
    leases: [{ status: 'ACTIVE', start: '2026-10-06', end: '2027-10-05', rentCents: 51000, chargesCents: 5000 }],
    unpaidCents: 0,
  })
  assert.equal(r.rentCents, 153000)
  assert.equal(r.expensesCents, 95000)
  assert.equal(r.netCents, 153000 + 15000 - 110000)
  assert.equal(r.occupiedMonths, 3)
  assert.equal(r.grossYield, 5.1) // 6 120 € / 120 000 €
  assert.equal(r.forecast.rentCents, 51000 * 12)
  assert.equal(r.forecast.netCents, 51000 * 12 - 95000)
})
