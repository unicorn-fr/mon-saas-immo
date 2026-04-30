import { UserRole, Prisma } from '@prisma/client'
import { prisma } from '../config/database.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../utils/jwt.util.js'
import { hashPassword, comparePassword } from '../utils/password.util.js'
import { validateEmail } from '../utils/validation.util.js'
import { validatePasswordStrength } from '../utils/password.util.js'
import { generateSecureToken } from '../utils/token.util.js'
import { sendEmail } from '../utils/email.util.js'
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  magicLinkTemplate,
} from '../utils/emailTemplates.js'
import { env } from '../config/env.js'

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    avatar: string | null
    emailVerified: boolean
  }
  accessToken: string
  refreshToken: string
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role, phone } = data

    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Invalid email format')
    }

    // Enforce password strength
    const pwCheck = validatePasswordStrength(password)
    if (!pwCheck.isValid) {
      throw new Error(pwCheck.errors[0])
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        emailVerified: true,
      },
    })

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    // Send verification email (or auto-verify if no email provider configured)
    const emailConfigured = !!(env.SMTP_HOST || env.RESEND_API_KEY)
    if (!emailConfigured) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      })
      user.emailVerified = true
    } else {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const tokenExpiresAt = new Date()
      tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 15)

      await prisma.verificationToken.create({
        data: {
          token: code,
          userId: user.id,
          type: 'EMAIL_VERIFY',
          expiresAt: tokenExpiresAt,
        },
      })

      const tpl = emailVerificationTemplate({ firstName: user.firstName, code })
      await sendEmail({ to: user.email, ...tpl })
    }

    return {
      user,
      accessToken,
      refreshToken,
    }
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        emailVerified: true,
        totpEnabled: true,
      },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // OAuth-only users cannot login with password
    if (!user.password) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    // Block login if email not verified
    if (!user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    // Verify refresh token
    let payload: JwtPayload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch (error) {
      throw new Error('Invalid or expired refresh token')
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken) {
      throw new Error('Refresh token not found')
    }

    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      })
      throw new Error('Refresh token has expired')
    }

    // Generate new tokens
    const jwtPayload: JwtPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    }

    const newAccessToken = generateAccessToken(jwtPayload)
    const newRefreshToken = generateRefreshToken(jwtPayload)

    // Delete old refresh token and create new one (token rotation)
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })
  }

  /**
   * Logout from all devices (delete all refresh tokens for user)
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }

  /**
   * Verify email with 6-digit code
   */
  async verifyEmailWithCode(email: string, code: string): Promise<void> {
    await this.verifyEmailWithCodeAndLogin(email, code)
  }

  async verifyEmailWithCodeAndLogin(email: string, code: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) throw new Error('Compte introuvable')
    if (user.emailVerified) throw new Error('Email déjà vérifié')

    const record = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: 'EMAIL_VERIFY', token: code },
    })

    if (!record) throw new Error('Code invalide')
    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } })
      throw new Error('Code expiré')
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, emailVerified: true },
    })

    await prisma.verificationToken.delete({ where: { id: record.id } })

    const tpl = welcomeTemplate({ firstName: user.firstName, loginUrl: `${env.FRONTEND_URL}/login` })
    await sendEmail({ to: user.email, ...tpl })

    const jwtPayload: JwtPayload = { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role }
    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: updatedUser.id, expiresAt } })

    return { user: updatedUser, accessToken, refreshToken }
  }

  /**
   * Verify email with token
   */
  async verifyEmailWithToken(token: string): Promise<void> {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      throw new Error('Invalid verification token')
    }

    if (verificationToken.type !== 'EMAIL_VERIFY') {
      throw new Error('Invalid token type')
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } })
      throw new Error('Verification token has expired')
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    })

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } })

    // Send welcome email
    const tpl = welcomeTemplate({
      firstName: verificationToken.user.firstName,
      loginUrl: `${env.FRONTEND_URL}/login`,
    })
    await sendEmail({ to: verificationToken.user.email, ...tpl })
  }

  /**
   * Resend verification email by email address (public — user not authenticated yet)
   */
  async resendVerificationByEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    // Silent return if user not found or already verified (prevent enumeration)
    if (!user || user.emailVerified) return

    await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: 'EMAIL_VERIFY' } })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await prisma.verificationToken.create({
      data: { token: code, userId: user.id, type: 'EMAIL_VERIFY', expiresAt },
    })

    const tpl = emailVerificationTemplate({ firstName: user.firstName, code })
    await sendEmail({ to: user.email, ...tpl })
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified')
    }

    // Delete existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId, type: 'EMAIL_VERIFY' },
    })

    // Generate new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await prisma.verificationToken.create({
      data: {
        token: code,
        userId,
        type: 'EMAIL_VERIFY',
        expiresAt,
      },
    })

    const tpl = emailVerificationTemplate({ firstName: user.firstName, code })
    await sendEmail({ to: user.email, ...tpl })
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists
      return
    }

    // Delete existing reset tokens
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id, type: 'PASSWORD_RESET' },
    })

    // Generate reset token
    const token = generateSecureToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    })

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`
    const tpl = passwordResetTemplate({ firstName: user.firstName, resetUrl })
    await sendEmail({ to: user.email, ...tpl })
  }

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(
    token: string,
    newPassword: string
  ): Promise<void> {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      throw new Error('Invalid or expired reset token')
    }

    if (verificationToken.type !== 'PASSWORD_RESET') {
      throw new Error('Invalid token type')
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } })
      throw new Error('Reset token has expired')
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { password: hashedPassword },
    })

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } })

    // Logout from all devices for security
    await this.logoutAllDevices(verificationToken.userId)
  }

  /**
   * Change password (when user is authenticated)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // OAuth-only users cannot change password
    if (!user.password) {
      throw new Error('Cannot change password for OAuth-only accounts')
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    )

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Logout from all other devices for security
    await this.logoutAllDevices(userId)
  }

  /**
   * Google OAuth authentication
   */
  async googleAuth(idToken: string): Promise<AuthResponse & { isNewUser: boolean }> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new Error('Google OAuth is not configured')
    }

    // Dynamic import of google-auth-library
    const { OAuth2Client } = await import('google-auth-library')
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)

    let payload
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      throw new Error(`Invalid Google token: ${detail}`)
    }

    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload')
    }

    const { email, sub: googleId, given_name, family_name, picture } = payload

    // Check if user exists with this googleId
    let isNewUser = false
    let user = await prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        emailVerified: true,
      },
    })

    if (!user) {
      // Check if user exists with same email
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId,
            emailVerified: true,
            emailVerifiedAt: existingUser.emailVerified ? undefined : new Date(),
            avatar: existingUser.avatar || picture || null,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            emailVerified: true,
          },
        })
      } else {
        // Create new user — blocked in waitlist mode
        if (env.LAUNCH_MODE === 'waitlist') {
          throw new Error('Les inscriptions sont fermées. Bailio ouvre bientôt — rejoignez la liste d\'attente.')
        }
        isNewUser = true
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            googleId,
            password: null,
            firstName: given_name || 'Utilisateur',
            lastName: family_name || 'Google',
            role: 'TENANT',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            avatar: picture || null,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            emailVerified: true,
          },
        })
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    return {
      user,
      accessToken,
      refreshToken,
      isNewUser,
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string; lastName?: string; phone?: string; bio?: string; role?: string
      // Identity document fields
      birthDate?: string; birthCity?: string; nationality?: string
      nationalNumber?: string; documentNumber?: string; documentExpiry?: string
      // Flexible AI-extracted metadata (JSON — merged, not overwritten)
      profileMeta?: Record<string, unknown>
    }
  ) {
    // profileMeta: deep-merge existing JSON with incoming data
    let mergedMeta: Record<string, unknown> | undefined
    if (data.profileMeta) {
      const existing = await prisma.user.findUnique({
        where: { id: userId }, select: { profileMeta: true },
      })
      const existingMeta = (existing?.profileMeta as Record<string, unknown>) ?? {}
      mergedMeta = { ...existingMeta, ...data.profileMeta }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName      !== undefined && { firstName:      data.firstName }),
        ...(data.lastName       !== undefined && { lastName:       data.lastName }),
        ...(data.phone          !== undefined && { phone:          data.phone || null }),
        ...(data.bio            !== undefined && { bio:            data.bio || null }),
        ...(data.birthDate      !== undefined && { birthDate:      data.birthDate || null }),
        ...(data.birthCity      !== undefined && { birthCity:      data.birthCity || null }),
        ...(data.nationality    !== undefined && { nationality:    data.nationality || null }),
        ...(data.nationalNumber !== undefined && { nationalNumber: data.nationalNumber || null }),
        ...(data.documentNumber !== undefined && { documentNumber: data.documentNumber || null }),
        ...(data.documentExpiry !== undefined && { documentExpiry: data.documentExpiry || null }),
        ...(data.role           !== undefined && { role: data.role as UserRole }),
        ...(mergedMeta          !== undefined && { profileMeta:    mergedMeta as Prisma.InputJsonValue }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatar: true, phone: true, bio: true,
        emailVerified: true, phoneVerified: true,
        birthDate: true, birthCity: true, nationality: true,
        nationalNumber: true, documentNumber: true, documentExpiry: true,
        profileMeta: true,
        createdAt: true, updatedAt: true,
      },
    })

    return user
  }

  /**
   * Get user by ID (for auth middleware)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatar: true, phone: true, bio: true,
        emailVerified: true, phoneVerified: true,
        birthDate: true, birthCity: true, nationality: true,
        documentExpiry: true,
        profileMeta: true,
        createdAt: true, updatedAt: true,
      },
    })

    return user
  }

  /**
   * Envoie un magic link par email.
   * Crée le compte si l'email est inconnu (nouveau utilisateur).
   * Lien valide 15 minutes, usage unique.
   */
  async sendMagicLink(email: string): Promise<{ isNewUser: boolean }> {
    if (!validateEmail(email)) throw new Error('Format email invalide')

    // Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    const isNewUser = !user

    if (!user) {
      // Nouveau compte — firstName déduit de l'email, complété au premier login
      const emailPrefix = email.split('@')[0].replace(/[^a-zA-ZÀ-ÿ]/g, ' ').trim() || 'Utilisateur'
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          firstName: emailPrefix,
          lastName: '',
          role: 'TENANT',
          emailVerified: false,
        },
      })
    }

    // Supprimer les tokens magic link précédents
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id, type: 'MAGIC_LINK' },
    })

    // Générer le token — expiration 15 min
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.verificationToken.create({
      data: { token, userId: user.id, type: 'MAGIC_LINK', expiresAt },
    })

    const magicUrl = `${env.FRONTEND_URL}/auth/verify?token=${token}`
    const tpl = magicLinkTemplate({ magicUrl, expiresMinutes: 15 })
    await sendEmail({ to: user.email, ...tpl })

    return { isNewUser }
  }

  /**
   * Vérifie le token magic link et retourne les tokens JWT.
   * Marque l'email comme vérifié, invalide le token.
   */
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!record || record.type !== 'MAGIC_LINK') {
      throw new Error('Lien invalide ou déjà utilisé')
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: record.id } })
      throw new Error('Lien expiré. Demandez-en un nouveau.')
    }

    // Activer le compte et mettre à jour lastLoginAt
    const user = await prisma.user.update({
      where: { id: record.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: record.user.emailVerifiedAt ?? new Date(),
        lastLoginAt: new Date(),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatar: true, emailVerified: true,
      },
    })

    // Consommer le token (usage unique)
    await prisma.verificationToken.delete({ where: { id: record.id } })

    // Générer les tokens JWT
    const jwtPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    })

    return { user, accessToken, refreshToken }
  }
}

export const authService = new AuthService()
