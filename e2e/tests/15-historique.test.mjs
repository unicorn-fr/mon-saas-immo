import assert from 'node:assert/strict'
import { test } from 'node:test'
import { api, completeLease, newAccount } from '../lib.mjs'

/** Historique des loyers : une révision prend effet à sa date ; le bail suivant reprend le locataire précédent et les travaux. */
const iso = (d) => d.toISOString().slice(0, 10)

test('révision à date d’effet future : l’ancien loyer reste dû jusque-là, la fiche du logement suit', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const future = new Date(Date.now() + 60 * 86_400_000)
  await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { type: 'REVISION', oldRentCents: 51000, irlRef: { quarter: '2025-Q2', value: 145.0 }, irlNew: { quarter: '2026-Q2', value: 147.9 }, effectiveDate: iso(future) } })
  const lease = await api(`/leases/${leaseId}`, { token })
  assert.equal(lease.columns.rentCents, 51000, 'loyer en vigueur inchangé avant la date d’effet')
  const property = await api(`/properties/${propertyId}`, { token })
  assert.equal(property.file.rent.rentCents, 52020, 'loyer révisé retenu pour la prochaine annonce et le prochain bail')
})

test('nouveau bail : loyer du locataire précédent, dernier versement, dernière révision et travaux repris', async () => {
  // Révision datée du début du bail (completeLease : 6 octobre 2026), jamais avant : le résultat ne dépend pas du jour.
  const { token } = await newAccount()
  const { leaseId, propertyId, tenantId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-10', receivedAt: '2026-10-04' } })
  await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { type: 'REVISION', oldRentCents: 51000, irlRef: { quarter: '2025-Q2', value: 145.0 }, irlNew: { quarter: '2026-Q2', value: 147.9 }, effectiveDate: '2026-10-06' } })
  await api(`/leases/${leaseId}/end`, { method: 'POST', token, body: { keysDate: iso(new Date()) } })
  await api(`/properties/${propertyId}/interventions`, { method: 'POST', token, body: { title: 'Remplacement du chauffe-eau', status: 'DONE', date: iso(new Date(Date.now() + 86_400_000)), costCents: 89000 } })
  const l2 = await api('/leases', { method: 'POST', token, body: { propertyId, tenantIds: [tenantId], terms: { kind: 'MEUBLE', startDate: iso(new Date(Date.now() + 30 * 86_400_000)) } } })
  const v = await api(`/leases/${l2.id}`, { token })
  assert.equal(v.terms.previous.rentedWithin18Months, true)
  assert.equal(v.terms.previous.lastRentCents, 52020)
  assert.equal(v.terms.previous.lastPaymentDate, '2026-10-04')
  assert.equal(v.terms.previous.lastRevisionDate, '2026-10-06')
  assert.match(v.terms.works.sinceLast, /Remplacement du chauffe-eau \(890 €/)
})

test('échéances fiscales : occupation des logements après un nouveau bail, CFE en meublé', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  // Entrée il y a une semaine : le nouvel occupant est à signaler sur impots.gouv.fr
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token, body: { startDate: iso(new Date(Date.now() - 7 * 86_400_000)) } })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const today = await api('/today', { token })
  const labels = today.upcoming.map((u) => u.label).join(' | ')
  assert.match(labels, /Gérer mes biens immobiliers/)
  if (new Date().getUTCMonth() >= 9) assert.match(labels, /CFE de la location meublée/)
})

test('meublé au réel : estimation avec amortissement, comparée au micro-BIC', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const year = new Date().getUTCFullYear()
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: `${year}-10`, receivedAt: `${year}-10-04` } })
  await api(`/properties/${propertyId}/purchase`, { method: 'PUT', token, body: { priceCents: 15_000_000, date: '2020-01-01' } })
  await api(`/properties/${propertyId}/lmnp`, { method: 'PUT', token, body: { landSharePercent: 20, furnitureCents: 700_000 } })
  const tax = await api(`/money/tax?year=${year}`, { token })
  assert.equal(tax.lmnp.receiptsCents, 56000)
  assert.equal(tax.lmnp.amortYearCents, Math.round(15_000_000 * 0.8 / 30 + 100_000))
  assert.equal(tax.lmnp.taxableCents, 0, 'amortissement limité au résultat')
  assert.equal(tax.lmnp.better, 'REAL')
  assert.equal(tax.lmnpSettings[propertyId].landSharePercent, 20)
})
