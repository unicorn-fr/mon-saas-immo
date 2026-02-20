import { Router } from 'express'
import { documentController } from '../controllers/document.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'

const router = Router()

// All document routes require authentication
router.use(authenticate)

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
