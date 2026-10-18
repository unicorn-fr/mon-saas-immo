// Audit de chaque page sur chaque appareil : affichage, erreurs, mise en page, accessibilité, liens et boutons cliqués.
// Usage : AUDIT_DEVICES=iphone-portrait node tests/audit/pages.mjs   (toutes les configurations sans AUDIT_DEVICES)
// Options : AUDIT_CLICKS=0 (ne pas cliquer liens et boutons), AUDIT_ROUTES=motif (seulement les pages dont le chemin contient le motif)
import fs from 'node:fs'
import { BASE, Results, anomalyShot, closeBrowsers, contextFor, readSeed, selectedConfigs, settle, watch } from './lib.mjs'
import { DANGEROUS, routes } from './routes.mjs'

const AXE = fs.readFileSync(new URL('../../e2e/node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')
const seed = readSeed()
const CLICKS = process.env.AUDIT_CLICKS !== '0'
const ONLY = process.env.AUDIT_ROUTES
// Messages attendus : la page 404 et les liens invalides testés exprès renvoient 404 de l'API ; la vérification d'un faux lien de connexion, 400.
const EXPECTED = ['/api/esign/lien-inconnu', '/api/locataire/inconnu', '/api/candidature/inconnu', '/api/dossier/inconnu', '/api/auth/magic-link/verify', '/api/drafts/', '00000000-0000-4000-8000-000000000000', 'Failed to load resource: the server responded with a status of 404', 'Failed to load resource: the server responded with a status of 400']

/** Relevés faits dans la page (mise en page, texte, images, champs, cibles tactiles). */
function inspect({ touch, mobile }) {
  const vw = document.documentElement.clientWidth
  const visible = (el) => {
    const b = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0
  }
  const label = (el) => (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || el.getAttribute('href') || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 60)
  const clipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true
    }
    return false
  }
  const r = {}
  r.scrollWidth = document.documentElement.scrollWidth
  r.vw = vw
  r.notFound = /Page introuvable/i.test(document.querySelector('h1')?.textContent ?? '')
  r.text = (document.querySelector('#root')?.innerText ?? '').trim().length
  r.h1 = document.querySelector('h1')?.textContent?.trim().slice(0, 80) ?? null
  r.title = document.title
  // Éléments hors de l'écran (à droite ou à gauche) sans conteneur qui défile.
  r.offscreen = []
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || getComputedStyle(el).position === 'fixed' || el.closest('[aria-hidden=true], [aria-hidden=""]')) continue
    const b = el.getBoundingClientRect()
    if ((b.right > vw + 1 || b.left < -1) && !clipped(el) && el.children.length === 0) r.offscreen.push(`${el.tagName.toLowerCase()} « ${label(el)} » (${Math.round(b.left)}→${Math.round(b.right)} px)`)
  }
  r.offscreen = r.offscreen.slice(0, 8)
  // Textes oubliés ou valeurs techniques affichées.
  const body = document.body.innerText
  r.leftovers = [...new Set((body.match(/\b(lorem|ipsum|TODO|FIXME|undefined|NaN|\[object Object\]|null €|Invalid Date)\b/gi) ?? []))]
  // Images cassées ou sans texte alternatif.
  r.brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map((i) => i.src.replace(location.origin, ''))
  r.noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.replace(location.origin, '').slice(0, 80))
  // Cibles tactiles trop petites (24 px = minimum WCAG 2.2 ; 44 px = recommandation demandée). Liens dans une phrase exclus (exception WCAG).
  const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=radio], summary')].filter(visible)
  r.small44 = []
  r.small24 = []
  for (const el of interactive) {
    if (el.closest('[aria-hidden=true]')) continue
    const b = el.getBoundingClientRect()
    const inline = el.tagName === 'A' && getComputedStyle(el).display.startsWith('inline') && el.parentElement && el.parentElement.innerText.trim().length > el.innerText.trim().length + 12
    if (inline) continue
    // Case à cocher ou bouton radio dans un libellé cliquable : la cible est le libellé.
    const target = (el.type === 'checkbox' || el.type === 'radio') && el.closest('label') ? el.closest('label').getBoundingClientRect() : b
    const w = Math.round(target.width), h = Math.round(target.height)
    // Champ masqué visuellement (fichier, case personnalisée) : c'est son libellé qu'on touche.
    if (el.tagName === 'INPUT' && w <= 2 && h <= 2 && (el.labels?.length || el.closest('label'))) continue
    if (w < 24 || h < 24) r.small24.push(`${el.tagName.toLowerCase()} « ${label(el)} » ${w}×${h}`)
    else if (w < 44 || h < 44) r.small44.push(`${el.tagName.toLowerCase()} « ${label(el)} » ${w}×${h}`)
  }
  // Tailles de texte : champs < 16 px (Safari iOS zoome), textes < 14 px.
  r.smallInputs = []
  for (const el of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), select, textarea')) {
    if (visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16) r.smallInputs.push(`« ${label(el)} » ${getComputedStyle(el).fontSize}`)
  }
  r.smallText = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim()
    if (t.length < 3 || !n.parentElement || !visible(n.parentElement)) continue
    const fs = parseFloat(getComputedStyle(n.parentElement).fontSize)
    if (fs < 13) r.smallText.push(`« ${t.slice(0, 40)} » ${fs}px`)
  }
  r.smallText = [...new Set(r.smallText)]
  // Claviers adaptés : email, téléphone, montants et nombres.
  r.keyboard = []
  for (const el of document.querySelectorAll('input')) {
    if (!visible(el) || ['checkbox', 'radio', 'file', 'hidden', 'date', 'time', 'search'].includes(el.type)) continue
    const lab = (el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.placeholder || '').toLowerCase()
    const im = el.getAttribute('inputmode') || ''
    if (/e-?mail/.test(lab) && el.type !== 'email' && im !== 'email') r.keyboard.push(`« ${lab.slice(0, 50)} » : clavier email attendu (type=${el.type}, inputmode=${im || '—'})`)
    if (/t[ée]l[ée]phone|portable/.test(lab) && el.type !== 'tel' && im !== 'tel') r.keyboard.push(`« ${lab.slice(0, 50)} » : clavier téléphone attendu (type=${el.type}, inputmode=${im || '—'})`)
    if (/(montant|loyer|charges|€|surface|revenus|prix|co[uû]t|d[ée]p[oô]t)/.test(lab) && !/(date|jour|adresse|nom|mode)/.test(lab) && el.type === 'text' && !['decimal', 'numeric'].includes(im)) r.keyboard.push(`« ${lab.slice(0, 50)} » : clavier numérique attendu`)
  }
  // Effets réservés au survol (inutilisables au doigt) : règles :hover qui font apparaître un contenu.
  r.hoverOnly = []
  for (const sheet of document.styleSheets) {
    let rules
    try { rules = sheet.cssRules } catch { continue }
    for (const rule of rules ?? []) {
      if (rule.selectorText?.includes(':hover') && /(display|visibility)\s*:/.test(rule.style?.cssText ?? '') && !/@media/.test(rule.parentRule?.cssText?.slice(0, 20) ?? '')) r.hoverOnly.push(rule.selectorText)
    }
  }
  r.touch = touch
  r.mobile = mobile
  return r
}

