import { Router } from 'express'
import { z } from 'zod'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { requireUser } from '../services/session.js'

/**
 * « Votre avis » : deux questions posées depuis l'espace, envoyées par email à l'équipe (FEEDBACK_TO), avec l'adresse
 * du propriétaire en réponse. Rien n'est enregistré dans la base.
 */
const router = Router()

export const RATING_LABEL = { USEFUL: 'Très utile', OK: 'Utile, mais…', NOT_YET: 'Pas encore utile' } as const

const feedbackSchema = z.object({
  rating: z.enum(['USEFUL', 'OK', 'NOT_YET']).nullable().optional(),
  message: z.string().trim().max(2000, 'Votre message est trop long (2 000 caractères au plus).').default(''),
  page: z.string().trim().max(200).optional(),
})

router.post('/feedback', limitPerVisitor(60, 10), requireUser, async (req, res) => {
  const body = feedbackSchema.parse(req.body)
  if (!body.rating && body.message.length < 3) throw new HttpError(400, 'Choisissez une réponse ou écrivez quelques mots.')
  const user = req.user!
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const mail = layout({
    title: 'Un avis sur Bailio',
    paragraphs: [
      `De : ${name ? `${name} · ` : ''}${user.email}`,
      `Bailio lui semble : ${body.rating ? RATING_LABEL[body.rating] : 'non précisé'}`,
      `Ce qui manque ou a gêné : ${body.message || '(rien d’écrit)'}`,
      `Page : ${body.page || 'non précisée'}`,
    ],
  })
  await sendEmail({ to: env.FEEDBACK_TO, subject: `Avis sur Bailio · ${body.rating ? RATING_LABEL[body.rating] : 'message'}`, replyTo: user.email, ...mail })
  res.json({ success: true, data: { sent: true } })
})

export default router
