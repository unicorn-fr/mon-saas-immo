import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env } from '../config/env.js'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email.
 * Priority: SMTP (Ionos) → Resend → console log (dev fallback)
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html } = options

  // 1. SMTP Ionos (prioritaire si SMTP_HOST configuré)
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `Bailio <${env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      })
      console.log(`[email] Sent via SMTP to ${to}`)
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[email] SMTP error:', msg)
      return false
    }
  }

  // 2. Resend SDK (si RESEND_API_KEY configuré)
  if (env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: `Bailio <${env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      })
      if (error) {
        console.error('[email] Resend error:', error)
        return false
      }
      console.log(`[email] Sent via Resend to ${to}`)
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[email] Resend unexpected error:', msg)
      return false
    }
  }

  // 3. Fallback dev — affiche dans les logs
  console.log('========== EMAIL (aucun provider configuré) ==========')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('=======================================================')
  return true
}
