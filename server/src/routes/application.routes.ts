import { Router } from 'express'
import { applicationController } from '../controllers/application.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authenticate)

// Live pre-qualification check (no DB write)
router.get('/prequalify/:propertyId', applicationController.prequalify.bind(applicationController))

// CRUD
router.get('/',    applicationController.list.bind(applicationController))
router.post('/',   applicationController.create.bind(applicationController))
router.get('/:id', applicationController.getOne.bind(applicationController))

// Owner decision
router.patch('/:id/status', applicationController.updateStatus.bind(applicationController))

// Owner cancels a rejection
router.patch('/:id/unreject', applicationController.unreject.bind(applicationController))

// Tenant withdraws
router.delete('/:id', applicationController.withdraw.bind(applicationController))

export default router
