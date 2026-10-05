import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loanSchedule, loanSignedAt, loanYear, loansAt, loansDeductible, monthlyCashflow, monthlyPaymentCents, type Loan } from './loan.js'

// 200 000 € à 3,5 % sur 20 ans : 1 159,92 € par mois (valeur des simulateurs de prêt à mensualités constantes).
const loan: Loan = { principalCents: 200_000_00, ratePercent: 3.5, months: 240, firstPaymentDate: '2026-02-05', insuranceMonthlyCents: 30_00, feesCents: 1_200_00 }

test('emprunt : mensualité constante, taux mensuel = taux annuel / 12', () => {
  assert.equal(monthlyPaymentCents(200_000_00, 3.5, 240), 1_159_92)
  assert.equal(monthlyPaymentCents(12_000_00, 0, 12), 1_000_00)
})

test('emprunt : tableau d’amortissement soldé à la dernière mensualité', () => {
  const rows = loanSchedule(loan)
  assert.equal(rows.length, 240)
  assert.deepEqual(rows[0], { n: 1, date: '2026-02-05', paymentCents: 1_159_92, interestCents: 583_33, principalCents: 576_59, insuranceCents: 30_00, remainingCents: 199_423_41 })
  assert.equal(rows[239].date, '2046-01-05')
  assert.equal(rows[239].remainingCents, 0)
  assert.equal(rows.reduce((a, r) => a + r.principalCents, 0), 200_000_00)
  // Fin de mois : le 31 devient le 28 en février
  assert.deepEqual(loanSchedule({ principalCents: 10_000_00, ratePercent: 0, months: 3, firstPaymentDate: '2026-01-31' }).map((r) => [r.date, r.paymentCents]), [['2026-01-31', 3_333_33], ['2026-02-28', 3_333_33], ['2026-03-31', 3_333_34]])
})

test('emprunt : ligne 250 de l’année = intérêts + assurance + frais payés dans l’année', () => {
  // 2026 : 11 mensualités (février à décembre) et les frais (prêt signé un mois avant la première mensualité)
  assert.equal(loanSignedAt(loan), '2026-01-05')
  const y26 = loanYear(loan, 2026)
  assert.equal(y26.interestCents, 6_323_35)
  assert.equal(y26.insuranceCents, 330_00)
  assert.equal(y26.feesCents, 1_200_00)
  assert.equal(y26.deductibleCents, 6_323_35 + 330_00 + 1_200_00)
  // 2027 : 12 mensualités, plus de frais
  const y27 = loanYear(loan, 2027)
  assert.equal(y27.feesCents, 0)
  assert.equal(y27.insuranceCents, 360_00)
  assert.equal(y27.deductibleCents, 6_659_03 + 360_00)
  // Frais signés l'année d'avant : comptés cette année-là
  assert.equal(loanYear({ ...loan, signedAt: '2025-12-15' }, 2025).deductibleCents, 1_200_00)
  assert.equal(loanYear(loan, 2050).deductibleCents, 0)
  // Plusieurs prêts (dont un prêt à taux zéro : aucun intérêt)
  assert.equal(loansDeductible([loan, { principalCents: 40_000_00, ratePercent: 0, months: 240, firstPaymentDate: '2026-02-05' }], 2027), y27.deductibleCents)
})

test('emprunt : mensualité et capital restant d’un mois donné ; trésorerie', () => {
  assert.deepEqual(loansAt([loan], '2026-01-15'), { paymentCents: 0, insuranceCents: 0, remainingCents: 200_000_00 })
  assert.deepEqual(loansAt([loan], '2026-02-20'), { paymentCents: 1_159_92, insuranceCents: 30_00, remainingCents: 199_423_41 })
  assert.deepEqual(loansAt([loan], '2046-02-01'), { paymentCents: 0, insuranceCents: 0, remainingCents: 0 })
  assert.equal(monthlyCashflow({ rentCents: 900_00, chargesCents: 60_00, loanPaymentCents: 1_159_92, loanInsuranceCents: 30_00, averageExpensesCents: 120_00 }), -349_92)
})
