import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSelfPath, routeDenied, scopeQuery, type Scope } from './access.js'

const s: Scope = { ownerId: 'owner', role: 'ASSOCIATE', propertyIds: ['p1'], leaseIds: ['l1'], tenantIds: ['t1'], structureIds: ['s1'] }

test('accès : adresses permises selon le rôle (refus par défaut)', () => {
  // Associé : tout sauf supprimer, créer un logement, toucher au compte et aux structures
  assert.equal(routeDenied('ASSOCIATE', 'GET', '/properties'), null)
  assert.equal(routeDenied('ASSOCIATE', 'PUT', '/leases/l1/terms'), null)
  assert.equal(routeDenied('ASSOCIATE', 'POST', '/leases/l1/payments'), null)
  assert.match(routeDenied('ASSOCIATE', 'DELETE', '/expenses/e1') ?? '', /supprimer/)
  assert.ok(routeDenied('ASSOCIATE', 'POST', '/properties'))
  assert.ok(routeDenied('ASSOCIATE', 'PUT', '/properties/p1/structure'))
  assert.equal(routeDenied('ASSOCIATE', 'PUT', '/properties/p1'), null)
  assert.ok(routeDenied('ASSOCIATE', 'POST', '/structures'))
  assert.ok(routeDenied('ASSOCIATE', 'PUT', '/profile'))
  assert.ok(routeDenied('ASSOCIATE', 'GET', '/trash'))
  // Comptable : lecture seule
  assert.equal(routeDenied('ACCOUNTANT', 'GET', '/money/tax'), null)
  assert.match(routeDenied('ACCOUNTANT', 'POST', '/expenses') ?? '', /lecture seule/)
  assert.ok(routeDenied('ACCOUNTANT', 'PUT', '/properties/p1'))
  // Intervenant : sa seule fiche
  assert.equal(routeDenied('CONTRACTOR', 'GET', '/shared/view'), null)
  assert.ok(routeDenied('CONTRACTOR', 'GET', '/properties'))
  assert.ok(routeDenied('CONTRACTOR', 'GET', '/leases/l1'))
  // Adresses de la personne elle-même : l'espace partagé n'y entre jamais
  assert.ok(isSelfPath('/auth/me') && isSelfPath('/account/export') && isSelfPath('/access') && !isSelfPath('/properties'))
})

test('accès : chaque table filtrée sur les logements partagés', () => {
  assert.deepEqual(scopeQuery('Property', 'findMany', {}, s), { kind: 'FILTER', where: { id: { in: ['p1'] } } })
  assert.deepEqual(scopeQuery('Lease', 'findFirst', {}, s), { kind: 'FILTER', where: { propertyId: { in: ['p1'] } } })
  assert.deepEqual(scopeQuery('Payment', 'count', {}, s), { kind: 'FILTER', where: { leaseId: { in: ['l1'] } } })
  assert.deepEqual(scopeQuery('Tenant', 'findMany', {}, s), { kind: 'FILTER', where: { OR: [{ propertyId: { in: ['p1'] } }, { id: { in: ['t1'] } }] } })
  assert.equal(scopeQuery('Document', 'update', {}, s).kind, 'FILTER')
  assert.deepEqual(scopeQuery('User', 'findUnique', {}, s), { kind: 'FILTER', where: { id: 'owner' } })
  // Jamais : corbeille, accès, sessions, écriture sur le compte du propriétaire
  for (const m of ['TrashItem', 'Access', 'Session', 'ActionCode', 'Draft', 'LoginToken']) assert.equal(scopeQuery(m, 'findMany', {}, s).kind, 'DENY', m)
  assert.equal(scopeQuery('User', 'update', {}, s).kind, 'DENY')
  // Intervenant : ni carnet ni fichiers
  assert.equal(scopeQuery('Contact', 'findMany', {}, { ...s, role: 'CONTRACTOR' }).kind, 'DENY')
  assert.equal(scopeQuery('FileBlob', 'findUnique', {}, { ...s, role: 'CONTRACTOR' }).kind, 'DENY')
  assert.equal(scopeQuery('Contact', 'findMany', {}, s).kind, 'ALLOW')
})

test('accès : créations limitées aux logements, baux et locataires partagés', () => {
  assert.deepEqual(scopeQuery('Expense', 'create', { data: { propertyId: 'p1' } }, s), { kind: 'CHECK', ok: true })
  assert.deepEqual(scopeQuery('Expense', 'create', { data: { propertyId: 'p2' } }, s), { kind: 'CHECK', ok: false })
  assert.deepEqual(scopeQuery('Expense', 'create', { data: { propertyId: null } }, s), { kind: 'CHECK', ok: false })
  assert.deepEqual(scopeQuery('Lease', 'create', { data: { property: { connect: { id: 'p1' } } } }, s), { kind: 'CHECK', ok: true })
  assert.deepEqual(scopeQuery('Document', 'create', { data: { leaseId: 'l1' } }, s), { kind: 'CHECK', ok: true })
  assert.deepEqual(scopeQuery('Payment', 'createMany', { data: [{ leaseId: 'l1' }, { leaseId: 'l9' }] }, s), { kind: 'CHECK', ok: false })
  assert.deepEqual(scopeQuery('Property', 'create', { data: {} }, s), { kind: 'CHECK', ok: false })
  assert.deepEqual(scopeQuery('Structure', 'create', { data: {} }, s), { kind: 'CHECK', ok: false })
  assert.deepEqual(scopeQuery('Payment', 'upsert', { create: { leaseId: 'l1' } }, s), { kind: 'UPSERT', where: { leaseId: { in: ['l1'] } }, ok: true })
  assert.deepEqual(scopeQuery('Payment', 'upsert', { create: { leaseId: 'l2' } }, s), { kind: 'UPSERT', where: { leaseId: { in: ['l1'] } }, ok: false })
})
