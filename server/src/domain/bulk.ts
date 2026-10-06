import { rentRevisionAllowed } from './rules.js'

/**
 * Actions groupées : qui figure dans chaque liste. Chaque envoi passe ensuite par le même chemin que l'envoi à l'unité
 * (lien du locataire, courrier enregistré puis envoyé, quittance), relu par le propriétaire avant.
 * - Assurance : attestation absente, ou qui expire dans les 30 jours (le locataire doit la fournir chaque année,
 *   loi du 6 juillet 1989, art. 7 g).
 * - Impayés : loyer non (entièrement) reçu 5 jours après l'échéance, sans relance envoyée ces 15 derniers jours.
 * - Révision : date anniversaire passée ou dans les 30 jours (rappel « Révision du loyer » à faire), bail avec un
 *   trimestre de référence de l'IRL, logement hors F et G (révision interdite).
 * - Quittances : loyer reçu ce mois-ci ou le mois dernier, quittance pas encore partie, accord du locataire non retiré.
 */

export type BulkKind = 'INSURANCE' | 'UNPAID' | 'REVISION' | 'RECEIPTS'

export interface BulkLease {
  id: string
  propertyName: string
  tenantName: string
  tenantEmail: boolean
  started: boolean
  insuranceExpiresAt: string | null
  /** Mois impayés (AAAA-MM), date d'échéance de chacun, montant manquant. */
  unpaid: Array<{ period: string; dueDate: string; missing: number }>
  lastReminderAt: string | null
  revisionDue: string | null
  irlRef: boolean
  dpe: string | null
  /** Paiements reçus (AAAA-MM) et quittances déjà parties. */
  paidPeriods: string[]
  receiptsSent: string[]
  eReceiptWithdrawn: boolean
}

export interface BulkRow {
  leaseId: string
  propertyName: string
  tenantName: string
  detail: string
  /** Si renseigné, la ligne ne peut pas partir (raison affichée, case décochée). */
  blocked: string | null
  amountCents?: number
  period?: string
}

const addDays = (isoDay: string, n: number) => new Date(Date.parse(`${isoDay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const frDate = (isoDay: string) => isoDay.split('-').reverse().join('/')
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const monthLabel = (period: string) => `${MONTHS[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`
const eur = (c: number) => `${(c / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const noEmail = 'Pas d’email dans la fiche du locataire.'

export function insuranceRows(leases: BulkLease[], today: string): BulkRow[] {
  return leases
    .filter((l) => l.started && (!l.insuranceExpiresAt || l.insuranceExpiresAt <= addDays(today, 30)))
    .map((l) => ({
      leaseId: l.id,
      propertyName: l.propertyName,
      tenantName: l.tenantName,
      detail: !l.insuranceExpiresAt ? 'Aucune attestation enregistrée' : l.insuranceExpiresAt < today ? `Expirée le ${frDate(l.insuranceExpiresAt)}` : `Expire le ${frDate(l.insuranceExpiresAt)}`,
      blocked: l.tenantEmail ? null : noEmail,
    }))
}

export function unpaidRows(leases: BulkLease[], today: string): BulkRow[] {
  return leases.flatMap((l) => {
    const late = l.unpaid.filter((u) => addDays(u.dueDate, 5) <= today)
    if (!late.length) return []
    const recent = Boolean(l.lastReminderAt && l.lastReminderAt >= addDays(today, -15))
    const total = late.reduce((a, u) => a + u.missing, 0)
    return [
      {
        leaseId: l.id,
        propertyName: l.propertyName,
        tenantName: l.tenantName,
        amountCents: total,
        detail: `${eur(total)} : ${late.map((u) => monthLabel(u.period)).join(', ')}`,
        blocked: recent ? `Relance déjà envoyée le ${frDate(l.lastReminderAt!)}.` : l.tenantEmail ? null : noEmail,
      },
    ]
  })
}

export function revisionRows(leases: BulkLease[], today: string): BulkRow[] {
  return leases
    .filter((l) => l.started && l.revisionDue && l.revisionDue <= addDays(today, 30))
    .map((l) => ({
      leaseId: l.id,
      propertyName: l.propertyName,
      tenantName: l.tenantName,
      detail: `Date anniversaire : ${frDate(l.revisionDue!)}`,
      blocked: !rentRevisionAllowed(l.dpe) ? 'Logement classé F ou G : la loi interdit la révision du loyer.' : !l.irlRef ? 'Le trimestre de référence de l’IRL n’est pas indiqué dans le bail.' : l.tenantEmail ? null : noEmail,
    }))
}

export function receiptRows(leases: BulkLease[], today: string): BulkRow[] {
  const thisMonth = today.slice(0, 7)
  const d = new Date(`${thisMonth}-01T00:00:00Z`)
  const lastMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)
  return leases.flatMap((l) =>
    l.paidPeriods
      .filter((p) => (p === thisMonth || p === lastMonth) && !l.receiptsSent.includes(p))
      .map((p) => ({
        leaseId: l.id,
        propertyName: l.propertyName,
        tenantName: l.tenantName,
        period: p,
        detail: `Quittance de ${monthLabel(p)}`,
        blocked: l.eReceiptWithdrawn ? 'Votre locataire a retiré son accord pour les quittances par email : remettez-la sur papier.' : l.tenantEmail ? null : noEmail,
      })),
  )
}

export function bulkGroups(leases: BulkLease[], today: string): Record<BulkKind, BulkRow[]> {
  return { INSURANCE: insuranceRows(leases, today), UNPAID: unpaidRows(leases, today), REVISION: revisionRows(leases, today), RECEIPTS: receiptRows(leases, today) }
}
