import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bulkGroups, type BulkLease } from './bulk.js'

const l: BulkLease = { id: 'a', propertyName: 'Studio', tenantName: 'Lucas', tenantEmail: true, started: true, insuranceExpiresAt: '2027-05-01', unpaid: [], lastReminderAt: null, revisionDue: null, irlRef: true, dpe: 'C', paidPeriods: [], receiptsSent: [], eReceiptWithdrawn: false }
const today = '2026-10-06'

test('assurance : absente ou expirant dans les 30 jours ; sans email, la ligne est bloquée', () => {
  assert.equal(bulkGroups([l], today).INSURANCE.length, 0)
  assert.equal(bulkGroups([{ ...l, insuranceExpiresAt: '2026-11-05' }], today).INSURANCE[0].detail, 'Expire le 05/11/2026')
  assert.equal(bulkGroups([{ ...l, insuranceExpiresAt: '2026-09-30' }], today).INSURANCE[0].detail, 'Expirée le 30/09/2026')
  assert.equal(bulkGroups([{ ...l, insuranceExpiresAt: null, tenantEmail: false }], today).INSURANCE[0].blocked, 'Pas d’email dans la fiche du locataire.')
  assert.equal(bulkGroups([{ ...l, insuranceExpiresAt: null, started: false }], today).INSURANCE.length, 0)
})

test('impayés : 5 jours après l’échéance, pas de nouvelle relance avant 15 jours', () => {
  const unpaid = [{ period: '2026-09', dueDate: '2026-09-05', missing: 56000 }, { period: '2026-10', dueDate: '2026-10-05', missing: 56000 }]
  const rows = bulkGroups([{ ...l, unpaid }], today).UNPAID
  assert.equal(rows.length, 1)
  assert.equal(rows[0].amountCents, 56000)
  assert.equal(rows[0].detail, '560,00 € : septembre 2026')
  assert.match(bulkGroups([{ ...l, unpaid, lastReminderAt: '2026-09-25' }], today).UNPAID[0].blocked!, /déjà envoyée le 25\/09\/2026/)
  assert.equal(bulkGroups([{ ...l, unpaid, lastReminderAt: '2026-09-20' }], today).UNPAID[0].blocked, null)
  assert.equal(bulkGroups([{ ...l, unpaid: [unpaid[1]] }], today).UNPAID.length, 0)
})

test('révision : anniversaire dans les 30 jours, IRL de référence, interdite en F et G', () => {
  assert.equal(bulkGroups([{ ...l, revisionDue: '2026-11-20' }], today).REVISION.length, 0)
  assert.equal(bulkGroups([{ ...l, revisionDue: '2026-10-20' }], today).REVISION[0].blocked, null)
  assert.match(bulkGroups([{ ...l, revisionDue: '2026-10-01', dpe: 'F' }], today).REVISION[0].blocked!, /interdit la révision/)
  assert.match(bulkGroups([{ ...l, revisionDue: '2026-10-01', irlRef: false }], today).REVISION[0].blocked!, /IRL/)
})

test('quittances : loyers reçus ce mois-ci et le mois dernier, pas encore envoyées, accord respecté', () => {
  const rows = bulkGroups([{ ...l, paidPeriods: ['2026-08', '2026-09', '2026-10'], receiptsSent: ['2026-10'] }], today).RECEIPTS
  assert.deepEqual(rows.map((r) => r.period), ['2026-09'])
  assert.match(bulkGroups([{ ...l, paidPeriods: ['2026-10'], eReceiptWithdrawn: true }], today).RECEIPTS[0].blocked!, /retiré son accord/)
  // Janvier : le mois dernier est décembre de l'année précédente
  assert.deepEqual(bulkGroups([{ ...l, paidPeriods: ['2026-12'] }], '2027-01-03').RECEIPTS.map((r) => r.period), ['2026-12'])
})
