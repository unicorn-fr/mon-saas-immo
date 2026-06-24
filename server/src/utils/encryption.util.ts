import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

// Clé générée une fois au démarrage si KYC_ENCRYPTION_KEY n'est pas définie.
// En production, toujours définir KYC_ENCRYPTION_KEY dans Railway Variables.
// En dev/test : la clé change à chaque redémarrage (embeddings stockés ne seront plus lisibles).
let _fallbackKey: Buffer | null = null

function getKey(): Buffer {
  const KEY_HEX = process.env.KYC_ENCRYPTION_KEY || ''
  if (KEY_HEX && KEY_HEX.length >= 64) {
    return Buffer.from(KEY_HEX.substring(0, 64), 'hex')
  }
  // Fallback : clé éphémère générée au démarrage (warning affiché une seule fois)
  if (!_fallbackKey) {
    _fallbackKey = randomBytes(32)
    console.warn('[KYC] ⚠️  KYC_ENCRYPTION_KEY non définie — utilisation d\'une clé éphémère.')
    console.warn('[KYC] ⚠️  Définissez KYC_ENCRYPTION_KEY=<64 hex chars> dans Railway Variables pour la production.')
  }
  return _fallbackKey
}

export function encryptField(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptField(encoded: string): string {
  const key = getKey()
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(ciphertext) + decipher.final('utf8')
}

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function hashChainEntry(previousHash: string, data: object): { hash: string; entry: object } {
  const entry = { ...data, previousHash, timestamp: new Date().toISOString() }
  const hash = sha256(JSON.stringify(entry))
  return { hash, entry: { ...entry, hash } }
}
