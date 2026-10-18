// Voix enregistrée ailleurs (ElevenLabs sur le site, ou votre téléphone) : un seul fichier audio pour toute la vidéo.
// Il est découpé aux silences, une phrase par scène, puis rangé comme les voix générées.
// Usage : node scripts/import-voix.mjs presentation chemin/vers/voix.mp3
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const [id, input] = process.argv.slice(2)
if (!id || !input) throw new Error('Usage : node scripts/import-voix.mjs <id> <fichier audio>')
const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
const n = video.scenes.length
const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' }).trim())

// Silences d'au moins 0,25 s : on garde les n-1 plus longs comme coupures entre phrases.
const out = spawnSync('ffmpeg', ['-i', input, '-af', 'silencedetect=noise=-35dB:d=0.25', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
const silences = [...out.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => ({ start: Number(m[1]), end: Number(m[2]) })).filter((s) => s.start > 0.3 && s.end < total - 0.3)
if (silences.length < n - 1) throw new Error(`Seulement ${silences.length} pauses trouvées pour ${n} phrases : laissez une courte pause entre chaque phrase.`)
const cuts = silences.sort((a, b) => b.end - b.start - (a.end - a.start)).slice(0, n - 1).sort((a, b) => a.start - b.start)
const bounds = [0, ...cuts.map((c) => (c.start + c.end) / 2), total]

const dir = path.join(ROOT, `public/voix/${id}`)
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const durees = []
for (let i = 0; i < n; i++) {
  const file = path.join(dir, `${String(i).padStart(2, '0')}.mp3`)
  // Chaque morceau sans les silences du début et de la fin.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-ss', String(bounds[i]), '-to', String(bounds[i + 1]), '-af', 'silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse', '-c:a', 'libmp3lame', '-q:a', '2', file])
  durees.push(Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim()))
}
fs.writeFileSync(path.join(ROOT, `src/videos/${id}.voix.json`), JSON.stringify({ durees, ext: 'mp3' }, null, 1))
console.log(id, durees.map((d) => d.toFixed(1)).join(' + '), '=', durees.reduce((a, b) => a + b, 0).toFixed(1), 's')
