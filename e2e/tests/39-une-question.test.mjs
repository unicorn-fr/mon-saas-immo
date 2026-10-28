import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, watch } from '../lib.mjs'

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

test('corrections : garant, reprise après rechargement, étage d’une maison, numéro +33 (0)', async () => {
  const base = BASE
  const call = api
  const lease = completeLease
  const account = newAccount
  // Numéro écrit avec le 0 entre parenthèses : lu comme un numéro français, appelable.
  const before = logSize()
  await call('/contact', { method: 'POST', body: { need: 'QUESTION', phone: '+33 (0)6 12 34 56 78' } })
  await fromLog(/À rappeler · Une question sur Bailio · 06 12 34 56 78[\s\S]*?tel:\+33612345678/g, before)

  const browser = await launch()
  const page = await browser.newPage()
  const errors = []
  watch(page, errors, { allow: ['/geo/'] })
  page.setDefaultTimeout(15000)

  // Candidature : rechargée avec ?q=5, « Postuler » repart de la première question ; nom du garant manquant signalé.
  const { token } = await account()
  const { propertyId } = await lease(token)
  const { applyCode } = await call(`/properties/${propertyId}/apply-link`, { method: 'POST', token, body: { open: true } })
  await page.goto(`${base}/candidature/${applyCode}?q=5`)
  await page.getByRole('button', { name: 'Postuler' }).click()
  const at = (n) => page.getByText(`Question ${n} sur 11`).waitFor()
  await at(1)
  assert.match(await page.title(), /^Comment vous appelez-vous \? · Bailio$/)
  await page.getByLabel('Prénom', { exact: true }).fill('Léa')
  await page.getByLabel('Nom', { exact: true }).fill('Martin')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await at(2)
  await page.getByLabel('Email').fill('lea.martin@example.fr')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await at(3)
  await page.getByRole('button', { name: 'Passer' }).click()
  await at(4)
  await page.getByRole('button', { name: 'Salarié' }).click()
  await at(5)
  await page.getByLabel('Revenus nets du foyer, par mois').fill('2400')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await at(6)
  await page.getByRole('button', { name: '1', exact: true }).click()
  await at(7)
  await page.getByRole('button', { name: 'Une personne se porte caution' }).click()
  await page.getByRole('heading', { name: 'Qui se porte caution ?' }).waitFor()
  await page.getByLabel('Prénom du garant').fill('Marc')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez le prénom et le nom de votre garant.').waitFor()
  await page.getByLabel('Nom du garant', { exact: true }).fill('Roche')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Quand souhaitez-vous entrer ?' }).waitFor()

  // Tunnel : l'étage saisi pour un appartement est retiré si c'est finalement une maison.
  await page.goto(`${base}/commencer`)
  await page.getByRole('button', { name: 'Vide' }).first().click()
  await page.getByLabel('Adresse', { exact: true }).fill('5 rue des Hortensias, 34200 Sète')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('button', { name: 'Un appartement', exact: true }).click()
  await page.getByRole('button', { name: 'Non', exact: true }).click()
  await page.getByLabel('Surface habitable').fill('48')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByLabel('Bâtiment, étage, porte (facultatif)').fill('Bâtiment B, 2e étage')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('heading', { name: 'Quand a-t-il été construit ?' }).waitFor()
  const draftToken = await page.evaluate(() => localStorage.getItem('bailio.draft'))
  const property = async () => (await fetch(`${base.replace(/\/$/, '')}/api/drafts/current`, { headers: { 'X-Draft-Token': draftToken } }).then((r) => r.json())).data.data.property
  for (let i = 0; i < 20 && (await property()).floorDoor !== 'Bâtiment B, 2e étage'; i++) await new Promise((r) => setTimeout(r, 250))
  assert.equal((await property()).floorDoor, 'Bâtiment B, 2e étage')
  await page.goto(`${base}/commencer/logement?q=2`)
  await page.getByRole('button', { name: 'Une maison', exact: true }).click()
  await page.getByRole('heading', { name: 'Est-il en copropriété ?' }).waitFor()
  for (let i = 0; i < 20 && (await property()).floorDoor !== undefined; i++) await new Promise((r) => setTimeout(r, 250))
  assert.equal((await property()).floorDoor, undefined)
  assert.equal((await property()).habitat, 'INDIVIDUAL')
  await browser.close()
  assert.deepEqual(errors, [])
})
