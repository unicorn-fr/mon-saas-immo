import { randomBytes } from 'node:crypto'
import { prisma } from '../db.js'
import { authorizeUrl, readCreatorInfo, type CreatorInfo } from '../domain/tiktok.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'

/** Appels à l'API de TikTok pour le compte de Bailio (jetons gardés dans SocialAccount, jamais envoyés au navigateur). */
const API = 'https://open.tiktokapis.com/v2'
export const redirectUri = () => `${env.CLIENT_URL}/espace/pilotage/tiktok`
export const tiktokConfigured = () => Boolean(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET)

/** États de connexion en attente (10 minutes), pour vérifier le retour de TikTok. */
const states = new Map<string, { userId: string; at: number }>()

export function connectUrl(userId: string) {
  if (!tiktokConfigured()) throw new HttpError(503, 'Les clés TikTok ne sont pas encore renseignées sur le serveur.')
  for (const [k, v] of states) if (Date.now() - v.at > 600_000) states.delete(k)
  const state = randomBytes(16).toString('hex')
  states.set(state, { userId, at: Date.now() })
  return authorizeUrl(env.TIKTOK_CLIENT_KEY, redirectUri(), state)
}

interface TokenResponse { access_token?: string; refresh_token?: string; open_id?: string; scope?: string; expires_in?: number; refresh_expires_in?: number; error?: string; error_description?: string }

async function tokenCall(params: Record<string, string>): Promise<TokenResponse> {
  const r = await fetch(`${API}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, ...params }),
  })
  const j = (await r.json().catch(() => ({}))) as TokenResponse
  if (!r.ok || !j.access_token) throw new HttpError(502, `TikTok a refusé la connexion${j.error_description ? ` : ${j.error_description}` : '.'}`)
  return j
}

async function saveTokens(j: TokenResponse, userId: string) {
  const now = Date.now()
  const data = {
    openId: j.open_id ?? '',
    accessToken: j.access_token!,
    refreshToken: j.refresh_token ?? '',
    expiresAt: new Date(now + (j.expires_in ?? 86_400) * 1000),
    refreshExpiresAt: new Date(now + (j.refresh_expires_in ?? 31_536_000) * 1000),
    scope: j.scope ?? '',
    connectedBy: userId,
  }
  await prisma.socialAccount.upsert({ where: { provider: 'tiktok' }, create: { provider: 'tiktok', ...data }, update: data })
}

export async function finishConnect(code: string, state: string, userId: string) {
  const pending = states.get(state)
  states.delete(state)
  if (!pending || pending.userId !== userId || Date.now() - pending.at > 600_000) throw new HttpError(400, 'La connexion à TikTok a expiré. Recommencez.')
  await saveTokens(await tokenCall({ code, grant_type: 'authorization_code', redirect_uri: redirectUri() }), userId)
}

/** Jeton valable, renouvelé s'il expire dans moins de 5 minutes ; null si le compte n'est pas connecté. */
async function accessToken(): Promise<string | null> {
  const acc = await prisma.socialAccount.findUnique({ where: { provider: 'tiktok' } })
  if (!acc) return null
  if (acc.expiresAt.getTime() - Date.now() > 300_000) return acc.accessToken
  if (acc.refreshExpiresAt.getTime() < Date.now()) return null
  const j = await tokenCall({ grant_type: 'refresh_token', refresh_token: acc.refreshToken })
  await saveTokens(j, acc.connectedBy)
  return j.access_token!
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const token = await accessToken()
  if (!token) throw new HttpError(409, 'Le compte TikTok n’est pas connecté.')
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(body ?? {}) })
  const j = (await r.json().catch(() => ({}))) as { data?: T; error?: { code?: string; message?: string } }
  if (!r.ok || (j.error?.code && j.error.code !== 'ok')) throw new HttpError(502, `TikTok : ${j.error?.message || j.error?.code || `erreur ${r.status}`}`)
  return j.data as T
}

export async function creatorInfo(): Promise<CreatorInfo | null> {
  if (!(await prisma.socialAccount.findUnique({ where: { provider: 'tiktok' }, select: { provider: true } }))) return null
  return readCreatorInfo(await call<Record<string, unknown>>('/post/publish/creator_info/query/', {}))
}

/** Prépare la publication puis envoie la vidéo en un morceau. */
export async function postVideo(body: unknown, video: Buffer, mime: string) {
  const d = await call<{ publish_id: string; upload_url: string }>('/post/publish/video/init/', body)
  const up = await fetch(d.upload_url, { method: 'PUT', headers: { 'Content-Type': mime, 'Content-Length': String(video.length), 'Content-Range': `bytes 0-${video.length - 1}/${video.length}` }, body: new Uint8Array(video) })
  if (!up.ok) throw new HttpError(502, `TikTok n’a pas reçu la vidéo (erreur ${up.status}).`)
  return d.publish_id
}

export const postStatus = (publishId: string) => call<{ status?: string; fail_reason?: string }>('/post/publish/status/fetch/', { publish_id: publishId })

export async function disconnect() {
  const acc = await prisma.socialAccount.findUnique({ where: { provider: 'tiktok' } })
  if (!acc) return
  await fetch(`${API}/oauth/revoke/`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, token: acc.accessToken }) }).catch(() => undefined)
  await prisma.socialAccount.delete({ where: { provider: 'tiktok' } })
}
