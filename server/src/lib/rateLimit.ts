import type { Request } from 'express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { HttpError } from './http.js'

/**
 * Adresse IP du visiteur.
 * Le site bailio.fr (Vercel) relaie /api vers ce serveur : Vercel remplace alors X-Forwarded-For par l'IP
 * du visiteur, que Caddy recopie dans X-Original-Forwarded-For (voir deploy/vps/Caddyfile) avant de mettre
 * sa propre valeur. Sans cet en-tête, tous les visiteurs de bailio.fr partageraient l'IP de Vercel.
 * Un en-tête inventé ne permet que de contourner la limite par IP : les envois d'emails ont en plus une
 * limite par adresse et une limite globale (ci-dessous).
 */
export function clientIp(req: Request): string {
  const forwarded = req.header('x-original-forwarded-for') || req.header('x-real-ip') || ''
  const first = forwarded.split(',')[0]?.trim()
  return first || req.ip || 'inconnu'
}

/** Limite par visiteur, avec un message en français au format habituel de l'API. */
/**
 * Tests de bout en bout seulement (local, CI) : ils créent beaucoup de comptes depuis la même adresse.
 * Jamais pris en compte en production.
 */
const SCALE = process.env.NODE_ENV === 'production' ? 1 : Math.max(1, Number(process.env.RATE_LIMIT_SCALE) || 1)

export function limitPerVisitor(windowMinutes: number, limit: number) {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit: limit * SCALE,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    // Les en-têtes d'IP sont lus volontairement (voir clientIp) : pas d'avertissement au démarrage.
    validate: { xForwardedForHeader: false, trustProxy: false },
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: 'Trop de tentatives en peu de temps. Réessayez dans quelques minutes.' })
    },
  })
}

// ── Envois d'emails : par adresse de destination et au total ────────────────

const HOUR = 60 * 60_000
const PER_ADDRESS = 4
const TOTAL = 300
const sentTo = new Map<string, number[]>()
let sentTotal: number[] = []

/** À appeler juste avant d'envoyer un email à `to` : refuse au-delà de 4 emails par heure à la même adresse. */
export function allowEmailTo(to: string): void {
  const now = Date.now()
  const key = to.trim().toLowerCase()
  const recent = (sentTo.get(key) ?? []).filter((t) => now - t < HOUR)
  sentTotal = sentTotal.filter((t) => now - t < HOUR)
  if (recent.length >= PER_ADDRESS) {
    throw new HttpError(429, 'Plusieurs emails ont déjà été envoyés à cette adresse. Regardez dans vos courriers indésirables, ou réessayez dans une heure.')
  }
  if (sentTotal.length >= TOTAL) throw new HttpError(503, 'Envoi momentanément indisponible. Réessayez dans quelques minutes.')
  recent.push(now)
  sentTotal.push(now)
  sentTo.set(key, recent)
  // Nettoyage : la table ne garde que les adresses de la dernière heure.
  if (sentTo.size > 5000) for (const [k, v] of sentTo) if (!v.some((t) => now - t < HOUR)) sentTo.delete(k)
}
