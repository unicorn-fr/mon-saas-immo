import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeMetrics, weekStart, type MetricsInput } from './metrics.js'

const now = new Date('2026-10-21T12:00:00Z') // un mercredi
const d = (days: number) => new Date(now.getTime() - days * 86_400_000)
const base: MetricsInput = { now, users: [], sessions: [], properties: [], leases: [], payments: [], drafts: [] }
const value = (m: ReturnType<typeof computeMetrics>, key: string) => m.totals.find((t) => t.key === key)!.value

test('pilotage : semaine du lundi', () => {
  assert.equal(weekStart(now).toISOString(), '2026-10-19T00:00:00.000Z')
  assert.equal(weekStart(new Date('2026-10-25T23:00:00Z')).toISOString(), '2026-10-19T00:00:00.000Z')
  assert.equal(weekStart(new Date('2026-10-26T00:00:00Z')).toISOString(), '2026-10-26T00:00:00.000Z')
})

test('pilotage : base vide, aucun pourcentage impossible', () => {
  const m = computeMetrics(base)
  assert.equal(value(m, 'accounts'), 0)
  assert.ok(m.funnel.every((f) => f.users === 0 && f.percent === 0))
  assert.equal(m.weeks.length, 8)
  assert.ok(m.notMeasured.length >= 3)
})

test('pilotage : actifs, revenus, entonnoir et semaines', () => {
  const m = computeMetrics({
    ...base,
    users: [
      { id: 'a', createdAt: d(40), followUpSince: d(39) },
      { id: 'b', createdAt: d(10), followUpSince: null },
      { id: 'c', createdAt: d(2), followUpSince: null },
    ],
    sessions: [
      { userId: 'a', createdAt: d(40), lastSeenAt: d(1) }, // revenu (39 jours après), actif cette semaine
      { userId: 'b', createdAt: d(10), lastSeenAt: d(9) }, // pas revenu (1 jour après), actif ce mois-ci
      { userId: 'c', createdAt: d(2), lastSeenAt: null }, // actif cette semaine (date de connexion)
      { userId: 'inconnu', createdAt: d(1), lastSeenAt: d(1) }, // compte du pilotage, exclu
    ],
    properties: [{ userId: 'a' }, { userId: 'a' }, { userId: 'b' }],
    leases: [
      { userId: 'a', createdAt: d(30), signedAt: d(2) },
      { userId: 'b', createdAt: d(5), signedAt: null },
    ],
    payments: [{ userId: 'a', createdAt: d(1) }, { userId: 'a', createdAt: d(45) }],
    drafts: [{ createdAt: d(3) }, { createdAt: d(60) }],
  })
  assert.equal(value(m, 'accounts'), 3)
  assert.equal(value(m, 'active7'), 2)
  assert.equal(value(m, 'active30'), 3)
  assert.equal(value(m, 'returning'), 1)
  assert.equal(value(m, 'leasesStarted'), 2)
  assert.equal(value(m, 'leasesSigned'), 1)
  assert.equal(value(m, 'payments30'), 1)
  assert.equal(value(m, 'followUp'), 1)
  assert.equal(value(m, 'drafts30'), 1)
  assert.deepEqual(m.funnel.map((f) => f.users), [3, 2, 2, 1, 1])
  assert.deepEqual(m.funnel.map((f) => f.percent), [100, 67, 67, 33, 33])
  const last = m.weeks.at(-1)!
  assert.equal(last.week, '2026-10-19')
  assert.equal(last.signups, 1) // c
  assert.equal(last.signedLeases, 1) // bail de a, signé il y a 2 jours
  assert.equal(last.activeUsers, 2) // a et c
})
