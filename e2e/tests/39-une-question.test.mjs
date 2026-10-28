import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, fromLog, launch, logSize, shot, watch } from '../lib.mjs'

/**
 * Formulaires sans friction : une question par écran. Le contact tient en deux questions (le besoin, le numéro) et la
 * demande part aussitôt par email à l'équipe, avec un bouton pour appeler.
 */
test('contact : deux questions, la demande arrive avec le numéro à appeler', async () => {
  await assert.rejects(api('/contact', { method: 'POST', body: { need: 'LEASE', phone: '12' } }), /400 Ce numéro ne semble pas complet/)
  const browser = await launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const errors = []
  // Le numéro incomplet est refusé exprès : ce refus n'est pas une erreur.
  watch(page, errors, { allow: ['/api/contact', 'status of 400'] })
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/contact`)
  await page.getByRole('heading', { name: 'De quoi avez-vous besoin ?' }).waitFor()
  await page.getByText('Question 1 sur 2').waitFor()
  await shot(page, 'contact-besoin')
  // Un choix passe tout seul à la question suivante.
  await page.getByRole('button', { name: 'Faire mon bail' }).click()
  await page.getByRole('heading', { name: 'À quel numéro vous rappeler ?' }).waitFor()
  await page.getByLabel('Votre numéro de téléphone').fill('06 12 34')
  await page.getByRole('button', { name: 'Être rappelé' }).click()
  await page.getByText('Ce numéro ne semble pas complet', { exact: false }).waitFor()
  await page.getByLabel('Votre numéro de téléphone').fill('06.12.34.56.78')
  await shot(page, 'contact-numero')
  const before = logSize()
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: /C’est noté/ }).waitFor()
  const [m] = await fromLog(/À rappeler · Faire mon bail · (06 12 34 56 78)[\s\S]*?(tel:\+33612345678)/g, before)
  assert.equal(m[1], '06 12 34 56 78')
  // Plutôt par email : la même question, pour une adresse.
  await page.goto(`${BASE}/contact`)
  await page.getByRole('button', { name: 'Une question sur Bailio' }).click()
  await page.getByRole('button', { name: 'Plutôt par email' }).click()
  await page.getByLabel('Votre email').fill('lea@example.fr')
  const before2 = logSize()
  await page.getByRole('button', { name: 'Être recontacté' }).click()
  await page.getByRole('heading', { name: /C’est noté/ }).waitFor()
  await fromLog(/À recontacter · Une question sur Bailio · lea@example\.fr/g, before2)
  await browser.close()
  assert.deepEqual(errors, [])
})
