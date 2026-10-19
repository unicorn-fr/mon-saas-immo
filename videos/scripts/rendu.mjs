// Fabrique les vidéos MP4 (1080×1920, 30 i/s) dans out/<id>.mp4, avec leur légende dans out/<id>.txt.
// Usage : node scripts/rendu.mjs [presentation]   (CHROMIUM_PATH : navigateur déjà installé, facultatif)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
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
  const raw = outputLocation.replace(/\.mp4$/, '.brut.mp4')
  // Qualité haute pour les réseaux : images capturées sans perte de JPEG, peu de compression (le grain du film en a
  // besoin), réglage lent d'x264. Les plateformes recompressent : mieux vaut leur donner une source très propre.
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: raw, browserExecutable, videoBitrate: '14M', x264Preset: 'slow', imageFormat: 'png', pixelFormat: 'yuv420p', onProgress: ({ progress }) => process.stdout.write(`\r${id} ${Math.round(progress * 100)} %`) })
  // Son au niveau des réseaux sociaux (-14 LUFS, crêtes à -1,5 dB) : sinon la vidéo paraît bien plus faible que les autres.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '320k', outputLocation])
  fs.rmSync(raw)
  const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
  fs.writeFileSync(path.join(ROOT, `out/${id}.txt`), `${video.titre}\n\n${video.legende}\n`)
  console.log(`\n→ out/${id}.mp4`)
}
