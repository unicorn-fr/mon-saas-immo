import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Structures : un logement passe d'« En mon nom » à une SCI non familiale. Son bail vide dure alors 6 ans
 * et le congé pour reprise n'est plus proposé (loi du 6 juillet 1989, art. 10, 13 et 15).
 */
test('structures : SCI créée, logement rattaché, bail de 6 ans, pas de congé pour reprise', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token, { furnished: false })
  assert.equal((await api(`/leases/${leaseId}`, { token })).computed.durationMonths, 36)

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)

  // Première structure reprise du profil, avec le logement déjà créé
  await page.goto(`${BASE}/espace/structures`)
  await page.getByRole('heading', { name: 'En mon nom' }).waitFor()
  await page.getByRole('link', { name: 'Studio Sète' }).waitFor()

  // Nouvelle SCI, complétée dans sa fiche
  await page.getByRole('button', { name: 'Ajouter une structure' }).click()
  // Assistant : une question par écran
  await page.getByRole('heading', { name: 'Qui détient le logement ?' }).waitFor()
  await page.getByRole('button', { name: /^Une SCI/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('heading', { name: 'Les associés sont-ils tous de la même famille ?' }).waitFor()
  await page.getByRole('button', { name: /^Non/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Indiquez le nom de la société.').waitFor()
  await page.getByLabel('Nom de la société').fill('Les Tilleuls')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Bail vide de 6 ans au moins (société).').waitFor()
  await page.getByRole('button', { name: 'Créer la structure' }).click()
  await page.getByRole('heading', { name: 'SCI Les Tilleuls', level: 1 }).waitFor()
  // Fiche : une section à la fois
  await page.getByText('Siège et signataire à compléter').waitFor()
  await page.getByRole('button', { name: /^La société/ }).click()
  await page.getByLabel('Siège social').fill('2 rue Haute, 34000 Montpellier')
  await page.getByLabel('Représentée par').fill('Claire Dubois')
  await page.getByLabel('En qualité de').fill('Gérante')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.getByText('Structure enregistrée.').waitFor()
  await shot(page, 'structure-fiche')

  // Le logement rejoint la SCI depuis sa page
  await page.goto(`${BASE}/espace/logements/${propertyId}`)
  await page.getByRole('button', { name: /^Propriétaire/ }).click()
  await page.getByRole('dialog', { name: 'Changer de propriétaire' }).waitFor()
  await page.getByLabel('À qui appartient ce logement ?').selectOption({ label: 'SCI Les Tilleuls' })
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }).click()
  await page.getByRole('button', { name: /^Propriétaire.*SCI Les Tilleuls/ }).waitFor()

  // Bail en préparation : 6 ans, fin recalculée, congé pour reprise refusé
  const draft = await api(`/leases/${leaseId}`, { token })
  assert.equal(draft.computed.durationMonths, 72)
  assert.equal(draft.computed.resumptionAllowed, false)
  assert.equal(draft.columns.endDate, '2032-10-05')
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })

  await page.goto(`${BASE}/espace/baux/${leaseId}/courriers?type=NOTICE_TO_LEAVE`)
  await page.getByText('Le logement appartient à une société').waitFor()
  assert.equal(await page.getByRole('button', { name: 'Reprise pour y habiter' }).count(), 0)
  await assert.rejects(
    api(`/leases/${leaseId}/letters/preview`, { method: 'POST', token, body: { type: 'NOTICE_TO_LEAVE', reason: 'RESUMPTION', leaseEnd: '2032-10-05', beneficiary: { name: 'Claire Dubois', address: '8 rue de l’Aiguillerie', link: 'Moi-même' }, justification: 'Y habiter.' } }),
    /Une société ne peut pas donner congé pour reprendre le logement/,
  )

  // Nouveau logement : la liste propose les deux structures
  await page.goto(`${BASE}/espace/logements/nouveau`)
  const select = page.getByLabel('À qui appartient ce logement ?')
  await select.waitFor()
  const options = await select.locator('option').allTextContents()
  assert.ok(options.includes('En mon nom') && options.includes('SCI Les Tilleuls') && options.includes('Créer une nouvelle structure'), options.join(' | '))
  await shot(page, 'structure-choix-logement')

  await browser.close()
  assert.deepEqual(errors, [])
})
