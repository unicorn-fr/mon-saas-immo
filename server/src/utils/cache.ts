/**
 * cache.ts — Module Redis (Upstash ou Redis standard).
 * Le cache est transparent : les erreurs sont loggées mais ne bloquent jamais l'app.
 */

import { createClient } from 'redis'
import { env } from '../config/env.js'

const client = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error('[Redis] Trop de tentatives de reconnexion — abandon')
        return new Error('Redis connection failed')
      }
      return Math.min(retries * 100, 3000)
    },
  },
})

client.on('error', (err) => console.error('[Redis] Client error:', err.message))
client.on('connect', () => console.log('[Redis] Connecté'))
client.on('reconnecting', () => console.log('[Redis] Reconnexion en cours…'))

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    console.log('[Redis] REDIS_URL non défini — cache désactivé')
    return
  }
  if (!client.isOpen) {
    await client.connect()
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!client.isOpen) return null
    const value = await client.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    if (!client.isOpen) return
    await client.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch (err) {
    console.error('[Redis] cacheSet error:', err)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    if (!client.isOpen) return
    await client.del(key)
  } catch (err) {
    console.error('[Redis] cacheDelete error:', err)
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    if (!client.isOpen) return
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (err) {
    console.error('[Redis] cacheDeletePattern error:', err)
  }
}

export { client as redisClient }
