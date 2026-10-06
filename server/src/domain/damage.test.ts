import { test } from 'node:test'
import assert from 'node:assert/strict'
import { damageDeductions, damageLines, lineMissing, retained } from './damage.js'
import { itemKey } from './inventoryCompare.js'

const entry = { rooms: [{ name: 'Séjour', items: [{ label: 'Sol', state: 'Bon' as const }, { label: 'Murs', state: 'Bon' as const }, { label: 'Porte', state: 'Bon' as const }] }] }
const exit = { rooms: [{ name: 'Séjour', items: [{ label: 'Sol', state: 'Mauvais' as const, note: 'Brûlure', photoIds: ['a'] }, { label: 'Murs', state: 'Usé' as const }, { label: 'Porte', state: 'Bon' as const }] }] }

test('dégradations : seuls les éléments plus abîmés qu’à l’entrée, décisions reprises', () => {
  const lines = damageLines(entry, exit, [{ key: itemKey('Séjour', 'Sol'), decision: 'DAMAGE', costCents: 40000, wearPct: 25, justification: 'Devis n° 12 du 2 octobre', comment: 'Brûlure de cigarette' }])
  assert.deepEqual(lines.map((l) => l.label), ['Sol', 'Murs'])
  assert.equal(lines[0].retainedCents, 30000)
  assert.equal(lines[0].exitNote, 'Brûlure')
  assert.equal(lines[1].decision, null)
  assert.equal(lines[1].retainedCents, 0)
})

test('dégradations : retenue justifiée, usure déduite, usure normale jamais retenue (art. 7 et 22)', () => {
  assert.equal(retained(10000, null), 10000)
  assert.equal(retained(10001, 50), 5001)
  assert.equal(retained(10000, 100), 0)
  assert.match(lineMissing({ decision: null, costCents: null, justification: null })!, /usure normale ou d’une dégradation/)
  assert.match(lineMissing({ decision: 'DAMAGE', costCents: 5000, justification: ' ' })!, /justificatif/)
  assert.equal(lineMissing({ decision: 'WEAR', costCents: null, justification: null }), null)
  const lines = damageLines(entry, exit, [
    { key: itemKey('Séjour', 'Sol'), decision: 'DAMAGE', costCents: 40000, wearPct: 25, justification: 'Devis n° 12' },
    { key: itemKey('Séjour', 'Murs'), decision: 'WEAR', costCents: 9000 },
  ])
  assert.deepEqual(damageDeductions(lines), [{ label: 'Séjour, sol (coût 400,00 €, usure 25 % déduite)', justification: 'Devis n° 12', amountCents: 30000 }])
})
