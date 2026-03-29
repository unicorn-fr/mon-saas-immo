import { Request, Response, NextFunction } from 'express'
import { waitlistService } from '../services/waitlist.service.js'
import { env } from '../config/env.js'

// ── Shared bearer middleware ──────────────────────────────────────────────────

export function requireNotifySecret(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!env.NOTIFY_SECRET || !token || token !== env.NOTIFY_SECRET) {
    res.status(401).json({ success: false, message: 'Non autorisé' })
    return
  }
  next()
}

// ── Public handlers ───────────────────────────────────────────────────────────

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

  // ── Admin / protected handlers ──────────────────────────────────────────────

  async notifyAll(req: Request, res: Response): Promise<void> {
    try {
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

  async stats(req: Request, res: Response): Promise<void> {
    try {
      const data = await waitlistService.getStats()
      res.json({ success: true, data })
    } catch (error) {
      console.error('[waitlist] stats error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10))
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)))
      const data = await waitlistService.getPaginated(page, limit)
      res.json({ success: true, data })
    } catch (error) {
      console.error('[waitlist] list error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const entries = await waitlistService.exportAll()
      const header = 'position,email,is_early_access,notified,created_at'
      const rows = entries.map((e) =>
        [
          e.position,
          e.email,
          e.isEarlyAccess ? 'true' : 'false',
          e.notifiedAt ? 'true' : 'false',
          new Date(e.createdAt).toISOString(),
        ].join(','),
      )
      const csv = [header, ...rows].join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"')
      res.send(csv)
    } catch (error) {
      console.error('[waitlist] export error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  async addManual(req: Request, res: Response): Promise<void> {
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
      res.status(result.alreadyRegistered ? 200 : 201).json({ success: true, data: result })
    } catch (error) {
      console.error('[waitlist] addManual error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },

  async deleteEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      await waitlistService.deleteById(id)
      res.json({ success: true })
    } catch (error) {
      console.error('[waitlist] delete error:', error)
      res.status(500).json({ success: false, message: 'Erreur serveur' })
    }
  },
}
