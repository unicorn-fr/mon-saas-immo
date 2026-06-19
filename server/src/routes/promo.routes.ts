import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()
const prisma = new PrismaClient()

// POST /promo/apply — Appliquer un code promo
router.post('/apply', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id
    const code = (req.body.code as string)?.trim().toUpperCase()

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code requis' })
    }

    const promo = await prisma.promoCode.findUnique({ where: { code } })

    if (!promo || !promo.isActive) {
      return res.status(404).json({ success: false, message: 'Code invalide ou désactivé' })
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Ce code a expiré' })
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'Ce code a atteint son nombre maximum d\'utilisations' })
    }

    // Vérifier si l'utilisateur a déjà utilisé ce code
    const alreadyUsed = await prisma.promoRedemption.findUnique({
      where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
    })
    if (alreadyUsed) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code' })
    }

    const planExpires = promo.durationDays
      ? new Date(Date.now() + promo.durationDays * 86400 * 1000)
      : null

    // Transaction : redemption + mise à jour subscription + compteur
    await prisma.$transaction([
      prisma.promoRedemption.create({
        data: { promoCodeId: promo.id, userId, planExpires },
      }),
      prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: `PROMO_${userId}`,
          plan: promo.planGranted,
          status: 'ACTIVE',
          promoCodeId: promo.id,
          promoExpiresAt: planExpires,
        },
        update: {
          plan: promo.planGranted,
          status: 'ACTIVE',
          promoCodeId: promo.id,
          promoExpiresAt: planExpires,
        },
      }),
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      }),
    ])

    return res.json({
      success: true,
      data: {
        plan: promo.planGranted,
        planExpires,
        permanent: planExpires === null,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[promo] apply error:', msg)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
