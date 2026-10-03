import type { Lease, Prisma, User } from '@prisma/client'
import { prisma } from '../db.js'
import { landlordProfileSchema, propertyFileSchema } from '../domain/contract.js'
import { isLegacy, legacyToContract, readProfile, readProperty } from './contract.js'

/**
 * Baux créés par le tunnel public (ou avant les fiches) : leurs réponses sont reprises dans les fiches
 * du compte (profil, logement, locataires). Le bail signé garde sa copie figée : son PDF ne change pas.
 * Opération idempotente, faite à la première ouverture de l'espace.
 */
export async function upgradeLegacyLeases(user: User): Promise<void> {
  const leases = await prisma.lease.findMany({ where: { userId: user.id, tenantIds: { isEmpty: true } }, include: { property: true } })
  for (const lease of leases) {
    if (!isLegacy(lease.data)) continue
    await upgradeOne(user, lease)
  }
}

async function upgradeOne(user: User, lease: Lease & { property: import('@prisma/client').Property }) {
  const contract = legacyToContract(lease.data as never)
  await prisma.$transaction(async (tx) => {
    // Profil : complété seulement s'il est vide.
    const fresh = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
    const profile = readProfile(fresh)
    if (!profile.lastName && !profile.address) {
      await tx.user.update({ where: { id: user.id }, data: { profile: landlordProfileSchema.parse({ ...contract.landlord, ...profile }) } })
    }
    // Logement : la fiche reprend adresse, surface, pièces, DPE, meublé.
    const current = readProperty(lease.property)
    const t = contract.terms
    const rent = { rentCents: t.rentCents ?? undefined, chargesCents: t.chargesCents ?? undefined, chargesMode: t.chargesMode ?? undefined, depositCents: t.depositCents ?? undefined, paymentDay: t.paymentDay ?? undefined }
    const file = propertyFileSchema.parse({ ...contract.property, rent, ...Object.fromEntries(Object.entries(current).filter(([, v]) => v !== undefined && v !== null)) })
    await tx.property.update({ where: { id: lease.property.id }, data: { data: file } })
    // Locataires : une fiche chacun, le garant rattaché au premier.
    const ids: string[] = []
    for (const [i, t] of contract.tenants.entries()) {
      const g = i === 0 ? contract.guarantors[0] : undefined
      const row = await tx.tenant.create({
        data: {
          userId: user.id,
          propertyId: lease.property.id,
          data: { civility: t.civility ?? undefined, firstNames: t.firstNames, lastName: t.lastName, email: t.email ?? undefined, living: contract.tenants.length > 1 ? 'COLOCATION' : 'ALONE', ...(g ? { guarantee: 'CAUTION', guarantor: g } : {}) },
        },
      })
      ids.push(row.id)
    }
    await tx.lease.update({
      where: { id: lease.id },
      data: { tenantIds: ids, data: { terms: contract.terms, snapshot: contract, legacy: lease.data } as unknown as Prisma.InputJsonObject },
    })
  })
}
