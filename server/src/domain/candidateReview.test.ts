import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reviewCandidate } from './candidates.js'

const offer = { rentWithChargesCents: 60000, requestedDocs: ['identity', 'income'], availableFrom: '2026-11-01' }
const base = { monthlyIncomeCents: 200000, guarantee: 'CAUTION' as const, moveInDate: '2026-11-01', dossierFacileUrl: null, documents: [{ category: 'identity', who: 'TENANT' }, { category: 'income', who: 'TENANT' }] }

test('note des candidats : ressources, garantie, dossier, date ; jamais d’autre critère', () => {
  const r = reviewCandidate(base, offer)
  assert.equal(r.level, 'SOLID')
  assert.equal(r.points, 100)
  assert.deepEqual(r.criteria.map((c) => c.key), ['RESOURCES', 'GUARANTEE', 'FILE', 'DATE'])
  assert.match(r.criteria[0].text, /30 %/)
  // Sans garant : dossier correct, pas fragile
  assert.equal(reviewCandidate({ ...base, guarantee: 'NONE' }, offer).level, 'SOLID')
  assert.equal(reviewCandidate({ ...base, guarantee: 'NONE', moveInDate: '2026-12-15' }, offer).level, 'CORRECT')
  // Loyer au-delà de 40 % des ressources, ou aucune pièce : dossier à compléter
  assert.equal(reviewCandidate({ ...base, monthlyIncomeCents: 140000 }, offer).level, 'INCOMPLETE')
  assert.equal(reviewCandidate({ ...base, documents: [] }, offer).level, 'INCOMPLETE')
  // DossierFacile vaut dossier complet
  assert.equal(reviewCandidate({ ...base, documents: [], dossierFacileUrl: 'https://www.dossierfacile.logement.gouv.fr/file/x' }, offer).criteria[2].mark, 'GOOD')
  // Les pièces du garant ne comptent pas comme celles du candidat
  assert.equal(reviewCandidate({ ...base, documents: [{ category: 'identity', who: 'GUARANTOR' }, { category: 'income', who: 'TENANT' }] }, offer).criteria[2].mark, 'MEDIUM')
})

test('note des candidats : la situation, l’âge et le foyer n’entrent jamais dans le calcul', () => {
  // Deux candidats identiques sauf la situation et le nombre d'occupants : même note
  const a = reviewCandidate({ ...base, situation: 'STUDENT', occupants: 1 } as typeof base, offer)
  const b = reviewCandidate({ ...base, situation: 'RETIRED', occupants: 4 } as typeof base, offer)
  assert.deepEqual(a, b)
})
