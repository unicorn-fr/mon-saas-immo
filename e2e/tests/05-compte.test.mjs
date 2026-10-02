import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { API, BASE, api, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Mon compte : appareils connectés, export et suppression confirmés par un code reçu par email. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

test('sans code, ni export ni suppression', async () => {
  const { token } = await newAccount()
  for (const [method, path] of [['POST', '/account/export'], ['DELETE', '/account']]) {
    const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '000000' }) })
    assert.equal(r.status, 400, `${method} ${path} sans code valable`)
  }
  assert.ok(await api('/auth/me', { token }), 'le compte existe toujours')
})

test('appareils, export et suppression depuis « Mon compte »', async () => {
  const { token } = await newAccount()
  // Une deuxième connexion du même compte, sur un autre « appareil »
  const me = await api('/auth/me', { token })
  const before2 = logSize()
  await api('/auth/magic-link', { method: 'POST', body: { email: me.email } })
  const [m] = await fromLog(/connexion\/lien\?jeton=([^\s)&]+)/g, before2)
  const second = (await api('/auth/magic-link/verify', { method: 'POST', body: { token: decodeURIComponent(m[1]) } })).sessionToken

  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(BASE + '/espace/compte')
  await page.getByText('Appareils connectés').waitFor()
  await page.getByText('Cet appareil').waitFor()
  assert.ok((await page.getByText('Déconnecter', { exact: true }).count()) >= 1, 'l’autre appareil est listé')

  // Déconnecter les autres : la deuxième session ne fonctionne plus
  await page.getByText('Déconnecter tous les autres appareils').click()
  await page.getByText('Les autres appareils sont déconnectés.').waitFor()
  const r = await fetch(API + '/auth/me', { headers: { Authorization: `Bearer ${second}` } })
  assert.equal(r.status, 401)

  // Export : code envoyé par email, puis téléchargement
  await page.getByText('Tout exporter').click()
  let at = logSize()
  await page.getByRole('button', { name: 'Recevoir mon code' }).click()
  let [c] = await fromLog(/Code de confirmation : (\d{6})/g, at)
  await page.getByLabel('Code reçu par email').fill(c[1])
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger' }).click()
  assert.match((await download).suggestedFilename(), /bailio-mes-donnees\.json/)

  // Suppression : un mauvais code est refusé, le bon supprime le compte
  await page.getByText('Supprimer mon compte').click()
  at = logSize()
  await page.getByRole('button', { name: 'Recevoir mon code' }).click()
  ;[c] = await fromLog(/Code de confirmation : (\d{6})/g, at)
  await shot(page, 'compte-suppression-code')
  await page.getByLabel('Code reçu par email').fill(c[1])
  await page.getByRole('button', { name: 'Oui, tout supprimer' }).click()
  await page.waitForURL(BASE + '/')
  const gone = await fetch(API + '/auth/me', { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(gone.status, 401)
  await ctx.close()
  assert.deepEqual(errors.filter((e) => !e.includes('/auth/me')), [])
})
