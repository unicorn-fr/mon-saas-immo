/**
 * Problème signalé par le locataire depuis son lien (routes/tenantLink.ts). Le signalement devient une intervention
 * « à organiser » du logement (source TENANT) ; le locataire suit ensuite son avancement sur le même lien.
 *
 * Conseils de sécurité : numéro d'Urgence sécurité gaz de GRDF (0 800 47 33 33, gratuit, 24 h/24, grdf.fr).
 * Répartition des réparations : décret n° 87-712 du 26 août 1987 (réparations locatives, à la charge du locataire),
 * loi du 6 juillet 1989, art. 6 (logement décent et en bon état, à la charge du bailleur) et art. 7 (entretien courant
 * par le locataire).
 */

export const ISSUE_CATEGORIES = ['WATER', 'GAS', 'HEATING', 'ELECTRICITY', 'DOOR', 'DAMP', 'PESTS', 'APPLIANCE', 'OTHER'] as const
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

export const ISSUE_LABEL: Record<IssueCategory, string> = {
  WATER: 'Fuite ou dégât des eaux',
  GAS: 'Odeur de gaz',
  HEATING: 'Chauffage ou eau chaude',
  ELECTRICITY: 'Électricité',
  DOOR: 'Porte, serrure ou fenêtre',
  DAMP: 'Humidité ou moisissure',
  PESTS: 'Insectes ou rongeurs',
  APPLIANCE: 'Équipement ou meuble',
  OTHER: 'Autre chose',
}

/** Geste à faire tout de suite, avant même que le bailleur réponde. */
export const ISSUE_ADVICE: Partial<Record<IssueCategory, string>> = {
  WATER: 'Coupez l’arrivée d’eau si vous le pouvez. Si l’eau a causé des dégâts, prévenez aussi votre assurance habitation.',
  GAS: 'Ne touchez à aucun interrupteur, ouvrez les fenêtres, sortez et appelez Urgence sécurité gaz au 0 800 47 33 33 (gratuit, 24 h/24).',
  ELECTRICITY: 'En cas de danger (étincelles, odeur de brûlé), coupez le courant au disjoncteur.',
}

/** Catégories toujours traitées comme urgentes, quoi qu'indique le locataire. */
const ALWAYS_URGENT: IssueCategory[] = ['GAS', 'WATER']

/** Liste affichée au locataire (libellé, geste immédiat, toujours urgent). */
export const issueChoices = () => ISSUE_CATEGORIES.map((value) => ({ value, label: ISSUE_LABEL[value], advice: ISSUE_ADVICE[value] ?? null, alwaysUrgent: ALWAYS_URGENT.includes(value) }))

export const isUrgent = (category: IssueCategory, saidUrgent: boolean) => saidUrgent || ALWAYS_URGENT.includes(category)

export interface IssueData {
  category: IssueCategory
  where: string | null
  urgent: boolean
  leaseId: string
  reportedAt: string
  photoIds: string[]
}

export function issueTitle(category: IssueCategory, where?: string | null): string {
  const w = (where ?? '').replace(/\s+/g, ' ').trim()
  return w ? `${ISSUE_LABEL[category]} (${w})`.slice(0, 160) : ISSUE_LABEL[category]
}

export function readIssue(data: unknown): IssueData | null {
  const d = (data ?? {}) as Partial<IssueData>
  if (!d.category || !ISSUE_CATEGORIES.includes(d.category) || !d.leaseId) return null
  return { category: d.category, where: d.where ?? null, urgent: Boolean(d.urgent), leaseId: d.leaseId, reportedAt: d.reportedAt ?? '', photoIds: Array.isArray(d.photoIds) ? d.photoIds : [] }
}

/** Ce que le locataire voit de l'avancement, sans le nom ni le téléphone de l'artisan ni le coût. */
export function issueProgress(status: string, date: string | null): string {
  const fr = date ? date.split('-').reverse().join('/') : null
  if (status === 'DONE') return fr ? `Réglé le ${fr}` : 'Réglé'
  if (status === 'PLANNED') return fr ? `Intervention prévue le ${fr}` : 'Intervention prévue'
  return 'Reçu par votre bailleur'
}
