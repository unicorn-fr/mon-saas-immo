import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Dépense de l'immeuble répartie entre ses logements, selon les tantièmes ; part récupérable répartie pareil. */
test('répartir une dépense de l’immeuble entre ses logements', async () => {
  const { token } = await newAccount()
  // Deux logements à la même adresse : un immeuble
  const a = await completeLease(token, { furnished: false })
  const b = await completeLease(token, { furnished: true })

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/logements`)
    await page.getByRole('link', { name: 'Répartir une dépense de l’immeuble' }).click()
    await page.getByRole('heading', { name: 'Quelle dépense ?' }).waitFor()
    await page.getByLabel('Fournisseur').fill('Net Immeuble')
    await page.getByLabel('Description (facultatif)').fill('Ménage des parties communes')
    await page.getByLabel('Montant total').fill('1000')
    await page.getByLabel('Dont part récupérable sur les locataires (facultatif)').fill('400')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Entre quels logements ?' }).waitFor()
    await page.getByRole('button', { name: 'Selon les tantièmes' }).click()
    const fields = page.getByLabel(/^Tantièmes : /)
    await fields.nth(0).fill('600')
    await fields.nth(1).fill('400')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('heading', { name: 'Vérifiez la répartition' }).waitFor()
    await page.getByText('600,00 €, dont 240,00 € récupérables').waitFor()
    await page.getByText('400,00 €, dont 160,00 € récupérables').waitFor()
    await shot(page, 'repartition')
    await page.getByRole('button', { name: 'Enregistrer 2 dépenses' }).click()
    await page.getByText('C’est enregistré : 2 dépenses.').waitFor()
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
  const all = await api('/expenses', { token })
  const list = Array.isArray(all) ? all : all.expenses
  const mine = list.filter((e) => e.vendor === 'Net Immeuble')
  assert.equal(mine.length, 2)
  assert.deepEqual(mine.map((e) => e.amountCents).sort((x, y) => y - x), [60000, 40000])
  assert.deepEqual(mine.map((e) => e.recoverableCents).sort((x, y) => y - x), [24000, 16000])
  assert.deepEqual(new Set(mine.map((e) => e.propertyId)), new Set([a.propertyId, b.propertyId]))
  assert.match(mine[0].description, /part de l’immeuble \(tantièmes : \d+ \/ 1\s000 tantièmes\)/u)
})
