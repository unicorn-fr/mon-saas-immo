import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, signedInContext, watch } from '../lib.mjs'

const rpc = (url, body, key) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: r.status === 202 ? null : await r.json() }))

/** Connexion aux IA (Mon compte) : clé montrée une fois, serveur MCP en lecture seule, retrait. */
test('connexion aux IA : clé, outils MCP en lecture seule, rien de privé, retrait', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)

  // Écran : onglet « Connexion aux IA », création d'une clé, montrée une fois.
  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/compte?onglet=ia`)
  await page.getByLabel('Nom de la connexion').fill('Claude')
  await page.getByRole('button', { name: 'Créer une clé' }).click()
  await page.getByText('Montrée une seule fois').waitFor()
  const url = await page.locator('code').first().innerText()
  assert.match(url, /\/api\/mcp\/bai_[\w-]{40,}$/)
  const key = url.split('/').pop()
  await page.getByRole('button', { name: 'J’ai copié ma clé' }).click()
  await page.getByText('Claude', { exact: true }).waitFor()
  await browser.close()
  assert.deepEqual(errors, [])

  // Serveur MCP : en-tête ou adresse.
  const mcp = `${API}/mcp`
  const init = await rpc(mcp, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, key)
  assert.equal(init.body.result.serverInfo.name, 'bailio')
  assert.equal((await rpc(mcp, { jsonrpc: '2.0', method: 'notifications/initialized' }, key)).status, 202)
  const tools = (await rpc(`${mcp}/${key}`, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).body.result.tools
  assert.ok(tools.every((t) => t.annotations.readOnlyHint))
  const call = async (name, args = {}) => (await rpc(`${mcp}/${key}`, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name, arguments: args } })).body.result
  const bail = await call('bail', { id: leaseId })
  assert.ok(!bail.isError, bail.content[0].text)
  const text = bail.content[0].text
  assert.match(text, /Haddad|rentCents/)
  assert.doesNotMatch(text, /data:image|tenantCode|"iban"/)

  // Lecture seule : écriture, export et compte refusés avec la clé.
  for (const [method, path] of [['POST', '/properties'], ['GET', '/money/export'], ['GET', '/account/ai-keys'], ['DELETE', `/leases/${leaseId}`]]) {
    const r = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : '{}' })
    assert.equal(r.status, 403, `${method} ${path}`)
  }

  // Retrait : la clé ne sert plus.
  const keys = await api('/account/ai-keys', { token })
  await api(`/account/ai-keys/${keys[0].id}`, { method: 'DELETE', token })
  assert.equal((await rpc(mcp, { jsonrpc: '2.0', id: 4, method: 'ping' }, key)).status, 401)
})
