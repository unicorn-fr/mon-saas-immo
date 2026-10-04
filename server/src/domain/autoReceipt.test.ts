import assert from 'node:assert/strict'
import { test } from 'node:test'
import { autoReceiptStep, dueDateOf, periodsToCheck, sendDateOf, warnDateOf, type AutoReceiptState } from './autoReceipt.js'

const s = (over: Partial<AutoReceiptState>): AutoReceiptState => ({ period: '2026-11', paymentDay: 4, today: '2026-11-09', startDate: '2026-10-06', paid: false, held: false, warned: true, ...over })

test('quittance automatique : 5 jours après l’échéance, propriétaire prévenu 3 jours avant', () => {
  assert.equal(dueDateOf('2026-11', 4), '2026-11-04')
  assert.equal(sendDateOf('2026-11', 4), '2026-11-09')
  assert.equal(warnDateOf('2026-11', 4), '2026-11-06')
  assert.equal(sendDateOf('2026-12', 28), '2027-01-02')
  assert.equal(autoReceiptStep(s({ today: '2026-11-05', warned: false })), null)
  assert.equal(autoReceiptStep(s({ today: '2026-11-06', warned: false })), 'WARN')
  assert.equal(autoReceiptStep(s({ today: '2026-11-07' })), null, 'déjà prévenu')
  assert.equal(autoReceiptStep(s({})), 'SEND')
  assert.equal(autoReceiptStep(s({ today: '2026-11-19' })), 'SEND')
  assert.equal(autoReceiptStep(s({ today: '2026-11-20' })), null, 'pas de rattrapage au-delà de 10 jours')
})

test('rien ne part si le loyer est déjà enregistré, si l’envoi est annulé, avant l’entrée ou après la fin du bail', () => {
  assert.equal(autoReceiptStep(s({ paid: true })), null)
  assert.equal(autoReceiptStep(s({ held: true })), null)
  assert.equal(autoReceiptStep(s({ period: '2026-09', today: '2026-09-09' })), null)
  assert.equal(autoReceiptStep(s({ period: '2026-10', today: '2026-10-09' })), null, 'entrée le 6 après l’échéance du 4 : premier mois au prorata, saisi à la main')
  assert.equal(autoReceiptStep(s({ endDate: '2026-10-31' })), null)
})

test('mois examinés : le précédent (échéance de fin de mois) et le mois en cours', () => {
  assert.deepEqual(periodsToCheck('2027-01-02'), ['2026-12', '2027-01'])
})

test('prochaine quittance automatique affichée : le premier mois non payé dont l’envoi n’est pas passé', async () => {
  const { upcomingAutoReceipt } = await import('./autoReceipt.js')
  const base = { today: '2026-11-07', paymentDay: 4, startDate: '2026-10-06', paid: new Set<string>(), held: {} }
  assert.deepEqual(upcomingAutoReceipt(base), { period: '2026-11', sendOn: '2026-11-09', held: false }, 'octobre : entrée après l’échéance')
  assert.deepEqual(upcomingAutoReceipt({ ...base, today: '2026-10-04', startDate: '2026-09-01' }), { period: '2026-10', sendOn: '2026-10-09', held: false })
  assert.deepEqual(upcomingAutoReceipt({ ...base, paid: new Set(['2026-11']) }), { period: '2026-12', sendOn: '2026-12-09', held: false })
  assert.deepEqual(upcomingAutoReceipt({ ...base, held: { '2026-11': 'x' } })?.held, true)
})
