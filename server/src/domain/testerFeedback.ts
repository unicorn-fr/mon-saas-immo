import { z } from 'zod'

/**
 * Questionnaire des testeurs (page publique /avis-testeur) : ce que mesurent les grandes équipes produit, en
 * questions simples. Recommandation (NPS, 0 à 10), facilité (effort), design, rapidité, parcours essayés,
 * ce qui a plu, gêné, ce qu'il faut ajouter, retirer, les bugs, le prix acceptable. Rien n'est enregistré :
 * les réponses partent par email à l'équipe (routes/testerFeedback.ts).
 */

export const EASE = { VERY_EASY: 'Très facile', EASY: 'Facile', OK: 'Moyen', HARD: 'Difficile', VERY_HARD: 'Très difficile' } as const
export const DESIGN = { GREAT: 'Très réussi', GOOD: 'Réussi', OK: 'Correct', REDO: 'À revoir' } as const
export const SPEED = { FAST: 'Rapide', OK: 'Correcte', SLOW: 'Lente' } as const
export const PRICE = { FREE: 'Seulement si c’est gratuit', UP_TO_5: 'Jusqu’à 5 € par mois', UP_TO_10: '5 à 10 € par mois', UP_TO_20: '10 à 20 € par mois', MORE: 'Plus de 20 € par mois' } as const
export const TRIED = {
  PROPERTY: 'Ajouter un logement',
  TENANT: 'Ajouter un locataire',
  LEASE: 'Créer un bail',
  ESIGN: 'Signature en ligne',
  INVENTORY: 'État des lieux',
  RENT: 'Loyers et quittances',
  LETTERS: 'Courriers',
  AD: 'Annonce et candidats',
  TAX: 'Déclaration des revenus',
  OTHER: 'Autre chose',
} as const
export const PROFILE = { OWNER: 'Je loue un ou plusieurs logements', SOON: 'Je vais bientôt louer', PRO: 'Je suis un professionnel de l’immobilier', CREATOR: 'Je crée du contenu sur l’immobilier' } as const

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...Array<keyof T & string>]
const text = z.string().trim().max(2000, 'Votre réponse est trop longue (2 000 caractères au plus).').optional().nullable()

export const testerFeedbackSchema = z.object({
  nps: z.number().int().min(0).max(10),
  profile: z.enum(keys(PROFILE)).optional().nullable(),
  tried: z.array(z.enum(keys(TRIED))).max(10).default([]),
  ease: z.enum(keys(EASE)).optional().nullable(),
  design: z.enum(keys(DESIGN)).optional().nullable(),
  speed: z.enum(keys(SPEED)).optional().nullable(),
  liked: text,
  annoying: text,
  add: text,
  remove: text,
  bugs: text,
  price: z.enum(keys(PRICE)).optional().nullable(),
  name: z.string().trim().max(120).optional().nullable(),
  contact: z.string().trim().max(200).optional().nullable(),
  // Champ invisible : rempli seulement par les robots.
  website: z.string().max(200).optional().nullable(),
})
export type TesterFeedback = z.infer<typeof testerFeedbackSchema>

/** Catégorie NPS : 9-10 promoteur, 7-8 passif, 0-6 détracteur. */
export const npsGroup = (n: number) => (n >= 9 ? 'Promoteur' : n >= 7 ? 'Passif' : 'Détracteur')

/** Lignes de l'email reçu par l'équipe, dans l'ordre des questions. */
export function feedbackLines(f: TesterFeedback): string[] {
  const no = '(pas de réponse)'
  return [
    `Recommandation : ${f.nps}/10 (${npsGroup(f.nps)})`,
    `Profil : ${f.profile ? PROFILE[f.profile] : no}`,
    `A essayé : ${f.tried.length ? f.tried.map((t) => TRIED[t]).join(', ') : no}`,
    `Facilité : ${f.ease ? EASE[f.ease] : no}`,
    `Design : ${f.design ? DESIGN[f.design] : no}`,
    `Rapidité : ${f.speed ? SPEED[f.speed] : no}`,
    `Ce qui a plu : ${f.liked || no}`,
    `Ce qui a gêné : ${f.annoying || no}`,
    `À ajouter : ${f.add || no}`,
    `À retirer ou simplifier : ${f.remove || no}`,
    `Bugs : ${f.bugs || no}`,
    `Prix acceptable : ${f.price ? PRICE[f.price] : no}`,
    `Nom ou compte : ${f.name || no}`,
    `Pour le recontacter : ${f.contact || no}`,
  ]
}
