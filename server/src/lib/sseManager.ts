import { Response } from 'express'

/**
 * Manages Server-Sent Event connections by userId.
 * Supports multiple simultaneous connections per user (multi-tab).
 */
class SSEManager {
  private connections = new Map<string, Set<Response>>()

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

  send(userId: string, event: string, data: unknown) {
    const conns = this.connections.get(userId)
    if (!conns) return
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of conns) {
      if (!res.destroyed) res.write(payload)
      else conns.delete(res)
    }
    if (conns.size === 0) this.connections.delete(userId)
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
