import { open, unlink, stat } from 'fs/promises'
import { randomBytes } from 'crypto'

/**
 * Suppression sécurisée RGPD : écrase le fichier 3× avec des octets aléatoires
 * avant de le supprimer. Empêche la récupération forensique.
 */
export async function secureDelete(filePath: string): Promise<void> {
  try {
    const { size } = await stat(filePath)
    if (size > 0) {
      const fd = await open(filePath, 'r+')
      try {
        for (let pass = 0; pass < 3; pass++) {
          const randomData = randomBytes(size)
          await fd.write(randomData, 0, size, 0)
        }
      } finally {
        await fd.close()
      }
    }
    await unlink(filePath)
  } catch {
    try { await unlink(filePath) } catch { /* ignore */ }
  }
}

/**
 * Écrasement mémoire RGPD : remplit le Buffer avec des zéros.
 * Appelé après extraction OCR pour détruire les données en RAM.
 */
export function secureDeleteBuffer(buf: Buffer): void {
  try { buf.fill(0) } catch { /* ignore */ }
}
