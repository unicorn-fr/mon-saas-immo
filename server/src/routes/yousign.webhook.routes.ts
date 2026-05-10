import { Router, Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { verifyWebhookSignature, downloadSignedDocument } from '../services/yousign.service.js'
import { uploadBufferToCloudinary } from '../utils/cloudinary.util.js'

const router = Router()

// POST /webhooks/yousign
// Webhook Yousign — appelé quand un signataire signe ou quand tous ont signé
router.post('/', async (req: Request, res: Response) => {
  try {
    // Vérifier l'authenticité du webhook
    const signature = (req.headers['x-yousign-signature-256'] as string) ?? ''
    const rawBody = JSON.stringify(req.body)

    if (process.env.YOUSIGN_WEBHOOK_SECRET && signature) {
      const valid = verifyWebhookSignature(rawBody, signature.replace('sha256=', ''))
      if (!valid) {
        console.warn('[yousign-webhook] Signature invalide — ignoré')
        return res.status(401).json({ error: 'Signature invalide' })
      }
    }

    const { event_name, data } = req.body as {
      event_name: string
      data: { signature_request: { id: string } }
    }

    const requestId = data?.signature_request?.id
    if (!requestId) return res.status(400).json({ error: 'requestId manquant' })

    console.log(`[yousign-webhook] Événement: ${event_name}, requestId: ${requestId}`)

    // Trouver le contrat correspondant
    const contract = await prisma.contract.findFirst({
      where: { yousignRequestId: requestId },
      include: {
        owner: { select: { email: true, firstName: true } },
        tenant: { select: { email: true, firstName: true } },
      },
    })

    if (!contract) {
      console.warn(`[yousign-webhook] Contrat non trouvé pour requestId: ${requestId}`)
      return res.json({ received: true })
    }

    if (event_name === 'signature_request.signer.done') {
      // Un signataire a signé — mettre à jour le statut
      const signerEmail = (req.body as { data: { signer: { info: { email: string } } } }).data?.signer?.info?.email
      if (signerEmail === contract.owner.email && !contract.signedByOwner) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { signedByOwner: new Date(), status: 'SIGNED_OWNER' },
        })
        console.log(`[yousign-webhook] Bailleur signé: ${contract.id}`)
      } else if (signerEmail === contract.tenant.email && !contract.signedByTenant) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { signedByTenant: new Date(), status: 'SIGNED_TENANT' },
        })
        console.log(`[yousign-webhook] Locataire signé: ${contract.id}`)
      }
    }

    if (event_name === 'signature_request.completed') {
      // Tous ont signé — télécharger le PDF signé + archiver
      try {
        const signedPdfBuffer = await downloadSignedDocument(requestId)
        const cloudinaryId = await uploadBufferToCloudinary(
          signedPdfBuffer,
          `contract-yousign-${contract.id}.pdf`,
          { folder: 'bailio/contracts/signed', resource_type: 'raw', type: 'authenticated' }
        )

        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            status: 'COMPLETED',
            signedAt: new Date(),
            signedByOwner: contract.signedByOwner ?? new Date(),
            signedByTenant: contract.signedByTenant ?? new Date(),
            yousignCompletedAt: new Date(),
            yousignSignedPdfUrl: cloudinaryId,
            pdfUrl: cloudinaryId,
          },
        })

        console.log(`[yousign-webhook] Contrat complété et archivé: ${contract.id}`)
      } catch (pdfErr: unknown) {
        const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
        console.error(`[yousign-webhook] Erreur téléchargement PDF signé: ${msg}`)
      }
    }

    return res.json({ received: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[yousign-webhook] Erreur:', msg)
    return res.status(500).json({ error: msg })
  }
})

export default router
