import { Request, Response, NextFunction } from 'express'
import { edlService, addSseClient, removeSseClient, broadcastEdlUpdate } from '../services/edl.service.js'

class EdlController {
  /** POST /api/v1/edl/sessions — Owner crée/récupère la session d'un contrat */
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user?.id
      if (!ownerId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { contractId, edlType } = req.body
      if (!contractId) return res.status(400).json({ success: false, message: 'contractId requis' })
      const session = await edlService.createOrGetSession(contractId, ownerId, edlType ?? 'ENTREE')
      return res.status(201).json({ success: true, data: { session } })
    } catch (e) {
      if (e instanceof Error) return res.status(400).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** POST /api/v1/edl/sessions/join — Locataire rejoint via PIN */
  async joinSession(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.id
      if (!tenantId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { pin } = req.body
      if (!pin) return res.status(400).json({ success: false, message: 'pin requis' })
      const session = await edlService.joinSession(String(pin), tenantId)
      return res.json({ success: true, data: { session } })
    } catch (e) {
      if (e instanceof Error) return res.status(400).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** GET /api/v1/edl/sessions/:id — Récupère une session */
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const session = await edlService.getSession(req.params.id, userId)
      return res.json({ success: true, data: { session } })
    } catch (e) {
      if (e instanceof Error) return res.status(403).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** GET /api/v1/edl/sessions/by-contract/:contractId — Session d'un contrat */
  async getByContract(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const session = await edlService.getSessionByContract(req.params.contractId, userId)
      return res.json({ success: true, data: { session } })
    } catch (e) {
      if (e instanceof Error) return res.status(403).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** PATCH /api/v1/edl/sessions/:id/data — Met à jour les données EDL */
  async updateData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const { patch } = req.body
      if (!patch || typeof patch !== 'object') return res.status(400).json({ success: false, message: 'patch requis' })
      const data = await edlService.updateData(req.params.id, userId, patch)
      return res.json({ success: true, data: { data } })
    } catch (e) {
      if (e instanceof Error) return res.status(400).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** POST /api/v1/edl/sessions/:id/complete — Finalise la session */
  async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })
      const session = await edlService.completeSession(req.params.id, userId)
      return res.json({ success: true, data: { session } })
    } catch (e) {
      if (e instanceof Error) return res.status(400).json({ success: false, message: e.message })
      next(e)
    }
  }

  /** GET /api/v1/edl/sessions/:id/stream — SSE temps réel */
  streamSession(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) { res.status(401).end(); return }

    const { id: sessionId } = req.params

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    // Ping initial pour confirmer la connexion
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', sessionId })}\n\n`)

    const client = { res, userId }
    addSseClient(sessionId, client)

    // Keepalive toutes les 25s
    const keepAlive = setInterval(() => {
      try { res.write(': keepalive\n\n') } catch { clearInterval(keepAlive) }
    }, 25000)

    req.on('close', () => {
      clearInterval(keepAlive)
      removeSseClient(sessionId, client)
      broadcastEdlUpdate(sessionId, userId, { type: 'PEER_DISCONNECTED', userId })
    })
  }
}

export const edlController = new EdlController()
