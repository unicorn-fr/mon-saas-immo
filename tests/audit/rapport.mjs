// Regroupe les résultats (tests/audit/resultats/*.json) dans audit/resultats-tests.md et audit/resume-tests.json.
// Usage : node tests/audit/rapport.mjs
import fs from 'node:fs'
import { CONFIGS, RESULTS, ROOT } from './lib.mjs'

const files = fs.readdirSync(RESULTS).filter((f) => /^(pages|parcours|liens-externes|dashboard)/.test(f) && f.endsWith('.json') && !f.includes('externes.json'))
const rows = files.flatMap((f) => JSON.parse(fs.readFileSync(RESULTS + f, 'utf8'))).filter((r) => r.status !== 'INFO')
const engines = files.flatMap((f) => JSON.parse(fs.readFileSync(RESULTS + f, 'utf8'))).filter((r) => r.status === 'INFO')
const SEV = ['Bloquant', 'Majeur', 'Mineur', 'Cosmétique']
const md = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')
const devices = [...CONFIGS.map((c) => c.label), 'Serveur (curl)']

// Résumé
const by = (pred) => rows.filter(pred).length
const summary = {
  generatedAt: new Date().toISOString(),
  elements: rows.length,
  ok: by((r) => r.status === 'OK'),
  ko: by((r) => r.status === 'KO'),
  improve: by((r) => r.status === 'À améliorer'),
  bySeverity: Object.fromEntries(SEV.map((s) => [s, by((r) => r.status !== 'OK' && r.severity === s)])),
  byDevice: Object.fromEntries(devices.map((d) => [d, { tested: by((r) => r.device === d), ko: by((r) => r.device === d && r.status === 'KO'), improve: by((r) => r.device === d && r.status === 'À améliorer') }])),
}
fs.writeFileSync(`${ROOT}audit/resume-tests.json`, JSON.stringify(summary, null, 1))

let out = `# Résultats des tests automatiques\n\nGénéré par \`tests/audit/rapport.mjs\` le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}.\n\n`
out += `**${summary.elements} vérifications** : ${summary.ok} OK, ${summary.ko} KO, ${summary.improve} à améliorer.\n\n`
out += '## Par appareil\n\n| Appareil | Moteur utilisé | Vérifications | KO | À améliorer |\n|---|---|---|---|---|\n'
for (const d of devices) {
  const s = summary.byDevice[d]
  if (!s.tested) continue
  const eng = engines.find((e) => e.device === d)?.actual ?? '—'
  out += `| ${d} | ${md(eng)} | ${s.tested} | ${s.ko} | ${s.improve} |\n`
}
out += '\n## Par gravité (KO et à améliorer)\n\n| Gravité | Nombre |\n|---|---|\n' + SEV.map((s) => `| ${s} | ${summary.bySeverity[s]} |`).join('\n') + '\n'

// Anomalies : regroupées par page, élément et constat ; appareils listés.
const key = (r) => [r.page, r.element, r.action, r.status, r.actual.replace(/\d+(\.\d+)? s\b/, '…').replace(/\d+×\d+/g, '')].join('¤')
const groups = new Map()
for (const r of rows.filter((r) => r.status !== 'OK')) {
  const k = key(r)
  if (!groups.has(k)) groups.set(k, { ...r, devices: new Set(), shots: [] })
  const g = groups.get(k)
  g.devices.add(r.device)
  if (r.screenshot && g.shots.length < 2) g.shots.push(r.screenshot)
}
const anomalies = [...groups.values()].sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity) || a.page.localeCompare(b.page))
out += `\n## Anomalies et points à améliorer (${anomalies.length} constats distincts)\n\n| Gravité | Statut | Page | Élément | Action | Attendu | Obtenu | Appareils | Capture |\n|---|---|---|---|---|---|---|---|---|\n`
for (const a of anomalies) out += `| ${a.severity ?? ''} | ${a.status} | ${md(a.page)} | ${md(a.element)} | ${md(a.action)} | ${md(a.expected)} | ${md(a.actual).slice(0, 400)} | ${[...a.devices].join(', ')} | ${a.shots.map((s) => `[voir](${s})`).join(' ')} |\n`

// Tous les éléments testés (OK compris), regroupés par page et élément.
const all = new Map()
for (const r of rows) {
  const k = [r.page, r.element, r.action].join('¤')
  if (!all.has(k)) all.set(k, { page: r.page, element: r.element, action: r.action, expected: r.expected, ok: new Set(), ko: new Set(), imp: new Set(), actual: r.actual })
  const g = all.get(k)
  ;(r.status === 'OK' ? g.ok : r.status === 'KO' ? g.ko : g.imp).add(r.device)
  if (r.status !== 'OK') g.actual = r.actual
}
out += `\n## Tous les éléments testés (${all.size} lignes, ${rows.length} vérifications)\n\n| Page | Élément | Action | Attendu | Statut | Appareils OK | Appareils KO / à améliorer | Obtenu (si KO) |\n|---|---|---|---|---|---|---|---|\n`
const short = (set) => (set.size === CONFIGS.length ? 'les 12' : [...set].map((d) => d.replace(/ \(.*\)/, '')).join(', '))
for (const g of [...all.values()].sort((a, b) => a.page.localeCompare(b.page))) {
  const status = g.ko.size ? 'KO' : g.imp.size ? 'À améliorer' : 'OK'
  out += `| ${md(g.page)} | ${md(g.element)} | ${md(g.action)} | ${md(g.expected)} | ${status} | ${short(g.ok)} | ${short(new Set([...g.ko, ...g.imp]))} | ${status === 'OK' ? '' : md(g.actual).slice(0, 200)} |\n`
}
fs.writeFileSync(`${ROOT}audit/resultats-tests.md`, out)
console.log(JSON.stringify(summary, null, 1))
