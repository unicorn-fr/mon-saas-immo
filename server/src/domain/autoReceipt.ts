/**
 * Quittances par email. Deux réglages distincts :
 * - `receiptAuto` (actif par défaut) : la quittance part dès que le loyer est enregistré (à la main ou depuis le relevé) ;
 * - `receiptAssume` (coupé par défaut, choix exprès du propriétaire) : 7 jours après l'échéance, sans nouvelle du
 *   propriétaire, le loyer est noté reçu et la quittance part. Le propriétaire est prévenu 3 jours avant et peut dire
 *   « le loyer n'est pas arrivé ». Une quittance prouve le paiement (loi du 6 juillet 1989, art. 21) : la supposer
 *   reçue sans paiement constaté peut se retourner contre le bailleur, d'où l'accord exprès.
 */
export const AUTO_RECEIPT_DELAY_DAYS = 7
export const AUTO_RECEIPT_WARN_DAYS = 3

/** Quittance envoyée dès que le loyer est enregistré : active sauf si le propriétaire l'a coupée sur la page du bail. */
export const receiptAutoOn = (data: unknown) => (data as { receiptAuto?: boolean } | null)?.receiptAuto !== false

/** Loyer supposé reçu 7 jours après l'échéance : seulement si le propriétaire l'a choisi expressément. */
export const assumePaymentOn = (data: unknown) => receiptAutoOn(data) && (data as { receiptAssume?: boolean } | null)?.receiptAssume === true

const DAY = 86_400_000
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10)

/** Échéance d'un mois (AAAA-MM) au jour de paiement du bail (1 à 28). */
export const dueDateOf = (period: string, paymentDay: number) => `${period}-${String(Math.min(Math.max(paymentDay, 1), 28)).padStart(2, '0')}`
export const sendDateOf = (period: string, paymentDay: number) => isoDay(Date.parse(`${dueDateOf(period, paymentDay)}T00:00:00Z`) + AUTO_RECEIPT_DELAY_DAYS * DAY)
export const warnDateOf = (period: string, paymentDay: number) => isoDay(Date.parse(`${sendDateOf(period, paymentDay)}T00:00:00Z`) - AUTO_RECEIPT_WARN_DAYS * DAY)

export const prevPeriod = (p: string) => {
  const [y, m] = p.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

export interface AutoReceiptState {
  period: string
  paymentDay: number
  /** AAAA-MM-JJ */
  today: string
  /** AAAA-MM-JJ : début et, le cas échéant, fin du bail. */
  startDate: string
  endDate?: string | null
  paid: boolean
  held: boolean
  warned: boolean
}

/** Ce qu'il faut faire aujourd'hui pour ce mois : prévenir le propriétaire, envoyer la quittance, ou rien. */
export function autoReceiptStep(s: AutoReceiptState): 'WARN' | 'SEND' | null {
  if (s.paid || s.held) return null
  const due = dueDateOf(s.period, s.paymentDay)
  // Échéance avant l'entrée dans les lieux (premier mois incomplet, au prorata) ou après la fin du bail :
  // le propriétaire enregistre ce loyer lui-même.
  if (due < s.startDate.slice(0, 10)) return null
  if (s.endDate && s.period > s.endDate.slice(0, 7)) return null
  const send = sendDateOf(s.period, s.paymentDay)
  // Au-delà de 10 jours de retard (serveur arrêté…), on ne rattrape pas : le propriétaire décide.
  if (s.today >= send && s.today <= isoDay(Date.parse(`${send}T00:00:00Z`) + 10 * DAY)) return 'SEND'
  if (!s.warned && s.today >= warnDateOf(s.period, s.paymentDay) && s.today < send) return 'WARN'
  return null
}

/** Mois à examiner aujourd'hui : le mois en cours et le précédent (échéance en fin de mois). */
export const periodsToCheck = (today: string) => [prevPeriod(today.slice(0, 7)), today.slice(0, 7)]

const nextPeriodOf = (p: string) => {
  const [y, m] = p.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** Prochaine quittance automatique à afficher au propriétaire (mois non payé, envoi à venir ou en cours). */
export function upcomingAutoReceipt(o: { today: string; paymentDay: number; startDate: string; paid: Set<string>; held: Record<string, string> }): { period: string; sendOn: string; held: boolean } | null {
  const [prev, cur] = periodsToCheck(o.today)
  for (const period of [prev, cur, nextPeriodOf(cur)]) {
    if (o.paid.has(period) || dueDateOf(period, o.paymentDay) < o.startDate.slice(0, 10)) continue
    const sendOn = sendDateOf(period, o.paymentDay)
    const last = new Date(Date.parse(`${sendOn}T00:00:00Z`) + 10 * DAY).toISOString().slice(0, 10)
    if (o.today > last) continue
    return { period, sendOn, held: Boolean(o.held[period]) }
  }
  return null
}
