// Voix off de chaque scène.
// - Avec ELEVENLABS_API_KEY (et ELEVENLABS_VOICE_ID, facultatif) : voix ElevenLabs, horodatée mot à mot
//   (sous-titres parfaitement synchronisés). api.elevenlabs.io doit être autorisé par le réseau.
// - Sinon : Piper (libre, hors ligne), mots horodatés par estimation.
// Écrit public/voix/<id>/NN.(mp3|wav) et src/videos/<id>.voix.json. Usage : node scripts/voix.mjs [presentation]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const KEY = process.env.ELEVENLABS_API_KEY
// Voix par défaut : modifiable (identifiant visible dans la bibliothèque de voix d'ElevenLabs).
const VOICE = process.env.ELEVENLABS_VOICE_ID ?? 'XB0fDUnXU5powFXDhCwa'
const PIPER = process.env.PIPER_DIR ?? path.join(ROOT, '.outils/piper')
// Prononciation : « Bailio » se dit « Baïlio ».
const SAY = (t) => t.replace(/Bailio/g, 'Baïlio').replace(/…/g, '...')
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim())

async function eleven(text, file) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: SAY(text), model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } }),
  })
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} : ${await r.text()}`)
  const j = await r.json()
  fs.writeFileSync(file, Buffer.from(j.audio_base64, 'base64'))
  // Caractères horodatés → mots horodatés (le texte affiché garde « Bailio »).
  const a = j.alignment
  const words = []
  let cur = null
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur)
      cur = null
      return
    }
    if (!cur) cur = { w: '', start: a.character_start_times_seconds[i], end: 0 }
    cur.w += ch
    cur.end = a.character_end_times_seconds[i]
  })
  if (cur) words.push(cur)
  return words.map((w) => ({ ...w, w: w.w.replace(/Baïlio/g, 'Bailio') }))
}

function piper(text, file) {
  execFileSync(path.join(PIPER, 'piper/piper'), ['--model', path.join(PIPER, 'fr-siwis-medium.onnx'), '--output_file', file, '--length_scale', '0.86', '--sentence_silence', '0.1'], { input: SAY(text), stdio: ['pipe', 'ignore', 'ignore'] })
  return null
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ROOT, 'src/videos')).filter((f) => f.endsWith('.json') && !f.endsWith('.voix.json')).map((f) => f.replace('.json', ''))
for (const id of ids) {
  const video = JSON.parse(fs.readFileSync(path.join(ROOT, `src/videos/${id}.json`), 'utf8'))
  const dir = path.join(ROOT, `public/voix/${id}`)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const ext = KEY ? 'mp3' : 'wav'
  const durees = []
  const mots = []
  for (const [i, s] of video.scenes.entries()) {
    const file = path.join(dir, `${String(i).padStart(2, '0')}.${ext}`)
    mots.push(KEY ? await eleven(s.voix, file) : piper(s.voix, file))
    durees.push(duration(file))
  }
  fs.writeFileSync(path.join(ROOT, `src/videos/${id}.voix.json`), JSON.stringify({ durees, ext, ...(KEY ? { mots } : {}) }, null, 1))
  console.log(`${id} (${KEY ? 'ElevenLabs' : 'Piper'}) :`, durees.map((d) => d.toFixed(1)).join(' + '), '=', durees.reduce((a, b) => a + b, 0).toFixed(1), 's')
}
