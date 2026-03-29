import { prisma } from '../config/database.js'
import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT || 587,
  secure: false,
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
})

async function sendConfirmationEmail(email: string, position: number): Promise<void> {
  const isEarlyAccess = position <= 150

  const subject = isEarlyAccess
    ? 'Bailio — Vous faites partie des 150 premiers !'
    : `Bailio — Inscription confirmée (position #${position})`

  const earlyAccessBadge = isEarlyAccess
    ? `<div style="background:#c4976a;color:#fff;padding:8px 20px;border-radius:20px;display:inline-block;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;margin-bottom:24px;">
        Accès anticipé garanti
      </div>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden;">
    <div style="padding:32px 40px;border-bottom:1px solid #e4e1db;">
      <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9e9b96;">Bailio</p>
      <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:700;font-style:italic;color:#0d0c0a;">
        Votre place est réservée
      </h1>
    </div>
    <div style="padding:32px 40px;">
      ${earlyAccessBadge}
      <p style="color:#5a5754;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Merci de rejoindre la liste d'attente Bailio — la plateforme de gestion locative entre particuliers, sans intermédiaire.
      </p>
      <div style="background:#f4f2ee;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#9e9b96;text-transform:uppercase;letter-spacing:0.08em;">Votre position</p>
        <p style="margin:0;font-size:36px;font-weight:700;color:#0d0c0a;font-family:Georgia,serif;">#${position}</p>
        ${isEarlyAccess ? '<p style="margin:4px 0 0;font-size:13px;color:#c4976a;font-weight:600;">Accès anticipé inclus</p>' : ''}
      </div>
      <p style="color:#5a5754;font-size:14px;line-height:1.6;margin:0 0 8px;">
        Nous vous préviendrons dès l'ouverture. Partagez Bailio avec vos proches pour remonter dans la liste.
      </p>
    </div>
    <div style="padding:20px 40px;background:#f4f2ee;border-top:1px solid #e4e1db;">
      <p style="margin:0;font-size:12px;color:#9e9b96;">
        Bailio — Gestion locative entre particuliers · <a href="mailto:contact@bailio.fr" style="color:#c4976a;text-decoration:none;">contact@bailio.fr</a>
      </p>
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from: `"Bailio" <${env.SMTP.USER || env.EMAIL_FROM}>`,
    to: email,
    subject,
    html,
  })
}

export const waitlistService = {
  async join(email: string): Promise<{ position: number; isEarlyAccess: boolean; alreadyRegistered: boolean }> {
    // Check if already registered
    const existing = await prisma.waitlistEntry.findUnique({ where: { email } })
    if (existing) {
      return {
        position: existing.position,
        isEarlyAccess: existing.isEarlyAccess,
        alreadyRegistered: true,
      }
    }

    // Calculate position
    const count = await prisma.waitlistEntry.count()
    const position = count + 1
    const isEarlyAccess = position <= 150

    const entry = await prisma.waitlistEntry.create({
      data: {
        email,
        position,
        isEarlyAccess,
      },
    })

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(email, position).catch((err) => {
      console.error('[waitlist] Failed to send confirmation email:', err)
    })

    return { position: entry.position, isEarlyAccess, alreadyRegistered: false }
  },

  async getCount(): Promise<number> {
    return prisma.waitlistEntry.count()
  },
}
