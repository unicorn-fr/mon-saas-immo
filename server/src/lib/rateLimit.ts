import type { Request } from 'express'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { HttpError } from './http.js'

/**
 * Adresse IP du visiteur.
 * Caddy, seul point d'entrée des visiteurs, écrit leur IP TCP réelle dans X-Original-Forwarded-For
 * (voir deploy/vps/Caddyfile) et écrase toute valeur envoyée par le navigateur.
 * Un en-tête inventé ne permet que de contourner la limite par IP : les envois d'emails ont en plus une
 * limite par adresse et une limite globale (ci-dessous).
 */
export function clientIp(req: Request): string {
  // Seul l'en-tête écrit par Caddy compte (X-Real-IP n'est jamais posé par Caddy : il ne servait qu'à contourner les limites).
  const forwarded = req.header('x-original-forwarded-for') || ''
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

// ── Limite par clé (compte, adresse…), indépendante de l'IP ─────────────────

const buckets = new Map<string, number[]>()

/**
 * Refuse au-delà de `max` actions par `windowMinutes` pour une même clé (par exemple un compte) : une limite par IP
 * se contourne en changeant d'adresse, pas celle-ci. Mémoire du processus, nettoyée au passage.
 */
export function allowPerKey(bucket: string, key: string, max: number, windowMinutes: number, message: string): void {
  const now = Date.now()
  const windowMs = windowMinutes * 60_000
  const k = `${bucket}:${key}`
  const recent = (buckets.get(k) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max * SCALE) throw new HttpError(429, message)
  recent.push(now)
  buckets.set(k, recent)
  if (buckets.size > 10000) for (const [b, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(b)
}
