/**
 * Super Admin Service — Cerveau Central
 * Accès total plateforme pour le SUPER_ADMIN
 */

import { prisma } from '../config/database.js'
import { UserRole } from '@prisma/client'
import { validateTableName } from '../middlewares/security.middleware.js'

class SuperAdminService {
  // ─────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────

  async createAuditLog(params: {
    actorId?: string
    actorEmail?: string
    action: string
    resource: string
    resourceId?: string
    metadata?: Record<string, unknown>
    severity?: 'INFO' | 'WARNING' | 'CRITICAL'
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata as any,
        severity: params.severity ?? 'INFO',
      },
    })
  }

  async getAuditLogs(page = 1, limit = 50, filters?: { action?: string; severity?: string }) {
    const skip = (page - 1) * limit
    const where: any = {}
    if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' }
    if (filters?.severity) where.severity = filters.severity

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ─────────────────────────────────────────────
  // PLATFORM STATISTICS
  // ─────────────────────────────────────────────

  async getPlatformStats() {
    const [
      totalUsers,
      tenants,
      owners,
      admins,
      superAdmins,
      totalProperties,
      publishedProperties,
      totalContracts,
      activeContracts,
      totalBookings,
      confirmedBookings,
      totalDocuments,
      totalMessages,
      totalConversations,
      auditLogCount,
      // New users last 7 days
      newUsersLast7,
      newUsersLast30,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.property.count(),
      prisma.property.count({ where: { status: 'AVAILABLE' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.tenantDocument.count(),
      prisma.message.count(),
      prisma.conversation.count(),
      prisma.auditLog.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    // Growth data: users per day last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day
    const growthMap: Record<string, number> = {}
    for (const u of recentUsers) {
      const day = u.createdAt.toISOString().split('T')[0]
      growthMap[day] = (growthMap[day] ?? 0) + 1
    }
    const growthData = Object.entries(growthMap).map(([date, count]) => ({ date, count }))

    return {
      users: { total: totalUsers, tenants, owners, admins, superAdmins, newLast7: newUsersLast7, newLast30: newUsersLast30 },
      properties: { total: totalProperties, published: publishedProperties },
      contracts: { total: totalContracts, active: activeContracts },
      bookings: { total: totalBookings, confirmed: confirmedBookings },
      documents: { total: totalDocuments },
      messages: { total: totalMessages, conversations: totalConversations },
      auditLogs: { total: auditLogCount },
      growthData,
    }
  }

  // ─────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 30, filters?: {
    role?: string
    search?: string
    emailVerified?: boolean
  }) {
    const skip = (page - 1) * limit
    const where: any = {}
    if (filters?.role) where.role = filters.role
    if (filters?.emailVerified !== undefined) where.emailVerified = filters.emailVerified
    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          emailVerified: true, phoneVerified: true, phone: true, avatar: true,
          createdAt: true, lastLoginAt: true, totpEnabled: true,
          _count: {
            select: {
              ownedProperties: true,
              tenantContracts: true,
              bookings: true,
              tenantDocuments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getUserDetail(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // Properties owned
        ownedProperties: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, title: true, status: true, price: true, city: true,
            type: true, surface: true, bedrooms: true, createdAt: true,
            views: true, contactCount: true, images: true,
          },
        },
        // Contracts as tenant
        tenantContracts: {
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { title: true, city: true, address: true } },
            owner: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        // Contracts as owner
        ownerContracts: {
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { title: true, city: true } },
            tenant: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        // Bookings (as tenant)
        bookings: {
          include: { property: { select: { title: true, city: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        // Tenant documents
        tenantDocuments: { orderBy: { createdAt: 'desc' } },
        // Notifications (last 20)
        notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
        // Conversations where user is user1 or user2
        conversationsUser1: {
          orderBy: { lastMessageAt: 'desc' },
          take: 30,
          include: {
            user2: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        conversationsUser2: {
          orderBy: { lastMessageAt: 'desc' },
          take: 30,
          include: {
            user1: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        // Favorites
        favorites: {
          include: { property: { select: { id: true, title: true, city: true, price: true } } },
        },
      },
    })
    if (!user) throw new Error('User not found')

    // Count messages sent
    const messageCount = await prisma.message.count({ where: { senderId: id } })

    return { ...user, messageCount }
  }

  async updateUserRole(id: string, role: UserRole, actorId: string, actorEmail: string) {
    const before = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    const user = await prisma.user.update({ where: { id }, data: { role } })
    await this.createAuditLog({
      actorId,
      actorEmail,
      action: 'UPDATE_USER_ROLE',
      resource: 'User',
      resourceId: id,
      metadata: { before: { role: before?.role }, after: { role }, targetEmail: user.email },
      severity: 'WARNING',
    })
    return user
  }

  async deleteUser(id: string, actorId: string, actorEmail: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } })
    if (!user) throw new Error('User not found')
    await prisma.user.delete({ where: { id } })
    await this.createAuditLog({
      actorId,
      actorEmail,
      action: 'DELETE_USER',
      resource: 'User',
      resourceId: id,
      metadata: { deletedUser: { email: user.email, role: user.role } },
      severity: 'CRITICAL',
    })
    return { message: 'User deleted' }
  }

  async forceVerifyEmail(id: string, actorId: string, actorEmail: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    })
    await this.createAuditLog({
      actorId, actorEmail, action: 'FORCE_VERIFY_EMAIL',
      resource: 'User', resourceId: id,
      metadata: { targetEmail: user.email }, severity: 'WARNING',
    })
    return user
  }

  // ─────────────────────────────────────────────
  // DOSSIERS / TENANT DOCUMENTS
  // ─────────────────────────────────────────────

  async getAllDossiers(page = 1, limit = 30, filters?: { status?: string; category?: string }) {
    const skip = (page - 1) * limit
    const where: any = {}
    if (filters?.status) where.status = filters.status
    if (filters?.category) where.category = filters.category

    const [documents, total] = await Promise.all([
      prisma.tenantDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.tenantDocument.count({ where }),
    ])

    return { documents, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateDocumentStatus(
    id: string,
    status: 'PENDING' | 'UPLOADED' | 'VALIDATED' | 'REJECTED',
    note: string | undefined,
    actorId: string,
    actorEmail: string
  ) {
    const doc = await prisma.tenantDocument.update({
      where: { id },
      data: { status, note },
      include: { user: { select: { email: true } } },
    })
    await this.createAuditLog({
      actorId, actorEmail, action: `DOCUMENT_${status}`,
      resource: 'TenantDocument', resourceId: id,
      metadata: { docType: doc.docType, userEmail: doc.user.email, note, status },
      severity: status === 'REJECTED' ? 'WARNING' : 'INFO',
    })
    return doc
  }

  // ─────────────────────────────────────────────
  // DB EXPLORER (read-only)
  // ─────────────────────────────────────────────

  async getTableList() {
    return [
      'users', 'properties', 'bookings', 'contracts', 'contract_documents',
      'tenant_documents', 'conversations', 'messages', 'notifications',
      'favorites', 'audit_logs', 'refresh_tokens', 'verification_tokens',
      'visit_availability_slots', 'visit_date_overrides',
    ]
  }

  async queryTable(table: string, page = 1, limit = 50) {
    if (!validateTableName(table)) throw new Error('Table not allowed')

    const skip = (page - 1) * limit

    // Use tagged template ($queryRaw) — table name validated above, pagination params are typed numbers
    const tableId = table as string // already whitelisted
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableId}" ORDER BY "createdAt" DESC NULLS LAST LIMIT $1 OFFSET $2`,
      Number(limit),
      Number(skip)
    )
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${tableId}"`
    )
    const total = Number(countResult[0]?.count ?? 0)

    return { table, rows, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ─────────────────────────────────────────────
  // MESSAGE INTERCEPTOR
  // ─────────────────────────────────────────────

  async getAllConversations(page = 1, limit = 30, search?: string) {
    const skip = (page - 1) * limit
    const where: any = {}
    if (search) {
      where.OR = [
        { user1: { email: { contains: search, mode: 'insensitive' } } },
        { user2: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          user1: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          user2: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ])

    return { conversations, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getConversationMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ])
    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ─────────────────────────────────────────────
  // CONTRACTS OVERVIEW
  // ─────────────────────────────────────────────

  async getAllContracts(page = 1, limit = 30, filters?: { status?: string }) {
    const skip = (page - 1) * limit
    const where: any = {}
    if (filters?.status) where.status = filters.status

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { email: true, firstName: true, lastName: true } },
          owner: { select: { email: true, firstName: true, lastName: true } },
          property: { select: { title: true, city: true } },
        },
      }),
      prisma.contract.count({ where }),
    ])

    return { contracts, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}

export const superAdminService = new SuperAdminService()
