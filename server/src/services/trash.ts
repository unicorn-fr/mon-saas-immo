import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'

/**
 * Corbeille : avant d'être supprimé, un élément est copié tel quel (fichier compris) pendant 30 jours.
 * La restauration le recrée à l'identique ; si son logement ou son bail a disparu entre-temps, le lien est retiré
 * (ou la restauration est refusée quand le lien est indispensable).
 */

export type TrashKind = 'EXPENSE' | 'DOCUMENT' | 'TENANT' | 'INTERVENTION' | 'CONTACT' | 'LEASE'
export const TRASH_DAYS = 30

/** Les fichiers (octets) sont gardés en base64 dans la copie. */
function encode(row: Record<string, unknown>): Prisma.InputJsonObject {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Uint8Array) out[k] = { __bytes: Buffer.from(v).toString('base64') }
    else if (v instanceof Date) out[k] = v.toISOString()
    else out[k] = v
  }
  return out as Prisma.InputJsonObject
}

function decode(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (v && typeof v === 'object' && '__bytes' in (v as object)) out[k] = Buffer.from(String((v as { __bytes: string }).__bytes), 'base64')
    else out[k] = v
  }
  return out
}

export async function toTrash(userId: string, kind: TrashKind, label: string, row: Record<string, unknown>) {
  await prisma.trashItem.create({ data: { userId, kind, label, payload: encode(row) } })
}

const exists = async (model: 'property' | 'lease' | 'tenant' | 'contact', id: unknown, userId: string) =>
  typeof id === 'string' && Boolean(await (prisma[model] as unknown as { findFirst: (a: unknown) => Promise<unknown> }).findFirst({ where: { id, userId } }))

export async function restoreFromTrash(userId: string, id: string): Promise<{ kind: TrashKind; id: string }> {
  const item = await prisma.trashItem.findFirst({ where: { id, userId } })
  if (!item) throw new HttpError(404, 'Élément introuvable dans la corbeille.')
  const row = decode(item.payload as Record<string, unknown>)
  const kind = item.kind as TrashKind
  if ('propertyId' in row && row.propertyId && !(await exists('property', row.propertyId, userId))) {
    if (kind === 'INTERVENTION' || kind === 'LEASE') throw new HttpError(409, 'Le logement de cet élément a été supprimé : il ne peut pas être restauré.')
    row.propertyId = null
  }
  if ('leaseId' in row && row.leaseId && !(await exists('lease', row.leaseId, userId))) row.leaseId = null
  if ('tenantId' in row && row.tenantId && !(await exists('tenant', row.tenantId, userId))) row.tenantId = null
  if ('contactId' in row && row.contactId && !(await exists('contact', row.contactId, userId))) row.contactId = null
  if (kind === 'LEASE' && Array.isArray(row.tenantIds)) {
    const kept = []
    for (const t of row.tenantIds) if (await exists('tenant', t, userId)) kept.push(t)
    row.tenantIds = kept
  }
  const model = { EXPENSE: prisma.expense, DOCUMENT: prisma.document, TENANT: prisma.tenant, INTERVENTION: prisma.intervention, CONTACT: prisma.contact, LEASE: prisma.lease }[kind] as unknown as { create: (a: unknown) => Promise<{ id: string }> }
  const created = await model.create({ data: row })
  await prisma.trashItem.delete({ where: { id: item.id } })
  return { kind, id: created.id }
}

/** Corbeille vidée des éléments de plus de 30 jours (tâche quotidienne). */
export async function purgeTrash(): Promise<number> {
  const r = await prisma.trashItem.deleteMany({ where: { deletedAt: { lt: new Date(Date.now() - TRASH_DAYS * 86_400_000) } } })
  return r.count
}
