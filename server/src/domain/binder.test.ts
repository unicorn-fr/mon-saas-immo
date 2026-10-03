import assert from 'node:assert/strict'
import { test } from 'node:test'
import { binderMissing, propertyBinder } from './binder.js'

const lease = { id: 'l1', signed: true, furnished: true, guarantors: 1, entryInventorySigned: false, insurance: false, depositReceived: true, depositCents: 100000, receipts: 0, boilerDate: null, individualBoiler: true }

test('dossier du logement : copropriété, diagnostics requis, pièces de la location et durées de conservation', () => {
  const s = propertyBinder({ propertyId: 'p1', file: { legalRegime: 'COPRO', constructionPeriod: 'BEFORE_1949', diagnostics: { dpe: { class: 'D', date: '2024-01-01' } } }, docs: [{ id: 'd1', kind: 'OTHER', binder: 'deed', createdAt: '2026-01-01' }], lease, invoices: 0 })
  const all = Object.fromEntries(s.flatMap((x) => x.items).map((x) => [x.key, x]))
  assert.equal(all.deed.state, 'OK')
  assert.equal(all.deed.docId, 'd1')
  assert.equal(all.ownerInsurance.optional, false) // obligatoire en copropriété
  assert.equal(all['diag.dpe'].state, 'OK')
  assert.equal(all['diag.lead'].state, 'MISSING') // avant 1949
  assert.equal(all.coproMinutes.keep, '10 ans')
  assert.equal(all.inventory.state, 'MISSING')
  assert.equal(all.furniture.state, 'MISSING')
  assert.equal(all.notice.state, 'AUTO')
  assert.equal(all.boiler.state, 'MISSING')
  assert.equal(all.lease.keep, 'Durée de la location et 3 ans')
  assert.ok(binderMissing(s).some((x) => x.key === 'insurance'))
})

test('sans bail : la location viendra plus tard, l’assurance du propriétaire est facultative hors copropriété', () => {
  const s = propertyBinder({ propertyId: 'p1', file: { legalRegime: 'MONO' }, docs: [], lease: null, invoices: 2 })
  const all = Object.fromEntries(s.flatMap((x) => x.items).map((x) => [x.key, x]))
  assert.equal(all.lease.state, 'LATER')
  assert.equal(all.ownerInsurance.optional, true)
  assert.equal(all.invoices.state, 'OK')
  assert.ok(!s.some((x) => x.key === 'COPRO'))
})

test('dossier du logement : diagnostic expiré à refaire', () => {
  const s = propertyBinder({ propertyId: 'p1', file: { constructionPeriod: '1990_2005', diagnostics: { dpe: { class: 'D', date: '2019-06-01' } } }, docs: [], lease: null, invoices: 0, today: '2026-10-03' })
  const dpe = s.flatMap((x) => x.items).find((x) => x.key === 'diag.dpe')!
  assert.equal(dpe.state, 'MISSING')
  assert.match(dpe.why, /Plus valable depuis le 31\/12\/2024/)
})
