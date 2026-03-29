import { Request, Response } from 'express'
import { waitlistService } from '../services/waitlist.service.js'
import { env } from '../config/env.js'

export const waitlistController = {
  async join(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body

      if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, message: 'Email requis' })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ success: false, message: 'Email invalide' })
        return
      }

      const result = await waitlistService.join(email.trim().toLowerCase())

      res.status(result.alreadyRegistered ? 200 : 201).json({
        success: true,
        data: {
          position: result.position,
          isEarlyAccess: result.isEarlyAccess,
          alreadyRegistered: result.alreadyRegistered,
        },
      })
    } catch (error) {
      console.error('[waitlist] join error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  async count(req: Request, res: Response): Promise<void> {
    try {
      const total = await waitlistService.getCount()
      res.json({ success: true, data: { total } })
    } catch (error) {
      console.error('[waitlist] count error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  /**
   * POST /api/waitlist/notify-all
   * Protected by: Authorization: Bearer <NOTIFY_SECRET>
   * Sends launch emails to all non-notified entries (batches of 50).
   */
  async notifyAll(req: Request, res: Response): Promise<void> {
    try {
      // Check bearer token
      const authHeader = req.headers['authorization']
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (!env.NOTIFY_SECRET || !token || token !== env.NOTIFY_SECRET) {
        res.status(401).json({ success: false, message: 'Non autorisé' })
        return
      }

      const { sent, errors } = await waitlistService.notifyAll()

      res.json({
        success: true,
        data: { sent, errors },
        message: `${sent} email(s) envoyé(s), ${errors} erreur(s)`,
      })
    } catch (error) {
      console.error('[waitlist] notifyAll error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },
}
