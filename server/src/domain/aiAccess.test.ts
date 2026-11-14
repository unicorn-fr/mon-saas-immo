import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AI_TOOLS, aiPathDenied, sanitizeForAi } from './aiAccess.js'

test('IA connectée : lecture seule, sur les adresses prévues seulement', () => {
  assert.equal(aiPathDenied('GET', '/today'), null)
  assert.equal(aiPathDenied('GET', '/properties/abc-123/ledger'), null)
  assert.ok(aiPathDenied('POST', '/today'))
  assert.ok(aiPathDenied('PUT', '/properties/abc'))
  assert.ok(aiPathDenied('DELETE', '/tenants/abc'))
  for (const p of ['/account', '/account/export', '/access', '/files/x', '/leases/x/lease.pdf', '/money/export', '/tenants/x/emails', '/admin/metrics', '/profile', '/documents'])
    assert.ok(aiPathDenied('GET', p), p)
})

test('IA connectée : codes de liens, signatures, logos et IBAN retirés', () => {
  const out = sanitizeForAi({ name: 'A', tenantCode: 'x', formCode: 'y', keyHash: 'z', iban: 'FR76', profile: { signature: 'data:image/png;base64,AA', logo: 'data:x' }, list: [{ photo: 'data:image/jpeg;base64,BB', ok: 1 }] })
  assert.deepEqual(out, { name: 'A', profile: {}, list: [{ photo: '[image retirée]', ok: 1 }] })
})

test('IA connectée : chaque outil vise une adresse permise', () => {
  for (const t of AI_TOOLS) {
    const path = t.path({ id: 'abc-123', annee: 2025 }).split('?')[0]
    assert.equal(aiPathDenied('GET', path), null, t.name)
  }
  assert.throws(() => AI_TOOLS.find((t) => t.name === 'bien')!.path({ id: '../account' }))
})
