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

// Craft categories for Overpass API
const CRAFT_MAP: Record<string, string[]> = {
  PLOMBERIE: ['plumber', 'water_well_drilling'],
  ELECTRICITE: ['electrician'],
  CHAUFFAGE: ['hvac_technician', 'heating_engineer'],
  SERRURERIE: ['locksmith'],
  AUTRE: ['carpenter', 'painter', 'plasterer', 'builder'],
}

// POST /maintenance/find-contractors
router.post('/find-contractors', async (req, res) => {
  try {
    const { latitude, longitude, category, city } = req.body

    let lat = Number(latitude)
    let lon = Number(longitude)

    // Fallback: geocode by city using BAN API if no lat/lon
    if ((!lat || !lon) && city) {
      try {
        const geoRes = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&limit=1&type=municipality`
        )
        const geoData = await geoRes.json() as { features?: Array<{ geometry?: { coordinates?: number[] } }> }
        if (geoData.features?.[0]?.geometry?.coordinates) {
          lon = geoData.features[0].geometry.coordinates[0]
          lat = geoData.features[0].geometry.coordinates[1]
        }
      } catch { /* use defaults */ }
    }

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Localisation introuvable' })
    }

    const craftTypes = CRAFT_MAP[category as string] ?? CRAFT_MAP['AUTRE']
    const craftQuery = craftTypes.map(c => `node["craft"="${c}"](around:8000,${lat},${lon});way["craft"="${c}"](around:8000,${lat},${lon});`).join('\n')

    const overpassQuery = `[out:json][timeout:15];\n(\n${craftQuery}\n);\nout body;\n>;\nout skel qt;`

    const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(16000),
    })

    const overpassData = await overpassRes.json() as {
      elements?: Array<{
        id: number
        type: string
        lat?: number
        lon?: number
        tags?: Record<string, string>
      }>
    }

    const elements = overpassData.elements ?? []

    // Calculate distance in km
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const contractors = elements
      .filter(el => el.tags?.name && el.lat && el.lon)
      .map(el => {
        const distance = el.lat && el.lon ? haversine(lat, lon, el.lat, el.lon) : 999
        return {
          id: String(el.id),
          name: el.tags!.name,
          address: [el.tags!['addr:housenumber'], el.tags!['addr:street'], el.tags!['addr:city']].filter(Boolean).join(' ') || city || 'Adresse non renseignée',
          phone: el.tags!.phone ?? el.tags!['contact:phone'] ?? null,
          website: el.tags!.website ?? el.tags!['contact:website'] ?? null,
          openingHours: el.tags!.opening_hours ?? null,
          distance: Math.round(distance * 10) / 10,
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6)

    // Platform suggestions based on category
    const PLATFORMS: Record<string, Array<{ name: string; url: string; description: string }>> = {
      PLOMBERIE: [
        { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Artisans disponibles rapidement' },
        { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits en ligne' },
        { name: 'Allovoisins', url: 'https://www.allovoisins.com', description: 'Services locaux de proximité' },
      ],
      ELECTRICITE: [
        { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Électriciens disponibles 24h/24' },
        { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits en ligne' },
        { name: 'Homki', url: 'https://www.homki.fr', description: 'Artisans certifiés RGE' },
      ],
      CHAUFFAGE: [
        { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Chauffagistes disponibles rapidement' },
        { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits en ligne' },
        { name: 'Papernest', url: 'https://www.papernest.com', description: 'Contrats d\'entretien chaudière' },
      ],
      SERRURERIE: [
        { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Serruriers disponibles 24h/24' },
        { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits en ligne' },
      ],
      AUTRE: [
        { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits en ligne' },
        { name: 'Houzz', url: 'https://www.houzz.fr', description: 'Professionnels du bâtiment' },
        { name: 'Allovoisins', url: 'https://www.allovoisins.com', description: 'Services locaux' },
      ],
    }

    const platforms = PLATFORMS[category as string] ?? PLATFORMS['AUTRE']

    return res.json({ success: true, data: { contractors, platforms, searchLocation: { lat, lon } } })
  } catch (err) {
    console.error('find-contractors error:', err)
    return res.status(500).json({ success: false, message: 'Erreur lors de la recherche d\'artisans' })
  }
})

export default router
