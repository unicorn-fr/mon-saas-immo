import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mailError } from './mailError.js'

test('adresse refusée : message qui nomme l’adresse et dit quoi faire', () => {
  const e = mailError({ code: 'EENVELOPE', responseCode: 550, response: '550 5.1.1 User unknown' }, 'luc@exemple.fr')
  assert.equal(e.status, 422)
  assert.match(e.message, /luc@exemple\.fr est refusée/)
  assert.match(mailError({ responseCode: 550, response: '550 5.1.2 Recipient domain not found' }, 'a@b.fr').message, /Corrigez-la dans la fiche/)
})

test('pièce jointe trop lourde', () => {
  assert.match(mailError({ responseCode: 552, response: '552 Message size exceeds' }, 'a@b.fr').message, /trop lourde/)
})

test('service injoignable : réessayer plus tard', () => {
  const e = mailError({ code: 'ETIMEDOUT' }, 'a@b.fr')
  assert.equal(e.status, 503)
  assert.match(e.message, /Réessayez dans quelques minutes/)
})

test('refus de l’expéditeur : jamais reproché à l’adresse du locataire', () => {
  const e = mailError({ responseCode: 553, response: '553 5.7.1 Sender address rejected: not owned by user' }, 'luc@exemple.fr')
  assert.equal(e.status, 503)
  assert.doesNotMatch(e.message, /luc@exemple/)
})
