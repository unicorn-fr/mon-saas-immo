import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, completeLease, newAccount } from '../lib.mjs'

/** Conformité : ce que la loi interdit, Bailio le refuse. */
const PROPERTY = { label: 'T2 Agde', address: '2 rue Jean Roger, 34300 Agde', postalCode: '34300', city: 'Agde', habitat: 'COLLECTIVE', legalRegime: 'MONO', furnished: false, constructionPeriod: '1975_1989', surface: 40, rooms: 2, heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' }, hotWater: { mode: 'INDIVIDUAL' }, equipments: ['kitchen', 'smokeDetector'], smokeDetectors: 1, tv: 'COLLECTIVE', internet: 'FIBER' }

test('logement classé G : aucun bail ne peut être créé', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: { ...PROPERTY, diagnostics: { dpe: { class: 'G', ges: 'G' } } } })
  const t = await api('/tenants', { method: 'POST', token, body: { propertyId: p.id, firstNames: 'Paul', lastName: 'Martin', guarantee: 'NONE' } })
  await assert.rejects(api('/leases', { method: 'POST', token, body: { propertyId: p.id, tenantIds: [t.id], terms: { kind: 'VIDE', startDate: '2026-11-01' } } }), /409 Logement classé G/)
  const view = await api(`/properties/${p.id}`, { token })
  const step = view.journey.find((s) => s.key === 'LEASE')
  assert.equal(step.state, 'LOCKED')
  assert.match(step.text, /ne peut plus être loué/)
})

test('zone tendue : un loyer plus élevé que celui du locataire précédent bloque la signature, sauf motif', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { previous: { rentedWithin18Months: true, lastRentCents: 50000, lastPaymentDate: '2026-08-04', lastRevisionDate: '2026-01-01' } } })
  const view = await api(`/leases/${leaseId}`, { token })
  assert.deepEqual(view.computed.rentIssues.map((i) => i.code), ['RELET_TENSE'])
  await assert.rejects(api(`/leases/${leaseId}/sign`, { method: 'POST', token }), /400 Zone tendue/)
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { previous: { rentedWithin18Months: true, lastRentCents: 50000, lastPaymentDate: '2026-08-04', lastRevisionDate: '2025-01-01', increaseReason: 'Révision de 2026 non appliquée au précédent locataire' } } })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
})

test('encadrement : loyer au-dessus du loyer de référence majoré refusé', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  // 37 m² × 12 € = 444 € de loyer de base au plus ; le loyer est de 510 €
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { zone: { tense: true, control: true, refRentCentsM2: 1000, refRentMaxCentsM2: 1200 } } })
  const view = await api(`/leases/${leaseId}`, { token })
  assert.deepEqual(view.computed.rentIssues.map((i) => i.code), ['CEILING'])
  await assert.rejects(api(`/leases/${leaseId}/sign`, { method: 'POST', token }), /loyer de référence majoré/)
})

const API_URL = process.env.E2E_API ?? 'http://localhost:5000/api'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const tmpPdf = (buf) => {
  const f = join(mkdtempSync(join(tmpdir(), 'bail-')), 'b.pdf')
  writeFileSync(f, buf)
  return f
}
const pdfPages = (buf) => Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [tmpPdf(buf)]).toString())?.[1] ?? 0)
const pdfText = (buf) => execFileSync('pdftotext', [tmpPdf(buf), '-']).toString()

test('diagnostics : le fichier déposé est joint au PDF du bail ; un diagnostic expiré bloque la signature', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token)
  const get = async () => Buffer.from(await (await fetch(`${API_URL}/leases/${leaseId}/lease.pdf`, { headers: { Authorization: `Bearer ${token}` } })).arrayBuffer())
  const before = pdfPages(await get())
  const form = new FormData()
  form.append('file', new Blob([await import('node:fs').then((fs) => fs.readFileSync(new URL('../fixtures/selfie.jpg', import.meta.url)))], { type: 'image/jpeg' }), 'dpe.jpg')
  form.append('kind', 'DIAGNOSTIC')
  form.append('diagnostic', 'dpe')
  form.append('propertyId', propertyId)
  const up = await fetch(`${API_URL}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  assert.equal(up.status, 201)
  const after = await get()
  assert.ok(pdfPages(after) >= before + 2, 'page de titre et diagnostic ajoutés')
  assert.match(pdfText(after), /dossier de diagnostic technique/)
  // DPE fait en 2019 : plus valable depuis le 1er janvier 2025
  await api(`/properties/${propertyId}`, { method: 'PUT', token, body: { diagnostics: { dpe: { class: 'C', ges: 'B', date: '2019-06-01', costMin: 610, costMax: 870, costYear: 2023 }, erp: { date: '2026-09-01' }, electricity: { installOver15: false }, gas: { hasGas: false } } } })
  await assert.rejects(api(`/leases/${leaseId}/sign`, { method: 'POST', token }), /ne sont plus valables : Performance énergétique/)
})

test('zone tendue : reprise de la liste officielle des communes à partir de l’adresse', async () => {
  const { token } = await newAccount()
  const p = await api('/properties', { method: 'POST', token, body: { ...PROPERTY, address: '5 quai de la Résistance, 34200 Sète', city: 'Sète', postalCode: '34200', inseeCode: '34301' } })
  const v = await api(`/properties/${p.id}`, { token })
  assert.equal(v.file.market.tense, true)
  assert.equal(v.tenseOfficial, true)
  assert.equal(v.rentControl, null)
  const q = await api('/properties', { method: 'POST', token, body: { ...PROPERTY, address: '1 place du Capitole, 38000 Grenoble', city: 'Grenoble', postalCode: '38000', inseeCode: '38185' } })
  assert.equal((await api(`/properties/${q.id}`, { token })).rentControl, 'partial')
})
