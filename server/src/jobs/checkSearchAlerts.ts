import { prisma } from '../config/database.js'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
  LOFT: 'Loft',
  CHAMBRE: 'Chambre',
}

function alertEmailHtml(params: {
  firstName: string
  alertName: string
  count: number
  searchUrl: string
}): string {
  const { firstName, alertName, count, searchUrl } = params
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden;">
    <!-- Header -->
    <div style="background:#1a1a2e;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#c4976a;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Bailio</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-style:italic;font-weight:700;font-family:Georgia,serif;">
        Nouvelle${count > 1 ? 's' : ''} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}
      </h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#0d0c0a;">Bonjour ${firstName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#5a5754;line-height:1.65;">
        Votre alerte <strong style="color:#0d0c0a;">« ${alertName} »</strong> a trouvé
        <strong style="color:#c4976a;">${count} nouveau${count > 1 ? 'x' : ''} bien${count > 1 ? 's' : ''}</strong>
        correspondant à vos critères.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${searchUrl}"
          style="display:inline-block;padding:14px 32px;background:#c4976a;color:#ffffff;
            text-decoration:none;border-radius:9px;font-size:14px;font-weight:700;">
          Voir les biens →
        </a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#9e9b96;line-height:1.6;border-top:1px solid #e4e1db;padding-top:20px;">
        Vous recevez cet email car vous avez créé une alerte de recherche sur Bailio.
        Pour gérer vos alertes, rendez-vous dans votre
        <a href="${env.FRONTEND_URL}/mes-alertes" style="color:#c4976a;">espace personnel</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Parcourt toutes les alertes actives, compte les nouveaux biens correspondants
 * et envoie un email de notification si de nouveaux biens ont été publiés.
 * Exécuté toutes les 30 minutes via node-cron (server.ts).
 */
export async function checkSearchAlerts(): Promise<void> {
  const alerts = await prisma.searchAlert.findMany({
    where: { active: true },
    include: {
      user: { select: { email: true, firstName: true } },
    },
  })

  if (alerts.length === 0) return

  let notified = 0

  await Promise.all(
    alerts.map(async (alert) => {
      const where: Record<string, unknown> = { status: 'AVAILABLE' }

      // Uniquement les biens publiés depuis la dernière notification
      if (alert.lastNotifiedAt) {
        where.createdAt = { gt: alert.lastNotifiedAt }
      }

      if (alert.city)  where.city = { contains: alert.city, mode: 'insensitive' }
      if (alert.type)  where.type = alert.type

      if (alert.minPrice != null || alert.maxPrice != null) {
        const f: Record<string, number> = {}
        if (alert.minPrice != null) f.gte = alert.minPrice
        if (alert.maxPrice != null) f.lte = alert.maxPrice
        where.price = f
      }

      if (alert.minSurface != null || alert.maxSurface != null) {
        const f: Record<string, number> = {}
        if (alert.minSurface != null) f.gte = alert.minSurface
        if (alert.maxSurface != null) f.lte = alert.maxSurface
        where.surface = f
      }

      if (alert.rooms != null)    where.bedrooms = { gte: alert.rooms }
      if (alert.furnished != null) where.furnished = alert.furnished

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = await prisma.property.count({ where: where as any })

      if (count > 0) {
        // Construire l'URL de recherche avec les filtres
        const params = new URLSearchParams()
        if (alert.city)     params.set('city', alert.city)
        if (alert.type)     params.set('type', alert.type)
        if (alert.minPrice) params.set('minPrice', String(alert.minPrice))
        if (alert.maxPrice) params.set('maxPrice', String(alert.maxPrice))
        const searchUrl = `${env.FRONTEND_URL}/search?${params.toString()}`

        // Envoi email
        const sent = await sendEmail({
          to: alert.user.email,
          subject: `${count} nouveau${count > 1 ? 'x' : ''} bien${count > 1 ? 's' : ''} — ${alert.name}`,
          html: alertEmailHtml({
            firstName: alert.user.firstName || 'vous',
            alertName: alert.name,
            count,
            searchUrl,
          }),
        })

        if (sent) {
          notified++
          await prisma.searchAlert.update({
            where: { id: alert.id },
            data: {
              newCount: { increment: count },
              lastNotifiedAt: new Date(),
            },
          })
        }
      }
    })
  )

  console.log(`[checkSearchAlerts] ${alerts.length} alertes vérifiées, ${notified} emails envoyés`)
}
