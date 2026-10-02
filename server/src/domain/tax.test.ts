import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitPayment, taxSummary, type TaxProperty } from './tax.js'

const months = (n: number, rent: number, charges: number) => Array.from({ length: n }, () => ({ rentCents: rent, chargesCents: charges }))

test('location vide : lignes de la 2044 et comparaison avec le micro-foncier', () => {
  const p: TaxProperty = {
    id: 'a',
    name: 'Studio',
    furnished: false,
    payments: months(12, 70000, 5000),
    expenses: [
      { category: 'TAX', amountCents: 120000, recoverableCents: 20000 },
      { category: 'REPAIR', amountCents: 80000, recoverableCents: 0 },
      { category: 'INSURANCE', amountCents: 15000, recoverableCents: 0 },
      { category: 'OTHER', amountCents: 3000, recoverableCents: 0 },
    ],
    extra: { loanInterestCents: 250000 },
  }
  const s = taxSummary(2025, [p])
  const lines = Object.fromEntries(s.properties[0].lines.map((l) => [l.line, l.cents]))
  assert.equal(lines['211'], 840000)
  assert.equal(lines['222'], 2000)
  assert.equal(lines['227'], 100000) // taxe d'ordures ménagères récupérée exclue
  assert.equal(lines['224'], 80000)
  assert.equal(lines['250'], 250000)
  assert.equal(s.properties[0].resultCents, 840000 - 2000 - 15000 - 80000 - 100000 - 250000)
  assert.equal(s.properties[0].unclassifiedCents, 3000)
  assert.equal(s.empty?.microAllowed, true)
  assert.equal(s.empty?.microTaxableCents, 588000)
  assert.equal(s.empty?.better, 'REAL') // 393 000 < 588 000
})

test('au-delà de 15 000 € de loyers : régime réel obligatoire ; meublé : micro-BIC sur les loyers charges comprises', () => {
  const big = taxSummary(2025, [{ id: 'b', name: 'Maison', furnished: false, payments: months(12, 140000, 0), expenses: [] }])
  assert.equal(big.empty?.microAllowed, false)
  assert.equal(big.empty?.better, 'REAL')
  const lmnp = taxSummary(2025, [{ id: 'c', name: 'T2 meublé', furnished: true, payments: months(10, 60000, 4000), expenses: [] }])
  assert.equal(lmnp.furnished?.receiptsCents, 640000)
  assert.equal(lmnp.furnished?.microTaxableCents, 320000)
  assert.equal(lmnp.empty, null)
  assert.deepEqual(splitPayment(56000, 51000), { rentCents: 51000, chargesCents: 5000 })
  assert.deepEqual(splitPayment(30000, 51000), { rentCents: 30000, chargesCents: 0 })
})
