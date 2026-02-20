import { Request, Response, NextFunction } from 'express'
import { documentService } from '../services/document.service.js'
import { saveFile } from '../utils/upload.util.js'

class DocumentController {
  /**
   * POST /api/v1/documents
   * Upload a document for a contract
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { contractId, category } = req.body

      if (!contractId || !category) {
        return res.status(400).json({
          success: false,
          message: 'contractId et category sont requis',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni',
        })
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Seuls les fichiers PDF sont acceptes',
        })
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Le fichier ne doit pas depasser 5 Mo',
        })
      }

      const fileUrl = saveFile(req.file.buffer, req.file.originalname)

      const document = await documentService.createDocument({
        contractId,
        uploadedById: userId,
        category,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      })

      return res.status(201).json({
        success: true,
        message: 'Document televerse avec succes',
        data: document,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/documents/contract/:contractId
   * Get all documents for a contract
   */
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { contractId } = req.params

      const documents = await documentService.getDocumentsByContract(contractId, userId)

      return res.json({
        success: true,
        data: documents,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/documents/contract/:contractId/checklist
   * Get checklist status for a contract
   */
  async getChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { contractId } = req.params

      const checklist = await documentService.getChecklistStatus(contractId, userId)

      return res.json({
        success: true,
        data: checklist,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/v1/documents/:id
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { id } = req.params

      await documentService.deleteDocument(id, userId)

      return res.json({
        success: true,
        message: 'Document supprime',
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/documents/:id/status
   * Validate or reject a document (owner only)
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { id } = req.params
      const { status, rejectionReason } = req.body

      if (!status || !['VALIDATED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status invalide. Utilisez VALIDATED ou REJECTED.',
        })
      }

      const document = await documentService.updateDocumentStatus(id, userId, status, rejectionReason)

      return res.json({
        success: true,
        message: status === 'VALIDATED' ? 'Document valide' : 'Document refuse',
        data: document,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
      next(error)
    }
  }
}

export const documentController = new DocumentController()
