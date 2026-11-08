/**
 * Espace d'exemple de la page /demo : tout est fictif et reste dans le navigateur (aucune requête, rien d'enregistré).
 * Les noms sont inventés et ne désignent personne. Calculs purs, sans date cachée : la date du jour est passée en argument.
 */

export const OWNER = { name: 'Camille' }

export type DemoHome = { id: 'lyon' | 'nantes'; name: string; city: string; tenant: string; email: string; rentCents: number }

export const HOMES: DemoHome[] = [
  { id: 'lyon', name: 'T2 rue des Exemples', city: 'Lyon', tenant: 'Alix Démonstration', email: 'alix.demonstration@exemple.test', rentCents: 80000 },
  { id: 'nantes', name: 'Studio quai d’Essai', city: 'Nantes', tenant: 'Marc Exemplaire', email: 'marc.exemplaire@exemple.test', rentCents: 42000 },
]

export const eurosFromCents = (cents: number) => `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`.replace(/ /g, ' ')

export const euros = (n: number) => eurosFromCents(Math.round(n * 100))

export const frDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Les 6 derniers mois (le plus ancien d'abord), le mois en cours compris. */
export function lastMonths(now: Date, count = 6): Array<{ key: string; label: string }> {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) }
  })
}

export type RentCell = 'PAID' | 'UNPAID'

/** Loyers du tableau : tout est payé sauf le dernier mois de Lyon (le loyer qui n'est pas encore arrivé). */
export function rentTable(now: Date, lyonReceived: boolean): Array<{ home: DemoHome; cells: Array<{ key: string; label: string; state: RentCell }> }> {
  const months = lastMonths(now)
  return HOMES.map((home) => ({
    home,
    cells: months.map((m, i) => ({ ...m, state: home.id === 'lyon' && i === months.length - 1 && !lyonReceived ? 'UNPAID' : 'PAID' })),
  }))
}

/** Relances automatiques proposées (réglables de 1 à 60 jours après l'échéance). */
export const DUNNING = [
  { day: 3, name: 'Relance amiable', text: 'Un message poli pour rappeler le loyer.' },
  { day: 8, name: 'Second rappel', text: 'Le rappel, avec toute la somme due.' },
  { day: 15, name: 'Mise en demeure', text: 'Le courrier qui demande de payer sous 8 jours.' },
] as const

/** Révision du loyer : indices d'exemple (3e trimestre), le calcul est celui de l'IRL. */
export const IRL = { from: 145.78, to: 148.07 }

export function revision(rentEuros: number) {
  const next = Math.round((rentEuros * IRL.to * 100) / IRL.from) / 100
  const percent = Math.round((IRL.to / IRL.from - 1) * 10000) / 100
  return { next, percent }
}

export type LeaseKind = 'VIDE' | 'MEUBLE'

export const LEASE_RULES: Record<LeaseKind, { years: number; depositMonths: number; noticeMonths: number; label: string }> = {
  VIDE: { years: 3, depositMonths: 1, noticeMonths: 6, label: 'vide' },
  MEUBLE: { years: 1, depositMonths: 2, noticeMonths: 3, label: 'meublé' },
}

/** Ce que la loi du 6 juillet 1989 fixe pour ce bail. */
export function leaseSummary(kind: LeaseKind, rentEuros: number, startIso: string) {
  const r = LEASE_RULES[kind]
  const [y, m, d] = startIso.split('-').map(Number)
  const end = new Date(Date.UTC(y + r.years, m - 1, d - 1))
  return { ...r, depositMax: rentEuros * r.depositMonths, end: end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) }
}

/** Année d'exemple : loyers bruts, charges déductibles au réel. */
export const TAX = {
  year: 2026,
  rents: HOMES.map((h) => ({ home: h, yearCents: h.rentCents * 12 })),
  charges: [
    { label: 'Taxe foncière', cents: 145000 },
    { label: 'Assurance du propriétaire', cents: 38000 },
    { label: 'Travaux d’entretien', cents: 210000 },
    { label: 'Intérêts d’emprunt', cents: 320000 },
  ],
}

export function taxFigures() {
  const gross = TAX.rents.reduce((a, r) => a + r.yearCents, 0)
  const allowance = Math.round(gross * 0.3)
  const micro = gross - allowance
  const charges = TAX.charges.reduce((a, c) => a + c.cents, 0)
  const real = gross - charges
  return { gross, allowance, micro, charges, real, best: real < micro ? ('REEL' as const) : ('MICRO' as const) }
}
