import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dunningDates, dunningSettings, dunningStep, validDays, type DunningState } from './dunning.js'

const s = (over: Partial<DunningState>): DunningState => ({ today: '2026-11-07', dueDate: '2026-11-04', days: [3, 8, 15], sent: {}, ...over })

test('relances : J+3 relance amiable, J+8 second rappel, J+15 mise en demeure', () => {
  assert.deepEqual(dunningDates('2026-11-04', [3, 8, 15]), ['2026-11-07', '2026-11-12', '2026-11-19'])
  assert.equal(dunningStep(s({ today: '2026-11-06' })), null, 'trop tôt')
  assert.equal(dunningStep(s({})), 1)
  assert.equal(dunningStep(s({ today: '2026-11-08', sent: { 1: '2026-11-07' } })), null, 'déjà envoyée')
  assert.equal(dunningStep(s({ today: '2026-11-12', sent: { 1: '2026-11-07' } })), 2)
  assert.equal(dunningStep(s({ today: '2026-11-19', sent: { 1: '2026-11-07', 2: '2026-11-12' } })), 3)
  assert.equal(dunningStep(s({ today: '2026-11-25', sent: { 1: '2026-11-07', 2: '2026-11-12', 3: '2026-11-19' } })), null, 'suite terminée')
  assert.equal(dunningStep(s({ dueDate: null })), null, 'rien de dû')
})

test('relances : jamais de mise en demeure d’un coup, écart respecté, pas de rattrapage', () => {
  assert.equal(dunningStep(s({ today: '2026-11-20' })), null, 'activée après le jour du second rappel : rien ce mois-ci')
  assert.equal(dunningStep(s({ today: '2026-11-10' })), 1, 'activée tard mais avant le second rappel : la relance amiable part')
  assert.equal(dunningStep(s({ today: '2026-11-12', sent: { 1: '2026-11-10' } })), null, 'cinq jours d’écart au moins')
  assert.equal(dunningStep(s({ today: '2026-11-15', sent: { 1: '2026-11-10' } })), 2)
  assert.equal(dunningStep(s({ today: '2026-11-18', sent: { 1: '2026-11-07' } })), null, 'second rappel manqué de plus de 5 jours')
})

test('relances : réglages du propriétaire, coupées par défaut', () => {
  assert.deepEqual(dunningSettings(null), { enabled: false, days: [3, 8, 15] })
  assert.deepEqual(dunningSettings({ dunning: { enabled: true, days: [5, 10, 20] } }), { enabled: true, days: [5, 10, 20] })
  assert.equal(validDays([8, 3, 15]), null, 'jours croissants')
  assert.equal(validDays([0, 3, 15]), null)
  assert.equal(validDays([3, 8, 61]), null)
  assert.equal(dunningStep(s({ days: [5, 10, 20], today: '2026-11-09' })), 1)
})
