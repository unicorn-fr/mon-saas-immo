import type { Lease, Property } from '@prisma/client'
import type { AdSettings } from '../domain/ad.js'
import { readProperty, readTerms } from './contract.js'

/**
 * Réglages de l'annonce d'un logement : ceux déjà enregistrés, sinon repris du dernier bail.
 * Si le locataire actuel a donné congé, le logement est disponible à la fin de son préavis.
 */
export function adSettings(p: Property, leases: Lease[]): AdSettings {
  const file = readProperty(p)
  const sorted = [...leases].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  const leaving = sorted.find((l) => l.status === 'ACTIVE' && (l.data as { tenantNotice?: unknown }).tenantNotice)
  const availableFrom = (leaving?.data as { tenantNotice?: { endDate?: string } } | undefined)?.tenantNotice?.endDate ?? null
  // Loyer : celui de la fiche du logement, saisi une seule fois.
  const r = file.rent ?? {}
  const fromFile: AdSettings = { rentCents: r.rentCents ?? null, chargesCents: r.chargesCents ?? null, chargesMode: r.chargesMode === 'FORFAIT' ? 'FORFAIT' : 'PROVISION', depositCents: r.depositCents ?? null }
  if (file.ad) return { ...file.ad, rentCents: file.ad.rentCents ?? fromFile.rentCents, chargesCents: file.ad.chargesCents ?? fromFile.chargesCents, depositCents: file.ad.depositCents ?? fromFile.depositCents, chargesMode: file.ad.chargesMode ?? fromFile.chargesMode, availableFrom: file.ad.availableFrom ?? availableFrom }
  if (r.rentCents != null) return { ...fromFile, availableFrom }
  const last = sorted.find((l) => l.status !== 'DRAFT') ?? sorted[0]
  if (!last) return { chargesMode: 'PROVISION', availableFrom }
  const t = readTerms(last)
  return { rentCents: last.rentCents || t.rentCents || null, chargesCents: last.chargesCents ?? t.chargesCents ?? null, chargesMode: t.chargesMode === 'FORFAIT' ? 'FORFAIT' : 'PROVISION', depositCents: last.depositCents ?? t.depositCents ?? null, availableFrom }
}
