import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { tenantFileSchema } from '../domain/contract.js'
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
export const DOSSIER_YEARS = 3
export const PHOTO_YEARS = 3

const yearsAgo = (n: number, now: Date) => new Date(Date.UTC(now.getUTCFullYear() - n, now.getUTCMonth(), now.getUTCDate()))

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
    const ids = [...(f.documents ?? []), ...(f.guarantor?.documents ?? [])].map((d) => d.fileId).filter((x): x is string => Boolean(x))
    const clear = (docs: typeof f.documents) => (docs ?? []).map((d) => ({ ...d, fileId: null, label: 'Effacé 3 ans après la fin du bail' }))
    const g = f.guarantor
    const next = tenantFileSchema.parse({
      ...f,
      birthDate: null,
      birthPlace: null,
      phone: null,
      currentAddress: null,
      situation: null,
      employer: null,
      occupation: null,
      monthlyIncomeCents: null,
      visaleNumber: null,
      dossierFacileUrl: null,
      review: [],
      documents: clear(f.documents),
      ...(g ? { guarantor: { civility: g.civility, firstNames: g.firstNames, lastName: g.lastName, documents: clear(g.documents) } } : {}),
    })
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
