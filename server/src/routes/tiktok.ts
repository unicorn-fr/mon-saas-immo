import { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { initBody, postProblem, TITLE_MAX, VIDEO_MAX_BYTES } from '../domain/tiktok.js'
import { HttpError } from '../lib/http.js'
import { isAdmin } from '../services/admin.js'
import { requireUser } from '../services/session.js'
import { connectUrl, creatorInfo, disconnect, finishConnect, postStatus, postVideo, redirectUri, tiktokConfigured } from '../services/tiktok.js'

/**
 * « Publier sur TikTok » (pilotage) : réservé aux adresses de ADMIN_EMAILS, comme le pilotage ; pour tout autre
 * compte, « Page introuvable ». Publie les vidéos de Bailio sur le compte TikTok de Bailio, rien d'autre.
 */
const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: VIDEO_MAX_BYTES, files: 1 } })

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!isAdmin(req.user?.email)) return next(new HttpError(404, 'Page introuvable.'))
  next()
}
router.use('/admin/tiktok', requireUser, requireAdmin)

router.get('/admin/tiktok', async (_req, res) => {
  const configured = tiktokConfigured()
  const creator = configured ? await creatorInfo() : null
  res.json({ success: true, data: { configured, connected: Boolean(creator), creator, redirectUri: redirectUri() } })
})

// Photo du compte relayée par le serveur : la politique de sécurité du site n'affiche que ses propres images.
router.get('/admin/tiktok/avatar', async (_req, res) => {
  const url = (await creatorInfo())?.avatarUrl
  if (!url || !/^https:\/\/[a-z0-9.-]+\.(tiktokcdn|tiktokcdn-us|tiktokcdn-eu|ibyteimg|byteimg)\.com\//.test(url)) throw new HttpError(404, 'Pas de photo.')
  const r = await fetch(url)
  const type = r.headers.get('content-type') ?? ''
  if (!r.ok || !type.startsWith('image/')) throw new HttpError(404, 'Pas de photo.')
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.send(Buffer.from(await r.arrayBuffer()))
})

router.post('/admin/tiktok/connect', (req, res) => {
  res.json({ success: true, data: { url: connectUrl(req.user!.id) } })
})

router.post('/admin/tiktok/callback', async (req, res) => {
  const body = z.object({ code: z.string().min(1).max(2000), state: z.string().min(1).max(200) }).parse(req.body)
  await finishConnect(body.code, body.state, req.user!.id)
  res.json({ success: true, data: { connected: true } })
})

router.delete('/admin/tiktok', async (_req, res) => {
  await disconnect()
  res.json({ success: true, data: { connected: false } })
})

const bool = z.preprocess((v) => v === 'true' || v === true, z.boolean())
const postSchema = z.object({
  title: z.string().max(TITLE_MAX).default(''),
  privacy: z.enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']).nullable().default(null),
  allowComment: bool, allowDuet: bool, allowStitch: bool, commercial: bool, yourBrand: bool, brandedContent: bool,
  durationSec: z.preprocess((v) => (v === '' || v === undefined ? null : Number(v)), z.number().nullable()),
})

router.post('/admin/tiktok/post', upload.single('video'), async (req, res) => {
  const file = req.file
  if (!file || !['video/mp4', 'video/quicktime', 'video/webm'].includes(file.mimetype)) throw new HttpError(400, 'Choisissez une vidéo MP4, MOV ou WebM.')
  const choice = postSchema.parse(req.body)
  const creator = await creatorInfo()
  if (!creator) throw new HttpError(409, 'Le compte TikTok n’est pas connecté.')
  const problem = postProblem(choice, creator)
  if (problem) throw new HttpError(400, problem)
  const publishId = await postVideo(initBody(choice, creator, file.size), file.buffer, file.mimetype)
  res.json({ success: true, data: { publishId } })
})

router.get('/admin/tiktok/post/:id', async (req, res) => {
  const id = z.string().min(1).max(200).parse(req.params.id)
  res.json({ success: true, data: await postStatus(id) })
})

export default router
