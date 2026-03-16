import { Router } from 'express'
import { dossierController } from '../controllers/dossier.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'

const router = Router()

router.use(authenticate)

// GET  /api/v1/dossier              — list all documents for authenticated user
router.get('/', dossierController.getDocuments.bind(dossierController))

// GET  /api/v1/dossier/shares       — list all dossier shares (tenant only)
router.get('/shares', dossierController.listShares.bind(dossierController))

// GET  /api/v1/dossier/tenant/:tenantId  — owner view of tenant dossier (requires active share)
router.get('/tenant/:tenantId', dossierController.getTenantDossier.bind(dossierController))

// GET  /api/v1/dossier/docs/:docId/view  — serve document with watermark (owner)
router.get('/docs/:docId/view', dossierController.viewDocument.bind(dossierController))

// GET  /api/v1/dossier/profile/:userId   — public trust profile
router.get('/profile/:userId', dossierController.getPublicProfile.bind(dossierController))

// POST /api/v1/dossier              — upload a dossier document
router.post('/', uploadFile.single('file'), dossierController.uploadDocument.bind(dossierController))

// POST /api/v1/dossier/share        — tenant grants access to an owner
router.post('/share', dossierController.grantShare.bind(dossierController))

// POST /api/v1/dossier/report       — report a suspicious user
router.post('/report', dossierController.reportUser.bind(dossierController))

// PATCH /api/v1/dossier/profile     — save AI-extracted profile data to user account
router.patch('/profile', dossierController.saveProfile.bind(dossierController))

// PATCH /api/v1/dossier/:id         — reassign document to another slot
router.patch('/:id', dossierController.reassignDocument.bind(dossierController))

// DELETE /api/v1/dossier/share/:ownerId  — revoke a share
router.delete('/share/:ownerId', dossierController.revokeShare.bind(dossierController))

// DELETE /api/v1/dossier/:id        — delete a document
router.delete('/:id', dossierController.deleteDocument.bind(dossierController))

export default router
