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
  // À recopier : la case 5NI du micro-BIC, en euros entiers ; la 1447-C-SD pré-remplie est proposée pour ce meublé.
  assert.deepEqual(view.copy.map((g) => g.id), ['MEUBLE_MICRO'])
  assert.deepEqual(view.copy[0].entries.map((e) => [e.box, e.cents]), [['5NI', 56000]])
  assert.equal(view.forms.cfe.length, 1)
  const cfe = await fetch(`${API}/money/tax/1447-c-sd.pdf?propertyId=${view.forms.cfe[0].propertyId}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(cfe.status, 200)
  assert.equal(Buffer.from(await cfe.arrayBuffer()).subarray(0, 4).toString(), '%PDF')

  // Location vide sans loyer : pas de 2044 à remplir.
  assert.equal((await fetch(`${API}/money/tax/2044.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })).status, 404)
  const pdf = await fetch(`${API}/money/tax/fiche.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(pdf.status, 200)
  assert.equal(pdf.headers.get('content-type'), 'application/pdf')
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/argent/declaration`)
  await page.getByRole('button', { name: String(year) }).click()
  await page.getByRole('heading', { name: '2. À recopier sur impots.gouv.fr' }).waitFor()
  await page.locator('.copy-row', { hasText: 'Case 5NI' }).getByRole('button', { name: 'Copier' }).waitFor()
  const cfeDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger la 1447-C-SD' }).click()
  assert.equal((await cfeDownload).suggestedFilename(), '1447-c-sd.pdf')
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
