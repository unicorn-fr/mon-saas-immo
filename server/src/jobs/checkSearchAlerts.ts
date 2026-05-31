import { prisma } from '../config/database.js'

/**
 * Parcourt toutes les alertes de recherche actives et met à jour le compteur
 * de nouveaux biens correspondant aux filtres de chaque alerte.
 *
 * Pas d'envoi email — uniquement le comptage (Resend sera branché plus tard).
 * À exécuter toutes les 30 minutes via node-cron.
 */
export async function checkSearchAlerts(): Promise<void> {
  const alerts = await prisma.searchAlert.findMany({
    where: { active: true },
  })

  if (alerts.length === 0) return

  await Promise.all(
    alerts.map(async (alert) => {
      // Filtres de base : toujours AVAILABLE
      const where: Record<string, unknown> = {
        status: 'AVAILABLE',
      }

      // Filtre sur la date : uniquement les biens créés après la dernière notification
      if (alert.lastNotifiedAt) {
        where.createdAt = { gt: alert.lastNotifiedAt }
      }

      // Filtres optionnels
      if (alert.city) {
        where.city = { contains: alert.city, mode: 'insensitive' }
      }
      if (alert.type) {
        where.type = alert.type
      }
      if (alert.minPrice != null || alert.maxPrice != null) {
        const priceFilter: Record<string, number> = {}
        if (alert.minPrice != null) priceFilter.gte = alert.minPrice
        if (alert.maxPrice != null) priceFilter.lte = alert.maxPrice
        where.price = priceFilter
      }
      if (alert.minSurface != null || alert.maxSurface != null) {
        const surfaceFilter: Record<string, number> = {}
        if (alert.minSurface != null) surfaceFilter.gte = alert.minSurface
        if (alert.maxSurface != null) surfaceFilter.lte = alert.maxSurface
        where.surface = surfaceFilter
      }
      if (alert.rooms != null) {
        where.bedrooms = { gte: alert.rooms }
      }
      if (alert.furnished != null) {
        where.furnished = alert.furnished
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = await prisma.property.count({ where: where as any })

      if (count > 0) {
        await prisma.searchAlert.update({
          where: { id: alert.id },
          data: {
            newCount: count,
            lastNotifiedAt: new Date(),
          },
        })
      }
    })
  )

  console.log(`[checkSearchAlerts] ${alerts.length} alertes vérifiées`)
}
