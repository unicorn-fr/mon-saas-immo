import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, wait, watch } from '../lib.mjs'

/**
 * Signer sans peine : au pavé tactile sans cliquer (un clic pour commencer, le doigt glisse, une touche pour finir),
 * ou avec son téléphone (QR code, signature au doigt, elle revient toute seule sur l'ordinateur).
 */
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

test('relais du téléphone : une signature, une seule fois', async () => {
  const { code } = await api('/signature-relay', { method: 'POST' })
  assert.match(code, /^[A-Za-z0-9_-]{32}$/)
  assert.equal((await api(`/signature-relay/${code}`)).image, null)
  await assert.rejects(api(`/signature-relay/${code}`, { method: 'POST', body: { image: 'data:text/html;base64,PHNjcmlwdD4=' } }), /400/)
  await api(`/signature-relay/${code}`, { method: 'POST', body: { image: PNG } })
  assert.equal((await api(`/signature-relay/${code}`)).image, PNG)
  // Reprise par l'ordinateur : le relais s'efface.
  assert.equal((await fetch(`${API}/signature-relay/${code}`)).status, 404)
})

test('signature au pavé tactile sans cliquer, puis avec le téléphone', async () => {
  const { token } = await newAccount()
  await completeLease(token)
  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/compte/profil`)
  const pad = page.getByLabel('Signez ici avec la souris ou le doigt')
  await pad.scrollIntoViewIfNeeded()
  // Pavé tactile : un clic pour commencer, puis le curseur trace sans bouton appuyé ; une touche termine.
  await page.getByRole('button', { name: 'Signer au pavé tactile, sans cliquer' }).click()
  await page.getByText('Cliquez une fois dans ce cadre pour commencer').waitFor()
  const box = (await pad.boundingBox())
  await page.mouse.click(box.x + 40, box.y + 100)
  await page.getByText(/Glissez le doigt sur le pavé tactile/).waitFor()
  for (const [dx, dy] of [[80, 40], [140, 110], [200, 50], [260, 105], [320, 60]]) await page.mouse.move(box.x + dx, box.y + dy, { steps: 6 })
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Effacer' }).waitFor()
  await wait(1500)
  const saved = (await api('/profile', { token })).profile.signature
  assert.match(saved, /^data:image\/png;base64,/)
  await shot(page, 'signature-pave-tactile')

  // Téléphone : le QR code ouvre la page de signature ; la signature revient seule sur l'ordinateur.
  await page.getByRole('button', { name: 'Effacer' }).click()
  const relay = page.waitForResponse((r) => r.url().endsWith('/signature-relay') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Signer avec mon téléphone' }).click()
  const { data } = await (await relay).json()
  await page.getByText('En attente de votre signature…').waitFor()
  await shot(page, 'signature-telephone-qr')
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobile = await phone.newPage()
  watch(mobile, errors)
  await mobile.goto(`${BASE}/signature/${data.code}`)
  const mpad = mobile.getByLabel('Signez ici avec le doigt')
  const mb = await mpad.boundingBox()
  await mobile.mouse.move(mb.x + 30, mb.y + 120)
  await mobile.mouse.down()
  for (const [dx, dy] of [[90, 60], [150, 140], [220, 70], [300, 130]]) await mobile.mouse.move(mb.x + dx, mb.y + dy, { steps: 5 })
  await mobile.mouse.up()
  await mobile.getByRole('button', { name: 'Envoyer à l’ordinateur' }).click()
  await mobile.getByText('C’est envoyé.').waitFor()
  await shot(mobile, 'signature-telephone')
  await page.getByRole('button', { name: 'Effacer' }).waitFor({ timeout: 10000 })
  await wait(1500)
  const fromPhone = (await api('/profile', { token })).profile.signature
  assert.match(fromPhone, /^data:image\/png;base64,/)
  assert.notEqual(fromPhone, saved)
  await phone.close()
  await browser.close()
  assert.deepEqual(errors, [])
})
