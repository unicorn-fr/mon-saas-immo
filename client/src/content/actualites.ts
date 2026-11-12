import { GUIDES } from '../lib/sources'

/**
 * Fil d'actualité du propriétaire (« Aujourd'hui » et /espace/actualites) : nouvelles règles, échéances, conseils.
 * Uniquement des faits déjà codés et vérifiés dans Bailio (CLAUDE.md, règles juridiques et fiscales), avec leur source
 * officielle. Le plus récent en tête. À compléter à chaque nouveau texte, jamais de mémoire.
 * `for` : à qui s'adresse l'information (tout le monde, location vide, meublée).
 */
export type NewsKind = 'LOI' | 'ECHEANCE' | 'CONSEIL'
export interface NewsItem {
  date: string // AAAA-MM-JJ : date d'effet ou de publication
  kind: NewsKind
  title: string
  text: string
  source: { label: string; url: string }
  for?: 'ALL' | 'VIDE' | 'MEUBLE'
}

export const NEWS: NewsItem[] = [
  {
    date: '2026-11-24',
    kind: 'LOI',
    title: 'Fin prévue de l’encadrement des loyers',
    text: 'L’expérimentation s’arrête après le 24 novembre 2026, sauf prolongation par une loi. Bailio suit le texte et vous préviendra.',
    source: GUIDES.encadrement,
    for: 'ALL',
  },
  {
    date: '2026-10-18',
    kind: 'LOI',
    title: 'Nouvelle notice d’information',
    text: 'Les baux conclus ou renouvelés depuis le 18 octobre 2026 reçoivent la notice de l’arrêté du 9 octobre 2026. Bailio la joint seul.',
    source: GUIDES.bail,
    for: 'ALL',
  },
  {
    date: '2026-10-01',
    kind: 'LOI',
    title: 'Contrat type mis à jour',
    text: 'Décret n° 2026-596 : clause résolutoire à six semaines, téléphone facultatif, servitude de résidence principale. Déjà dans vos baux.',
    source: GUIDES.contratType,
    for: 'ALL',
  },
  {
    date: '2026-12-15',
    kind: 'ECHEANCE',
    title: 'CFE de votre meublé',
    text: 'Paiement de la cotisation foncière des entreprises le 15 décembre. Première année : déclaration 1447-C-SD avant le 31 décembre.',
    source: GUIDES.impotsMeuble,
    for: 'MEUBLE',
  },
  {
    date: '2026-01-01',
    kind: 'CONSEIL',
    title: 'Micro-BIC : plafond relevé',
    text: 'Pour les revenus de 2026 à 2028, le micro-BIC du meublé monte à 83 600 € de recettes. Bailio compare pour vous micro et réel.',
    source: GUIDES.impotsMeuble,
    for: 'MEUBLE',
  },
  {
    date: '2025-12-22',
    kind: 'LOI',
    title: 'Nouvelle liste des zones tendues',
    text: 'Le décret n° 2013-392 a été modifié : 1 430 communes. Le loyer d’un nouveau bail y suit celui du locataire précédent, sauf exceptions. Bailio vérifie.',
    source: GUIDES.zonesTendues,
    for: 'VIDE',
  },
  {
    date: '2028-01-01',
    kind: 'ECHEANCE',
    title: 'Logements F interdits à la location',
    text: 'En métropole, après le G en 2025, les logements classés F ne pourront plus être loués au 1er janvier 2028. Pensez aux travaux.',
    source: GUIDES.dpe,
    for: 'ALL',
  },
]

/** Le plus récent en tête ; les échéances à venir restent visibles jusqu'à leur date. */
export function newsFor(furnished: boolean | null, today: string, items = NEWS): NewsItem[] {
  return items
    .filter((n) => !n.for || n.for === 'ALL' || furnished === null || (n.for === 'MEUBLE') === furnished)
    .sort((a, b) => {
      const ua = a.kind === 'ECHEANCE' && a.date >= today ? 0 : 1
      const ub = b.kind === 'ECHEANCE' && b.date >= today ? 0 : 1
      if (ua !== ub) return ua - ub
      return ua === 0 ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    })
}
