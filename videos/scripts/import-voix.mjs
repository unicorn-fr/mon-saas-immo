// Voix enregistrée ailleurs (ElevenLabs sur le site, ou votre téléphone) : un seul fichier audio pour toute la vidéo.
// Il est découpé aux silences, une phrase par scène, puis rangé comme les voix générées.
// Usage : node scripts/import-voix.mjs presentation chemin/vers/voix.mp3 [mots.json]
// mots.json (facultatif) : transcription horodatée d'ElevenLabs (liste { text, start, end }) : coupures au mot près et
// sous-titres synchronisés. Sans elle, coupures aux silences.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const [id, input, wordsFile] = process.argv.slice(2)
if (!id || !input) throw new Error('Usage : node scripts/import-voix.mjs <id> <fichier audio>')
const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
const n = video.scenes.length
const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' }).trim())

const weights = video.scenes.map((s) => s.voix.replace(/[^\p{L}\p{N}]/gu, '').length + 4)
const sum = weights.reduce((a, b) => a + b, 0)
const share = weights.slice(0, -1).map((_, k) => weights.slice(0, k + 1).reduce((a, b) => a + b, 0) / sum)

/** Choisit, dans l'ordre, n-1 coupures parmi les candidates : au plus près de la fin attendue de chaque phrase. */
function pick(cands, expected, bonus = () => 0) {
  const cost = (k, j) => Math.abs(cands[j].at - expected[k]) - bonus(cands[j])
  const best = expected.map(() => cands.map(() => Infinity))
  const from = expected.map(() => cands.map(() => -1))
  cands.forEach((_, j) => (best[0][j] = cost(0, j)))
  for (let k = 1; k < expected.length; k++)
    for (let j = k; j < cands.length; j++)
      for (let i = k - 1; i < j; i++)
        if (best[k - 1][i] + cost(k, j) < best[k][j]) {
          best[k][j] = best[k - 1][i] + cost(k, j)
          from[k][j] = i
        }
  let j = best[expected.length - 1].indexOf(Math.min(...best[expected.length - 1]))
  const out = []
  for (let k = expected.length - 1; k >= 0; k--) {
    out.unshift(cands[j])
    j = from[k][j]
  }
  return out
}

let bounds
let sceneWords = null
if (wordsFile) {
  // Mots de la transcription ; la ponctuation isolée (« ? ») rejoint le mot précédent.
  const raw = JSON.parse(fs.readFileSync(wordsFile, 'utf8'))
  const words = []
  for (const w of Array.isArray(raw) ? raw : raw.words) {
    if (w.type && w.type !== 'word') continue
    if (!/[\p{L}\p{N}]/u.test(w.text) && words.length) words[words.length - 1].text += w.text.trim()
    else words.push({ text: w.text.trim(), start: w.start, end: w.end })
  }
  // Coupures possibles : après un mot qui finit une phrase, au milieu du blanc qui suit.
  const cands = []
  for (let i = 0; i < words.length - 1; i++) if (/[.?!…]$/.test(words[i].text)) cands.push({ i, at: (words[i].end + words[i + 1].start) / 2, gap: words[i + 1].start - words[i].end })
  if (cands.length < n - 1) throw new Error(`Seulement ${cands.length} fins de phrase reconnues pour ${n} scènes.`)
  const spoken = words[words.length - 1].end
  const cuts = pick(cands, share.map((x) => x * spoken), (c) => 3 * c.gap)
  const groups = []
  let from = 0
  for (const c of [...cuts, { i: words.length - 1 }]) {
    groups.push(words.slice(from, c.i + 1))
    from = c.i + 1
  }
  bounds = groups.map((g) => [Math.max(0, g[0].start - 0.04), Math.min(total, g[g.length - 1].end + 0.12)])
  // Sous-titres : le texte du script quand il a autant de mots que la transcription (orthographe exacte), sinon la transcription.
  sceneWords = groups.map((g, k) => {
    const script = video.scenes[k].voix.split(/\s+/).reduce((acc, t) => (/[\p{L}\p{N}]/u.test(t) || !acc.length ? [...acc, t] : [...acc.slice(0, -1), `${acc[acc.length - 1]} ${t}`]), [])
    return g.map((w, i) => ({ w: script.length === g.length ? script[i] : w.text, start: w.start - bounds[k][0], end: w.end - bounds[k][0] }))
  })
} else {
// Silences d'au moins 0,25 s. Une voix naturelle respire aussi au milieu des phrases : on choisit, dans l'ordre,
// les n-1 pauses les plus proches de la fin attendue de chaque phrase (d'après sa longueur), en préférant les plus longues.
const out = spawnSync('ffmpeg', ['-i', input, '-af', 'silencedetect=noise=-35dB:d=0.25', '-f', 'null', '-'], { encoding: 'utf8' }).stderr
const silences = [...out.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => ({ start: Number(m[1]), end: Number(m[2]) })).filter((s) => s.start > 0.3 && s.end < total - 0.3)
if (silences.length < n - 1) throw new Error(`Seulement ${silences.length} pauses trouvées pour ${n} phrases : laissez une courte pause entre chaque phrase.`)
const cuts = pick(silences.map((x) => ({ ...x, at: (x.start + x.end) / 2 })), share.map((x) => x * total), (c) => 3 * (c.end - c.start))
const edges = [0, ...cuts.map((c) => c.at), total]
bounds = edges.slice(0, -1).map((e, i) => [e, edges[i + 1]])
}

const dir = path.join(ROOT, `public/voix/${id}`)
fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir, { recursive: true })
const durees = []
for (let i = 0; i < n; i++) {
  const file = path.join(dir, `${String(i).padStart(2, '0')}.mp3`)
  // Chaque morceau sans les silences du début et de la fin.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-ss', String(bounds[i][0]), '-to', String(bounds[i][1]), ...(sceneWords ? [] : ['-af', 'silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse']), '-c:a', 'libmp3lame', '-q:a', '2', file])
  durees.push(Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim()))
}
fs.writeFileSync(path.join(ROOT, `src/videos/${id}.voix.json`), JSON.stringify({ durees, ext: 'mp3', ...(sceneWords ? { mots: sceneWords } : {}) }, null, 1))
console.log(id, durees.map((d) => d.toFixed(1)).join(' + '), '=', durees.reduce((a, b) => a + b, 0).toFixed(1), 's')
