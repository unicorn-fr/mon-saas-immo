const { chromium } = require('playwright')
const fs = require('fs')
const [,, html, outDir, mode] = process.argv
;(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] })
  // Vertical 1080 × 1920 ; paysage (YouTube) si la page porte class="paysage" sur <html>.
  const landscape = fs.readFileSync(html, 'utf8').includes('class="paysage"')
  const page = await browser.newPage({ viewport: landscape ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 } })
  const logs = []
  page.on('console', (m) => logs.push(m.text())); page.on('pageerror', (e) => logs.push('ERREUR ' + e.message))
  await page.goto('file://' + html)
  await page.evaluate(() => document.fonts.ready)
  const dur = await page.evaluate(() => window.DURATION)
  fs.mkdirSync(outDir, { recursive: true })
  const times = mode === 'full' ? Array.from({ length: Math.round(dur * 30) }, (_, i) => i / 30) : mode.startsWith('upto') ? Array.from({ length: +mode.slice(4) }, (_, i) => i / 30) : mode.split(',').map(Number)
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.render(t), times[i])
    await page.screenshot({ path: `${outDir}/${mode === 'full' || mode.startsWith('upto') ? String(i).padStart(5, '0') : 'p' + times[i]}.jpg`, type: 'jpeg', quality: 92 })
  }
  console.log('durée', dur, 'images', times.length, [...new Set(logs)].slice(0, 8).join(' | '))
  await browser.close()
})()
