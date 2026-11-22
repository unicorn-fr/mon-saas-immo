/* Extrait les images des vidéos Pexels pour chaque scène « clip » d'une vidéo kit2 (30 images/s, recadrées).
   Usage : node kit2/prep.cjs semaine-48/bail2026.spec.js */
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process')
const file = path.resolve(process.argv[2]), ctx = { window: {} }
vm.runInNewContext(fs.readFileSync(file, 'utf8'), ctx)
const S = ctx.window.SPEC, root = path.join(__dirname, '..', 'clips')
S.scenes.forEach((s, i) => {
  if (s.kind !== 'clip') return
  const next = S.scenes[i + 1]?.at ?? S.end, dur = next - s.at + 0.4
  const out = path.join(root, 'frames', `${S.name}-${i}`)
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true })
  execFileSync('ffmpeg', ['-v', 'error', '-stream_loop', '-1', '-ss', String(s.from ?? 0), '-i', path.join(root, 'src', `${s.clip}.mp4`), '-t', dur.toFixed(2),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30', '-q:v', '3', path.join(out, '%05d.jpg')])
  console.log(S.name, i, s.clip, fs.readdirSync(out).length, 'images')
})
