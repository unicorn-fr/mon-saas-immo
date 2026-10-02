import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { requireUser } from '../services/session.js'
import { publicUser } from './auth.js'

/** Compte : suivi par email, préférences, export et suppression des données (RGPD). */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/account'], requireUser)

router.post('/account/follow-up', async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { followUpSince: req.user!.followUpSince ?? new Date() } })
  res.json({ success: true, data: publicUser(user) })
})

router.patch('/account', async (req, res) => {
  const body = z
    .object({
      firstName: z.string().trim().max(80).optional(),
      lastName: z.string().trim().max(80).optional(),
      followUp: z.boolean().optional(),
      notifyWeekly: z.boolean().optional(),
      notifyUrgent: z.boolean().optional(),
    })
    .parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      notifyWeekly: body.notifyWeekly,
      notifyUrgent: body.notifyUrgent,
      followUpSince: body.followUp === undefined ? undefined : body.followUp ? (req.user!.followUpSince ?? new Date()) : null,
    },
  })
  res.json({ success: true, data: publicUser(user) })
})

// Export de toutes les données du compte (RGPD, art. 20). Les fichiers sont listés, pas inclus.
router.get('/account/export', async (req, res) => {
  const userId = req.user!.id
  const [user, properties, tenants, leases, payments, expenses, inventories, reminders, documents, files] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.property.findMany({ where: { userId } }),
    prisma.tenant.findMany({ where: { userId } }),
    prisma.lease.findMany({ where: { userId } }),
    prisma.payment.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.inventory.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId }, select: { id: true, kind: true, title: true, version: true, period: true, sha256: true, createdAt: true } }),
    prisma.fileBlob.findMany({ where: { userId }, select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true } }),
  ])
  res.setHeader('Content-Disposition', 'attachment; filename="bailio-export.json"')
  res.json({ exportedAt: new Date().toISOString(), user: { ...publicUser(user), profile: user.profile }, properties, tenants, leases, payments, expenses, inventories, reminders, documents, files })
})

// Suppression définitive du compte et de toutes ses données (RGPD, art. 17).
router.delete('/account', async (req, res) => {
  await prisma.user.delete({ where: { id: req.user!.id } })
  res.json({ success: true, data: { deleted: true } })
})

export default router
