import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { BASE, api, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Import par fichier : 3 lignes (2 logements, dont un avec 2 locataires), aperçu, confirmation, fiches créées avec leur loyer. */
const CSV = [
  'Nom du bien;Adresse;Code postal;Ville;Type;Loyer HC;Charges;Dépôt de garantie;Jour de paiement;Locataire;Email;Téléphone',
  'Studio Foch;12 rue Foch;69003;Lyon;Meublé;"650,00 €";"50,00";"1 300,00";5;DUPONT Jean;jean.dupont@exemple.fr;0612345678',
  'Studio Foch;12 rue Foch;69003;Lyon;Meublé;;;;;Claire Martin;claire.martin@exemple.fr;',
  'T2 Vieux Port;8 quai du Port;13002;Marseille;Vide;780;60;780;1;Karim Haddad;;',
].join('\n')

test('import par fichier : aperçu puis fiches créées avec leur loyer', async () => {
  const { token } = await newAccount()
  const file = path.join(os.tmpdir(), `bailio-import-${Date.now()}.csv`)
  fs.writeFileSync(file, CSV)

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/logements`)
  await page.getByRole('link', { name: /Importer depuis un fichier/ }).click()
  await page.getByRole('heading', { name: /Tous vos logements/ }).waitFor()

  await page.getByLabel('Fichier des logements et des locataires').setInputFiles(file)
  await page.getByRole('heading', { name: 'Vérifiez avant d’ajouter' }).waitFor()
  // Deux logements : les deux lignes de la même adresse sont regroupées.
  assert.equal(await page.locator('tbody tr').count(), 2)
  await page.getByRole('cell', { name: /Studio Foch/ }).waitFor()
  await page.getByText('Claire Martin').waitFor()
  await page.getByText('Karim Haddad').waitFor()
  await page.getByText(/Colonnes reconnues et ignorées/).click()
  await page.getByText(/Loyer HC \(Loyer\)/).waitFor()
  await shot(page, 'import-tableur-apercu')
  await page.getByRole('button', { name: 'Ajouter 2 logements' }).click()

  await page.getByRole('heading', { name: '2 logements et 3 locataires ajoutés' }).waitFor()
  await page.getByText(/« J’ai déjà un bail »/).waitFor()
  await shot(page, 'import-tableur-resultat')
  await page.getByRole('link', { name: 'Voir mes logements' }).waitFor()
  await browser.close()
  fs.rmSync(file, { force: true })
  assert.deepEqual(errors, [])

  const properties = await api('/properties', { token })
  assert.equal(properties.length, 2)
  const studio = properties.find((p) => p.name === 'Studio Foch')
  assert.ok(studio)
  const detail = await api(`/properties/${studio.id}`, { token })
  assert.equal(detail.file.address, '12 rue Foch')
  assert.equal(detail.file.postalCode, '69003')
  assert.equal(detail.file.furnished, true)
  assert.deepEqual(detail.file.rent, { rentCents: 65000, chargesCents: 5000, depositCents: 130000, paymentDay: 5 })
  const other = await api(`/properties/${properties.find((p) => p.id !== studio.id).id}`, { token })
  assert.deepEqual(other.file.rent, { rentCents: 78000, chargesCents: 6000, depositCents: 78000, paymentDay: 1 })

  const tenants = await api('/tenants', { token })
  assert.equal(tenants.length, 3)
  const onStudio = await api(`/properties/${studio.id}`, { token })
  assert.deepEqual(onStudio.tenants.map((t) => t.name).sort(), ['Claire Martin', 'Jean DUPONT'])
  assert.equal((await api('/leases', { token }).catch(() => [])).length ?? 0, 0)

  // Fichier sans colonne reconnue : refus clair.
  const form = new FormData()
  form.append('file', new Blob(['foo;bar\n1;2']), 'x.csv')
  const r = await fetch(`${process.env.E2E_API ?? 'http://localhost:5000/api'}/import/table/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  assert.equal(r.status, 400)
  assert.match((await r.json()).message ?? '', /Colonnes non reconnues/)
})
