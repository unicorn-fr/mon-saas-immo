import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { BASE, api, completeLease, launch, newAccount, signedInContext, watch } from '../lib.mjs'

const SERVER = new URL('../../server/', import.meta.url).pathname

/** Lance la tâche quotidienne des relances comme si l'on était le jour donné. */
function runJob(day, leaseId) {
  const r = spawnSync('npx', ['tsx', '--env-file-if-exists=.env', '-e', `import('./src/services/dunning.ts').then((m) => m.runDunning(new Date('${day}T08:00:00Z'), ['${leaseId}'])).then((x) => { console.log('RESULT ' + JSON.stringify(x)); process.exit(0) })`], { cwd: SERVER, encoding: 'utf8', timeout: 120000 })
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('RESULT '))
  assert.ok(line, `tâche quotidienne : ${r.stderr}`)
  return { ...JSON.parse(line.slice(7)), out: r.stdout }
}

/**
 * Relances automatiques : coupées par défaut ; activées par le propriétaire (confirmation), relance amiable à J+3,
 * second rappel à J+8, mise en demeure à J+15, chacune une seule fois, rangée dans les courriers ; arrêt dès le loyer reçu.
 */
test('relances automatiques d’un loyer impayé : J+3, J+8, J+15, arrêt au paiement', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  // Loyer payable le 4 : rien ne part sans accord du propriétaire.
  assert.equal(runJob('2026-11-07', leaseId).sent, 0, 'coupées par défaut')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByText('Relancer automatiquement un loyer impayé').click()
  await page.getByRole('button', { name: 'Oui, activer' }).click()
  await page.getByText('Modifier les jours').waitFor()
  await browser.close()
  assert.deepEqual(errors, [])

  const lease = await api(`/leases/${leaseId}`, { token })
  assert.deepEqual(lease.facts.dunning, { enabled: true, days: [3, 8, 15] })

  assert.equal(runJob('2026-11-06', leaseId).sent, 0, 'trop tôt')
  const first = runJob('2026-11-07', leaseId)
  assert.equal(first.sent, 1)
  assert.match(first.out, /Relance amiable/)
  assert.equal(runJob('2026-11-08', leaseId).sent, 0, 'une seule fois')
  assert.match(runJob('2026-11-12', leaseId).out, /Second rappel/)
  assert.match(runJob('2026-11-19', leaseId).out, /Mise en demeure/)
  assert.equal(runJob('2026-11-20', leaseId).sent, 0)
  const docs = await api(`/documents?leaseId=${leaseId}`, { token })
  const rows = Array.isArray(docs) ? docs : docs.documents ?? docs.items ?? []
  assert.equal(rows.filter((d) => d.kind === 'LETTER').length, 3, 'les trois lettres sont rangées avec le bail')

  // Le mois suivant, loyer reçu : rien ne part.
  await api(`/leases/${leaseId}/payments`, { method: 'POST', token, body: { period: '2026-12', receivedAt: '2026-12-04' } })
  assert.equal(runJob('2026-12-07', leaseId).sent, 0, 'arrêt dès le loyer reçu')

  // Réglages : jours croissants exigés.
  await assert.rejects(api(`/leases/${leaseId}/dunning`, { method: 'PUT', token, body: { days: [8, 3, 15] } }))
  assert.deepEqual(await api(`/leases/${leaseId}/dunning`, { method: 'PUT', token, body: { days: [5, 10, 20] } }), { enabled: true, days: [5, 10, 20] })
})
