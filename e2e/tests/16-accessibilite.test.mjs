import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { BASE, api, completeLease, fromLog, launch, logSize, newAccount, signedInContext, wait } from '../lib.mjs'

/**
 * Accessibilité (RGAA 4.1, WCAG 2.1 niveau AA) : chaque page est contrôlée par axe-core.
 * Toute violation (contraste, image sans texte, champ sans intitulé, langue, titre…) fait échouer le test.
 */
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

async function audit(page, path) {
  await page.goto(BASE + path)
  await page.waitForLoadState('networkidle')
  await wait(300)
  await page.addScriptTag({ content: AXE })
  const result = await page.evaluate(() =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }),
  )
  return result.violations.map((v) => `${path} · ${v.id} (${v.impact}) : ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => n.target.join(' ') + ' → ' + (n.failureSummary ?? '').split('\n').slice(1).join(' ')).join('\n    ')}`)
}

const PUBLIC = ['/', '/connexion', '/commencer', '/commencer/logement', '/commencer/personnes', '/commencer/loyer', '/commencer/relecture', '/commencer/recevoir', '/importer', '/mentions-legales', '/conditions', '/confidentialite', '/cookies', '/prix-et-remboursement', '/contact', '/accessibilite', '/page-inexistante']

test('pages publiques : aucune violation WCAG 2.1 AA', async () => {
  const browser = await launch()
  const problems = []
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport })
    for (const path of PUBLIC) problems.push(...(await audit(page, path)))
    await page.close()
  }
  await browser.close()
  assert.deepEqual(problems, [], problems.join('\n'))
})

test('espace du propriétaire : aucune violation WCAG 2.1 AA', async () => {
  const { token } = await newAccount()
  const { leaseId, propertyId, tenantId } = await completeLease(token)
  const browser = await launch()
  const ctx = await signedInContext(browser, token)
  const page = await ctx.newPage()
  const problems = []
  const pages = [
    '/espace', '/espace/logements', '/espace/logements/nouveau', `/espace/logements/${propertyId}`, `/espace/logements/${propertyId}/fiche`,
    `/espace/logements/${propertyId}/annonce`, `/espace/logements/${propertyId}/candidats`,
    '/espace/locataires', '/espace/locataires/nouveau', `/espace/locataires/${tenantId}`, `/espace/locataires/${tenantId}/fiche`, `/espace/locataires/${tenantId}/caution`,
    `/espace/baux/nouveau?logement=${propertyId}`, `/espace/baux/${leaseId}`, `/espace/baux/${leaseId}/contrat`, `/espace/baux/${leaseId}/courriers`, `/espace/baux/${leaseId}/etat-des-lieux`, `/espace/baux/${leaseId}/parcours/DEPARTURE`,
    '/espace/documents', '/espace/argent', '/espace/argent/bilan', '/espace/argent/declaration', '/espace/argent/facture', '/espace/argent/releve',
    '/espace/situations', '/espace/compte', '/espace/compte/profil', '/espace/carnet', '/espace/corbeille',
  ]
  for (const path of pages) problems.push(...(await audit(page, path)))
  // Liens publics remis au locataire et aux candidats (sans compte).
  const { applyCode } = await api(`/properties/${propertyId}/apply-link`, { method: 'POST', token, body: { open: true } })
  const other = await api('/tenants', { method: 'POST', token, body: { propertyId, email: `dossier+${Date.now()}@example.fr`, guarantee: 'NONE' } })
  const { url: formUrl } = await api(`/tenants/${other.id}/request`, { method: 'POST', token, body: { send: false } })
  await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
  const { url: tenantUrl } = await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
  const pub = await browser.newPage()
  for (const path of [`/candidature/${applyCode}`, new URL(formUrl).pathname, new URL(tenantUrl).pathname]) problems.push(...(await audit(pub, path)))
  await browser.close()
  assert.deepEqual(problems, [], problems.join('\n'))
})

test('signature en ligne : aucune violation WCAG 2.1 AA', async () => {
  const { token } = await newAccount()
  const { leaseId } = await completeLease(token)
  const before = logSize()
  await api(`/leases/${leaseId}/esign`, { method: 'POST', token })
  const [[, url]] = await fromLog(/Relire et signer : (http:\/\/[^\s]+\/signer\/[^\s]+)/g, before)
  const browser = await launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const problems = await audit(page, new URL(url).pathname)
  await browser.close()
  assert.deepEqual(problems, [], problems.join('\n'))
})
