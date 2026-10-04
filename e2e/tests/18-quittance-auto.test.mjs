import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, signedInContext, watch } from '../lib.mjs'

const SERVER = new URL('../../server/', import.meta.url).pathname

/** Lance la tâche quotidienne des quittances automatiques comme si l'on était le jour donné. */
function runJob(day, leaseId) {
  const r = spawnSync('npx', ['tsx', '--env-file-if-exists=.env', '-e', `import('./src/services/autoReceipts.ts').then((m) => m.runAutoReceipts(new Date('${day}T08:00:00Z'), ['${leaseId}'])).then((x) => { console.log('RESULT ' + JSON.stringify(x)); process.exit(0) })`], { cwd: SERVER, encoding: 'utf8', timeout: 120000 })
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('RESULT '))
  assert.ok(line, `tâche quotidienne : ${r.stderr}`)
  return { ...JSON.parse(line.slice(7)), out: r.stdout }
}

/** Quittance automatique (par défaut) : prévenance, « le loyer n'est pas arrivé », puis envoi 7 jours après l'échéance. */
test('quittance automatique par défaut, 7 jours après l’échéance, annulable', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  // Rien à activer : la quittance automatique est active par défaut.

  // Le propriétaire voit l'envoi prévu (loyer payable le 4 : quittance de novembre le 11 novembre) et peut l'annuler.
  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  await page.getByText(/envoi automatique le 11 nov/).waitFor()
  await page.getByText('Le loyer n’est pas arrivé', { exact: true }).click()
  await page.getByText('envoi annulé').waitFor()
  await page.getByRole('link', { name: 'Envoyer une demande de paiement' }).waitFor()

  // Envoi annulé : rien ne part le 11 novembre.
  assert.equal(runJob('2026-11-11', leaseId).sent, 0)
  // Rétabli : le propriétaire est prévenu 3 jours avant, puis la quittance part le jour prévu.
  await page.getByText('Rétablir l’envoi').click()
  await page.getByText(/envoi automatique le 11 nov/).waitFor()
  assert.equal(runJob('2026-11-08', leaseId).warned, 1)
  assert.equal(runJob('2026-11-09', leaseId).warned, 0, 'prévenu une seule fois')
  const done = runJob('2026-11-11', leaseId)
  assert.equal(done.sent, 1)
  assert.match(done.out, /Votre quittance de loyer, novembre 2026/)
  const lease = await api(`/leases/${leaseId}`, { token })
  const p = lease.payments.find((x) => x.period === '2026-11')
  assert.equal(p.receivedAt, '2026-11-04')
  assert.equal(runJob('2026-11-12', leaseId).sent, 0, 'jamais deux fois')
  await browser.close()
  assert.deepEqual(errors, [])
})
