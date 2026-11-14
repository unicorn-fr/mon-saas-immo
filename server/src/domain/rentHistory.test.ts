import assert from 'node:assert/strict'
import { test } from 'node:test'
import { amountsAt, amountsForPeriod, historyOf, withStep } from './rentHistory.js'

const lease = { data: {}, startDate: new Date('2025-10-06T00:00:00Z'), rentCents: 51000, chargesCents: 5000, paymentDay: 5 }

test('historique des loyers : le loyer d’un mois est celui en vigueur à son échéance', () => {
  const h = withStep(historyOf(lease), { from: '2026-10-15', rentCents: 52000, chargesCents: 5000, reason: 'REVISION' })
  const l = { ...lease, data: { rentHistory: h } }
  assert.equal(amountsForPeriod(l, '2026-10').rentCents, 51000, 'échéance du 5 octobre : avant la révision')
  assert.equal(amountsForPeriod(l, '2026-11').rentCents, 52000)
  assert.equal(amountsForPeriod(l, '2025-09').rentCents, 51000, 'avant le premier montant : le premier')
  assert.equal(amountsAt(h, '2026-10-15').rentCents, 52000)
  // Une nouvelle révision à la même date remplace la précédente
  assert.equal(withStep(h, { from: '2026-10-15', rentCents: 52500, chargesCents: 5000, reason: 'REVISION' }).length, 2)
})

test('loyers en retard : mois échus non payés, montant en vigueur à l’échéance', async () => {
  const { unpaidPeriods } = await import('./rentHistory.js')
  const lease = { data: { rentHistory: [{ from: '2026-07-01', rentCents: 50000, chargesCents: 5000, reason: 'START' as const }, { from: '2026-09-01', rentCents: 51000, chargesCents: 5000, reason: 'REVISION' as const }] }, startDate: new Date('2026-07-01T00:00:00Z'), rentCents: 51000, chargesCents: 5000, paymentDay: 5 }
  const now = new Date('2026-10-06T12:00:00Z')
  // Juillet payé, août partiel, septembre et octobre (échéance passée le 5) non payés
  const out = unpaidPeriods(lease, [{ period: '2026-07', amountCents: 55000 }, { period: '2026-08', amountCents: 30000 }], now)
  assert.deepEqual(out, [{ period: '2026-08', missing: 25000 }, { period: '2026-09', missing: 56000 }, { period: '2026-10', missing: 56000 }])
  // Le 4 octobre, l'échéance d'octobre n'est pas passée
  assert.equal(unpaidPeriods(lease, [], new Date('2026-10-04T12:00:00Z')).length, 3)
})

test('échéancier : retard, partiel, à venir et premier mois au prorata', async () => {
  const { rentSchedule } = await import('./rentHistory.js')
  const l = { data: {}, startDate: new Date('2026-08-20T00:00:00Z'), endDate: new Date('2029-08-19T00:00:00Z'), rentCents: 50000, chargesCents: 5000, paymentDay: 5 }
  const now = new Date('2026-11-10T12:00:00Z')
  const out = rentSchedule(l, [{ period: '2026-08', amountCents: 20000 }, { period: '2026-09', amountCents: 55000 }, { period: '2026-10', amountCents: 30000 }], now)
  assert.deepEqual(out.map((m) => [m.period, m.state]), [['2026-12', 'UPCOMING'], ['2026-11', 'LATE'], ['2026-10', 'PARTIAL'], ['2026-09', 'PAID'], ['2026-08', 'FIRST']])
  assert.equal(rentSchedule(l, [], now).at(-1)?.state, 'FIRST', 'premier mois au prorata non payé : jamais en retard')
})

test('bail commercial payé par trimestre : une échéance tous les 3 mois, montant de 3 mois', async () => {
  const { unpaidPeriods, rentSchedule, isTermStart, termMonthsOf } = await import('./rentHistory.js')
  const quarterly = { data: { terms: { paymentFrequency: 'QUARTERLY' } }, startDate: new Date('2026-01-01T00:00:00Z'), endDate: new Date('2034-12-31T00:00:00Z'), rentCents: 100000, chargesCents: 10000, paymentDay: 1 }
  assert.equal(termMonthsOf(quarterly), 3)
  assert.equal(termMonthsOf({ data: {} }), 1, 'mensuel par défaut')
  assert.deepEqual(['2026-01', '2026-02', '2026-04', '2026-07', '2026-10'].map((p) => isTermStart(quarterly, p)), [true, false, true, true, true])
  const now = new Date('2026-05-15T12:00:00Z')
  // Janvier payé (3 mois), avril non payé : une seule échéance en retard, de 3 mois.
  assert.deepEqual(unpaidPeriods(quarterly, [{ period: '2026-01', amountCents: 330000 }], now), [{ period: '2026-04', missing: 330000 }])
  const sched = rentSchedule(quarterly, [{ period: '2026-01', amountCents: 330000 }], now)
  assert.deepEqual(sched.map((s) => [s.period, s.dueCents, s.state]), [['2026-04', 330000, 'LATE'], ['2026-01', 330000, 'PAID']])
  // Annuel
  const yearly = { ...quarterly, data: { terms: { paymentFrequency: 'YEARLY' } } }
  assert.deepEqual(unpaidPeriods(yearly, [], now), [{ period: '2026-01', missing: 1320000 }])
})
