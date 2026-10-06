import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changeOf, compareWithEntry, itemKey, meterComparison, worseItems } from './inventoryCompare.js'

test('sortie comparée à l’entrée : évolution de chaque élément (décret 2016-382, art. 3)', () => {
  assert.equal(changeOf('Bon', 'Usé'), 'WORSE')
  assert.equal(changeOf('Usé', 'Bon'), 'BETTER')
  assert.equal(changeOf('Bon', 'Bon'), 'SAME')
  assert.equal(changeOf(null, 'Bon'), 'UNKNOWN')
  assert.equal(changeOf('Bon', 'Bon', false), 'NEW')

  const entry = {
    rooms: [{ name: 'Séjour', items: [{ label: 'Sol', state: 'Bon' as const, note: 'Parquet ciré', photoIds: ['p1'] }, { label: 'Murs', state: 'Neuf' as const }] }],
    meters: [{ key: 'elec', label: 'Électricité', index: '12 000' }],
  }
  // Noms rapprochés sans tenir compte des accents ni des majuscules
  const exit = {
    rooms: [{ name: 'sejour', items: [{ label: 'SOL', state: 'Mauvais' as const, note: 'Rayures profondes' }, { label: 'Murs', state: 'Neuf' as const }, { label: 'Store', state: 'Bon' as const }] }],
    meters: [{ key: 'elec', label: 'Électricité', index: '15 250,5' }],
  }
  const cmp = compareWithEntry(entry, exit)
  assert.deepEqual(cmp[itemKey('sejour', 'SOL')], { entryState: 'Bon', entryNote: 'Parquet ciré', entryPhotoIds: ['p1'], change: 'WORSE' })
  assert.equal(cmp[itemKey('Séjour', 'Murs')].change, 'SAME')
  assert.equal(cmp[itemKey('Séjour', 'Store')].change, 'NEW')
  assert.deepEqual(worseItems(entry, exit), [{ room: 'sejour', label: 'SOL', entryState: 'Bon', exitState: 'Mauvais', note: 'Rayures profondes', photoIds: [] }])
  assert.deepEqual(meterComparison(entry, exit).elec, { entryIndex: '12 000', consumption: 3250.5 })
  // Sans état des lieux d'entrée : rien n'est comparé
  assert.equal(compareWithEntry(null, exit)[itemKey('Séjour', 'Murs')].change, 'UNKNOWN')
})
