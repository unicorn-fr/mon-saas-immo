import { Request, Response } from 'express'
import { waitlistService } from '../services/waitlist.service.js'

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
}
