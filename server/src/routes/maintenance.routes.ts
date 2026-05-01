import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'

const router = Router()
router.use(authenticate)

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

// GET /maintenance
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const role = req.user!.role

    let requests
    if (role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      requests = await prisma.maintenanceRequest.findMany({
        where: { ownerId: userId },
        include: {
          property: { select: { title: true } },
          tenant: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      })
    } else {
      requests = await prisma.maintenanceRequest.findMany({
        where: { tenantId: userId },
        include: {
          property: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }
    return res.json({ success: true, data: { requests } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /maintenance
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const role = req.user!.role
    const { propertyId, title, description, category, priority } = req.body

    if (!propertyId || !title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    }

    let ownerId: string
    let tenantId: string | undefined

    if (role === 'OWNER') {
      const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: userId } })
      if (!property) return res.status(403).json({ success: false, message: 'Propriété introuvable' })
      ownerId = userId
    } else {
      // Tenant: find the property's owner via active contract
      const contract = await prisma.contract.findFirst({
        where: { propertyId, tenantId: userId, status: 'ACTIVE' },
        select: { ownerId: true },
      })
      if (!contract) return res.status(403).json({ success: false, message: 'Vous n\'avez pas de contrat actif pour ce bien' })
      ownerId = contract.ownerId
      tenantId = userId
    }

    const request = await prisma.maintenanceRequest.create({
      data: { propertyId, ownerId, tenantId, title, description, category, priority: priority || 'MEDIUM' },
      include: {
        property: { select: { title: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    })
    return res.status(201).json({ success: true, data: { request } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// PATCH /maintenance/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user!.id
    const existing = await prisma.maintenanceRequest.findFirst({ where: { id: req.params.id, ownerId: userId } })
    if (!existing) return res.status(404).json({ success: false, message: 'Demande introuvable' })

    const { status, priority } = req.body
    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(priority && { priority }) },
      include: {
        property: { select: { title: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    })
    return res.json({ success: true, data: { request } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /maintenance/:id/ai-analyze
router.post('/:id/ai-analyze', async (req, res) => {
  try {
    const userId = req.user!.id
    const existing = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.id, OR: [{ ownerId: userId }, { tenantId: userId }] },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Demande introuvable' })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Tu es un expert en gestion immobilière en France. Analyse ce problème de maintenance signalé dans un logement locatif et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans texte avant/après).

Catégorie: ${existing.category}
Titre: ${existing.title}
Description: ${existing.description}

Réponds avec ce format JSON exact:
{
  "severity": "low|medium|high|critical",
  "estimatedCost": { "min": number, "max": number, "currency": "EUR" },
  "advice": "Conseil pratique en français en 2-3 phrases maximum.",
  "platforms": [
    { "name": "Nom plateforme", "url": "https://...", "description": "Description courte en français" }
  ]
}

Pour les platforms, donne 2-3 plateformes françaises réelles et pertinentes pour cette catégorie (ex: Habitissimo, MesDépanneurs.fr, Houzz, Costes&Associés, Papernest, etc.).`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Invalid AI response')

    let aiAnalysis
    try {
      const jsonText = content.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      aiAnalysis = JSON.parse(jsonText)
    } catch {
      aiAnalysis = { severity: 'medium', estimatedCost: { min: 100, max: 500, currency: 'EUR' }, advice: 'Contactez un professionnel qualifié pour évaluer et résoudre ce problème.', platforms: [{ name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Plateforme de mise en relation avec des artisans locaux' }] }
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { aiAnalysis },
      include: {
        property: { select: { title: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    })
    return res.json({ success: true, data: { request } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Erreur analyse IA' })
  }
})

export default router
