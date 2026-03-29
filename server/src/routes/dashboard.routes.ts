import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()
router.use(authenticate)

/**
 * GET /dashboard/owner — agrège toutes les données du dashboard propriétaire.
 * Remplace les 7 appels parallèles du frontend par 1 seul.
 */
router.get('/owner', authorize('OWNER', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id

    const [
      contractStats,
      recentProperties,
      recentApplications,
      upcomingBookings,
      unreadMessages,
      propertyStats,
    ] = await Promise.all([
      // Contrats actifs + revenue mensuel
      prisma.contract.aggregate({
        where: { ownerId, status: 'ACTIVE' },
        _sum: { monthlyRent: true },
        _count: { id: true },
      }),
      // 5 biens récents
      prisma.property.findMany({
        where: { ownerId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, status: true, price: true, city: true, images: true },
      }),
      // 10 dernières candidatures
      prisma.application.findMany({
        where: { property: { ownerId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, score: true, createdAt: true,
          tenant: { select: { id: true, firstName: true, lastName: true, tenantScore: true } },
          property: { select: { id: true, title: true } },
        },
      }),
      // Visites à venir (7 prochains jours)
      prisma.booking.findMany({
        where: {
          property: { ownerId },
          visitDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        take: 5,
        orderBy: { visitDate: 'asc' },
        select: {
          id: true, visitDate: true, visitTime: true, status: true,
          tenant: { select: { firstName: true, lastName: true } },
          property: { select: { title: true } },
        },
      }),
      // Messages non lus
      prisma.message.count({
        where: {
          receiver: { id: ownerId },
          isRead: false,
        },
      }),
      // Stats globales biens
      prisma.property.aggregate({
        where: { ownerId },
        _count: { id: true },
        _sum: { views: true, contactCount: true },
      }),
    ])

    return res.json({
      stats: {
        totalRevenue:    contractStats._sum.monthlyRent ?? 0,
        activeContracts: contractStats._count.id,
        totalProperties: propertyStats._count.id,
        totalViews:      propertyStats._sum.views ?? 0,
        totalContacts:   propertyStats._sum.contactCount ?? 0,
        unreadMessages,
      },
      recentProperties,
      recentApplications,
      upcomingBookings,
    })
  } catch (err: any) {
    console.error('[dashboard/owner] error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router
