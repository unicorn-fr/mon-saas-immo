import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** « Que se passe-t-il ? » : de la situation au bon document, l'étape se coche toute seule. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

test('mon locataire part : accusé du congé enregistré, étape cochée, état des lieux proposé ensuite', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace`)
  await page.getByRole('link', { name: 'Que se passe-t-il ?' }).first().click()
  await page.getByRole('button', { name: /Mon locataire part/ }).click()
  await page.waitForURL(`**/espace/baux/${leaseId}/parcours/DEPARTURE`)
  await page.getByText('Accuser réception du congé').waitFor()
  await page.getByRole('button', { name: 'Préparer le document' }).first().click()
  await page.waitForURL('**/courriers?type=TENANT_NOTICE')
  await page.getByLabel('Date de réception de la lettre de congé').fill('2026-11-03')
  await page.getByRole('button', { name: /^Enregistrer/ }).first().click()
  await page.getByText('Courrier enregistré', { exact: false }).first().waitFor()
  await page.goto(`${BASE}/espace/baux/${leaseId}/parcours/DEPARTURE`)
  await page.getByText(/Fait le 0?\d\/\d{2}\/\d{4}/).first().waitFor()
  await page.getByText('Au plus tard le 03/12/2026').first().waitFor() // un mois de préavis (zone tendue)
  await shot(page, 'parcours-depart')
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('impayé : le commandement de payer se coche à la main', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/journeys/UNPAID/command/done`, { method: 'POST', token, body: { done: true } })
  const j = await api(`/leases/${leaseId}/journeys/UNPAID`, { token })
  assert.equal(j.steps.find((s) => s.key === 'command').doneAt?.length, 10)
  const sale = await api(`/leases/${leaseId}/journeys/SALE`, { token })
  assert.ok(sale.steps[0].due, 'date limite du congé')
})

test('accueil : départ annoncé puis solde de tout compte, sans rien ressaisir', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const received = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10)
  await api(`/leases/${leaseId}/letters`, { method: 'POST', token, body: { type: 'TENANT_NOTICE', receivedDate: received, reduced: true, reducedReason: 'logement situé en zone tendue' } })
  let today = await api('/today', { token })
  assert.ok(today.tasks.some((t) => t.type === 'DEPARTURE' && t.leaseId === leaseId), 'tâche « départ »')
  const end = (await api(`/leases/${leaseId}`, { token })).facts.tenantNotice.endDate
  await api(`/leases/${leaseId}/end`, { method: 'POST', token, body: { keysDate: end } })
  today = await api('/today', { token })
  assert.ok(today.tasks.some((t) => t.type === 'SETTLEMENT' && t.leaseId === leaseId), 'tâche « solde de tout compte »')
  const d = await api(`/leases/${leaseId}/letters/defaults/DEPOSIT_RETURN`, { token })
  assert.equal(d.letter.keysDate, end)
})
