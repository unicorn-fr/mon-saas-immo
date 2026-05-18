import { Router } from 'express'
import { contractController } from '../controllers/contract.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { requirePlan } from '../middlewares/planGate.middleware.js'
import { requireFeature } from '../middlewares/featureGate.middleware.js'
import { requireIdentityVerified } from '../middlewares/identity.middleware.js'
import { prisma } from '../config/database.js'
import { generateSignedUrl } from '../utils/cloudinary.util.js'

const router = Router()

/**
 * All routes require authentication
 */
router.use(authenticate)

// GET /api/v1/contracts/statistics - Get contract statistics
router.get('/statistics', contractController.getStatistics.bind(contractController))

// GET /api/v1/contracts - Get all contracts (filtered by user role)
router.get('/', contractController.getContracts.bind(contractController))

// POST /api/v1/contracts - Create new contract (owner only, PRO plan required)
router.post(
  '/',
  authorize('OWNER'),
  requireIdentityVerified,
  requireFeature('contract_creation'),
  contractController.createContract.bind(contractController)
)

// GET /api/v1/contracts/:id - Get contract by ID
router.get('/:id', contractController.getContractById.bind(contractController))

// PUT /api/v1/contracts/:id - Update contract (owner only)
router.put(
  '/:id',
  authorize('OWNER'),
  contractController.updateContract.bind(contractController)
)

// DELETE /api/v1/contracts/:id - Delete contract (owner only)
router.delete(
  '/:id',
  authorize('OWNER'),
  contractController.deleteContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/send - Send contract to tenant (owner only)
router.put(
  '/:id/send',
  authorize('OWNER'),
  contractController.sendContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/sign - Sign contract (owner or tenant)
// Pas de requirePlan ici : le tenant (FREE) doit pouvoir signer le contrat envoyé par un owner PRO.
// La vérification du plan est faite à la création/envoi du contrat (côté owner).
router.put('/:id/sign', contractController.signContract.bind(contractController))

// PUT /api/v1/contracts/:id/activate - Activate contract (owner only)
router.put(
  '/:id/activate',
  authorize('OWNER'),
  contractController.activateContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/terminate - Terminate contract (owner only)
router.put(
  '/:id/terminate',
  authorize('OWNER'),
  contractController.terminateContract.bind(contractController)
)

// PUT /api/v1/contracts/:id/cancel - Cancel contract (owner only)
router.put(
  '/:id/cancel',
  authorize('OWNER'),
  contractController.cancelContract.bind(contractController)
)

// ============================================
// DOCUMENT ROUTES
// ============================================

// GET /api/v1/contracts/:id/documents - Get contract documents
router.get(
  '/:id/documents',
  contractController.getContractDocuments.bind(contractController)
)

// POST /api/v1/contracts/:id/documents - Upload document (owner or tenant)
router.post(
  '/:id/documents',
  contractController.uploadDocument.bind(contractController)
)

// DELETE /api/v1/contracts/:id/documents/:docId - Delete document
router.delete(
  '/:id/documents/:docId',
  contractController.deleteDocument.bind(contractController)
)

// PUT /api/v1/contracts/:id/documents/:docId/validate - Validate document (owner or admin)
router.put(
  '/:id/documents/:docId/validate',
  contractController.validateDocument.bind(contractController)
)

// PUT /api/v1/contracts/:id/documents/:docId/reject - Reject document (owner or admin)
router.put(
  '/:id/documents/:docId/reject',
  contractController.rejectDocument.bind(contractController)
)

// POST /contracts/:id/send-yousign
// Lance le processus de signature Yousign pour un contrat
router.post('/:id/send-yousign', authorize('OWNER'), async (req, res) => {
  try {
    const { id } = req.params
    const ownerId = req.user!.id

    const contract = await prisma.contract.findFirst({
      where: { id, ownerId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { address: true, city: true, title: true } },
      },
    })

    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })
    if (!['DRAFT', 'SENT'].includes(contract.status)) {
      return res.status(400).json({ success: false, message: 'Ce contrat ne peut pas être envoyé pour signature' })
    }
    if (!contract.pdfUrl) {
      return res.status(400).json({ success: false, message: 'Générez d\'abord le PDF du contrat' })
    }

    const { createSignatureRequest } = await import('../services/yousign.service.js')

    // Télécharger le PDF depuis Cloudinary pour l'envoyer à Yousign
    const signedPdfUrl = generateSignedUrl(contract.pdfUrl, 300)
    const pdfResponse = await fetch(signedPdfUrl)
    if (!pdfResponse.ok) {
      return res.status(500).json({ success: false, message: 'Impossible de récupérer le PDF du contrat' })
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

    const appUrl = process.env.APP_URL ?? 'https://bailio.fr'
    const webhookUrl = `${process.env.API_URL ?? appUrl}/api/v1/webhooks/yousign`

    const { requestId, ownerLink, tenantLink } = await createSignatureRequest({
      name: `Bail - ${contract.property.title} - ${contract.tenant.firstName} ${contract.tenant.lastName}`,
      pdfBuffer,
      filename: `bail-${contract.id}.pdf`,
      signers: [
        {
          email: contract.owner.email,
          firstName: contract.owner.firstName,
          lastName: contract.owner.lastName,
          role: 'SIGNER',
          signatureLevel: 'electronic_signature',
          signatureAuthenticationMode: 'otp_email',
          ...(contract.owner.phone && { phone: contract.owner.phone }),
        },
        {
          email: contract.tenant.email,
          firstName: contract.tenant.firstName,
          lastName: contract.tenant.lastName,
          role: 'SIGNER',
          signatureLevel: 'electronic_signature',
          signatureAuthenticationMode: 'otp_email',
        },
      ],
      expiresInDays: 30,
      webhookUrl,
    })

    await prisma.contract.update({
      where: { id },
      data: {
        signingMode: 'YOUSIGN',
        yousignRequestId: requestId,
        yousignOwnerLink: ownerLink,
        yousignTenantLink: tenantLink,
        status: 'SENT',
      },
    })

    return res.json({
      success: true,
      data: { requestId, ownerLink, tenantLink },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[contract] send-yousign error:', msg)
    return res.status(500).json({ success: false, message: msg })
  }
})

export default router
