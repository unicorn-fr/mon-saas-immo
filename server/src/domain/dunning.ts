/**
 * Relances automatiques d'un loyer impayé, choisies par le propriétaire sur la page du bail (`lease.data.dunning`).
 * Trois envois, comptés en jours après l'échéance (réglables) :
 *  1. relance amiable (lettre REMINDER) ;
 *  2. second rappel (lettre REMINDER, `second`) ;
 *  3. mise en demeure (lettre FORMAL_NOTICE), copie par email ; le propriétaire est invité à l'envoyer aussi en recommandé.
 * Chaque lettre reprend toute la dette du moment. Tout s'arrête dès que le loyer est payé.
 * Coupé par défaut : une mise en demeure est un acte sérieux, le propriétaire l'active lui-même.
 */
export const DUNNING_DEFAULT_DAYS: readonly [number, number, number] = [3, 8, 15]
/** Pas de rattrapage : une étape manquée de plus de 5 jours (serveur arrêté, relance activée tard) ne part plus. */
export const DUNNING_CATCH_UP_DAYS = 5

export type DunningStep = 1 | 2 | 3
export interface DunningSettings {
  enabled: boolean
  days: [number, number, number]
}

/** Réglages lus dans les données du bail ; jours croissants, de 1 à 60, sinon les valeurs par défaut. */
export function dunningSettings(data: unknown): DunningSettings {
  const d = (data as { dunning?: { enabled?: unknown; days?: unknown } } | null)?.dunning
  return { enabled: d?.enabled === true, days: validDays(d?.days) ?? [...DUNNING_DEFAULT_DAYS] }
}

export function validDays(days: unknown): [number, number, number] | null {
  if (!Array.isArray(days) || days.length !== 3) return null
  const [a, b, c] = days
  if (![a, b, c].every((x) => Number.isInteger(x) && x >= 1 && x <= 60)) return null
  return a < b && b < c ? [a, b, c] : null
}

const DAY = 86_400_000
const plus = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10)

export interface DunningState {
  /** AAAA-MM-JJ */
  today: string
  /** Échéance (AAAA-MM-JJ) du mois impayé le plus récent, ou null si rien n'est dû. */
  dueDate: string | null
  days: [number, number, number]
  /** Étapes déjà envoyées pour cette échéance, avec leur date (AAAA-MM-JJ). */
  sent: Partial<Record<DunningStep, string>>
}

/** Jour prévu d'une étape : son jour après l'échéance, et au moins le même écart qu'au réglage depuis l'envoi précédent. */
function stepDay(s: DunningState, step: DunningStep): string | null {
  if (!s.dueDate) return null
  const base = plus(s.dueDate, s.days[step - 1])
  if (step === 1) return base
  const prev = s.sent[(step - 1) as DunningStep]
  if (!prev) return null
  const after = plus(prev, s.days[step - 1] - s.days[step - 2])
  return after > base ? after : base
}

/**
 * L'envoi à faire aujourd'hui, ou null. Chaque nouveau mois impayé relance la suite ; une étape n'est envoyée qu'une
 * fois, toujours après la précédente et avec le même écart qu'au réglage. Relance activée tard : la suite ne commence
 * que si le jour du second rappel n'est pas passé (jamais de mise en demeure d'un coup). Une étape manquée de plus de
 * 5 jours (serveur arrêté) ne part plus.
 */
export function dunningStep(s: DunningState): DunningStep | null {
  if (!s.dueDate) return null
  for (const step of [1, 2, 3] as const) {
    if (s.sent[step]) continue
    const day = stepDay(s, step)
    if (!day || s.today < day) return null
    if (step === 1 && s.today >= plus(s.dueDate, s.days[1])) return null
    if (s.today > plus(day, DUNNING_CATCH_UP_DAYS)) return null
    return step
  }
  return null
}

/** Dates prévues des trois envois pour une échéance, pour les afficher au propriétaire. */
export const dunningDates = (dueDate: string, days: [number, number, number]) => days.map((d) => plus(dueDate, d)) as [string, string, string]

export const DUNNING_LABELS: Record<DunningStep, string> = { 1: 'Relance amiable', 2: 'Second rappel', 3: 'Mise en demeure' }
