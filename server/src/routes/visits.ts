import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { countedPath, INTERNAL, isBot, parisDay, VISIT_RETENTION_DAYS, visitSource } from '../domain/visits.js'
import { env } from '../env.js'
import { limitPerVisitor } from '../lib/rateLimit.js'

/**
 * Mesure d'audience sans cookie (domain/visits.ts) : une page publique affichée ajoute 1 au compteur du jour, de la
 * page et de la provenance. Rien d'autre n'est enregistré (ni adresse IP, ni identifiant, ni navigateur).
 * Répond toujours 204 : le site n'attend rien en retour.
 */
const router = Router()

const OWN_HOSTS = ['bailio.fr', 'bailio.eu', 'localhost', '127.0.0.1', new URL(env.CLIENT_URL).hostname]

const visitSchema = z.object({
  path: z.string().max(200),
  referrer: z.string().max(500).optional(),
  utm: z.string().max(60).optional(),
  entry: z.boolean().default(false),
})

router.post('/visits', limitPerVisitor(10, 120), async (req, res) => {
  const body = visitSchema.safeParse(req.body)
  const path = body.success ? countedPath(body.data.path) : null
  if (body.success && path && !isBot(req.header('user-agent'))) {
    // Première page d'une visite, sauf si elle vient du site lui-même (rechargement, nouvel onglet).
    const source = body.data.entry ? visitSource(body.data.referrer, body.data.utm, OWN_HOSTS) : null
    const entry = source !== null
    const day = new Date(`${parisDay(new Date())}T00:00:00Z`)
    const key = { day, path, source: source ?? INTERNAL }
    await prisma.pageVisit
      .upsert({
        where: { day_path_source: key },
        create: { ...key, views: 1, entries: entry ? 1 : 0 },
        update: { views: { increment: 1 }, ...(entry ? { entries: { increment: 1 } } : {}) },
      })
      .catch(() => undefined)
  }
  res.status(204).end()
})

/** Compteurs de plus de 13 mois : effacés (tâche quotidienne). */
export async function purgeOldVisits(now = new Date()): Promise<number> {
  const r = await prisma.pageVisit.deleteMany({ where: { day: { lt: new Date(now.getTime() - VISIT_RETENTION_DAYS * 86_400_000) } } })
  return r.count
}

export default router
