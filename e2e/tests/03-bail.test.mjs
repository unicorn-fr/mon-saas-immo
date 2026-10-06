import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Préparation d'un bail dans l'espace : « Il manque… » mène à la bonne étape ; détecteurs et clés. */
let browser
let account
before(async () => {
  browser = await launch()
  account = await newAccount()
})
after(() => browser?.close())

test('« Il manque… » : chaque lien ouvre la bonne étape de la bonne fiche', async () => {
  const { propertyId } = await completeLease(account.token)
  const t = await api('/tenants', { method: 'POST', token: account.token, body: { firstNames: 'Léa', lastName: 'Martin' } })
  const l = await api('/leases', { method: 'POST', token: account.token, body: { propertyId, tenantIds: [t.id], terms: {} } })
  for (const [viewport, label] of [[{ width: 1280, height: 900 }, 'ordinateur'], [{ width: 390, height: 844 }, 'téléphone']]) {
    const ctx = await signedInContext(browser, account.token, viewport)
    const page = await ctx.newPage()
    const errors = []
    watch(page, errors)
    await page.goto(`${BASE}/espace/baux/${l.id}/contrat`)
    await page.getByText(/Pour un bail complet, il manque/).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `débordement (${label})`)
    if (label === 'ordinateur') {
      await page.getByRole('link', { name: 'Compléter' }).first().click()
      await page.waitForURL(/#dates$/)
      await shot(page, 'contrat-etape-ciblee')
    }
    await ctx.close()
    assert.deepEqual(errors, [])
  }
})

test('fiche du logement : le curseur ne saute pas pendant la saisie à l’arrivée sur une étape', async () => {
  const p = await api('/properties', { method: 'POST', token: account.token, body: { address: '5 place de la Comédie, 34000 Montpellier', habitat: 'COLLECTIVE' } })
  const ctx = await signedInContext(browser, account.token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  // Frappe dès que le champ apparaît, plus longue que le placement automatique du curseur (0,45 s)
  await page.goto(`${BASE}/espace/logements/${p.id}/fiche#equipments`, { waitUntil: 'commit' })
  const keys = page.getByLabel('Clés et moyens d’accès remis')
  await keys.click()
  await keys.pressSequentially('3 clés, 1 badge', { delay: 80 })
  assert.equal(await keys.inputValue(), '3 clés, 1 badge')
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('fiche du logement : nombre de détecteurs de fumée et clés', async () => {
  const p = await api('/properties', { method: 'POST', token: account.token, body: { address: '3 place de la Comédie, 34000 Montpellier', habitat: 'COLLECTIVE' } })
  const ctx = await signedInContext(browser, account.token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/logements/${p.id}/fiche#equipments`)
  await page.getByLabel('Détecteurs de fumée installés').fill('2')
  await page.getByLabel('Clés et moyens d’accès remis').fill('3 clés, 1 badge')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  // Attendre la confirmation (et non un délai fixe) : sous charge, l'enregistrement peut prendre plus d'une seconde.
  await page.getByText('Enregistré.', { exact: true }).waitFor()
  const saved = await api(`/properties/${p.id}`, { token: account.token })
  const file = saved.file ?? saved.data ?? saved
  assert.equal(file.smokeDetectors, 2)
  assert.equal(file.keys, '3 clés, 1 badge')
  await ctx.close()
  assert.deepEqual(errors, [])
})
