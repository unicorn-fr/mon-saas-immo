import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email via Brevo SMTP (or any configured SMTP).
 * Falls back to console log in development when SMTP is not configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html } = options

  if (!env.SMTP.HOST || !env.SMTP.USER || !env.SMTP.PASS) {
    console.log('========== EMAIL (SMTP non configure) ==========')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('================================================')
    return true
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT || 587,
      secure: env.SMTP.PORT === 465,
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS,
      },
    })

    await transporter.sendMail({
      from: `"ImmoParticuliers" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}
