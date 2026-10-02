import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildJourney, inWinterTruce, type JourneyInput } from './journeys.js'

const base: JourneyInput = { today: '2026-10-02', leaseKind: 'VIDE', status: 'ACTIVE', leaseEnd: '2028-10-05', noticeMonths: 6, unpaid: [], letters: [], inventories: [], hasGuarantor: true, facts: {} }
const status = (j: ReturnType<typeof buildJourney>) => Object.fromEntries(j.steps.map((s) => [s.key, s.status]))

test('départ du locataire : chaque étape se coche avec ce que Bailio sait déjà', () => {
  assert.deepEqual(status(buildJourney('DEPARTURE', base)), { ack: 'TODO', proof: 'NA', exit: 'LATER', end: 'LATER', settle: 'LATER' })
  const notice = { receivedDate: '2026-10-05', reduced: true, reducedReason: 'mutation', endDate: '2026-11-05' }
  const j = buildJourney('DEPARTURE', { ...base, facts: { tenantNotice: notice } })
  assert.deepEqual(status(j), { ack: 'DONE', proof: 'TODO', exit: 'TODO', end: 'TODO', settle: 'LATER' })
  assert.equal(j.steps.find((s) => s.key === 'exit')?.due, '2026-11-05')
  // Zone tendue : pas de justificatif à demander
  assert.equal(status(buildJourney('DEPARTURE', { ...base, facts: { tenantNotice: { ...notice, reducedReason: 'logement situé en zone tendue' } } })).proof, 'NA')
  const left: JourneyInput = { ...base, status: 'ENDED', facts: { tenantNotice: notice, keysDate: '2026-11-05' }, inventories: [{ kind: 'EXIT', status: 'SIGNED', date: '2026-11-05' }], letters: [{ type: 'SHORT_NOTICE_PROOF', date: '2026-10-06' }] }
  const done = buildJourney('DEPARTURE', left)
  assert.deepEqual(status(done), { ack: 'DONE', proof: 'DONE', exit: 'DONE', end: 'DONE', settle: 'TODO' })
  assert.equal(done.steps.find((s) => s.key === 'settle')?.due, '2026-12-05')
  // Restitution en retard : alerte
  assert.match(buildJourney('DEPARTURE', { ...left, today: '2027-01-10' }).alert ?? '', /10 %/)
})

test('impayés : relance, puis mise en demeure, garant, commandement', () => {
  const unpaid = [{ period: '2026-09', label: 'septembre 2026', missing: 56000 }]
  assert.deepEqual(status(buildJourney('UNPAID', { ...base, unpaid })), { reminder: 'TODO', formal: 'LATER', guarantor: 'LATER', command: 'LATER', help: 'OPTIONAL' })
  const after = buildJourney('UNPAID', { ...base, unpaid, letters: [{ type: 'REMINDER', date: '2026-09-10' }] })
  assert.equal(after.steps.find((s) => s.key === 'formal')?.status, 'TODO')
  assert.equal(after.steps.find((s) => s.key === 'formal')?.due, '2026-09-25')
  // Une relance d'avant l'impayé ne compte pas
  assert.equal(status(buildJourney('UNPAID', { ...base, unpaid, letters: [{ type: 'REMINDER', date: '2026-03-01' }] })).reminder, 'TODO')
  assert.equal(status(buildJourney('UNPAID', { ...base, unpaid, hasGuarantor: false })).guarantor, 'NA')
  assert.equal(status(buildJourney('UNPAID', { ...base, unpaid, letters: [{ type: 'FORMAL_NOTICE', date: '2026-09-20' }], facts: { journeyDone: { 'UNPAID.command': '2026-10-01' } } })).command, 'DONE')
  assert.ok(inWinterTruce('2026-11-15') && inWinterTruce('2027-03-31') && !inWinterTruce('2026-10-02'))
})

test('vendre ou reprendre : date limite du congé, alerte si dépassée', () => {
  const j = buildJourney('SALE', base)
  assert.equal(j.steps[0].due, '2028-04-05')
  assert.equal(j.alert, null)
  assert.match(buildJourney('SALE', { ...base, today: '2028-05-01' }).alert ?? '', /reconduit/)
  assert.equal(status(buildJourney('SALE', { ...base, leaseKind: 'MOBILITE', noticeMonths: null })).notice, 'NA')
})
