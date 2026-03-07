import { Request, Response, NextFunction } from 'express'
import { superAdminService } from '../services/superAdmin.service.js'
import { UserRole } from '@prisma/client'

class SuperAdminController {
  // ── STATS ──────────────────────────────────────

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await superAdminService.getPlatformStats()
      return res.json({ success: true, data: stats })
    } catch (e) { next(e) }
  }

  // ── AUDIT LOGS ─────────────────────────────────

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
      const filters = {
        action: req.query.action as string | undefined,
        severity: req.query.severity as string | undefined,
      }
      const result = await superAdminService.getAuditLogs(page, limit, filters)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }

  // ── USERS ──────────────────────────────────────

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30
      const filters = {
        role: req.query.role as string | undefined,
        search: req.query.search as string | undefined,
        emailVerified: req.query.emailVerified !== undefined
          ? req.query.emailVerified === 'true' : undefined,
      }
      const result = await superAdminService.getAllUsers(page, limit, filters)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }

  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await superAdminService.getUserDetail(req.params.id)
      // Audit: super admin viewed user profile
      await superAdminService.createAuditLog({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'VIEW_USER_PROFILE',
        resource: 'User',
        resourceId: req.params.id,
        metadata: { targetEmail: (user as any).email },
        severity: 'INFO',
      })
      return res.json({ success: true, data: { user } })
    } catch (e) {
      if (e instanceof Error && e.message === 'User not found')
        return res.status(404).json({ success: false, message: 'User not found' })
      next(e)
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body
      if (!role || !Object.values(UserRole).includes(role))
        return res.status(400).json({ success: false, message: 'Invalid role' })

      const user = await superAdminService.updateUserRole(
        req.params.id, role,
        req.user!.id, req.user!.email
      )
      return res.json({ success: true, data: { user } })
    } catch (e) { next(e) }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.id === req.params.id)
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' })

      const result = await superAdminService.deleteUser(
        req.params.id, req.user!.id, req.user!.email
      )
      return res.json({ success: true, message: result.message })
    } catch (e) {
      if (e instanceof Error && e.message === 'User not found')
        return res.status(404).json({ success: false, message: 'User not found' })
      next(e)
    }
  }

  async forceVerifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await superAdminService.forceVerifyEmail(
        req.params.id, req.user!.id, req.user!.email
      )
      return res.json({ success: true, data: { user } })
    } catch (e) { next(e) }
  }

  // ── DOSSIERS ───────────────────────────────────

  async getDossiers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30
      const filters = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
      }
      const result = await superAdminService.getAllDossiers(page, limit, filters)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }

  async updateDocumentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, note } = req.body
      const allowed = ['PENDING', 'UPLOADED', 'VALIDATED', 'REJECTED']
      if (!allowed.includes(status))
        return res.status(400).json({ success: false, message: 'Invalid status' })

      const doc = await superAdminService.updateDocumentStatus(
        req.params.id, status, note,
        req.user!.id, req.user!.email
      )
      return res.json({ success: true, data: { doc } })
    } catch (e) { next(e) }
  }

  // ── DB EXPLORER ────────────────────────────────

  async getTableList(_req: Request, res: Response, next: NextFunction) {
    try {
      const tables = await superAdminService.getTableList()
      return res.json({ success: true, data: { tables } })
    } catch (e) { next(e) }
  }

  async queryTable(req: Request, res: Response, next: NextFunction) {
    try {
      const table = req.params.table
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
      const result = await superAdminService.queryTable(table, page, limit)
      return res.json({ success: true, data: result })
    } catch (e) {
      if (e instanceof Error && e.message === 'Table not allowed')
        return res.status(403).json({ success: false, message: 'Table not allowed' })
      next(e)
    }
  }

  // ── MESSAGES ───────────────────────────────────

  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30
      const search = req.query.search as string | undefined
      const result = await superAdminService.getAllConversations(page, limit, search)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }

  async getConversationMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const result = await superAdminService.getConversationMessages(req.params.id, page)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }

  // ── CONTRACTS ──────────────────────────────────

  async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30
      const filters = { status: req.query.status as string | undefined }
      const result = await superAdminService.getAllContracts(page, limit, filters)
      return res.json({ success: true, data: result })
    } catch (e) { next(e) }
  }
}

export const superAdminController = new SuperAdminController()
