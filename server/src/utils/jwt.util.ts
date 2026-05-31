import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

/**
 * Generate Access Token (short-lived)
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as string,
    issuer: 'immo-particuliers',
    audience: 'immo-particuliers-api',
  } as jwt.SignOptions)
}

/**
 * Generate Refresh Token (long-lived)
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION as string,
    issuer: 'immo-particuliers',
    audience: 'immo-particuliers-api',
  } as jwt.SignOptions)
}

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'immo-particuliers',
      audience: 'immo-particuliers-api',
    }) as JwtPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw new Error('Token verification failed')
  }
}

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'immo-particuliers',
      audience: 'immo-particuliers-api',
    }) as JwtPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    }
    throw new Error('Refresh token verification failed')
  }
}

/**
 * Generate Pre-Auth Token (very short-lived, single-use indicator for TOTP step)
 * Issued after password check succeeds but before TOTP verification.
 */
export const generatePreAuthToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, purpose: 'totp-step' },
    env.JWT_SECRET,
    { expiresIn: '5m', issuer: 'immo-particuliers', audience: 'immo-particuliers-totp' }
  )
}

/**
 * Verify a Pre-Auth Token (TOTP step)
 */
export const verifyPreAuthToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'immo-particuliers',
      audience: 'immo-particuliers-totp',
    }) as { userId: string; email: string; purpose: string }
    if (decoded.purpose !== 'totp-step') throw new Error('Invalid token purpose')
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    throw new Error('Invalid or expired pre-auth token')
  }
}

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch {
    return null
  }
}
