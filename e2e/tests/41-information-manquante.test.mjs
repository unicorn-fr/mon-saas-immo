import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, signedInContext, watch } from '../lib.mjs'

/**
 * Ce qui manque se demande sur place : envoyer une quittance sans signature ouvre « Il manque une information »,
 * la signature s'enregistre dans le profil, puis l'envoi reprend tout seul. Même chose pour l'email du locataire.
 */
test('quittance sans signature : signature demandée, enregistrée dans le profil, puis envoi', async () => {
  const { token } = await newAccount()
  const { leaseId, tenantId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api('/profile', { method: 'PUT', token, body: { signature: '' } })
  await api(`/leases/${leaseId}/receipt-auto`, { method: 'PUT', token, body: { auto: false } })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-10', amountCents: 56000, receivedAt: '2026-10-04' } })

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByRole('button', { name: 'Envoyer' }).first().click()
  await page.getByRole('button', { name: 'Oui, envoyer' }).click()
  await page.getByRole('heading', { name: 'Il manque une information' }).waitFor()
  // Sans signature, on ne peut pas continuer.
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()
  await page.getByText('Signez dans le cadre.').waitFor()
  const pad = page.getByRole('dialog').getByLabel('Signez ici avec la souris ou le doigt')
  const box = await pad.boundingBox()
  await page.mouse.move(box.x + 30, box.y + 80)
  await page.mouse.down()
  for (const [dx, dy] of [[90, 50], [160, 110], [230, 60]]) await page.mouse.move(box.x + dx, box.y + dy, { steps: 5 })
  await page.mouse.up()
  const before = logSize()
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()
  await page.getByText(/Envoyé à /).waitFor()
  await fromLog(/[Qq]uittance/g, before)
  assert.match((await api('/profile', { token })).profile.signature, /^data:image\/png;base64,/)

  // Email du locataire absent : demandé sur place, enregistré dans sa fiche, puis l'envoi reprend.
  await api(`/tenants/${tenantId}`, { method: 'PUT', token, body: { email: '' } })
  await page.reload()
  await page.getByRole('button', { name: 'Envoyer' }).first().click()
  await page.getByRole('button', { name: 'Oui, envoyer' }).click()
  await page.getByRole('heading', { name: 'Il manque une information' }).waitFor()
  await page.getByLabel('Email du locataire').fill('nouvel.email@example.fr')
  await page.getByRole('button', { name: 'Enregistrer et continuer' }).click()
  await page.getByText(/Envoyé à nouvel\.email@example\.fr/).waitFor()
  assert.equal((await api(`/tenants/${tenantId}`, { token })).file.email, 'nouvel.email@example.fr')
  await browser.close()
  assert.deepEqual(errors, [])
})
