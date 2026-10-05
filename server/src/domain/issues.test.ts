import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ISSUE_ADVICE, ISSUE_CATEGORIES, ISSUE_LABEL, isUrgent, issueProgress, issueTitle, readIssue } from './issues.js'

test('signalement : intitulé, urgence et conseils de sécurité', () => {
  for (const c of ISSUE_CATEGORIES) assert.ok(ISSUE_LABEL[c])
  assert.equal(issueTitle('WATER', ' salle de bain '), 'Fuite ou dégât des eaux (salle de bain)')
  assert.equal(issueTitle('DOOR', ''), 'Porte, serrure ou fenêtre')
  assert.ok(issueTitle('OTHER', 'x'.repeat(300)).length <= 160)
  // Gaz et eau toujours urgents, le reste selon le locataire
  assert.equal(isUrgent('GAS', false), true)
  assert.equal(isUrgent('WATER', false), true)
  assert.equal(isUrgent('PESTS', false), false)
  assert.equal(isUrgent('PESTS', true), true)
  assert.match(ISSUE_ADVICE.GAS!, /0 800 47 33 33/)
})

test('signalement : avancement vu par le locataire, sans artisan ni coût', () => {
  assert.equal(issueProgress('TODO', null), 'Reçu par votre bailleur')
  assert.equal(issueProgress('PLANNED', '2026-10-12'), 'Intervention prévue le 12/10/2026')
  assert.equal(issueProgress('DONE', '2026-10-14'), 'Réglé le 14/10/2026')
  assert.equal(readIssue({}), null)
  assert.equal(readIssue({ category: 'NOPE', leaseId: 'l' }), null)
  assert.deepEqual(readIssue({ category: 'DAMP', leaseId: 'l', urgent: 1 }), { category: 'DAMP', where: null, urgent: true, leaseId: 'l', reportedAt: '', photoIds: [] })
})
