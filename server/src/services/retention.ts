import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { tenantFileSchema } from '../domain/contract.js'
import { readTenant } from './contract.js'

/**
 * Durées de conservation (RGPD) après la fin de la location :
 * - justificatifs du dossier du locataire et de son garant : effacés 3 ans après la fin du dernier bail
 *   (prescription des actions nées du bail, loi du 6 juillet 1989, art. 7-1) ;
 * - photo prise à la signature : effacée 5 ans après la fin du bail (prescription de droit commun, Code civil,
 *   art. 2224). Le certificat garde la date, l'heure et l'empreinte de la photo.
 * Durées à vérifier avec le référentiel « gestion locative » de la CNIL.
 */
export const DOSSIER_YEARS = 3
export const PHOTO_YEARS = 5

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
    const ids = [...(f.documents ?? []), ...(f.guarantor?.documents ?? [])].map((d) => d.fileId).filter((x): x is string => Boolean(x))
    if (!ids.length) continue
    const clear = (docs: typeof f.documents) => (docs ?? []).map((d) => ({ ...d, fileId: null, label: 'Effacé 3 ans après la fin du bail' }))
    const next = tenantFileSchema.parse({ ...f, documents: clear(f.documents), ...(f.guarantor ? { guarantor: { ...f.guarantor, documents: clear(f.guarantor.documents) } } : {}) })
    await prisma.fileBlob.deleteMany({ where: { id: { in: ids }, userId: t.userId } })
    await prisma.tenant.update({ where: { id }, data: { data: next as unknown as Prisma.InputJsonObject } })
    tenants += 1
  }
  const photos = await prisma.signer.updateMany({
    where: { photo: { not: null }, request: { lease: { status: 'ENDED', endDate: { lt: yearsAgo(PHOTO_YEARS, now) } } } },
    data: { photo: null },
  })
  return { tenants, photos: photos.count }
}
