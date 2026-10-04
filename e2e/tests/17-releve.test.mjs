import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import { BASE, SHOTS, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Relevé bancaire : le loyer du locataire est reconnu, enregistré en un clic, la quittance part seule. */
test('relevé bancaire : loyer reconnu, enregistré, quittance envoyée automatiquement', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  await api(`/leases/${leaseId}/receipt-auto`, { method: 'PUT', token, body: { auto: true } })
  // Loyer de 510 € + 50 € de provisions, payable le 4 ; bail commencé le 6 octobre 2026.
  const csv = ['Relevé de compte;;;;', 'Date;Date de valeur;Libellé;Débit;Crédit', '05/11/2026;05/11/2026;VIR SEPA RECU DE M LUCAS GARNIER LOYER NOVEMBRE;;560,00', '06/11/2026;06/11/2026;PRLV SEPA FREE MOBILE;19,99;', '07/11/2026;07/11/2026;VIR SEPA RECU DE MME DUPONT;;300,00'].join('\n')
  const file = `${SHOTS}releve.csv`
  fs.writeFileSync(file, csv, 'latin1')

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  await page.goto(`${BASE}/espace/argent/releve`)
  await page.getByLabel('Fichier du relevé bancaire').setInputFiles(file)
  await page.getByText('3. Vérifiez et enregistrez').waitFor()
  await page.getByText('loyer de novembre 2026').waitFor()
  await page.getByText('Reconnu', { exact: true }).waitFor()
  assert.equal(await page.getByText('DUPONT').count(), 0, 'un versement sans rapport n’est pas proposé')
  await shot(page, 'releve-propositions')
  const before = logSize()
  await page.getByRole('button', { name: 'Enregistrer 1 loyer' }).click()
  await page.getByText('1 loyer enregistré.').waitFor()
  await page.getByText('1 envoyée automatiquement par email.').waitFor()
  await fromLog(/Votre quittance de loyer, novembre 2026/g, before)
  const lease = await api(`/leases/${leaseId}`, { token })
  const p = lease.payments.find((x) => x.period === '2026-11')
  assert.equal(p.amountCents, 56000)
  assert.equal(p.receivedAt, '2026-11-05')
  await browser.close()
  assert.deepEqual(errors, [])
})
