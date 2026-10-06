import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Aides et dispositifs du logement : Visale pour un étudiant de 22 ans, Loc'Avantages en location vide, etc. */
test('aides et dispositifs : ce qui s’applique au logement, une aide ouverte à la fois', async () => {
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token, { furnished: false })
  const v = await api(`/properties/${propertyId}/aids`, { token })
  assert.deepEqual(v.aids.map((a) => [a.key, a.status]), [['VISALE', 'LIKELY'], ['LOC_AVANTAGES', 'CHECK'], ['RENOVATION', 'INFO'], ['HOUSING_AID', 'INFO']])
  assert.match(v.aids[0].reasons[0], /a 22 ans/)

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/logements/${propertyId}`)
    await page.getByRole('link', { name: /^Aides et dispositifs/ }).click()
    await page.getByRole('heading', { name: 'Aides et dispositifs', level: 1 }).waitFor()
    // Visale ouverte d'abord (semble possible), les autres repliées
    await page.getByText('Votre locataire a 22 ans', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: /^Visale/ }).getAttribute('aria-expanded'), 'true')
    assert.equal(await page.getByRole('link', { name: 'Garantie Visale (service-public.gouv.fr)' }).getAttribute('href'), 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33453')
    await page.getByRole('button', { name: /^Loc’Avantages/ }).click()
    await page.getByText('Signez une convention avec l’Anah', { exact: false }).waitFor()
    assert.equal(await page.getByText('Votre locataire a 22 ans', { exact: false }).count(), 0)
    await shot(page, 'aides')
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
