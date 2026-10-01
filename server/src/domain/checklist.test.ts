import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SAMPLE_CONTRACT } from '../pdf/sample.js'
import { leaseMissing } from './checklist.js'
import { LINK_DAYS, linkExpiry } from './esign.js'

const keys = (c: typeof SAMPLE_CONTRACT) => leaseMissing(c).map((m) => m.key)

test('détecteur de fumée obligatoire : demandé tant qu’aucun n’est indiqué', () => {
  const none = { ...SAMPLE_CONTRACT, property: { ...SAMPLE_CONTRACT.property, equipments: ['kitchen' as const], smokeDetectors: undefined } }
  assert.ok(keys(none).includes('property.smoke'))
  const counted = { ...none, property: { ...none.property, smokeDetectors: 2 } }
  assert.ok(!keys(counted).includes('property.smoke'))
  const ticked = { ...none, property: { ...none.property, equipments: ['smokeDetector' as const] } }
  assert.ok(!keys(ticked).includes('property.smoke'))
})

test('chaque mention manquante indique la fiche et l’étape à compléter', () => {
  for (const m of leaseMissing({ ...SAMPLE_CONTRACT, terms: {} })) {
    assert.ok(m.label.length > 3)
    assert.ok(['LANDLORD', 'PROPERTY', 'TENANT', 'TERMS', 'GUARANTOR'].includes(m.where))
    assert.ok(m.section)
  }
})

test('lien de signature valable 14 jours', () => {
  const from = new Date('2026-10-01T10:00:00Z')
  assert.equal(LINK_DAYS, 14)
  assert.equal(linkExpiry(from).toISOString(), '2026-10-15T10:00:00.000Z')
})
