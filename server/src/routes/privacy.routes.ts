import { Router } from 'express'
import { privacyController } from '../controllers/privacy.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(authenticate)

// GET  /api/v1/privacy/export       — download all personal data (RGPD Art. 20)
router.get('/export', privacyController.exportData.bind(privacyController))

// GET  /api/v1/privacy/access-log   — who viewed my dossier
router.get('/access-log', privacyController.getAccessLog.bind(privacyController))

// DELETE /api/v1/privacy/account    — permanent account erasure (RGPD Art. 17)
router.delete('/account', privacyController.deleteAccount.bind(privacyController))

export default router
