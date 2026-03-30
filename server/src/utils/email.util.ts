import { Resend } from 'resend'
import { env } from '../config/env.js'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email via Resend.
 * Falls back to console log in development when RESEND_API_KEY is not configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html } = options

  if (!env.RESEND_API_KEY) {
    console.log('========== EMAIL (Resend non configuré) ==========')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('==================================================')
    return true
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: `Bailio <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[Resend] Failed to send email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Resend] Unexpected error:', error)
    return false
  }
}
