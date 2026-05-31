import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()

// ── GET /api/v1/alerts ──────────────────────────────────────────────────────
// Retourne toutes les alertes de l'utilisateur connecté
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.searchAlert.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({ success: true, data: { alerts } })
  } catch (err) {
    console.error('[alerts] GET / error:', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ── POST /api/v1/alerts ─────────────────────────────────────────────────────
// Créer une nouvelle alerte
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      name,
      city,
      type,
      minPrice,
      maxPrice,
      minSurface,
      maxSurface,
      rooms,
      furnished,
    } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ "name" est requis' })
    }

    const alert = await prisma.searchAlert.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        city: city ?? null,
        type: type ?? null,
        minPrice: minPrice != null ? Number(minPrice) : null,
        maxPrice: maxPrice != null ? Number(maxPrice) : null,
        minSurface: minSurface != null ? Number(minSurface) : null,
        maxSurface: maxSurface != null ? Number(maxSurface) : null,
        rooms: rooms != null ? Number(rooms) : null,
        furnished: furnished != null ? Boolean(furnished) : null,
      },
    })

    return res.status(201).json({ success: true, data: { alert } })
  } catch (err) {
    console.error('[alerts] POST / error:', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ── PUT /api/v1/alerts/:id ──────────────────────────────────────────────────
// Modifier une alerte (name, filtres, active)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = await prisma.searchAlert.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable' })
    }
    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' })
    }

    const {
      name,
      active,
      city,
      type,
      minPrice,
      maxPrice,
      minSurface,
      maxSurface,
      rooms,
      furnished,
    } = req.body

    const alert = await prisma.searchAlert.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name).trim() }),
        ...(active != null && { active: Boolean(active) }),
        ...(city !== undefined && { city: city ?? null }),
        ...(type !== undefined && { type: type ?? null }),
        ...(minPrice !== undefined && { minPrice: minPrice != null ? Number(minPrice) : null }),
        ...(maxPrice !== undefined && { maxPrice: maxPrice != null ? Number(maxPrice) : null }),
        ...(minSurface !== undefined && { minSurface: minSurface != null ? Number(minSurface) : null }),
        ...(maxSurface !== undefined && { maxSurface: maxSurface != null ? Number(maxSurface) : null }),
        ...(rooms !== undefined && { rooms: rooms != null ? Number(rooms) : null }),
        ...(furnished !== undefined && { furnished: furnished != null ? Boolean(furnished) : null }),
      },
    })

    return res.status(200).json({ success: true, data: { alert } })
  } catch (err) {
    console.error('[alerts] PUT /:id error:', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ── DELETE /api/v1/alerts/:id ───────────────────────────────────────────────
// Supprimer une alerte
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = await prisma.searchAlert.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable' })
    }
    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' })
    }

    await prisma.searchAlert.delete({ where: { id } })

    return res.status(200).json({ success: true, data: { deleted: true } })
  } catch (err) {
    console.error('[alerts] DELETE /:id error:', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// ── POST /api/v1/alerts/:id/mark-seen ──────────────────────────────────────
// L'utilisateur a vu les nouveaux biens → reset newCount à 0
router.post('/:id/mark-seen', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const existing = await prisma.searchAlert.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Alerte introuvable' })
    }
    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' })
    }

    const alert = await prisma.searchAlert.update({
      where: { id },
      data: { newCount: 0 },
    })

    return res.status(200).json({ success: true, data: { alert } })
  } catch (err) {
    console.error('[alerts] POST /:id/mark-seen error:', err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
