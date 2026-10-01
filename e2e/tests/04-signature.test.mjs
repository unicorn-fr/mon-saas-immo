import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signAs, signedInContext, watch } from '../lib.mjs'

/**
 * Signature électronique de bout en bout : lancement depuis la page du bail, locataire (téléphone),
 * garant (mention de l'article 2297), propriétaire ; bail figé pendant la signature ; avenant.
 */
let browser
let account
before(async () => {
  browser = await launch()
  account = await newAccount()
})
after(() => browser?.close())

test('signature en ligne complète, bail figé pendant la signature, puis avenant', async () => {
  const { leaseId } = await completeLease(account.token)
  const ctx = await signedInContext(browser, account.token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors, { allow: ['/terms'] })
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  const before = logSize()
  await page.getByRole('button', { name: 'Signer en ligne' }).click()
  await page.waitForURL(/\/signer\//)
  const ownerUrl = page.url()
  const links = await fromLog(/Relire et signer : (http:\/\/[^\s]+\/signer\/[^\s]+)/g, before)
  assert.equal(links.length, 2, 'invitations du locataire et du garant')

  // Pendant la signature, le contrat ne peut plus être modifié.
  await assert.rejects(api(`/leases/${leaseId}/terms`, { method: 'PUT', token: account.token, body: { rentCents: 60000 } }), /signature en ligne est en cours/)
  await page.goto(`${BASE}/espace/baux/${leaseId}/contrat`)
  await page.getByText('Une signature en ligne est en cours').waitFor()

  const toBase = (u) => u.replace(/^http:\/\/[^/]+/, BASE)
  errors.push(...(await signAs(browser, toBase(links[0][1]), { name: 'locataire', mobile: true })))
  errors.push(...(await signAs(browser, toBase(links[1][1]), { name: 'garant' })))
  const owner = await signedInContext(browser, account.token)
  await owner.close()
  errors.push(...(await signAs(browser, ownerUrl, { name: 'proprietaire' })))

  let lease = await api(`/leases/${leaseId}`, { token: account.token })
  assert.equal(lease.status, 'ACTIVE')
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByText(/Signé le/).first().waitFor()
  await shot(page, 'bail-signe')

  // Avenant : une modification après signature se signe aussi en ligne.
  await api(`/leases/${leaseId}/terms`, { method: 'PUT', token: account.token, body: { paymentDay: 6 } })
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByText('Faire signer la nouvelle version (avenant)').waitFor()
  const before2 = logSize()
  await page.getByRole('button', { name: 'Signer en ligne' }).click()
  await page.waitForURL(/\/signer\//)
  await page.getByText('Avenant au contrat de location').waitFor()
  const subjects = await fromLog(/· (Signature de l’avenant au bail)/g, before2)
  assert.ok(subjects.length >= 1)
  lease = await api(`/leases/${leaseId}`, { token: account.token })
  assert.equal(lease.esignPending, true)
  await ctx.close()
  assert.deepEqual(errors, [])
})

test('un lien de signature inconnu ou expiré affiche un message clair', async () => {
  const page = await browser.newPage()
  await page.goto(`${BASE}/signer/lien-inconnu`)
  await page.getByText(/n’est plus valable|a expiré/).waitFor()
  await page.close()
})
