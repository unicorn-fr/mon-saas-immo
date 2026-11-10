import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Vidéo de présentation : servie par le site, ouverte par-dessus l'accueil, fermée par Échap. */
test('vidéo de présentation : ouverture, chargement, fermeture', async () => {
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  watch(page, errors)
  try {
    await page.goto(`${BASE}/`)
    const open = page.getByRole('button', { name: /Voir la vidéo/ })
    await open.click()
    const video = page.getByRole('dialog', { name: 'Bailio en une minute' }).locator('video')
    await video.waitFor()
    await page.waitForFunction(() => (document.querySelector('[role=dialog] video')?.readyState ?? 0) >= 1, null, { timeout: 20000 })
    assert.ok((await video.evaluate((v) => v.duration)) > 60)
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.includes('Voir la vidéo')), true)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
