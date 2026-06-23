import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const KEY_HEX = process.env.KYC_ENCRYPTION_KEY || ''
  if (!KEY_HEX || KEY_HEX.length < 64) {
    throw new Error('KYC_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(KEY_HEX, 'hex')
}

export function encryptField(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96 bits for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv(12) + authTag(16) + ciphertext — all base64
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
