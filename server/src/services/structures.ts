import type { Structure, User } from '@prisma/client'
import { accessScope, prisma } from '../db.js'
import { structureFromProfile } from '../domain/structure.js'
import { HttpError } from '../lib/http.js'
import { readProfile } from './contract.js'

/**
 * Structures du compte, la première créée à partir du profil du bailleur si besoin ; les logements sans structure
 * (créés avant les structures, par le formulaire du début ou par l'import) rejoignent la plus ancienne.
 */
export async function ensureStructures(user: Pick<User, 'id' | 'profile'>): Promise<Structure[]> {
  // Espace partagé : l'invité voit les structures de ses logements, il n'en crée pas.
  if (accessScope.getStore()) return prisma.structure.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
  return prisma.$transaction(async (tx) => {
    // Un seul passage à la fois par compte : deux pages ouvertes ensemble ne créent pas deux premières structures.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`
    let rows = await tx.structure.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
    if (!rows.length) rows = [await tx.structure.create({ data: { userId: user.id, data: structureFromProfile(readProfile(user)) } })]
    await tx.property.updateMany({ where: { userId: user.id, structureId: null }, data: { structureId: rows[0].id } })
    return rows
  })
}

export async function structureOwned(userId: string, id: string): Promise<Structure> {
  const s = await prisma.structure.findFirst({ where: { id, userId } })
  if (!s) throw new HttpError(404, 'Structure introuvable.')
  return s
}
