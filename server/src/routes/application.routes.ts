import { Router } from 'express'
import { applicationController } from '../controllers/application.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { requireIdentityVerified } from '../middlewares/identity.middleware.js'
import { requireEmailVerified } from '../middlewares/emailVerified.middleware.js'

const router = Router()

router.use(authenticate)

// Live pre-qualification check (no DB write)
router.get('/prequalify/:propertyId', applicationController.prequalify.bind(applicationController))

// CRUD
router.get('/',    applicationController.list.bind(applicationController))
router.post('/',   requireEmailVerified, requireIdentityVerified, applicationController.create.bind(applicationController))
router.get('/:id', applicationController.getOne.bind(applicationController))

// Owner decision — authorize OWNER pour éviter qu'un TENANT modifie le statut de sa candidature
router.patch('/:id/status', authorize('OWNER'), applicationController.updateStatus.bind(applicationController))

// Owner cancels a rejection
router.patch('/:id/unreject', authorize('OWNER'), applicationController.unreject.bind(applicationController))

// Owner triggers AI commentary on a candidature
router.post('/:id/ai-score', authorize('OWNER'), applicationController.aiScore.bind(applicationController))

// Tenant withdraws
router.delete('/:id', applicationController.withdraw.bind(applicationController))

export default router
