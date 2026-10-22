// Audit par personas : 14 profils de propriétaires (et deux visiteurs qui ne sont pas clients) parcourent Bailio
// en local, chacun à sa façon. Rien ne part : sans SMTP, les emails restent dans le journal de l'API.
// Usage : CHROMIUM_PATH=/opt/pw-browsers/chromium node audit/personas.mjs [numéro…]
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { API, BASE, api, completeLease, fromLog, launch, logSize, newAccount, signedInContext, wait } from '../lib.mjs'

const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const OUT = new URL('./resultats/', import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })
const findings = []
let current = ''
const note = (level, text, shotName) => findings.push({ persona: current, level, text, shot: shotName })
const PHONE = { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }

/** Contrôles communs sur l'écran affiché : erreurs, débordement, cibles tactiles, axe. */
async function inspect(page, label, { mobile = false, axe = true } = {}) {
  const r = await page.evaluate(({ mobile }) => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth
    const small = []
    if (mobile) {
      document.querySelectorAll('button, a[href], input, select, [role=button]').forEach((e) => {
        const b = e.getBoundingClientRect()
        if (b.width < 2 || b.height < 2) return // champ masqué (fichier)
        if (e.closest('p, li') && e.tagName === 'A') return // lien dans une phrase : exempté (WCAG 2.5.8)
        const h = b.height + (e.classList.contains('tap') ? 14 : 0) // .tap : +14 px sur écran tactile (styles.css)
        if (h < 24 || b.width < 24) small.push(`${(e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30)} (${Math.round(b.width)}×${Math.round(b.height)})`)
      })
    }
    return { overflow, small: small.slice(0, 6), title: document.title, lang: document.documentElement.lang }
  }, { mobile })
  if (r.overflow > 2) note('Majeur', `${label} : la page déborde de ${r.overflow} px en largeur (défilement horizontal).`)
  if (r.small.length) note('Mineur', `${label} : cibles tactiles de moins de 24 px : ${r.small.join(', ')}.`)
  if (r.lang !== 'fr') note('Mineur', `${label} : langue de la page « ${r.lang} ».`)
  if (axe) {
    await page.waitForTimeout(1200) // animations d'apparition terminées
    await page.addScriptTag({ content: AXE })
    const v = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }).then((x) => x.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`)))
    for (const x of v) note('Majeur', `${label} : accessibilité, ${x}.`)
  }
}

function watchErrors(page) {
  page.on('pageerror', (e) => note('Bloquant', `Erreur JavaScript sur ${page.url().replace(BASE, '')} : ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && note('Majeur', `Erreur console sur ${page.url().replace(BASE, '')} : ${m.text().slice(0, 160)}`))
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 500) note('Bloquant', `Erreur serveur ${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`)
  })
}

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: true })
  return name
}
const btn = (page, name, exact = false) => page.getByRole('button', { name, exact }).first()

/** Tunnel complet par l'interface, avec des variantes selon la persona. */
async function tunnel(page, o = {}) {
  const t0 = Date.now()
  await page.goto(BASE + '/commencer')
  await btn(page, o.furnished ? 'Meublé' : 'Vide').click()
  await page.getByLabel('Adresse').fill(o.address ?? '12 rue de la Loge, 34000 Montpellier')
  await page.getByLabel('Surface habitable').fill(o.surface ?? '42')
  await btn(page, '2', true).click()
  await btn(page, 'Un appartement').click()
  await btn(page, 'Non', true).click()
  await btn(page, '1990 à 2005').click()
  await btn(page, 'Individuel', true).click()
  await btn(page, 'Électricité').click()
  await btn(page, 'Individuelle').click()
  if (o.afterLogement) await o.afterLogement()
  await btn(page, 'Continuer', true).click()
  await page.getByRole('heading', { name: 'Qui signe le bail ?' }).waitFor()
  await page.getByRole('button', { name: 'Madame', exact: true }).nth(0).click()
  await page.getByLabel('Prénom', { exact: true }).nth(0).fill(o.firstName ?? 'Monique')
  await page.getByLabel('Nom', { exact: true }).nth(0).fill(o.lastName ?? 'Bernard')
  await page.getByLabel('Votre adresse').fill('3 place de la Comédie, 34000 Montpellier')
  await page.getByRole('button', { name: 'Monsieur', exact: true }).nth(1).click()
  await page.getByLabel('Prénom', { exact: true }).nth(1).fill(o.tenantFirst ?? 'Karim')
  await page.getByLabel('Nom', { exact: true }).nth(1).fill('Haddad')
  await page.getByLabel('Son email').fill(o.tenantEmail ?? 'karim.haddad@example.fr')
  if (o.afterPersonnes) await o.afterPersonnes()
  await btn(page, 'Continuer', true).click()
  await page.getByRole('heading', { name: 'Quel est le loyer ?' }).waitFor()
  await page.getByLabel('Loyer hors charges').fill(o.rent ?? '780')
  await page.getByLabel('Charges', { exact: true }).fill('60')
  await btn(page, 'Une provision').click()
  await page.getByLabel('Date d’entrée du locataire').or(page.getByLabel("Date d'entrée du locataire")).fill(o.start ?? '2026-12-01')
  if (o.afterLoyer) await o.afterLoyer()
  await btn(page, 'Continuer', true).click()
  await page.getByRole('heading', { name: 'Tout est bon ?' }).waitFor()
  if (o.afterRelecture) await o.afterRelecture()
  await btn(page, 'Mon bail est correct').click()
  await page.getByLabel('Votre email').waitFor()
  return Date.now() - t0
}

