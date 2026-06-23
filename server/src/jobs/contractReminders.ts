import { prisma } from '../config/database.js'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'

function contractReminderHtml(params: {
  firstName: string
  contractTitle: string
  daysElapsed: number
  dashboardUrl: string
}): string {
  const { firstName, contractTitle, daysElapsed, dashboardUrl } = params
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden;">
    <div style="background:#1a1a2e;padding:28px 32px;text-align:center;">
      <p style="margin:0;color:#c4976a;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Bailio</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-style:italic;font-weight:700;font-family:Georgia,serif;">
        Rappel signature
      </h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#0d0c0a;">Bonjour ${firstName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#5a5754;line-height:1.65;">
        Le contrat <strong style="color:#0d0c0a;">« ${contractTitle} »</strong> attend votre signature
        depuis <strong style="color:#c4976a;">${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}</strong>.
        N'oubliez pas de le signer pour finaliser votre location.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${dashboardUrl}"
          style="display:inline-block;padding:14px 32px;background:#1a1a2e;color:#ffffff;
            text-decoration:none;border-radius:9px;font-size:14px;font-weight:700;">
          Signer mon contrat →
        </a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#9e9b96;line-height:1.6;border-top:1px solid #e4e1db;padding-top:20px;">
        Cet email est envoyé automatiquement depuis Bailio. Si vous avez déjà signé, ignorez ce message.
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Vérifie tous les contrats SENT ou SIGNED_OWNER depuis plus de 3 jours
 * et envoie une relance au tenant aux fenêtres J+3 et J+7.
 * Exécuté toutes les 6 heures via node-cron (server.ts).
 */
export async function sendContractReminders(): Promise<void> {
  const contracts = await prisma.contract.findMany({
    where: {
      status: { in: ['SENT', 'SIGNED_OWNER'] },
    },
    include: {
      tenant: { select: { email: true, firstName: true } },
      owner: { select: { email: true, firstName: true } },
      property: { select: { title: true } },
    },
  })

  if (contracts.length === 0) {
    console.log('[contractReminders] 0 contrats vérifiés, 0 relances envoyées')
    return
  }

  let sent = 0
  const now = Date.now()

  await Promise.all(
    contracts.map(async (contract) => {
      const reference = contract.updatedAt ?? contract.createdAt
      const daysElapsed = (now - reference.getTime()) / (1000 * 60 * 60 * 24)

      // Fenêtres glissantes : J+3 (±0.1j) ou J+7 (±0.1j)
      const inWindow3 = daysElapsed >= 2.9 && daysElapsed <= 3.1
      const inWindow7 = daysElapsed >= 6.9 && daysElapsed <= 7.1

      if (!inWindow3 && !inWindow7) return

      const tenantEmail = contract.tenant?.email
      const tenantFirstName = contract.tenant?.firstName ?? 'vous'
      const contractTitle = contract.property?.title ?? 'votre contrat'

      if (!tenantEmail) return

      const dashboardUrl = `${env.FRONTEND_URL}/dashboard/tenant`
      const daysRounded = Math.round(daysElapsed)

      const ok = await sendEmail({
        to: tenantEmail,
        subject: 'Rappel : votre contrat attend votre signature — Bailio',
        html: contractReminderHtml({
          firstName: tenantFirstName,
          contractTitle,
          daysElapsed: daysRounded,
          dashboardUrl,
        }),
      })

      if (ok) sent++
    })
  )

  console.log(`[contractReminders] ${contracts.length} contrats vérifiés, ${sent} relances envoyées`)
}
