import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const call = async (path, { method = 'GET', body, token, space } = {}) => {
  const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, ...(space ? { 'X-Bailio-Space': space } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, data: j.data, message: j.message }
}

/** Invitation envoyée par l'API, acceptée par le lien de connexion : renvoie la session et l'espace de l'invité. */
async function invite(ownerToken, role, propertyIds) {
  const email = `invite+${role.toLowerCase()}${Date.now()}@example.fr`
  const before = logSize()
  await api('/access', { method: 'POST', token: ownerToken, body: { email, role, propertyIds } })
  const [m] = await fromLog(/invitation\/([A-Za-z0-9_-]+)/g, before)
  const b2 = logSize()
  await call('/auth/invitation-link', { method: 'POST', body: { token: m[1] } })
  const [l] = await fromLog(/connexion\/lien\?jeton=([^\s)&]+)/g, b2)
  const v = await api('/auth/magic-link/verify', { method: 'POST', body: { token: decodeURIComponent(l[1]) } })
  return { token: v.sessionToken, space: v.space.id, email }
}

test('accès partagés : chaque invité ne voit que les logements partagés, selon son rôle', async () => {
  const owner = await newAccount()
  const { propertyId: A, leaseId } = await completeLease(owner.token, { furnished: false })
  const B = (await api('/properties', { method: 'POST', token: owner.token, body: { address: '1 rue Basse, 34000 Montpellier', label: 'Logement B' } })).id

  // Associé sur A : tout voir et modifier sur A, rien sur B, ni suppression ni nouveau logement
  const as = await invite(owner.token, 'ASSOCIATE', [A])
  assert.deepEqual((await call('/properties', as)).data.map((p) => p.id), [A])
  assert.equal((await call(`/properties/${B}`, as)).status, 404)
  assert.equal((await call(`/leases/${leaseId}`, as)).status, 200)
  for (const path of ['/today', '/money', '/money/tax', '/documents', '/tenants', '/structures']) assert.equal((await call(path, as)).status, 200, path)
  assert.equal((await call(`/properties/${A}`, { ...as, method: 'PUT', body: { keys: '3 clés' } })).status, 200)
  assert.equal((await call(`/properties/${B}`, { ...as, method: 'PUT', body: { keys: 'x' } })).status, 404)
  assert.equal((await call('/expenses', { ...as, method: 'POST', body: { propertyId: B, vendor: 'Plombier', amountCents: 10000, date: '2026-10-01', category: 'REPAIR' } })).status, 404)
  assert.equal((await call('/expenses', { ...as, method: 'POST', body: { propertyId: A, vendor: 'Plombier', amountCents: 10000, date: '2026-10-01', category: 'REPAIR' } })).status, 201)
  assert.equal((await call(`/properties/${A}`, { ...as, method: 'DELETE' })).status, 403)
  assert.equal((await call('/properties', { ...as, method: 'POST', body: { address: 'x' } })).status, 403)
  assert.equal((await call('/trash', as)).status, 403)
  // Le compte reste celui de l'invité
  assert.equal((await call('/auth/me', as)).data.email, as.email)

  // Comptable : lecture seule
  const ac = await invite(owner.token, 'ACCOUNTANT', [A, B])
  assert.equal((await call('/properties', ac)).data.length, 2)
  assert.equal((await call(`/properties/${A}`, { ...ac, method: 'PUT', body: { keys: 'y' } })).status, 403)

  // Intervenant : sa fiche d'intervention seulement
  const co = await invite(owner.token, 'CONTRACTOR', [A])
  assert.equal((await call('/properties', co)).status, 403)
  assert.equal((await call(`/leases/${leaseId}`, co)).status, 403)
  const view = await call('/shared/view', co)
  assert.equal(view.status, 200)
  assert.deepEqual(Object.keys(view.data.properties[0]).sort(), ['access', 'address', 'id', 'interventions', 'name', 'tenants'])

  // Accès retiré : coupé aussitôt
  const list = await api('/access', { token: owner.token })
  await api(`/access/${list.find((x) => x.role === 'ASSOCIATE').id}`, { method: 'DELETE', token: owner.token })
  assert.equal((await call('/properties', as)).status, 403)
  // Le propriétaire, lui, voit toujours tout
  assert.equal((await call('/properties', { token: owner.token })).data.length, 2)
})

test('accès partagés : inviter en trois questions, accepter, travailler dans l’espace partagé', async () => {
  const owner = await newAccount()
  const { propertyId } = await completeLease(owner.token, { furnished: false })
  await api('/properties', { method: 'POST', token: owner.token, body: { address: '1 rue Basse, 34000 Montpellier', label: 'Logement B' } })
  const browser = await launch()
  const errors = []

  // Le propriétaire invite depuis « Mon compte »
  const ctx = await signedInContext(browser, owner.token)
  const page = await ctx.newPage()
  watch(page, errors)
  await page.goto(`${BASE}/espace/compte/acces`)
  await page.getByRole('button', { name: 'Inviter quelqu’un' }).click()
  await page.getByRole('button', { name: /^Un associé/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  await page.getByText('Studio Sète', { exact: true }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
  const email = `associe+${Date.now()}@example.fr`
  await page.getByLabel('Email').fill(email)
  const before = logSize()
  await page.getByRole('button', { name: 'Envoyer l’invitation' }).click()
  await page.getByText('Invitation envoyée.').waitFor()
  await page.getByText(email).waitFor()
  await shot(page, 'acces-proprietaire')
  const [m] = await fromLog(/invitation\/([A-Za-z0-9_-]+)/g, before)
  await ctx.close()

  // L'invité ouvre l'invitation, reçoit son lien, arrive dans l'espace partagé
  const guest = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const g = await guest.newPage()
  watch(g, errors)
  await g.goto(`${BASE}/invitation/${m[1]}`)
  await g.getByRole('heading', { name: /vous invite/ }).waitFor()
  const b2 = logSize()
  await g.getByRole('button', { name: 'Recevoir mon lien de connexion' }).click()
  await g.getByText('Regardez vos emails.').waitFor()
  const [l] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, b2)
  await g.goto(l[1].replace(/^http:\/\/[^/]+/, BASE))
  await g.waitForURL(/\/espace$/)
  await g.getByText('Associé ou co-propriétaire', { exact: false }).first().waitFor()
  await g.goto(`${BASE}/espace/logements`)
  await g.getByText('Studio Sète').first().waitFor()
  assert.equal(await g.getByText('Logement B').count(), 0)
  await g.goto(`${BASE}/espace/logements/${propertyId}`)
  await g.getByRole('heading', { name: 'Studio Sète' }).waitFor()
  await shot(g, 'acces-invite')
  await g.getByRole('button', { name: 'Revenir à mon espace' }).click()
  await g.waitForURL(/\/espace$/)
  assert.equal(await g.getByRole('button', { name: 'Revenir à mon espace' }).count(), 0)
  await browser.close()
  assert.deepEqual(errors, [])
})
