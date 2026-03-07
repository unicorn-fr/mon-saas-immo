import { Router } from 'express'
import { superAdminController } from '../controllers/superAdmin.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import {
  superAdminRateLimiter,
  require2FA,
  validateBody,
  validateQuery,
  UpdateRoleSchema,
  UpdateDocStatusSchema,
  PaginationSchema,
} from '../middlewares/security.middleware.js'

const router = Router()

// All routes: authenticated + SUPER_ADMIN only + 2FA enforced + rate limited
router.use(authenticate)
router.use(authorize('SUPER_ADMIN'))
router.use(require2FA)
router.use(superAdminRateLimiter)

// ── Stats ──────────────────────────────────────
router.get('/stats', superAdminController.getStats.bind(superAdminController))

// ── Audit Logs ─────────────────────────────────
router.get('/audit-logs', validateQuery(PaginationSchema), superAdminController.getAuditLogs.bind(superAdminController))

// ── Users ──────────────────────────────────────
router.get('/users', validateQuery(PaginationSchema), superAdminController.getUsers.bind(superAdminController))
router.get('/users/:id', superAdminController.getUserDetail.bind(superAdminController))
router.put('/users/:id/role', validateBody(UpdateRoleSchema), superAdminController.updateUserRole.bind(superAdminController))
router.delete('/users/:id', superAdminController.deleteUser.bind(superAdminController))
router.post('/users/:id/verify-email', superAdminController.forceVerifyEmail.bind(superAdminController))

// ── Dossiers ───────────────────────────────────
router.get('/dossiers', validateQuery(PaginationSchema), superAdminController.getDossiers.bind(superAdminController))
router.put('/dossiers/:id/status', validateBody(UpdateDocStatusSchema), superAdminController.updateDocumentStatus.bind(superAdminController))

// ── DB Explorer (read-only) ────────────────────
router.get('/db/tables', superAdminController.getTableList.bind(superAdminController))
router.get('/db/tables/:table', superAdminController.queryTable.bind(superAdminController))

// ── Messages ───────────────────────────────────
router.get('/conversations', validateQuery(PaginationSchema), superAdminController.getConversations.bind(superAdminController))
router.get('/conversations/:id/messages', superAdminController.getConversationMessages.bind(superAdminController))

// ── Contracts ──────────────────────────────────
router.get('/contracts', validateQuery(PaginationSchema), superAdminController.getContracts.bind(superAdminController))

export default router
