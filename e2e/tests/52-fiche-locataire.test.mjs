import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Fiche du locataire en onglets (Général, Paiements, Documents, Actions) gardés dans ?onglet=, et liste des locataires. */
test('fiche du locataire : onglets Paiements et Actions, liste avec l’état du loyer', async () => {
  const { token } = await newAccount()
  const { leaseId, tenantId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)

  // Liste : colonnes et état du loyer.
  await page.goto(`${BASE}/espace/locataires`)
  await page.getByText('État du loyer', { exact: true }).waitFor()
  await page.getByText(/En retard : /).first().waitFor()
  await page.getByText(/Du \d{2}\/\d{2}\/\d{4} au/).first().waitFor()

  // Général par défaut, sans perte.
  await page.goto(`${BASE}/espace/locataires/${tenantId}`)
  await page.getByRole('tab', { name: 'Général' }).waitFor()
  await page.getByText('Coordonnées', { exact: true }).waitFor()
  await page.getByText('Garantie', { exact: true }).waitFor()
  await page.getByText('Son bail', { exact: true }).waitFor()

  // Paiements : un mois, la dette, le lien vers le bail.
  await page.getByRole('tab', { name: 'Paiements' }).click()
  assert.match(page.url(), /onglet=paiements/)
  await page.getByText('Octobre 2026', { exact: true }).waitFor()
  await page.getByText('Total dû').waitFor()
  await page.getByText('En retard', { exact: true }).first().waitFor()

  // Documents.
  await page.getByRole('tab', { name: 'Documents' }).click()
  await page.getByText('Documents du bail', { exact: true }).waitFor()
  await page.getByText('Justificatifs', { exact: true }).waitFor()

  // Actions : la grille, et une action mène à sa page.
  await page.goto(`${BASE}/espace/locataires/${tenantId}?onglet=actions`)
  await page.getByRole('tab', { name: 'Actions' }).waitFor()
  assert.equal(await page.getByRole('tab', { name: 'Actions' }).getAttribute('aria-selected'), 'true')
  await page.getByText('Automatismes', { exact: true }).waitFor()
  await shot(page, 'fiche-locataire-actions')
  await page.getByRole('link', { name: /Révision du loyer/ }).click()
  await page.waitForURL(new RegExp(`/espace/baux/${leaseId}/courriers\\?type=REVISION`))

  // Sans bail : l'action est visible, désactivée, avec sa raison.
  const alone = await api('/tenants', { method: 'POST', token, body: { firstNames: 'Léa', lastName: 'Martin', email: 'lea.martin@example.com' } })
  await page.goto(`${BASE}/espace/locataires/${alone.id}?onglet=actions`)
  await page.getByText('Pas de bail : créez-le d’abord.').first().waitFor()
  assert.equal(await page.getByRole('link', { name: /^Quittance/ }).count(), 0)
  await page.goto(`${BASE}/espace/locataires/${alone.id}?onglet=paiements`)
  await page.getByText(/Pas de bail signé/).waitFor()

  // Téléphone : aucun débordement horizontal.
  const phone = await signedInContext(browser, token, { width: 360, height: 800 })
  const p2 = await phone.newPage()
  watch(p2, errors)
  for (const q of ['', '?onglet=paiements', '?onglet=documents', '?onglet=actions']) {
    await p2.goto(`${BASE}/espace/locataires/${tenantId}${q}`)
    await p2.getByRole('tab', { name: 'Actions' }).waitFor()
    await p2.waitForLoadState('networkidle')
    assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `débordement à 360 px ${q}`)
  }
  await p2.goto(`${BASE}/espace/locataires`)
  await p2.getByText(/En retard : /).first().waitFor()
  assert.ok(await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'débordement de la liste à 360 px')
  await browser.close()
  assert.deepEqual(errors, [])
})
