import { encryptField, decryptField } from '../../utils/encryption.util.js'

export type FaceEmbedding = number[] // 128-D vector from face-api.js

/** Cosine similarity entre deux embeddings 128-D */
export function cosineSimilarity(a: FaceEmbedding, b: FaceEmbedding): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** Chiffre un embedding avant stockage */
export function encryptEmbedding(embedding: FaceEmbedding): string {
  return encryptField(JSON.stringify(embedding))
}

/** Déchiffre un embedding stocké */
export function decryptEmbedding(encrypted: string): FaceEmbedding {
  return JSON.parse(decryptField(encrypted)) as FaceEmbedding
}

/**
 * Vérifie si l'embedding fourni correspond à l'embedding de référence stocké.
 * Seuil : 0.80 = même personne (face-api.js standard).
 */
export function verifyFaceMatch(
  storedEnc: string,
  newEmbedding: FaceEmbedding,
  threshold = 0.80
): { match: boolean; score: number } {
  const stored = decryptEmbedding(storedEnc)
  const score = cosineSimilarity(stored, newEmbedding)
  return { match: score >= threshold, score }
}
