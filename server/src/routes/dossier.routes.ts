import { Router } from 'express'
import { dossierController } from '../controllers/dossier.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'

const router = Router()

router.use(authenticate)

// GET /api/v1/dossier - list all documents for authenticated user
router.get('/', dossierController.getDocuments.bind(dossierController))

// GET /api/v1/dossier/tenant/:tenantId - owner view of tenant dossier
router.get('/tenant/:tenantId', dossierController.getTenantDossier.bind(dossierController))

// POST /api/v1/dossier - upload a dossier document
router.post('/', uploadFile.single('file'), dossierController.uploadDocument.bind(dossierController))

// PATCH /api/v1/dossier/profile - save AI-extracted profile data to user account
router.patch('/profile', dossierController.saveProfile.bind(dossierController))

// PATCH /api/v1/dossier/:id - reassign document to another slot (swaps if occupied)
router.patch('/:id', dossierController.reassignDocument.bind(dossierController))

// DELETE /api/v1/dossier/:id - delete a document
router.delete('/:id', dossierController.deleteDocument.bind(dossierController))

export default router
