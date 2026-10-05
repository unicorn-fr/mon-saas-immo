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
  // Assistant : une question par écran
  await page.getByRole('button', { name: 'Ajouter mon emprunt' }).click()
  await page.getByRole('heading', { name: 'Combien avez-vous emprunté ?' }).waitFor()
  await page.getByLabel('Montant emprunté').fill('200000')
  await page.getByLabel('Taux annuel, hors assurance').fill('3,5')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Sur combien de temps ?' }).waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Choisissez la durée du prêt.').waitFor()
  await page.getByRole('button', { name: '20 ans' }).click()
  await page.getByLabel('Date de la première mensualité').fill('2026-02-05')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Assurance et frais du prêt' }).waitFor()
  await page.getByLabel('Assurance emprunteur, par mois (facultatif)').fill('30')
  await page.getByLabel('Frais de dossier et de garantie (facultatif)').fill('1200')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Vérifiez votre mensualité' }).waitFor()
  await page.getByText('1 159,92 €').waitFor()
  await page.getByLabel('Un nom pour ce prêt (facultatif)').fill('Prêt principal')
  await page.getByRole('button', { name: 'Enregistrer l’emprunt' }).click()
  await page.getByText('Emprunt enregistré.').waitFor()
  await page.getByRole('heading', { name: 'Prêt principal' }).waitFor()
  await page.getByText('Vous ajoutez de votre poche').waitFor()
  // Tableau replié par défaut ; 2026 : 11 mensualités + frais → 6 323,35 + 330 + 1 200
  assert.equal(await page.getByRole('table').count(), 0)
  await page.getByRole('button', { name: 'Voir le tableau de remboursement' }).click()
  assert.match(await page.getByRole('row', { name: /^2026/ }).innerText(), /7 853,35 €/)
  await page.getByRole('button', { name: '2026' }).click()
  await page.getByRole('cell', { name: '05/02/2026' }).waitFor()
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
