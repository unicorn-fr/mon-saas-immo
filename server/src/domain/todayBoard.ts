/**
 * Chiffres du mois et agenda d'« Aujourd'hui » (route `GET /today`). Fonctions pures : le retard vient de
 * `rentStatus` (`unpaidPeriods`), jamais d'un nouveau calcul.
 */

export interface TileLease {
  status: string
  /** Loyer et charges attendus ce mois-ci (centimes), selon l'historique des loyers. */
  dueCents: number
  /** Reçu ce mois-ci pour l'échéance du mois (centimes). */
  paidCents: number
  /** Résultat de `rentStatus` : clé et dette totale. */
  statusKey: string
  unpaidCents: number
  depositCents: number
  depositReceived: boolean
  /** Bail en cours (entré dans le logement). */
  running: boolean
}

export interface MonthTiles {
  expectedCents: number
  receivedCents: number
  lateCents: number
  lateCount: number
  /** Dépôts de garantie à noter reçus sur les baux signés. */
  depositCount: number
  depositCents: number
}

export function monthTiles(leases: TileLease[]): MonthTiles {
  const running = leases.filter((l) => l.running)
  const late = running.filter((l) => l.statusKey === 'LATE')
  const deposits = leases.filter((l) => l.status === 'ACTIVE' && l.depositCents > 0 && !l.depositReceived)
  return {
    expectedCents: running.reduce((a, l) => a + l.dueCents, 0),
    receivedCents: running.reduce((a, l) => a + Math.min(l.paidCents, l.dueCents), 0),
    lateCents: late.reduce((a, l) => a + l.unpaidCents, 0),
    lateCount: late.length,
    depositCount: deposits.length,
    depositCents: deposits.reduce((a, l) => a + l.depositCents, 0),
  }
}

export interface AgendaItem {
  /** Jour (AAAA-MM-JJ). */
  iso: string
  label: string
  /** Rendez-vous saisi par le propriétaire (intervention prévue) : modifiable et supprimable depuis l'agenda. */
  interventionId?: string
  propertyId?: string
  title?: string
  start?: string | null
  end?: string | null
}

/** Agenda : à partir d'aujourd'hui, du plus proche au plus lointain, sans doublon. */
export function agenda(items: AgendaItem[], today: string, limit = 12): AgendaItem[] {
  const seen = new Set<string>()
  return items
    .filter((i) => i.iso >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .filter((i) => {
      const k = `${i.iso}|${i.label}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, limit)
}
