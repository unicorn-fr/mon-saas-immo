import { test } from 'node:test'
import assert from 'node:assert/strict'
import { feedbackLines, npsGroup, testerFeedbackSchema } from './testerFeedback.js'

test('NPS : promoteur, passif, détracteur', () => {
  assert.equal(npsGroup(10), 'Promoteur')
  assert.equal(npsGroup(9), 'Promoteur')
  assert.equal(npsGroup(8), 'Passif')
  assert.equal(npsGroup(6), 'Détracteur')
  assert.equal(npsGroup(0), 'Détracteur')
})

test('questionnaire testeur : réponses lues et remises dans l’ordre, le reste « pas de réponse »', () => {
  const f = testerFeedbackSchema.parse({ nps: 8, tried: ['LEASE', 'RENT'], ease: 'EASY', liked: ' La quittance ', price: 'UP_TO_10' })
  const lines = feedbackLines(f)
  assert.equal(lines[0], 'Recommandation : 8/10 (Passif)')
  assert.equal(lines[2], 'A essayé : Créer un bail, Loyers et quittances')
  assert.equal(lines[6], 'Ce qui a plu : La quittance')
  assert.equal(lines[4], 'Design : (pas de réponse)')
  assert.equal(lines[11], 'Prix acceptable : 5 à 10 € par mois')
  assert.throws(() => testerFeedbackSchema.parse({ nps: 11 }))
  assert.throws(() => testerFeedbackSchema.parse({ nps: 5, tried: ['HACK'] }))
})
