import { Request, Response, NextFunction } from 'express'
import { adminService } from '../services/admin.service.js'
import { UserRole } from '@prisma/client'

class AdminController {
  /**
   * GET /api/v1/admin/statistics
   * Get platform-wide statistics
   */
  async getPlatformStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await adminService.getPlatformStatistics()

      return res.status(200).json({
        success: true,
        data: { statistics },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/admin/users
   * Get all users with filters
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, emailVerified, searchQuery, page, limit } = req.query

      const filters: any = {}
      if (role) filters.role = role as UserRole
      if (emailVerified !== undefined) filters.emailVerified = emailVerified === 'true'
      if (searchQuery) filters.searchQuery = searchQuery as string

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      }

      const result = await adminService.getUsers(filters, pagination.page, pagination.limit)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   * Get user details
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const user = await adminService.getUserById(id)

      return res.status(200).json({
        success: true,
        data: { user },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/admin/users/:id/role
   * Update user role
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { role } = req.body

      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        })
      }

      const user = await adminService.updateUserRole(id, role)

      return res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: { user },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/v1/admin/users/:id
   * Delete user
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        })
      }

      const result = await adminService.deleteUser(id)

      return res.status(200).json({
        success: true,
        message: result.message,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/admin/activity
   * Get recent platform activity
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query
      const activityLimit = limit ? parseInt(limit as string) : 20

      const activity = await adminService.getRecentActivity(activityLimit)

      return res.status(200).json({
        success: true,
        data: { activity },
      })
    } catch (error) {
      next(error)
    }
  }
}

export const adminController = new AdminController()
