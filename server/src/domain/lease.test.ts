import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addMonths, durationMonths, formatDateFr, formatEuros, leaseEndDate, leaseInputSchema, maxDepositCents, parseIsoDate, toIsoDate } from './lease.js'
import { computeReminders } from '../services/reminders.js'

const base = {
  type: 'UNFURNISHED' as const,
  property: { address: '3 place de la Comédie 34000 Montpellier', surface: 65, rooms: 3 },
  landlord: { firstName: 'Claire', lastName: 'Dubois', address: '5 rue de la Loge 34000 Montpellier' },
  tenants: [{ firstName: 'Sophie', lastName: 'Leroy' }],
  rent: { rentCents: 85_000, chargesCents: 5_000, startDate: '2026-10-01', paymentDay: 5 },
}

test('durée légale : 3 ans en vide, 1 an en meublé', () => {
  assert.equal(durationMonths('UNFURNISHED'), 36)
  assert.equal(durationMonths('FURNISHED'), 12)
})

test('dépôt de garantie maximum : 1 mois en vide, 2 mois en meublé', () => {
  assert.equal(maxDepositCents('UNFURNISHED', 85_000), 85_000)
  assert.equal(maxDepositCents('FURNISHED', 60_000), 120_000)
})

test('un dépôt au-dessus du plafond est refusé, sauf pour un bail déjà signé importé', () => {
  const tooHigh = { ...base, rent: { ...base.rent, depositCents: 170_000 } }
  assert.equal(leaseInputSchema.safeParse(tooHigh).success, false)
  assert.equal(leaseInputSchema.safeParse({ ...tooHigh, source: 'import' }).success, true)
})

test('fin de bail : la veille de la date anniversaire', () => {
  assert.equal(toIsoDate(leaseEndDate(parseIsoDate('2026-10-01'), 36)), '2029-09-30')
  assert.equal(toIsoDate(leaseEndDate(parseIsoDate('2026-01-31'), 12)), '2027-01-30')
})

test('ajout de mois sans débordement en fin de mois', () => {
  assert.equal(toIsoDate(addMonths(parseIsoDate('2026-01-31'), 1)), '2026-02-28')
})

test('formats français', () => {
  assert.equal(formatEuros(123_450), '1 234,50 €')
  assert.equal(formatEuros(93_500), '935 €')
  assert.equal(formatDateFr(parseIsoDate('2026-10-01')), '1er octobre 2026')
})

test('échéances calculées pour un bail vide qui démarre plus tard', () => {
  const start = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 2, 1)) // 1er mars de l'an prochain
  const reminders = computeReminders({ id: 'l1', userId: 'u1', type: 'UNFURNISHED', status: 'ACTIVE', startDate: start, durationMonths: 36, paymentDay: 5 })
  const types = reminders.map((r) => r.type)
  assert.ok(types.includes('INVENTORY_ENTRY'))
  assert.ok(types.includes('INSURANCE'))
  assert.ok(types.filter((t) => t === 'RENT_RECEIPT').length >= 1)
  // Aucune quittance avant l'entrée du locataire.
  for (const r of reminders.filter((x) => x.type === 'RENT_RECEIPT')) assert.ok(new Date(r.dueDate) >= start)
  // Fin de bail : rappel 7 mois avant l'échéance (congé du bailleur : 6 mois en vide).
  const end = reminders.find((r) => r.type === 'LEASE_END')
  assert.equal(toIsoDate(new Date(end!.dueDate)), toIsoDate(addMonths(addMonths(start, 36), -7)))
})
