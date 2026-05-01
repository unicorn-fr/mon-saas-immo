import { Request, Response, NextFunction } from 'express'
import { propertyService } from '../services/property.service.js'
import { PropertyType, PropertyStatus } from '@prisma/client'
import { saveFile } from '../utils/upload.util.js'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

class PropertyController {
  /**
   * POST /api/v1/properties
   * Create a new property
   */
  async createProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      // Check if user is an owner
      if (req.user?.role !== 'OWNER') {
        return res.status(403).json({
          success: false,
          message: 'Only owners can create properties',
        })
      }

      const {
        title,
        description,
        type,
        address,
        city,
        postalCode,
        country,
        latitude,
        longitude,
        bedrooms,
        bathrooms,
        surface,
        floor,
        totalFloors,
        furnished,
        price,
        charges,
        deposit,
        images,
        virtualTour,
        hasParking,
        hasBalcony,
        hasElevator,
        hasGarden,
        amenities,
        availableFrom,
        visitDuration,
        visitAvailabilitySlots,
        visitDateOverrides,
      } = req.body

      // Validation
      if (
        !title ||
        !description ||
        !type ||
        !address ||
        !city ||
        !postalCode ||
        bedrooms === undefined ||
        bathrooms === undefined ||
        !surface ||
        !price
      ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        })
      }

      // Validate type
      if (!Object.values(PropertyType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid property type',
        })
      }

      // Validate visit availability slots
      if (visitAvailabilitySlots && Array.isArray(visitAvailabilitySlots)) {
        for (const slot of visitAvailabilitySlots) {
          if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
            return res.status(400).json({
              success: false,
              message: 'dayOfWeek must be between 0 and 6',
            })
          }
          if (!slot.startTime || !slot.endTime || slot.startTime >= slot.endTime) {
            return res.status(400).json({
              success: false,
              message: 'startTime must be before endTime',
            })
          }
        }
      }

      // Validate visit date overrides
      if (visitDateOverrides && Array.isArray(visitDateOverrides)) {
        for (const override of visitDateOverrides) {
          if (!['BLOCKED', 'EXTRA'].includes(override.type)) {
            return res.status(400).json({
              success: false,
              message: 'Override type must be BLOCKED or EXTRA',
            })
          }
          if (override.type === 'EXTRA' && (!override.startTime || !override.endTime)) {
            return res.status(400).json({
              success: false,
              message: 'EXTRA overrides require startTime and endTime',
            })
          }
          if (override.type === 'EXTRA' && override.startTime >= override.endTime) {
            return res.status(400).json({
              success: false,
              message: 'startTime must be before endTime for EXTRA overrides',
            })
          }
        }
      }

      const property = await propertyService.createProperty({
        ownerId: userId,
        title,
        description,
        type,
        address,
        city,
        postalCode,
        country,
        latitude,
        longitude,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        surface: parseFloat(surface),
        floor: floor ? parseInt(floor) : undefined,
        totalFloors: totalFloors ? parseInt(totalFloors) : undefined,
        furnished,
        price: parseFloat(price),
        charges: charges ? parseFloat(charges) : undefined,
        deposit: deposit ? parseFloat(deposit) : undefined,
        images,
        virtualTour,
        hasParking,
        hasBalcony,
        hasElevator,
        hasGarden,
        amenities,
        availableFrom: availableFrom
          ? new Date(availableFrom.includes('T') ? availableFrom : `${availableFrom}T00:00:00`)
          : undefined,
        visitDuration: visitDuration ? parseInt(visitDuration) : undefined,
        visitAvailabilitySlots,
        visitDateOverrides,
      })

      return res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: { property },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/properties/:id
   * Get property by ID
   */
  async getPropertyById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const includeOwner = req.query.includeOwner === 'true'

      const property = await propertyService.getPropertyById(id, includeOwner)

      return res.status(200).json({
        success: true,
        data: { property },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Property not found') {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/properties/:id
   * Update property
   */
  async updateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const { visitAvailabilitySlots, visitDateOverrides, visitDuration: visitDurationRaw, ...rest } = req.body

      // Validate visit availability slots
      if (visitAvailabilitySlots && Array.isArray(visitAvailabilitySlots)) {
        for (const slot of visitAvailabilitySlots) {
          if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
            return res.status(400).json({
              success: false,
              message: 'dayOfWeek must be between 0 and 6',
            })
          }
          if (!slot.startTime || !slot.endTime || slot.startTime >= slot.endTime) {
            return res.status(400).json({
              success: false,
              message: 'startTime must be before endTime',
            })
          }
        }
      }

      // Validate visit date overrides
      if (visitDateOverrides && Array.isArray(visitDateOverrides)) {
        for (const override of visitDateOverrides) {
          if (!['BLOCKED', 'EXTRA'].includes(override.type)) {
            return res.status(400).json({
              success: false,
              message: 'Override type must be BLOCKED or EXTRA',
            })
          }
          if (override.type === 'EXTRA' && (!override.startTime || !override.endTime)) {
            return res.status(400).json({
              success: false,
              message: 'EXTRA overrides require startTime and endTime',
            })
          }
          if (override.type === 'EXTRA' && override.startTime >= override.endTime) {
            return res.status(400).json({
              success: false,
              message: 'startTime must be before endTime for EXTRA overrides',
            })
          }
        }
      }

      const property = await propertyService.updateProperty(id, userId, {
        ...rest,
        visitDuration: visitDurationRaw !== undefined ? parseInt(visitDurationRaw) : undefined,
        visitAvailabilitySlots,
        visitDateOverrides,
      })

      return res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: { property },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * DELETE /api/v1/properties/:id
   * Delete property
   */
  async deleteProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      await propertyService.deleteProperty(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/properties
   * Get all properties with filters and pagination
   */
  async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        city,
        type,
        status,
        minPrice,
        maxPrice,
        minSurface,
        maxSurface,
        bedrooms,
        bathrooms,
        furnished,
        hasParking,
        hasBalcony,
        hasElevator,
        hasGarden,
        amenities,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query

      const filters = {
        city: city as string,
        type: type as PropertyType,
        status: status as PropertyStatus,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minSurface: minSurface ? parseFloat(minSurface as string) : undefined,
        maxSurface: maxSurface ? parseFloat(maxSurface as string) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms as string) : undefined,
        furnished: furnished === 'true' ? true : furnished === 'false' ? false : undefined,
        hasParking: hasParking === 'true' ? true : hasParking === 'false' ? false : undefined,
        hasBalcony: hasBalcony === 'true' ? true : hasBalcony === 'false' ? false : undefined,
        hasElevator: hasElevator === 'true' ? true : hasElevator === 'false' ? false : undefined,
        hasGarden: hasGarden === 'true' ? true : hasGarden === 'false' ? false : undefined,
        amenities: amenities
          ? Array.isArray(amenities)
            ? (amenities as string[])
            : [amenities as string]
          : undefined,
      }

      const pagination = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await propertyService.getProperties(filters, pagination)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/properties/owner/me
   * Get properties for authenticated owner
   */
  async getMyProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const { page, limit, sortBy, sortOrder } = req.query

      const pagination = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await propertyService.getPropertiesByOwner(userId, pagination)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/v1/properties/:id/publish
   * Publish property
   */
  async publishProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const property = await propertyService.publishProperty(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Property published successfully',
        data: { property },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/properties/:id/occupy
   * Mark property as occupied
   */
  async markAsOccupied(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const property = await propertyService.markAsOccupied(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Property marked as occupied',
        data: { property },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/properties/:id/status
   * Change property status
   */
  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const { status } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      if (!status || !['AVAILABLE', 'OCCUPIED', 'DRAFT'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Allowed: AVAILABLE, OCCUPIED, DRAFT',
        })
      }

      const property = await propertyService.changePropertyStatus(id, userId, status as PropertyStatus)

      return res.status(200).json({
        success: true,
        message: 'Property status updated successfully',
        data: { property },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/properties/owner/me/statistics
   * Get statistics for owner
   */
  async getMyStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        })
      }

      const statistics = await propertyService.getOwnerStatistics(userId)

      return res.status(200).json({
        success: true,
        data: { statistics },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/properties/search
   * Search properties by text
   */
  async searchProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page, limit, sortBy, sortOrder } = req.query

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        })
      }

      const pagination = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await propertyService.searchProperties(q, pagination)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/properties/advanced-search
   * Advanced search with multiple filters
   */
  async advancedSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        query,
        city,
        type,
        minPrice,
        maxPrice,
        minSurface,
        maxSurface,
        bedrooms,
        minBedrooms,
        maxBedrooms,
        bathrooms,
        minBathrooms,
        maxBathrooms,
        furnished,
        hasParking,
        hasBalcony,
        hasElevator,
        hasGarden,
        amenities,
        availableFrom,
        latitude,
        longitude,
        radius,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query

      // Parse amenities if string
      let parsedAmenities: string[] | undefined
      if (amenities) {
        if (typeof amenities === 'string') {
          parsedAmenities = amenities.split(',').map((a) => a.trim())
        } else if (Array.isArray(amenities)) {
          parsedAmenities = amenities as string[]
        }
      }

      const filters = {
        query: query as string,
        city: city as string,
        type: type as any,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        minSurface: minSurface ? parseFloat(minSurface as string) : undefined,
        maxSurface: maxSurface ? parseFloat(maxSurface as string) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
        minBedrooms: minBedrooms ? parseInt(minBedrooms as string) : undefined,
        maxBedrooms: maxBedrooms ? parseInt(maxBedrooms as string) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms as string) : undefined,
        minBathrooms: minBathrooms ? parseInt(minBathrooms as string) : undefined,
        maxBathrooms: maxBathrooms ? parseInt(maxBathrooms as string) : undefined,
        furnished: furnished === 'true' ? true : furnished === 'false' ? false : undefined,
        hasParking: hasParking === 'true' ? true : hasParking === 'false' ? false : undefined,
        hasBalcony: hasBalcony === 'true' ? true : hasBalcony === 'false' ? false : undefined,
        hasElevator: hasElevator === 'true' ? true : hasElevator === 'false' ? false : undefined,
        hasGarden: hasGarden === 'true' ? true : hasGarden === 'false' ? false : undefined,
        amenities: parsedAmenities,
        availableFrom: availableFrom as string,
        latitude: latitude ? parseFloat(latitude as string) : undefined,
        longitude: longitude ? parseFloat(longitude as string) : undefined,
        radius: radius ? parseFloat(radius as string) : undefined,
      }

      const pagination = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await propertyService.advancedSearch(filters, pagination)

      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/properties/parse-query
   * Parse natural language query into property filters (French)
   */
  async parseNaturalQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, message: 'Query is required' })
      }

      // ── LLM parsing (primary) ──────────────────────────────────────────────
      if (env.ANTHROPIC_API_KEY) {
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: `Tu es un assistant qui extrait des critères de recherche immobilière à partir d'une requête en langage naturel français.
Retourne UNIQUEMENT un JSON valide, sans markdown, sans explication. Format exact :
{
  "filters": {
    "city": string | null,
    "type": "APARTMENT"|"HOUSE"|"STUDIO"|"LOFT"|"DUPLEX"|null,
    "minPrice": number | null,
    "maxPrice": number | null,
    "minSurface": number | null,
    "maxSurface": number | null,
    "bedrooms": number | null,
    "furnished": boolean | null,
    "hasParking": boolean | null,
    "hasBalcony": boolean | null,
    "hasElevator": boolean | null,
    "hasGarden": boolean | null
  },
  "chips": [{"label": string, "value": string}]
}

Règles importantes :
- T1/F1 = type APARTMENT, bedrooms 0 (studio équivalent)
- T2/F2 = type APARTMENT, bedrooms 1
- T3/F3 = type APARTMENT, bedrooms 2
- T4/F4 = type APARTMENT, bedrooms 3
- T5+/F5+ = type APARTMENT, bedrooms 4+
- "studio" = type STUDIO, bedrooms 0
- "maison", "villa", "pavillon" = type HOUSE
- "loft" = type LOFT
- "duplex" = type DUPLEX
- La ville peut apparaître sans préposition (ex: "T2 Lyon" → city: "Lyon")
- Un prix seul sans contexte = maxPrice (ex: "800€" → maxPrice 800)
- "< 800€", "moins de 800", "pas plus de 800" → maxPrice
- "> 800€", "au moins 800", "à partir de 800" → minPrice
- Surface en m² : "50m²", "plus de 40m²", "30 à 60m²"
- "meublé" → furnished true, "vide"/"non meublé" → furnished false
- "avec parking"/"garage" → hasParking true
- "avec balcon" → hasBalcony true
- "avec ascenseur" → hasElevator true
- "avec jardin"/"terrasse" → hasGarden true
- Ignore les mots vides : "cherche", "je veux", "trouver", "logement", "bien", "annonce"
- Les chips sont des labels humains pour afficher les filtres actifs dans l'UI
- Ne mets dans les chips QUE les filtres extraits (pas les null)
- city dans les chips avec la première lettre en majuscule
- Si aucun critère clair n'est détecté, retourne filters tous null et chips vide`,
            messages: [{ role: 'user', content: query }],
          })

          const raw = (msg.content[0] as { type: string; text: string }).text.trim()
          const parsed = JSON.parse(raw) as {
            filters: Record<string, unknown>
            chips: { label: string; value: string }[]
          }

          // Sanitize: remove null values from filters
          const filters: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(parsed.filters)) {
            if (v !== null && v !== undefined) filters[k] = v
          }

          return res.status(200).json({
            success: true,
            data: { filters, chips: parsed.chips ?? [], originalQuery: query },
          })
        } catch (llmError) {
          // LLM failed → fall through to regex fallback
          console.error('[parseNaturalQuery] LLM error, falling back to regex:', llmError)
        }
      }

      // ── Regex fallback ─────────────────────────────────────────────────────
      const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const filters: Record<string, unknown> = {}
      const chips: { label: string; value: string }[] = []

      // T/F notation (T2, F3, etc.)
      const tnMatch = q.match(/\b[tf](\d)\b/)
      if (tnMatch) {
        const n = parseInt(tnMatch[1])
        filters.type = n === 1 ? 'STUDIO' : 'APARTMENT'
        filters.bedrooms = Math.max(0, n - 1)
        chips.push({ label: 'Type', value: `T${n}` })
        if (n > 1) chips.push({ label: 'Chambres', value: String(n - 1) })
      }

      // Price
      const maxPriceMatch = q.match(/(?:moins de|max(?:imum)?|pas plus de|inf[eé]rieur [aà]|jusqu[' ]?[aà]|<)\s*(\d[\d\s]*)\s*(?:euros?|€|eur)?/i)
        || q.match(/(\d[\d\s]+)\s*(?:euros?|€|eur)\s*(?:max(?:imum)?|au plus|maxi)/)
      if (maxPriceMatch) {
        filters.maxPrice = parseInt(maxPriceMatch[1].replace(/\s/g, ''))
        chips.push({ label: 'Prix max', value: `${filters.maxPrice}€` })
      }
      const minPriceMatch = q.match(/(?:plus de|min(?:imum)?|au moins|sup[eé]rieur [aà]|[aà] partir de|>)\s*(\d[\d\s]*)\s*(?:euros?|€|eur)?/i)
      if (minPriceMatch) {
        filters.minPrice = parseInt(minPriceMatch[1].replace(/\s/g, ''))
        chips.push({ label: 'Prix min', value: `${filters.minPrice}€` })
      }

      // Surface
      const minSurfMatch = q.match(/(?:plus de|au moins|min(?:imum)?|sup[eé]rieur [aà])\s*(\d+)\s*m/)
        || q.match(/(\d+)\s*m[2²]\s*(?:min(?:imum)?|au moins|ou plus)/)
      if (minSurfMatch) { filters.minSurface = parseInt(minSurfMatch[1]); chips.push({ label: 'Surface min', value: `${filters.minSurface}m²` }) }
      const maxSurfMatch = q.match(/(?:moins de|max(?:imum)?|pas plus de)\s*(\d+)\s*m/)
        || q.match(/(\d+)\s*m[2²]\s*(?:max(?:imum)?|au plus)/)
      if (maxSurfMatch) { filters.maxSurface = parseInt(maxSurfMatch[1]); chips.push({ label: 'Surface max', value: `${filters.maxSurface}m²` }) }

      // Bedrooms (if not already set by T/F)
      if (!filters.bedrooms) {
        const bedMatch = q.match(/(\d+)\s*(?:chambres?|pi[eè]ces?)\b/)
        if (bedMatch) { filters.bedrooms = parseInt(bedMatch[1]); chips.push({ label: 'Chambres', value: bedMatch[1] }) }
      }

      // Type (if not already set)
      if (!filters.type) {
        if (/\bstudio\b/.test(q)) { filters.type = 'STUDIO'; chips.push({ label: 'Type', value: 'Studio' }) }
        else if (/\b(?:maison|villa|pavillon)\b/.test(q)) { filters.type = 'HOUSE'; chips.push({ label: 'Type', value: 'Maison' }) }
        else if (/\bappartement\b/.test(q)) { filters.type = 'APARTMENT'; chips.push({ label: 'Type', value: 'Appartement' }) }
        else if (/\bloft\b/.test(q)) { filters.type = 'LOFT'; chips.push({ label: 'Type', value: 'Loft' }) }
        else if (/\bduplex\b/.test(q)) { filters.type = 'DUPLEX'; chips.push({ label: 'Type', value: 'Duplex' }) }
      }

      // Furnished
      if (/\bmeuble\b/.test(q) && !/\b(?:non|pas)[- ]meuble\b/.test(q)) { filters.furnished = true; chips.push({ label: 'Meublé', value: 'Oui' }) }
      else if (/\b(?:non|pas)[- ]?meuble\b|\bvide\b/.test(q)) { filters.furnished = false; chips.push({ label: 'Meublé', value: 'Non' }) }

      // Amenities
      if (/\bparking\b|\bgarage\b/.test(q)) { filters.hasParking = true; chips.push({ label: 'Parking', value: 'Oui' }) }
      if (/\bascenseur\b/.test(q)) { filters.hasElevator = true; chips.push({ label: 'Ascenseur', value: 'Oui' }) }
      if (/\bjardin\b|\bterrasse\b/.test(q)) { filters.hasGarden = true; chips.push({ label: 'Jardin/Terrasse', value: 'Oui' }) }
      if (/\bbalcon\b/.test(q)) { filters.hasBalcony = true; chips.push({ label: 'Balcon', value: 'Oui' }) }

      // City — with or without preposition
      const cityWithPrep = q.match(/\b(?:[aà]|au|en|sur|dans|proche)\s+([a-zà-ÿ][a-zà-ÿ\s-]{2,25})(?:\b|$)/)
      const cityDirect = q.match(/\b([A-ZÀ-Ÿ][a-zà-ÿ]{2,}(?:[-\s][A-ZÀ-Ÿ][a-zà-ÿ]+)?)\b/)
      const stopWords = new Set(['moins', 'plus', 'minimum', 'maximum', 'centre', 'etage', 'pieces', 'chambres', 'meuble', 'parking', 'studio', 'maison', 'appartement', 'loft', 'duplex', 'ascenseur', 'balcon', 'jardin', 'garage', 'terrasse'])
      const cityRaw = cityWithPrep?.[1] ?? cityDirect?.[1] ?? null
      if (cityRaw) {
        const c = cityRaw.trim()
        if (!stopWords.has(c.toLowerCase())) {
          filters.city = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
          chips.push({ label: 'Ville', value: filters.city as string })
        }
      }

      return res.status(200).json({
        success: true,
        data: { filters, chips, originalQuery: query },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/properties/:id/contact
   * Contact property owner
   */
  async contactProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { name, email, phone, message } = req.body
      const userId = req.user?.id

      // Validation
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required',
        })
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        })
      }

      const result = await propertyService.contactOwner(
        id,
        { name, email, phone, message },
        userId
      )

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({
            success: false,
            message: 'Property not found',
          })
        }
        if (error.message.includes('not available')) {
          return res.status(400).json({
            success: false,
            message: error.message,
          })
        }
      }
      next(error)
    }
  }
  /**
   * GET /api/v1/properties/admin/pending-review
   * Get all properties pending admin review
   */
  async getPendingReviewProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const properties = await propertyService.getPendingReviewProperties()
      return res.status(200).json({ success: true, data: { properties } })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/properties/:id/approve
   * Approve a property (admin)
   */
  async approveProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const property = await propertyService.approveProperty(id)
      return res.status(200).json({ success: true, message: 'Bien approuvé et publié', data: { property } })
    } catch (error) {
      if (error instanceof Error && error.message === 'Property not found') {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }
      next(error)
    }
  }

  /**
   * PATCH /api/v1/properties/:id/reject
   * Reject a property (admin)
   */
  async rejectProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { reviewNote } = req.body
      if (!reviewNote) {
        return res.status(400).json({ success: false, message: 'Une note de refus est requise' })
      }
      const property = await propertyService.rejectProperty(id, reviewNote)
      return res.status(200).json({ success: true, message: 'Bien refusé', data: { property } })
    } catch (error) {
      if (error instanceof Error && error.message === 'Property not found') {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }
      next(error)
    }
  }

  /**
   * POST /api/v1/properties/:id/verification-document
   * Upload owner verification document (ID or property proof)
   */
  async uploadVerificationDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      const { type } = req.body // 'ownerIdDocument' or 'propertyProofDocument'

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucun fichier fourni' })
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: 'Seuls les fichiers PDF sont acceptes' })
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Le fichier ne doit pas depasser 5 Mo' })
      }

      if (!type || !['ownerIdDocument', 'propertyProofDocument'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Type de document invalide' })
      }

      const fileUrl = await saveFile(req.file.buffer, req.file.originalname, req.file.mimetype)

      const property = await propertyService.updateProperty(id, userId, {
        [type]: fileUrl,
      })

      return res.status(200).json({
        success: true,
        message: 'Document televerse avec succes',
        data: { property, fileUrl },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Property not found') {
          return res.status(404).json({ success: false, message: 'Property not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }
}

export const propertyController = new PropertyController()
