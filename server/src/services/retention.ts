import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { DOSSIER_YEARS, minimizeTenantFile, NO_LEASE_MONTHS, PHOTO_YEARS, staleWithoutLease, yearsAgo } from '../domain/retention.js'
import { readTenant } from './contract.js'

/**
 * Durées de conservation après la fin de la location, alignées sur le référentiel « gestion locative » de la CNIL
 * (délibération n° 2021-057 du 6 mai 2021, § 53) pour un bailleur qui gère lui-même : données du locataire en base
 * active jusqu'à la clôture de ses comptes, puis au plus 3 ans (prescription des actions nées du bail, loi du
 * 6 juillet 1989, art. 7-1). Au-delà :
 * - justificatifs du dossier du locataire et de son garant : effacés ;
 * - informations devenues inutiles (revenus, employeur, situation, naissance, téléphone, adresse d'avant, lien
 *   DossierFacile, garant hors identité) : effacées ; restent le nom et l'email, repris dans les quittances et le bail ;
 * - photo prise à la signature : effacée (le certificat garde la date, l'heure et l'empreinte).
 * La clôture des comptes est la remise des clés (date de fin du bail).
 */
export async function purgeAfterLease(now = new Date()): Promise<{ tenants: number; photos: number }> {
  let tenants = 0
  const ended = await prisma.lease.findMany({ where: { status: 'ENDED' }, select: { tenantIds: true, endDate: true } })
  const lastEnd = new Map<string, Date>()
  for (const l of ended) for (const id of l.tenantIds) if (!lastEnd.has(id) || l.endDate > lastEnd.get(id)!) lastEnd.set(id, l.endDate)
  const limit = yearsAgo(DOSSIER_YEARS, now)
  for (const [id, end] of lastEnd) {
    if (end > limit) continue
    // Encore locataire ailleurs (bail en cours ou en préparation) : on garde.
    if (await prisma.lease.count({ where: { tenantIds: { has: id }, status: { not: 'ENDED' } } })) continue
    const t = await prisma.tenant.findUnique({ where: { id } })
    if (!t) continue
    const f = readTenant(t)
    if (f.purgedAt) continue
    const { file: next, fileIds: ids } = minimizeTenantFile(f, 'Effacé 3 ans après la fin du bail')
    if (ids.length) await prisma.fileBlob.deleteMany({ where: { id: { in: ids }, userId: t.userId } })
    await prisma.tenant.update({ where: { id }, data: { data: { ...next, purgedAt: now.toISOString() } as unknown as Prisma.InputJsonObject } })
    tenants += 1
  }
  const photos = await prisma.signer.updateMany({
    where: { photo: { not: null }, request: { lease: { status: 'ENDED', endDate: { lt: yearsAgo(PHOTO_YEARS, now) } } } },
    data: { photo: null },
  })
  return { tenants, photos: photos.count }
}

/**
 * Dossier d'un locataire qui n'a jamais eu de bail (candidat retenu puis abandonné, fiche jamais utilisée) :
 * réduit au nom et à l'email 3 mois après sa dernière modification (référentiel CNIL, candidats non retenus).
 */
export async function purgeWithoutLease(now = new Date()): Promise<number> {
  const withLease = new Set((await prisma.lease.findMany({ select: { tenantIds: true } })).flatMap((l) => l.tenantIds))
  const candidates = await prisma.tenant.findMany({ where: { updatedAt: { lt: new Date(now.getTime() - 80 * 86_400_000) } } })
  let count = 0
  for (const t of candidates) {
    const f = readTenant(t)
    if (!staleWithoutLease({ updatedAt: t.updatedAt, hasLease: withLease.has(t.id), purged: Boolean(f.purgedAt) }, now)) continue
    const { file, fileIds } = minimizeTenantFile(f, `Effacé ${NO_LEASE_MONTHS} mois sans bail`)
    if (fileIds.length) await prisma.fileBlob.deleteMany({ where: { id: { in: fileIds }, userId: t.userId } })
    await prisma.tenant.update({ where: { id: t.id }, data: { data: { ...file, purgedAt: now.toISOString() } as unknown as Prisma.InputJsonObject } })
    count += 1
  }
  return count
}
