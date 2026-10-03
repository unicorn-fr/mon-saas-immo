import assert from 'node:assert/strict'
import { test } from 'node:test'
import { declarationDeadline, departmentGroup, occupancyDeclarationDue } from './fiscalCalendar.js'

test('calendrier fiscal : date limite selon le département, déclaration d’occupation', () => {
  assert.equal(departmentGroup('13001'), 0)
  assert.equal(departmentGroup('34000'), 1)
  assert.equal(departmentGroup('20000'), 1) // Corse
  assert.equal(departmentGroup('75011'), 2)
  assert.equal(departmentGroup('97400'), 2)
  assert.deepEqual(declarationDeadline(2026, '34200'), { date: '2026-05-28', verified: true })
  assert.deepEqual(declarationDeadline(2026, '75011'), { date: '2026-06-04', verified: true })
  assert.deepEqual(declarationDeadline(2027, '75011'), { date: null, verified: false })
  assert.equal(occupancyDeclarationDue(2027, ['2026-10-06']), true)
  assert.equal(occupancyDeclarationDue(2027, ['2026-01-01']), false)
  assert.equal(occupancyDeclarationDue(2027, ['2027-01-01']), true)
})
