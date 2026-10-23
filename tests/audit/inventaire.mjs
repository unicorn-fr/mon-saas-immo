// Inventaire automatique des éléments interactifs de chaque page (client/src) : boutons, liens, champs, onglets, modales.
// Usage : node tests/audit/inventaire.mjs > audit/inventaire.md
import fs from 'node:fs'
import path from 'node:path'

const root = new URL('../../client/src/', import.meta.url).pathname
const files = []
const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(f) && !/test/.test(f) && files.push(p) })
walk(path.join(root, 'pages')); walk(path.join(root, 'components'))

const clean = (s) => s.replace(/\{[^}]*\}/g, '…').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const uniq = (a) => [...new Set(a.filter((x) => x && x.length > 1 && x.length < 90))]

let out = '# Inventaire automatique des éléments interactifs\n\nGénéré par `tests/audit/inventaire.mjs` à partir du code (`client/src`). Sert de liste de contrôle : chaque élément est couvert par un test automatique ou par le tableau de bord manuel.\n'
for (const f of files.sort()) {
  const src = fs.readFileSync(f, 'utf8')
  const buttons = uniq([...src.matchAll(/<(Btn|Button|ButtonLink|button|TextLink)\b([\s\S]{0,900}?)<\/\1>/g)].map((m) => { const parts = m[2].split(/(?<!=)>/); return clean(parts.slice(1).join(' ')) }))
  const links = uniq([...src.matchAll(/\b(?:to|href)=(?:\{\s*)?([`"'])([^`"']+)\1/g)].map((m) => m[2]))
  const fields = uniq([...src.matchAll(/<(?:Input|Money|NumberField|Select|TextArea|TextField|Check|Toggle|Chips|MultiChips|AddressField)\b[^>]*?\b(?:label|legend)=(["'])([^"']+)\1/g)].map((m) => m[2]))
  const modals = uniq([...src.matchAll(/<Modal\b[^>]*?title=(?:\{\s*)?(["'`])([^"'`]+)\1/g)].map((m) => m[2]))
  const tabs = uniq([...src.matchAll(/\{\s*value:\s*'[^']+',\s*label:\s*'([^']+)'\s*\}/g)].map((m) => m[1]))
  const aria = uniq([...src.matchAll(/aria-label=(["'])([^"']+)\1/g)].map((m) => m[2]))
  if (!buttons.length && !links.length && !fields.length) continue
  out += `\n## ${path.relative(root, f)}\n`
  if (links.length) out += `- **Liens** : ${links.map((l) => '`' + l + '`').join(', ')}\n`
  if (buttons.length) out += `- **Boutons** : ${buttons.join(' · ')}\n`
  if (fields.length) out += `- **Champs** : ${fields.join(' · ')}\n`
  if (tabs.length) out += `- **Choix / onglets / filtres** : ${tabs.slice(0, 40).join(' · ')}${tabs.length > 40 ? ' …' : ''}\n`
  if (modals.length) out += `- **Fenêtres (modales)** : ${modals.join(' · ')}\n`
  if (aria.length) out += `- **Éléments nommés (aria-label)** : ${aria.join(' · ')}\n`
}
process.stdout.write(out)
