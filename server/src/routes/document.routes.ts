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
router.get('/proxy', (req, res) => {
  const filePath = req.query.path as string
  if (!filePath || !filePath.startsWith('/uploads/')) {
    return res.status(400).json({ success: false, message: 'Invalid path' })
  }
  // Prevent path traversal
  const safeName = path.basename(filePath)
  const absolutePath = path.join(path.resolve(env.UPLOAD_DIR), safeName)
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File not found' })
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
