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
  /** Adresse de réponse (le propriétaire, pour un email envoyé à son locataire). */
  replyTo?: string
}

/**
 * Envoi par le serveur de messagerie Ionos de bailio.fr (Allemagne), en SMTP authentifié sur le port 587.
 * Le VPS Lite d'Infomaniak ne peut pas remettre lui-même les emails (port 25 sortant fermé, sans dérogation possible) :
 * il les confie à Ionos, qui les signe (DKIM s1/s2-ionos, SPF include:_spf-eu.ionos.com).
 * Resend (États-Unis) ne sert que tant que SMTP_HOST, SMTP_USER et SMTP_PASS ne sont pas renseignés sur le serveur :
 * à retirer (code, dépendance, clé, enregistrements DNS resend._domainkey et send) dès que /health indique « smtp ».
 */
const smtp =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        requireTLS: env.SMTP_PORT !== 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        pool: true,
        maxConnections: 2,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      })
    : null

const resend = !smtp && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

/** Service d'envoi utilisé (affiché sur /health, sans aucun secret). */
export const emailMode = (): 'smtp' | 'resend' | 'none' => (smtp ? 'smtp' : resend ? 'resend' : 'none')

const transient = (err: unknown) => {
  const e = err as { code?: string; responseCode?: number }
  return ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'EDNS', 'ECONNECTION'].includes(e.code ?? '') || (e.responseCode !== undefined && e.responseCode >= 400 && e.responseCode < 500)
}

/** Envoi par SMTP, avec un nouvel essai après une erreur passagère ; sinon Resend ; sinon affichage dans les logs. */
export async function sendEmail(email: Email): Promise<void> {
  if (!smtp && resend) {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo,
      attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
    })
    if (error) throw new Error(`Envoi de l'email impossible : ${error.message}`)
    return
  }
  if (!smtp) {
    console.info(`[email] (non envoyé, aucun service d'email configuré) → ${email.to} · ${email.subject}\n${email.text}`)
    return
  }
  const message = {
    from: env.EMAIL_FROM,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: email.replyTo,
    attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  }
  try {
    await smtp.sendMail(message)
  } catch (err) {
    if (!transient(err)) throw err
    await new Promise((r) => setTimeout(r, 2000))
    await smtp.sendMail(message)
  }
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
