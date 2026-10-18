// Voix off française de chaque scène, avec Piper (synthèse vocale libre, hors ligne).
// Écrit public/voix/<id>/NN.wav et src/videos/<id>.voix.json (durée de chaque phrase, en secondes).
// Usage : node scripts/voix.mjs [presentation]   (PIPER_DIR : dossier de Piper et de la voix, voir README.md)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const PIPER = process.env.PIPER_DIR ?? path.join(ROOT, '.outils/piper')
const MODEL = path.join(PIPER, 'fr-siwis-medium.onnx')
// Prononciation : la voix lit « Bailio » comme « bèlio » ; on lui écrit « Baïlio ».
const SAY = (t) => t.replace(/Bailio/g, 'Baïlio').replace(/…/g, '...')

const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ROOT, 'src/videos')).filter((f) => f.endsWith('.json') && !f.endsWith('.voix.json')).map((f) => f.replace('.json', ''))
for (const id of ids) {
  const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
  const dir = path.join(ROOT, `public/voix/${id}`)
  fs.mkdirSync(dir, { recursive: true })
  const durees = video.scenes.map((s, i) => {
    const file = path.join(dir, `${String(i).padStart(2, '0')}.wav`)
    execFileSync(path.join(PIPER, 'piper/piper'), ['--model', MODEL, '--output_file', file, '--length_scale', '0.88', '--sentence_silence', '0.15'], { input: SAY(s.voix), stdio: ['pipe', 'ignore', 'ignore'] })
    return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim())
  })
  fs.writeFileSync(path.join(ROOT, `src/videos/${id}.voix.json`), JSON.stringify({ durees }, null, 1))
  console.log(id, durees.map((d) => d.toFixed(1)).join(' + '), '=', durees.reduce((a, b) => a + b, 0).toFixed(1), 's')
}
