/**
 * Inscription en questions, une par écran (`pages/Inscription.tsx`) : qui vous êtes, ce que vous attendez de Bailio,
 * combien de logements, comment vous gérez aujourd'hui, comment vous avez connu Bailio, puis prénom, nom, email et
 * téléphone facultatif. Chaque réponse sert à quelque chose (RGPD art. 5, minimisation) :
 * - le nombre de logements choisit la vue du tableau de bord (`viewMode`) ;
 * - le logiciel actuel nous dit d'où viennent les propriétaires (l'import se propose ensuite dans l'espace) ;
 * - les attentes ordonnent les raccourcis et nous disent quoi améliorer ;
 * - la provenance nous dit où parler de Bailio (jamais transmise à un tiers) ;
 * - prénom, nom et téléphone remplissent le profil du bailleur (repris dans les baux et quittances).
 * Les réponses voyagent avec le lien de connexion (`LoginToken.signup`) et ne s'appliquent qu'à la création du compte.
 */
import { z } from 'zod'
import { readPhone } from './contact.js'
import type { ViewMode } from './viewMode.js'

export const SIGNUP_ROLES = ['OWNER', 'AGENCY'] as const
export const SIGNUP_GOALS = ['TIME', 'COMPLIANCE', 'RENTS', 'FINANCES', 'TAXES'] as const
export const SIGNUP_HOMES = ['ONE', 'TWO', 'FEW', 'MANY', 'LOTS'] as const
export const SIGNUP_TOOLS = ['NONE', 'SPREADSHEET', 'QALIMO', 'RENTILA', 'SOFTWARE', 'AGENCY'] as const
export const SIGNUP_SOURCES = ['SEARCH', 'SOCIAL', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'WORD_OF_MOUTH', 'AI', 'OTHER'] as const

const name = z.string().trim().min(1).max(80)

export const signupAnswersSchema = z.object({
  role: z.enum(SIGNUP_ROLES),
  goals: z.array(z.enum(SIGNUP_GOALS)).max(SIGNUP_GOALS.length).default([]),
  homes: z.enum(SIGNUP_HOMES),
  /** Nombre exact choisi au curseur (50 = « 50 et plus »). */
  homeCount: z.number().int().min(1).max(50).optional(),
  tool: z.enum(SIGNUP_TOOLS),
  source: z.enum(SIGNUP_SOURCES).optional(),
  firstName: name,
  lastName: name,
  phone: z.string().trim().max(30).optional(),
})
export type SignupAnswers = z.infer<typeof signupAnswersSchema>

/** Vue du tableau de bord d'après le nombre de logements (mêmes seuils que `suggestViewMode`) ; agence : AGENCY. */
export function viewModeFor(a: Pick<SignupAnswers, 'role' | 'homes'>): ViewMode {
  if (a.role === 'AGENCY') return 'AGENCY'
  if (a.homes === 'ONE' || a.homes === 'TWO') return 'SIMPLE'
  if (a.homes === 'LOTS') return 'LARGE'
  return 'PORTFOLIO'
}

/**
 * Première connexion : toujours le tableau de bord. L'import d'un fichier (tableur, Qalimo, Rentila) se fait ensuite
 * depuis l'espace (carte « Tous mes logements dans un fichier », page Biens), jamais avant d'avoir un compte.
 */
export function firstPathFor(_a: Pick<SignupAnswers, 'tool'>): string {
  return '/espace'
}

/**
 * Ce qui s'écrit dans le compte à sa création. Le téléphone n'est gardé que s'il est lisible ; le profil existant
 * n'est jamais écrasé (seuls les champs vides sont remplis).
 */
export function applySignup(a: SignupAnswers, profile: Record<string, unknown>, at: Date) {
  const phone = a.phone ? readPhone(a.phone)?.display : undefined
  const filled = (v: unknown) => v !== undefined && v !== null && v !== ''
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    viewMode: viewModeFor(a),
    profile: {
      ...profile,
      ...(filled(profile.firstNames) ? {} : { firstNames: a.firstName }),
      ...(filled(profile.lastName) ? {} : { lastName: a.lastName }),
      ...(phone && !filled(profile.phone) ? { phone } : {}),
      ...(a.role === 'AGENCY' && !profile.agent ? { agent: { enabled: true } } : {}),
    },
    onboarding: { role: a.role, goals: a.goals, homes: a.homes, ...(a.homeCount ? { homeCount: a.homeCount } : {}), tool: a.tool, ...(a.source ? { source: a.source } : {}), at: at.toISOString() },
  }
}
