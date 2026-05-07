import { Router, Request, Response } from 'express'
import { documentController } from '../controllers/document.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'
import { sendEmail } from '../utils/email.util.js'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env.js'

const router = Router()

// All document routes require authentication
router.use(authenticate)

// GET /api/v1/documents/proxy?path=/uploads/... — serve file securely (requires auth)
router.get('/proxy', async (req, res) => {
  const filePath = req.query.path as string
  if (!filePath) return res.status(400).json({ success: false, message: 'Chemin manquant' })

  // Cloudinary / remote URL stored in DB → fetch and proxy
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // Validate URL to prevent SSRF — only allow Cloudinary
    try {
      const url = new URL(filePath)
      const allowedHosts = ['res.cloudinary.com', 'cloudinary.com']
      if (!allowedHosts.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
        return res.status(400).json({ success: false, message: 'Domaine non autorisé' })
      }
      // Block private IP ranges
      const hostname = url.hostname
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
      ) {
        return res.status(400).json({ success: false, message: 'Domaine non autorisé' })
      }
    } catch {
      return res.status(400).json({ success: false, message: 'URL invalide' })
    }

    try {
      const fetchRes = await fetch(filePath)
      if (!fetchRes.ok) return res.status(fetchRes.status).json({ success: false, message: 'Fichier inaccessible' })
      const buffer = Buffer.from(await fetchRes.arrayBuffer())
      const ct = fetchRes.headers.get('content-type') || 'application/octet-stream'
      res.setHeader('Content-Type', ct)
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.send(buffer)
    } catch {
      return res.status(502).json({ success: false, message: 'Impossible de récupérer le fichier distant' })
    }
  }

  if (!filePath.startsWith('/uploads/')) {
    return res.status(400).json({ success: false, message: 'Chemin invalide' })
  }

  // Prevent path traversal
  const safeName = path.basename(filePath)
  const absolutePath = path.join(path.resolve(env.UPLOAD_DIR), safeName)
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'Fichier introuvable — le serveur a peut-être redémarré. Veuillez réuploader le document.' })
  }
  const ext = path.extname(safeName).toLowerCase()
  const mime =
    ext === '.pdf' ? 'application/pdf' :
    ext === '.png' ? 'image/png' :
    ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
    ext === '.webp' ? 'image/webp' :
    'application/octet-stream'
  res.setHeader('Content-Type', mime)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, no-store')
  fs.createReadStream(absolutePath).pipe(res)
})

// POST /api/v1/documents - Upload a document
router.post(
  '/',
  uploadFile.single('file'),
  documentController.uploadDocument.bind(documentController)
)

// GET /api/v1/documents/contract/:contractId - Get all documents for a contract
router.get(
  '/contract/:contractId',
  documentController.getDocuments.bind(documentController)
)

// GET /api/v1/documents/contract/:contractId/checklist - Get checklist status
router.get(
  '/contract/:contractId/checklist',
  documentController.getChecklist.bind(documentController)
)

// DELETE /api/v1/documents/:id - Delete a document
router.delete(
  '/:id',
  documentController.deleteDocument.bind(documentController)
)

// PUT /api/v1/documents/:id/status - Validate or reject a document
router.put(
  '/:id/status',
  documentController.updateStatus.bind(documentController)
)

// POST /api/v1/documents/send-letter — Send a document/letter by email (OWNER only)
router.post('/send-letter', authorize('OWNER'), async (req: Request, res: Response) => {
  const { to, subject, content, tenantName } = req.body as {
    to?: string
    subject?: string
    content?: string
    tenantName?: string
  }

  if (!to || !subject || !content) {
    return res.status(400).json({ success: false, message: 'Les champs to, subject et content sont obligatoires' })
  }

  const recipientLabel = tenantName ? tenantName : to

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Times New Roman',Times,serif;color:#000000;">
  <div style="max-width:680px;margin:40px auto;padding:40px 48px;background:#ffffff;">
    ${tenantName ? `<p style="margin:0 0 24px;font-size:16px;">À l'attention de ${recipientLabel},</p>` : ''}
    <div style="font-size:16px;line-height:1.8;">
      ${content.split('\n').map((line: string) => line.trim() === '' ? '<br>' : `<p style="margin:0 0 8px;">${line}</p>`).join('')}
    </div>
  </div>
</body>
</html>`

  const sent = await sendEmail({ to, subject, html })

  if (!sent) {
    return res.status(500).json({ success: false, message: "Échec de l'envoi de l'email" })
  }

  return res.status(200).json({ success: true, message: 'Email envoyé' })
})

export default router
