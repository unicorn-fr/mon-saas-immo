import { Request, Response } from 'express'
import { PrismaClient, PlanType } from '@prisma/client'

const prisma = new PrismaClient()

export async function listPromoCodes(_req: Request, res: Response) {
  try {
    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { redemptions: true } },
        redemptions: {
          select: {
            user: { select: { email: true, firstName: true, lastName: true } },
            redeemedAt: true,
            planExpires: true,
          },
          orderBy: { redeemedAt: 'desc' },
          take: 50,
        },
      },
    })
    return res.json({ success: true, data: codes })
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) })
  }
}

export async function createPromoCode(req: Request, res: Response) {
  try {
    const { code, planGranted, durationDays, maxUses, expiresAt, note } = req.body as {
      code: string
      planGranted: PlanType
      durationDays?: number | null
      maxUses?: number | null
      expiresAt?: string | null
      note?: string
    }

    if (!code || !planGranted) {
      return res.status(400).json({ success: false, message: 'code et planGranted requis' })
    }

    const validPlans: PlanType[] = ['SOLO', 'PRO', 'EXPERT']
    if (!validPlans.includes(planGranted)) {
      return res.status(400).json({ success: false, message: 'Plan invalide (SOLO | PRO | EXPERT)' })
    }

    const created = await prisma.promoCode.create({
      data: {
        code: code.trim().toUpperCase(),
        planGranted,
        durationDays: durationDays ?? null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        note: note?.trim() || null,
      },
    })

    return res.status(201).json({ success: true, data: created })
  } catch (err: unknown) {
    const msg = String(err)
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ success: false, message: 'Ce code existe déjà' })
    }
    return res.status(500).json({ success: false, message: msg })
  }
}

export async function updatePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { isActive, note, maxUses, expiresAt, durationDays } = req.body as {
      isActive?: boolean
      note?: string
      maxUses?: number | null
      expiresAt?: string | null
      durationDays?: number | null
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(note !== undefined && { note: note.trim() || null }),
        ...(maxUses !== undefined && { maxUses }),
        ...(durationDays !== undefined && { durationDays }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    })

    return res.json({ success: true, data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) })
  }
}

export async function deletePromoCode(req: Request, res: Response) {
  try {
    const { id } = req.params
    await prisma.promoCode.delete({ where: { id } })
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ success: false, message: String(err) })
  }
}
