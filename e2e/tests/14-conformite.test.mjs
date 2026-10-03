import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, newAccount } from '../lib.mjs'

/** Conformité : ce que la loi interdit, Bailio le refuse. */
const PROPERTY = { label: 'T2 Agde', address: '2 rue Jean Roger, 34300 Agde', postalCode: '34300', city: 'Agde', habitat: 'COLLECTIVE', legalRegime: 'MONO', furnished: false, constructionPeriod: '1975_1989', surface: 40, rooms: 2, heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' }, equipments: ['kitchen', 'smokeDetector'], smokeDetectors: 1, tv: 'COLLECTIVE', internet: 'FIBER' }

test('logement classé G : aucun bail ne peut être créé', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: { ...PROPERTY, diagnostics: { dpe: { class: 'G', ges: 'G' } } } })
  const t = await api('/tenants', { method: 'POST', token, body: { propertyId: p.id, firstNames: 'Paul', lastName: 'Martin', guarantee: 'NONE' } })
  await assert.rejects(api('/leases', { method: 'POST', token, body: { propertyId: p.id, tenantIds: [t.id], terms: { kind: 'VIDE', startDate: '2026-11-01' } } }), /409 Logement classé G/)
  const view = await api(`/properties/${p.id}`, { token })
  const step = view.journey.find((s) => s.key === 'LEASE')
  assert.equal(step.state, 'LOCKED')
  assert.match(step.text, /ne peut plus être loué/)
})
