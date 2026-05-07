/**
 * Routes Stripe Connect — Wallets propriétaires + mandats SEPA locataires
 *
 * Propriétaire :
 *   POST /connect/onboard        → lien onboarding Stripe Express
 *   GET  /connect/status         → statut compte Connect
 *   POST /connect/dashboard-link → lien tableau de bord Stripe
 *
 * Locataire :
 *   POST /connect/mandate/setup        → créer SetupIntent SEPA (retourne client_secret)
 *   GET  /connect/mandate/:contractId  → état du mandat SEPA
 *   DELETE /connect/mandate/:contractId → révoquer le mandat
 *
 * Paiement (propriétaire ou cron) :
 *   POST /connect/collect → déclencher un prélèvement
 *   GET  /connect/wallet  → historique complet (loyers reçus ou versés)
 */

import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/auth.middleware.js'
import { requirePlan } from '../middlewares/planGate.middleware.js'
import { requireFeature } from '../middlewares/featureGate.middleware.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'
import {
  createConnectOnboardingLink,
  getConnectAccountStatus,
  createConnectDashboardLink,
  createSepaSetupIntent,
  confirmSepaMandate,
  collectRentPayment,
} from '../services/connect.service.js'

const router = Router()
router.use(authenticate)

// ══════════════════════════════════════════════════════
// PROPRIÉTAIRE — Compte Connect (portefeuille)
// ══════════════════════════════════════════════════════

