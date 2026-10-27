import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'

/**
 * Signer avec son téléphone : l'ordinateur ouvre un relais (code aléatoire, montré en QR code), le téléphone y dépose
 * la signature dessinée au doigt, l'ordinateur la reprend puis le relais s'efface. Gardé en mémoire seulement, jamais
 * en base, 10 minutes au plus ; la signature n'est enregistrée que si la personne la garde sur l'ordinateur.
 */
const router = Router()

const TTL_MS = 10 * 60_000
const MAX_RELAYS = 2_000
const relays = new Map<string, { createdAt: number; image: string | null }>()

function sweep(now = Date.now()) {
  for (const [code, r] of relays) if (now - r.createdAt > TTL_MS) relays.delete(code)
}

function relayOf(code: string) {
  sweep()
  const r = relays.get(code)
  if (!r) throw new HttpError(404, 'Ce lien de signature a expiré. Recommencez depuis l’ordinateur.')
  return r
}

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/, 'Lien de signature invalide.')

router.post('/signature-relay', limitPerVisitor(10, 20), (_req, res) => {
  sweep()
  if (relays.size >= MAX_RELAYS) throw new HttpError(503, 'Service momentanément indisponible. Réessayez dans quelques minutes.')
  const code = randomBytes(24).toString('base64url')
  relays.set(code, { createdAt: Date.now(), image: null })
  res.json({ success: true, data: { code, expiresInSeconds: TTL_MS / 1000 } })
})

// L'ordinateur attend la signature (toutes les deux secondes) ; une fois reprise, le relais s'efface.
router.get('/signature-relay/:code', limitPerVisitor(10, 600), (req, res) => {
  const code = codeSchema.parse(req.params.code)
  const r = relayOf(code)
  if (r.image) relays.delete(code)
  res.json({ success: true, data: { image: r.image } })
})

// Le téléphone dépose la signature : une image PNG, rien d'autre.
router.post('/signature-relay/:code', limitPerVisitor(10, 30), (req, res) => {
  const code = codeSchema.parse(req.params.code)
  const { image } = z.object({ image: z.string().max(400_000).regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, 'Signature invalide.') }).parse(req.body)
  const r = relayOf(code)
  r.image = image
  res.json({ success: true, data: { ok: true } })
})

export default router
