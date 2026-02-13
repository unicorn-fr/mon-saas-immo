import { Router } from 'express'
import { adminController } from '../controllers/admin.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * All routes require authentication and ADMIN role
 */
router.use(authenticate)
router.use(authorize('ADMIN'))

// GET /api/v1/admin/statistics - Get platform statistics
router.get('/statistics', adminController.getPlatformStatistics.bind(adminController))

// GET /api/v1/admin/activity - Get recent activity
router.get('/activity', adminController.getRecentActivity.bind(adminController))

// GET /api/v1/admin/users - Get all users
router.get('/users', adminController.getUsers.bind(adminController))

// GET /api/v1/admin/users/:id - Get user by ID
router.get('/users/:id', adminController.getUserById.bind(adminController))

// PUT /api/v1/admin/users/:id/role - Update user role
router.put('/users/:id/role', adminController.updateUserRole.bind(adminController))

// DELETE /api/v1/admin/users/:id - Delete user
router.delete('/users/:id', adminController.deleteUser.bind(adminController))

export default router
