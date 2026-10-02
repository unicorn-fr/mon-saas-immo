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
  if (file.ad) return { ...file.ad, availableFrom: file.ad.availableFrom ?? availableFrom }
  const last = sorted.find((l) => l.status !== 'DRAFT') ?? sorted[0]
  if (!last) return { chargesMode: 'PROVISION', availableFrom }
  const t = readTerms(last)
  return { rentCents: last.rentCents || t.rentCents || null, chargesCents: last.chargesCents ?? t.chargesCents ?? null, chargesMode: t.chargesMode === 'FORFAIT' ? 'FORFAIT' : 'PROVISION', depositCents: last.depositCents ?? t.depositCents ?? null, availableFrom }
}
