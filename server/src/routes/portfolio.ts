import { Router } from 'express'
import { prisma } from '../db.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProperty, readStructure, readTenant, readTerms, tenantName } from '../services/contract.js'
import { structureName } from '../domain/structure.js'
import { portfolio, type PortfolioItem } from '../domain/portfolio.js'
import { unpaidPeriods } from '../domain/rentHistory.js'
import { expiredDiagnostics } from '../domain/rules.js'
import { loansAt } from '../domain/loan.js'
import { iso } from './helpers.js'

/** Tableau de bord de tous les logements (domain/portfolio.ts) : chiffres du mois et points à surveiller. */
const router = Router()
router.use('/portfolio', requireUser)

router.get('/portfolio', async (req, res) => {
  const userId = req.user!.id
  const now = new Date()
  const today = iso(now)!
  const yearAgo = new Date(now.getTime() - 365 * 86_400_000)
  const [properties, structures, tenants, expenses] = await Promise.all([
    prisma.property.findMany({ where: { userId }, include: { leases: { include: { payments: true }, orderBy: { startDate: 'desc' } } }, orderBy: { createdAt: 'asc' } }),
    prisma.structure.findMany({ where: { userId } }),
    prisma.tenant.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId, status: 'OK', date: { gte: yearAgo, lte: now } }, select: { propertyId: true, amountCents: true, recoverableCents: true } }),
  ])
  const names = Object.fromEntries(tenants.map((t) => [t.id, tenantName(readTenant(t))]))
  const items: PortfolioItem[] = properties.map((p) => {
    const f = readProperty(p)
    const signed = p.leases.filter((l) => l.status === 'ACTIVE' || l.status === 'IMPORTED')
    const lease = signed.find((l) => l.startDate <= now && l.endDate >= now) ?? null
    const ended = p.leases.filter((l) => l.status === 'ENDED').sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0]
    const s = structures.find((x) => x.id === p.structureId)
    const loans = f.loans?.length ? loansAt(f.loans, today) : { paymentCents: 0, insuranceCents: 0 }
    const spent = expenses.filter((e) => e.propertyId === p.id).reduce((a, e) => a + e.amountCents - e.recoverableCents, 0)
    return {
      id: p.id,
      name: propertyName(p),
      structureName: s ? structureName(readStructure(s)) : null,
      rented: Boolean(lease),
      tenantName: lease ? lease.tenantIds.map((id) => names[id]).filter(Boolean).join(' et ') || null : null,
      rentCents: lease?.rentCents ?? f.rent?.rentCents ?? 0,
      chargesCents: lease?.chargesCents ?? f.rent?.chargesCents ?? 0,
      loanCents: loans.paymentCents + loans.insuranceCents,
      averageExpensesCents: Math.round(spent / 12),
      unpaidCents: signed.reduce((a, l) => a + unpaidPeriods(l, l.payments, now).reduce((x, u) => x + u.missing, 0), 0),
      leaseEnd: lease ? iso(lease.endDate) : null,
      vacantSince: !lease && !signed.some((l) => l.startDate > now) && ended ? iso(ended.endDate) : null,
      dpe: f.diagnostics?.dpe?.class ?? null,
      expiredDiagnostics: expiredDiagnostics(f, now).length,
      purchasePriceCents: f.purchase?.priceCents ?? null,
      parkingNoticeMonths: f.nature === 'PARKING' ? ((lease ? readTerms(lease).noticeMonths : null) ?? 1) : null,
    }
  })
  res.json({ success: true, data: { today, ...portfolio(items, today) } })
})

export default router
