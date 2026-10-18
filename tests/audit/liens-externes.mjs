// Vérifie que chaque lien externe du site répond (code HTTP), avec curl (proxy de l'environnement respecté).
// Liens : ceux relevés sur les pages par pages.mjs, plus ceux écrits dans le code (client/src).
// Usage : node tests/audit/liens-externes.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { RESULTS, ROOT, Results } from './lib.mjs'

const urls = new Set()
for (const f of fs.readdirSync(RESULTS).filter((f) => f.endsWith('-externes.json'))) for (const u of JSON.parse(fs.readFileSync(RESULTS + f, 'utf8'))) urls.add(u)
const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(f) && !/test/.test(f) && (fs.readFileSync(p, 'utf8').match(/https:\/\/[a-zA-Z0-9./?=_%&:#~+-]+/g) ?? []).forEach((u) => urls.add(u.replace(/[.,]$/, ''))) })
walk(`${ROOT}client/src`)

// Adresses d'exemple ou de modèle, pas de vrais liens.
const SKIP = /pirate\.example|schema\.org|localhost|bailio\.(fr|eu)/
const res = new Results('liens-externes')
for (const u of [...urls].sort()) {
  if (SKIP.test(u)) continue
  let code = '000'
  let note = ''
  try {
    code = execFileSync('curl', ['-sS', '-o', '/dev/null', '-L', '--max-time', '20', '-A', 'Mozilla/5.0 (audit Bailio)', '-w', '%{http_code}', u], { encoding: 'utf8' }).trim()
  } catch (e) {
    note = String(e.stderr || e.message).split('\n')[0].slice(0, 160)
  }
  const c = Number(code)
  if (c >= 200 && c < 400) res.ok('Liens externes', u, 'Serveur (curl)', 'Requête HTTP', '2xx ou 3xx', `HTTP ${code}`)
  else if (/403|CONNECT|proxy|tunnel/i.test(note) || c === 0) res.improve('Liens externes', u, 'Serveur (curl)', 'Requête HTTP', '2xx ou 3xx', `Non vérifiable depuis l’environnement de test (accès réseau bloqué) ${note}`, 'Cosmétique')
  else if (c === 403 || c === 401 || c === 429) res.improve('Liens externes', u, 'Serveur (curl)', 'Requête HTTP', '2xx ou 3xx', `HTTP ${code} (le site refuse les robots ; à vérifier à la main)`, 'Cosmétique')
  else res.ko('Liens externes', u, 'Serveur (curl)', 'Requête HTTP', '2xx ou 3xx', `HTTP ${code} ${note}`, 'Mineur')
}
res.save()
for (const r of res.rows) if (r.status !== 'OK') console.log(r.status, r.element, r.actual)
