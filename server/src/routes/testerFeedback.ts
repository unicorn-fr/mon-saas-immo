import { Router } from 'express'
import { env } from '../env.js'
import { feedbackLines, npsGroup, testerFeedbackSchema } from '../domain/testerFeedback.js'
import { layout, sendEmail } from '../lib/email.js'
import { limitPerVisitor } from '../lib/rateLimit.js'

/**
 * Questionnaire des testeurs (page publique /avis-testeur, lien envoyé après l'essai) : les réponses partent par
 * email à l'équipe (FEEDBACK_TO). Rien n'est enregistré dans la base.
 */
const router = Router()

router.post('/tester-feedback', limitPerVisitor(60, 5), async (req, res) => {
  const body = testerFeedbackSchema.parse(req.body)
  if (body.website) return res.json({ success: true, data: { sent: true } })
  const email = body.contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contact) ? body.contact : undefined
  const mail = layout({ title: `Avis d’un testeur : ${body.nps}/10`, paragraphs: feedbackLines(body) })
  await sendEmail({ to: env.FEEDBACK_TO, subject: `Avis testeur · ${body.nps}/10 · ${npsGroup(body.nps)}${body.name ? ` · ${body.name}` : ''}`, ...(email ? { replyTo: email } : {}), ...mail })
  res.json({ success: true, data: { sent: true } })
})

export default router
