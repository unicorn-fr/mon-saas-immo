import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()
router.use(authenticate)

// ── Rule-based maintenance analysis (no external AI API needed) ──────────────

interface AiAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical'
  estimatedCost: { min: number; max: number; currency: 'EUR' }
  advice: string
  platforms: { name: string; url: string; description: string }[]
}

const PLATFORMS_BY_CATEGORY: Record<string, AiAnalysis['platforms']> = {
  PLOMBERIE: [
    { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Mise en relation plombiers disponibles rapidement' },
    { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits artisans locaux' },
    { name: 'Jemepropose', url: 'https://www.jemepropose.com', description: 'Artisans du bâtiment vérifiés' },
  ],
  ELECTRICITE: [
    { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Électriciens disponibles en urgence' },
    { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis électriciens certifiés' },
    { name: 'Voltalis', url: 'https://www.voltalis.com', description: 'Électriciens RGE' },
  ],
  SERRURERIE: [
    { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Serruriers disponibles 24h/24' },
    { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Serruriers vérifiés' },
    { name: 'Lockitane', url: 'https://www.lockitane.fr', description: 'Serruriers professionnels' },
  ],
  CHAUFFAGE: [
    { name: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr', description: 'Chauffagistes disponibles rapidement' },
    { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis chauffagistes RGE' },
    { name: 'Proxiserve', url: 'https://www.proxiserve.fr', description: 'Maintenance chaudières et chauffage' },
  ],
  AUTRE: [
    { name: 'Habitissimo', url: 'https://www.habitissimo.fr', description: 'Devis gratuits tous travaux' },
    { name: 'Jemepropose', url: 'https://www.jemepropose.com', description: 'Artisans polyvalents vérifiés' },
    { name: 'Houzz', url: 'https://www.houzz.fr', description: 'Professionnels de la rénovation' },
  ],
}

const SEVERITY_KEYWORDS = {
  critical: ['urgence', 'urgent', 'inondation', 'court-circuit', 'feu', 'gaz', 'explosion', 'danger', 'sécurité', 'bloqué', 'bloquée', 'impossible', 'panne totale', 'pas d\'eau', 'pas d\'électricité', 'pas de chauffage', 'nuit'],
  high: ['fuite', 'fuite importante', 'panne', 'cassé', 'cassée', 'brisé', 'brisée', 'chaud', 'brûlant', 'odeur', 'humidité', 'moisissure', 'bloqué', 'plus de', 'ne fonctionne pas', 'ne marche pas'],
  medium: ['fuit', 'goutte', 'grince', 'claque', 'craque', 'lent', 'faible pression', 'difficile', 'usé', 'usée', 'abîmé', 'abîmée'],
  low: ['bruit', 'esthétique', 'peinture', 'petite', 'petit', 'léger', 'légère'],
}

const COST_BY_CATEGORY: Record<string, Record<string, { min: number; max: number }>> = {
  PLOMBERIE: {
    critical: { min: 300, max: 1500 },
    high: { min: 150, max: 600 },
    medium: { min: 80, max: 300 },
    low: { min: 50, max: 150 },
  },
  ELECTRICITE: {
    critical: { min: 400, max: 2000 },
    high: { min: 200, max: 800 },
    medium: { min: 100, max: 400 },
    low: { min: 60, max: 200 },
  },
  SERRURERIE: {
    critical: { min: 200, max: 600 },
    high: { min: 150, max: 400 },
    medium: { min: 100, max: 250 },
    low: { min: 80, max: 200 },
  },
  CHAUFFAGE: {
    critical: { min: 300, max: 1500 },
    high: { min: 200, max: 800 },
    medium: { min: 100, max: 400 },
    low: { min: 80, max: 250 },
  },
  AUTRE: {
    critical: { min: 200, max: 1000 },
    high: { min: 100, max: 500 },
    medium: { min: 60, max: 250 },
    low: { min: 30, max: 150 },
  },
}

const ADVICE_BY_CATEGORY: Record<string, Record<string, string>> = {
  PLOMBERIE: {
    critical: 'Coupez immédiatement l\'eau au robinet d\'arrêt général et contactez un plombier en urgence. Éponger l\'eau pour éviter les dégâts des eaux.',
    high: 'Contactez un plombier qualifié rapidement. Si possible, coupez l\'arrivée d\'eau locale. Prenez des photos des dégâts pour votre assurance.',
    medium: 'Planifiez une intervention dans les prochains jours. Un plombier pourra diagnostiquer et réparer sans urgence immédiate.',
    low: 'Intervention non urgente. Vous pouvez planifier à votre convenance dans les prochaines semaines.',
  },
  ELECTRICITE: {
    critical: 'Coupez le disjoncteur général immédiatement et contactez un électricien d\'urgence. Ne touchez à aucun câble. Appelez le 15 ou 18 en cas de danger immédiat.',
    high: 'Coupez le circuit concerné au tableau électrique et contactez un électricien certifié rapidement. Évitez d\'utiliser les prises défectueuses.',
    medium: 'Planifiez une intervention avec un électricien qualifié. Évitez de surcharger les circuits en attendant.',
    low: 'Intervention à planifier dans les prochaines semaines. Un électricien pourra évaluer et corriger le problème.',
  },
  SERRURERIE: {
    critical: 'Si vous êtes bloqué dehors ou si la sécurité est compromise, appelez un serrurier d\'urgence. Votre assurance habitation peut couvrir cette intervention.',
    high: 'Contactez un serrurier certifié rapidement pour garantir la sécurité du logement. Vérifiez votre couverture assurance.',
    medium: 'Planifiez l\'intervention dans les prochains jours pour garantir la bonne sécurisation du logement.',
    low: 'L\'intervention peut être planifiée à votre convenance dans les prochaines semaines.',
  },
  CHAUFFAGE: {
    critical: 'Si vous suspectez une fuite de gaz, ouvrez les fenêtres, évacuez et appelez le 0800 47 33 33 (Gaz). Contactez un chauffagiste d\'urgence pour toute panne totale.',
    high: 'Contactez un chauffagiste qualifié rapidement. Assurez-vous que la pression de la chaudière est normale (entre 1 et 2 bars).',
    medium: 'Planifiez un entretien de chaudière dans les prochains jours. Vérifiez que le thermostat et les robinets de radiateurs sont bien ouverts.',
    low: 'Intervention à planifier lors de l\'entretien annuel de la chaudière.',
  },
  AUTRE: {
    critical: 'Contactez immédiatement un professionnel qualifié. En cas de danger, prévenez les secours (15, 18 ou 112).',
    high: 'Contactez un artisan qualifié rapidement pour évaluer et résoudre le problème.',
    medium: 'Planifiez une intervention dans les prochains jours avec un professionnel adapté à la nature du problème.',
    low: 'Intervention non urgente, à planifier à votre convenance.',
  },
}

function analyzeMaintenanceRequest(category: string, title: string, description: string): AiAnalysis {
  const text = `${title} ${description}`.toLowerCase()

  // Determine severity by keywords
  let severity: AiAnalysis['severity'] = 'medium'
  if (SEVERITY_KEYWORDS.critical.some(k => text.includes(k))) severity = 'critical'
  else if (SEVERITY_KEYWORDS.high.some(k => text.includes(k))) severity = 'high'
  else if (SEVERITY_KEYWORDS.low.some(k => text.includes(k)) && !SEVERITY_KEYWORDS.medium.some(k => text.includes(k))) severity = 'low'

  const cat = category in COST_BY_CATEGORY ? category : 'AUTRE'
  const cost = COST_BY_CATEGORY[cat][severity]
  const advice = ADVICE_BY_CATEGORY[cat][severity]
  const platforms = PLATFORMS_BY_CATEGORY[cat] ?? PLATFORMS_BY_CATEGORY['AUTRE']

  return { severity, estimatedCost: { ...cost, currency: 'EUR' }, advice, platforms }
}

// GET /maintenance/by-property — requests grouped by property with stats
router.get('/by-property', async (req, res) => {
  try {
    const userId = req.user!.id
    const requests = await prisma.maintenanceRequest.findMany({
      where: { ownerId: userId },
      include: {
        property: { select: { id: true, title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    // Group by propertyId
    const grouped: Record<string, {
      property: typeof requests[0]['property']
      requests: typeof requests
      stats: { total: number; open: number; inProgress: number; resolved: number; estimatedCostMin: number; estimatedCostMax: number }
    }> = {}

    for (const r of requests) {
      if (!r.propertyId) continue
      if (!grouped[r.propertyId]) {
        grouped[r.propertyId] = {
          property: r.property,
          requests: [],
          stats: { total: 0, open: 0, inProgress: 0, resolved: 0, estimatedCostMin: 0, estimatedCostMax: 0 },
        }
      }
      grouped[r.propertyId].requests.push(r)
      grouped[r.propertyId].stats.total++
      if (r.status === 'OPEN') grouped[r.propertyId].stats.open++
      if (r.status === 'IN_PROGRESS') grouped[r.propertyId].stats.inProgress++
      if (r.status === 'RESOLVED' || r.status === 'CLOSED') grouped[r.propertyId].stats.resolved++
      // Add estimated costs from aiAnalysis if present
      const ai = r.aiAnalysis as { estimatedCost?: { min: number; max: number } } | null
      if (ai?.estimatedCost) {
        grouped[r.propertyId].stats.estimatedCostMin += ai.estimatedCost.min
        grouped[r.propertyId].stats.estimatedCostMax += ai.estimatedCost.max
      }
    }

    return res.json({ success: true, data: { byProperty: Object.values(grouped) } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

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
          property: { select: { title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
          tenant: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      })
    } else {
      requests = await prisma.maintenanceRequest.findMany({
        where: { tenantId: userId },
        include: {
          property: { select: { title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
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
        property: { select: { title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
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
        property: { select: { title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
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

    const aiAnalysis = analyzeMaintenanceRequest(existing.category, existing.title, existing.description)

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { aiAnalysis: aiAnalysis as object },
      include: {
        property: { select: { title: true, address: true, city: true, postalCode: true, surface: true, price: true, images: true, furnished: true, type: true } },
        tenant: { select: { firstName: true, lastName: true } },
      },
    })
    return res.json({ success: true, data: { request } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Erreur analyse IA' })
  }
})

// Simple name substrings for Overpass regex (no special chars, case-insensitive via ,i)
const NAME_PATTERNS: Record<string, string> = {
  PLOMBERIE:   'plomb|sanitaire',
  ELECTRICITE: 'electri',
  CHAUFFAGE:   'chauffage|chauffagiste|climatisation|thermique',
  SERRURERIE:  'serrur',
  AUTRE:       'artisan|menuisier|peintre|macon|carreleur',
}
const CRAFT_TAGS: Record<string, string[]> = {
  PLOMBERIE:   ['plumber', 'hvac_technician', 'water_well_drilling'],
  ELECTRICITE: ['electrician'],
  CHAUFFAGE:   ['hvac_technician', 'heating_engineer'],
  SERRURERIE:  ['locksmith', 'key_cutter'],
  AUTRE:       ['carpenter', 'painter', 'plasterer', 'builder', 'roofer'],
}
const SHOP_TAGS: Record<string, string[]> = {
  PLOMBERIE:   ['doityourself', 'bathroom_furnishing', 'heating'],
  ELECTRICITE: ['electronics'],
  CHAUFFAGE:   ['heating', 'doityourself'],
  SERRURERIE:  ['locksmith', 'security'],
  AUTRE:       ['doityourself', 'hardware'],
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

    const radius = 12000
    const nameRegex = NAME_PATTERNS[category as string] ?? NAME_PATTERNS['AUTRE']
    const crafts = CRAFT_TAGS[category as string] ?? CRAFT_TAGS['AUTRE']
    const shops = SHOP_TAGS[category as string] ?? SHOP_TAGS['AUTRE']

    // Build a comprehensive Overpass query: craft tags + shop tags + name-based regex
    const craftParts = crafts.map(c =>
      `node["craft"="${c}"](around:${radius},${lat},${lon});\n  way["craft"="${c}"](around:${radius},${lat},${lon});`
    ).join('\n  ')
    const shopParts = shops.map(s =>
      `node["shop"="${s}"](around:${radius},${lat},${lon});\n  way["shop"="${s}"](around:${radius},${lat},${lon});`
    ).join('\n  ')
    const nameParts = [
      `node[name~"${nameRegex}",i](around:${radius},${lat},${lon});`,
      `way[name~"${nameRegex}",i](around:${radius},${lat},${lon});`,
    ].join('\n  ')

    const overpassQuery = `[out:json][timeout:25];\n(\n  ${craftParts}\n  ${shopParts}\n  ${nameParts}\n);\nout body;\n>;\nout skel qt;`

    let elements: Array<{ id: number; type: string; lat?: number; lon?: number; tags?: Record<string, string> }> = []
    try {
      const controller = new AbortController()
      const tid = setTimeout(() => controller.abort(), 25000)
      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
      })
      clearTimeout(tid)
      const rawText = await overpassRes.text()
      // Guard against HTML error pages from Overpass
      if (rawText.trim().startsWith('{')) {
        const overpassData = JSON.parse(rawText) as { elements?: typeof elements }
        elements = overpassData.elements ?? []
      }
    } catch {
      // Overpass unavailable or timeout — return empty contractors gracefully
      elements = []
    }

    // Calculate distance in km
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const GOOGLE_MAPS_KEYWORDS: Record<string, string> = {
      PLOMBERIE: 'plombier',
      ELECTRICITE: 'electricien',
      SERRURERIE: 'serrurier',
      CHAUFFAGE: 'chauffagiste',
      AUTRE: 'artisan',
    }
    const googleMapsKeyword = GOOGLE_MAPS_KEYWORDS[category as string] ?? 'artisan'
    const googleMapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(googleMapsKeyword + ' ' + (city ?? ''))}`

    // Deduplicate by name+address, filter elements with a name
    const seen = new Set<string>()
    const contractors = elements
      .filter(el => el.tags?.name && (el.lat && el.lon))
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
          lat: el.lat,
          lon: el.lon,
          googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(el.tags!.name)}/@${el.lat},${el.lon},15z`,
        }
      })
      .filter(c => {
        const key = c.name.toLowerCase().trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8)

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

    return res.json({ success: true, data: { contractors, platforms, searchLocation: { lat, lon }, googleMapsSearchUrl } })
  } catch (err) {
    console.error('find-contractors error:', err)
    // Return empty list rather than crashing — client falls back to platform links
    return res.json({ success: true, data: { contractors: [], platforms: [], searchLocation: null, googleMapsSearchUrl: '' } })
  }
})

export default router
