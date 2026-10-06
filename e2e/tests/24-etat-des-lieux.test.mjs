import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { API, BASE, api, completeLease, fromLog, launch, logSize, newAccount, shot, signedInContext, watch } from '../lib.mjs'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const photo = new URL('../fixtures/selfie.jpg', import.meta.url).pathname

/**
 * État des lieux d'entrée : photo d'ensemble d'une pièce, photos datées dans le PDF ; le locataire demande à le
 * compléter dans les 10 jours (article 3-2), le propriétaire accepte et le PDF complété part aux deux.
 */
test('état des lieux d’entrée : photo d’ensemble, demande de complément du locataire, acceptation', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token, { furnished: false })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const link = await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
  const { id } = await api(`/leases/${leaseId}/inventories`, { method: 'POST', token, body: { kind: 'ENTRY' } })
  const browser = await launch()
  const errors = []
  try {
    // Propriétaire, sur téléphone : photo d'ensemble de la première pièce
    const ctx = await signedInContext(browser, token, { width: 390, height: 844 })
    const page = await ctx.newPage()
    watch(page, errors)
    page.setDefaultTimeout(15000)
    await page.goto(`${BASE}/edl/${id}`)
    await page.getByRole('button', { name: 'Commencer' }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: /^Ouvrir / }).click()
    const room = (await api(`/inventories/${id}`, { token })).data.rooms[0].name
    await page.getByLabel(`Photo d’ensemble : ${room}`).setInputFiles(photo)
    await page.getByRole('img', { name: `Vue d’ensemble : ${room}` }).waitFor()
    await page.getByText('Enregistré', { exact: true }).waitFor()

    // Signatures (posées ici directement) puis signature de l'état des lieux
    const inv = (await api(`/inventories/${id}`, { token })).data
    assert.equal(inv.rooms[0].photoIds.length, 1)
    await api(`/inventories/${id}`, { method: 'PUT', token, body: { ...inv, signatures: { landlord: PNG, tenant: PNG } } })
    await api(`/inventories/${id}/sign`, { method: 'POST', token })

    // Locataire : demande de complément dans les 10 jours, avec photo
    const tctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const t = await tctx.newPage()
    watch(t, errors)
    t.setDefaultTimeout(15000)
    await t.goto(`${BASE}/locataire/${link.code}`)
    await t.getByRole('heading', { name: 'État des lieux d’entrée' }).waitFor()
    await t.getByRole('button', { name: 'Compléter l’état des lieux' }).click()
    await t.getByRole('button', { name: 'Un oubli ou une erreur' }).click()
    await t.getByRole('button', { name: 'Continuer' }).click()
    await t.getByLabel('Ce qui n’est pas dans l’état des lieux').fill('Éclat dans l’émail de la baignoire, côté robinet.')
    await t.getByRole('button', { name: 'Continuer' }).click()
    await t.locator('input[type=file]').setInputFiles(photo)
    await t.getByText('selfie.jpg').waitFor()
    const before = logSize()
    await t.getByRole('button', { name: 'Envoyer ma demande' }).click()
    await t.getByText('Demande envoyée à votre bailleur').waitFor()
    await t.getByText('En attente de réponse').waitFor()
    await fromLog(/demande de complément/g, before)

    // Tâche en tête d'« Aujourd'hui »
    const today = await api('/today', { token })
    assert.equal(today.tasks[0].type, 'INVENTORY_COMPLEMENT')

    // Propriétaire : accepte depuis « Aujourd'hui »
    await page.goto(`${BASE}/espace`)
    await page.getByRole('button', { name: 'Répondre à la demande' }).click()
    await page.getByText('« Éclat dans l’émail de la baignoire, côté robinet. »').waitFor()
    await page.getByRole('img', { name: 'Photo 1 envoyée par le locataire' }).waitFor()
    await shot(page, 'edl-complement')
    const b2 = logSize()
    await page.getByRole('button', { name: 'Ajouter à l’état des lieux' }).click()
    await page.getByText('Ajouté à l’état des lieux.', { exact: false }).waitFor()
    await fromLog(/État des lieux d’entrée complété/g, b2)

    // Le PDF reprend le complément et date les photos
    const r = await fetch(`${API}/inventories/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    const text = execFileSync('pdftotext', ['-', '-'], { input: Buffer.from(await r.arrayBuffer()) }).toString()
    assert.match(text, /Compléments demandés par le locataire/iu)
    assert.match(text, /Éclat dans l’émail de la baignoire/)
    assert.match(text, /vue d’ensemble · ajoutée le \d+/)
    // Le locataire voit la réponse
    await t.reload()
    await t.getByText('Ajouté à l’état des lieux').waitFor()
    assert.equal((await api('/today', { token })).tasks.some((x) => x.type === 'INVENTORY_COMPLEMENT'), false)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
