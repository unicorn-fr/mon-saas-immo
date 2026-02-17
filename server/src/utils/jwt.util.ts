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
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch {
    return null
  }
}
