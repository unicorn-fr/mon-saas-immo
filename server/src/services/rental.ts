import type { User } from '@prisma/client'
import { prisma } from '../db.js'
import { essential, leaseMissing, propertyLeaseMissing } from '../domain/checklist.js'
import { rentalSteps, type RentalStep } from '../domain/rental.js'
import { expiredDiagnostics, rentalForbidden } from '../domain/rules.js'
import { pendingReview, tenantLeaseMissing } from '../domain/tenantFile.js'
import { contractFor, readProperty, readTenant, tenantName } from './contract.js'

/**
 * Parcours de mise en location de chaque logement (domain/rental.ts), déduit des fiches, des baux,
 * des signatures, des états des lieux, des courriers et des loyers déjà enregistrés.
 */
export async function rentalJourneys(user: User, propertyIds?: string[]): Promise<Map<string, RentalStep[]>> {
  const where = { userId: user.id, ...(propertyIds ? { id: { in: propertyIds } } : {}) }
  const properties = await prisma.property.findMany({
    where,
    include: { leases: { include: { payments: { select: { id: true } }, inventories: { select: { kind: true, status: true } }, signatures: { select: { status: true } } }, orderBy: { startDate: 'desc' } }, _count: { select: { candidates: true } } },
  })
  const tenants = await prisma.tenant.findMany({ where: { userId: user.id } })
  const today = new Date().toISOString().slice(0, 10)
  const out = new Map<string, RentalStep[]>()

  for (const p of properties) {
    const file = readProperty(p)
    // Bail en cours ou en préparation : le plus récent qui n'est pas terminé.
    const lease = p.leases.find((l) => l.status !== 'ENDED') ?? null
    const endedTenants = new Set(p.leases.filter((l) => l.status === 'ENDED').flatMap((l) => l.tenantIds))
    const tenantRow = lease?.tenantIds[0] ? tenants.find((t) => t.id === lease.tenantIds[0]) : tenants.filter((t) => t.propertyId === p.id && !endedTenants.has(t.id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    const tf = tenantRow ? readTenant(tenantRow) : null
    let ready = false
    if (lease?.status === 'DRAFT') ready = essential(leaseMissing(await contractFor(user, { ...lease, property: p }))).length === 0
    const facts = (lease?.data ?? {}) as { checkedAt?: string; depositReceivedAt?: string }
    const esign = lease?.signatures.some((s) => s.status === 'COMPLETED') ? 'COMPLETED' : lease?.signatures.some((s) => s.status === 'PENDING') ? 'PENDING' : 'NONE'
    const entry = lease?.inventories.find((i) => i.kind === 'ENTRY')
    const insured = Boolean(
      lease?.tenantIds.some((id) => {
        const row = tenants.find((t) => t.id === id)
        const ins = row ? readTenant(row).insurance : null
        return Boolean(ins?.expiresAt || ins?.fileId)
      }),
    )
    // Bail importé ou commencé depuis plus de deux mois : l'entrée s'est faite hors de Bailio.
    const settled = Boolean(lease && (lease.status === 'IMPORTED' || (lease.status === 'ACTIVE' && Date.now() - lease.startDate.getTime() > 60 * 86_400_000)))

    out.set(
      p.id,
      rentalSteps({
        propertyId: p.id,
        parking: file.nature === 'PARKING',
        propertyMissing: [
          ...propertyLeaseMissing(file, lease?.type === 'FURNISHED' || file.furnished ? 'MEUBLE' : 'VIDE'),
          // Avant un nouveau bail : les diagnostics qui ne seront plus valables à la signature sont à refaire.
          ...(!lease || lease.status === 'DRAFT' ? expiredDiagnostics(file).map((d) => ({ label: `${d.label} à refaire (plus valable depuis le ${d.until.split('-').reverse().join('/')})`, level: 'ESSENTIAL' as const, section: 'diagnostics' })) : []),
        ],
        skipped: file.skippedSteps ?? [],
        adWritten: Boolean(file.ad?.description),
        applyOpen: Boolean(p.applyCode),
        candidates: p._count.candidates,
        tenant: tenantRow && tf ? { id: tenantRow.id, name: tenantName(tf) || 'votre locataire', essentialMissing: tenantLeaseMissing(tf).filter((m) => m.level === 'ESSENTIAL').map((m) => m.label), formSent: Boolean(tenantRow.formCode), toReview: pendingReview(tf).length } : null,
        lease: lease
          ? {
              id: lease.id,
              status: lease.status as 'DRAFT' | 'ACTIVE' | 'IMPORTED' | 'ENDED',
              ready,
              checked: Boolean(facts.checkedAt),
              esign,
              entryInventory: entry?.status === 'SIGNED' || (settled && !entry) ? 'SIGNED' : entry ? 'DRAFT' : 'NONE',
              depositCents: lease.depositCents,
              depositReceived: Boolean(facts.depositReceivedAt) || settled,
              insurance: insured,
              paid: lease.payments.length > 0 || settled,
              settled,
              startDate: lease.startDate.toISOString().slice(0, 10),
            }
          : null,
        today,
        forbidden: rentalForbidden(file.diagnostics?.dpe?.class),
      }),
    )
  }
  return out
}
