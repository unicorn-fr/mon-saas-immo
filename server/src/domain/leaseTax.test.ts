import assert from 'node:assert/strict'
import { test } from 'node:test'
import { leaseTaxItems, leaseTaxMode, type LeaseTaxInput } from './leaseTax.js'

const base: LeaseTaxInput = { mode: 'ARRIVAL', date: '2026-10-06', furnished: false, firstFurnished: true, company: false, address: '14 quai de Bosc, 34200 Sète', fiscalId: '341234567890', tenants: ['Lucas Garnier'], done: {} }

test('arrivée en location vide : la déclaration d’occupation, valeurs prêtes à copier', () => {
  const items = leaseTaxItems(base)
  assert.deepEqual(items.map((i) => i.id), ['occupancy'])
  assert.deepEqual(items[0].copy.map((c) => c.value), ['14 quai de Bosc, 34200 Sète', '341234567890', 'Lucas Garnier', '06/10/2026'])
  assert.match(items[0].deadline, /30 juin 2027/)
})

test('première location meublée : début d’activité dans les 15 jours, puis CFE avant le 31 décembre', () => {
  const items = leaseTaxItems({ ...base, furnished: true, done: { inpi: '2026-10-10' } })
  assert.deepEqual(items.map((i) => i.id), ['occupancy', 'inpi', 'cfe'])
  assert.match(items[1].deadline, /21 octobre 2026/)
  assert.equal(items[1].doneAt, '2026-10-10')
  assert.match(items[2].deadline, /31 décembre 2026/)
  // Déjà loueur en meublé, ou logement d'une société : pas de nouvelle immatriculation.
  assert.deepEqual(leaseTaxItems({ ...base, furnished: true, firstFurnished: false }).map((i) => i.id), ['occupancy'])
  assert.deepEqual(leaseTaxItems({ ...base, furnished: true, company: true }).map((i) => i.id), ['occupancy'])
})

test('départ : signaler la fin de l’occupation', () => {
  const [o] = leaseTaxItems({ ...base, mode: 'DEPARTURE', date: '2026-09-30' })
  assert.match(o.title, /départ/)
  assert.equal(o.copy.at(-1)!.value, '30/09/2026')
})

test('quand le proposer : arrivée récente, départ passé, jamais pour un garage', () => {
  assert.equal(leaseTaxMode({ status: 'ACTIVE', startDate: '2026-10-06', endDate: '2029-10-05', housing: true }, '2026-10-26'), 'ARRIVAL')
  assert.equal(leaseTaxMode({ status: 'ACTIVE', startDate: '2026-11-15', endDate: '2029-11-14', housing: true }, '2026-10-26'), 'ARRIVAL')
  assert.equal(leaseTaxMode({ status: 'ACTIVE', startDate: '2024-01-01', endDate: '2027-01-01', housing: true }, '2026-10-26'), null)
  assert.equal(leaseTaxMode({ status: 'ENDED', startDate: '2023-01-01', endDate: '2026-09-30', housing: true }, '2026-10-26'), 'DEPARTURE')
  assert.equal(leaseTaxMode({ status: 'ACTIVE', startDate: '2026-10-06', endDate: '2027-10-05', housing: false }, '2026-10-26'), null)
})
