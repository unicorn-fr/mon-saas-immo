import { prisma } from '../db.js'
import { docsLocked, type CandidateFollow } from '../domain/candidates.js'

/**
 * Pièces de candidats encore cachées au propriétaire (visite non confirmée, `docsLocked`) parmi `ids` : elles ne sont
 * servies sous aucune forme (fichier, photo du logement, PDF), quel que soit le chemin qui y mène.
 */
export async function lockedCandidateFiles(userId: string, ids: (string | null | undefined)[]): Promise<Set<string>> {
  const wanted = new Set(ids.filter((x): x is string => Boolean(x)))
  if (!wanted.size) return new Set()
  const rows = await prisma.candidate.findMany({ where: { userId }, select: { data: true } })
  const locked = new Set<string>()
  for (const r of rows) {
    const d = r.data as unknown as CandidateFollow & { documents?: { fileId?: string | null }[] }
    if (!docsLocked(d)) continue
    for (const doc of d.documents ?? []) if (doc.fileId && wanted.has(doc.fileId)) locked.add(doc.fileId)
  }
  return locked
}
