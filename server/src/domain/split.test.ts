import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allocate, splitExpense } from './split.js'

test('répartition : la somme des parts vaut toujours le total (plus fort reste)', () => {
  assert.deepEqual(allocate(10000, [1, 1, 1]), [3334, 3333, 3333])
  assert.deepEqual(allocate(100, [45, 30, 25]), [45, 30, 25])
  assert.deepEqual(allocate(1001, [2, 1]), [667, 334])
  for (const total of [1, 7, 99, 123457]) assert.equal(allocate(total, [37.5, 12.2, 50.3]).reduce((a, x) => a + x, 0), total)
  assert.throws(() => allocate(100, [0, 0]))
})

test('répartition d’une dépense d’immeuble : surface, tantièmes, parts égales ; part récupérable répartie pareil', () => {
  const units = [
    { propertyId: 'a', name: 'T2', surface: 45, tantiemes: 300 },
    { propertyId: 'b', name: 'Studio', surface: 25, tantiemes: 200 },
    { propertyId: 'c', name: 'T3', surface: 50, tantiemes: 500 },
  ]
  const s = splitExpense({ amountCents: 120000, recoverableCents: 60000, key: 'SURFACE', units })
  assert.deepEqual(s.map((x) => [x.amountCents, x.recoverableCents]), [[45000, 22500], [25000, 12500], [50000, 25000]])
  assert.equal(s[0].basis, '45 m² sur 120 m²')
  assert.match(splitExpense({ amountCents: 120000, recoverableCents: 0, key: 'TANTIEMES', units })[2].basis, /^500 \/ 1\s000 tantièmes$/)
  assert.deepEqual(splitExpense({ amountCents: 100, recoverableCents: 100, key: 'EQUAL', units }).map((x) => x.amountCents), [34, 33, 33])
  assert.throws(() => splitExpense({ amountCents: 100, recoverableCents: 0, key: 'SURFACE', units: [{ ...units[0], surface: null }, units[1]] }), /surface de « T2 »/)
  assert.throws(() => splitExpense({ amountCents: 100, recoverableCents: 200, key: 'EQUAL', units }), /récupérable/)
  assert.throws(() => splitExpense({ amountCents: 100, recoverableCents: 0, key: 'EQUAL', units: [units[0]] }), /deux logements/)
})
