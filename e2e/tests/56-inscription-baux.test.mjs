import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { BASE, SIGNATURE, api, launch, shot, signupQuestions, watch } from '../lib.mjs'

/**
 * Venir de Qalimo sans rien perdre : inscription en questions (vue du tableau de bord, profil, téléphone), arrivée
 * sur le tableau de bord puis l'import depuis l'espace, puis import d'un fichier dont un logement loué : son bail en cours est repris, noté
 * « signé, importé », avec la fin de sa période en cours ; le bail signé s'ajoute ensuite depuis sa page.
 */
const CSV = [
  'Nom du bien;Adresse;Code postal;Ville;Type;Loyer HC;Charges;Dépôt de garantie;Jour de paiement;Locataire;Email;Date d’entrée;Date de fin du bail',
  'T3 Gambetta;5 rue Gambetta;69003;Lyon;Vide;700;80;700;5;Jean Roux;jean.roux@exemple.fr;15/03/2020;',
  'Studio Part-Dieu;9 rue Garibaldi;69003;Lyon;Meublé;520;40;1040;1;Léa Bon;lea.bon@exemple.fr;01/09/2019;31/08/2022',
].join('\n')

test('inscription en questions, puis import avec le bail en cours', async () => {
  const browser = await launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)

  await page.goto(`${BASE}/inscription`)
  // Locataire : pas de compte, renvoyé vers ce que son lien permet.
  await page.getByRole('button', { name: /Je suis locataire/ }).click()
  await page.getByRole('heading', { name: /Pas besoin de/ }).waitFor()
  await page.getByRole('button', { name: 'Retour' }).click()

  const email = `qalimo+${Date.now()}@example.fr`
  const link = await signupQuestions(page, { email, homes: 5, tool: 'Qalimo', phone: '06 12 34 56 78' })
  await page.getByText(/importez ensuite votre fichier/).waitFor()
  await page.goto(link)
  // Toujours le tableau de bord d'abord ; l'import du fichier se lance depuis l'espace.
  await page.waitForURL(/\/espace$/)
  await page.getByRole('link', { name: /Importer mon fichier/ }).click()
  await page.waitForURL(/\/espace\/logements\/importer/)
  await page.getByRole('heading', { name: /Tous vos logements/ }).waitFor()

  const token = await page.evaluate(() => localStorage.getItem('bailio.session'))
  const me = await api('/auth/me', { token })
  assert.equal(me.firstName, 'Claire')
  assert.equal(me.lastName, 'Martin')
  assert.equal(me.viewMode, 'PORTFOLIO')

  const file = path.join(os.tmpdir(), `bailio-baux-${Date.now()}.csv`)
  fs.writeFileSync(file, CSV)
  await page.getByLabel('Fichier des logements et des locataires').setInputFiles(file)
  await page.getByRole('heading', { name: 'Vérifiez avant d’ajouter' }).waitFor()
  await page.getByText('Depuis le 15/03/2020').waitFor()
  await page.getByText('Bail terminé le 31/08/2022, non repris').waitFor()
  assert.equal(await page.getByLabel('Reprendre les baux en cours (déjà signés)').isChecked(), true)
  await shot(page, 'import-baux-apercu')
  await page.getByRole('button', { name: 'Ajouter 2 logements' }).click()
  await page.getByRole('heading', { name: '2 logements, 2 locataires et 1 bail en cours ajoutés' }).waitFor()
  fs.rmSync(file, { force: true })

  // Le bail repris : statut importé, loyer, locataire, fin de la période en cours (3 ans, tacite reconduction).
  const properties = await api('/properties', { token })
  const t3 = properties.find((p) => p.name === 'T3 Gambetta')
  const detail = await api(`/properties/${t3.id}`, { token })
  const leaseId = detail.leases.find((l) => l.status === 'IMPORTED')?.id
  assert.ok(leaseId, 'bail importé')
  const lease = await api(`/leases/${leaseId}`, { token })
  assert.equal(lease.columns.rentCents, 70000)
  assert.equal(lease.columns.chargesCents, 8000)
  assert.equal(lease.columns.depositCents, 70000)
  assert.equal(lease.columns.startDate, '2020-03-15')
  assert.equal(lease.columns.endDate, '2029-03-14')
  assert.deepEqual(lease.tenants.map((x) => x.name), ['Jean Roux'])
  const studio = await api(`/properties/${properties.find((p) => p.name === 'Studio Part-Dieu').id}`, { token })
  assert.equal(studio.leases.length, 0)

  // Page du bail : le bail signé s'ajoute en un clic.
  const img = path.join(os.tmpdir(), `bail-signe-${Date.now()}.png`)
  fs.writeFileSync(img, Buffer.from(SIGNATURE.split(',')[1], 'base64'))
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByRole('button', { name: 'Ajouter le bail signé' }).click()
  await page.locator('input[type=file]').setInputFiles(img)
  await page.getByRole('dialog').getByRole('button', { name: 'Ajouter', exact: true }).click()
  await page.getByText('Document ajouté.').waitFor()
  await page.getByRole('button', { name: 'Ajouter le bail signé' }).waitFor({ state: 'detached' })
  const docs = await api(`/leases/${leaseId}`, { token })
  assert.ok(docs.leaseDocumentId, 'bail signé joint')
  fs.rmSync(img, { force: true })
  await browser.close()
  assert.deepEqual(errors, [])
})
