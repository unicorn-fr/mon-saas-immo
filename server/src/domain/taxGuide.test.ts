import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chooseRegime, declarationStatus, dueMonths, mergeInfo, mergeProgress, priorDeficitSuggestion, readInfo, readProgress, taxChecks, type ChecksInput } from './taxGuide.js'

test('régime : le choix du propriétaire, jamais le micro au-delà du plafond', () => {
  assert.deepEqual(chooseRegime('MICRO', true), { recommended: 'MICRO', chosen: 'MICRO', microAllowed: true })
  assert.equal(chooseRegime('MICRO', true, 'REAL').chosen, 'REAL')
  assert.deepEqual(chooseRegime('REAL', false, 'MICRO'), { recommended: 'REAL', chosen: 'REAL', microAllowed: false })
})

test('progression : une année à la fois, données abîmées ignorées', () => {
  const all = mergeProgress({}, 2025, { done: ['VIDE_MICRO:4BE:0'], regime: { vide: 'REAL' } })
  const next = mergeProgress(all, 2025, { regime: { meuble: 'MICRO' }, filedAt: '2026-05-12' })
  assert.deepEqual(readProgress(next, 2025), { done: ['VIDE_MICRO:4BE:0'], regime: { vide: 'REAL', meuble: 'MICRO' }, filedAt: '2026-05-12' })
  assert.deepEqual(readProgress(next, 2024), {})
  assert.deepEqual(readProgress({ 2025: { done: 'oui' } }, 2025), {})
})

test('loyers attendus : entre l’entrée et la sortie, échéance passée', () => {
  assert.deepEqual(dueMonths(2025, { startDate: '2025-10-10', paymentDay: 5 }, '2026-03-01'), ['2025-11', '2025-12'])
  assert.deepEqual(dueMonths(2025, { startDate: '2024-01-01', endDate: '2025-02-28', paymentDay: 1 }, '2026-03-01'), ['2025-01', '2025-02'])
  assert.deepEqual(dueMonths(2026, { startDate: '2026-01-01', paymentDay: 5 }, '2026-03-04'), ['2026-01', '2026-02'])
})

const base: ChecksInput = { year: 2025, rents: { count: 12, cents: 720000 }, missingRents: [], unassignedCents: 0, unclassified: [], real: [], lmnpMissingPurchase: false, prior: null, siret: null, signatureMissing: false }

test('vérifications : ce qui change le montant d’abord, puis les conseils, puis ce qui est juste', () => {
  const checks = taxChecks({
    ...base,
    missingRents: [{ leaseId: 'l', name: 'T2', periods: ['2025-03', '2025-04'] }],
    real: [{ id: 'p', name: 'T2', copro: true, loanKnown: false, coproKnown: false, feesKnown: false, incomeKnown: false, agent: false, hasTax: false, hasInsurance: true, lastLoanCents: 150000 }],
    prior: { known: false, suggested: 80000 },
  })
  assert.deepEqual(checks.map((c) => [c.id, c.tone]), [['rent:l', 'TODO'], ['loan:p', 'TODO'], ['copro:p', 'TODO'], ['income:p', 'TODO'], ['prior', 'TODO'], ['tax:p', 'TIP'], ['rents', 'OK']])
  assert.match(checks[0].detail!, /Mars, avril 2025/)
  // Réponse proposée : l'an dernier pour l'emprunt, le calcul de Bailio pour les déficits antérieurs.
  assert.deepEqual(checks[1].fields!.map((f) => [f.key, f.scope, f.suggested]), [['loanInterestCents', 'PROPERTY', 150000]])
  assert.deepEqual(checks[3].fields!.map((f) => f.key), ['subsidyCents', 'indemnityCents'])
  assert.deepEqual(checks[4].fields!.map((f) => [f.key, f.scope, f.suggested]), [['priorDeficitCents', 'YEAR', 80000]])
})

test('premier meublé : le SIRET demandé une fois, la signature conseillée', () => {
  const checks = taxChecks({ ...base, siret: { known: false }, signatureMissing: true })
  assert.deepEqual(checks.map((c) => [c.id, c.tone]), [['siret', 'TODO'], ['signature', 'TIP'], ['rents', 'OK']])
  assert.deepEqual(checks[0].fields!.map((f) => [f.key, f.scope, f.kind]), [['siret', 'INFO', 'TEXT']])
  assert.deepEqual(taxChecks({ ...base, siret: { known: true } }).map((c) => c.id), ['rents'])
})

test('case 4BD proposée avec la déclaration de l’an dernier', () => {
  assert.equal(priorDeficitSuggestion({}), null)
  // Bénéfice de 3 000 € : 5 000 € de déficits antérieurs en absorbent 3 000 ; rien de reporté cette année-là.
  assert.equal(priorDeficitSuggestion({ snapshot: { resultCents: 300000, carriedCents: 0, priorDeficitCents: 500000 } }), 200000)
  // Déficit : les antérieurs restent entiers, et la part reportée de l'année s'y ajoute.
  assert.equal(priorDeficitSuggestion({ snapshot: { resultCents: -1200000, carriedCents: 130000, priorDeficitCents: 100000 } }), 230000)
})

test('SIRET gardé à part, une fois pour toutes', () => {
  const all = mergeInfo(mergeProgress({}, 2025, { filedAt: '2026-05-20' }), { siret: '12345678900012' })
  assert.equal(readInfo(all).siret, '12345678900012')
  assert.equal(readProgress(all, 2025).filedAt, '2026-05-20')
  assert.throws(() => mergeInfo({}, { siret: '123' }))
})

test('vérifications : au micro, aucune question sur les dépenses', () => {
  assert.deepEqual(taxChecks(base).map((c) => c.id), ['rents'])
})

test('saison : trop tôt, ouverte, en retard, signée', () => {
  assert.equal(declarationStatus(2026, '2026-10-26', '34000').phase, 'EARLY')
  assert.equal(declarationStatus(2025, '2026-02-01', '34000').phase, 'EARLY')
  const open = declarationStatus(2025, '2026-05-02', '34000')
  assert.equal(open.phase, 'OPEN')
  assert.equal(open.deadline, '2026-05-28')
  assert.equal(declarationStatus(2025, '2026-06-10', '34000').phase, 'LATE')
  const filed = declarationStatus(2025, '2026-10-26', '34000', '2026-05-20')
  assert.equal(filed.phase, 'FILED')
  assert.match(filed.text, /30 novembre 2026/)
})
