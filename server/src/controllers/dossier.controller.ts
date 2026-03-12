import { Request, Response, NextFunction } from 'express'
import { dossierService, ProfileData } from '../services/dossier.service.js'
import { saveFile } from '../utils/upload.util.js'

class DossierController {
  /**
   * GET /api/v1/dossier
   * Get all dossier documents for the authenticated tenant
   */
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentification requise' })
      }
      const docs = await dossierService.getDocuments(userId)
      return res.json({ success: true, data: docs })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/dossier
   * Upload a dossier document (PDF or image, 5 MB max)
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentification requise' })
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucun fichier fourni' })
      }

      const { category, docType } = req.body
      if (!category || !docType) {
        return res.status(400).json({ success: false, message: 'Categorie et type de document requis' })
      }

      const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ]
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Format non accepte. Utilisez PDF, JPEG, PNG ou WebP.',
        })
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Le fichier ne doit pas depasser 5 Mo' })
      }

      const fileUrl = saveFile(req.file.buffer, req.file.originalname)

      const doc = await dossierService.createDocument({
        userId,
        category,
        docType,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      })

      return res.status(201).json({ success: true, data: doc })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/dossier/profile
   * Save AI-extracted profile data (identity, salary, employer…) to user account.
   */
  async saveProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentification requise' })
      }
      const data: ProfileData = req.body
      await dossierService.saveProfile(userId, data)
      return res.json({ success: true, message: 'Profil mis à jour' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/dossier/:id
   * Reassign a document to a different slot (category + docType). Swaps if target occupied.
   */
  async reassignDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Authentification requise' })
      const { category, docType } = req.body
      if (!category || !docType) return res.status(400).json({ success: false, message: 'category et docType requis' })
      const result = await dossierService.reassignDocument(req.params.id, userId, category, docType)
      return res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof Error) return res.status(404).json({ success: false, message: error.message })
      next(error)
    }
  }

  /**
   * GET /api/v1/dossier/tenant/:tenantId
   * Owner-only: view all documents for a specific tenant.
   */
  async getTenantDossier(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.id
      if (!requesterId) return res.status(401).json({ success: false, message: 'Authentification requise' })
      const { tenantId } = req.params
      const data = await dossierService.getTenantDossier(tenantId, requesterId)
      return res.json({ success: true, data })
    } catch (error) {
      if (error instanceof Error) return res.status(403).json({ success: false, message: error.message })
      next(error)
    }
  }

  /**
   * DELETE /api/v1/dossier/:id
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentification requise' })
      }
      await dossierService.deleteDocument(req.params.id, userId)
      return res.json({ success: true, message: 'Document supprime' })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ success: false, message: error.message })
      }
      next(error)
    }
  }
}

export const dossierController = new DossierController()
