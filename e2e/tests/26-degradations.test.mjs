import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

async function signed(token, leaseId, kind, states, extra = {}) {
  const { id } = await api(`/leases/${leaseId}/inventories`, { method: 'POST', token, body: { kind } })
  const d = (await api(`/inventories/${id}`, { token })).data
  states.forEach((st, i) => (d.rooms[0].items[i] = { ...d.rooms[0].items[i], state: st }))
  await api(`/inventories/${id}`, { method: 'PUT', token, body: { ...d, ...extra, signatures: { landlord: PNG, tenant: PNG } } })
  await api(`/inventories/${id}/sign`, { method: 'POST', token })
  return d
}

/** Récapitulatif des dégradations : usure normale ou dégradation, élément par élément ; retenues dans le solde de tout compte. */
test('dégradations : décisions du propriétaire, PDF récapitulatif, retenues reprises dans le solde de tout compte', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const entry = await signed(token, leaseId, 'ENTRY', ['Bon', 'Bon', 'Bon'])
  await signed(token, leaseId, 'EXIT', ['Mauvais', 'Usé', 'Bon'], { newAddress: '3 rue Neuve, 34000 Montpellier' })
  const [first, second] = entry.rooms[0].items.map((i) => i.label)

  const browser = await launch()
  const errors = []
  try {
    const ctx = await signedInContext(browser, token)
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/espace`)
    await page.getByRole('button', { name: 'Faire le point sur les dégradations' }).click()
    await page.getByRole('heading', { name: '2 éléments à regarder' }).waitFor()
    await page.getByRole('button', { name: 'Commencer' }).click()
    await page.getByText('Élément 1 sur 2').waitFor()
    await page.getByRole('button', { name: 'Élément suivant' }).click()
    await page.getByText('Indiquez s’il s’agit d’usure normale ou d’une dégradation.').waitFor()
    await page.getByRole('button', { name: 'Une dégradation' }).click()
    await page.getByLabel('Coût de la réparation').fill('400')
    await page.getByLabel('Part due à l’usure (facultatif)').fill('25')
    await page.getByRole('button', { name: 'Élément suivant' }).click()
    await page.getByText('Indiquez le justificatif', { exact: false }).waitFor()
    await page.getByLabel('Justificatif').fill('Devis n° 124 de Parquets Martin')
    await page.getByLabel('Votre commentaire (facultatif)').fill('Brûlure près de la fenêtre.')
    await page.getByText('300,00 €').waitFor()
    await page.getByRole('button', { name: 'Élément suivant' }).click()
    await page.getByText('Élément 2 sur 2').waitFor()
    await page.getByRole('button', { name: 'De l’usure normale' }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.getByText('Total retenu').waitFor()
    await shot(page, 'degradations')

    const v = await api(`/leases/${leaseId}/damages`, { token })
    assert.equal(v.totalCents, 30000)
    assert.equal(v.complete, true)
    assert.deepEqual(v.lines.map((l) => [l.label, l.decision]), [[first, 'DAMAGE'], [second, 'WEAR']])

    // Solde de tout compte : la retenue est reprise, le délai passe à deux mois (sortie non conforme)
    const d = await api(`/leases/${leaseId}/letters/defaults/DEPOSIT_RETURN`, { token })
    assert.equal(d.letter.conform, false)
    assert.equal(d.letter.deductions.length, 1)
    assert.equal(d.letter.deductions[0].amountCents, 30000)
    assert.equal(d.letter.deductions[0].justification, 'Devis n° 124 de Parquets Martin')
    assert.match(d.note, /récapitulatif des dégradations/)

    const r = await fetch(`${API}/leases/${leaseId}/damages.pdf`, { headers: { Authorization: `Bearer ${token}` } })
    const text = execFileSync('pdftotext', ['-layout', '-', '-'], { input: Buffer.from(await r.arrayBuffer()) }).toString()
    assert.match(text, /Total retenu pour dégradations/)
    assert.doesNotMatch(text, /→|−/)
    assert.match(text, /Brûlure près de la fenêtre/)
    assert.match(text, /Usure\s+normale/)
    assert.match(text, /300,00/)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
