/**
 * Connexion d'une IA (Claude, ChatGPT…) au compte, en LECTURE SEULE (choix d'Enzo, 14 novembre 2026).
 *
 * Une clé créée dans « Mon compte » (préfixe AI_KEY_PREFIX, seule son empreinte est gardée) ne peut que lire, et
 * seulement les adresses de AI_READ_PATHS : jamais un envoi, une écriture, un fichier, le compte ni les accès.
 * Les réponses passent par sanitizeForAi : aucun code de lien privé, aucune signature, aucun IBAN.
 */

export const AI_KEY_PREFIX = 'bai_'
export const MAX_AI_KEYS = 5

export const isAiKey = (token: string) => token.startsWith(AI_KEY_PREFIX)

/** Adresses lisibles par une IA (chemin normalisé, sans /api). Un segment « : » = un identifiant. */
const AI_READ_PATHS = [
  '/today',
  '/properties',
  '/properties/:id',
  '/properties/:id/ledger',
  '/properties/:id/loans',
  '/tenants',
  '/tenants/:id',
  '/leases',
  '/leases/:id',
  '/portfolio',
  '/money/tax',
  '/candidates',
]

/** Refus en français si la clé d'IA ne peut pas faire cette requête, sinon null. */
export function aiPathDenied(method: string, path: string): string | null {
  if (method !== 'GET' && method !== 'HEAD') return 'Une IA connectée ne peut que lire : rien n’est modifié ni envoyé.'
  const parts = path.split('/').filter(Boolean)
  const ok = AI_READ_PATHS.some((pattern) => {
    const want = pattern.split('/').filter(Boolean)
    return want.length === parts.length && want.every((w, i) => (w.startsWith(':') ? /^[\w-]{1,80}$/.test(parts[i]) : w === parts[i]))
  })
  return ok ? null : 'Cette information n’est pas accessible à une IA connectée.'
}

/** Clés retirées des réponses : liens privés, jetons, signatures, images, coordonnées bancaires. */
const SECRET_KEY = /(code|token|hash|signature|logo|iban|bic|password|secret)$/i

/** Copie d'une réponse sans ce qui ne doit jamais partir vers une IA. */
export function sanitizeForAi(value: unknown, depth = 0): unknown {
  if (depth > 30) return null
  if (typeof value === 'string') return value.startsWith('data:') ? '[image retirée]' : value
  if (Array.isArray(value)) return value.map((v) => sanitizeForAi(v, depth + 1))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY.test(k)) continue
      out[k] = sanitizeForAi(v, depth + 1)
    }
    return out
  }
  return value
}

/** Outils proposés à l'IA (protocole MCP), tous en lecture. */
export interface AiTool {
  name: string
  description: string
  params: Array<{ name: string; description: string; required?: boolean; type?: 'string' | 'integer' }>
  path: (args: Record<string, unknown>) => string
}

const id = (v: unknown) => {
  const s = String(v ?? '')
  if (!/^[\w-]{1,80}$/.test(s)) throw new Error('Identifiant invalide.')
  return encodeURIComponent(s)
}
const year = (v: unknown) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : new Date().getFullYear()
}

export const AI_TOOLS: AiTool[] = [
  { name: 'tableau_de_bord', description: 'Tableau de bord du propriétaire : chiffres du mois (loyers perçus, retards, dépôts), actions prioritaires et agenda.', params: [], path: () => '/today' },
  { name: 'liste_biens', description: 'Tous les biens (logements, garages) avec leur bail en cours, leur loyer et l’état du loyer du mois.', params: [], path: () => '/properties' },
  { name: 'bien', description: 'Détail d’un bien : fiche, bail, diagnostics, ce qui manque.', params: [{ name: 'id', description: 'Identifiant du bien (voir liste_biens).', required: true }], path: (a) => `/properties/${id(a.id)}` },
  {
    name: 'comptabilite_bien',
    description: 'Recettes et dépenses d’un bien pour une année (avec ses lots).',
    params: [
      { name: 'id', description: 'Identifiant du bien.', required: true },
      { name: 'annee', description: 'Année, par exemple 2026.', type: 'integer' },
    ],
    path: (a) => `/properties/${id(a.id)}/ledger?year=${year(a.annee)}`,
  },
  { name: 'emprunts_bien', description: 'Emprunts d’un bien et trésorerie du mois.', params: [{ name: 'id', description: 'Identifiant du bien.', required: true }], path: (a) => `/properties/${id(a.id)}/loans` },
  { name: 'liste_locataires', description: 'Tous les locataires avec leur bail, leur loyer et l’état du loyer.', params: [], path: () => '/tenants' },
  { name: 'locataire', description: 'Fiche d’un locataire : coordonnées, garantie, dossier, logement.', params: [{ name: 'id', description: 'Identifiant du locataire.', required: true }], path: (a) => `/tenants/${id(a.id)}` },
  { name: 'liste_baux', description: 'Tous les baux (en préparation, signés, terminés).', params: [], path: () => '/leases' },
  { name: 'bail', description: 'Détail d’un bail : loyer, dates, paiements, courriers, impayés.', params: [{ name: 'id', description: 'Identifiant du bail.', required: true }], path: (a) => `/leases/${id(a.id)}` },
  { name: 'pilotage', description: 'Vue d’ensemble mensuelle : loyers attendus, crédits, ce qu’il reste avant impôt, rendement, points à surveiller.', params: [], path: () => '/portfolio' },
  { name: 'declaration_revenus', description: 'Aide à la déclaration des revenus fonciers d’une année : régime, cases à remplir, montants.', params: [{ name: 'annee', description: 'Année des revenus, par exemple 2025.', type: 'integer' }], path: (a) => `/money/tax?year=${year(a.annee ?? new Date().getFullYear() - 1)}` },
  { name: 'candidats', description: 'Candidatures reçues pour tous les biens, avec l’indice du dossier.', params: [], path: () => '/candidates' },
]