/** Fin du tunnel : email, lien relu dans le journal, arrivée dans l'espace. */
async function finishTunnel(page, email) {
  await page.getByLabel('Votre email').fill(email)
  const before = logSize()
  await btn(page, 'Continuer mon bail').click()
  await page.getByText('Regardez vos emails.').waitFor()
  const [link] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
  await page.goto(link[1].replace(/^http:\/\/[^/]+/, BASE))
  await page.getByText('Votre bail est enregistré').waitFor({ timeout: 20000 })
}

const uniq = (p) => `${p}+${Date.now()}${Math.floor(Math.random() * 1000)}@example.fr`

// ---------------------------------------------------------------------------------------------------------------
const PERSONAS = [
  {
    name: 'Monique, 68 ans, retraitée, premier bail, lit avec un zoom à 200 %',
    async run(b) {
      // Zoom 200 % : fenêtre de 640×450 px CSS (écran 1280×900).
      const ctx = await b.newContext({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/')
      await inspect(page, 'Accueil (zoom 200 %)')
      await shot(page, '01-monique-accueil')
      const ms = await tunnel(page)
      await inspect(page, 'Recevoir (zoom 200 %)')
      await finishTunnel(page, uniq('monique'))
      await shot(page, '01-monique-bienvenue')
      await inspect(page, 'Bienvenue (zoom 200 %)')
      await btn(page, 'Compléter mon bail').click()
      await page.waitForURL(/\/espace\//)
      await page.waitForTimeout(1500)
      await inspect(page, 'Logement après le tunnel (zoom 200 %)')
      await shot(page, '01-monique-logement')
      await ctx.close()
    },
  },
  {
    name: 'Karim, 34 ans, tout sur son téléphone (iPhone SE), meublé',
    async run(b) {
      const ctx = await b.newContext(PHONE)
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/')
      await inspect(page, 'Accueil (téléphone)', { mobile: true })
      await tunnel(page, {
        furnished: true,
        afterLogement: () => inspect(page, 'Tunnel, logement (téléphone)', { mobile: true }),
        afterPersonnes: () => inspect(page, 'Tunnel, personnes (téléphone)', { mobile: true }),
        afterLoyer: async () => {
          await inspect(page, 'Tunnel, loyer (téléphone)', { mobile: true })
          // Le clavier numérique s'ouvre-t-il pour les montants ?
          const mode = await page.getByLabel('Loyer hors charges').getAttribute('inputmode')
          if (!mode || !/decimal|numeric/.test(mode)) note('Mineur', `Loyer : le clavier du téléphone n’est pas numérique (inputmode « ${mode} »).`)
        },
        afterRelecture: async () => {
          await inspect(page, 'Tunnel, relecture (téléphone)', { mobile: true })
          await shot(page, '02-karim-relecture')
        },
      })
      const type = await page.getByLabel('Votre email').getAttribute('type')
      const ac = await page.getByLabel('Votre email').getAttribute('autocomplete')
      if (type !== 'email') note('Mineur', 'Email : le clavier du téléphone n’est pas celui des emails.')
      if (!ac) note('Mineur', 'Email : pas d’attribut autocomplete, le téléphone ne propose pas l’adresse enregistrée.')
      await finishTunnel(page, uniq('karim'))
      await btn(page, 'Compléter mon bail').click()
      await page.waitForURL(/\/espace\//)
      await page.waitForTimeout(1500)
      await inspect(page, 'Espace, logement (téléphone)', { mobile: true })
      await shot(page, '02-karim-espace')
      for (const path of ['/espace', '/espace/logements', '/espace/argent', '/espace/compte']) {
        await page.goto(BASE + path)
        await page.waitForTimeout(1200)
        await inspect(page, `${path} (téléphone)`, { mobile: true, axe: false })
      }
      await ctx.close()
    },
  },
  {
    name: 'Sophie, 45 ans, aveugle : clavier seul et lecteur d’écran',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/')
      // Premier Tab : le lien d'évitement.
      await page.keyboard.press('Tab')
      const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
      if (first !== 'Aller au contenu') note('Majeur', `Premier Tab sur l’accueil : « ${first} » au lieu du lien d’évitement.`)
      // Jusqu'au bouton principal, au clavier.
      let reached = false
      for (let i = 0; i < 15 && !reached; i++) {
        await page.keyboard.press('Tab')
        reached = await page.evaluate(() => document.activeElement?.textContent?.includes('Créer mon bail'))
      }
      if (!reached) note('Majeur', 'Accueil : « Créer mon bail » n’est pas atteint en 15 Tab.')
      await page.keyboard.press('Enter')
      await page.waitForURL(/\/commencer$/)
      await page.getByRole('heading', { name: /Votre logement est/ }).waitFor()
      await page.waitForTimeout(500)
      // Après navigation, où est le focus ? Un lecteur d'écran doit entendre le nouveau titre.
      const afterNav = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 40), title: document.title }))
      note('Info', `Après « Créer mon bail » : focus sur ${afterNav.tag} « ${afterNav.text} », titre d’onglet « ${afterNav.title} ».`)
      // Choix « Vide » au clavier, puis l'écran du logement.
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab')
        if (await page.evaluate(() => document.activeElement?.textContent?.startsWith('Vide'))) break
      }
      await page.keyboard.press('Enter')
      await page.getByRole('heading', { name: 'Où se trouve le logement ?' }).waitFor()
      // Les boutons à choix disent-ils lequel est choisi ?
      await btn(page, '2', true).click()
      const pressed = await btn(page, '2', true).evaluate((e) => e.getAttribute('aria-pressed') ?? e.getAttribute('aria-checked') ?? e.getAttribute('role'))
      if (pressed !== 'true') note('Majeur', `Nombre de pièces : le bouton choisi n’annonce pas son état au lecteur d’écran (aria-pressed/aria-checked : ${pressed}).`)
      const grp = await page.evaluate(() => [...document.querySelectorAll('fieldset')].length)
      note('Info', `Écran du logement : ${grp} groupes <fieldset> pour les questions à choix.`)
      // Envoi vide : le focus va-t-il sur la première erreur, et les erreurs sont-elles reliées aux champs ?
      await btn(page, 'Continuer', true).click()
      await page.waitForTimeout(400)
      const err = await page.evaluate(() => {
        const a = document.activeElement
        const described = [...document.querySelectorAll('input[aria-invalid=true]')].filter((i) => i.getAttribute('aria-describedby') || i.getAttribute('aria-errormessage')).length
        const invalid = document.querySelectorAll('input[aria-invalid=true]').length
        const groupsLinked = [...document.querySelectorAll('fieldset')].filter((f) => f.getAttribute('aria-describedby') || f.getAttribute('aria-invalid')).length
        return { focus: a?.getAttribute('aria-label') || a?.labels?.[0]?.innerText || a?.tagName, described, invalid, groupsLinked }
      })
      note('Info', `Envoi vide : focus sur « ${err.focus} » ; ${err.described}/${err.invalid} champs en erreur reliés à leur message ; ${err.groupsLinked} groupes à choix signalés en erreur.`)
      if (err.groupsLinked === 0) note('Mineur', 'Les questions à choix (pièces, appartement/maison, copropriété…) affichent leur erreur en rouge sans la relier au groupe : un lecteur d’écran ne l’annonce pas en passant sur les boutons.')
      // Focus visible ?
      await page.keyboard.press('Tab')
      const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' || s.boxShadow !== 'none' })
      if (!ring) note('Majeur', 'Contour de focus invisible sur l’écran du logement.')
      // Le lien d'évitement reste-t-il affiché après la navigation ?
      const skip = await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find((x) => x.textContent.trim() === 'Aller au contenu'); const r = a?.getBoundingClientRect(); return r ? { visible: r.top >= 0 && r.left >= 0 && r.width > 1, focused: document.activeElement === a } : null })
      if (skip?.visible && !skip.focused) note('Mineur', '« Aller au contenu » reste affiché à l’écran alors qu’il n’a plus le focus (après le passage d’un écran du tunnel à l’autre).', await shot(page, '03-sophie-lien-evitement'))
      await ctx.close()
    },
  },
  {
    name: 'Thomas, 29 ans, pressé : double-clique, revient en arrière, recharge la page',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      let drafts = 0
      page.on('request', (r) => r.method() === 'POST' && /\/api\/drafts$/.test(r.url()) && drafts++)
      await page.goto(BASE + '/commencer')
      await btn(page, 'Vide').dblclick()
      await page.getByRole('heading', { name: 'Où se trouve le logement ?' }).waitFor()
      if (drafts > 1) note('Mineur', `Double-clic sur « Vide » : ${drafts} brouillons créés.`)
      await page.getByLabel('Adresse').fill('5 rue Sainte-Catherine, 33000 Bordeaux')
      await page.getByLabel('Surface habitable').fill('55')
      // Retour arrière du navigateur, puis en avant : la saisie est-elle gardée ?
      await page.waitForTimeout(1500)
      await page.goBack()
      await page.waitForTimeout(500)
      await page.goForward()
      await page.waitForTimeout(800)
      const kept = await page.getByLabel('Adresse').inputValue().catch(() => '')
      if (!kept.includes('Sainte-Catherine')) note('Majeur', `Retour puis avant du navigateur : l’adresse saisie est perdue (« ${kept} »).`)
      // Rechargement : le brouillon revient-il ?
      await page.reload()
      await page.waitForTimeout(1200)
      const reloaded = await page.getByLabel('Adresse').inputValue().catch(() => '')
      if (!reloaded.includes('Sainte-Catherine')) note('Majeur', `Rechargement de la page : l’adresse saisie est perdue (« ${reloaded} »).`)
      else note('Info', 'Rechargement et retour arrière : la saisie est gardée (enregistrement automatique).')
      // Le reste du tunnel en vitesse, puis double-clic sur l'envoi de l'email.
      await tunnel(page, { address: '5 rue Sainte-Catherine, 33000 Bordeaux' })
      await page.getByLabel('Votre email').fill(uniq('thomas'))
      const before = logSize()
      await btn(page, 'Continuer mon bail').dblclick()
      await page.getByText('Regardez vos emails.').waitFor()
      await wait(2500)
      const sent = fs.readFileSync('/tmp/bailio-api.log').subarray(before).toString().match(/connexion\/lien\?jeton=/g)?.length ?? 0
      if (sent > 1) note('Mineur', `Double-clic sur « Continuer mon bail » : ${sent} emails de connexion envoyés.`)
      else note('Info', 'Double-clic sur « Continuer mon bail » : un seul email envoyé.')
      // Il ouvre le lien deux fois (deux onglets).
      const [link] = await fromLog(/(http:\/\/[^\s]+\/connexion\/lien\?jeton=[^\s)]+)/g, before)
      const url = link[1].replace(/^http:\/\/[^/]+/, BASE)
      await page.goto(url)
      await page.getByText('Votre bail est enregistré').waitFor({ timeout: 20000 })
      const p2 = await ctx.newPage()
      await p2.goto(url)
      await p2.waitForTimeout(2500)
      const txt = (await p2.locator('main').innerText().catch(() => '')).slice(0, 160).replace(/\s+/g, ' ')
      note('Info', `Lien de connexion rouvert une seconde fois : « ${txt} ».`)
      await shot(p2, '04-thomas-lien-rouvert')
      await ctx.close()
    },
  },
  {
    name: 'Paul, 52 ans, tape vite et se trompe souvent',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/commencer')
      await btn(page, 'Vide').click()
      await page.getByLabel('Adresse').fill('12')
      await page.getByLabel('Surface habitable').fill('abc')
      const surf = await page.getByLabel('Surface habitable').inputValue()
      if (surf === 'abc') note('Mineur', 'Surface : des lettres sont acceptées dans le champ (refusées seulement à l’envoi).')
      await page.getByLabel('Surface habitable').fill('4,5')
      await btn(page, 'Continuer', true).click()
      await page.waitForTimeout(400)
      const msgs = await page.locator('main').innerText()
      if (/4,5/.test(msgs) || !/surface/i.test(msgs)) note('Info', 'Surface de 4,5 m² acceptée sans remarque (un logement décent fait au moins 9 m², décret 2002-120).')
      if (!/Indiquez l.adresse/.test(msgs)) note('Info', 'Adresse « 12 » refusée ? non.')
      // Il corrige l'adresse : l'erreur reste-t-elle affichée pendant qu'il tape ?
      await page.getByLabel('Adresse').fill('12 rue de la Loge, 34000 Montpellier')
      await page.waitForTimeout(300)
      if (await page.getByText('Indiquez l’adresse du logement.').or(page.getByText("Indiquez l'adresse du logement.")).count()) note('Mineur', 'Une erreur corrigée reste affichée en rouge tant qu’on n’a pas recliqué sur « Continuer ».', await shot(page, '05-paul-erreur-restee'))
      // Surface 4,5 m² : on va jusqu'au bout pour voir si le bail l'accepte.
      await page.goto(BASE + '/commencer')
      await tunnel(page, {
        surface: '4,5',
        afterRelecture: async () => {
          const t = await page.locator('main').innerText()
          if (/4,5\s?m/.test(t)) note('Mineur', 'Surface de 4,5 m² acceptée jusqu’à la relecture sans aucune alerte (un logement décent fait au moins 9 m² et 20 m³, décret n° 2002-120).', await shot(page, '05-paul-4m2'))
        },
      })
      // Email avec faute de frappe courante.
      await page.getByLabel('Votre email').fill('paul.durand@gmial.com')
      await btn(page, 'Continuer mon bail').click()
      await page.waitForTimeout(1000)
      const t = await page.locator('main').innerText()
      if (!/vouliez-vous dire|gmail\.com \?/i.test(t)) note('Mineur', 'Email « @gmial.com » : aucune suggestion « Vouliez-vous dire gmail.com ? » (le lien part vers une adresse qui n’existe pas).')
      if (/paul\.durand@gmial\.com/.test(t) && !(await page.getByLabel('Votre email').count())) note('Majeur', 'Après l’envoi, l’adresse mal tapée est affichée mais aucun bouton ne permet de la corriger : il faut deviner qu’un rechargement de la page fait revenir le champ.', await shot(page, '05-paul-email'))
      // Date d'entrée dans le passé : acceptée ?
      await ctx.close()
    },
  },
  {
    name: 'Hélène, 57 ans, SCI familiale, 8 logements, utilisatrice avancée',
    async run(b) {
      const { token } = await newAccount(uniq('helene'))
      const t0 = Date.now()
      const { leaseId } = await completeLease(token)
      await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
      for (let i = 0; i < 7; i++) await api('/properties', { method: 'POST', token, body: { label: `Appartement ${i + 2}`, address: `${10 + i} rue Nationale, 37000 Tours`, postalCode: '37000', city: 'Tours', surface: 30 + i * 5, rooms: 2, furnished: false } })
      note('Info', `Données de test : 8 logements, 1 bail signé (préparés en ${Math.round((Date.now() - t0) / 1000)} s).`)
      const ctx = await signedInContext(b, token)
      const page = await ctx.newPage()
      watchErrors(page)
      for (const [path, label] of [['/espace', 'Aujourd’hui'], ['/espace/logements', 'Logements'], ['/espace/patrimoine', 'Tableau de bord'], ['/espace/structures', 'Structures'], ['/espace/argent', 'Argent'], ['/espace/argent/declaration', 'Déclaration'], ['/espace/actions', 'Actions groupées']]) {
        const s = Date.now()
        await page.goto(BASE + path)
        await page.waitForLoadState('networkidle')
        const ms = Date.now() - s
        if (ms > 2500) note('Mineur', `${label} : ${ms} ms pour s’afficher avec 8 logements.`)
        await inspect(page, `${label} (8 logements)`)
        if (path === '/espace/logements' || path === '/espace/patrimoine') await shot(page, `06-helene-${path.split('/').pop()}`)
      }
      // Créer une SCI depuis l'interface.
      await page.goto(BASE + '/espace/structures')
      await page.getByRole('heading', { name: 'Vos structures' }).waitFor()
      const create = page.getByRole('button', { name: /structure/i }).first()
      if (await create.count()) {
        await create.click()
        await page.waitForTimeout(800)
        await shot(page, '06-helene-structure')
      } else note('Info', 'Page Structures : pas de bouton de création visible au premier écran.')
      await ctx.close()
    },
  },
  {
    name: 'Lucas, 41 ans, loue seulement un garage',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/')
      await btn(page, 'Garage', true).click()
      await page.waitForTimeout(500)
      await shot(page, '07-lucas-accueil-garage')
      const cta = page.getByRole('link', { name: /Créer ce bail/ }).first()
      const href = await cta.getAttribute('href').catch(() => null)
      await cta.click()
      await page.waitForTimeout(1000)
      const h1 = await page.locator('h1').first().innerText()
      const options = await page.getByRole('button').allInnerTexts()
      note('Info', `Accueil, onglet « Garage » → « Créer ce bail » (${href}) mène à « ${h1} » avec les choix : ${options.filter((o) => o.length < 60).map((o) => o.split('\n')[0]).join(' / ')}.`)
      if (!options.some((o) => /garage|box|place/i.test(o))) note('Majeur', 'Un propriétaire de garage clique sur « Garage » puis « Créer ce bail » et arrive sur « Vide / Meublé » : aucun choix garage dans le tunnel public. Il doit d’abord créer un compte, puis « Ajouter un logement ».', await shot(page, '07-lucas-tunnel'))
      await ctx.close()
    },
  },
  {
    name: 'Nadia, 38 ans, juriste, très attentive à ses données',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      const hosts = new Set()
      page.on('request', (r) => hosts.add(new URL(r.url()).host))
      await page.goto(BASE + '/')
      await page.waitForLoadState('networkidle')
      await tunnel(page)
      const third = [...hosts].filter((h) => !/^localhost/.test(h))
      if (third.length) note('Majeur', `Requêtes vers des tiers pendant la visite : ${third.join(', ')}.`)
      else note('Info', 'Aucune requête vers un site tiers (ni police, ni mesure d’audience) de l’accueil à la fin du tunnel.')
      const cookies = await ctx.cookies()
      const storage = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)))
      note('Info', `Cookies : ${cookies.length}. Stockage local : ${storage.join(', ') || 'aucun'}.`)
      const unknown = storage.filter((k) => !['bailio.session', 'bailio.draft', 'bailio.boot', 'bailio.recover', 'bailio.space'].includes(k))
      if (unknown.length) note('Majeur', `Clés de stockage non déclarées dans /cookies : ${unknown.join(', ')}.`)
      // En-têtes de sécurité de l'API (le site en production passe par Caddy, non testé ici).
      const r = await fetch(API.replace('/api', '') + '/health')
      const h = Object.fromEntries(r.headers)
      const missing = ['strict-transport-security', 'x-content-type-options', 'content-security-policy', 'referrer-policy', 'x-frame-options'].filter((k) => !h[k])
      note('Info', `En-têtes de sécurité absents de l’API locale : ${missing.join(', ') || 'aucun'}${h['x-powered-by'] ? ` ; « X-Powered-By: ${h['x-powered-by']} » visible` : ''}.`)
      // Pages légales : chacune répond, et la confidentialité est datée.
      for (const p of ['/confidentialite', '/cookies', '/mentions-legales', '/conditions', '/prix-et-remboursement']) {
        await page.goto(BASE + p)
        const txt = await page.locator('main').innerText()
        if (txt.length < 400) note('Majeur', `${p} : page quasi vide.`)
        if (p === '/mentions-legales' && /à compléter|renseign/i.test(txt)) note('Majeur', 'Mentions légales : coordonnées de l’éditeur pas encore renseignées.')
        if (p === '/mentions-legales') await shot(page, '08-nadia-mentions')
      }
      // Export de ses données depuis « Mon compte ».
      const { token } = await newAccount(uniq('nadia'))
      const c2 = await signedInContext(b, token)
      const p2 = await c2.newPage()
      watchErrors(p2)
      await p2.goto(BASE + '/espace/compte')
      await p2.waitForTimeout(1200)
      const hasExport = await p2.getByText(/télécharger mes données|exporter/i).count()
      const hasDelete = await p2.getByText(/supprimer mon compte/i).count()
      note('Info', `« Mon compte » : export des données ${hasExport ? 'présent' : 'absent'}, suppression du compte ${hasDelete ? 'présente' : 'absente'}.`)
      await shot(p2, '08-nadia-compte')
      await c2.close()
      await ctx.close()
    },
  },
  {
    name: 'Jean-Pierre, 63 ans, a déjà un bail signé et veut l’importer',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/importer')
      await page.waitForTimeout(800)
      await inspect(page, 'Importer')
      await shot(page, '09-jp-importer')
      // Il dépose un fichier qui n'est pas un bail (un texte).
      const bad = `${OUT}pas-un-bail.txt`
      fs.writeFileSync(bad, 'Liste de courses : pain, lait.')
      const input = page.locator('input[type=file]').first()
      if (!(await input.count())) return note('Majeur', 'Importer : aucun champ de fichier trouvé.')
      await input.setInputFiles(bad)
      await page.waitForTimeout(2500)
      const t = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      note('Info', `Fichier texte déposé : « ${t.slice(0, 220)} ».`)
      await shot(page, '09-jp-mauvais-fichier')
      // Un vrai PDF (le bail de démonstration produit par Bailio).
      const pdf = fs.readdirSync(new URL('../fixtures/', import.meta.url)).find((f) => f.endsWith('.pdf'))
      if (pdf) {
        await page.goto(BASE + '/importer')
        await page.locator('input[type=file]').first().setInputFiles(new URL(`../fixtures/${pdf}`, import.meta.url).pathname)
        const s = Date.now()
        await page.waitForTimeout(1000)
        for (let i = 0; i < 60; i++) {
          const busy = await page.getByText(/lecture|analyse|patiente|en cours/i).count()
          if (!busy) break
          await wait(1000)
        }
        note('Info', `Import du PDF « ${pdf} » : ${Math.round((Date.now() - s) / 1000)} s jusqu’au résultat.`)
        await shot(page, '09-jp-import-pdf')
      }
      await ctx.close()
    },
  },
  {
    name: 'Emma, 24 ans, la locataire (sur son téléphone, sans compte)',
    async run(b) {
      const { token } = await newAccount(uniq('proprio-emma'))
      const { leaseId } = await completeLease(token, { furnished: false })
      await api(`/leases/${leaseId}/sign`, { method: 'POST', token })
      const link = await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', token, body: { open: true } })
      const ctx = await b.newContext(PHONE)
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(`${BASE}/locataire/${link.code}`)
      await page.getByRole('heading', { name: 'Votre location' }).waitFor()
      await inspect(page, 'Lien du locataire (téléphone)', { mobile: true })
      await shot(page, '10-emma-lien')
      await btn(page, 'Signaler un problème').click()
      await btn(page, 'Électricité').click().catch(() => btn(page, 'Fuite').click())
      await btn(page, 'Continuer', true).click()
      await page.waitForTimeout(500)
      await inspect(page, 'Signalement, description (téléphone)', { mobile: true })
      await shot(page, '10-emma-signalement')
      // Un code faux ou expiré : message compréhensible ?
      await page.goto(`${BASE}/locataire/codefauxcodefaux`)
      await page.waitForTimeout(1200)
      note('Info', `Lien du locataire invalide : « ${(await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 160)} ».`)
      await ctx.close()
    },
  },
  {
    name: 'Marc, 47 ans, à la campagne, connexion 3G lente',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, isMobile: true })
      const page = await ctx.newPage()
      watchErrors(page)
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (750 * 1024) / 8, uploadThroughput: (250 * 1024) / 8 })
      let bytes = 0
      page.on('response', async (r) => { try { bytes += Number(r.headers()['content-length'] ?? (await r.body()).length) } catch { /* rien */ } })
      const s = Date.now()
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 90000 })
      const lcp = Date.now() - s
      await page.waitForLoadState('networkidle', { timeout: 90000 })
      note('Info', `Accueil en 3G lente (serveur de développement, non minifié) : affiché en ${(lcp / 1000).toFixed(1)} s, ${Math.round(bytes / 1024)} Ko transférés.`)
      const s2 = Date.now()
      await btn(page, 'Créer mon bail').click().catch(() => page.getByRole('link', { name: 'Créer mon bail gratuit' }).click())
      await page.getByRole('heading', { name: /Votre logement est/ }).waitFor({ timeout: 60000 })
      note('Info', `Passage à « Créer mon bail » en 3G : ${((Date.now() - s2) / 1000).toFixed(1)} s.`)
      // Coupure réseau pendant la saisie.
      await btn(page, 'Vide').click()
      await page.getByLabel('Adresse').fill('Lieu-dit Les Granges, 12230 Nant')
      await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
      await page.getByLabel('Surface habitable').fill('80')
      await page.waitForTimeout(2500)
      const status = (await page.locator('[role=status], [aria-live]').allInnerTexts()).join(' ').replace(/\s+/g, ' ')
      note('Info', `Hors ligne pendant la saisie, l’indicateur d’enregistrement affiche : « ${status || 'rien'} ».`)
      await shot(page, '11-marc-hors-ligne')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
      await ctx.close()
    },
  },
  {
    name: 'Aïcha, 31 ans, le français n’est pas sa langue maternelle (traduction du navigateur)',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-GB' })
      const page = await ctx.newPage()
      watchErrors(page)
      const jargon = ['IRL', 'DPE', 'ERP', 'GES', 'caution solidaire', 'dépôt de garantie', 'clause résolutoire', 'provision', 'régularisation', 'préavis', 'quittance', 'état des lieux', 'tacite reconduction', 'zone tendue', 'encadrement']
      const unexplained = new Set()
      for (const p of ['/', '/commencer/loyer', '/commencer/relecture']) {
        await page.goto(BASE + p)
        await page.waitForTimeout(800)
        const txt = await page.locator('body').innerText()
        for (const j of jargon) if (txt.includes(j)) unexplained.add(`${j} (${p})`)
        const tr = await page.evaluate(() => document.documentElement.getAttribute('translate'))
        if (tr === 'no') note('Majeur', `${p} : traduction automatique interdite (translate="no").`)
      }
      note('Info', `Termes juridiques rencontrés dans l’accueil et le tunnel (à vérifier qu’ils sont expliqués en une ligne) : ${[...unexplained].join(', ') || 'aucun'}.`)
      // Format de date et de montant avec un navigateur en anglais.
      await page.goto(BASE + '/commencer')
      await tunnel(page, { afterLoyer: async () => {
        const v = await page.getByLabel('Loyer hors charges').inputValue()
        note('Info', `Navigateur en anglais : le loyer s’affiche « ${v} » ; la date d’entrée utilise le sélecteur du navigateur (format ${await page.evaluate(() => new Intl.DateTimeFormat().resolvedOptions().locale)}).`)
        await page.getByLabel('Loyer hors charges').fill('780.50')
      }, afterRelecture: async () => {
        const t = await page.locator('main').innerText()
        const m = t.match(/\d[\d\s ]*[,.]\d{2}\s?€|\d[\d\s ]*\s?€/g)
        note('Info', `Saisie « 780.50 » (point anglais) : relecture affiche ${m?.slice(0, 3).join(' · ')}.`)
        await shot(page, '12-aicha-relecture')
      } })
      await ctx.close()
    },
  },
  {
    name: 'Bruno, 26 ans, curieux et un peu malicieux',
    async run(b) {
      const a = await newAccount(uniq('bruno'))
      const victim = await newAccount(uniq('victime'))
      const { leaseId, propertyId } = await completeLease(victim.token)
      // Accès aux données d'un autre compte (identifiants devinés).
      for (const path of [`/leases/${leaseId}`, `/properties/${propertyId}`, `/leases/${leaseId}/lease.pdf`, '/admin/metrics']) {
        const r = await fetch(API + path, { headers: { Authorization: `Bearer ${a.token}` } })
        if (r.status < 400) note('Bloquant', `Bruno lit ${path} d’un autre compte (HTTP ${r.status}).`)
      }
      note('Info', 'Accès aux baux, logements, PDF d’un autre compte et au pilotage : refusés.')
      // Espace partagé forgé.
      const r = await fetch(API + '/properties', { headers: { Authorization: `Bearer ${a.token}`, 'X-Bailio-Space': victim.email } })
      const j = await r.json().catch(() => ({}))
      if (r.ok && JSON.stringify(j).includes(propertyId)) note('Bloquant', 'En-tête X-Bailio-Space forgé : accès aux logements d’un autre compte.')
      // Injection de code dans les champs.
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      let alerted = false
      page.on('dialog', async (d) => { alerted = true; await d.dismiss() })
      await tunnel(page, { firstName: '<img src=x onerror=alert(1)>', tenantFirst: '"><script>alert(2)</script>', address: '1 rue <b>gras</b>, 75001 Paris' })
      await page.goto(BASE + '/commencer/relecture')
      await page.waitForTimeout(800)
      if (alerted) note('Bloquant', 'Code injecté dans un nom exécuté dans la page (XSS).')
      else note('Info', 'Noms contenant du HTML ou du script : affichés comme du texte, rien n’est exécuté.')
      // Texte très long.
      await page.goto(BASE + '/commencer/personnes')
      await page.getByLabel('Prénom', { exact: true }).nth(0).fill('A'.repeat(500))
      await page.waitForTimeout(1500)
      await page.goto(BASE + '/commencer/relecture')
      await page.waitForTimeout(800)
      await inspect(page, 'Relecture avec un prénom de 500 lettres', { axe: false })
      await shot(page, '13-bruno-nom-long')
      // Lien magique forgé et essais en rafale.
      const forged = await fetch(API + '/auth/magic-link/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'abc' }) })
      if (forged.ok) note('Bloquant', 'Lien magique forgé accepté.')
      let limited = 0
      for (let i = 0; i < 40; i++) {
        const x = await fetch(API + '/auth/magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `spam${i}@example.fr`, signup: true }) })
        if (x.status === 429) { limited = i + 1; break }
      }
      note('Info', limited ? `Demandes de lien en rafale : bloquées à la ${limited}e (limite ×20 en test, RATE_LIMIT_SCALE).` : 'Demandes de lien en rafale : 40 acceptées sans limite (RATE_LIMIT_SCALE=20 en test ; limite réelle 20 fois plus basse).')
      await ctx.close()
    },
  },
  {
    name: 'Claire, 50 ans, revient après 3 semaines et ne sait plus comment se connecter',
    async run(b) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await ctx.newPage()
      watchErrors(page)
      await page.goto(BASE + '/')
      await page.getByRole('link', { name: 'Se connecter' }).first().click()
      await page.waitForTimeout(600)
      await inspect(page, 'Connexion')
      await shot(page, '14-claire-connexion')
      // Elle tape une adresse qui n'a pas de compte.
      const email = page.getByLabel(/email/i).first()
      await email.fill('claire.inconnue@example.fr')
      const before = logSize()
      await page.getByRole('button').filter({ hasText: /lien|connexion|continuer|recevoir/i }).first().click()
      await page.waitForTimeout(1500)
      const t = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      note('Info', `Connexion avec une adresse sans compte : « ${t.slice(0, 200)} ».`)
      await shot(page, '14-claire-adresse-inconnue')
      const sent = fs.readFileSync('/tmp/bailio-api.log').subarray(before).toString()
      note('Info', /jeton=/.test(sent) ? 'Un email est envoyé à une adresse sans compte (lien d’inscription).' : 'Aucun email envoyé à une adresse sans compte.')
      // Lien périmé ou abîmé (copié à moitié depuis l'email).
      await page.goto(BASE + '/connexion/lien?jeton=abcdef')
      await page.waitForTimeout(2000)
      const t2 = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      note('Info', `Lien de connexion abîmé : « ${t2.slice(0, 200)} ».`)
      await shot(page, '14-claire-lien-abime')
      if (!(await page.getByRole('link').or(page.getByRole('button')).filter({ hasText: /nouveau lien|recevoir|connexion|réessayer/i }).count())) note('Mineur', 'Lien de connexion abîmé : pas de bouton pour en demander un nouveau.')
      // Page inexistante.
      await page.goto(BASE + '/espace/bail-qui-nexiste-pas')
      await page.waitForTimeout(1200)
      note('Info', `Adresse inconnue : « ${(await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120)} ».`)
      await ctx.close()
    },
  },
]

// ---------------------------------------------------------------------------------------------------------------
const only = process.argv.slice(2).map(Number)
const browser = await launch()
for (const [i, p] of PERSONAS.entries()) {
  if (only.length && !only.includes(i + 1)) continue
  current = `${i + 1}. ${p.name}`
  const s = Date.now()
  try {
    await p.run(browser)
  } catch (e) {
    note('Bloquant', `Parcours interrompu : ${e.message.split('\n')[0]}`)
  }
  console.log(`${current} — ${Math.round((Date.now() - s) / 1000)} s`)
}
await browser.close()
const file = `${OUT}constats${only.length ? '-' + only.join('-') : ''}.json`
fs.writeFileSync(file, JSON.stringify(findings, null, 2))
for (const f of findings) console.log(`[${f.level}] ${f.persona.split(',')[0]} · ${f.text}${f.shot ? ` (capture ${f.shot})` : ''}`)
