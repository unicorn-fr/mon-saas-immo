import { PrismaClient, UserRole, PropertyStatus, BookingStatus, ContractStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface PlatformStatistics {
  users: {
    total: number
    owners: number
    tenants: number
    admins: number
    newThisMonth: number
  }
  properties: {
    total: number
    available: number
    occupied: number
    draft: number
  }
  bookings: {
    total: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
  }
  contracts: {
    total: number
    active: number
    draft: number
    terminated: number
    expired: number
  }
  activity: {
    totalViews: number
    totalContacts: number
    totalMessages: number
  }
}

interface UserFilters {
  role?: UserRole
  emailVerified?: boolean
  searchQuery?: string
}

class AdminService {
  /**
   * Get platform-wide statistics
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      // Users
      totalUsers,
      ownerCount,
      tenantCount,
      adminCount,
      newUsersThisMonth,
      // Properties
      totalProperties,
      availableProperties,
      occupiedProperties,
      draftProperties,
      // Bookings
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      // Contracts
      totalContracts,
      activeContracts,
      draftContracts,
      terminatedContracts,
      expiredContracts,
      // Activity
      totalViews,
      totalContacts,
      totalMessages,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.OWNER } }),
      prisma.user.count({ where: { role: UserRole.TENANT } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      // Properties
      prisma.property.count(),
      prisma.property.count({ where: { status: PropertyStatus.AVAILABLE } }),
      prisma.property.count({ where: { status: PropertyStatus.OCCUPIED } }),
      prisma.property.count({ where: { status: PropertyStatus.DRAFT } }),
      // Bookings
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      // Contracts
      prisma.contract.count(),
      prisma.contract.count({ where: { status: ContractStatus.ACTIVE } }),
      prisma.contract.count({ where: { status: ContractStatus.DRAFT } }),
      prisma.contract.count({ where: { status: ContractStatus.TERMINATED } }),
      prisma.contract.count({ where: { status: ContractStatus.EXPIRED } }),
      // Activity
      prisma.property.aggregate({ _sum: { views: true } }),
      prisma.property.aggregate({ _sum: { contactCount: true } }),
      prisma.message.count(),
    ])

    return {
      users: {
        total: totalUsers,
        owners: ownerCount,
        tenants: tenantCount,
        admins: adminCount,
        newThisMonth: newUsersThisMonth,
      },
      properties: {
        total: totalProperties,
        available: availableProperties,
        occupied: occupiedProperties,
        draft: draftProperties,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        draft: draftContracts,
        terminated: terminatedContracts,
        expired: expiredContracts,
      },
      activity: {
        totalViews: totalViews._sum.views || 0,
        totalContacts: totalContacts._sum.contactCount || 0,
        totalMessages: totalMessages,
      },
    }
  }

  /**
   * Get all users with filters
   */
  async getUsers(
    filters: UserFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ users: any[]; total: number; page: number; limit: number }> {
    const where: any = {}

    if (filters.role) {
      where.role = filters.role
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified
    }

    if (filters.searchQuery) {
      where.OR = [
        { firstName: { contains: filters.searchQuery, mode: 'insensitive' } },
        { lastName: { contains: filters.searchQuery, mode: 'insensitive' } },
        { email: { contains: filters.searchQuery, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              ownedProperties: true,
              bookings: true,
              sentMessages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      total,
      page,
      limit,
    }
  }

  /**
   * Get user by ID (admin view with all details)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedProperties: {
          select: {
            id: true,
            title: true,
            city: true,
            status: true,
            price: true,
            createdAt: true,
          },
        },
        bookings: {
          select: {
            id: true,
            visitDate: true,
            status: true,
            property: {
              select: {
                id: true,
                title: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tenantContracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        ownerContracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return userWithoutPassword
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    return updatedUser
  }

  /**
   * Delete user (admin only) - soft delete by deactivating
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // In a real app, you might want to do a soft delete or archive
    // For now, we'll actually delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    return { message: 'User deleted successfully' }
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit = 20) {
    const [recentUsers, recentProperties, recentBookings, recentContracts] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.property.findMany({
        select: {
          id: true,
          title: true,
          city: true,
          status: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.booking.findMany({
        select: {
          id: true,
          visitDate: true,
          status: true,
          property: {
            select: {
              title: true,
            },
          },
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.contract.findMany({
        select: {
          id: true,
          status: true,
          startDate: true,
          property: {
            select: {
              title: true,
            },
          },
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    return {
      users: recentUsers,
      properties: recentProperties,
      bookings: recentBookings,
      contracts: recentContracts,
    }
  }
}

export const adminService = new AdminService()
