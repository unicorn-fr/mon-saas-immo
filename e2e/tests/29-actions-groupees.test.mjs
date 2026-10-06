import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Actions groupées : assurances demandées et quittances envoyées en une fois, après relecture de la liste. */
test('actions groupées : liens d’assurance et quittances en une fois', async () => {
  const { token } = await newAccount()
  const a = await completeLease(token, { furnished: false })
  const b = await completeLease(token, { furnished: true })
  for (const l of [a, b]) await api(`/leases/${l.leaseId}/sign`, { method: 'POST', token })
  // Quittance automatique coupée sur A : le loyer reçu n'envoie rien, la quittance reste à envoyer
  await api(`/leases/${a.leaseId}/receipt-auto`, { method: 'PUT', token, body: { auto: false } })
  const period = new Date().toISOString().slice(0, 7)
  await api(`/leases/${a.leaseId}/payments`, { method: 'POST', token, body: { period } })

  const v = await api('/bulk', { token })
  assert.equal(v.groups.INSURANCE.length, 2)
  assert.deepEqual(v.groups.RECEIPTS.map((r) => [r.leaseId, r.period]), [[a.leaseId, period]])

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(20000)
    await page.goto(`${BASE}/espace/actions`)
    await page.getByRole('heading', { name: 'Actions groupées', level: 1 }).waitFor()
    // Premier groupe ouvert : les assurances (pas d'impayé)
    await page.getByRole('button', { name: /^Demander les attestations d’assurance/ }).waitFor()
    assert.equal(await page.getByRole('button', { name: /^Demander les attestations d’assurance/ }).getAttribute('aria-expanded'), 'true')
    await page.getByText('Aucune attestation enregistrée').first().waitFor()
    const before = logSize()
    await page.getByRole('button', { name: 'Envoyer le lien à 2 locataires' }).click()
    await page.getByText('C’est fait : 2 envois.').waitFor()
    assert.equal(await page.getByText('Lien envoyé').count(), 2)
    const links = await fromLog(/(http:\/\/[^\s]+\/locataire\/[A-Za-z0-9]+)/g, before)
    assert.equal(new Set(links.map((m) => m[1])).size, 2)
    await shot(page, 'actions-groupees')

    // Quittances : une seule, celle de A
    await page.getByRole('button', { name: /^Envoyer les quittances/ }).click()
    const b2 = logSize()
    await page.getByRole('button', { name: 'Envoyer 1 quittance' }).click()
    await page.getByText('Quittance envoyée').waitFor()
    await fromLog(/[Qq]uittance/g, b2)
    assert.equal((await api('/bulk', { token })).groups.RECEIPTS.length, 0)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
