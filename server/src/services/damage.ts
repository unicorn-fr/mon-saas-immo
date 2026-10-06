import type { Lease } from '@prisma/client'
import { prisma } from '../db.js'
import { inventoryDataSchema } from '../domain/inventory.js'
import { damageDecisionSchema, damageLines, type DamageDecision } from '../domain/damage.js'
import { compareWithEntry, itemKey } from '../domain/inventoryCompare.js'

/** Décisions enregistrées avec le bail (`lease.data.damageReview`). */
export function savedDecisions(lease: Pick<Lease, 'data'>): DamageDecision[] {
  const raw = ((lease.data ?? {}) as { damageReview?: { decisions?: unknown } }).damageReview?.decisions
  const parsed = damageDecisionSchema.array().safeParse(raw ?? [])
  return parsed.success ? parsed.data : []
}

/** Récapitulatif des dégradations d'un bail : état des lieux de sortie signé comparé à l'entrée. */
export async function damageReviewFor(lease: Pick<Lease, 'id' | 'data'>) {
  const exitInv = await prisma.inventory.findFirst({ where: { leaseId: lease.id, kind: 'EXIT', status: 'SIGNED' }, orderBy: { createdAt: 'desc' } })
  if (!exitInv) return null
  const entryInv = await prisma.inventory.findFirst({ where: { leaseId: lease.id, kind: 'ENTRY' }, orderBy: [{ status: 'desc' }, { createdAt: 'desc' }] })
  const exit = inventoryDataSchema.parse(exitInv.data)
  const entry = entryInv ? inventoryDataSchema.parse(entryInv.data) : null
  const lines = damageLines(entry, exit, savedDecisions(lease))
  const cmp = compareWithEntry(entry, exit)
  // Photos de l'entrée, pour montrer l'état d'origine à côté de celui de sortie.
  const entryPhotos = Object.fromEntries(lines.map((l) => [l.key, cmp[itemKey(l.room, l.label)]?.entryPhotoIds ?? []]))
  return { exitInventoryId: exitInv.id, exitDate: exitInv.date, hasEntry: Boolean(entry), lines, entryPhotos }
}
