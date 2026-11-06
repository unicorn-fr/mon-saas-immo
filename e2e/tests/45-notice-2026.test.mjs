import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, signedInContext, watch } from '../lib.mjs'

const SERVER = new URL('../../server/', import.meta.url).pathname

/** Date de signature du bail fixée en base (bail signé pendant la période de l'ancienne notice). */
function setSignedAt(leaseId, iso) {
  const r = spawnSync('npx', ['tsx', '--env-file-if-exists=.env', '-e', `import('./src/db.ts').then(async ({ prisma }) => { await prisma.lease.update({ where: { id: '${leaseId}' }, data: { signedAt: new Date('${iso}') } }); console.log('OK'); process.exit(0) })`], { cwd: SERVER, encoding: 'utf8', timeout: 120000 })
  assert.match(r.stdout ?? '', /OK/, r.stderr)
}

test('nouvelle notice : bail signé avec l’ancienne, tâche « Envoyer la nouvelle notice », envoi confirmé', async () => {
  // Notice publique : version de l'arrêté du 9 octobre 2026.
  const pub = await fetch(`${API}/notice-information.pdf`)
  assert.equal(pub.status, 200)
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  setSignedAt(leaseId, '2026-10-25T10:00:00Z')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace`)
  await page.getByText(/Envoyer la nouvelle notice d’information à/).waitFor()
  await page.getByRole('button', { name: 'Envoyer la nouvelle notice' }).click()
  await page.getByRole('button', { name: 'Oui, envoyer' }).click()
  await page.getByText('Notice envoyée à votre locataire.').waitFor()
  await page.reload()
  await page.getByText('Bonjour').first().waitFor()
  assert.equal(await page.getByText(/Envoyer la nouvelle notice d’information à/).count(), 0, 'une seule fois')
  await browser.close()
  assert.deepEqual(errors, [])
})
