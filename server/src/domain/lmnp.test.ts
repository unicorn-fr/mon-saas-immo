import assert from 'node:assert/strict'
import { test } from 'node:test'
import { lmnpEstimate, yearShare } from './lmnp.js'

const base = { receiptsCents: 1_200_000, chargesCents: 200_000, worksCents: 0, loanInterestCents: 300_000, adminFeesCents: 0 }

test('meublé au réel : amortissements limités au résultat, reste reporté, comparaison au micro-BIC', () => {
  // 200 000 € d'achat, 15 % de terrain : 170 000 / 30 = 5 666,67 € ; mobilier 7 000 / 7 = 1 000 €
  const e = lmnpEstimate(2025, [{ ...base, purchase: { priceCents: 20_000_000, date: '2020-03-01' }, furnitureCents: 700_000 }])
  assert.equal(e.resultBeforeAmortCents, 700_000)
  assert.equal(e.amortYearCents, 566_667 + 100_000)
  assert.equal(e.amortUsedCents, 666_667)
  assert.equal(e.taxableCents, 33_333)
  assert.equal(e.better, 'REAL')
  // Amortissement supérieur au résultat : pas de déficit créé, le reste est reporté
  const big = lmnpEstimate(2025, [{ ...base, receiptsCents: 800_000, purchase: { priceCents: 30_000_000, date: '2020-03-01' } }])
  assert.equal(big.taxableCents, 0)
  assert.equal(big.deficitCents, 0)
  assert.equal(big.amortCarriedCents, big.amortYearCents - 300_000)
  // Déficit avant amortissement : reportable, l'amortissement entier est reporté
  const loss = lmnpEstimate(2025, [{ ...base, receiptsCents: 400_000, purchase: { priceCents: 20_000_000 } }], 50_000)
  assert.equal(loss.deficitCents, 100_000)
  assert.equal(loss.amortUsedCents, 0)
  assert.equal(loss.amortCarriedCents, loss.amortYearCents + 50_000)
  assert.equal(lmnpEstimate(2025, [base]).missingPurchase, true)
})

test('logement acheté en cours d’année : amorti au prorata', () => {
  assert.equal(yearShare(2025, '2024-06-01'), 1)
  assert.equal(yearShare(2025, '2026-01-01'), 0)
  assert.ok(Math.abs(yearShare(2025, '2025-07-02') - 183 / 365) < 1e-9)
})
