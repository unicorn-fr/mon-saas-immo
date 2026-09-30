import type { Lease, Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { addMonths } from '../domain/lease.js'
import { landlordNoticeMonthsFor } from '../domain/rules.js'
import { leaseKindOf, readTerms } from './contract.js'

const DAY = 86_400_000

function todayUtc(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
}

/**
 * Calcule les échéances des 12 prochains mois d'un bail (et la prochaine fin de bail).
 * Idempotent : les rappels existants ne sont pas recréés (clé unique bail + type + date).
 */
export function computeReminders(lease: Pick<Lease, 'id' | 'userId' | 'type' | 'status' | 'startDate' | 'durationMonths' | 'paymentDay' | 'data'>): Prisma.ReminderCreateManyInput[] {
  // Bail en préparation ou terminé : aucune échéance.
  if (lease.status === 'DRAFT' || lease.status === 'ENDED') return []
  const today = todayUtc()
  const horizon = addMonths(today, 12)
  const start = lease.startDate
  const out: Prisma.ReminderCreateManyInput[] = []
  const add = (type: Prisma.ReminderCreateManyInput['type'], dueDate: Date) => out.push({ userId: lease.userId, leaseId: lease.id, type, dueDate })

  // État des lieux d'entrée : le jour de l'entrée (bail créé dans Bailio uniquement).
  if (lease.status !== 'IMPORTED' && start.getTime() >= today.getTime() - 7 * DAY) add('INVENTORY_ENTRY', start)

  // Quittance de chaque mois, à la date de paiement (jamais avant l'entrée du locataire).
  const firstMonth = start > today ? start : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  for (let i = 0; i < 12; i++) {
    const m = addMonths(new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth(), 1)), i)
    let due = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), lease.paymentDay))
    if (due < start) due = start
    if (due > horizon) break
    add('RENT_RECEIPT', due)
  }

  // Assurance : attestation à l'entrée, puis chaque année à la date anniversaire.
  if (start >= today) add('INSURANCE', start)
  const kind = leaseKindOf(lease)
  const terms = readTerms(lease)
  // Révision du loyer et attestation d'assurance : à chaque date anniversaire (pas de révision en bail mobilité).
  for (let k = 1; k < 100; k++) {
    const anniversary = addMonths(start, 12 * k)
    if (anniversary < today) continue
    if (anniversary > horizon) break
    if (kind !== 'MOBILITE' && terms.revision?.enabled !== false) add('RENT_REVISION', anniversary)
    add('INSURANCE', anniversary)
  }

  // Régularisation des charges payées par provisions : chaque année en janvier.
  if ((terms.chargesMode ?? 'PROVISION') === 'PROVISION' && lease.durationMonths >= 12) {
    const jan = new Date(Date.UTC(today.getUTCFullYear() + (today.getUTCMonth() === 0 ? 0 : 1), 0, 15))
    if (jan > start) add('CHARGES_REGULARIZATION', jan)
  }

  // Fin de bail : rappel un mois avant la date limite du congé donné par le bailleur.
  const months = lease.durationMonths
  const notice = landlordNoticeMonthsFor(kind) ?? 0
  for (let k = 1; k < 50; k++) {
    const end = addMonths(start, months * k)
    const due = addMonths(end, -(notice + 1))
    if (due < today) continue
    add('LEASE_END', due)
    break
  }
  return out
}

export async function ensureReminders(lease: Parameters<typeof computeReminders>[0]): Promise<void> {
  const rows = computeReminders(lease)
  if (rows.length) await prisma.reminder.createMany({ data: rows, skipDuplicates: true })
}
