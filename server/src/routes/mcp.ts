import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { AI_KEY_PREFIX, AI_TOOLS, MAX_AI_KEYS, isAiKey, sanitizeForAi } from '../domain/aiAccess.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'

/**
 * Connexion d'une IA (Claude, ChatGPT…) en lecture seule, par le protocole MCP (HTTP, sans état).
 * L'IA envoie sa clé dans l'en-tête Authorization (Claude Code, Claude Desktop, Cursor…) ou dans l'adresse
 * (/api/mcp/<clé>, pour les connecteurs qui ne prennent qu'une adresse). Chaque outil relit une adresse ordinaire de
 * l'API avec la même clé : les mêmes contrôles s'appliquent (requireUser → aiPathDenied, lecture seule).
 */
const router = Router()

// ── Clés, gérées depuis « Mon compte » ────────────────────────────────────────

router.use('/account/ai-keys', requireUser)

router.get('/account/ai-keys', async (req, res) => {
  const keys = await prisma.aiKey.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true, lastUsedAt: true } })
  res.json({ success: true, data: keys })
})

router.post('/account/ai-keys', limitPerVisitor(10, 10), async (req, res) => {
  const { name } = z.object({ name: z.string().trim().min(1, 'Donnez un nom à cette connexion.').max(60) }).parse(req.body)
  const count = await prisma.aiKey.count({ where: { userId: req.user!.id } })
  if (count >= MAX_AI_KEYS) throw new HttpError(400, `${MAX_AI_KEYS} connexions au plus. Retirez-en une avant d’en créer une autre.`)
  const key = `${AI_KEY_PREFIX}${newToken()}`
  const row = await prisma.aiKey.create({ data: { userId: req.user!.id, name, keyHash: hashToken(key) }, select: { id: true, name: true, createdAt: true, lastUsedAt: true } })
  // La clé n'est montrée qu'une fois : seule son empreinte est gardée.
  res.json({ success: true, data: { ...row, key } })
})

router.delete('/account/ai-keys/:id', async (req, res) => {
  const { count } = await prisma.aiKey.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!count) throw new HttpError(404, 'Connexion introuvable.')
  res.json({ success: true, data: { removed: true } })
})

// ── Serveur MCP ───────────────────────────────────────────────────────────────

const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']

interface RpcMessage {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

const rpcError = (id: RpcMessage['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

async function callTool(key: string, name: string, args: Record<string, unknown>) {
  const tool = AI_TOOLS.find((t) => t.name === name)
  if (!tool) return { content: [{ type: 'text', text: `Outil inconnu : ${name}.` }], isError: true }
  let path: string
  try {
    path = tool.path(args)
  } catch (e) {
    return { content: [{ type: 'text', text: e instanceof Error ? e.message : 'Paramètre invalide.' }], isError: true }
  }
  const r = await fetch(`http://127.0.0.1:${env.PORT}/api${path}`, { headers: { Authorization: `Bearer ${key}` } })
  const body = (await r.json().catch(() => null)) as { success?: boolean; data?: unknown; error?: string; message?: string } | null
  if (!r.ok || !body?.success) return { content: [{ type: 'text', text: body?.error ?? body?.message ?? `Erreur ${r.status}.` }], isError: true }
  // Réponse plafonnée : une IA n'a pas besoin de plus pour répondre, et rien de privé n'en sort (sanitizeForAi).
  const text = JSON.stringify(sanitizeForAi(body.data))
  return { content: [{ type: 'text', text: text.length > 200_000 ? `${text.slice(0, 200_000)}… [réponse tronquée]` : text }] }
}

async function handle(msg: RpcMessage, key: string) {
  const id = msg.id
  switch (msg.method) {
    case 'initialize': {
      const asked = String(msg.params?.protocolVersion ?? '')
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'bailio', title: 'Bailio', version: process.env.BAILIO_VERSION ?? 'dev' },
          instructions:
            'Données de gestion locative d’un propriétaire bailleur en France (biens, locataires, baux, loyers, impayés, échéances, impôts). Lecture seule : rien ne peut être modifié ni envoyé depuis ici ; renvoyez le propriétaire vers bailio.fr pour agir. Montants en centimes d’euro (champs …Cents). Répondez en français.',
        },
      }
    }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: AI_TOOLS.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: {
              type: 'object',
              properties: Object.fromEntries(t.params.map((p) => [p.name, { type: p.type ?? 'string', description: p.description }])),
              required: t.params.filter((p) => p.required).map((p) => p.name),
            },
            annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
          })),
        },
      }
    case 'tools/call': {
      const name = String(msg.params?.name ?? '')
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>
      return { jsonrpc: '2.0', id, result: await callTool(key, name, args) }
    }
    default:
      return rpcError(id, -32601, `Méthode non prise en charge : ${msg.method ?? '?'}.`)
  }
}

async function mcp(req: Request, res: Response, key: string | null) {
  if (!key || !isAiKey(key) || !(await prisma.aiKey.findUnique({ where: { keyHash: hashToken(key) }, select: { id: true } }))) {
    res.setHeader('WWW-Authenticate', 'Bearer')
    return res.status(401).json(rpcError(null, -32001, 'Clé de connexion absente ou retirée. Créez-en une dans « Mon compte » de Bailio.'))
  }
  const body = req.body as RpcMessage | RpcMessage[]
  const list = Array.isArray(body) ? body : [body]
  const answers = []
  for (const msg of list) {
    if (!msg || typeof msg !== 'object') {
      answers.push(rpcError(null, -32600, 'Requête invalide.'))
      continue
    }
    // Notifications (sans id) : rien à répondre.
    if (msg.id === undefined) continue
    answers.push(await handle(msg, key))
  }
  if (!answers.length) return res.status(202).end()
  res.setHeader('Cache-Control', 'no-store')
  res.json(Array.isArray(body) ? answers : answers[0])
}

const headerKey = (req: Request) => {
  const h = req.headers.authorization
  return h?.startsWith('Bearer ') ? h.slice(7).trim() : null
}

const limit = limitPerVisitor(1, 120)
router.post('/mcp', limit, (req, res, next) => mcp(req, res, headerKey(req)).catch(next))
router.post('/mcp/:key', limit, (req, res, next) => mcp(req, res, String(req.params.key)).catch(next))
// Pas de flux d'événements (protocole sans état) : seul POST répond.
router.all(['/mcp', '/mcp/:key'], (_req, res) => res.status(405).setHeader('Allow', 'POST').json(rpcError(null, -32000, 'Utilisez POST.')))

export default router
