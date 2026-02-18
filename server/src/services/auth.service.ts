import { UserRole } from '@prisma/client'
import { prisma } from '../config/database.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../utils/jwt.util.js'
import { hashPassword, comparePassword } from '../utils/password.util.js'
import { validateEmail } from '../utils/validation.util.js'
import { generateSecureToken } from '../utils/token.util.js'
import { sendEmail } from '../utils/email.util.js'
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

    // Send verification email (or auto-verify if SMTP not configured)
    if (!env.SMTP.HOST) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      })
      user.emailVerified = true
    } else {
      const verificationToken = generateSecureToken()
      const tokenExpiresAt = new Date()
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24)

      await prisma.verificationToken.create({
        data: {
          token: verificationToken,
          userId: user.id,
          type: 'EMAIL_VERIFY',
          expiresAt: tokenExpiresAt,
        },
      })

      const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`
      await sendEmail({
        to: user.email,
        subject: 'Verifiez votre adresse email - ImmoParticuliers',
        html: `
          <h2>Bienvenue sur ImmoParticuliers !</h2>
          <p>Cliquez sur le lien ci-dessous pour verifier votre adresse email :</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#00BCD4;color:#fff;text-decoration:none;border-radius:8px;">Verifier mon email</a></p>
          <p>Ce lien expire dans 24 heures.</p>
          <p>Si vous n'avez pas cree de compte, ignorez cet email.</p>
        `,
      })
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

    // Generate new token
    const token = generateSecureToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.verificationToken.create({
      data: {
        token,
        userId,
        type: 'EMAIL_VERIFY',
        expiresAt,
      },
    })

    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`
    await sendEmail({
      to: user.email,
      subject: 'Verifiez votre adresse email - ImmoParticuliers',
      html: `
        <h2>Verification de votre email</h2>
        <p>Cliquez sur le lien ci-dessous pour verifier votre adresse email :</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#00BCD4;color:#fff;text-decoration:none;border-radius:8px;">Verifier mon email</a></p>
        <p>Ce lien expire dans 24 heures.</p>
      `,
    })
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
    await sendEmail({
      to: user.email,
      subject: 'Reinitialisation de votre mot de passe - ImmoParticuliers',
      html: `
        <h2>Reinitialisation du mot de passe</h2>
        <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#00BCD4;color:#fff;text-decoration:none;border-radius:8px;">Reinitialiser mon mot de passe</a></p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      `,
    })
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
  async googleAuth(idToken: string): Promise<AuthResponse> {
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
    } catch {
      throw new Error('Invalid Google token')
    }

    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload')
    }

    const { email, sub: googleId, given_name, family_name, picture } = payload

    // Check if user exists with this googleId
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
        // Create new user
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
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string; bio?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.bio !== undefined && { bio: data.bio || null }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
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
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }
}

export const authService = new AuthService()
