/**
 * Routes SEPA — Paiement automatique des loyers
 *
 * Statut : STUBS — structure complète, intégration Lemonway à activer quand
 * SEPA_PAYMENTS_ENABLED=true et credentials Lemonway configurés.
 *
 * Flow prévu :
 * 1. Propriétaire active SEPA sur un contrat → POST /sepa/mandate
 * 2. Locataire saisit son IBAN → validé, mandat créé dans Lemonway
 * 3. Cron job le 1er du mois → POST /sepa/collect (auto)
 * 4. Notification email des deux côtés
 */

import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requirePlan } from '../middlewares/planGate.middleware.js'
import { requireFeature } from '../middlewares/featureGate.middleware.js'
import { calculatePlatformFee } from '../utils/feeCalculator.js'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

const router = Router()

// ── Toutes les routes SEPA nécessitent auth + plan PRO minimum ────────────────
router.use(authenticate)
router.use(requirePlan('PRO'))

// POST /api/v1/sepa/mandate — Configurer mandat SEPA pour un contrat
router.post('/mandate', requireFeature('sepa_payment'), async (req: Request, res: Response) => {
  if (!env.SEPA_PAYMENTS_ENABLED) {
    return res.status(503).json({
      error: 'sepa_not_available',
      message: 'Le paiement automatique des loyers sera disponible très prochainement. Vous serez notifié par email lors de l\'activation.',
    })
  }

  const { contractId, iban, bankAccountHolderName } = req.body
  if (!contractId || !iban) {
    return res.status(400).json({ error: 'contractId et iban requis' })
  }

  // Vérifier que le contrat appartient bien au propriétaire
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, ownerId: req.user!.id },
    select: { id: true, tenantId: true, monthlyRent: true },
  })
  if (!contract) return res.status(404).json({ error: 'Contrat non trouvé' })

  // TODO M+1 — Intégration Lemonway :
  // 1. lemonwayService.createWallet(contract.tenantId, iban)
  // 2. lemonwayService.registerMandate(walletId, iban, bankAccountHolderName)
  // 3. Stocker mandate_id dans rent_payment_settings

  return res.status(202).json({
    message: 'Configuration SEPA en attente d\'activation.',
    contractId,
  })
})

// POST /api/v1/sepa/collect — Déclencher prélèvement pour un rent_payment
// (appelé par le cron job mensuel — pas directement par le frontend)
router.post('/collect', async (req: Request, res: Response) => {
  if (!env.SEPA_PAYMENTS_ENABLED) {
    return res.status(503).json({ error: 'SEPA non activé' })
  }

  const { rentPaymentId } = req.body
  if (!rentPaymentId) return res.status(400).json({ error: 'rentPaymentId requis' })

  const rentPayment = await prisma.rentPayment.findUnique({
    where: { id: rentPaymentId },
    include: {
      contract: { select: { ownerId: true } },
      landlord: { select: { subscription: { select: { plan: true } } } },
    },
  })

  if (!rentPayment) return res.status(404).json({ error: 'Paiement non trouvé' })
  if (rentPayment.status !== 'PENDING') {
    return res.status(409).json({ error: `Statut invalide: ${rentPayment.status}` })
  }

  const plan = rentPayment.landlord.subscription?.plan ?? 'PRO'
  if (plan !== 'PRO' && plan !== 'EXPERT') {
    return res.status(403).json({ error: 'Plan ne supporte pas SEPA' })
  }

  const fees = calculatePlatformFee(rentPayment.totalAmountCents, plan as 'PRO' | 'EXPERT')

  // TODO M+1 — Intégration Lemonway :
  // const result = await lemonwayService.directDebit(rentPayment.pspMandateId, rentPayment.totalAmountCents)
  // await prisma.rentPayment.update({ where: { id: rentPaymentId }, data: { status: 'PROCESSING', pspPaymentIntentId: result.transactionId } })

  // Mise à jour des frais calculés (pré-calcul pour reporting)
  await prisma.rentPayment.update({
    where: { id: rentPaymentId },
    data: {
      platformFeeCents: fees.platformFeeCents,
      stripeCostCents: fees.stripeCostCents,
      netRevenueCents: fees.netRevenueCents,
    },
  })

  return res.json({
    message: 'Prélèvement SEPA initié (stub)',
    fees,
  })
})

// GET /api/v1/sepa/payments — Historique des paiements SEPA du propriétaire
router.get('/payments', async (req: Request, res: Response) => {
  const payments = await prisma.rentPayment.findMany({
    where: { landlordId: req.user!.id },
    orderBy: { scheduledDate: 'desc' },
    take: 50,
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
      tenant: { select: { firstName: true, lastName: true } },
      contract: { select: { id: true } },
    },
  })
  return res.json({ payments })
})

// GET /api/v1/sepa/status — Statut global du service SEPA
router.get('/status', async (_req: Request, res: Response) => {
  return res.json({
    enabled: env.SEPA_PAYMENTS_ENABLED,
    provider: 'stripe',
    message: env.SEPA_PAYMENTS_ENABLED
      ? 'Service SEPA actif'
      : 'Service SEPA en cours d\'activation — disponible très prochainement',
  })
})

export default router
