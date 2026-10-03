import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyReview, pendingReview, tenantLeaseMissing, tenantMissing } from './tenantFile.js'

const keys = (t: Parameters<typeof tenantMissing>[0]) => tenantMissing(t).map((m) => m.key)

test('dossier du locataire : identité, coordonnées, situation et les 5 pièces autorisées', () => {
  const k = keys({ firstNames: 'Lucas', lastName: 'Garnier' })
  for (const x of ['civility', 'birthDate', 'birthPlace', 'email', 'phone', 'currentAddress', 'situation', 'doc.identity', 'doc.home', 'doc.activity', 'doc.taxNotice', 'doc.income']) assert.ok(k.includes(x), x)
  assert.ok(!k.includes('name'))
  assert.ok(!k.some((x) => x.startsWith('guarantor')))
})

test('caution : identité, naissance, adresse, contact et pièces du garant', () => {
  const k = keys({ guarantee: 'CAUTION', guarantor: { firstNames: 'Hervé', lastName: 'Garnier', email: 'h@example.fr' } })
  assert.ok(k.includes('guarantor.birth') && k.includes('guarantor.address') && k.includes('guarantor.doc.taxNotice'))
  assert.ok(!k.includes('guarantor.contact') && !k.includes('guarantor.name'))
})

test('dossier complet : rien ne manque', () => {
  const docs = (['identity', 'home', 'activity', 'taxNotice', 'income'] as const).map((category) => ({ category, received: true }))
  const full = { civility: 'MONSIEUR' as const, firstNames: 'Lucas', lastName: 'Garnier', birthDate: '2004-05-12', birthPlace: 'Arles', email: 'l@example.fr', phone: '0600000000', currentAddress: '3 rue Haute, Arles', situation: 'STUDENT' as const, documents: docs, guarantee: 'NONE' as const }
  assert.deepEqual(keys(full), [])
})

test('avant le bail : naissance du locataire, acte de caution (montant et durée fixés par le propriétaire)', () => {
  const m = tenantLeaseMissing({ firstNames: 'Inès', lastName: 'Roche', guarantee: 'CAUTION', guarantor: { firstNames: 'Marc', lastName: 'Roche' } })
  const k = m.map((x) => x.key)
  assert.ok(k.includes('birthDate') && k.includes('guarantor.address') && k.includes('guarantor.max') && k.includes('guarantor.duration'))
  assert.equal(m.find((x) => x.key === 'guarantor.max')?.ask, false)
  assert.equal(m.find((x) => x.key === 'birthDate')?.level, 'RECOMMENDED')
  assert.equal(m.find((x) => x.key === 'guarantor.max')?.level, 'ESSENTIAL')
  assert.ok(!k.some((x) => x.startsWith('doc.')))
})

test('vérification : ce que le locataire envoie est à vérifier ; refusé, il redevient à fournir', () => {
  const t = { firstNames: 'Inès', lastName: 'Roche', birthPlace: 'Montpellier', review: ['birthPlace'], documents: [{ category: 'identity' as const, received: true, fileId: '00000000-0000-4000-8000-000000000001', source: 'TENANT' as const }] }
  assert.deepEqual(pendingReview(t).map((r) => r.key), ['birthPlace', 'doc.identity'])
  const ok = applyReview(t, 'doc.identity', true, '2026-10-03T10:00:00.000Z')
  assert.equal(ok.documents?.[0].verifiedAt, '2026-10-03T10:00:00.000Z')
  assert.deepEqual(pendingReview(ok).map((r) => r.key), ['birthPlace'])
  const refused = applyReview(ok, 'birthPlace', false, 'x')
  assert.equal(refused.birthPlace, null)
  assert.ok(tenantMissing(refused).some((m) => m.key === 'birthPlace'))
  const docRefused = applyReview(t, 'doc.identity', false, 'x')
  assert.ok(tenantMissing(docRefused).some((m) => m.key === 'doc.identity'))
})
