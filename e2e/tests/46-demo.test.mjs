import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Démo publique : un espace d'exemple manipulable sans compte, tout dans le navigateur (aucune requête à l'API). */
test('démo sans compte : tâche du jour, relances, bail, impôts', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  const apiCalls = []
  watch(page, errors)
  page.on('request', (r) => r.url().includes('/api/') && r.method() !== 'GET' && !r.url().includes('/api/visits') && apiCalls.push(r.url()))

  await page.goto(`${BASE}/demo`)
  await page.getByRole('heading', { level: 1, name: /Essayez Bailio, sans compte/ }).waitFor()
  await page.getByText('Données d’exemple : rien n’est enregistré.').waitFor()

  await page.getByRole('button', { name: 'Noter le loyer reçu' }).click()
  await page.getByText(/Quittance envoyée par email à Alix Démonstration/).waitFor()
  await page.getByRole('button', { name: 'Demander l’attestation' }).click()
  await page.getByText(/Lien envoyé à Marc Exemplaire/).waitFor()
  await page.getByRole('button', { name: 'Réviser le loyer' }).click()
  await page.getByText(/812,57 €/).waitFor()
  await page.getByText(/\+1,57 %/).waitFor()

  // Loyers : le mois de Lyon est maintenant payé ; le calendrier des relances apparaît à l'activation.
  await page.getByRole('tab', { name: 'Loyers' }).click()
  assert.match(page.url(), /onglet=loyers/)
  await page.getByText('Relancer automatiquement un loyer impayé').click()
  await page.getByText('Mise en demeure', { exact: true }).waitFor()
  await page.getByText('J+15').waitFor()

  // Créer un bail : trois questions, puis le résumé des règles.
  await page.getByRole('tab', { name: 'Créer un bail' }).click()
  await page.getByText('Question 1 sur 3').waitFor()
  await page.getByRole('button', { name: /Vide/ }).click()
  await page.getByText('Question 2 sur 3').waitFor()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez un loyer entre 10 € et 20 000 €.').waitFor()
  await page.getByLabel('Loyer hors charges, en euros par mois').fill('800')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Question 3 sur 3').waitFor()
  await page.getByLabel('Date d’entrée du locataire').fill('2027-01-15')
  await page.getByRole('button', { name: 'Voir le bail' }).click()
  await page.getByText('Votre bail serait prêt à signer en ligne').waitFor()
  await page.getByText('3 ans, jusqu’au 14 janvier 2030').waitFor()
  await page.getByText(/800 € au plus/).waitFor()
  await page.getByText('6 mois avant la fin').waitFor()

  // Impôts : micro-foncier (case 4BE) puis réel.
  await page.getByRole('tab', { name: 'Impôts' }).click()
  await page.getByText(/Case 4BE/).waitFor()
  await page.getByRole('button', { name: /Réel/ }).click()
  await page.getByText(/case 4BA/).waitFor()

  assert.ok(await page.getByRole('link', { name: 'Créer mon bail gratuit' }).count())
  assert.deepEqual(apiCalls, [])
  await browser.close()
  assert.deepEqual(errors, [])
})
