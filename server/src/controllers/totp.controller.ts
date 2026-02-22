import { Request, Response } from 'express'
import * as totpService from '../services/totp.service.js'
import { prisma } from '../config/database.js'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js'

/**
 * GET /api/v1/auth/totp/setup
 * Generate QR code for TOTP setup (authenticated user)
 */
export async function setup(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId
    const result = await totpService.setupTotp(userId)
    return res.json({
      success: true,
      message: 'Scannez le QR code avec Google Authenticator ou Authy',
      data: {
        qrCodeDataUrl: result.qrCodeDataUrl,
        secret: result.secret, // for manual entry
      },
    })
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/v1/auth/totp/enable
 * Confirm setup with a valid code → enables TOTP
 * Body: { token: "123456" }
 */
export async function enable(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId
    const { token } = req.body
    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ success: false, message: 'Code TOTP invalide (6 chiffres)' })
    }
    await totpService.enableTotp(userId, token)
    return res.json({ success: true, message: 'Authentification a deux facteurs activee' })
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/v1/auth/totp/disable
 * Disable TOTP — requires current TOTP code as confirmation
 * Body: { token: "123456" }
 */
export async function disable(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId
    const { token } = req.body
    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ success: false, message: 'Code TOTP requis pour desactiver la 2FA' })
    }
    await totpService.disableTotp(userId, token)
    return res.json({ success: true, message: 'Authentification a deux facteurs desactivee' })
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * POST /api/v1/auth/totp/verify
 * Verify TOTP code during login (called after password check)
 * Body: { userId: "...", token: "123456" }
 */
export async function verify(req: Request, res: Response) {
  try {
    const { userId, token } = req.body
    if (!userId || !token) {
      return res.status(400).json({ success: false, message: 'userId et token requis' })
    }
    const valid = await totpService.verifyTotpForLogin(userId, token)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Code TOTP incorrect' })
    }

    // Issue JWT tokens now that 2FA is confirmed
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, avatar: true, emailVerified: true },
    })

    const jwtPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    return res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar, emailVerified: user.emailVerified },
        accessToken,
        refreshToken,
      },
    })
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * GET /api/v1/auth/totp/status
 * Get TOTP status for current user
 */
export async function status(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId
    const enabled = await totpService.isTotpEnabled(userId)
    return res.json({ success: true, data: { totpEnabled: enabled } })
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message })
  }
}
