import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env } from '../env.js'

export interface EmailAttachment {
  filename: string
  content: Buffer
}

export interface Email {
  to: string
  subject: string
  text: string
  html: string
  attachments?: EmailAttachment[]
}

const smtp =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

/** Envoi : SMTP (Ionos) s'il est configuré, sinon Resend, sinon affichage dans les logs. */
export async function sendEmail(email: Email): Promise<void> {
  if (smtp) {
    await smtp.sendMail({
      from: env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    })
    return
  }
  if (!resend) {
    console.info(`[email] (non envoyé, aucun service d'email configuré) → ${email.to} · ${email.subject}\n${email.text}`)
    return
  }
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  })
  if (error) throw new Error(`Envoi de l'email impossible : ${error.message}`)
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Gabarit sobre : un titre, quelques paragraphes, un bouton. */
export function layout(opts: { title: string; paragraphs: string[]; cta?: { label: string; url: string } }): { html: string; text: string } {
  const p = opts.paragraphs.map((x) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#45455a">${escape(x)}</p>`).join('')
  const cta = opts.cta
    ? `<p style="margin:24px 0"><a href="${escape(opts.cta.url)}" style="display:inline-block;background:#1a3270;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:12px">${escape(opts.cta.label)}</a></p>`
    : ''
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#faf7f2;font-family:Helvetica,Arial,sans-serif;color:#1a1a2e">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="margin:0 0 32px;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:28px">Bailio</p>
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-style:italic;font-size:30px;line-height:1.15">${escape(opts.title)}</h1>
${p}${cta}
<p style="margin:40px 0 0;font-size:13px;color:#8a8aa0">Bailio · le suivi de vos locations</p>
</div></body></html>`
  const text = [opts.title, '', ...opts.paragraphs, ...(opts.cta ? ['', `${opts.cta.label} : ${opts.cta.url}`] : [])].join('\n')
  return { html, text }
}
