import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BASE, launch, watch } from '../lib.mjs'

/** Menu du site : panneaux au survol et au clavier sur ordinateur, accordéon plein écran sur téléphone. */
test('menu : panneaux sur ordinateur, accordéon sur téléphone', async () => {
  const browser = await launch()
  const errors = []
  try {
    const d = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    watch(d, errors)
    await d.goto(`${BASE}/tarifs`)
    const res = d.getByRole('button', { name: 'Ressources' })
    await res.hover()
    await d.getByRole('link', { name: /^Tous les modèles/ }).waitFor()
    assert.equal(await res.getAttribute('aria-expanded'), 'true')
    await d.keyboard.press('Escape')
    assert.equal(await res.getAttribute('aria-expanded'), 'false')
    // Au clavier : Entrée ouvre, le lien mène à la page
    await d.getByRole('button', { name: 'Solutions' }).focus()
    await d.keyboard.press('Enter')
    await d.getByRole('link', { name: /^Bail mobilité 1 à 10 mois/ }).click()
    await d.getByRole('heading', { level: 1, name: /mobilité/i }).waitFor()
    assert.equal(await d.getByRole('button', { name: 'Solutions' }).getAttribute('aria-expanded'), 'false')

    const m = await browser.newPage({ viewport: { width: 360, height: 780 } })
    watch(m, errors)
    await m.goto(`${BASE}/`)
    assert.equal(await m.evaluate(() => document.documentElement.scrollWidth), 360)
    await m.getByRole('button', { name: 'Menu', exact: true }).click()
    const dialog = m.getByRole('dialog', { name: 'Menu' })
    await dialog.getByRole('button', { name: 'Produit' }).click()
    await dialog.getByRole('link', { name: /État des lieux/ }).waitFor()
    await dialog.getByRole('button', { name: 'Ressources' }).click()
    assert.equal(await dialog.getByRole('button', { name: 'Produit' }).getAttribute('aria-expanded'), 'false')
    await dialog.getByRole('link', { name: /Rentabilité locative/ }).click()
    await m.getByRole('heading', { level: 1, name: /Rentabilité/ }).waitFor()
    assert.equal(await m.getByRole('dialog').count(), 0)
  } finally {
    await browser.close()
  }
  assert.deepEqual(errors, [])
})
