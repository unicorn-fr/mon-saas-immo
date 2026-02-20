import { Request, Response, NextFunction } from 'express'
import { propertyService } from '../services/property.service.js'
import { PropertyType, PropertyStatus } from '@prisma/client'
import { saveFile } from '../utils/upload.util.js'

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
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
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

      const fileUrl = saveFile(req.file.buffer, req.file.originalname)

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
