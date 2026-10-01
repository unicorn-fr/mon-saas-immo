import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { BASE, launch, shot, watch } from '../lib.mjs'

/** Pages publiques : elles s'affichent, sans erreur, sans défilement horizontal sur téléphone. */
let browser
before(async () => (browser = await launch()))
after(() => browser?.close())

const PAGES = ['/', '/connexion', '/inscription', '/importer', '/mentions-legales', '/conditions', '/confidentialite', '/contact']

for (const [viewport, label] of [[{ width: 1280, height: 900 }, 'ordinateur'], [{ width: 390, height: 844 }, 'téléphone']]) {
  test(`pages publiques (${label})`, async () => {
    const ctx = await browser.newContext({ viewport })
    const page = await ctx.newPage()
    const errors = []
    watch(page, errors)
    for (const path of PAGES) {
      await page.goto(BASE + path)
      await page.locator('h1').first().waitFor()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      assert.equal(overflow, false, `${path} déborde en largeur (${label})`)
    }
    await shot(page, `accueil-${label}`)
    await ctx.close()
    assert.deepEqual(errors, [])
  })
}

test('le prix est le même sur l’accueil qu’ailleurs (offert pendant le lancement)', async () => {
  const page = await browser.newPage()
  await page.goto(BASE + '/#tarifs')
  await page.getByText('Offert pendant le lancement').first().waitFor()
  await page.close()
})

test('page inconnue : message clair', async () => {
  const page = await browser.newPage()
  await page.goto(BASE + '/cette-page-n-existe-pas')
  await page.locator('h1').first().waitFor()
  await page.close()
})
