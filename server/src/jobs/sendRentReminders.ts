import { prisma } from '../config/database.js'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/**
 * Marque comme LATE les loyers PENDING dont l'échéance dépasse 3 jours,
 * et envoie un email de rappel au locataire (une seule fois, à la transition PENDING→LATE).
 * À exécuter quotidiennement.
 */
export async function sendRentReminders() {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - 3) // dueDate < aujourd'hui - 3 jours

  // Récupère les paiements éligibles avant de les mettre à jour
  // Note: tenantId is non-nullable on Contract so no null check needed
  const latePayments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: threshold },
      contract: { status: 'ACTIVE' },
    },
    select: {
      id: true,
      amount: true,
      charges: true,
      month: true,
      year: true,
      dueDate: true,
      contract: {
        select: {
          tenant: { select: { firstName: true, lastName: true, email: true } },
          property: { select: { address: true, city: true } },
        },
      },
    },
  })

  if (latePayments.length === 0) {
    console.log('[sendRentReminders] Aucun loyer en retard.')
    return { processed: 0 }
  }

  // Passage en LATE en une seule requête (idempotent)
  const ids = latePayments.map((p) => p.id)
  await prisma.payment.updateMany({
    where: { id: { in: ids } },
    data: { status: 'LATE' },
  })

  // Envoi des emails individuels
  let emailsSent = 0
  for (const payment of latePayments) {
    const tenant = payment.contract?.tenant
    if (!tenant?.email) continue

    const property = payment.contract.property
    const propertyAddress = `${property.address}, ${property.city}`
    const monthLabel = MONTHS[payment.month - 1]
    const total = (payment.amount + payment.charges).toFixed(2)
    const paymentsUrl = `${env.FRONTEND_URL}/tenant/payments`
    const dueDateStr = payment.dueDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden">
    <div style="background:#1a1a2e;padding:28px 32px">
      <p style="color:#c4976a;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px">Bailio · Gestion Locative</p>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Rappel de paiement</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#0d0c0a;font-size:15px;line-height:1.6;margin:0 0 16px">Bonjour ${tenant.firstName},</p>
      <p style="color:#5a5754;font-size:14px;line-height:1.6;margin:0 0 24px">
        Nous vous informons que le règlement de votre loyer du mois de <strong>${monthLabel} ${payment.year}</strong>
        pour le bien situé au <strong>${propertyAddress}</strong> n'a pas encore été enregistré.
        La date d'échéance était le <strong>${dueDateStr}</strong>.
      </p>
      <div style="background:#f4f2ee;border-radius:8px;padding:16px 20px;margin:0 0 24px">
        <p style="color:#9e9b96;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">Montant dû</p>
        <p style="color:#1a1a2e;font-size:28px;font-weight:700;margin:0">${total} €</p>
        <p style="color:#5a5754;font-size:13px;margin:4px 0 0">Loyer ${payment.amount.toFixed(2)} € + Charges ${payment.charges.toFixed(2)} €</p>
      </div>
      <p style="color:#5a5754;font-size:14px;line-height:1.6;margin:0 0 24px">
        Si vous avez déjà effectué le virement, merci de ne pas tenir compte de ce message.
        Dans le cas contraire, nous vous invitons à régulariser votre situation dans les meilleurs délais.
      </p>
      <a href="${paymentsUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">Accéder à mes paiements →</a>
      <p style="color:#9e9b96;font-size:12px;line-height:1.6;margin:24px 0 0">
        Pour toute question, contactez votre propriétaire via la messagerie Bailio.<br>
        <a href="https://bailio.fr" style="color:#c4976a;text-decoration:none">bailio.fr</a> · plateforme de gestion locative
      </p>
    </div>
  </div>
</body>
</html>`

    try {
      await sendEmail({
        to: tenant.email,
        subject: `Rappel de paiement — loyer de ${monthLabel} ${payment.year} · ${propertyAddress}`,
        html,
      })
      emailsSent++
      console.log(`[sendRentReminders] rappel envoyé → ${tenant.email} (${monthLabel} ${payment.year})`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[sendRentReminders] email failed for ${tenant.email}:`, msg)
    }
  }

  console.log(`[sendRentReminders] ${latePayments.length} loyers passés en LATE, ${emailsSent} emails envoyés.`)
  return { processed: latePayments.length, emailsSent }
}
