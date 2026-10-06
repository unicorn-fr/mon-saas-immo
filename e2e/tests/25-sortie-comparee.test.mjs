import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

/** État des lieux de sortie : chaque élément en regard de son état d'entrée, évolution signalée, PDF comparatif. */
test('état des lieux de sortie comparé à l’entrée', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })

  // Entrée signée : compteur et premier élément de la première pièce relevés
  const { id: entryId } = await api(`/leases/${leaseId}/inventories`, { method: 'POST', token, body: { kind: 'ENTRY' } })
  const entry = (await api(`/inventories/${entryId}`, { token })).data
  entry.meters[0].index = '12000'
  entry.rooms[0].items[0] = { ...entry.rooms[0].items[0], state: 'Bon', note: 'Parquet ciré' }
  entry.rooms[0].items[1] = { ...entry.rooms[0].items[1], state: 'Neuf' }
  await api(`/inventories/${entryId}`, { method: 'PUT', token, body: { ...entry, signatures: { landlord: PNG, tenant: PNG } } })
  await api(`/inventories/${entryId}/sign`, { method: 'POST', token })
  const room = entry.rooms[0].name
  const [first, second] = entry.rooms[0].items.map((i) => i.label)

  const { id } = await api(`/leases/${leaseId}/inventories`, { method: 'POST', token, body: { kind: 'EXIT' } })
  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/edl/${id}`)
    await page.getByRole('button', { name: 'Commencer' }).click()
    await page.getByText('À l’entrée : 12000').waitFor()
    await page.getByLabel('Index relevé').first().fill('15250')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: /^Ouvrir / }).click()
    await page.getByText('Sous chaque élément : son état à l’entrée.', { exact: false }).waitFor()
    const box1 = page.locator('div').filter({ has: page.getByText(first, { exact: true }) }).filter({ has: page.getByText('À l’entrée :') }).last()
    await box1.getByText('Parquet ciré', { exact: false }).waitFor()
    await box1.getByRole('button', { name: 'Mauvais' }).click()
    await box1.getByText('À regarder').waitFor()
    const box2 = page.locator('div').filter({ has: page.getByText(second, { exact: true }) }).filter({ has: page.getByText('À l’entrée :') }).last()
    await box2.getByRole('button', { name: 'Neuf' }).click()
    await box2.getByText('Identique').waitFor()
    await page.getByText('Enregistré', { exact: true }).waitFor()
    await shot(page, 'edl-sortie-comparee')

    const exit = (await api(`/inventories/${id}`, { token })).data
    assert.equal(exit.rooms[0].items[0].state, 'Mauvais')
    await api(`/inventories/${id}`, { method: 'PUT', token, body: { ...exit, newAddress: '3 rue Neuve, 34000 Montpellier', signatures: { landlord: PNG, tenant: PNG } } })
    await api(`/inventories/${id}/sign`, { method: 'POST', token })
    const r = await fetch(`${API}/inventories/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    const text = execFileSync('pdftotext', ['-layout', '-', '-'], { input: Buffer.from(await r.arrayBuffer()) }).toString()
    assert.match(text, /Évolutions depuis l’entrée/iu)
    assert.match(text, new RegExp(`${room}, ${first} : Bon à l’entrée, Mauvais à la sortie`))
    assert.match(text, /3250/)
    assert.match(text, /À regarder/)
    assert.match(text, /Identique/)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
