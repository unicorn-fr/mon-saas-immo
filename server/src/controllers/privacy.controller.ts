import { Request, Response, NextFunction } from 'express'
import { privacyService } from '../services/privacy.service.js'

class PrivacyController {
  /**
   * GET /api/v1/privacy/export
   * Returns all personal data as JSON (RGPD Art. 20 — portabilité).
   */
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Authentification requise' })
      const data = await privacyService.exportUserData(userId)
      // Send as downloadable JSON file
      res.setHeader('Content-Disposition', `attachment; filename="mes-donnees-immoparticuliers-${new Date().toISOString().split('T')[0]}.json"`)
      res.setHeader('Content-Type', 'application/json')
      return res.json(data)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/v1/privacy/account
   * Permanently deletes the account + all data (RGPD Art. 17 — droit à l'oubli).
   * Body: { confirmEmail: string } — must match the user's email as double confirmation.
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      const userEmail = req.user?.email
      if (!userId) return res.status(401).json({ success: false, message: 'Authentification requise' })

      const { confirmEmail } = req.body
      if (!confirmEmail || confirmEmail.trim().toLowerCase() !== userEmail?.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "L'adresse e-mail de confirmation ne correspond pas à votre compte.",
        })
      }

      await privacyService.deleteAccount(userId)
      return res.json({ success: true, message: 'Compte et données supprimés définitivement.' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/privacy/access-log
   * Returns the list of owners who accessed the tenant's dossier.
   */
  async getAccessLog(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Authentification requise' })
      const logs = await privacyService.getAccessLog(userId)
      return res.json({ success: true, data: logs })
    } catch (error) {
      next(error)
    }
  }
}

export const privacyController = new PrivacyController()
