import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Pages « Fonctionnalités » : la liste, puis une page avec ses captures, ses questions et le lien vers la démo. */
test('fonctionnalités : liste, page avec captures, lien vers la démo', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  try {

  await page.goto(`${BASE}/fonctionnalites`)
  await page.getByRole('heading', { level: 1, name: /Tout Bailio, du bail/ }).waitFor()
  // Vitrine : un autre écran de l'application, capture sur ordinateur.
  await page.getByRole('tab', { name: /Relances/ }).click()
  await page.getByRole('img', { name: /relances automatiques activées/ }).waitFor()
  await page.getByRole('link', { name: /Impayés et relances/ }).first().click()
  await page.getByRole('heading', { level: 1, name: /Relancé à temps/ }).waitFor()
  assert.match(await page.title(), /Relancé à temps/)
  const img = page.getByRole('img', { name: /relances automatiques|Relancer automatiquement un loyer impayé/ }).first()
  await img.scrollIntoViewIfNeeded()
  assert.ok(await img.evaluate((e) => e.complete && e.naturalWidth > 0), 'capture chargée')
  await page.getByText('Les relances sont-elles activées d’office ?').click()
  await page.getByText(/restent coupées tant que vous ne les activez pas/).waitFor()
  await page.getByRole('link', { name: 'Essayer la démo' }).first().click()
  await page.getByRole('heading', { level: 1, name: /Essayez Bailio/ }).waitFor()
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
