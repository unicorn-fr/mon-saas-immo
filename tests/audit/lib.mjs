import fs from 'node:fs'
import { createRequire } from 'node:module'
import { BASE, API, api, fromLog, logSize, newAccount, completeLease, signAs, wait } from '../../e2e/lib.mjs'

/**
 * Outils communs de l'audit multi-appareils. Playwright est celui des parcours (`e2e/`).
 * Rien n'est envoyé : l'API locale tourne sans service d'email (les emails sont écrits dans son journal).
 */
const require = createRequire(new URL('../../e2e/package.json', import.meta.url))
export const pw = require('playwright')
export { BASE, API, api, fromLog, logSize, newAccount, completeLease, signAs, wait }

export const ROOT = new URL('../../', import.meta.url).pathname
export const RESULTS = new URL('./resultats/', import.meta.url).pathname
export const SHOTS = `${ROOT}audit/anomalies/`
fs.mkdirSync(RESULTS, { recursive: true })
fs.mkdirSync(SHOTS, { recursive: true })

const d = pw.devices
/** Les 12 configurations demandées. `engine` : moteur voulu ; s'il n'est pas installé, Chromium émule l'appareil. */
export const CONFIGS = [
  { id: 'iphone-portrait', label: 'iPhone portrait (Safari/WebKit)', kind: 'Smartphone', engine: 'webkit', opts: d['iPhone 14'] },
  { id: 'iphone-paysage', label: 'iPhone paysage (Safari/WebKit)', kind: 'Smartphone', engine: 'webkit', opts: d['iPhone 14 landscape'] },
  { id: 'android-portrait', label: 'Android portrait (Chrome)', kind: 'Smartphone', engine: 'chromium', opts: d['Pixel 7'] },
  { id: 'android-paysage', label: 'Android paysage (Chrome)', kind: 'Smartphone', engine: 'chromium', opts: d['Pixel 7 landscape'] },
  { id: 'ipad-portrait', label: 'iPad portrait (Safari/WebKit)', kind: 'Tablette', engine: 'webkit', opts: d['iPad (gen 7)'] },
  { id: 'ipad-paysage', label: 'iPad paysage (Safari/WebKit)', kind: 'Tablette', engine: 'webkit', opts: d['iPad (gen 7) landscape'] },
  { id: 'chrome-1366', label: 'Chrome 1366 px', kind: 'Ordinateur', engine: 'chromium', opts: { viewport: { width: 1366, height: 768 } } },
  { id: 'chrome-1920', label: 'Chrome 1920 px', kind: 'Ordinateur', engine: 'chromium', opts: { viewport: { width: 1920, height: 1080 } } },
  { id: 'firefox-1366', label: 'Firefox 1366 px', kind: 'Ordinateur', engine: 'firefox', opts: { viewport: { width: 1366, height: 768 } } },
  { id: 'firefox-1920', label: 'Firefox 1920 px', kind: 'Ordinateur', engine: 'firefox', opts: { viewport: { width: 1920, height: 1080 } } },
  { id: 'safari-1366', label: 'Safari 1366 px (WebKit)', kind: 'Ordinateur', engine: 'webkit', opts: { viewport: { width: 1366, height: 768 } } },
  { id: 'safari-1920', label: 'Safari 1920 px (WebKit)', kind: 'Ordinateur', engine: 'webkit', opts: { viewport: { width: 1920, height: 1080 } } },
]

/** Configurations retenues : `AUDIT_DEVICES=iphone-portrait,chrome-1366` pour n'en lancer que certaines. */
export function selectedConfigs() {
  const only = process.env.AUDIT_DEVICES?.split(',').map((s) => s.trim()).filter(Boolean)
  return only?.length ? CONFIGS.filter((c) => only.includes(c.id)) : CONFIGS
}

const browsers = {}
/** Navigateur de la configuration : le moteur voulu s'il est installé, sinon Chromium (signalé dans les résultats). */
export async function browserFor(config) {
  const engines = [config.engine, 'chromium']
  for (const engine of engines) {
    if (browsers[engine] === null) continue
    if (!browsers[engine]) {
      try {
        const exe = engine === 'chromium' ? process.env.CHROMIUM_PATH || undefined : undefined
        browsers[engine] = await pw[engine].launch(exe ? { executablePath: exe } : {})
      } catch {
        browsers[engine] = null
        continue
      }
    }
    return { browser: browsers[engine], engine, emulated: engine !== config.engine }
  }
  throw new Error('Aucun navigateur disponible')
}
export async function closeBrowsers() {
  for (const b of Object.values(browsers)) await b?.close().catch(() => undefined)
}

