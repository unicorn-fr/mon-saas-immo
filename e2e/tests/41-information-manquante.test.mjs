import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, signedInContext, watch } from '../lib.mjs'

/**
 * Ce qui manque se demande sur place : envoyer une quittance sans signature ouvre « Il manque une information »,
 * la signature s'enregistre dans le profil, puis l'envoi reprend tout seul.
 */
test('quittance sans signature : signature demandée, enregistrée dans le profil, puis envoi', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  // Propriétaire qui n'a jamais signé dans son profil : le bail signé n'a pas de signature à reprendre.
  await api('/profile', { method: 'PUT', token, body: { signature: '' } })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/receipt-auto`, { method: 'PUT', token, body: { auto: false } })
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-10', amountCents: 56000, receivedAt: '2026-10-04' } })

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  // Le premier envoi est refusé (400, signature manquante) : c'est ce refus qui ouvre la fenêtre.
  watch(page, errors, { allow: ['/receipts/2026-10/send', 'status of 400'] })
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

  await browser.close()
  assert.deepEqual(errors, [])
})
