/**
 * TOTP 2FA Service — Google Authenticator / Authy compatible (RFC 6238)
 * Uses otplib v13 functional API with noble/scure plugins (zero native deps)
 */

import {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret,
  generateSync,
  verifySync,
  generateURI,
} from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '../config/database.js'

const APP_NAME = 'ImmoParticuliers'
const crypto = new NobleCryptoPlugin()
const base32 = new ScureBase32Plugin()

const totpOpts = { crypto, base32 }

// ── Setup ───────────────────────────────────────────────────────────────────

/**
 * Generate a new TOTP secret for a user and return the QR code as base64 PNG.
 * The secret is saved to DB but TOTP is NOT yet enabled (enabled only after verification).
 */
export async function setupTotp(userId: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } })

  const secret = generateSecret()
  const uri = generateURI({ label: user.email, issuer: APP_NAME, secret })
  const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 256, margin: 2 })

  // Save secret (not yet enabled)
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabled: false },
  })

  return { secret, qrCodeDataUrl }
}

// ── Enable ──────────────────────────────────────────────────────────────────

/**
 * Verify a TOTP code and enable 2FA for the user.
 * Must be called after setupTotp with the code from the authenticator app.
 */
export async function enableTotp(userId: string, token: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  })

  if (!user.totpSecret) {
    throw new Error('TOTP non configure. Appelez /totp/setup en premier.')
  }
  if (user.totpEnabled) {
    throw new Error('TOTP est deja actif.')
  }

  const result = verifySync({ token, secret: user.totpSecret, ...totpOpts })
  if (!result.valid) {
    throw new Error('Code invalide. Verifiez que votre application est synchronisee.')
  }

  await prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } })
}

// ── Disable ─────────────────────────────────────────────────────────────────

/**
 * Disable TOTP for a user. Requires a valid TOTP code as confirmation.
 */
export async function disableTotp(userId: string, token: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  })

  if (!user.totpEnabled || !user.totpSecret) {
    throw new Error("TOTP n'est pas actif.")
  }

  const result = verifySync({ token, secret: user.totpSecret, ...totpOpts })
  if (!result.valid) {
    throw new Error('Code invalide. 2FA non desactive.')
  }

  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null },
  })
}

// ── Verify during login ─────────────────────────────────────────────────────

/**
 * Check TOTP during login. Returns true if valid (or if TOTP not enabled).
 */
export async function verifyTotpForLogin(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  })
  if (!user?.totpEnabled || !user?.totpSecret) return true
  const result = verifySync({ token, secret: user.totpSecret, ...totpOpts })
  return result.valid
}

/**
 * Check if a user has TOTP enabled.
 */
export async function isTotpEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpEnabled: true } })
  return user?.totpEnabled ?? false
}
