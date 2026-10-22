import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, fromLog, launch, logSize, watch } from '../lib.mjs'

/**
 * Corrections de l'audit par personas (docs/audit/audit-personas-2026-10.md) : email mal tapé (suggestion et
 * « Modifier mon adresse »), garage depuis l'accueil, erreurs qui disparaissent une fois corrigées, curseur sur
 * la première erreur, alerte de surface sous 9 m².
 */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

async function logement(page, { surface = '42' } = {}) {
  await page.goto(BASE + '/commencer')
  await page.getByRole('button', { name: 'Vide' }).first().click()
  await page.getByRole('heading', { name: 'Où se trouve le logement ?' }).waitFor()
  await page.getByLabel('Adresse').fill('12 rue de la Loge, 34000 Montpellier')
  await page.getByLabel('Surface habitable').fill(surface)
  for (const name of ['2', 'Un appartement', 'Non', '1990 à 2005', 'Individuel', 'Électricité', 'Individuelle']) await page.getByRole('button', { name, exact: true }).first().click()
}

test('tunnel : erreurs, curseur, surface, email mal tapé puis corrigé', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)

  // Envoi vide : le curseur va sur l'adresse ; chaque question à choix est reliée à son message.
  await page.goto(BASE + '/commencer')
  await page.getByRole('button', { name: 'Vide' }).first().click()
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-invalid') === 'true')
  const rooms = page.getByRole('group', { name: 'Nombre de pièces principales' })
  assert.match(await rooms.getAttribute('aria-describedby'), /rooms-help/)
  // Une réponse donnée efface son erreur tout de suite.
  await page.getByLabel('Adresse').fill('12 rue de la Loge, 34000 Montpellier')
  await page.getByText('Indiquez l\'adresse du logement.').waitFor({ state: 'detached' })
  await page.getByRole('button', { name: '2', exact: true }).click()
  await page.getByText('Choisissez le nombre de pièces.').waitFor({ state: 'detached' })

  // Surface sous 9 m² : alerte, sans blocage.
  await page.getByLabel('Surface habitable').fill('4,5')
  await page.getByText('Moins de 9 m²', { exact: false }).waitFor()
  await page.getByLabel('Surface habitable').fill('42')
  assert.equal(await page.getByText('Moins de 9 m²', { exact: false }).count(), 0)

  await logement(page)
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('heading', { name: 'Qui signe le bail ?' }).waitFor()
  // Personnes : envoi vide, curseur sur le premier champ, l'erreur part dès qu'on écrit.
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-invalid') === 'true')
  await page.getByLabel('Prénom', { exact: true }).nth(0).fill('Monique')
  await page.getByText('Votre prénom est obligatoire.').waitFor({ state: 'detached' })
  await page.getByLabel('Nom', { exact: true }).nth(0).fill('Bernard')
  await page.getByLabel('Votre adresse').fill('3 place de la Comédie, 34000 Montpellier')
  await page.getByLabel('Prénom', { exact: true }).nth(1).fill('Karim')
  await page.getByLabel('Nom', { exact: true }).nth(1).fill('Haddad')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('heading', { name: 'Quel est le loyer ?' }).waitFor()
  await page.getByLabel('Loyer hors charges').fill('780')
  await page.getByLabel('Charges', { exact: true }).fill('60')
  await page.getByRole('button', { name: 'Une provision' }).click()
  await page.getByLabel("Date d'entrée du locataire").fill('2026-12-01')
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.getByRole('button', { name: 'Mon bail est correct' }).click()

  // Email mal tapé : suggestion, puis envoi à la mauvaise adresse et correction sans recharger.
  await page.getByLabel('Votre email').fill('paul.durand@gmial.com')
  await page.getByText('Vouliez-vous dire').waitFor()
  await page.getByRole('button', { name: 'Continuer mon bail' }).click()
  await page.getByText('Regardez vos emails.').waitFor()
  await page.getByRole('button', { name: 'Modifier mon adresse' }).click()
  assert.equal(await page.getByLabel('Votre email').inputValue(), 'paul.durand@gmial.com')
  await page.getByRole('button', { name: 'paul.durand@gmail.com' }).click()
  assert.equal(await page.getByLabel('Votre email').inputValue(), 'paul.durand@gmail.com')
  assert.equal(await page.getByText('Vouliez-vous dire').count(), 0)
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('garage : de l’accueil à « Ajouter un logement » avec le garage déjà choisi', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(BASE + '/')
  await page.getByRole('button', { name: 'Garage', exact: true }).click()
  await page.getByRole('link', { name: 'Créer ce bail' }).click()
  await page.getByRole('heading', { name: 'Créez votre espace.' }).waitFor()
  const email = `garage+${Date.now()}@example.fr`
  await page.getByLabel('Email').fill(email)
  const before = logSize()
  await page.getByRole('button', { name: 'Créer mon espace' }).click()
  const [link] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
  await page.goto(link[1].replace(/^http:\/\/[^/]+/, BASE))
  await page.waitForURL(/\/espace\/logements\/nouveau/)
  assert.equal(await page.getByRole('button', { name: 'Un garage, un box ou une place' }).getAttribute('aria-pressed'), 'true')
  // Le tunnel propose aussi le garage.
  await page.goto(BASE + '/commencer')
  await page.getByRole('link', { name: 'Je loue un garage, un box ou une place' }).waitFor()
  await ctx.close()
  assert.deepEqual(errors, [])
})
