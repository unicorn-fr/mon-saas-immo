import { prisma } from '../config/database.js'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'

function irlReminderHtml(params: {
  firstName: string
  propertyTitle: string
  toolUrl: string
}): string {
  const { firstName, propertyTitle, toolUrl } = params
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden;">
    <div style="background:#1a1a2e;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#c4976a;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Bailio</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-style:italic;font-weight:700;font-family:Georgia,serif;">
        Révision IRL
      </h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9e9b96;">
        Révision IRL
      </p>
      <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;font-style:italic;color:#0d0c0a;font-family:Georgia,serif;">
        Pensez à réviser votre loyer
      </h2>
      <p style="margin:0 0 16px;font-size:14px;color:#5a5754;line-height:1.65;">
        Bonjour <strong style="color:#0d0c0a;">${firstName}</strong>, le bail de
        <strong style="color:#0d0c0a;">« ${propertyTitle} »</strong> fête son anniversaire dans environ 3 mois.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#5a5754;line-height:1.65;">
        Selon l'Indice de Référence des Loyers (IRL) publié par l'INSEE, vous pouvez réviser votre loyer
        chaque année à la date d'anniversaire du bail.
        Utilisez notre outil de calcul IRL pour estimer la revalorisation possible.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${toolUrl}"
          style="display:inline-block;padding:14px 32px;background:#c4976a;color:#ffffff;
            text-decoration:none;border-radius:9px;font-size:14px;font-weight:700;">
          Calculer ma révision IRL →
        </a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#9e9b96;line-height:1.6;border-top:1px solid #e4e1db;padding-top:20px;">
        Cet email est envoyé automatiquement 3 mois avant l'anniversaire de votre bail.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Trouve les contrats ACTIVE dont le startDate est entre 8 et 9 mois en arrière,
 * et envoie un rappel de révision IRL au propriétaire.
 * Exécuté tous les jours à 10h via node-cron (server.ts).
 */
export async function sendIrlReminders(): Promise<void> {
  const now = new Date()

  const nineMonthsAgo = new Date(now)
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9)

  const eightMonthsAgo = new Date(now)
  eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8)

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      startDate: {
        gte: nineMonthsAgo,
        lte: eightMonthsAgo,
      },
    },
    include: {
      owner: { select: { email: true, firstName: true } },
      property: { select: { title: true } },
    },
  })

  if (contracts.length === 0) {
    console.log('[irlReminders] 0 contrats vérifiés, 0 rappels envoyés')
    return
  }

  let sent = 0

  await Promise.all(
    contracts.map(async (contract) => {
      const ownerEmail = contract.owner?.email
      const ownerFirstName = contract.owner?.firstName ?? 'vous'
      const propertyTitle = contract.property?.title ?? 'votre bien'

      if (!ownerEmail) return

      const toolUrl = `${env.FRONTEND_URL}/dashboard/owner/outils`

      const ok = await sendEmail({
        to: ownerEmail,
        subject: 'Votre loyer est révisable sous 3 mois — Bailio',
        html: irlReminderHtml({
          firstName: ownerFirstName,
          propertyTitle,
          toolUrl,
        }),
      })

      if (ok) sent++
    })
  )

  console.log(`[irlReminders] ${contracts.length} contrats vérifiés, ${sent} rappels envoyés`)
}
