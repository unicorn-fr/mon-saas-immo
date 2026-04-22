import { prisma } from '../config/database.js'
import { EdlSessionStatus } from '@prisma/client'

// ── SSE clients map ─────────────────────────────────────────────────────────
// sessionId → Set of Response objects (owner + tenant)
type SseClient = { res: any; userId: string }
const sseClients = new Map<string, Set<SseClient>>()

export function addSseClient(sessionId: string, client: SseClient) {
  if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set())
  sseClients.get(sessionId)!.add(client)
}

export function removeSseClient(sessionId: string, client: SseClient) {
  sseClients.get(sessionId)?.delete(client)
}

export function broadcastEdlUpdate(sessionId: string, senderId: string, payload: unknown) {
  const clients = sseClients.get(sessionId)
  if (!clients) return
  const msg = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of clients) {
    if (client.userId !== senderId) {
      try { client.res.write(msg) } catch { /* client disconnected */ }
    }
  }
}

// ── Service ─────────────────────────────────────────────────────────────────

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

class EdlService {
  /**
   * Owner crée ou récupère la session EDL d'un contrat
   */
  async createOrGetSession(contractId: string, ownerId: string, edlType: 'ENTREE' | 'SORTIE' = 'ENTREE') {
    const existing = await prisma.edlSession.findUnique({ where: { contractId } })
    if (existing) {
      // Réinitialise si déjà complétée
      if (existing.status === 'COMPLETED') {
        return prisma.edlSession.update({
          where: { contractId },
          data: { pin: generatePin(), status: 'WAITING', tenantId: null, edlType, data: {}, updatedAt: new Date() },
        })
      }
      return existing
    }

    const contract = await prisma.contract.findUnique({ where: { id: contractId } })
    if (!contract) throw new Error('Contrat introuvable')
    if (contract.ownerId !== ownerId) throw new Error('Accès refusé')

    return prisma.edlSession.create({
      data: { contractId, ownerId, pin: generatePin(), edlType, data: {} },
    })
  }

  /**
   * Locataire rejoint une session via PIN
   */
  async joinSession(pin: string, tenantId: string) {
    const session = await prisma.edlSession.findFirst({ where: { pin, status: 'WAITING' } })
    if (!session) throw new Error('Code PIN invalide ou session déjà active')

    const updated = await prisma.edlSession.update({
      where: { id: session.id },
      data: { tenantId, status: 'ACTIVE' },
      include: { contract: { select: { id: true, propertyId: true } } },
    })

    // Notifie le propriétaire que le locataire a rejoint
    broadcastEdlUpdate(session.id, tenantId, { type: 'TENANT_JOINED', tenantId })

    return updated
  }

  /**
   * Récupère une session par ID (avec vérification accès)
   */
  async getSession(sessionId: string, userId: string) {
    const session = await prisma.edlSession.findUnique({
      where: { id: sessionId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
        contract: { select: { id: true, propertyId: true, property: { select: { title: true, address: true } } } },
      },
    })
    if (!session) throw new Error('Session introuvable')
    if (session.ownerId !== userId && session.tenantId !== userId) throw new Error('Accès refusé')
    return session
  }

  /**
   * Récupère la session d'un contrat (accès owner ou tenant du contrat)
   */
  async getSessionByContract(contractId: string, userId: string) {
    const session = await prisma.edlSession.findUnique({
      where: { contractId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } },
        contract: { select: { id: true, propertyId: true, property: { select: { title: true, address: true } } } },
      },
    })
    if (!session) return null
    if (session.ownerId !== userId && session.tenantId !== userId) throw new Error('Accès refusé')
    return session
  }

  /**
   * Met à jour les données EDL (pièce, élément, photo) — et broadcast aux autres
   */
  async updateData(sessionId: string, userId: string, patch: Record<string, unknown>) {
    const session = await prisma.edlSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new Error('Session introuvable')
    if (session.ownerId !== userId && session.tenantId !== userId) throw new Error('Accès refusé')
    if (session.status !== 'ACTIVE') throw new Error('Session non active')

    const currentData = (session.data ?? {}) as Record<string, unknown>
    const newData = { ...currentData, ...patch }

    await prisma.edlSession.update({ where: { id: sessionId }, data: { data: newData as object } })

    broadcastEdlUpdate(sessionId, userId, { type: 'DATA_UPDATE', patch })

    return newData
  }

  /**
   * Finalise et verrouille l'EDL
   */
  async completeSession(sessionId: string, userId: string) {
    const session = await prisma.edlSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new Error('Session introuvable')
    if (session.ownerId !== userId && session.tenantId !== userId) throw new Error('Accès refusé')

    const updated = await prisma.edlSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    })

    // Persiste dans le contrat
    const edlKey = `edl_${session.edlType.toLowerCase()}`
    const contract = await prisma.contract.findUnique({ where: { id: session.contractId } })
    if (contract) {
      const content = (contract.content ?? {}) as Record<string, unknown>
      await prisma.contract.update({
        where: { id: session.contractId },
        data: { content: { ...content, [edlKey]: session.data } as object },
      })
    }

    broadcastEdlUpdate(sessionId, userId, { type: 'SESSION_COMPLETED' })

    return updated
  }
}

export const edlService = new EdlService()
