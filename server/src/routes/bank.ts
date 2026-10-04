import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { leaseOwned, propertyName, readTenant, tenantName } from '../services/contract.js'
import { parseStatement } from '../domain/bankStatement.js'
import { matchRents, type ExpectedRent } from '../domain/rentMatch.js'
import { amountsForPeriod } from '../domain/rentHistory.js'
import { upload } from './helpers.js'
import { patchLeaseData, recordPayment } from './leases.js'

/**
 * Loyers reçus repérés sur le relevé bancaire du propriétaire (CSV ou OFX téléchargé depuis sa banque).
 * Le fichier est lu en mémoire sur notre serveur et n'est jamais enregistré : seuls les loyers validés le sont.
 */
const router = Router()
router.use(['/bank', '/leases/:id/receipt-auto', '/leases/:id/receipt-hold'], requireUser)

const periodOf = (d: string) => d.slice(0, 7)
const nextPeriod = (p: string) => {
  const [y, m] = p.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

router.post('/bank/statement', upload.single('file'), async (req, res) => {
  const user = req.user!
  if (!req.file) throw new HttpError(400, 'Choisissez le fichier du relevé.')
  let transactions
  try {
    transactions = parseStatement(req.file.buffer)
  } catch (e) {
    throw new HttpError(400, (e as Error).message)
  }
  const credits = transactions.filter((t) => t.amountCents > 0)
  if (!credits.length) throw new HttpError(400, 'Aucun versement reçu dans ce relevé.')
  const dates = credits.map((t) => t.date).sort()
  // Mois attendus : du mois précédant la première opération au mois suivant la dernière.
  const from = periodOf(new Date(Date.parse(`${dates[0]}T00:00:00Z`) - 31 * 86_400_000).toISOString())
  const to = nextPeriod(periodOf(dates[dates.length - 1]))
  const leases = await prisma.lease.findMany({ where: { userId: user.id, status: { in: ['ACTIVE', 'IMPORTED', 'ENDED'] } }, include: { property: true, payments: { select: { period: true } } } })
  const tenantRows = await prisma.tenant.findMany({ where: { userId: user.id } })
  const expected: ExpectedRent[] = []
  for (const l of leases) {
    const day = l.paymentDay
    const paid = new Set(l.payments.map((p) => p.period))
    const tenants = l.tenantIds.map((id) => tenantRows.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t)).map(readTenant)
    const names = tenants.flatMap((t) => [tenantName(t), t.guarantor ? `${t.guarantor.firstNames ?? ''} ${t.guarantor.lastName ?? ''}` : '']).filter((n) => n.trim())
    const label = `${propertyName(l.property)}${names[0] ? `, ${names[0]}` : ''}`
    const start = periodOf(l.startDate.toISOString())
    const end = l.status === 'ENDED' ? periodOf(l.endDate.toISOString()) : null
    for (let p = from > start ? from : start; p <= to; p = nextPeriod(p)) {
      if (end && p > end) break
      if (paid.has(p)) continue
      const a = amountsForPeriod(l, p)
      const due = a.rentCents + a.chargesCents
      if (due <= 0) continue
      expected.push({ leaseId: l.id, label, names, period: p, dueDate: `${p}-${String(day).padStart(2, '0')}`, dueCents: due })
    }
  }
  const matches = matchRents(credits, expected)
  const auto = Object.fromEntries(leases.map((l) => [l.id, Boolean((l.data as { receiptAuto?: boolean }).receiptAuto)]))
  res.json({ success: true, data: { credits: credits.length, from: dates[0], to: dates[dates.length - 1], matches: matches.map((m) => ({ ...m, receiptAuto: auto[m.leaseId] ?? false })) } })
})

router.post('/bank/confirm', async (req, res) => {
  const user = req.user!
  const { items } = z
    .object({
      items: z
        .array(
          z.object({
            leaseId: z.string().uuid(),
            period: z.string().regex(/^\d{4}-\d{2}$/),
            amountCents: z.number().int().positive().max(10_000_000),
            receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
        )
        .min(1)
        .max(200),
    })
    .parse(req.body)
  const results = []
  for (const it of items) {
    const lease = await leaseOwned(user.id, it.leaseId)
    const r = await recordPayment(user, lease, it)
    results.push({ leaseId: it.leaseId, period: it.period, full: r.full, documentId: r.documentId, sentTo: r.sentTo })
  }
  res.json({ success: true, data: { results } })
})

// Quittance envoyée seule au locataire dès que le loyer est enregistré.
router.put('/leases/:id/receipt-auto', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const { auto } = z.object({ auto: z.boolean() }).parse(req.body)
  await patchLeaseData(lease.id, () => ({ receiptAuto: auto }))
  res.json({ success: true, data: { receiptAuto: auto } })
})

// Loyer pas arrivé : la quittance automatique de ce mois ne part pas (et peut être rétablie).
router.post('/leases/:id/receipt-hold', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const { period, hold } = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/), hold: z.boolean() }).parse(req.body)
  await patchLeaseData(lease.id, (f) => {
    const held = { ...((f as { receiptHold?: Record<string, string> }).receiptHold ?? {}) }
    if (hold) held[period] = new Date().toISOString()
    else delete held[period]
    return { receiptHold: held }
  })
  res.json({ success: true, data: { period, hold } })
})

export default router
