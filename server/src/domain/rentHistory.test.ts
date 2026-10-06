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
