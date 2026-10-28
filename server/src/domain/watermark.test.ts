import assert from 'node:assert/strict'
import { test } from 'node:test'
import { watermarkText } from './watermark.js'
import { docsLocked } from './candidates.js'

test('filigrane : la ville et la date, jamais l’adresse', () => {
  assert.equal(watermarkText({ city: ' Sète ', date: new Date(2026, 9, 27) }), 'Uniquement pour louer un logement à Sète · 27/10/2026 · Bailio')
  assert.equal(watermarkText({ city: null, date: new Date(2026, 0, 5) }), 'Uniquement pour louer un logement · 05/01/2026 · Bailio')
})

test('pièces d’un candidat cachées jusqu’à la visite', () => {
  assert.equal(docsLocked({ followHashes: ['x'] }), true)
  assert.equal(docsLocked({ followHashes: ['x'], visitConfirmedAt: '2026-10-27T10:00:00Z' }), false)
  // Candidatures reçues avant le suivi : visibles comme avant.
  assert.equal(docsLocked({}), false)
})
