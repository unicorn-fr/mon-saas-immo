// Fabrique les vidéos MP4 (1080×1920, 30 i/s) dans out/<id>.mp4, avec leur légende dans out/<id>.txt.
// Usage : node scripts/rendu.mjs [presentation]   (CHROMIUM_PATH : navigateur déjà installé, facultatif)
import fs from 'node:fs'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'

const ROOT = new URL('..', import.meta.url).pathname
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ROOT, 'src/videos')).filter((f) => f.endsWith('.json') && !f.endsWith('.voix.json')).map((f) => f.replace('.json', ''))
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public') })
const browserExecutable = process.env.CHROMIUM_PATH || null
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true })
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable })
  const outputLocation = path.join(ROOT, `out/${id}.mp4`)
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation, browserExecutable, crf: 20, onProgress: ({ progress }) => process.stdout.write(`\r${id} ${Math.round(progress * 100)} %`) })
  const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
  fs.writeFileSync(path.join(ROOT, `out/${id}.txt`), `${video.titre}\n\n${video.legende}\n`)
  console.log(`\n→ out/${id}.mp4`)
}
