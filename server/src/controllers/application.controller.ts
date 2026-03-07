import { Request, Response, NextFunction } from 'express'
import { ApplicationStatus } from '@prisma/client'
import { applicationService } from '../services/application.service.js'

class ApplicationController {
  /** GET /api/v1/applications/prequalify/:propertyId — live eligibility check */
  async prequalify(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { propertyId } = req.params
      const hasGuarantor = req.query.hasGuarantor === 'true'
      const guarantorType = typeof req.query.guarantorType === 'string' ? req.query.guarantorType : undefined
      const result = await applicationService.prequalify(propertyId, userId, hasGuarantor, guarantorType)
      return res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/v1/applications — submit a candidature */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.id
      if (!tenantId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { propertyId, coverLetter, hasGuarantor, guarantorType } = req.body
      if (!propertyId) return res.status(400).json({ success: false, message: 'propertyId requis' })
      const app = await applicationService.createApplication({ propertyId, tenantId, coverLetter, hasGuarantor, guarantorType })
      return res.status(201).json({ success: true, data: app })
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ success: false, message: error.message })
      next(error)
    }
  }

  /** GET /api/v1/applications — list (role-aware) */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const role = req.user?.role ?? 'TENANT'
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined
      const apps = await applicationService.listApplications(userId, role, propertyId)
      return res.json({ success: true, data: apps })
    } catch (error) {
      next(error)
    }
  }

  /** GET /api/v1/applications/:id */
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const role = req.user?.role ?? 'TENANT'
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const app = await applicationService.getApplication(req.params.id, userId, role)
      return res.json({ success: true, data: app })
    } catch (error) {
      if (error instanceof Error) return res.status(404).json({ success: false, message: error.message })
      next(error)
    }
  }

  /** PATCH /api/v1/applications/:id/status — owner approves or rejects */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.id
      if (!ownerId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { status } = req.body as { status: ApplicationStatus }
      const app = await applicationService.updateStatus(req.params.id, ownerId, status)
      return res.json({ success: true, data: app })
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ success: false, message: error.message })
      next(error)
    }
  }

  /** DELETE /api/v1/applications/:id — tenant withdraws */
  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.id
      if (!tenantId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      await applicationService.withdraw(req.params.id, tenantId)
      return res.json({ success: true, message: 'Candidature retirée' })
    } catch (error) {
      if (error instanceof Error) return res.status(400).json({ success: false, message: error.message })
      next(error)
    }
  }
}

export const applicationController = new ApplicationController()
