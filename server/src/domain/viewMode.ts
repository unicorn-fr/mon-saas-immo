/**
 * Vue du tableau de bord (« Aujourd'hui ») selon la taille du patrimoine, choisie à la première connexion et modifiable :
 * - SIMPLE : 1 ou 2 logements, la prochaine chose à faire en grand ;
 * - PORTFOLIO : de 3 à 20 logements, tuiles du mois, alertes, rentabilité, actions groupées ;
 * - LARGE : plus de 20 logements ou plusieurs structures, patrimoine et exports en premier ;
 * - AGENCY : gestion pour le compte d'autres propriétaires (vue LARGE ; mandats et relevés de gérance pas encore faits).
 * Mêmes composants pour tous : seule la disposition change.
 */
export const VIEW_MODES = ['SIMPLE', 'PORTFOLIO', 'LARGE', 'AGENCY'] as const
export type ViewMode = (typeof VIEW_MODES)[number]

export function isViewMode(v: unknown): v is ViewMode {
  return typeof v === 'string' && (VIEW_MODES as readonly string[]).includes(v)
}

/** Vue proposée d'après les logements (garages compris) et les structures qui les détiennent. */
export function suggestViewMode(propertyCount: number, structureCount = 1): ViewMode {
  if (propertyCount > 20) return 'LARGE'
  if (propertyCount >= 3 || structureCount > 2) return 'PORTFOLIO'
  return 'SIMPLE'
}

/** Vue en vigueur : celle choisie, sinon celle proposée. */
export function effectiveViewMode(chosen: unknown, propertyCount: number, structureCount = 1): ViewMode {
  return isViewMode(chosen) ? chosen : suggestViewMode(propertyCount, structureCount)
}
