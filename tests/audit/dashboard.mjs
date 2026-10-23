// Contrôle du tableau de bord manuel (audit/dashboard-test.html), ouvert comme un fichier, sur téléphone et ordinateur.
// Usage : node tests/audit/dashboard.mjs
import fs from 'node:fs'
import { CONFIGS, ROOT, Results, anomalyShot, closeBrowsers, contextFor, watch } from './lib.mjs'

const FILE = `file://${ROOT}audit/dashboard-test.html`
const res = new Results('dashboard')
for (const config of CONFIGS.filter((c) => ['iphone-portrait', 'ipad-paysage', 'chrome-1366'].includes(c.id))) {
  const ctx = await contextFor(config)
  const page = await ctx.newPage()
  const errors = watch(page)
  const P = 'Tableau de bord manuel'
  const D = config.label
  const check = async (element, action, expected, fn) => {
    try { res.ok(P, element, D, action, expected, (await fn()) || 'Conforme') } catch (e) { res.ko(P, element, D, action, expected, e.message.slice(0, 200), 'Majeur', { screenshot: await anomalyShot(page, config, `dashboard-${element}`) }) }
  }
  await page.goto(FILE)
  await check('Ouverture', 'Ouvrir le fichier sans serveur', 'Liste des tests affichée', async () => {
    const n = await page.locator('article.test').count()
    if (n < 100) throw new Error(`${n} tests seulement`)
    return `${n} tests`
  })
  await check('Mise en page', 'Largeur', 'Aucun défilement horizontal', async () => {
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
    if (w[0] > w[1] + 1) throw new Error(`${w[0]} px pour ${w[1]}`)
  })
  await check('Statut', 'Marquer le test 1 « Bug », gravité, commentaire', 'Enregistré et gardé après rechargement', async () => {
    const t1 = page.locator('#T001')
    await t1.getByRole('button', { name: 'Bug' }).click()
    await page.locator('#T001').getByLabel('Gravité').selectOption('Majeur')
    await page.locator('#T001').getByLabel('Commentaire').fill('Texte coupé sur l’iPhone 😀')
    await page.waitForTimeout(500)
    await page.reload()
    const pressed = await page.locator('#T001 button[aria-pressed="true"]').innerText()
    const comment = await page.locator('#T001').getByLabel('Commentaire').inputValue()
    if (pressed !== 'Bug' || !comment.includes('😀')) throw new Error(`après rechargement : ${pressed} / ${comment}`)
  })
  await check('Capture', 'Ajouter une image', 'Image affichée sous le test', async () => {
    await page.locator('#T001 input[type=file]').setInputFiles(new URL('../../e2e/fixtures/selfie.jpg', import.meta.url).pathname)
    await page.locator('#T001 img').waitFor({ timeout: 5000 })
  })
  await check('Filtres', 'Statut « Bug »', 'Seul le test en bug reste', async () => {
    await page.locator('#fStatus').selectOption('BUG')
    const n = await page.locator('article.test').count()
    await page.locator('#fStatus').selectOption('')
    if (n !== 1) throw new Error(`${n} tests affichés`)
  })
  await check('Progression', 'Barres', 'Un test compté pour l’appareil', async () => {
    const txt = await page.locator('#bars').innerText()
    if (!/1\/\d+ testés/.test(txt)) throw new Error(txt.slice(0, 120))
  })
  await check('Remarque libre', 'Ajouter une remarque', 'Remarque listée', async () => {
    await page.locator('#rPage').fill('/espace/argent')
    await page.locator('#rText').fill('Idée : afficher le total de l’année')
    await page.locator('#rAdd').click()
    await page.locator('#rList .remark').first().waitFor()
  })
  await check('Export', 'Exporter mes retours', 'retours-test.json et retours-test.md téléchargés', async () => {
    const names = []
    page.on('download', (d) => names.push(d.suggestedFilename()))
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#export').click()])
    const path = await dl.path()
    const data = JSON.parse(fs.readFileSync(path, 'utf8'))
    await page.waitForTimeout(900)
    if (!data.tests?.[0]?.results?.[Object.keys(data.tests[0].results)[0]]?.screenshot) throw new Error('capture absente de l’export')
    fs.writeFileSync(`${ROOT}tests/audit/resultats/retours-test-exemple.json`, JSON.stringify(data))
    return names.join(', ')
  })
  await check('Réinitialiser puis importer', 'Tout effacer, puis importer l’export', 'Les retours reviennent', async () => {
    page.on('dialog', (d) => d.accept())
    await page.locator('#reset').click()
    await page.waitForTimeout(300)
    if (await page.locator('#T001 button[aria-pressed="true"]').innerText() !== 'Pas testé') throw new Error('non effacé')
    await page.locator('#importFile').setInputFiles(`${ROOT}tests/audit/resultats/retours-test-exemple.json`)
    await page.waitForTimeout(500)
    const pressed = await page.locator('#T001 button[aria-pressed="true"]').innerText()
    if (pressed !== 'Bug') throw new Error(`après import : ${pressed}`)
  })
  await check('Erreurs', 'Toute la séquence', 'Aucune erreur JavaScript', async () => { if (errors.length) throw new Error(errors.join(' ; ')) })
  await ctx.close()
}
res.save()
for (const r of res.rows) if (r.status !== 'OK') console.log(r.device, r.element, r.actual)
await closeBrowsers()