// POST /connect/onboard — Démarre l'onboarding Stripe Connect Express (tous plans OWNER)
router.post('/onboard', authorize('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const baseUrl = env.FRONTEND_URL
    const url = await createConnectOnboardingLink(
      req.user!.id,
      `${baseUrl}/owner/wallet?connect=refresh`,
      `${baseUrl}/owner/wallet?connect=success`
    )
    return res.json({ success: true, data: { url } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// GET /connect/status — Statut du compte Connect du propriétaire
router.get('/status', authorize('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const status = await getConnectAccountStatus(req.user!.id)
    return res.json({ success: true, data: status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// POST /connect/dashboard-link — Lien vers le tableau de bord Stripe du propriétaire
router.post('/dashboard-link', authorize('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const url = await createConnectDashboardLink(req.user!.id)
    return res.json({ success: true, data: { url } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// GET /connect/wallet — Historique des loyers reçus (propriétaire)
router.get('/wallet', authorize('OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const payments = await prisma.rentPayment.findMany({
      where: { landlordId: req.user!.id },
      orderBy: { scheduledDate: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        platformFeeCents: true,
        netRevenueCents: true,
        scheduledDate: true,
        processedAt: true,
        periodMonth: true,
        periodYear: true,
        failureReason: true,
        tenant: { select: { firstName: true, lastName: true, email: true } },
        contract: {
          select: {
            id: true,
            property: { select: { title: true, address: true, city: true } },
          },
        },
      },
    })

    // Totaux
    const succeeded = payments.filter(p => p.status === 'SUCCEEDED')
    const totalReceivedCents = succeeded.reduce((sum, p) => sum + p.totalAmountCents - (p.platformFeeCents ?? 0), 0)

    return res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalReceivedCents,
          totalCount: succeeded.length,
          pendingCount: payments.filter(p => p.status === 'PENDING').length,
          failedCount: payments.filter(p => p.status === 'FAILED').length,
        },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// ══════════════════════════════════════════════════════
// LOCATAIRE — Mandat SEPA
// ══════════════════════════════════════════════════════

// POST /connect/mandate/setup — Créer un SetupIntent SEPA pour un contrat
router.post('/mandate/setup', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.body
    if (!contractId) return res.status(400).json({ success: false, message: 'contractId requis' })

    // Vérifier que le locataire est bien lié à ce contrat
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId: req.user!.id },
      select: {
        id: true,
        owner: { select: { stripeAccountId: true, stripeAccountStatus: true } },
      },
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })

    if (!contract.owner.stripeAccountId || contract.owner.stripeAccountStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Le propriétaire n\'a pas encore configuré son compte de virement. Contactez-le.',
      })
    }

    const result = await createSepaSetupIntent(
      req.user!.id,
      contractId,
      contract.owner.stripeAccountId
    )

    return res.json({ success: true, data: result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(400).json({ success: false, message: msg })
  }
})

// POST /connect/mandate/confirm — Confirmer le SetupIntent et activer le mandat
router.post('/mandate/confirm', async (req: Request, res: Response) => {
  try {
    const { setupIntentId } = req.body
    if (!setupIntentId) return res.status(400).json({ success: false, message: 'setupIntentId requis' })

    // Verify the setupIntent belongs to a contract where this user is the tenant
    const mandate = await prisma.sepaMandate.findFirst({
      where: { stripeSetupIntentId: setupIntentId, tenantId: req.user!.id },
      select: { id: true },
    })
    if (!mandate) return res.status(403).json({ success: false, message: 'Accès refusé' })

    const confirmedMandate = await confirmSepaMandate(setupIntentId)
    return res.json({ success: true, data: confirmedMandate })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(400).json({ success: false, message: msg })
  }
})

// GET /connect/mandate/:contractId — État du mandat SEPA
router.get('/mandate/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params

    // Vérifier accès (locataire ou propriétaire du contrat)
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        OR: [{ tenantId: req.user!.id }, { ownerId: req.user!.id }],
      },
      select: { id: true },
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })

    const mandate = await prisma.sepaMandate.findUnique({
      where: { contractId },
      select: {
        isActive: true,
        ibanLast4: true,
        bankName: true,
        holderName: true,
        createdAt: true,
        revokedAt: true,
        stripePaymentMethodId: true,
      },
    })

    return res.json({ success: true, data: mandate ?? null })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// DELETE /connect/mandate/:contractId — Révoquer le mandat SEPA
router.delete('/mandate/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params

    const mandate = await prisma.sepaMandate.findFirst({
      where: { contractId, tenantId: req.user!.id },
    })
    if (!mandate) return res.status(404).json({ success: false, message: 'Mandat introuvable' })

    await prisma.sepaMandate.update({
      where: { contractId },
      data: { isActive: false, revokedAt: new Date() },
    })

    return res.json({ success: true, data: { revoked: true } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// GET /connect/payments — Historique des loyers payés (locataire)
router.get('/payments', authorize('TENANT', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const payments = await prisma.rentPayment.findMany({
      where: { tenantId: req.user!.id },
      orderBy: { scheduledDate: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        scheduledDate: true,
        processedAt: true,
        periodMonth: true,
        periodYear: true,
        failureReason: true,
        contract: {
          select: {
            property: { select: { title: true, address: true, city: true } },
          },
        },
      },
    })
    return res.json({ success: true, data: { payments } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

// ══════════════════════════════════════════════════════
// PRÉLÈVEMENT — Déclencher manuellement (propriétaire)
// ══════════════════════════════════════════════════════

// POST /connect/collect — Déclencher un prélèvement loyer
router.post('/collect', authorize('OWNER'), requirePlan('PRO'), requireFeature('sepa_payment'), async (req: Request, res: Response) => {
  try {
    const { rentPaymentId } = req.body
    if (!rentPaymentId) return res.status(400).json({ success: false, message: 'rentPaymentId requis' })

    // Vérifier que le propriétaire est bien celui du paiement
    const rentPayment = await prisma.rentPayment.findFirst({
      where: { id: rentPaymentId, landlordId: req.user!.id, status: 'PENDING' },
    })
    if (!rentPayment) return res.status(404).json({ success: false, message: 'Paiement introuvable ou déjà traité' })

    await collectRentPayment(rentPaymentId)

    const updated = await prisma.rentPayment.findUnique({ where: { id: rentPaymentId } })
    return res.json({ success: true, data: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ success: false, message: msg })
  }
})

export default router
