import { createHash, randomBytes } from 'node:crypto'

/** Jeton aléatoire (256 bits) à transmettre au client. Seule son empreinte est stockée en base. */
export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}
