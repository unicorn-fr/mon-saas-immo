import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Déclarer sans prise de tête : un parcours guidé (vérifier, déclarer sur impots.gouv.fr case par case, autres
 * démarches), la progression gardée pour l'année, tout le dossier en un PDF ; puis les fiches pratiques, situation par
 * situation, avec les documents à réunir, les liens officiels et les contacts.
 */
test('déclaration : parcours guidé, progression gardée, dossier PDF et fiches pratiques', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: true })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-11', amountCents: 56000, receivedAt: '2026-11-04' } })
  const year = 2026
  const view = await api(`/money/tax?year=${year}`, { token })
  const ids = view.filing.map((g) => g.id)
  // Premier bail meublé de l'année : formalités (SIRET, CFE), puis le micro-BIC, et l'occupation à déclarer.
  assert.deepEqual(ids.slice(0, 2), ['MEUBLE_DEBUT', 'MEUBLE_MICRO'])
  assert.ok(ids.includes('OCCUPATION'))
  assert.ok(view.contacts.some((c) => c.value === '0 809 401 401'))
  // À recopier : la case 5NI du micro-BIC, en euros entiers ; la 1447-C-SD pré-remplie est proposée pour ce meublé.
  assert.deepEqual(view.copy.map((g) => g.id), ['MEUBLE_MICRO'])
  assert.deepEqual(view.copy[0].entries.map((e) => [e.box, e.cents]), [['5NI', 56000]])
  assert.equal(view.forms.cfe.length, 1)
  const cfe = await fetch(`${API}/money/tax/1447-c-sd.pdf?propertyId=${view.forms.cfe[0].propertyId}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(cfe.status, 200)
  assert.equal(Buffer.from(await cfe.arrayBuffer()).subarray(0, 4).toString(), '%PDF')

  // Location vide sans loyer : pas de 2044 à remplir.
  assert.equal((await fetch(`${API}/money/tax/2044.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })).status, 404)
  const pdf = await fetch(`${API}/money/tax/fiche.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(pdf.status, 200)
  assert.equal(pdf.headers.get('content-type'), 'application/pdf')
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF')
  // Tout le dossier en un seul fichier : la fiche puis la 1447-C-SD pré-remplie.
  const dossier = await fetch(`${API}/money/tax/dossier.pdf?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(dossier.status, 200)
  assert.equal(Buffer.from(await dossier.arrayBuffer()).subarray(0, 4).toString(), '%PDF')
  // Parcours : l'année n'est pas finie ; rien ne manque au micro ; le régime peut se choisir (meublé sous le plafond).
  assert.equal(view.status.phase, 'EARLY')
  assert.equal(view.regimes.meuble.chosen, 'MICRO')
  assert.ok(view.checks.some((c) => c.id === 'rents' && c.tone === 'OK'))
  assert.equal(view.copy[0].rubric, 'Revenus des locations meublées non professionnelles (déclaration complémentaire 2042-C-PRO)')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/argent/declaration`)
  await page.getByRole('button', { name: String(year) }).click()
  // Rien ne manque : « Vérifier vos chiffres » est déjà fait, le parcours s'ouvre sur le choix du régime (meublé).
  await page.getByRole('button', { name: /Vérifier vos chiffres/ }).waitFor()
  await page.getByText('Vos revenus 2026 se déclarent au printemps 2027').waitFor()
  await page.getByRole('button', { name: /Micro-BIC/, pressed: true }).waitFor()
  await page.getByRole('button', { name: 'Garder ce choix et continuer' }).click()
  // Déclarer : la rubrique à cocher, puis « Copier » coche la case ; elle reste cochée au retour sur la page.
  await page.getByText('Revenus des locations meublées non professionnelles (déclaration complémentaire 2042-C-PRO)', { exact: true }).waitFor()
  await page.locator('.copy-row', { hasText: 'Case 5NI' }).getByRole('button', { name: 'Copier' }).click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '560')
  await page.locator('.copy-row', { hasText: 'Case 5NI' }).getByRole('button', { name: 'Copiée' }).waitFor()
  await shot(page, 'declaration-parcours')
  await page.reload()
  await page.getByRole('button', { name: String(year) }).click()
  await page.getByRole('button', { name: /Déclarer sur impots/ }).waitFor()
  await page.locator('.copy-row', { hasText: 'Case 5NI' }).getByRole('button', { name: 'Copiée' }).waitFor()
  await page.getByRole('button', { name: 'J’ai signé ma déclaration' }).click()
  // Autres démarches : SIRET et CFE du premier meublé, occupation ; cochées une à une.
  await page.getByText('Première année en meublé : les formalités').first().waitFor()
  await page.getByRole('checkbox', { name: 'C’est fait' }).first().check()
  const saved = await api(`/money/tax?year=${year}`, { token })
  assert.deepEqual(saved.progress.done, ['MEUBLE_MICRO:5NI:0'])
  assert.ok(saved.progress.filedAt)
  assert.deepEqual(saved.progress.tasks.sort(), ['MEUBLE_DEBUT:', 'regime'])
  assert.equal(saved.status.phase, 'FILED')
  const cfeDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger la 1447-C-SD' }).click()
  assert.equal((await cfeDownload).suggestedFilename(), '1447-c-sd.pdf')
  await page.getByRole('heading', { name: 'Fiches pratiques, situation par situation' }).waitFor()
  await page.locator('#depot strong', { hasText: 'Première année en meublé : les formalités' }).waitFor()
  assert.equal(await page.getByRole('link', { name: /Guichet unique des formalités/ }).first().getAttribute('href'), 'https://procedures.inpi.fr/')
  // Une situation à la fois : le micro-BIC et sa case 5NI.
  await page.getByRole('button', { name: 'Location meublée au micro-BIC', exact: true }).click()
  await page.locator('li', { hasText: 'Case 5NI' }).waitFor()
  const box = page.getByRole('checkbox', { name: /Votre numéro SIRET/ })
  await box.check()
  assert.ok(await box.isChecked())
  await page.getByRole('heading', { name: 'Qui contacter' }).waitFor()
  await shot(page, 'declaration-depot')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger la fiche (PDF)' }).click()
  assert.equal((await download).suggestedFilename(), `bailio-declaration-${year}.pdf`)
  await browser.close()
  assert.deepEqual(errors, [])
})
