import { Router } from 'express'
import { contractController } from '../controllers/contract.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * All routes require authentication
 */
router.use(authenticate)

// GET /api/v1/contracts/statistics - Get contract statistics
router.get('/statistics', contractController.getStatistics.bind(contractController))

// GET /api/v1/contracts - Get all contracts (filtered by user role)
router.get('/', contractController.getContracts.bind(contractController))

// POST /api/v1/contracts - Create new contract (owner only)
router.post(
  '/',
  authorize('OWNER'),
  contractController.createContract.bind(contractController)
)

// GET /api/v1/contracts/:id - Get contract by ID
router.get('/:id', contractController.getContractById.bind(contractController))

// PUT /api/v1/contracts/:id - Update contract (owner only)
router.put(
  '/:id',
  authorize('OWNER'),
  contractController.updateContract.bind(contractController)
)

// DELETE /api/v1/contracts/:id - Delete contract (owner only)
router.delete(
  '/:id',
  authorize('OWNER'),
  contractController.deleteContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/send - Send contract to tenant (owner only)
router.put(
  '/:id/send',
  authorize('OWNER'),
  contractController.sendContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/sign - Sign contract (owner or tenant)
router.put('/:id/sign', contractController.signContract.bind(contractController))

// PUT /api/v1/contracts/:id/activate - Activate contract (owner only)
router.put(
  '/:id/activate',
  authorize('OWNER'),
  contractController.activateContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/terminate - Terminate contract (owner only)
router.put(
  '/:id/terminate',
  authorize('OWNER'),
  contractController.terminateContract.bind(contractController)
)

export default router
