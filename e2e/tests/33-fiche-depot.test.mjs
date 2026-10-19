import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Préparer le dépôt : la page de déclaration donne, situation par situation, les documents à réunir, les étapes,
 * les liens officiels et les contacts ; la même fiche se télécharge en PDF, montants compris.
 */
test('déclaration : fiche « Préparer votre dépôt », liens officiels et PDF', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: true })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-11', amountCents: 56000, receivedAt: '2026-11-04' } })
  const year = 2026
  const view = await api(`/money/tax?year=${year}`, { token })
  const ids = view.filing.map((g) => g.id)
  // Premier bail meublé de l'année : formalités (SIRET, CFE), puis le micro-BIC, et l'occupation à déclarer.
  assert.deepEqual(ids.slice(0, 2), ['MEUBLE_DEBUT', 'MEUBLE_MICRO'])
  assert.ok(ids.includes('OCCUPATION'))
  assert.ok(view.contacts.some((c) => c.value === '0 809 401 401'))

  const pdf = await fetch(`${API}/money/tax/fiche.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(pdf.status, 200)
  assert.equal(pdf.headers.get('content-type'), 'application/pdf')
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/argent/declaration`)
  await page.getByRole('button', { name: String(year) }).click()
  await page.getByRole('heading', { name: 'Préparer votre dépôt' }).waitFor()
  await page.locator('strong', { hasText: 'Première année en meublé : les formalités' }).waitFor()
  assert.equal(await page.getByRole('link', { name: /Guichet unique des formalités/ }).first().getAttribute('href'), 'https://procedures.inpi.fr/')
  // Une situation à la fois : le micro-BIC et sa case 5NI.
  await page.getByRole('button', { name: 'Location meublée au micro-BIC', exact: true }).click()
  await page.locator('li', { hasText: 'Case 5NI' }).waitFor()
  const box = page.getByRole('checkbox', { name: /Votre numéro SIRET/ })
  await box.check()
  assert.ok(await box.isChecked())
  await page.getByRole('heading', { name: 'Qui contacter' }).waitFor()
  await shot(page, 'declaration-depot')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger la fiche (PDF)' }).click()
  assert.equal((await download).suggestedFilename(), `bailio-declaration-${year}.pdf`)
  await browser.close()
  assert.deepEqual(errors, [])
})
