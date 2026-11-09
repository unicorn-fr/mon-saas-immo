import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Page « Tarifs » : prix calculé selon les logements et garages, au mois ou à l'année, comparé à une agence. */
test('tarifs : prix calculé, paiement annuel, comparaison avec une agence', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  try {
    await page.goto(`${BASE}/tarifs`)
    await page.getByRole('heading', { level: 1, name: 'Un prix, tout compris' }).waitFor()
    assert.match(await page.title(), /Un prix, tout compris/)
    // 2 logements au mois : 2 × 3,49 €
    await page.getByText('6,98 € par mois').waitFor()
    await page.getByRole('button', { name: 'Un de plus : garages, box ou places loués seuls' }).click()
    await page.getByText('8,47 € par mois').waitFor()
    // À l'année : 2 × 34,90 € + 12 × 1,49 €
    await page.getByRole('radio', { name: /Chaque année/ }).click()
    await page.getByText('87,68 € par an').waitFor()
    await page.getByLabel(/Loyer mensuel moyen/).fill('1000')
    await page.getByText(/960 € à 2\s?400 € par an/).waitFor()
    await page.getByText('Que se passe-t-il après le mois offert ?').click()
    await page.getByText(/votre accord vous est demandé/).waitFor()
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
