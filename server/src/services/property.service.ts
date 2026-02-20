import { PropertyType, PropertyStatus, DateOverrideType, Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import { messageService } from './message.service.js'

export interface VisitAvailabilitySlotInput {
  dayOfWeek: number  // 0-6
  startTime: string  // "09:00"
  endTime: string    // "18:00"
}

export interface VisitDateOverrideInput {
  date: string | Date
  type: 'BLOCKED' | 'EXTRA'
  startTime?: string
  endTime?: string
}

export interface CreatePropertyInput {
  ownerId: string
  title: string
  description: string
  type: PropertyType
  address: string
  city: string
  postalCode: string
  country?: string
  latitude?: number
  longitude?: number
  bedrooms: number
  bathrooms: number
  surface: number
  floor?: number
  totalFloors?: number
  furnished?: boolean
  price: number
  charges?: number
  deposit?: number
  images?: string[]
  virtualTour?: string
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
  availableFrom?: Date
  visitDuration?: number
  visitAvailabilitySlots?: VisitAvailabilitySlotInput[]
  visitDateOverrides?: VisitDateOverrideInput[]
}

export interface UpdatePropertyInput {
  title?: string
  description?: string
  type?: PropertyType
  status?: PropertyStatus
  address?: string
  city?: string
  postalCode?: string
  country?: string
  latitude?: number
  longitude?: number
  bedrooms?: number
  bathrooms?: number
  surface?: number
  floor?: number
  totalFloors?: number
  furnished?: boolean
  price?: number
  charges?: number
  deposit?: number
  images?: string[]
  virtualTour?: string
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
  availableFrom?: Date
  visitDuration?: number
  visitAvailabilitySlots?: VisitAvailabilitySlotInput[]
  visitDateOverrides?: VisitDateOverrideInput[]
}

export interface PropertyFilters {
  city?: string
  type?: PropertyType
  status?: PropertyStatus
  minPrice?: number
  maxPrice?: number
  minSurface?: number
  maxSurface?: number
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  hasParking?: boolean
  hasBalcony?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  amenities?: string[]
}

export interface AdvancedSearchFilters extends PropertyFilters {
  query?: string // Text search
  latitude?: number // For geolocation search
  longitude?: number
  radius?: number // Radius in km
  availableFrom?: string // Available from date
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class PropertyService {
  /**
   * Create a new property
   */
  async createProperty(data: CreatePropertyInput) {
    const { visitAvailabilitySlots, visitDateOverrides, ...propertyData } = data

    const property = await prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          ownerId: propertyData.ownerId,
          title: propertyData.title,
          description: propertyData.description,
          type: propertyData.type,
          status: PropertyStatus.DRAFT,
          address: propertyData.address,
          city: propertyData.city,
          postalCode: propertyData.postalCode,
          country: propertyData.country || 'France',
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          surface: propertyData.surface,
          floor: propertyData.floor,
          totalFloors: propertyData.totalFloors,
          furnished: propertyData.furnished || false,
          price: propertyData.price,
          charges: propertyData.charges,
          deposit: propertyData.deposit,
          images: propertyData.images || [],
          virtualTour: propertyData.virtualTour,
          hasParking: propertyData.hasParking || false,
          hasBalcony: propertyData.hasBalcony || false,
          hasElevator: propertyData.hasElevator || false,
          hasGarden: propertyData.hasGarden || false,
          amenities: propertyData.amenities || [],
          availableFrom: propertyData.availableFrom,
          visitDuration: propertyData.visitDuration || 30,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      })

      if (visitAvailabilitySlots && visitAvailabilitySlots.length > 0) {
        await tx.visitAvailabilitySlot.createMany({
          data: visitAvailabilitySlots.map((slot) => ({
            propertyId: created.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        })
      }

      if (visitDateOverrides && visitDateOverrides.length > 0) {
        await tx.visitDateOverride.createMany({
          data: visitDateOverrides.map((override) => ({
            propertyId: created.id,
            date: new Date(override.date),
            type: override.type as DateOverrideType,
            startTime: override.startTime,
            endTime: override.endTime,
          })),
        })
      }

      return created
    })

    return property
  }

  /**
   * Get property by ID
   */
  async getPropertyById(id: string, includeOwner = false) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: includeOwner
          ? {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            }
          : false,
        _count: {
          select: {
            bookings: true,
            favorites: true,
          },
        },
        visitAvailabilitySlots: {
          orderBy: { dayOfWeek: 'asc' },
        },
        visitDateOverrides: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Increment view count
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return property
  }

  /**
   * Update property
   */
  async updateProperty(id: string, ownerId: string, data: UpdatePropertyInput) {
    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.ownerId !== ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    const { visitAvailabilitySlots, visitDateOverrides, ...propertyData } = data

    const updatedProperty = await prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: propertyData,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      })

      if (visitAvailabilitySlots !== undefined) {
        await tx.visitAvailabilitySlot.deleteMany({ where: { propertyId: id } })
        if (visitAvailabilitySlots.length > 0) {
          await tx.visitAvailabilitySlot.createMany({
            data: visitAvailabilitySlots.map((slot) => ({
              propertyId: id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          })
        }
      }

      if (visitDateOverrides !== undefined) {
        await tx.visitDateOverride.deleteMany({ where: { propertyId: id } })
        if (visitDateOverrides.length > 0) {
          await tx.visitDateOverride.createMany({
            data: visitDateOverrides.map((override) => ({
              propertyId: id,
              date: new Date(override.date),
              type: override.type as DateOverrideType,
              startTime: override.startTime,
              endTime: override.endTime,
            })),
          })
        }
      }

      return updated
    })

    return updatedProperty
  }

  /**
   * Delete property
   */
  async deleteProperty(id: string, ownerId: string) {
    // Check ownership
    const property = await prisma.property.findUnique({
      where: { id },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.ownerId !== ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    await prisma.property.delete({
      where: { id },
    })

    return { message: 'Property deleted successfully' }
  }

  /**
   * Get properties with filters and pagination
   */
  async getProperties(
    filters: PropertyFilters = {},
    pagination: PaginationOptions = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.PropertyWhereInput = {}

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' }
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {}
      if (filters.minPrice) where.price.gte = filters.minPrice
      if (filters.maxPrice) where.price.lte = filters.maxPrice
    }

    if (filters.minSurface || filters.maxSurface) {
      where.surface = {}
      if (filters.minSurface) where.surface.gte = filters.minSurface
      if (filters.maxSurface) where.surface.lte = filters.maxSurface
    }

    if (filters.bedrooms !== undefined) {
      where.bedrooms = { gte: filters.bedrooms }
    }

    if (filters.bathrooms !== undefined) {
      where.bathrooms = { gte: filters.bathrooms }
    }

    if (filters.furnished !== undefined) {
      where.furnished = filters.furnished
    }

    if (filters.hasParking !== undefined) {
      where.hasParking = filters.hasParking
    }

    if (filters.hasBalcony !== undefined) {
      where.hasBalcony = filters.hasBalcony
    }

    if (filters.hasElevator !== undefined) {
      where.hasElevator = filters.hasElevator
    }

    if (filters.hasGarden !== undefined) {
      where.hasGarden = filters.hasGarden
    }

    if (filters.amenities && filters.amenities.length > 0) {
      where.amenities = { hasEvery: filters.amenities }
    }

    // Execute queries
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ])

    return {
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(
    ownerId: string,
    pagination: PaginationOptions = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination

    const skip = (page - 1) * limit

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: { ownerId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              bookings: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.property.count({ where: { ownerId } }),
    ])

    return {
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }
  }

  /**
   * Change property status (AVAILABLE, OCCUPIED, DRAFT)
   */
  async changePropertyStatus(id: string, ownerId: string, newStatus: PropertyStatus) {
    const allowedStatuses: PropertyStatus[] = [PropertyStatus.AVAILABLE, PropertyStatus.OCCUPIED, PropertyStatus.DRAFT]
    if (!allowedStatuses.includes(newStatus as PropertyStatus)) {
      throw new Error('Invalid status. Allowed: AVAILABLE, OCCUPIED, DRAFT')
    }

    const property = await prisma.property.findUnique({
      where: { id },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.ownerId !== ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    const updateData: { status: PropertyStatus; publishedAt?: Date } = { status: newStatus }

    if (newStatus === PropertyStatus.AVAILABLE && !property.publishedAt) {
      updateData.publishedAt = new Date()
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
    })

    return updatedProperty
  }

  /**
   * Publish property (change status from DRAFT to AVAILABLE)
   * Requires owner verification documents (ID + property proof)
   */
  async publishProperty(id: string, ownerId: string) {
    const property = await prisma.property.findUnique({ where: { id } })

    if (!property) {
      throw new Error('Property not found')
    }

    if (property.ownerId !== ownerId) {
      throw new Error('Unauthorized: You do not own this property')
    }

    if (!property.ownerIdDocument) {
      throw new Error('Vous devez fournir une piece d\'identite en cours de validite avant de publier le bien.')
    }

    if (!property.propertyProofDocument) {
      throw new Error('Vous devez fournir une preuve de propriete (titre de propriete ou taxe fonciere) avant de publier le bien.')
    }

    return this.changePropertyStatus(id, ownerId, PropertyStatus.AVAILABLE)
  }

  /**
   * Mark property as occupied
   */
  async markAsOccupied(id: string, ownerId: string) {
    return this.changePropertyStatus(id, ownerId, PropertyStatus.OCCUPIED)
  }

  /**
   * Get property statistics for owner
   */
  async getOwnerStatistics(ownerId: string) {
    const [
      totalProperties,
      availableProperties,
      occupiedProperties,
      draftProperties,
      totalViews,
      totalContacts,
    ] = await Promise.all([
      prisma.property.count({ where: { ownerId } }),
      prisma.property.count({
        where: { ownerId, status: PropertyStatus.AVAILABLE },
      }),
      prisma.property.count({
        where: { ownerId, status: PropertyStatus.OCCUPIED },
      }),
      prisma.property.count({
        where: { ownerId, status: PropertyStatus.DRAFT },
      }),
      prisma.property.aggregate({
        where: { ownerId },
        _sum: { views: true },
      }),
      prisma.property.aggregate({
        where: { ownerId },
        _sum: { contactCount: true },
      }),
    ])

    return {
      totalProperties,
      availableProperties,
      occupiedProperties,
      draftProperties,
      totalViews: totalViews._sum.views || 0,
      totalContacts: totalContacts._sum.contactCount || 0,
    }
  }

  /**
   * Increment contact count
   */
  async incrementContactCount(id: string) {
    await prisma.property.update({
      where: { id },
      data: { contactCount: { increment: 1 } },
    })
  }

  /**
   * Search properties by text (title, description, address, city)
   */
  async searchProperties(
    query: string,
    pagination: PaginationOptions = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination

    const skip = (page - 1) * limit

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.AVAILABLE,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ],
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ])

    return {
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }
  }

  /**
   * Advanced search with multiple filters and geolocation
   */
  async advancedSearch(
    filters: AdvancedSearchFilters,
    pagination: PaginationOptions = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.AVAILABLE,
    }

    // Text search
    if (filters.query && filters.query.trim()) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { city: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
      ]
    }

    // City filter
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' }
    }

    // Type filter
    if (filters.type) {
      where.type = filters.type
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {}
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
    }

    // Surface range
    if (filters.minSurface !== undefined || filters.maxSurface !== undefined) {
      where.surface = {}
      if (filters.minSurface !== undefined) where.surface.gte = filters.minSurface
      if (filters.maxSurface !== undefined) where.surface.lte = filters.maxSurface
    }

    // Bedrooms range
    if (filters.minBedrooms !== undefined || filters.maxBedrooms !== undefined) {
      where.bedrooms = {}
      if (filters.minBedrooms !== undefined) where.bedrooms.gte = filters.minBedrooms
      if (filters.maxBedrooms !== undefined) where.bedrooms.lte = filters.maxBedrooms
    } else if (filters.bedrooms !== undefined) {
      where.bedrooms = filters.bedrooms
    }

    // Bathrooms range
    if (filters.minBathrooms !== undefined || filters.maxBathrooms !== undefined) {
      where.bathrooms = {}
      if (filters.minBathrooms !== undefined) where.bathrooms.gte = filters.minBathrooms
      if (filters.maxBathrooms !== undefined) where.bathrooms.lte = filters.maxBathrooms
    } else if (filters.bathrooms !== undefined) {
      where.bathrooms = filters.bathrooms
    }

    // Boolean filters
    if (filters.furnished !== undefined) where.furnished = filters.furnished
    if (filters.hasParking !== undefined) where.hasParking = filters.hasParking
    if (filters.hasBalcony !== undefined) where.hasBalcony = filters.hasBalcony
    if (filters.hasElevator !== undefined) where.hasElevator = filters.hasElevator
    if (filters.hasGarden !== undefined) where.hasGarden = filters.hasGarden

    // Amenities filter (all must match)
    if (filters.amenities && filters.amenities.length > 0) {
      where.amenities = {
        hasEvery: filters.amenities,
      }
    }

    // Available from date
    if (filters.availableFrom) {
      where.OR = [
        { availableFrom: { lte: new Date(filters.availableFrom) } },
        { availableFrom: null },
      ]
    }

    // Fetch properties
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ])

    // Filter by geolocation if provided (post-database filtering)
    let filteredProperties = properties
    if (filters.latitude !== undefined && filters.longitude !== undefined && filters.radius) {
      filteredProperties = properties.filter((property) => {
        if (!property.latitude || !property.longitude) return false

        const distance = this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          property.latitude,
          property.longitude
        )

        return distance <= filters.radius!
      })

      // Add distance to properties
      filteredProperties = filteredProperties.map((property) => ({
        ...property,
        distance: this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          property.latitude!,
          property.longitude!
        ),
      }))

      // Sort by distance if geolocation provided
      if (sortBy === 'distance') {
        filteredProperties.sort((a: any, b: any) => {
          const distA = a.distance || 0
          const distB = b.distance || 0
          return sortOrder === 'asc' ? distA - distB : distB - distA
        })
      }
    }

    return {
      properties: filteredProperties,
      pagination: {
        total: filteredProperties.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProperties.length / limit),
        hasMore: page * limit < filteredProperties.length,
      },
      filters: filters, // Return applied filters
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10 // Round to 1 decimal
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Contact property owner
   */
  async contactOwner(
    propertyId: string,
    contactData: {
      name: string
      email: string
      phone?: string
      message: string
    },
    userId?: string
  ) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!property) {
      throw new Error('Property not found')
    }

    // Only allow contacting properties that are available
    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new Error('This property is not available for contact')
    }

    // Increment contact count
    await prisma.property.update({
      where: { id: propertyId },
      data: { contactCount: { increment: 1 } },
    })

    // If user is authenticated, create a conversation and send the message
    let conversationId: string | null = null
    if (userId) {
      try {
        const message = await messageService.sendMessage(userId, {
          receiverId: property.ownerId,
          content: contactData.message,
        })
        conversationId = message.conversationId
      } catch (err) {
        console.error('Failed to create conversation/message:', err)
      }
    }

    return {
      success: true,
      message: 'Your message has been sent to the property owner',
      propertyId,
      ownerId: property.ownerId,
      conversationId,
    }
  }
}

export const propertyService = new PropertyService()
