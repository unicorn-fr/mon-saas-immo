import { Router, Request, Response } from 'express'
import { optionalAuthenticate } from '../middlewares/auth.middleware.js'
import multer from 'multer'
import { sendEmail } from '../utils/email.util.js'
import { env } from '../config/env.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const TYPE_LABELS: Record<string, string> = {
  ui: 'Problème d\'affichage',
  error: 'Erreur / crash',
  performance: 'Lenteur',
  feature: 'Fonctionnalité cassée',
  other: 'Autre',
}

// POST /api/v1/bugs — log a bug report and send email notification
router.post('/', optionalAuthenticate, upload.single('screenshot'), async (req: Request, res: Response) => {
  const { title, description, type, url, userAgent } = req.body
  const userId = req.user?.id ?? 'anonymous'
  const userEmail = req.user?.email ?? '—'
  const userName = userEmail !== '—' ? userEmail : 'Anonyme'
  const hasScreenshot = !!req.file
  const ts = new Date().toISOString()

  // Log to server console
  console.log('[BUG REPORT]', JSON.stringify({ userId, type, title, description, url, userAgent, hasScreenshot, ts }, null, 2))

  // Send email to admin(s)
  const recipients = env.ADMIN_EMAILS.length ? env.ADMIN_EMAILS : [env.EMAIL_FROM]
  const typeLabel = TYPE_LABELS[type] ?? type ?? 'Autre'

  const html = `
    <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #fafaf8;">
      <div style="background: #1a1a2e; padding: 20px 24px; border-radius: 10px 10px 0 0;">
        <p style="margin:0; color: #c4976a; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700;">Bailio — Rapport de bug</p>
        <h1 style="margin: 6px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding: 20px 24px; background: #ffffff; border: 1px solid #e4e1db; border-top: none; border-radius: 0 0 10px 10px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #5a5754; margin-bottom: 16px;">
          <tr><td style="padding: 5px 0; font-weight: 600; color: #0d0c0a; width: 140px;">Type</td><td style="padding: 5px 0;">${escapeHtml(typeLabel)}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: 600; color: #0d0c0a;">Utilisateur</td><td style="padding: 5px 0;">${escapeHtml(userName)} — ID: ${escapeHtml(userId)}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: 600; color: #0d0c0a;">Page</td><td style="padding: 5px 0; word-break: break-all;">${escapeHtml(url ?? '—')}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: 600; color: #0d0c0a;">Capture</td><td style="padding: 5px 0;">${hasScreenshot ? '✅ Jointe' : '—'}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: 600; color: #0d0c0a;">Date</td><td style="padding: 5px 0;">${ts}</td></tr>
        </table>
        <div style="background: #f4f2ee; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;">
          <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9e9b96;">Description</p>
          <p style="margin: 0; font-size: 13px; color: #0d0c0a; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(description ?? '')}</p>
        </div>
        <p style="margin: 16px 0 0; font-size: 11px; color: #9e9b96;">User-agent: ${escapeHtml((userAgent ?? '').substring(0, 200))}</p>
      </div>
    </div>
  `

  for (const to of recipients) {
    await sendEmail({ to, subject: `[Bug] ${typeLabel} — ${title}`, html })
  }

  return res.status(201).json({ success: true, message: 'Bug report received' })
})

export default router
