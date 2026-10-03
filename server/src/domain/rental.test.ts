import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rentalDone, rentalSteps, type RentalFacts } from './rental.js'

const base: RentalFacts = { propertyId: 'p1', propertyMissing: [], skipped: [], adWritten: false, applyOpen: false, candidates: 0, tenant: null, lease: null, today: '2026-10-03' }
const state = (f: RentalFacts) => Object.fromEntries(rentalSteps(f).map((s) => [s.key, s.state]))

test('logement presque complet, sans DPE : fiche à finaliser, annonce, candidatures et locataire proposés, bail bloqué', () => {
  const steps = rentalSteps({ ...base, propertyMissing: [{ label: 'La classe énergie du DPE', level: 'ESSENTIAL', section: 'diagnostics' }] })
  const s = Object.fromEntries(steps.map((x) => [x.key, x]))
  assert.equal(s.PROPERTY.state, 'TODO')
  assert.match(s.PROPERTY.text, /la classe énergie du DPE/)
  assert.equal(s.PROPERTY.action?.to, '/espace/logements/p1/fiche#diagnostics')
  assert.equal(s.AD.state, 'TODO')
  assert.equal(s.CANDIDATES.state, 'TODO')
  assert.equal(s.TENANT.state, 'TODO')
  assert.equal(s.LEASE.state, 'LOCKED')
  assert.equal(s.SIGN.state, 'LOCKED')
})

test('ce qui est seulement recommandé ne bloque pas le bail', () => {
  const t = { id: 't1', name: 'Lucas Garnier', essentialMissing: [], formSent: false, toReview: 0 }
  const s = state({ ...base, propertyMissing: [{ label: 'L’identifiant fiscal du logement', level: 'RECOMMENDED' }], tenant: t })
  assert.equal(s.PROPERTY, 'TODO')
  assert.equal(s.LEASE, 'TODO')
  assert.equal(s.AD, 'DONE')
})

test('locataire : lien envoyé en attente, puis éléments à vérifier', () => {
  const t = { id: 't1', name: 'Lucas', essentialMissing: ['Ses nom et prénom'], formSent: true, toReview: 0 }
  assert.equal(state({ ...base, tenant: t }).TENANT, 'WAITING')
  const review = rentalSteps({ ...base, tenant: { ...t, essentialMissing: [], toReview: 2 } }).find((x) => x.key === 'TENANT')!
  assert.equal(review.state, 'TODO')
  assert.match(review.title, /Vérifier le dossier/)
})

test('étapes facultatives écartées, puis bail relu, envoyé, signé et entrée faite', () => {
  const t = { id: 't1', name: 'Lucas', essentialMissing: [], formSent: false, toReview: 0 }
  const lease = { id: 'l1', status: 'DRAFT' as const, ready: true, checked: false, esign: 'NONE' as const, entryInventory: 'NONE' as const, depositCents: 50000, depositReceived: false, insurance: false, paid: false, startDate: '2026-11-01' }
  assert.equal(state({ ...base, skipped: ['AD'], applyOpen: true }).AD, 'SKIPPED')
  assert.equal(state({ ...base, applyOpen: true }).CANDIDATES, 'WAITING')
  let s = state({ ...base, tenant: t, lease })
  assert.deepEqual([s.LEASE, s.CHECK, s.SIGN, s.INVENTORY], ['DONE', 'TODO', 'LOCKED', 'LOCKED'])
  s = state({ ...base, tenant: t, lease: { ...lease, esign: 'PENDING' } })
  assert.deepEqual([s.CHECK, s.SIGN], ['DONE', 'WAITING'])
  s = state({ ...base, tenant: t, lease: { ...lease, status: 'ACTIVE', esign: 'COMPLETED' } })
  assert.deepEqual([s.SIGN, s.INVENTORY, s.DEPOSIT, s.INSURANCE, s.RENT], ['DONE', 'TODO', 'TODO', 'TODO', 'WAITING'])
  const done = rentalSteps({ ...base, tenant: t, lease: { ...lease, status: 'ACTIVE', esign: 'COMPLETED', entryInventory: 'SIGNED', depositReceived: true, insurance: true, paid: true } })
  assert.ok(rentalDone(done))
})

test('bail en préparation incomplet : reprendre le bail', () => {
  const t = { id: 't1', name: 'Lucas', essentialMissing: [], formSent: false, toReview: 0 }
  const step = rentalSteps({ ...base, tenant: t, lease: { id: 'l1', status: 'DRAFT', ready: false, checked: false, esign: 'NONE', entryInventory: 'NONE', depositCents: 0, depositReceived: false, insurance: false, paid: false, startDate: '2026-11-01' } })
  assert.equal(step.find((x) => x.key === 'LEASE')?.action?.to, '/espace/baux/l1/contrat')
  assert.equal(step.find((x) => x.key === 'CHECK')?.state, 'LOCKED')
  assert.ok(!step.some((x) => x.key === 'DEPOSIT'))
})
