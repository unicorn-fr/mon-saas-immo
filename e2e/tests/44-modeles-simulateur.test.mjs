import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Pages publiques pour Google : modèles de lettres à copier et simulateur de révision du loyer, une question à la fois. */
test('modèles gratuits et simulateur de révision du loyer', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)

  await page.goto(`${BASE}/modeles`)
  await page.getByRole('heading', { level: 1, name: 'Modèles de lettres gratuits' }).waitFor()
  await page.getByRole('link', { name: /Mise en demeure de payer le loyer/ }).click()
  await page.getByText('Je vous mets en demeure de régler cette somme').waitFor()
  await page.getByRole('button', { name: 'Copier la lettre' }).waitFor()
  assert.match(await page.title(), /Mise en demeure/)

  // Simulateur : DPE, loyer, trimestre, puis le résultat avec la formule.
  await page.goto(`${BASE}/simulateurs/revision-loyer`)
  await page.getByText('Question 1 sur 3').waitFor()
  await page.getByRole('button', { name: /De A à E/ }).click()
  await page.getByText('Question 2 sur 3').waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez un loyer entre 10 € et 20 000 €.').waitFor()
  await page.getByLabel('Loyer hors charges, en euros par mois').fill('800')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: '3e trimestre' }).click()
  // Dernier IRL du 3e trimestre ÷ celui de l'année d'avant (812,57 € avec l'indice publié en octobre 2026).
  await page.getByRole('heading', { name: /Nouveau loyer : \d/ }).waitFor()
  await page.getByText(/800,00 € × \d+,\d+ ÷ \d+,\d+ =/).waitFor()

  // Logement F ou G : révision interdite.
  await page.getByRole('button', { name: 'Faire un autre calcul' }).click()
  await page.getByRole('button', { name: 'F ou G' }).click()
  await page.getByRole('heading', { name: 'La révision est interdite' }).waitFor()
  await browser.close()
  assert.deepEqual(errors, [])
})
