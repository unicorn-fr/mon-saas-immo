// Kit des réseaux sociaux : rend chaque image fixe (src/marque/Marque.tsx, déclarées dans src/Root.tsx) en PNG dans marque/.
// Usage : node scripts/marque.mjs   (CHROMIUM_PATH : navigateur déjà installé, facultatif)
import fs from 'node:fs'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { getCompositions, renderStill } from '@remotion/renderer'

const ROOT = new URL('..', import.meta.url).pathname
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') })
const browserExecutable = process.env.CHROMIUM_PATH || null
const stills = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => c.durationInFrames === 1)
fs.mkdirSync(path.join(ROOT, 'marque'), { recursive: true })
for (const composition of stills) {
  const output = path.join(ROOT, `marque/${composition.id}.png`)
  await renderStill({ composition, serveUrl, output, browserExecutable })
  console.log(`marque/${composition.id}.png (${composition.width} × ${composition.height})`)
}