async function runAxe(page) {
  try {
    await page.addScriptTag({ content: AXE })
    const res = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] })
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))
    })
    return res
  } catch (e) {
    return [{ id: 'axe-error', impact: 'minor', help: e.message, nodes: 0, target: [] }]
  }
}

const samePath = (a, b) => a.replace(/\/$/, '') === b.replace(/\/$/, '')

async function auditConfig(config) {
  const res = new Results(`pages-${config.id}`)
  const device = config.label
  const contexts = {}
  const ctxFor = async (who) => (contexts[who] ??= await contextFor(config, { token: who === 'anon' ? undefined : seed[who].token }))
  const clickedLinks = new Set()
  const clickedButtons = new Set()
  const externals = new Set()
  let engineNote = null

  for (const route of routes(seed)) {
    if (ONLY && !route.path.includes(ONLY)) continue
    const ctx = await ctxFor(route.who)
    engineNote ??= ctx.audit.emulated ? `moteur ${ctx.audit.engine} (émulation de l’appareil, ${config.engine} non installé)` : `moteur ${ctx.audit.engine}`
    const page = await ctx.newPage()
    const errors = watch(page, { allow: EXPECTED })
    const pageName = `${route.name} (${route.path.split('?')[0].replace(/[A-Za-z0-9_-]{16,}/g, ':code')})`
    const t0 = Date.now()
    let status = 0
    try {
      const resp = await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
      status = resp?.status() ?? 0
    } catch (e) {
      res.ko(pageName, 'Chargement', device, 'Accès direct par URL', 'La page s’ouvre', `Échec : ${e.message.split('\n')[0]}`, 'Bloquant')
      await page.close()
      continue
    }
    await settle(page)
    const loadMs = Date.now() - t0
    const r = await page.evaluate(inspect, { touch: Boolean(config.opts.hasTouch), mobile: config.kind === 'Smartphone' })
    const shotIf = async (cond, name) => (cond ? await anomalyShot(page, config, `${route.name}-${name}`) : undefined)

    // 1. Accès direct, code HTTP, page blanche, 404, redirection.
    if (status >= 400) res.ko(pageName, 'Document', device, 'Accès direct par URL', 'HTTP 200', `HTTP ${status}`, 'Bloquant', { screenshot: await shotIf(true, 'http') })
    else res.ok(pageName, 'Document', device, 'Accès direct par URL', 'HTTP 200', `HTTP ${status}`)
    if (route.redirect) {
      const ok = new URL(page.url()).pathname === route.redirect
      ok ? res.ok(pageName, 'Redirection', device, 'Ouvrir sans être connecté', `Redirigé vers ${route.redirect}`, new URL(page.url()).pathname) : res.ko(pageName, 'Redirection', device, 'Ouvrir sans être connecté', `Redirigé vers ${route.redirect}`, page.url(), 'Bloquant', { screenshot: await shotIf(true, 'redirection') })
    }
    if (route.notFound) r.notFound ? res.ok(pageName, 'Page 404', device, 'URL inconnue', 'Message « Page introuvable » et lien de retour') : res.ko(pageName, 'Page 404', device, 'URL inconnue', 'Message « Page introuvable »', `Titre : ${r.h1}`, 'Majeur')
    else if (r.notFound) res.ko(pageName, 'Contenu', device, 'Accès direct par URL', 'La page demandée', 'Page introuvable', 'Bloquant', { screenshot: await shotIf(true, '404') })
    if (r.text < 40) res.ko(pageName, 'Contenu', device, 'Affichage', 'Page remplie', `Page blanche ou presque (${r.text} caractères)`, 'Bloquant', { screenshot: await shotIf(true, 'blanche') })
    else res.ok(pageName, 'Contenu', device, 'Affichage', 'Page remplie', `${r.text} caractères, titre « ${r.h1 ?? '—'} »`)
    if (!r.h1) res.improve(pageName, 'Titre (h1)', device, 'Affichage', 'Un titre principal', 'Aucun h1', 'Mineur')
    // Temps de chargement
    if (loadMs > 5000) res.improve(pageName, 'Temps de chargement', device, 'Accès direct par URL', '< 3 s', `${(loadMs / 1000).toFixed(1)} s`, 'Mineur')
    else res.ok(pageName, 'Temps de chargement', device, 'Accès direct par URL', '< 3 s (local)', `${(loadMs / 1000).toFixed(1)} s`)
    // Rafraîchissement
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
    await settle(page, 200)
    const afterReload = await page.evaluate(() => ({ text: (document.querySelector('#root')?.innerText ?? '').trim().length, nf: /Page introuvable/i.test(document.querySelector('h1')?.textContent ?? '') }))
    if (afterReload.text < 40 || (afterReload.nf && !route.notFound)) res.ko(pageName, 'Rafraîchissement', device, 'Recharger la page (F5)', 'La même page', 'Page vide ou introuvable après rechargement', 'Majeur', { screenshot: await shotIf(true, 'rechargement') })
    else res.ok(pageName, 'Rafraîchissement', device, 'Recharger la page (F5)', 'La même page')

    // 2. Mise en page
    if (r.scrollWidth > r.vw + 1) res.ko(pageName, 'Mise en page', device, 'Défilement horizontal', 'Aucun', `Page large de ${r.scrollWidth} px pour ${r.vw} px d’écran`, 'Majeur', { screenshot: await shotIf(true, 'debordement'), details: r.offscreen })
    else res.ok(pageName, 'Mise en page', device, 'Défilement horizontal', 'Aucun')
    if (r.offscreen.length) res.ko(pageName, 'Éléments coupés', device, 'Affichage', 'Tout dans l’écran', r.offscreen.join(' ; '), 'Majeur', { screenshot: await shotIf(true, 'hors-ecran') })
    else res.ok(pageName, 'Éléments coupés', device, 'Affichage', 'Tout dans l’écran')
    if (config.opts.hasTouch) {
      if (r.small24.length) res.ko(pageName, 'Cibles tactiles', device, 'Toucher au doigt', '≥ 24 px (WCAG 2.2) et idéalement 44 px', `${r.small24.length} élément(s) < 24 px : ${r.small24.slice(0, 5).join(' ; ')}`, 'Majeur', { screenshot: await shotIf(true, 'cibles-24') })
      if (r.small44.length) res.improve(pageName, 'Cibles tactiles', device, 'Toucher au doigt', '44 × 44 px', `${r.small44.length} élément(s) entre 24 et 44 px : ${r.small44.slice(0, 5).join(' ; ')}`, 'Mineur')
      if (!r.small24.length && !r.small44.length) res.ok(pageName, 'Cibles tactiles', device, 'Toucher au doigt', '44 × 44 px')
      if (r.smallInputs.length) res.ko(pageName, 'Taille des champs', device, 'Toucher un champ', '≥ 16 px (sinon Safari zoome)', r.smallInputs.slice(0, 5).join(' ; '), 'Mineur')
      else res.ok(pageName, 'Taille des champs', device, 'Toucher un champ', '≥ 16 px')
      if (r.hoverOnly.length) res.improve(pageName, 'Survol', device, 'Usage au doigt', 'Rien qui dépende du survol', r.hoverOnly.slice(0, 5).join(' ; '), 'Mineur')
      else res.ok(pageName, 'Survol', device, 'Usage au doigt', 'Rien qui dépende du survol')
    }
    if (config.kind === 'Smartphone') {
      if (r.smallText.length) res.improve(pageName, 'Lisibilité', device, 'Lire sans zoomer', 'Texte ≥ 13 px (corps 16 px)', `${r.smallText.length} texte(s) < 13 px : ${r.smallText.slice(0, 4).join(' ; ')}`, 'Cosmétique')
      else res.ok(pageName, 'Lisibilité', device, 'Lire sans zoomer', 'Texte ≥ 13 px')
      if (r.keyboard.length) res.ko(pageName, 'Clavier mobile', device, 'Saisie', 'Clavier adapté (email, téléphone, chiffres)', r.keyboard.join(' ; '), 'Mineur')
      else res.ok(pageName, 'Clavier mobile', device, 'Saisie', 'Clavier adapté')
    }
    // 3. Contenu
    if (r.leftovers.length) res.ko(pageName, 'Textes oubliés', device, 'Lecture', 'Ni lorem ipsum, ni TODO, ni valeur technique', r.leftovers.join(', '), 'Majeur', { screenshot: await shotIf(true, 'textes') })
    else res.ok(pageName, 'Textes oubliés', device, 'Lecture', 'Aucun')
    if (r.brokenImages.length) res.ko(pageName, 'Images', device, 'Affichage', 'Toutes les images chargées', r.brokenImages.join(', '), 'Majeur', { screenshot: await shotIf(true, 'images') })
    else res.ok(pageName, 'Images', device, 'Affichage', 'Toutes les images chargées')
    if (r.noAlt.length) res.ko(pageName, 'Texte alternatif', device, 'Lecteur d’écran', 'alt sur chaque image', r.noAlt.join(', '), 'Mineur')
    // 4. Accessibilité (axe-core, WCAG 2.1 AA) : contraste, intitulés, alternatives.
    // Les blocs qui apparaissent au défilement (accueil) sont révélés avant le contrôle des contrastes.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
    await page.waitForTimeout(700)
    const violations = await runAxe(page)
    if (violations.length) res.ko(pageName, 'Accessibilité (axe-core)', device, 'Contrôle WCAG 2.1 AA', 'Aucune violation', violations.map((v) => `${v.id} (${v.impact}, ${v.nodes}) : ${v.help} → ${v.target.join(' | ')}`).join(' ; '), violations.some((v) => v.impact === 'critical' || v.impact === 'serious') ? 'Majeur' : 'Mineur', { screenshot: await shotIf(true, 'axe') })
    else res.ok(pageName, 'Accessibilité (axe-core)', device, 'Contrôle WCAG 2.1 AA', 'Aucune violation')
    // 5. Erreurs JavaScript et réseau au chargement
    const loadErrors = [...new Set(errors.splice(0))]
    if (loadErrors.length) res.ko(pageName, 'Console et réseau', device, 'Chargement', 'Aucune erreur', loadErrors.slice(0, 6).join(' ; '), 'Majeur', { screenshot: await shotIf(true, 'erreurs') })
    else res.ok(pageName, 'Console et réseau', device, 'Chargement', 'Aucune erreur')

    // 6. Liens : clic réel, destination vérifiée, retour arrière.
    if (CLICKS && route.links !== false) {
      const links = await page.$$eval('a[href]', (as) =>
        as
          .filter((a) => { const b = a.getBoundingClientRect(); const s = getComputedStyle(a); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && !a.closest('[aria-hidden=true]') })
          .map((a) => ({ href: a.getAttribute('href'), abs: a.href, text: (a.getAttribute('aria-label') || a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), target: a.target, download: a.hasAttribute('download') })),
      )
      for (const link of links) {
        if (!link.href) continue
        if (/^(mailto|tel|sms|message):/.test(link.href)) {
          const okFmt = /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}/i.test(link.href) || /^tel:\+?[0-9]{6,}$/.test(link.href) || link.href.startsWith('message:')
          okFmt ? res.ok(pageName, `Lien « ${link.text} »`, device, 'Format du lien', 'Adresse ou numéro valide', link.href) : res.ko(pageName, `Lien « ${link.text} »`, device, 'Format du lien', 'Adresse ou numéro valide', link.href, 'Mineur')
          continue
        }
        if (link.href.startsWith('#')) {
          // Ancre dans la page (lien d'évitement « Aller au contenu », sommaire) : la cible doit exister.
          const exists = await page.evaluate((h) => Boolean(document.getElementById(h.slice(1)) || (h === '#contenu' && document.querySelector('main'))), link.href)
          exists ? res.ok(pageName, `Ancre « ${link.text} »`, device, 'Cible de l’ancre', `${link.href} existe`) : res.ko(pageName, `Ancre « ${link.text} »`, device, 'Cible de l’ancre', `${link.href} existe`, 'Cible absente', 'Mineur')
          continue
        }
        if (!link.abs.startsWith(BASE)) {
          externals.add(link.abs)
          if (link.target !== '_blank') res.improve(pageName, `Lien externe « ${link.text} »`, device, 'Clic', 'Ouvre un nouvel onglet (on garde Bailio ouvert)', `Même onglet : ${link.abs}`, 'Cosmétique')
          continue
        }
        if (link.download || link.abs.includes('/api/')) continue
        const key = `${link.href}|${link.text}`
        if (clickedLinks.has(key)) continue
        clickedLinks.add(key)
        const from = page.url()
        const expected = new URL(link.abs)
        try {
          const el = page.locator(`a[href="${link.href.replace(/"/g, '\\"')}"]`).filter({ visible: true }).first()
          await el.scrollIntoViewIfNeeded({ timeout: 3000 })
          if (link.target === '_blank') {
            const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), el.click({ timeout: 5000 })])
            await settle(popup, 150)
            const nf = await popup.evaluate(() => /Page introuvable/i.test(document.querySelector('h1')?.textContent ?? ''))
            nf ? res.ko(pageName, `Lien « ${link.text} »`, device, 'Clic (nouvel onglet)', link.href, 'Page introuvable', 'Majeur') : res.ok(pageName, `Lien « ${link.text} »`, device, 'Clic (nouvel onglet)', link.href, new URL(popup.url()).pathname)
            await popup.close()
            continue
          }
          await el.click({ timeout: 5000 })
          if (expected.pathname !== new URL(from).pathname || expected.search !== new URL(from).search) await page.waitForURL((u) => samePath(u.pathname, expected.pathname) || u.pathname === '/connexion', { timeout: 8000 }).catch(() => undefined)
          await settle(page, 150)
          const now = new URL(page.url())
          const read = () => page.evaluate(() => ({ nf: /Page introuvable/i.test(document.querySelector('h1')?.textContent ?? ''), text: (document.querySelector('#root')?.innerText ?? '').trim().length }))
          let state = await read()
          // Chargement lent (machine chargée) : on laisse 4 s de plus avant de conclure à une page blanche.
          if (state.text < 40) { await page.waitForTimeout(4000); state = await read() }
          const arrived = samePath(now.pathname, expected.pathname) && (expected.hash ? true : true)
          if (!arrived) res.ko(pageName, `Lien « ${link.text} »`, device, 'Clic', `Ouvre ${expected.pathname}${expected.search}${expected.hash}`, `Arrivé sur ${now.pathname}${now.search}`, 'Majeur', { screenshot: await anomalyShot(page, config, `${route.name}-lien-${link.text}`) })
          else if (state.nf || state.text < 40) res.ko(pageName, `Lien « ${link.text} »`, device, 'Clic', `Page ${expected.pathname} affichée`, state.nf ? 'Page introuvable' : 'Page blanche', 'Bloquant', { screenshot: await anomalyShot(page, config, `${route.name}-lien-${link.text}`) })
          else res.ok(pageName, `Lien « ${link.text} »`, device, 'Clic', `Ouvre ${expected.pathname}${expected.hash}`, `${now.pathname}${now.hash}`)
          // Retour arrière du navigateur
          if (now.href !== from) {
            await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
            await settle(page, 150)
            if (!samePath(new URL(page.url()).pathname, new URL(from).pathname)) {
              res.ko(pageName, `Retour après « ${link.text} »`, device, 'Bouton retour du navigateur', `Revient sur ${new URL(from).pathname}`, `Reste sur ${new URL(page.url()).pathname}`, 'Majeur')
              await page.goto(from, { waitUntil: 'domcontentloaded' })
              await settle(page, 150)
            }
          }
        } catch (e) {
          res.ko(pageName, `Lien « ${link.text} »`, device, 'Clic', link.href, `Impossible de cliquer : ${e.message.split('\n')[0].slice(0, 140)}`, 'Majeur', { screenshot: await anomalyShot(page, config, `${route.name}-lien-ko-${link.text}`) })
          await page.goto(from, { waitUntil: 'domcontentloaded' }).catch(() => undefined)
          await settle(page, 150)
        }
      }
    }

    // 7. Boutons : clic réel sur une page fraîche, un effet doit se produire (navigation, fenêtre, changement, requête, téléchargement).
    if (CLICKS && route.buttons !== false) {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded' }).catch(() => undefined)
      await settle(page, 150)
      const names = await page.$$eval('button, [role=button]', (bs) =>
        bs
          // Choix déjà sélectionné (onglet, filtre, année) : le cliquer ne change rien, c'est normal.
          .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !b.disabled && getComputedStyle(b).visibility !== 'hidden' && !b.closest('[aria-hidden=true]') && b.getAttribute('aria-pressed') !== 'true' && b.getAttribute('aria-selected') !== 'true' && !b.hasAttribute('aria-current') })
          .map((b) => (b.getAttribute('aria-label') || b.innerText || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean),
      )
      for (const [i, name] of [...new Set(names)].entries()) {
        if (DANGEROUS.test(name)) continue
        const key = `${route.who}|${route.path.split('?')[0]}|${name}`
        const shellKey = `shell|${name}`
        if (clickedButtons.has(key) || clickedButtons.has(shellKey)) continue
        clickedButtons.add(['Ajouter', 'Aller au contenu'].includes(name) ? shellKey : key)
        if (i > 0) {
          await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded' }).catch(() => undefined)
          await settle(page, 120)
        }
        const btn = page.getByRole('button', { name, exact: true }).filter({ visible: true }).first()
        if (!(await btn.count())) continue
        const before = await page.evaluate(() => {
          window.__mutations = 0
          window.__obs?.disconnect()
          window.__obs = new MutationObserver((l) => { window.__mutations += l.length })
          window.__obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
          return { html: document.body.innerHTML.length, url: location.href }
        })
        let requests = 0
        const onReq = (rq) => { if (!/\.(js|css|woff2?|png|jpe?g|svg)(\?|$)/.test(rq.url())) requests++ }
        page.on('request', onReq)
        let popup = false, download = false, chooser = false, dialog = false
        const onPopup = () => { popup = true }
        const onDownload = () => { download = true }
        const onChooser = (fc) => { chooser = true; fc.setFiles([]).catch(() => undefined) }
        const onDialog = (d) => { dialog = true; d.dismiss().catch(() => undefined) }
        ctx.on('page', onPopup); page.on('download', onDownload); page.on('filechooser', onChooser); page.on('dialog', onDialog)
        try {
          await btn.scrollIntoViewIfNeeded({ timeout: 3000 })
          await btn.click({ timeout: 5000 })
          await page.waitForTimeout(900)
          const after = await page.evaluate(() => ({ html: document.body.innerHTML.length + (window.__mutations ?? 0), url: location.href, modal: Boolean(document.querySelector('[role=dialog]')) }))
          const effect = after.url !== before.url ? `navigation vers ${new URL(after.url).pathname}` : after.modal ? 'fenêtre ouverte' : popup ? 'nouvel onglet' : download ? 'téléchargement' : chooser ? 'choix de fichier' : dialog ? 'boîte de dialogue' : after.html !== before.html ? 'contenu modifié' : requests ? `${requests} requête(s)` : null
          const nf = await page.evaluate(() => /Page introuvable/i.test(document.querySelector('h1')?.textContent ?? ''))
          if (!effect) res.ko(pageName, `Bouton « ${name} »`, device, 'Clic', 'Une réaction visible', 'Rien ne se passe', 'Majeur', { screenshot: await anomalyShot(page, config, `${route.name}-bouton-${name}`) })
          else if (nf) res.ko(pageName, `Bouton « ${name} »`, device, 'Clic', 'Page de destination', 'Page introuvable', 'Bloquant', { screenshot: await anomalyShot(page, config, `${route.name}-bouton-${name}`) })
          else res.ok(pageName, `Bouton « ${name} »`, device, 'Clic', 'Une réaction visible', effect)
          // Une fenêtre ouverte doit se fermer facilement (Échap, puis bouton Fermer).
          if (after.modal) {
            await page.keyboard.press('Escape')
            await page.waitForTimeout(300)
            const still = await page.locator('[role=dialog]').count()
            if (still) {
              const close = page.getByRole('button', { name: /fermer|annuler/i }).filter({ visible: true }).first()
              if (await close.count()) await close.click().catch(() => undefined)
              await page.waitForTimeout(300)
              res.improve(pageName, `Fenêtre de « ${name} »`, device, 'Fermer avec Échap', 'La fenêtre se ferme', 'Échap sans effet (fermeture par le bouton)', 'Mineur')
            } else res.ok(pageName, `Fenêtre de « ${name} »`, device, 'Fermer avec Échap', 'La fenêtre se ferme')
          }
          const errs = [...new Set(errors.splice(0))]
          if (errs.length) res.ko(pageName, `Bouton « ${name} »`, device, 'Clic', 'Aucune erreur', errs.slice(0, 4).join(' ; '), 'Majeur')
        } catch (e) {
          res.ko(pageName, `Bouton « ${name} »`, device, 'Clic', 'Bouton cliquable', `Impossible de cliquer : ${e.message.split('\n')[0].slice(0, 140)}`, 'Majeur', { screenshot: await anomalyShot(page, config, `${route.name}-bouton-ko-${name}`) })
        } finally {
          page.off('request', onReq); ctx.off('page', onPopup); page.off('download', onDownload); page.off('filechooser', onChooser); page.off('dialog', onDialog)
          for (const p of ctx.pages()) if (p !== page) await p.close().catch(() => undefined)
        }
      }
    }
    await page.close()
  }
  for (const c of Object.values(contexts)) await c.close()
  res.add({ page: '—', element: 'Moteur', device, action: 'Configuration', expected: config.engine, actual: engineNote, status: 'INFO' })
  res.save()
  fs.writeFileSync(`${res.file.replace('.json', '')}-externes.json`, JSON.stringify([...externals], null, 1))
}

for (const config of selectedConfigs()) {
  console.log(`→ ${config.label}`)
  await auditConfig(config)
}
await closeBrowsers()
