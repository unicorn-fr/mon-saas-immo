import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tenantFileSchema } from './contract.js'
import { minimizeTenantFile, monthsAgo, staleWithoutLease } from './retention.js'

const F1 = '11111111-1111-4111-8111-111111111111'
const F2 = '22222222-2222-4222-8222-222222222222'
const file = tenantFileSchema.parse({
  civility: 'MONSIEUR',
  firstNames: 'Lucas',
  lastName: 'Garnier',
  email: 'lucas@example.fr',
  birthDate: '2004-05-12',
  birthPlace: 'Arles',
  phone: '0600000000',
  situation: 'STUDENT',
  monthlyIncomeCents: 120000,
  documents: [{ category: 'identity', label: 'Carte d’identité', received: true, fileId: F1 }],
  guarantor: { firstNames: 'Hervé', lastName: 'Garnier', email: 'herve@example.fr', address: '6 rue des Lavandes', documents: [{ category: 'income', received: true, fileId: F2 }] },
})

test('dossier réduit : nom et email gardés, justificatifs et informations inutiles effacés', () => {
  const { file: f, fileIds } = minimizeTenantFile(file, 'Effacé')
  assert.deepEqual(fileIds, [F1, F2])
  assert.equal(f.lastName, 'Garnier')
  assert.equal(f.email, 'lucas@example.fr')
  assert.equal(f.birthDate ?? null, null)
  assert.equal(f.phone ?? null, null)
  assert.equal(f.monthlyIncomeCents ?? null, null)
  assert.equal(f.documents?.[0].fileId ?? null, null)
  assert.equal(f.guarantor?.lastName, 'Garnier')
  assert.equal(f.guarantor?.email ?? null, null)
  assert.equal(f.guarantor?.documents?.[0].fileId ?? null, null)
})

test('dossier sans bail : réduit 3 mois après sa dernière modification (référentiel CNIL)', () => {
  const now = new Date('2026-10-03T08:00:00Z')
  assert.equal(monthsAgo(3, now).toISOString().slice(0, 10), '2026-07-03')
  assert.equal(staleWithoutLease({ updatedAt: new Date('2026-07-02'), hasLease: false, purged: false }, now), true)
  assert.equal(staleWithoutLease({ updatedAt: new Date('2026-07-04'), hasLease: false, purged: false }, now), false)
  assert.equal(staleWithoutLease({ updatedAt: new Date('2026-01-01'), hasLease: true, purged: false }, now), false)
  assert.equal(staleWithoutLease({ updatedAt: new Date('2026-01-01'), hasLease: false, purged: true }, now), false)
})

test('justificatifs : gardés pendant le bail, prévenance 7 jours avant, effacés 30 jours après la fin', async () => {
  const { docsAction, docsPurgeDate, clearTenantDocs } = await import('./retention.js')
  const end = new Date('2026-09-01T00:00:00Z')
  assert.equal(docsPurgeDate(end).toISOString().slice(0, 10), '2026-10-01')
  const base = { lastEnd: end, stillTenant: false, hasFiles: true, warned: false, purged: false }
  assert.equal(docsAction(base, new Date('2026-09-20T08:00:00Z')), null)
  assert.equal(docsAction(base, new Date('2026-09-24T08:00:00Z')), 'WARN')
  assert.equal(docsAction({ ...base, warned: true }, new Date('2026-09-24T08:00:00Z')), null)
  assert.equal(docsAction({ ...base, warned: true }, new Date('2026-10-01T08:00:00Z')), 'PURGE')
  assert.equal(docsAction(base, new Date('2026-10-01T08:00:00Z')), 'PURGE', 'même sans prévenance réussie, rien n’est gardé au-delà')
  assert.equal(docsAction({ ...base, stillTenant: true }, new Date('2027-01-01')), null, 'bail renouvelé ou nouveau bail : on garde')
  assert.equal(docsAction({ ...base, hasFiles: false }, new Date('2027-01-01')), null)
  assert.equal(docsAction({ ...base, purged: true }, new Date('2027-01-01')), null)
  const { file: f, fileIds } = clearTenantDocs(file, 'Effacé')
  assert.deepEqual(fileIds, [F1, F2])
  assert.equal(f.documents?.[0].fileId ?? null, null)
  assert.equal(f.birthDate, '2004-05-12', 'les informations suivent la règle des 3 ans')
  assert.equal(f.guarantor?.email, 'herve@example.fr')
})
