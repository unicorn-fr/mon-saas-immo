import { Response } from 'express'
import { createClient } from 'redis'

const REDIS_CHANNEL = 'sse:cross'

/**
 * Manages Server-Sent Event connections by userId.
 * Supports multiple simultaneous connections per user (multi-tab).
 *
 * In PM2 cluster mode, uses Redis pub/sub to forward events to sibling workers.
 * Each worker only delivers to its OWN locally-connected SSE clients.
 * The publisher includes `pid` to avoid self-delivery via Redis echo.
 */
class SSEManager {
  private connections = new Map<string, Set<Response>>()
  private _publisher: ReturnType<typeof createClient> | null = null
  private _subscriber: ReturnType<typeof createClient> | null = null

  /**
   * Call once at startup when Redis is available.
   * Creates two dedicated Redis clients (pub/sub requires separate connections).
   */
  async initPubSub(redisUrl: string | undefined): Promise<void> {
    if (!redisUrl) return

    try {
      this._publisher = createClient({ url: redisUrl })
      this._subscriber = createClient({ url: redisUrl })

      this._publisher.on('error', () => {})
      this._subscriber.on('error', () => {})

      await this._publisher.connect()
      await this._subscriber.connect()

      // Receive SSE events published by sibling workers
      await this._subscriber.subscribe(REDIS_CHANNEL, (raw) => {
        try {
          const { userId, event, data, pid } = JSON.parse(raw) as {
            userId: string; event: string; data: unknown; pid: number
          }
          // Skip our own publishes — we already delivered locally in send()
          if (pid === process.pid) return
          this._sendLocal(userId, event, data)
        } catch { /* malformed message — ignore */ }
      })

      console.log(`[SSE] Redis pub/sub ready (worker PID ${process.pid})`)
    } catch (err) {
      console.warn('[SSE] Redis pub/sub init failed — cluster mode SSE may miss cross-worker events', err)
      this._publisher = null
      this._subscriber = null
    }
  }

  add(userId: string, res: Response) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(res)
  }

  remove(userId: string, res: Response) {
    const conns = this.connections.get(userId)
    if (!conns) return
    conns.delete(res)
    if (conns.size === 0) this.connections.delete(userId)
  }

  /** Deliver SSE only to locally-connected clients on this worker. */
  private _sendLocal(userId: string, event: string, data: unknown) {
    const conns = this.connections.get(userId)
    if (!conns) return
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of conns) {
      if (!res.destroyed) res.write(payload)
      else conns.delete(res)
    }
    if (conns.size === 0) this.connections.delete(userId)
  }

  /**
   * Send SSE to a user.
   * Delivers immediately to local connections, then publishes to Redis
   * so sibling workers can forward to their own local connections for the same userId.
   */
  send(userId: string, event: string, data: unknown) {
    this._sendLocal(userId, event, data)

    if (this._publisher?.isOpen) {
      this._publisher
        .publish(REDIS_CHANNEL, JSON.stringify({ userId, event, data, pid: process.pid }))
        .catch(() => {})
    }
  }

  broadcast(userIds: string[], event: string, data: unknown) {
    userIds.forEach((id) => this.send(id, event, data))
  }

  isConnected(userId: string): boolean {
    const conns = this.connections.get(userId)
    if (!conns || conns.size === 0) return false
    for (const res of conns) {
      if (!res.destroyed) return true
    }
    return false
  }

  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size ?? 0
  }
}

export const sseManager = new SSEManager()
