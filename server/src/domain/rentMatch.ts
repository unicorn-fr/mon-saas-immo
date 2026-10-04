import type { BankTransaction } from './bankStatement.js'

/**
 * Rapprochement d'un relevé bancaire avec les loyers attendus : un crédit du bon montant, autour de l'échéance,
 * de préférence avec le nom du locataire dans le libellé. Bailio propose, le propriétaire valide.
 */

export interface ExpectedRent {
  leaseId: string
  /** Libellé lisible : « Studio Sète, Lucas Garnier ». */
  label: string
  /** Noms à reconnaître dans le libellé du virement (locataires, garant, CAF…). */
  names: string[]
  period: string
  /** AAAA-MM-JJ */
  dueDate: string
  dueCents: number
}

export type MatchLevel = 'SURE' | 'LIKELY' | 'CHECK'

export interface RentMatch {
  leaseId: string
  label: string
  period: string
  dueCents: number
  amountCents: number
  /** AAAA-MM-JJ, date de l'opération : date de réception du loyer. */
  receivedAt: string
  bankLabel: string
  level: MatchLevel
  /** Pourquoi Bailio propose ce rapprochement, en une phrase. */
  reason: string
  partial: boolean
}

const DAY = 86_400_000
const days = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY)
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')

/** Le libellé contient-il un des noms (mot entier d'au moins 3 lettres) ? */
export function nameInLabel(label: string, names: string[]): boolean {
  const l = ` ${norm(label)} `
  return names.some((n) =>
    norm(n)
      .split(' ')
      .filter((w) => w.length >= 3)
      .some((w) => l.includes(` ${w} `)),
  )
}

/** Fenêtre de réception admise autour de l'échéance : 20 jours avant, 45 jours après. */
export const BEFORE_DAYS = 20
export const AFTER_DAYS = 45

export function matchRents(transactions: BankTransaction[], expected: ExpectedRent[]): RentMatch[] {
  type Cand = { tx: number; ex: number; score: number; level: MatchLevel; reason: string; partial: boolean; gap: number }
  const cands: Cand[] = []
  transactions.forEach((t, ti) => {
    if (t.amountCents <= 0) return
    expected.forEach((e, ei) => {
      const gap = days(t.date, e.dueDate)
      if (gap < -BEFORE_DAYS || gap > AFTER_DAYS) return
      const named = nameInLabel(t.label, e.names)
      const exact = Math.abs(t.amountCents - e.dueCents) <= 100
      const partial = !exact && t.amountCents < e.dueCents && named
      if (!exact && !partial) return
      const level: MatchLevel = exact && named ? 'SURE' : exact ? 'LIKELY' : 'CHECK'
      const reason = exact && named ? 'Montant attendu et nom du locataire dans le libellé.' : exact ? 'Montant attendu, autour de l’échéance.' : 'Nom du locataire, mais montant inférieur au loyer : paiement partiel ?'
      cands.push({ tx: ti, ex: ei, score: (exact ? 2 : 0) + (named ? 2 : 0) - Math.abs(gap) / 100, level, reason, partial, gap })
    })
  })
  cands.sort((a, b) => b.score - a.score)
  const usedTx = new Set<number>()
  const usedEx = new Set<number>()
  const out: RentMatch[] = []
  for (const c of cands) {
    if (usedTx.has(c.tx) || usedEx.has(c.ex)) continue
    const t = transactions[c.tx]
    const e = expected[c.ex]
    // Montant seul, sans nom : sûr uniquement s'il n'y a qu'un loyer de ce montant à cette période.
    const ambiguous = c.level === 'LIKELY' && cands.some((o) => o !== c && o.tx === c.tx && !usedEx.has(o.ex) && o.level === 'LIKELY' && expected[o.ex].leaseId !== e.leaseId)
    usedTx.add(c.tx)
    usedEx.add(c.ex)
    out.push({
      leaseId: e.leaseId,
      label: e.label,
      period: e.period,
      dueCents: e.dueCents,
      amountCents: Math.min(t.amountCents, c.partial ? t.amountCents : e.dueCents),
      receivedAt: t.date,
      bankLabel: t.label,
      level: ambiguous ? 'CHECK' : c.level,
      reason: ambiguous ? 'Montant attendu, mais plusieurs locataires paient ce montant : vérifiez.' : c.reason,
      partial: c.partial,
    })
  }
  return out.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
}
