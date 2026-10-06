import { Router } from 'express'
import { prisma } from '../db.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { propertyName, readProperty, readTenant, readTerms, tenantName } from '../services/contract.js'
import { bulkGroups, type BulkLease } from '../domain/bulk.js'
import { unpaidPeriods } from '../domain/rentHistory.js'
import { iso } from './helpers.js'

/**
 * Actions groupées (domain/bulk.ts) : les baux concernés par chaque action. L'envoi lui-même passe, ligne par ligne,
 * par les mêmes adresses que l'envoi à l'unité (lien du locataire, courrier, quittance).
 */
const router = Router()
router.use('/bulk', requireUser)

router.get('/bulk', async (req, res) => {
  const userId = req.user!.id
  const now = new Date()
  const today = iso(now)!
  const [leases, tenants, letters] = await Promise.all([
    prisma.lease.findMany({ where: { userId, status: { in: ['ACTIVE', 'IMPORTED'] } }, include: { property: true, payments: true }, orderBy: { startDate: 'asc' } }),
    prisma.tenant.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId, kind: 'LETTER' }, select: { leaseId: true, meta: true, createdAt: true } }),
  ])
  for (const l of leases) await ensureReminders(l)
  const reminders = await prisma.reminder.findMany({ where: { userId, type: 'RENT_REVISION', status: 'TODO', leaseId: { in: leases.map((l) => l.id) } }, orderBy: { dueDate: 'asc' } })
  const files = new Map(tenants.map((t) => [t.id, readTenant(t)]))
  const items: BulkLease[] = leases.map((l) => {
    const ts = l.tenantIds.map((id) => files.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
    const data = (l.data ?? {}) as { receiptsSent?: Record<string, string>; tenantLink?: { eReceiptConsent?: { email?: string } | null; eReceiptWithdrawnAt?: string | null } }
    const expiries = ts.map((t) => t.insurance?.expiresAt ?? null)
    const lastReminder = letters
      .filter((d) => d.leaseId === l.id && ['REMINDER', 'FORMAL_NOTICE'].includes(String((d.meta as { type?: string } | null)?.type)))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    const terms = readTerms(l)
    return {
      id: l.id,
      propertyName: propertyName(l.property),
      tenantName: ts.map((t) => tenantName(t)).filter(Boolean).join(' et ') || 'Votre locataire',
      tenantEmail: ts.some((t) => Boolean(t.email)) || Boolean(data.tenantLink?.eReceiptConsent?.email),
      started: l.startDate <= now,
      // Plusieurs locataires : la première attestation qui manque ou expire.
      insuranceExpiresAt: expiries.includes(null) ? null : (expiries.sort()[0] ?? null),
      // Même échéance que unpaidPeriods (jour de paiement du bail dans le mois).
      unpaid: unpaidPeriods(l, l.payments, now).map((u) => ({ ...u, dueDate: iso(new Date(Date.UTC(Number(u.period.slice(0, 4)), Number(u.period.slice(5, 7)) - 1, l.paymentDay)))! })),
      lastReminderAt: lastReminder ? iso(lastReminder.createdAt) : null,
      revisionDue: reminders.find((r) => r.leaseId === l.id) ? iso(reminders.find((r) => r.leaseId === l.id)!.dueDate) : null,
      irlRef: Boolean(terms.revision?.irlQuarter && terms.revision.irlValue),
      dpe: readProperty(l.property).diagnostics?.dpe?.class ?? null,
      paidPeriods: l.payments.map((p) => p.period),
      receiptsSent: Object.keys(data.receiptsSent ?? {}),
      eReceiptWithdrawn: Boolean(data.tenantLink?.eReceiptWithdrawnAt && !data.tenantLink.eReceiptConsent),
    }
  })
  res.json({ success: true, data: { today, groups: bulkGroups(items, today) } })
})

export default router
