import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agenda, monthTiles, type TileLease } from './todayBoard.js'

const base: TileLease = { status: 'ACTIVE', dueCents: 80000, paidCents: 0, statusKey: 'EXPECTED', unpaidCents: 0, depositCents: 70000, depositReceived: false, running: true }

test('chiffres du mois : attendu, reçu, retard et dépôts à noter', () => {
  const t = monthTiles([
    { ...base, paidCents: 80000, statusKey: 'PAID' },
    { ...base, statusKey: 'LATE', unpaidCents: 160000, depositReceived: true },
    { ...base, running: false, status: 'ACTIVE', dueCents: 50000 },
  ])
  assert.equal(t.expectedCents, 160000)
  assert.equal(t.receivedCents, 80000)
  assert.equal(t.lateCents, 160000)
  assert.equal(t.lateCount, 1)
  assert.equal(t.depositCount, 2)
  assert.equal(t.depositCents, 140000)
})

test('un bail en préparation ou importé ne compte pas dans les dépôts à noter', () => {
  const t = monthTiles([{ ...base, status: 'DRAFT', running: false }, { ...base, status: 'IMPORTED' }])
  assert.equal(t.depositCount, 0)
})

test('agenda : du plus proche au plus lointain, passé et doublons écartés', () => {
  const rows = agenda([{ iso: '2026-12-15', label: 'CFE' }, { iso: '2026-11-02', label: 'Passé' }, { iso: '2026-11-12', label: 'Plombier' }, { iso: '2026-11-12', label: 'Plombier' }], '2026-11-10')
  assert.deepEqual(rows.map((r) => r.label), ['Plombier', 'CFE'])
  assert.equal(agenda(rows, '2026-11-10', 1).length, 1)
})
