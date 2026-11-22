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

/**
 * Mois de la prochaine quittance automatique, comme l'écran la calcule (upcomingAutoReceipt) : bail du 6 octobre 2026,
 * loyer payable le 4, envoi le 11, jamais plus de 10 jours après. Le test ne dépend ainsi pas du jour où il tourne.
 */
function nextPeriod(today = new Date().toISOString().slice(0, 10)) {
  const [y, m] = today.split('-').map(Number)
  for (const k of [-1, 0, 1]) {
    const d = new Date(Date.UTC(y, m - 1 + k, 1))
    const period = d.toISOString().slice(0, 7)
    if (`${period}-04` < '2026-10-06') continue
    const last = new Date(Date.parse(`${period}-11T00:00:00Z`) + 10 * 86400000).toISOString().slice(0, 10)
    if (today > last) continue
    const short = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'][d.getUTCMonth()]
    const long = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    return { period, day: (n) => `${period}-${String(n).padStart(2, '0')}`, sendText: new RegExp(`envoi automatique le 11 ${short}`), long }
  }
  throw new Error('aucun mois à venir')
}

/**
 * Loyer supposé reçu 7 jours après l'échéance : jamais par défaut (une quittance prouve le paiement). Le propriétaire
 * l'active expressément ; ensuite prévenance, « le loyer n'est pas arrivé », puis envoi.
 */
test('loyer supposé reçu : coupé par défaut, puis 7 jours après l’échéance sur choix exprès, annulable', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const { period, day, sendText, long } = nextPeriod()
  // Par défaut : la quittance part quand le loyer est noté reçu, mais rien n'est supposé.
  assert.equal(runJob(day(8), leaseId).warned, 0, 'aucune prévenance sans accord')
  assert.equal(runJob(day(11), leaseId).sent, 0, 'aucune quittance pour un loyer non constaté')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/baux/${leaseId}`)
  const assume = page.getByText('Sans nouvelle de moi, noter le loyer reçu 7 jours après l’échéance')
  await assume.waitFor()
  assert.equal(await page.getByText(sendText).count(), 0)
  // Le propriétaire l'active : il voit l'envoi prévu (loyer payable le 4 : quittance le 11 du mois) et peut l'annuler.
  await assume.click()
  await page.getByText(sendText).waitFor()
  await page.getByText('Le loyer n’est pas arrivé', { exact: true }).click()
  // La carte, pas le message de confirmation « Envoi annulé. » qui peut s'afficher en même temps.
  await page.getByText(/: envoi annulé$/).waitFor()
  await page.getByRole('link', { name: 'Envoyer une demande de paiement' }).waitFor()

  // Envoi annulé : rien ne part le 11.
  assert.equal(runJob(day(11), leaseId).sent, 0)
  // Rétabli : le propriétaire est prévenu 3 jours avant, puis la quittance part le jour prévu.
  await page.getByText('Rétablir l’envoi').click()
  await page.getByText(sendText).waitFor()
  assert.equal(runJob(day(8), leaseId).warned, 1)
  assert.equal(runJob(day(9), leaseId).warned, 0, 'prévenu une seule fois')
  const done = runJob(day(11), leaseId)
  assert.equal(done.sent, 1)
  assert.match(done.out, new RegExp(`Votre quittance de loyer, ${long}`))
  const lease = await api(`/leases/${leaseId}`, { token })
  const p = lease.payments.find((x) => x.period === period)
  assert.equal(p.receivedAt, day(4))
  assert.equal(runJob(day(12), leaseId).sent, 0, 'jamais deux fois')
  await browser.close()
  assert.deepEqual(errors, [])
})
