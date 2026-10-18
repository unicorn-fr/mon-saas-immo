// Aperçu rapide : quelques images de la vidéo en planche contact (out/<id>-apercu.jpg), sans tout fabriquer.
// Usage : node scripts/apercu.mjs presentation 10 25 40 ...   (numéros d'images, 30 par seconde)
import path from 'node:path'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const ROOT = new URL('..', import.meta.url).pathname
const [id, ...frames] = process.argv.slice(2)
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') })
const browserExecutable = process.env.CHROMIUM_PATH || null
const composition = await selectComposition({ serveUrl, id, browserExecutable })
fs.mkdirSync(path.join(ROOT, 'out/apercu'), { recursive: true })
const files = []
for (const f of frames.map(Number)) {
  const output = path.join(ROOT, `out/apercu/${f}.jpg`)
  await renderStill({ composition, serveUrl, frame: f, output, imageFormat: 'jpeg', jpegQuality: 70, browserExecutable, scale: 0.25 })
  files.push(output)
}
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `hstack=${files.length}`, path.join(ROOT, `out/${id}-apercu.jpg`)])
console.log(`out/${id}-apercu.jpg (${composition.durationInFrames} images)`)
