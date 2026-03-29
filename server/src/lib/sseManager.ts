import { Response } from 'express'

/**
 * Manages Server-Sent Event connections by userId.
 * Each user can have one active SSE connection at a time.
 */
class SSEManager {
  private connections = new Map<string, Response>()

  add(userId: string, res: Response) {
    const existing = this.connections.get(userId)
    if (existing && !existing.destroyed) {
      existing.end()
    }
    this.connections.set(userId, res)
  }

  remove(userId: string) {
    this.connections.delete(userId)
  }

  send(userId: string, event: string, data: unknown) {
    const res = this.connections.get(userId)
    if (res && !res.destroyed) {
      res.write(`event: ${event}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }

  broadcast(userIds: string[], event: string, data: unknown) {
    userIds.forEach((id) => this.send(id, event, data))
  }

  isConnected(userId: string): boolean {
    const res = this.connections.get(userId)
    return !!res && !res.destroyed
  }
}

export const sseManager = new SSEManager()
