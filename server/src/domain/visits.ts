/**
 * Mesure d'audience sans cookie ni traceur : le site envoie la page affichée et, pour la première page d'une visite,
 * le site d'où vient le visiteur. Le serveur n'enregistre que des compteurs par jour, page et provenance : aucune
 * adresse IP, aucun identifiant, aucun navigateur. Seules les pages publiques sont comptées (jamais un lien privé).
 * Fonctions pures, testées dans visits.test.ts.
 */

const DAY = 86_400_000

/** Pages comptées : l'accueil, le parcours sans compte (étape par étape), la connexion et les pages publiques. */
export const COUNTED_PATHS = [
  '/',
  '/commencer',
  '/commencer/logement',
  '/commencer/personnes',
  '/commencer/loyer',
  '/commencer/relecture',
  '/commencer/recevoir',
  '/inscription',
  '/connexion',
  '/reprendre',
  '/importer',
  '/contact',
  '/securite',
  '/prix-et-remboursement',
  '/mentions-legales',
  '/conditions',
  '/confidentialite',
  '/cookies',
  '/accessibilite',
] as const

const COUNTED = new Set<string>(COUNTED_PATHS)

/** Chemin compté, sans paramètres ni barre finale ; null pour toute autre page (espace, liens privés…). */
export function countedPath(raw: string): string | null {
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  return COUNTED.has(path) ? path : null
}

/** Robots et aperçus de liens : jamais comptés. */
export const isBot = (ua: string | undefined) => !ua || /bot|crawl|spider|slurp|headless|preview|lighthouse|facebookexternalhit|embedly|whatsapp|curl|wget|python|node-fetch|axios/i.test(ua)

/** Provenances connues, regroupées sous un seul nom (google.fr et google.com → Google). */
const FAMILIES: Array<[RegExp, string]> = [
  [/(^|\.)gemini\.google\./, 'Gemini'],
  [/(^|\.)(mail\.google|outlook\.(live|office)|mail\.yahoo|webmail|mail\.orange|zimbra|laposte\.net|ik\.me|mail\.infomaniak)/, 'Messagerie'],
  [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)qwant\.com$/, 'Qwant'],
  [/(^|\.)ecosia\.org$/, 'Ecosia'],
  [/(^|\.)yahoo\./, 'Yahoo'],
  [/(^|\.)(facebook\.com|fb\.com|messenger\.com)$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X (Twitter)'],
  [/(^|\.)(reddit\.com)$/, 'Reddit'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)leboncoin\.fr$/, 'Leboncoin'],
  [/(^|\.)seloger\.com$/, 'SeLoger'],
  [/(^|\.)pap\.fr$/, 'PAP'],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)claude\.ai$/, 'Claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'Copilot'],
]

export const DIRECT = 'Accès direct'
export const INTERNAL = 'Dans le site'

/**
 * Provenance d'une visite : le paramètre utm_source du lien s'il y en a un (liens partagés sur une annonce, un
 * réseau…), sinon le site précédent (référent), regroupé par famille. Sans référent : accès direct (adresse tapée,
 * favori, application). Le site lui-même (rechargement, nouvel onglet) : null, ce n'est pas une nouvelle visite.
 */
export function visitSource(referrer: string | undefined, utm: string | undefined, ownHosts: string[]): string | null {
  const tag = (utm ?? '').trim().toLowerCase()
  if (/^[a-z0-9][a-z0-9._-]{0,39}$/.test(tag)) return tag
  if (!referrer) return DIRECT
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return DIRECT
  }
  host = host.replace(/^(www|m|l|lm|mobile)\./, '')
  if (!host) return DIRECT
  if (ownHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null
  for (const [re, name] of FAMILIES) if (re.test(host)) return name
  return host.slice(0, 60)
}

/** Jour (heure de Paris) au format AAAA-MM-JJ. */
export const parisDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

/** Compteurs gardés 13 mois au plus (recommandation de la CNIL pour la mesure d'audience). */
export const VISIT_RETENTION_DAYS = 395

export interface VisitRow {
  day: Date
  path: string
  source: string
  views: number
  entries: number
}

export interface Audience {
  /** Visites (premières pages) sur 7 et 30 jours. */
  visits7: number
  visits30: number
  /** Vues de l'accueil sur 30 jours. */
  homeViews30: number
  /** Provenance des visites (30 jours), de la plus fréquente à la moins fréquente. */
  sources: Array<{ source: string; visits: number; percent: number }>
  /** Pages par lesquelles on arrive (30 jours). */
  landings: Array<{ path: string; visits: number }>
  /** Du premier écran au lien de connexion demandé (30 jours, pages vues). */
  tunnel: Array<{ path: string; label: string; views: number; percent: number }>
  /** Visites par semaine (8 semaines), la plus ancienne d'abord, alignées sur les semaines du pilotage. */
  weeks: Array<{ week: string; visits: number }>
}

const TUNNEL: Array<[string, string]> = [
  ['/', 'Accueil'],
  ['/commencer', 'Type de location'],
  ['/commencer/logement', 'Le logement'],
  ['/commencer/personnes', 'Les personnes'],
  ['/commencer/loyer', 'Le loyer'],
  ['/commencer/relecture', 'Relecture du bail'],
  ['/commencer/recevoir', 'Email pour recevoir le bail'],
]

export function computeAudience(rows: VisitRow[], now: Date, weekStarts: string[]): Audience {
  const since = (days: number) => now.getTime() - days * DAY
  const within = (days: number) => rows.filter((r) => r.day.getTime() >= since(days))
  const sum = (list: VisitRow[], k: 'views' | 'entries') => list.reduce((s, r) => s + r[k], 0)
  const last30 = within(30)
  const visits30 = sum(last30, 'entries')

  const bySource = new Map<string, number>()
  const byLanding = new Map<string, number>()
  const byPath = new Map<string, number>()
  for (const r of last30) {
    if (r.entries) bySource.set(r.source, (bySource.get(r.source) ?? 0) + r.entries)
    if (r.entries) byLanding.set(r.path, (byLanding.get(r.path) ?? 0) + r.entries)
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.views)
  }
  const sorted = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const home = byPath.get('/') ?? 0

  return {
    visits7: sum(within(7), 'entries'),
    visits30,
    homeViews30: home,
    sources: sorted(bySource).map(([source, visits]) => ({ source, visits, percent: visits30 ? Math.round((visits / visits30) * 100) : 0 })),
    landings: sorted(byLanding).slice(0, 8).map(([path, visits]) => ({ path, visits })),
    tunnel: TUNNEL.map(([path, label]) => {
      const views = byPath.get(path) ?? 0
      return { path, label, views, percent: home ? Math.min(100, Math.round((views / home) * 100)) : 0 }
    }),
    weeks: weekStarts.map((week) => {
      const from = new Date(`${week}T00:00:00Z`).getTime()
      const to = from + 7 * DAY
      return { week, visits: sum(rows.filter((r) => r.day.getTime() >= from && r.day.getTime() < to), 'entries') }
    }),
  }
}