/** Contexte de navigateur pour la configuration (connecté si `token`). Firefox ne gère pas `isMobile`. */
export async function contextFor(config, { token } = {}) {
  const { browser, engine, emulated } = await browserFor(config)
  const opts = { ...config.opts, locale: 'fr-FR', timezoneId: 'Europe/Paris' }
  delete opts.defaultBrowserType
  if (engine === 'firefox') delete opts.isMobile
  if (token) opts.storageState = { cookies: [], origins: [{ origin: new URL(BASE).origin, localStorage: [{ name: 'bailio.session', value: token }] }] }
  const ctx = await browser.newContext(opts)
  ctx.audit = { engine, emulated }
  return ctx
}

/** Erreurs relevées sur une page : exceptions, console, requêtes en échec (API ≥ 400, ressources). */
export function watch(page, { allow = [] } = {}) {
  const errors = []
  const ok = (t) => !allow.some((a) => t.includes(a))
  page.on('pageerror', (e) => ok(e.message) && errors.push(`Exception JavaScript : ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && ok(m.text()) && errors.push(`Console : ${m.text().slice(0, 300)}`))
  page.on('requestfailed', (r) => {
    const f = r.failure()?.errorText ?? ''
    // Requêtes interrompues par un changement de page : normales.
    if (/aborted|cancelled|NS_BINDING_ABORTED|Load request cancelled/i.test(f)) return
    if (ok(r.url())) errors.push(`Requête en échec : ${r.method()} ${r.url().replace(BASE, '')} (${f})`)
  })
  page.on('response', async (r) => {
    if (!(r.status() >= 400 && ok(r.url()) && (r.url().startsWith(BASE) || r.url().startsWith(API)))) return
    // Message de l'API (affiché à l'utilisateur), pour comprendre l'erreur.
    const message = r.url().includes('/api/') ? await r.json().then((j) => j.message).catch(() => '') : ''
    errors.push(`HTTP ${r.status()} : ${r.request().method()} ${r.url().replace(BASE, '')}${message ? ` (« ${message} »)` : ''}`)
  })
  return errors
}

/** Résultats : une ligne par élément testé, écrite dans tests/audit/resultats/<suite>.json. */
export class Results {
  constructor(suite) {
    this.suite = suite
    this.rows = []
    this.file = `${RESULTS}${suite}.json`
  }
  add(row) {
    this.rows.push({ suite: this.suite, ...row })
  }
  ok(page, element, device, action, expected, actual = 'Conforme') {
    this.add({ page, element, device, action, expected, actual, status: 'OK' })
  }
  ko(page, element, device, action, expected, actual, severity = 'Majeur', extra = {}) {
    this.add({ page, element, device, action, expected, actual, status: 'KO', severity, ...extra })
  }
  improve(page, element, device, action, expected, actual, severity = 'Mineur', extra = {}) {
    this.add({ page, element, device, action, expected, actual, status: 'À améliorer', severity, ...extra })
  }
  save() {
    fs.writeFileSync(this.file, JSON.stringify(this.rows, null, 1))
    const n = (s) => this.rows.filter((r) => r.status === s).length
    console.log(`${this.suite} : ${this.rows.length} éléments, ${n('OK')} OK, ${n('KO')} KO, ${n('À améliorer')} à améliorer`)
  }
}

/** Capture d'écran d'une anomalie (écran visible, JPEG léger), nommée avec l'appareil. Renvoie le chemin relatif au dossier audit/. */
export async function anomalyShot(page, config, name) {
  const file = `${config.id}--${name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80)}.jpg`
  await page.screenshot({ path: SHOTS + file, type: 'jpeg', quality: 55 }).catch(() => undefined)
  return `anomalies/${file}`
}

/** Attend que la page de l'application soit affichée (plus de « Chargement »). */
export async function settle(page, ms = 350) {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)
  await page.waitForFunction(() => !document.querySelector('[aria-label="Chargement"]') && document.querySelector('#root')?.children.length, null, { timeout: 15000 }).catch(() => undefined)
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined)
  await page.waitForTimeout(ms)
}

/** Lien de connexion envoyé à cette adresse (plusieurs tests tournent en même temps : on ne prend pas le lien d'un autre). */
export async function loginLinkFor(email, after, timeout = 15000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const text = fs.readFileSync(process.env.E2E_API_LOG ?? '/tmp/bailio-api.log').subarray(after).toString('utf8')
    const at = text.lastIndexOf(`→ ${email}`)
    const m = at >= 0 ? /(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/.exec(text.slice(at)) : null
    if (m) return m[1]
    await wait(250)
  }
  throw new Error(`Lien de connexion introuvable pour ${email}`)
}

export function readSeed() {
  return JSON.parse(fs.readFileSync(`${RESULTS}seed.json`, 'utf8'))
}
