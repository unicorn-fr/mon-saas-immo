// Usage : node audit/step.mjs '<actions JSON>' ; actions : ["goto","/x"] ["click","Nom"] ["fill","Intitulé","valeur"] ["snap"] ["shot","nom"]
import { launch, BASE } from '../lib.mjs'
import { snap } from './snap.mjs'
const actions = JSON.parse(process.argv[2])
const vp = process.env.VP ? JSON.parse(process.env.VP) : { width: 1280, height: 900 }
const b = await launch(); const p = await b.newPage({ viewport: vp })
p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()))
for (const [a, x, y, z] of actions) {
  try {
    if (a === 'goto') await p.goto(BASE + x)
    if (a === 'click') await p.getByRole(y ?? 'button', { name: x, exact: false }).first().click({ timeout: 5000 })
    if (a === 'clickt') await p.getByText(x, { exact: false }).first().click({ timeout: 5000 })
    if (a === 'fill') await p.getByLabel(x, { exact: false }).first().fill(y, { timeout: 5000 })
    if (a === 'filln') await p.getByLabel(x, { exact: true }).nth(y).fill(z, { timeout: 5000 })
    if (a === 'clickn') await p.getByRole('button', { name: x, exact: true }).nth(y).click({ timeout: 5000 })
    if (a === 'select') await p.getByLabel(x).first().selectOption({ label: y })
    if (a === 'reload') await p.reload()
    if (a === 'key') await p.keyboard.press(x)
    if (a === 'wait') await p.waitForTimeout(x)
    if (a === 'shot') await p.screenshot({ path: `captures/audit-${x}.png`, fullPage: true })
    if (a === 'snap') { await p.waitForTimeout(600); console.log(`\n===== ${p.url().replace(BASE, '')}\n` + (await snap(p))) }
  } catch (e) { console.log(`ÉCHEC ${a} ${x}: ${e.message.split('\n')[0]}`) }
}
await b.close()
