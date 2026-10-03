/**
 * Calendrier fiscal du propriétaire bailleur. Les dates de la déclaration de revenus changent chaque année et
 * dépendent du département du domicile : seules les années vérifiées sur impots.gouv.fr sont inscrites ici
 * (à compléter chaque printemps). Pour une année non inscrite, la date affichée est indicative (« fin mai »).
 */

interface DeclarationDates {
  paper: string
  /** Déclaration en ligne : départements 01 à 19, 20 à 54, 55 à 976. */
  online: [string, string, string]
  source: string
}

export const DECLARATION_DATES: Record<number, DeclarationDates> = {
  2026: { paper: '2026-05-19', online: ['2026-05-21', '2026-05-28', '2026-06-04'], source: 'impots.gouv.fr, calendrier de la déclaration 2026 (revenus 2025)' },
}

/** Groupe de départements (0 : 01 à 19, 1 : 20 à 54 et la Corse, 2 : 55 à 976), d'après le code postal. */
export function departmentGroup(postalCode: string | null | undefined): 0 | 1 | 2 {
  const cp = (postalCode ?? '').trim()
  if (!/^\d{5}$/.test(cp)) return 2
  if (cp.startsWith('97') || cp.startsWith('98')) return 2
  const dep = Number(cp.slice(0, 2))
  if (dep <= 19) return 0
  if (dep <= 54) return 1
  return 2
}

/** Date limite de la déclaration en ligne pour une année, selon le domicile ; null si l'année n'est pas vérifiée. */
export function declarationDeadline(year: number, postalCode: string | null | undefined): { date: string; verified: true } | { date: null; verified: false } {
  const d = DECLARATION_DATES[year]
  if (!d) return { date: null, verified: false }
  return { date: d.online[departmentGroup(postalCode)], verified: true }
}

/**
 * Déclaration d'occupation (« Gérer mes biens immobiliers ») : à faire avant le 1er juillet de l'année si
 * l'occupation d'un logement a changé entre le 2 janvier de l'année précédente et le 1er janvier ; et dès que
 * l'occupant change (impots.gouv.fr, « La déclaration d'occupation »).
 */
export function occupancyDeclarationDue(year: number, changes: string[]): boolean {
  const from = `${year - 1}-01-02`
  const to = `${year}-01-01`
  return changes.some((d) => d >= from && d <= to)
}
