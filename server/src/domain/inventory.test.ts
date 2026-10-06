import { test } from 'node:test'
import assert from 'node:assert/strict'
import { complementAllowed, complementWindow, inventoryDataSchema } from './inventory.js'

test('état des lieux d’entrée : complément dans les 10 jours, chauffage la première année (art. 3-2)', () => {
  const w = complementWindow('2026-10-06', '2026-10-06')
  assert.equal(w.generalUntil, '2026-10-16')
  assert.equal(w.heatingUntil, '2027-10-06')
  assert.equal(complementAllowed('2026-10-06', '2026-10-16', false), true)
  assert.equal(complementAllowed('2026-10-06', '2026-10-17', false), false)
  assert.equal(complementAllowed('2026-10-06', '2027-01-10', true), true)
  assert.equal(complementAllowed('2026-10-06', '2027-10-07', true), false)
  // Fin de mois et année bissextile
  assert.equal(complementWindow('2026-12-28', '2026-12-28').generalUntil, '2027-01-07')
  assert.equal(complementWindow('2028-02-29', '2028-02-29').generalUntil, '2028-03-10')
})

test('état des lieux : photos d’ensemble par pièce et compléments gardés', () => {
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e'
  const d = inventoryDataSchema.parse({
    rooms: [{ name: 'Séjour', items: [], photoIds: [id] }],
    complements: [{ id, at: '2026-10-08T10:00:00.000Z', heating: false, text: 'Rayure sur le parquet', photoIds: [], status: 'PENDING' }],
  })
  assert.deepEqual(d.rooms?.[0].photoIds, [id])
  assert.equal(d.complements?.[0].status, 'PENDING')
})
