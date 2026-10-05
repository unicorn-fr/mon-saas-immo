import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Emprunt : 200 000 € à 3,5 % sur 20 ans (1 159,92 € par mois). Le tableau par année donne la ligne 250 de la 2044
 * (intérêts + assurance + frais payés dans l'année), reprise dans l'aide à la déclaration tant que rien n'est saisi.
 */
test('emprunt : tableau d’amortissement, trésorerie et ligne 250 de la déclaration', async () => {
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token, { furnished: false })

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)

  await page.goto(`${BASE}/espace/logements/${propertyId}`)
  await page.getByRole('link', { name: 'Ajouter' }).first().waitFor()
  await page.goto(`${BASE}/espace/logements/${propertyId}/emprunt`)
  await page.getByRole('button', { name: 'Ajouter un emprunt' }).click()
  await page.getByLabel('Nom (facultatif)').fill('Prêt principal')
  await page.getByLabel('Montant emprunté').fill('200000')
  await page.getByLabel('Taux annuel, hors assurance').fill('3,5')
  await page.getByLabel('Durée, en mois').fill('240')
  await page.getByLabel('Date de la première mensualité').fill('2026-02-05')
  await page.getByLabel('Assurance emprunteur par mois (facultatif)').fill('30')
  await page.getByLabel('Frais de dossier et de garantie (facultatif)').fill('1200')
  await page.getByRole('button', { name: 'Enregistrer l’emprunt' }).click()
  await page.getByText('Emprunt enregistré.').waitFor()
  await page.getByRole('heading', { name: 'Prêt principal' }).waitFor()
  await page.getByText('1 159,92 €').first().waitFor()
  // 2026 : 11 mensualités + frais → 6 323,35 + 330 + 1 200
  const row2026 = page.getByRole('row', { name: /^2026/ })
  assert.match(await row2026.innerText(), /7 853,35 €/)
  await page.getByRole('button', { name: '2026' }).click()
  await page.getByRole('cell', { name: '05/02/2026' }).waitFor()
  await page.getByText('Effort d’épargne').waitFor()
  await shot(page, 'emprunt')

  // Aide à la déclaration : ligne 250 calculée pour 2027, puis le montant saisi l'emporte
  const tax = await api('/money/tax?year=2027', { token })
  const line = (t) => t.properties.find((p) => p.id === propertyId).lines.find((l) => l.line === '250').cents
  assert.equal(line(tax), 6_659_03 + 360_00)
  assert.equal(tax.loanComputed[propertyId], 6_659_03 + 360_00)
  await api(`/properties/${propertyId}/tax/2027`, { method: 'PUT', token, body: { loanInterestCents: 7_000_00 } })
  assert.equal(line(await api('/money/tax?year=2027', { token })), 7_000_00)

  // Page du logement : la carte reprend le crédit
  await page.goto(`${BASE}/espace/logements/${propertyId}`)
  await page.getByText('Capital restant dû').waitFor()

  await browser.close()
  assert.deepEqual(errors, [])
})
