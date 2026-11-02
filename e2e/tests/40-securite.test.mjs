import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, api, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Lien de connexion d'un compte (créé s'il n'existe pas), sans l'ouvrir. */
async function linkFor(email) {
  const before = logSize()
  await api('/auth/magic-link', { method: 'POST', body: { email, signup: true } })
  const [m] = await fromLog(/connexion\/lien\?jeton=([^\s)&]+)/g, before)
  return `${BASE}/connexion/lien?jeton=${m[1]}`
}

/**
 * Déjà connecté, on ouvre le lien de connexion d'un autre compte (par exemple reçu d'un tiers) : Bailio demande avant
 * de changer d'espace. « Rester » garde l'espace actuel ; « Ouvrir » bascule dans l'autre.
 */
test('lien de connexion d’un autre compte : on demande avant de changer d’espace', async () => {
  const a = await newAccount()
  const other = `e2e-autre+${Date.now()}@example.fr`
  const browser = await launch()
  const ctx = await signedInContext(browser, a.token, { width: 390, height: 844 })
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  const session = () => page.evaluate(() => localStorage.getItem('bailio.session'))

  await page.goto(await linkFor(other))
  await page.getByRole('heading', { name: 'Changer d’espace ?' }).waitFor()
  await page.getByText(a.email, { exact: true }).waitFor()
  await page.getByText(other, { exact: true }).first().waitFor()
  await shot(page, 'changer-d-espace')
  await page.getByRole('button', { name: 'Rester dans mon espace' }).click()
  await page.waitForURL(/\/espace$/)
  assert.equal(await session(), a.token)
  assert.equal((await api('/auth/me', { token: a.token })).email, a.email)

  await page.goto(await linkFor(other))
  await page.getByRole('button', { name: 'Ouvrir l’autre espace' }).click()
  await page.waitForURL(/\/espace/)
  const now = await session()
  assert.notEqual(now, a.token)
  assert.equal((await api('/auth/me', { token: now })).email, other)

  await ctx.close()
  await browser.close()
  assert.deepEqual(errors, [])
})
