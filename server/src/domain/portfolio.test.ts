import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alertsFor, portfolio, type PortfolioItem } from './portfolio.js'

const base: PortfolioItem = { id: 'a', name: 'Studio Sète', structureName: null, rented: true, tenantName: 'Lucas Garnier', rentCents: 60000, chargesCents: 5000, loanCents: 40000, averageExpensesCents: 5000, unpaidCents: 0, leaseEnd: '2029-10-05', vacantSince: null, dpe: 'C', expiredDiagnostics: 0, purchasePriceCents: 12_000_000 }

test('tableau de bord : loyers, crédits, ce qu’il reste, rendement brut', () => {
  const p = portfolio([base, { ...base, id: 'b', name: 'T2 Lyon', rented: false, tenantName: null, loanCents: 30000, averageExpensesCents: 2000, vacantSince: '2026-09-01', purchasePriceCents: 20_000_000 }], '2026-10-06')
  assert.equal(p.totals.properties, 2)
  assert.equal(p.totals.rented, 1)
  assert.equal(p.totals.monthlyRentCents, 65000)
  assert.equal(p.totals.monthlyLoanCents, 70000)
  assert.equal(p.totals.monthlyNetCents, 65000 - 70000 - 7000)
  // Rendement brut sur les logements loués dont le prix est connu : 600 € × 12 ÷ 120 000 € = 6 %
  assert.equal(p.totals.grossYield, 6)
  // Le logement avec un point à surveiller vient en premier
  assert.equal(p.rows[0].id, 'b')
  assert.equal(p.rows[0].netCents, -32000)
})

test('tableau de bord : points à surveiller, du plus urgent au moins urgent', () => {
  const today = '2026-10-06'
  assert.deepEqual(alertsFor(base, today), [])
  assert.equal(alertsFor({ ...base, unpaidCents: 65000 }, today)[0].kind, 'UNPAID')
  assert.equal(alertsFor({ ...base, dpe: 'G' }, today)[0].kind, 'FORBIDDEN')
  // F : interdit au 1er janvier 2028, signalé dans les 4 ans
  const f = alertsFor({ ...base, dpe: 'F' }, today)
  assert.deepEqual(f.map((a) => [a.kind, a.level]), [['DPE_SOON', 3]])
  assert.match(f[0].title, /1er janvier 2028/)
  assert.deepEqual(alertsFor({ ...base, dpe: 'E' }, today), [])
  assert.equal(alertsFor({ ...base, dpe: 'E' }, '2030-01-02')[0].kind, 'DPE_SOON')
  assert.deepEqual(alertsFor({ ...base, leaseEnd: '2027-03-01' }, today).map((a) => [a.kind, a.level]), [['LEASE_END', 2]])
  assert.deepEqual(alertsFor({ ...base, leaseEnd: '2027-04-30' }, today).map((a) => [a.kind, a.level]), [['LEASE_END', 3]])
  assert.deepEqual(alertsFor({ ...base, expiredDiagnostics: 2 }, today).map((a) => a.title), ['2 diagnostics à refaire'])
  const all = portfolio([{ ...base, id: 'x', leaseEnd: '2027-04-30' }, { ...base, id: 'y', unpaidCents: 1000 }], today).alerts
  assert.deepEqual(all.map((a) => a.kind), ['UNPAID', 'LEASE_END'])
})
