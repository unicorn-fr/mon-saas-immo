import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, fromLog, launch, logSize, watch } from '../lib.mjs'

/** Questionnaire des testeurs : une question par écran, réponses envoyées par email à l'équipe, rien d'enregistré. */
test('avis testeur : 13 questions, une à la fois, puis envoi', async () => {
  const browser = await launch()
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/avis-testeur`)
  await page.getByRole('heading', { name: 'Votre avis sur Bailio', level: 1 }).waitFor()
  await page.getByText('Question 1 sur 13').waitFor()
  await page.getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Je loue un ou plusieurs logements' }).click()
  await page.getByRole('button', { name: 'Créer un bail' }).click()
  await page.getByRole('button', { name: 'Loyers et quittances' }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: 'Facile', exact: true }).click()
  await page.getByRole('button', { name: 'Réussi', exact: true }).click()
  await page.getByRole('button', { name: 'Rapide' }).click()
  await page.getByLabel('Qu’avez-vous le plus aimé ?').fill('La quittance automatique')
  await page.getByRole('button', { name: 'Continuer' }).click()
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Passer' }).click()
  await page.getByRole('button', { name: '5 à 10 € par mois' }).click()
  await page.getByText('Question 13 sur 13').waitFor()
  await page.getByLabel('Votre nom ou compte Instagram').fill('@testeur')
  const before = logSize()
  await page.getByRole('button', { name: 'Envoyer mes réponses' }).click()
  await page.getByRole('link', { name: /@bailio\.fr/ }).waitFor()
  const [m] = await fromLog(/Avis testeur · (\d+)\/10 · (\w+) · @testeur/g, before)
  assert.equal(m[1], '9')
  assert.equal(m[2], 'Promoteur')
  await fromLog(/Ce qui a plu : La quittance automatique/g, before)
  await browser.close()
  assert.deepEqual(errors, [])
})
