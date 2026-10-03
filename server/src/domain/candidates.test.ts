import assert from 'node:assert/strict'
import { test } from 'node:test'
import { candidateSchema, rentShare, tenantFromCandidate } from './candidates.js'

const ok = { firstNames: 'Léa', lastName: 'Martin', email: 'lea@example.fr', situation: 'EMPLOYEE', monthlyIncomeCents: 240000, guarantee: 'CAUTION', guarantor: { firstNames: 'Marc', lastName: 'Martin', email: '' }, consent: true }

test('candidature : accord obligatoire, lien DossierFacile seulement', () => {
  assert.ok(candidateSchema.safeParse(ok).success)
  assert.ok(!candidateSchema.safeParse({ ...ok, consent: false }).success)
  assert.ok(candidateSchema.safeParse({ ...ok, dossierFacileUrl: 'https://locataire.dossierfacile.logement.gouv.fr/file/abc' }).success)
  assert.ok(!candidateSchema.safeParse({ ...ok, dossierFacileUrl: 'https://exemple.com/dossier' }).success)
})

test('candidat choisi : fiche locataire pré-remplie avec son garant', () => {
  const t = tenantFromCandidate(candidateSchema.parse(ok))
  assert.equal(t.lastName, 'Martin')
  assert.equal(t.situation, 'EMPLOYEE')
  assert.deepEqual(t.guarantor, { firstNames: 'Marc', lastName: 'Martin', email: null, documents: [] })
  assert.equal(t.monthlyIncomeCents, ok.monthlyIncomeCents)
  // Pièces déposées : reprises dans la fiche, à vérifier par le propriétaire
  const withDocs = tenantFromCandidate({ ...candidateSchema.parse(ok), documents: [{ category: 'identity', who: 'TENANT', fileId: 'f1', label: 'cni.pdf' }, { category: 'taxNotice', who: 'GUARANTOR', fileId: 'f2', label: 'avis.pdf' }] })
  assert.deepEqual(withDocs.documents, [{ category: 'identity', received: true, fileId: 'f1', label: 'cni.pdf', source: 'TENANT' }])
  assert.equal(withDocs.guarantor?.documents[0].category, 'taxNotice')
  assert.equal(rentShare(80000, 240000), 33)
  assert.equal(rentShare(80000, 0), null)
})
