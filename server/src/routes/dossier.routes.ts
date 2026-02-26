import { Router } from 'express'
import { dossierController } from '../controllers/dossier.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { uploadFile } from '../utils/upload.util.js'

const router = Router()

router.use(authenticate)

// GET /api/v1/dossier - list all documents for authenticated user
router.get('/', dossierController.getDocuments.bind(dossierController))

// POST /api/v1/dossier - upload a dossier document
router.post('/', uploadFile.single('file'), dossierController.uploadDocument.bind(dossierController))

// DELETE /api/v1/dossier/:id - delete a document
router.delete('/:id', dossierController.deleteDocument.bind(dossierController))

export default router
