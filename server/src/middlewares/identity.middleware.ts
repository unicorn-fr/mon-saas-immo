import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'

export const requireIdentityVerified = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeIdentityStatus: true },
  })

  if (user?.stripeIdentityStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: "Votre identité doit être vérifiée avant de pouvoir effectuer cette action.",
      code: 'IDENTITY_REQUIRED',
    })
  }
  next()
}
