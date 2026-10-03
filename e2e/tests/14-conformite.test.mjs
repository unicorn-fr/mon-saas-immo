import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, completeLease, newAccount } from '../lib.mjs'

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

test('zone tendue : un loyer plus élevé que celui du locataire précédent bloque la signature, sauf motif', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { previous: { rentedWithin18Months: true, lastRentCents: 50000, lastPaymentDate: '2026-08-04', lastRevisionDate: '2026-01-01' } } })
  const view = await api(`/leases/${leaseId}`, { token })
  assert.deepEqual(view.computed.rentIssues.map((i) => i.code), ['RELET_TENSE'])
  await assert.rejects(api(`/leases/${leaseId}/sign`, { method: 'POST', token }), /400 Zone tendue/)
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { previous: { rentedWithin18Months: true, lastRentCents: 50000, lastPaymentDate: '2026-08-04', lastRevisionDate: '2025-01-01', increaseReason: 'Révision de 2026 non appliquée au précédent locataire' } } })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
})

test('encadrement : loyer au-dessus du loyer de référence majoré refusé', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  // 37 m² × 12 € = 444 € de loyer de base au plus ; le loyer est de 510 €
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { zone: { tense: true, control: true, refRentCentsM2: 1000, refRentMaxCentsM2: 1200 } } })
  const view = await api(`/leases/${leaseId}`, { token })
  assert.deepEqual(view.computed.rentIssues.map((i) => i.code), ['CEILING'])
  await assert.rejects(api(`/leases/${leaseId}/sign`, { method: 'POST', token }), /loyer de référence majoré/)
})
