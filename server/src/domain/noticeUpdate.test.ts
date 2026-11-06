import assert from 'node:assert/strict'
import { test } from 'node:test'
import { noticeUpdateDue } from './noticeUpdate.js'

test('nouvelle notice à envoyer : baux signés du 18 octobre 2026 à la mise à jour, une fois', () => {
  assert.equal(noticeUpdateDue('ACTIVE', new Date('2026-10-20T10:00:00Z'), {}), true)
  assert.equal(noticeUpdateDue('ACTIVE', new Date('2026-10-17T10:00:00Z'), {}), false, 'avant : ancienne notice, la bonne')
  assert.equal(noticeUpdateDue('ACTIVE', new Date('2026-11-08T10:00:00Z'), {}), false, 'après : nouvelle notice déjà jointe')
  assert.equal(noticeUpdateDue('ACTIVE', new Date('2026-10-20T10:00:00Z'), { noticeUpdateSentAt: '2026-11-07T09:00:00Z' }), false)
  assert.equal(noticeUpdateDue('DRAFT', null, {}), false)
})
