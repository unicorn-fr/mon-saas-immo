import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Tableau de bord : loyers du mois, crédits, ce qu'il reste, points à surveiller, une ligne par logement. */
test('tableau de bord de tous les logements', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  // Second logement, libre, classé F : interdit à la location au 1er janvier 2028
  const other = await api('/properties', { method: 'POST', token, body: { address: '1 rue Basse, 34000 Montpellier', label: 'T2 Montpellier', diagnostics: { dpe: { class: 'F', ges: 'F', date: '2024-01-10' } } } })
  await api(`/properties/${propertyId}`, { method: 'PUT', token, body: { loans: [{ principalCents: 10_000_000, ratePercent: 3, months: 240, firstPaymentDate: '2025-01-05' }] } })

  const v = await api('/portfolio', { token })
  assert.equal(v.totals.properties, 2)
  const lease = await api(`/leases/${leaseId}`, { token })
  const monthly = lease.columns.rentCents + lease.columns.chargesCents
  // Bail commencé aujourd'hui : loué dès le jour d'entrée
  assert.equal(v.totals.rented, 1)
  assert.equal(v.totals.monthlyRentCents, monthly)
  assert.equal(v.totals.monthlyLoanCents, 55_460)
  assert.equal(v.totals.monthlyNetCents, monthly - 55_460)
  assert.ok(v.alerts.some((a) => a.kind === 'DPE_SOON' && a.propertyId === other.id && /1er janvier 2028/.test(a.title)))
  assert.equal(v.rows[0].id, other.id)

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/logements`)
    await page.getByRole('link', { name: /^Tableau de bord/ }).click()
    await page.getByRole('heading', { name: 'Tableau de bord', level: 1 }).waitFor()
    await page.getByText('Il vous reste', { exact: false }).or(page.getByText('Vous ajoutez de votre poche')).first().waitFor()
    await page.getByText('Classé F : interdit à la location le 1er janvier 2028').waitFor()
    await page.getByRole('link', { name: /T2 Montpellier.*Libre/ }).waitFor()
    await shot(page, 'tableau-de-bord')
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
