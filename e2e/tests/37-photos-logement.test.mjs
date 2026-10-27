import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API, BASE, api, completeLease, launch, newAccount, shot, signedInContext, watch } from '../lib.mjs'

/** Une photo ajoutée dans la fiche du logement apparaît sur la liste « Logements » et sur la page du logement. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

test('photo du logement : sur la liste et sur sa page', async () => {
  const { token } = await newAccount()
  await completeLease(token)
  const [p] = await api('/properties', { token })
  const form = new FormData()
  form.append('files', new Blob([PNG], { type: 'image/png' }), 'salon.png')
  const r = await fetch(`${API}/files`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  assert.equal(r.status, 201)
  const [file] = (await r.json()).data
  await api(`/properties/${p.id}`, { method: 'PUT', token, body: { photos: [file.id] } })
  assert.deepEqual((await api('/properties', { token }))[0].photoIds, [file.id])

  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const errors = []
  watch(page, errors)
  page.setDefaultTimeout(15000)
  await page.goto(`${BASE}/espace/logements`)
  const cover = page.getByAltText(`Photo : ${p.name}`)
  await cover.waitFor()
  assert.match(await cover.getAttribute('src'), /^blob:/)
  await shot(page, 'logements-photo')
  await cover.click()
  await page.getByAltText(`Photo principale : ${p.name}`).waitFor()
  await page.getByRole('link', { name: 'Ajouter ou changer les photos' }).waitFor()
  await shot(page, 'logement-photo')
  await browser.close()
  assert.deepEqual(errors, [])
})
