import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applySignup, firstPathFor, signupAnswersSchema, viewModeFor } from './onboarding.js'

const base = { role: 'OWNER', goals: ['TIME', 'RENTS'], homes: 'FEW', homeCount: 4, tool: 'QALIMO', source: 'SEARCH', firstName: ' Claire ', lastName: 'Martin', phone: '06 12 34 56 78' } as const

test('réponses lues et nettoyées ; une réponse inconnue est refusée', () => {
  const a = signupAnswersSchema.parse(base)
  assert.equal(a.firstName, 'Claire')
  assert.equal(signupAnswersSchema.safeParse({ ...base, tool: 'AUTRE' }).success, false)
  assert.equal(signupAnswersSchema.safeParse({ ...base, firstName: '' }).success, false)
  assert.deepEqual(signupAnswersSchema.parse({ ...base, goals: undefined, source: undefined, phone: undefined }).goals, [])
})

test('vue du tableau de bord selon le nombre de logements, agence à part', () => {
  assert.equal(viewModeFor({ role: 'OWNER', homes: 'ONE' }), 'SIMPLE')
  assert.equal(viewModeFor({ role: 'OWNER', homes: 'TWO' }), 'SIMPLE')
  assert.equal(viewModeFor({ role: 'OWNER', homes: 'FEW' }), 'PORTFOLIO')
  assert.equal(viewModeFor({ role: 'OWNER', homes: 'MANY' }), 'PORTFOLIO')
  assert.equal(viewModeFor({ role: 'OWNER', homes: 'LOTS' }), 'LARGE')
  assert.equal(viewModeFor({ role: 'AGENCY', homes: 'ONE' }), 'AGENCY')
})

test('ancien logiciel ou tableur : la première connexion ouvre l’import', () => {
  // Toujours le tableau de bord d'abord : l'import se fait depuis l'espace.
  for (const tool of ['SPREADSHEET', 'QALIMO', 'RENTILA', 'SOFTWARE', 'NONE', 'AGENCY'] as const) assert.equal(firstPathFor({ tool }), '/espace')
})

test('le profil existant n’est jamais écrasé ; téléphone illisible ignoré', () => {
  const at = new Date('2026-11-15T10:00:00Z')
  const a = signupAnswersSchema.parse(base)
  const fresh = applySignup(a, {}, at)
  assert.deepEqual(fresh.profile, { firstNames: 'Claire', lastName: 'Martin', phone: '06 12 34 56 78' })
  assert.equal(fresh.viewMode, 'PORTFOLIO')
  assert.deepEqual(fresh.onboarding, { role: 'OWNER', goals: ['TIME', 'RENTS'], homes: 'FEW', homeCount: 4, tool: 'QALIMO', source: 'SEARCH', at: '2026-11-15T10:00:00.000Z' })
  const kept = applySignup({ ...a, phone: 'pas un numéro' }, { firstNames: 'Jeanne', city: 'Lyon' }, at)
  assert.deepEqual(kept.profile, { firstNames: 'Jeanne', city: 'Lyon', lastName: 'Martin' })
  assert.deepEqual(applySignup({ ...a, role: 'AGENCY' }, {}, at).profile.agent, { enabled: true })
})
