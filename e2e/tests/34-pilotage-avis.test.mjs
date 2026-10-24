import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/**
 * Pilotage (réservé aux adresses ADMIN_EMAILS de l'API) et « Votre avis ».
 * La partie pilotage ne tourne que si E2E_ADMIN_EMAIL est donnée et figure dans ADMIN_EMAILS de l'API lancée.
 */
test('avis : envoyé par email à l’équipe, pilotage invisible pour un compte ordinaire', async () => {
  const { email, token } = await newAccount()
  const me = await api('/auth/me', { token })
  assert.equal(me.admin, false)
  const r = await fetch(`${API}/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(r.status, 404)
  await assert.rejects(api('/feedback', { method: 'POST', token, body: { message: '' } }), /400/)

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace`)
  const before = logSize()
  await page.getByRole('button', { name: 'Votre avis' }).click()
  await page.getByRole('dialog', { name: 'Votre avis' }).waitFor()
  await page.getByRole('button', { name: 'Utile, mais…' }).click()
  await page.getByLabel('Qu’est-ce qui vous manque ou vous a gêné ?').fill('Il me manque un rappel par SMS.')
  await shot(page, 'avis')
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click()
  await page.getByText('Merci, votre avis est bien arrivé.', { exact: false }).waitFor()
  const [m] = await fromLog(/Avis sur Bailio · Utile, mais…[\s\S]*?De : .*?(e2e\+[^\s]+@example\.fr)[\s\S]*?Il me manque un rappel par SMS\./g, before)
  assert.equal(m[1], email)
  // Le compte ordinaire n'a pas le lien du pilotage, et la page le renvoie vers son espace.
  await page.goto(`${BASE}/espace/compte`)
  await page.getByRole('heading', { name: 'Votre avis' }).waitFor()
  assert.equal(await page.getByRole('heading', { name: 'Pilotage de Bailio' }).count(), 0)
  await page.goto(`${BASE}/espace/pilotage`)
  await page.waitForURL(`${BASE}/espace`)
  await browser.close()
  assert.deepEqual(errors, [])
})

test('pilotage : chiffres réservés à l’adresse autorisée', { skip: !process.env.E2E_ADMIN_EMAIL && 'E2E_ADMIN_EMAIL non fournie' }, async () => {
  // Un propriétaire ordinaire avec un bail signé : il doit apparaître dans les chiffres.
  const owner = await newAccount()
  const { leaseId } = await completeLease(owner.token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token: owner.token })

  const { token } = await newAccount(process.env.E2E_ADMIN_EMAIL)
  const me = await api('/auth/me', { token })
  assert.equal(me.admin, true)
  const m = await api('/admin/metrics', { token })
  const value = (k) => m.totals.find((t) => t.key === k).value
  assert.ok(value('accounts') >= 1)
  assert.ok(value('leasesSigned') >= 1)
  assert.equal(m.funnel[0].label, 'Compte créé')
  assert.equal(m.weeks.length, 8)

  const browser = await launch()
  // Un visiteur venu de Google (navigateur ordinaire : les robots et navigateurs automatisés ne comptent pas),
  // puis un lien partagé marqué, puis une page de l'espace : seules les pages publiques sont comptées.
  const before = (await api('/admin/metrics', { token })).audience
  const count = (a, source) => a.sources.find((s) => s.source === source)?.visits ?? 0
  const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
  const vctx = await browser.newContext({ userAgent: ua })
  const visitor = await vctx.newPage()
  const counted = () => visitor.waitForResponse((r) => r.url().includes('/api/visits'))
  await Promise.all([counted(), visitor.goto(`${BASE}/`, { referer: 'https://www.google.fr/' })])
  await Promise.all([counted(), visitor.getByRole('link', { name: 'Sécurité' }).first().click()])
  await vctx.close()
  const tagged = await browser.newContext({ userAgent: ua })
  const tp = await tagged.newPage()
  await Promise.all([tp.waitForResponse((r) => r.url().includes('/api/visits')), tp.goto(`${BASE}/?utm_source=essai-e2e`)])
  await tagged.close()
  const after = (await api('/admin/metrics', { token })).audience
  assert.equal(count(after, 'Google'), count(before, 'Google') + 1)
  assert.equal(count(after, 'essai-e2e'), count(before, 'essai-e2e') + 1)
  assert.equal(after.homeViews30, before.homeViews30 + 2)
  assert.equal(after.visits30, before.visits30 + 2, 'la page Sécurité vue en naviguant n’est pas une nouvelle visite')

  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/compte`)
  await page.getByRole('heading', { name: 'Pilotage de Bailio' }).waitFor()
  await page.goto(`${BASE}/espace/pilotage`)
  await page.getByRole('heading', { name: 'Pilotage', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'Du compte au premier loyer' }).waitFor()
  await page.getByRole('heading', { name: 'D’où viennent les visiteurs' }).waitFor()
  await page.getByText('essai-e2e', { exact: true }).waitFor()
  await page.getByRole('table').waitFor()
  await shot(page, 'pilotage')
  await browser.close()
  assert.deepEqual(errors, [])
})
