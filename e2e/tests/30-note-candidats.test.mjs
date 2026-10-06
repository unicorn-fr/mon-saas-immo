import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const apply = (code, body) => api(`/candidature/${code}`, { method: 'POST', body: { consent: true, situation: 'EMPLOYEE', ...body } })

/** Note des candidats : classés sur les ressources, la garantie, les pièces et la date, jamais sur un autre critère. */
test('candidats : les dossiers les plus complets d’abord, avec les raisons', async () => {
  const { token } = await newAccount()
  const { propertyId } = await completeLease(token, { furnished: false })
  const { applyCode } = await api(`/properties/${propertyId}/apply-link`, { method: 'POST', token, body: { open: true } })
  // Reçue en premier mais moins complète : sans garant, loyer au-delà de 40 % des ressources
  await apply(applyCode, { firstNames: 'Inès', lastName: 'Martin', email: 'ines@example.fr', monthlyIncomeCents: 120000, guarantee: 'NONE' })
  await apply(applyCode, { firstNames: 'Paul', lastName: 'Roux', email: 'paul@example.fr', monthlyIncomeCents: 300000, guarantee: 'VISALE', dossierFacileUrl: 'https://www.dossierfacile.logement.gouv.fr/file/abc' })

  const v = await api(`/properties/${propertyId}/candidates`, { token })
  const by = Object.fromEntries(v.candidates.map((c) => [c.name, c.review]))
  assert.equal(by['Paul Roux'].level, 'SOLID')
  assert.equal(by['Inès Martin'].level, 'INCOMPLETE')

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace/logements/${propertyId}/candidats`)
    await page.getByText('Les dossiers les plus complets d’abord').waitFor()
    const names = await page.locator('section').filter({ hasText: /Dossier (solide|correct|à compléter)/ }).allInnerTexts()
    assert.match(names[0], /Paul Roux/)
    assert.match(names[0], /Dossier solide/)
    assert.match(names[1], /Inès Martin[\s\S]*Dossier à compléter[\s\S]*regardez la garantie/)
    await shot(page, 'note-candidats')
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
