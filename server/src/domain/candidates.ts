import { z } from 'zod'

/**
 * Candidatures : le candidat remplit un formulaire public, sans compte, et dépose les pièces que le propriétaire
 * a choisies pour ce logement (seulement parmi celles que la loi autorise), ou partage son DossierFacile.
 * Pièces qu'un bailleur peut demander : décret n° 2015-1437 du 5 novembre 2015 ; pièces interdites :
 * loi n° 89-462 du 6 juillet 1989, art. 22-2. Aucune question sur l'origine, la santé, la famille…
 */

const text = (max: number) => z.string().trim().max(max)

export const candidateSchema = z.object({
  civility: z.enum(['MADAME', 'MONSIEUR']).optional().nullable(),
  firstNames: text(120).min(1, 'Indiquez votre prénom.'),
  lastName: text(80).min(1, 'Indiquez votre nom.'),
  email: z.email('Email invalide'),
  phone: text(30).optional().nullable(),
  currentAddress: text(300).optional().nullable(),
  situation: z.enum(['EMPLOYEE', 'SELF_EMPLOYED', 'STUDENT', 'APPRENTICE', 'RETIRED', 'OTHER']),
  /** Revenus nets mensuels du foyer, en centimes. */
  monthlyIncomeCents: z.number().int().min(0).max(100_000_000),
  occupants: z.number().int().min(1).max(12).optional().nullable(),
  guarantee: z.enum(['CAUTION', 'VISALE', 'GLI', 'NONE']),
  guarantor: z.object({ firstNames: text(120), lastName: text(80), email: z.email().or(z.literal('')).optional().nullable() }).optional().nullable(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dossierFacileUrl: z
    .string()
    .trim()
    .max(300)
    .regex(/^https:\/\/([a-z0-9-]+\.)*dossierfacile\.(logement\.gouv\.)?fr\//, 'Le lien doit venir de DossierFacile.')
    .optional()
    .nullable()
    .or(z.literal('')),
  message: text(1500).optional().nullable(),
  /** Accord du candidat pour la transmission de ses informations au propriétaire. */
  consent: z.literal(true, 'Cochez la case pour envoyer votre candidature.'),
})
export type CandidateData = z.infer<typeof candidateSchema>

export const SITUATION_LABEL: Record<CandidateData['situation'], string> = {
  EMPLOYEE: 'Salarié',
  SELF_EMPLOYED: 'Indépendant',
  STUDENT: 'Étudiant',
  APPRENTICE: 'Apprenti ou alternant',
  RETIRED: 'Retraité',
  OTHER: 'Autre situation',
}
export const GUARANTEE_LABEL: Record<CandidateData['guarantee'], string> = {
  CAUTION: 'Une personne se porte caution',
  VISALE: 'Garantie Visale',
  GLI: 'Assurance loyers impayés',
  NONE: 'Pas de garant',
}

/** Part du loyer charges comprises dans les revenus : simple indication, jamais un critère imposé. */
export function rentShare(rentWithChargesCents: number, monthlyIncomeCents: number): number | null {
  if (!monthlyIncomeCents) return null
  return Math.round((rentWithChargesCents / monthlyIncomeCents) * 100)
}

/** Ce qu'un bailleur peut demander (résumé du décret n° 2015-1437), une pièce par catégorie. */
export const ALLOWED_DOCUMENTS: Array<{ title: string; items: string[] }> = [
  { title: 'Identité', items: ['Carte d’identité, passeport, permis de conduire ou titre de séjour, en cours de validité.'] },
  {
    title: 'Domicile actuel (une seule pièce)',
    items: ['Trois dernières quittances de loyer, ou attestation du précédent bailleur', 'Attestation d’hébergement', 'Attestation d’élection de domicile', 'Dernier avis de taxe foncière ou titre de propriété'],
  },
  {
    title: 'Activité professionnelle',
    items: ['Contrat de travail ou de stage, ou attestation de l’employeur', 'Extrait K ou K bis, extrait D1, carte professionnelle ou certificat d’identification de l’INSEE pour les indépendants', 'Carte d’étudiant ou certificat de scolarité'],
  },
  {
    title: 'Ressources',
    items: ['Dernier ou avant-dernier avis d’imposition', 'Trois derniers bulletins de salaire', 'Deux derniers bilans pour les indépendants', 'Justificatifs de pensions, retraites, allocations, bourses ou aides au logement (simulation CAF)'],
  },
]

/** Ce qu'il est interdit de demander (loi du 6 juillet 1989, art. 22-2). */
export const FORBIDDEN_DOCUMENTS: string[] = [
  'Photo d’identité (en dehors de la pièce d’identité)',
  'Carte Vitale',
  'Relevés de compte bancaire, attestation de bonne tenue de compte ou d’absence de crédit',
  'Autorisation de prélèvement automatique',
  'Chèque de réservation ou dépôt d’argent sur un compte bloqué',
  'Contrat de mariage, certificat de concubinage, jugement de divorce',
  'Dossier médical',
  'Extrait de casier judiciaire',
  'Plus de deux bilans pour un indépendant',
]

/** Fiche locataire pré-remplie à partir d'une candidature retenue : rien n'est ressaisi. */
/** Pièce déposée par le candidat (fichier gardé chez le propriétaire, effacé avec la candidature). */
export interface CandidateDoc {
  category: string
  who: 'TENANT' | 'GUARANTOR'
  fileId: string
  label: string
}
export const DEFAULT_REQUESTED_DOCS = ['identity', 'home', 'activity', 'taxNotice', 'income']

export function tenantFromCandidate(c: CandidateData & { documents?: CandidateDoc[] }) {
  // Les pièces déposées rejoignent la fiche, marquées « envoyées par le locataire » : à vérifier par le propriétaire.
  const docs = (who: CandidateDoc['who']) => (c.documents ?? []).filter((d) => d.who === who).map((d) => ({ category: d.category, received: true, fileId: d.fileId, label: d.label, source: 'TENANT' as const }))
  return {
    monthlyIncomeCents: c.monthlyIncomeCents,
    documents: docs('TENANT'),
    civility: c.civility ?? null,
    firstNames: c.firstNames,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? null,
    currentAddress: c.currentAddress ?? null,
    situation: c.situation,
    guarantee: c.guarantee,
    dossierFacileUrl: c.dossierFacileUrl || null,
    living: c.occupants && c.occupants > 1 ? undefined : 'ALONE',
    guarantor: c.guarantee === 'CAUTION' && c.guarantor ? { firstNames: c.guarantor.firstNames, lastName: c.guarantor.lastName, email: c.guarantor.email || null, documents: docs('GUARANTOR') } : null,
  }
}

/**
 * Aide au tri des candidatures, jamais une décision automatique. Uniquement des critères objectifs liés à la
 * solvabilité et au dossier, comme le recommande le Défenseur des droits (« Louer sans discriminer ») :
 * - ressources : toutes comptent (salaires, pensions, allocations, aides au logement), quel que soit le contrat ;
 * - garantie (caution, Visale, assurance) ; dossier (pièces demandées déposées, ou DossierFacile) ; date d'entrée.
 * Jamais l'âge, la situation de famille, le nombre d'occupants, la situation professionnelle ni aucun critère de
 * l'article 225-1 du code pénal (refus de louer discriminatoire : loi du 6 juillet 1989, art. 1er).
 */
export type Mark = 'GOOD' | 'MEDIUM' | 'WEAK'

export interface CandidateReview {
  level: 'SOLID' | 'CORRECT' | 'INCOMPLETE'
  label: string
  points: number
  criteria: Array<{ key: 'RESOURCES' | 'GUARANTEE' | 'FILE' | 'DATE'; mark: Mark; text: string }>
}

const LEVEL_LABEL: Record<CandidateReview['level'], string> = { SOLID: 'Dossier solide', CORRECT: 'Dossier correct', INCOMPLETE: 'Dossier à compléter' }

export function reviewCandidate(
  c: Pick<CandidateData, 'monthlyIncomeCents' | 'guarantee' | 'moveInDate' | 'dossierFacileUrl'> & { documents?: Array<{ category: string; who: string }> },
  offer: { rentWithChargesCents: number | null; requestedDocs: string[]; availableFrom: string | null },
): CandidateReview {
  const criteria: CandidateReview['criteria'] = []
  const share = offer.rentWithChargesCents ? rentShare(offer.rentWithChargesCents, c.monthlyIncomeCents) : null
  if (share === null) criteria.push({ key: 'RESOURCES', mark: 'MEDIUM', text: offer.rentWithChargesCents ? 'Ressources non indiquées.' : 'Indiquez le loyer du logement pour comparer aux ressources.' })
  else criteria.push({ key: 'RESOURCES', mark: share <= 33 ? 'GOOD' : share <= 40 ? 'MEDIUM' : 'WEAK', text: `Le loyer charges comprises représente ${share} % de ses ressources${share > 40 ? ' : regardez la garantie' : ''}.` })
  criteria.push(c.guarantee === 'NONE' ? { key: 'GUARANTEE', mark: 'MEDIUM', text: 'Pas de garant.' } : { key: 'GUARANTEE', mark: 'GOOD', text: GUARANTEE_LABEL[c.guarantee] + '.' })
  const given = new Set((c.documents ?? []).filter((d) => d.who === 'TENANT').map((d) => d.category))
  const missing = offer.requestedDocs.filter((k) => !given.has(k))
  if (c.dossierFacileUrl) criteria.push({ key: 'FILE', mark: 'GOOD', text: 'Dossier DossierFacile partagé (pièces vérifiées par l’État).' })
  else if (!offer.requestedDocs.length || !missing.length) criteria.push({ key: 'FILE', mark: 'GOOD', text: 'Toutes les pièces demandées sont déposées.' })
  else criteria.push({ key: 'FILE', mark: missing.length < offer.requestedDocs.length ? 'MEDIUM' : 'WEAK', text: `${missing.length} pièce${missing.length > 1 ? 's' : ''} demandée${missing.length > 1 ? 's' : ''} manquante${missing.length > 1 ? 's' : ''}.` })
  if (c.moveInDate && offer.availableFrom) {
    const gap = Math.round((Date.parse(`${c.moveInDate}T00:00:00Z`) - Date.parse(`${offer.availableFrom}T00:00:00Z`)) / 86_400_000)
    criteria.push(Math.abs(gap) <= 15 ? { key: 'DATE', mark: 'GOOD', text: 'Date d’entrée souhaitée proche de la disponibilité.' } : { key: 'DATE', mark: 'MEDIUM', text: `Souhaite entrer ${gap > 0 ? `${gap} jours après` : `${-gap} jours avant`} la disponibilité.` })
  }
  const value: Record<Mark, number> = { GOOD: 2, MEDIUM: 1, WEAK: 0 }
  const points = criteria.reduce((a, x) => a + value[x.mark], 0)
  const max = criteria.length * 2
  const level: CandidateReview['level'] = criteria.some((x) => x.mark === 'WEAK') ? 'INCOMPLETE' : points >= max - 1 ? 'SOLID' : 'CORRECT'
  return { level, label: LEVEL_LABEL[level], points: Math.round((points / max) * 100), criteria }
}
