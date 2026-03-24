import { Router } from 'express'
import { documentController } from '../controllers/document.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'
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

export default router
