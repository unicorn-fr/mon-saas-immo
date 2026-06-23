import { Router, Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { validateEmail } from '../utils/validation.util.js'
import { sendEmail } from '../utils/email.util.js'
import { newsletterConfirmTemplate } from '../utils/emailTemplates.js'

const router = Router()

/**
 * POST /api/v1/newsletter/subscribe
 * Public — capture email pour les alertes et la newsletter
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  const { email, source = 'unknown' } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email requis' })
  }

  const clean = email.trim().toLowerCase()
  if (!validateEmail(clean)) {
    return res.status(400).json({ success: false, message: 'Email invalide' })
  }

  try {
    // Upsert: si l'email existe déjà, met à jour la source et renvoie 200
    await prisma.newsletterSubscriber.upsert({
      where: { email: clean },
      update: { source, updatedAt: new Date() },
      create: { email: clean, source },
    })

    // Envoyer email de confirmation (non bloquant)
    sendEmail({
      to: clean,
      ...newsletterConfirmTemplate({ email: clean }),
    }).catch(() => {}) // silencieux si erreur email

    return res.status(200).json({ success: true, message: 'Inscription enregistrée' })
  } catch (error) {
    console.error('[newsletter] subscribe error:', error)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

/**
 * DELETE /api/v1/newsletter/unsubscribe
 * Public — désabonnement par email
 */
router.delete('/unsubscribe', async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email requis' })
  }

  try {
    await prisma.newsletterSubscriber.deleteMany({ where: { email: email.trim().toLowerCase() } })
    return res.status(200).json({ success: true, message: 'Désabonnement effectué' })
  } catch {
    return res.status(200).json({ success: true }) // Silent fail (email may not exist)
  }
})

export default router
