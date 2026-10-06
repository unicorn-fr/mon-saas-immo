/**
 * Tableau de bord de tous les logements : quelques chiffres (loyers par mois, ce qu'il reste après les crédits et les
 * dépenses, retards, logements loués) et les points à surveiller, du plus urgent au moins urgent. Tout est déduit de ce
 * que Bailio connaît déjà : baux, paiements, fiche du logement (DPE, diagnostics, emprunts, prix d'achat), dépenses.
 */

export interface PortfolioItem {
  id: string
  name: string
  structureName: string | null
  /** Bail en cours (signé, ou importé). */
  rented: boolean
  tenantName: string | null
  /** Loyer et charges du mois (bail en cours), ou du loyer prévu dans la fiche si le logement est libre. */
  rentCents: number
  chargesCents: number
  /** Mensualité et assurance des emprunts ce mois-ci. */
  loanCents: number
  /** Moyenne mensuelle des dépenses des 12 derniers mois (part non récupérable). */
  averageExpensesCents: number
  unpaidCents: number
  /** Fin du bail en cours (date d'échéance), AAAA-MM-JJ. */
  leaseEnd: string | null
  /** Logement libre depuis (fin du dernier bail), AAAA-MM-JJ. */
  vacantSince: string | null
  dpe: string | null
  expiredDiagnostics: number
  purchasePriceCents: number | null
}

export type AlertKind = 'UNPAID' | 'FORBIDDEN' | 'VACANT' | 'DIAGNOSTICS' | 'DPE_SOON' | 'LEASE_END'

export interface PortfolioAlert {
  kind: AlertKind
  propertyId: string
  title: string
  text: string
  /** 1 : à traiter maintenant ; 2 : bientôt ; 3 : à prévoir. */
  level: 1 | 2 | 3
}

export interface Portfolio {
  totals: {
    properties: number
    rented: number
    /** Loyers et charges attendus chaque mois (logements loués). */
    monthlyRentCents: number
    monthlyLoanCents: number
    monthlyExpensesCents: number
    /** Ce qu'il reste chaque mois, avant impôt : loyers − crédits − dépenses moyennes. */
    monthlyNetCents: number
    unpaidCents: number
    /** Loyers annuels hors charges ÷ prix d'achat, sur les logements loués dont le prix est connu (une décimale). */
    grossYield: number | null
  }
  alerts: PortfolioAlert[]
  rows: Array<PortfolioItem & { netCents: number; alertCount: number }>
}

const BAN: Record<string, string> = { G: '2025-01-01', F: '2028-01-01', E: '2034-01-01' }
const YEAR_LABEL: Record<string, string> = { '2025-01-01': '1er janvier 2025', '2028-01-01': '1er janvier 2028', '2034-01-01': '1er janvier 2034' }

const addMonths = (isoDay: string, n: number) => {
  const d = new Date(`${isoDay}T00:00:00Z`)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate())).toISOString().slice(0, 10)
}
const frDate = (isoDay: string) => isoDay.split('-').reverse().join('/')
const eur = (c: number) => `${(c / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

/** Points à surveiller d'un logement. */
export function alertsFor(p: PortfolioItem, today: string): PortfolioAlert[] {
  const out: PortfolioAlert[] = []
  const ban = p.dpe ? BAN[p.dpe] : undefined
  if (p.unpaidCents > 0) out.push({ kind: 'UNPAID', propertyId: p.id, level: 1, title: `${eur(p.unpaidCents)} de loyer en retard`, text: p.tenantName ? `Loyers attendus et non reçus de ${p.tenantName}.` : 'Loyers attendus et non reçus.' })
  if (ban && ban <= today) out.push({ kind: 'FORBIDDEN', propertyId: p.id, level: 1, title: `Classé ${p.dpe} : ne peut plus être loué`, text: `Depuis le ${YEAR_LABEL[ban]}, un logement ${p.dpe} n’est plus décent. Des travaux et un nouveau DPE sont nécessaires avant un nouveau bail.` })
  if (!p.rented && p.vacantSince) out.push({ kind: 'VACANT', propertyId: p.id, level: 2, title: `Libre depuis le ${frDate(p.vacantSince)}`, text: 'Pas de bail en cours : annonce et candidats sont prêts dans Bailio.' })
  if (p.expiredDiagnostics > 0) out.push({ kind: 'DIAGNOSTICS', propertyId: p.id, level: 2, title: `${p.expiredDiagnostics} diagnostic${p.expiredDiagnostics > 1 ? 's' : ''} à refaire`, text: 'Un diagnostic expiré bloque la signature du prochain bail.' })
  if (ban && ban > today && ban <= addMonths(today, 48)) out.push({ kind: 'DPE_SOON', propertyId: p.id, level: 3, title: `Classé ${p.dpe} : interdit à la location le ${YEAR_LABEL[ban]}`, text: 'Les travaux prennent du temps : MaPrimeRénov’ et l’éco-prêt peuvent les financer en partie.' })
  if (p.rented && p.leaseEnd && p.leaseEnd >= today && p.leaseEnd <= addMonths(today, 7)) out.push({ kind: 'LEASE_END', propertyId: p.id, level: p.leaseEnd <= addMonths(today, 6) ? 2 : 3, title: `Bail à échéance le ${frDate(p.leaseEnd)}`, text: 'Sans rien faire, il est reconduit. Pour donner congé, il faut s’y prendre à l’avance (6 mois en vide, 3 mois en meublé).' })
  return out
}

export function portfolio(items: PortfolioItem[], today: string): Portfolio {
  const rented = items.filter((p) => p.rented)
  const monthlyRent = rented.reduce((a, p) => a + p.rentCents + p.chargesCents, 0)
  const monthlyLoan = items.reduce((a, p) => a + p.loanCents, 0)
  const monthlyExpenses = items.reduce((a, p) => a + p.averageExpensesCents, 0)
  const priced = rented.filter((p) => p.purchasePriceCents)
  const price = priced.reduce((a, p) => a + (p.purchasePriceCents ?? 0), 0)
  const annualRent = priced.reduce((a, p) => a + p.rentCents * 12, 0)
  const alerts = items.flatMap((p) => alertsFor(p, today)).sort((a, b) => a.level - b.level)
  return {
    totals: {
      properties: items.length,
      rented: rented.length,
      monthlyRentCents: monthlyRent,
      monthlyLoanCents: monthlyLoan,
      monthlyExpensesCents: monthlyExpenses,
      monthlyNetCents: monthlyRent - monthlyLoan - monthlyExpenses,
      unpaidCents: items.reduce((a, p) => a + p.unpaidCents, 0),
      grossYield: price ? Math.round((annualRent / price) * 1000) / 10 : null,
    },
    alerts,
    rows: items
      .map((p) => ({ ...p, netCents: (p.rented ? p.rentCents + p.chargesCents : 0) - p.loanCents - p.averageExpensesCents, alertCount: alerts.filter((a) => a.propertyId === p.id).length }))
      .sort((a, b) => b.alertCount - a.alertCount || a.name.localeCompare(b.name, 'fr')),
  }
}
