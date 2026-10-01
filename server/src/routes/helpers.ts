import type { Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { sha256 } from '../lib/tokens.js'

export const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null)

export function sendPdf(res: Response, pdf: Buffer, filename: string, download: boolean) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(pdf)
}

export function sendFile(res: Response, bytes: Buffer, mime: string, filename: string, download: boolean) {
  res.setHeader('Content-Type', mime)
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(bytes)
}

/** Nom de fichier sûr et lisible : « bail-leroy.pdf ». */
export const fileSlug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'document'

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 10 } })

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

/**
 * Enregistre un fichier déposé. Les photos sont réduites (1 800 px, JPEG) : lisibles à l'impression,
 * légères à stocker. Les PDF sont conservés tels quels.
 */
export async function storeFile(userId: string, f: Express.Multer.File): Promise<{ id: string; mimeType: string; sizeBytes: number; name: string }> {
  if (!ALLOWED.has(f.mimetype)) throw new HttpError(400, 'Format non pris en charge. Utilisez une photo (JPEG, PNG) ou un PDF.')
  let data = f.buffer
  let mimeType = f.mimetype
  let name = f.originalname || 'fichier'
  if (f.mimetype.startsWith('image/')) {
    try {
      data = await sharp(f.buffer, { limitInputPixels: 60_000_000 }).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
      mimeType = 'image/jpeg'
      name = name.replace(/\.\w+$/, '') + '.jpg'
    } catch {
      throw new HttpError(400, 'Cette image ne peut pas être lue. Essayez une autre photo.')
    }
  }
  const row = await prisma.fileBlob.create({ data: { userId, name, mimeType, sizeBytes: data.length, data: new Uint8Array(data) } })
  return { id: row.id, mimeType, sizeBytes: data.length, name }
}

/** Fichier du propriétaire, en data URL (pour l'intégrer à un PDF). */
export async function filesAsDataUrls(userId: string, ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const rows = await prisma.fileBlob.findMany({ where: { userId, id: { in: ids }, mimeType: { startsWith: 'image/' } } })
  return Object.fromEntries(rows.map((r) => [r.id, `data:${r.mimeType};base64,${Buffer.from(r.data).toString('base64')}`]))
}

/** Enregistre un document généré (version conservée, jamais écrasée). */
export async function saveGeneratedDocument(input: {
  userId: string
  kind: 'LEASE' | 'RECEIPT' | 'PARTIAL_RECEIPT' | 'RENT_NOTICE' | 'GUARANTEE' | 'INVENTORY' | 'LETTER'
  title: string
  pdf: Buffer
  snapshot: unknown
  leaseId?: string | null
  propertyId?: string | null
  tenantId?: string | null
  period?: string | null
  meta?: unknown
  /** Conserver le PDF tel quel (document signé) au lieu de le régénérer depuis la copie figée. */
  keepFile?: boolean
}) {
  const last = input.leaseId
    ? await prisma.document.findFirst({ where: { leaseId: input.leaseId, kind: input.kind, period: input.period ?? null }, orderBy: { version: 'desc' } })
    : null
  return prisma.document.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      mimeType: 'application/pdf',
      sha256: sha256(input.pdf),
      sizeBytes: input.pdf.length,
      snapshot: input.snapshot as object,
      leaseId: input.leaseId ?? null,
      propertyId: input.propertyId ?? null,
      tenantId: input.tenantId ?? null,
      period: input.period ?? null,
      meta: (input.meta ?? undefined) as object | undefined,
      file: input.keepFile ? new Uint8Array(input.pdf) : undefined,
      version: (last?.version ?? 0) + 1,
    },
  })
}

/** Fusion superficielle d'une fiche : les objets imbriqués sont fusionnés, les listes remplacées. */
export function mergeFile<T extends Record<string, unknown>>(current: T, patch: Partial<T>): T {
  const out: Record<string, unknown> = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && current[k] && typeof current[k] === 'object' && !Array.isArray(current[k])) {
      out[k] = { ...(current[k] as object), ...(v as object) }
    } else {
      out[k] = v
    }
  }
  return out as T
}
