import assert from 'node:assert/strict'
import { test } from 'node:test'
import { READ_AND_APPROVED, maskEmail, mentionMatches } from './esign.js'

test('« Lu et approuvé » : accents, majuscules et ponctuation indifférents', () => {
  assert.equal(mentionMatches(READ_AND_APPROVED, 'lu et approuve'), true)
  assert.equal(mentionMatches(READ_AND_APPROVED, 'Lu et approuvé.'), true)
  assert.equal(mentionMatches(READ_AND_APPROVED, 'ok'), false)
  assert.equal(mentionMatches(READ_AND_APPROVED, ''), false)
})

test('mention de la caution (art. 2297) : montant exact obligatoire, fautes de frappe tolérées', () => {
  const m = 'Je m’engage, en qualité de caution solidaire, à payer à Claire Dubois ce que lui doit Sophie Leroy en cas de défaillance de celui-ci, dans la limite de la somme de trente-neuf mille euros (39 000,00 €) couvrant le paiement du principal et des accessoires, pour une durée déterminée, jusqu’au 30 septembre 2032.'
  assert.equal(mentionMatches(m, m), true)
  assert.equal(mentionMatches(m, m.replace('défaillance', 'defaillence')), true)
  assert.equal(mentionMatches(m, m.replace('39 000,00', '3 900,00')), false)
  assert.equal(mentionMatches(m, 'Je m’engage en qualité de caution.'), false)
})

test('adresse masquée', () => {
  assert.equal(maskEmail('sophie.leroy@email.fr'), 's••••••@email.fr')
})
