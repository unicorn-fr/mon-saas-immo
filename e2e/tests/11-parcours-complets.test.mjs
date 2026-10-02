import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Parcours complets : tout ce que le bail exige est demandé dans l'ordre, une étape à la fois. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

const next = (page) => page.getByRole('button', { name: /^(Continuer|Enregistrer le logement)$/ }).click()

test('ajouter un logement : appartement meublé en copropriété, toutes les mentions du bail demandées', async () => {
  const { token } = await newAccount()
  const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/logements/nouveau`)
  // Adresse
  await page.getByLabel('Adresse', { exact: true }).fill('7 rue des Remparts, 34200 Sète')
  await page.getByLabel('Bâtiment, étage, porte').fill('2e étage, porte droite')
  await next(page)
  // Type de location : on ne peut pas passer sans répondre
  await page.getByText('Un appartement').click()
  await page.getByRole('button', { name: 'Meublé', exact: true }).click()
  await page.getByLabel('Identifiant fiscal du logement').fill('341234567890')
  await page.getByRole('button', { name: 'Non', exact: true }).click()
  await shot(page, 'parcours-logement-type')
  await next(page)
  // Copropriété (proposée car en copropriété)
  await page.getByLabel('Syndic').fill('Cabinet Lagarde')
  await page.getByLabel('Numéro de lot').fill('12')
  await page.getByLabel('Quote-part des parties communes').fill('245 / 10 000es')
  await next(page)
  // Construction et pièces
  await next(page)
  await page.getByText('Indiquez la période de construction').waitFor()
  await page.getByRole('button', { name: /1975/ }).click()
  await page.getByLabel('Surface habitable').fill('31')
  await page.getByRole('button', { name: '1', exact: true }).click()
  await page.getByText('Composition du logement').waitFor()
  await next(page)
  // Chauffage collectif : la répartition est exigée
  await page.getByRole('button', { name: 'Collectif', exact: true }).click()
  await page.getByRole('button', { name: 'Gaz', exact: true }).click()
  await page.getByRole('button', { name: 'Collective', exact: true }).click()
  await next(page)
  await page.getByText('Chauffage collectif : indiquez comment la consommation est répartie').waitFor()
  await page.getByLabel('Comment la consommation de chauffage est-elle répartie ?').fill('Selon les tantièmes de copropriété')
  await page.getByLabel('Comment la consommation d’eau chaude est-elle répartie ?').fill('Selon un compteur individuel')
  await next(page)
  // Annexes
  await page.getByRole('button', { name: 'Cave', exact: true }).click()
  await page.getByRole('button', { name: 'Ascenseur', exact: true }).click()
  await next(page)
  // Équipements
  await page.getByRole('button', { name: 'Plaques de cuisson', exact: true }).click()
  await page.getByLabel('Détecteurs de fumée').fill('1')
  await page.getByRole('button', { name: 'Antenne collective', exact: true }).click()
  await page.getByRole('button', { name: 'Fibre raccordée', exact: true }).click()
  await next(page)
  // Mobilier (proposé car meublé)
  await page.getByText('Les meubles obligatoires').waitFor()
  await next(page)
  // Diagnostics
  await page.getByRole('button', { name: 'D', exact: true }).first().click()
  await page.getByLabel('Entre (€ par an)').fill('620')
  await page.getByLabel('Et (€ par an)').fill('880')
  await page.getByLabel('Prix de l’année').fill('2023')
  await shot(page, 'parcours-logement-diagnostics')
  await next(page)
  // Photos : facultatif
  await page.getByRole('button', { name: 'Enregistrer le logement' }).click()
  await page.waitForURL(/\/espace\/logements\/[0-9a-f-]{36}$/)
  const id = page.url().split('/').pop()
  await ctx.close()
  assert.deepEqual(errors, [])
  const p = await api(`/properties/${id}`, { token })
  assert.equal(p.file.fiscalId, '341234567890')
  assert.equal(p.file.copro.syndic, 'Cabinet Lagarde')
  assert.equal(p.file.heating.split, 'Selon les tantièmes de copropriété')
  assert.equal(p.file.diagnostics.dpe.costMax, 880)
  assert.equal(p.file.tv, 'COLLECTIVE')
  assert.ok(p.file.roomList.length >= 3)
  assert.ok((await api('/contacts', { token })).some((c) => c.kind === 'SYNDIC' && c.name === 'Cabinet Lagarde'))
})
