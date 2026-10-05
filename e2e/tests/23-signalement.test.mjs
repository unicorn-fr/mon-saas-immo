import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Le locataire signale un problème depuis son lien (photo comprise) ; le propriétaire le reçoit par email et dans
 * « Aujourd'hui », organise l'intervention, et le locataire en suit la date.
 */
test('signaler un problème : du lien du locataire à l’intervention organisée', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const link = await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
  const browser = await launch()
  const errors = []
  try {

  // Le locataire, sur son téléphone, sans compte
  const tctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const t = await tctx.newPage()
  watch(t, errors)
  t.setDefaultTimeout(15000)
  await t.goto(`${BASE}/locataire/${link.code}`)
  await t.getByRole('heading', { name: 'Votre location' }).waitFor()
  await t.getByRole('button', { name: 'Signaler un problème' }).click()
  await t.getByRole('heading', { name: 'Quel est le problème ?' }).waitFor()
  await t.getByRole('button', { name: 'Continuer' }).click()
  await t.getByText('Choisissez le type de problème.').waitFor()
  await t.getByRole('button', { name: 'Fuite ou dégât des eaux' }).click()
  await t.getByRole('button', { name: 'Continuer' }).click()
  // Fuite : geste immédiat, toujours urgente (pas de case à cocher)
  await t.getByText('Coupez l’arrivée d’eau').waitFor()
  assert.equal(await t.getByText('C’est urgent').count(), 0)
  await t.getByLabel('Où ? (facultatif)').fill('Salle de bain')
  await t.getByLabel('Ce qui se passe').fill('Le siphon du lavabo goutte depuis hier soir.')
  await t.getByRole('button', { name: 'Continuer' }).click()
  await t.getByRole('heading', { name: 'Ajoutez des photos' }).waitFor()
  await t.locator('input[type=file]').setInputFiles(new URL('../fixtures/selfie.jpg', import.meta.url).pathname)
  await t.getByText('selfie.jpg').waitFor()
  const before = logSize()
  await t.getByRole('button', { name: 'Envoyer le signalement' }).click()
  await t.getByText('Signalement envoyé à votre bailleur').waitFor()
  await t.getByText('Reçu par votre bailleur').waitFor()
  await shot(t, 'signalement-locataire')
  // Email au propriétaire, marqué urgent, avec le lien vers l'intervention
  const [m] = await fromLog(/intervention=([0-9a-f-]{36})/g, before)
  const id = m[1]

  // Propriétaire : tâche urgente en tête d'« Aujourd'hui »
  const today = await api('/today', { token })
  assert.equal(today.tasks[0].type, 'ISSUE')
  assert.equal(today.tasks[0].tone, 'error')
  assert.equal(today.tasks[0].interventionId, id)
  const list = await api(`/properties/${propertyId}/interventions`, { token })
  const it = list.find((x) => x.id === id)
  assert.equal(it.source, 'TENANT')
  assert.equal(it.title, 'Fuite ou dégât des eaux (Salle de bain)')
  assert.equal(it.issue.photoIds.length, 1)

  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  watch(page, errors)
  await page.goto(`${BASE}/espace`)
  await page.getByRole('button', { name: 'Organiser l’intervention' }).first().click()
  await page.getByRole('dialog').getByText('Urgent : signalé par votre locataire', { exact: false }).waitFor()
  await page.getByRole('img', { name: 'Photo 1 envoyée par le locataire' }).waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Prévue' }).click()
  const day = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)
  await page.getByLabel('Date prévue', { exact: true }).fill(day)
  await page.getByLabel('Nom de l’artisan').fill('Plomberie Martin')
  await page.getByText('Prévenir mon locataire de la date prévue').waitFor()
  const b2 = logSize()
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.getByText('Votre locataire est prévenu par email.', { exact: false }).waitFor()
  await shot(page, 'signalement-proprietaire')
  await fromLog(/Intervention prévue le/g, b2)

  // Le locataire voit la date, sans le nom de l'artisan
  await t.reload()
  const fr = day.split('-').reverse().join('/')
  await t.getByText(`Intervention prévue le ${fr}`).waitFor()
  assert.equal(await t.getByText('Plomberie Martin').count(), 0)
  // Plus de tâche dans « Aujourd'hui »
  assert.equal((await api('/today', { token })).tasks.some((x) => x.type === 'ISSUE'), false)

  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
