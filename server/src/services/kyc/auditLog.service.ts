import { createHash } from 'crypto'
import { hashChainEntry } from '../../utils/encryption.util.js'

export type KycEventType =
  | 'DOCUMENT_UPLOADED'
  | 'OCR_COMPLETED'
  | 'DOCUMENT_DELETED'
  | 'BIOMETRIC_CAPTURED'
  | 'LIVENESS_VERIFIED'
  | 'FACE_MATCHED'
  | 'SIGNATURE_STARTED'
  | 'SIGNATURE_COMPLETED'
  | 'VIDEO_RECORDED'
  | 'KYC_COMPLETED'
  | 'KYC_FAILED'

export interface AuditEntry {
  event: KycEventType
  userId: string
  metadata?: Record<string, unknown>
  timestamp: string
  previousHash: string
  hash: string
}

/**
 * Ajoute une entrée dans la chaîne d'audit.
 * Chaque entrée contient le hash de la précédente → tamper-evident.
 */
export function appendAuditEntry(
  currentChain: string | null | undefined,
  event: KycEventType,
  userId: string,
  metadata?: Record<string, unknown>
): string {
  const entries: AuditEntry[] = currentChain ? JSON.parse(currentChain) : []
  const previousHash = entries.length > 0 ? entries[entries.length - 1].hash : '0'.repeat(64)

  const { entry } = hashChainEntry(previousHash, { event, userId, metadata })
  entries.push(entry as AuditEntry)

  return JSON.stringify(entries)
}

/** Vérifie l'intégrité de toute la chaîne d'audit */
export function verifyAuditChain(chainJson: string): boolean {
  try {
    const entries: AuditEntry[] = JSON.parse(chainJson)
    for (let i = 0; i < entries.length; i++) {
      const { hash, ...withoutHash } = entries[i]
      const computed = createHash('sha256').update(JSON.stringify(withoutHash)).digest('hex')
      if (computed !== hash) return false
      if (i > 0 && entries[i].previousHash !== entries[i - 1].hash) return false
    }
    return true
  } catch { return false }
}
