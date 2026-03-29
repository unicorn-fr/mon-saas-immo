import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'
import { generateReceiptPDF } from '../templates/receiptPDF.js'
import { generateSignedUrl, uploadBufferToCloudinary } from '../utils/cloudinary.util.js'

const router = Router()
router.use(authenticate)

// ─── LISTE DES PAIEMENTS D'UN CONTRAT ────────────────────────────────────────
// GET /payments?contractId=xxx
router.get('/', async (req: Request, res: Response) => {
  const { contractId } = req.query
  if (!contractId) return res.status(400).json({ error: 'contractId requis' })

  const payments = await prisma.payment.findMany({
    where: { contractId: contractId as string },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  return res.json(payments)
})

// ─── MARQUER COMME PAYÉ + GÉNÉRER QUITTANCE ──────────────────────────────────
// PUT /payments/:id/mark-paid
router.put('/:id/mark-paid', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        contract: {
          include: {
            tenant: { select: { firstName: true, lastName: true } },
            property: {
              select: {
                address: true, city: true, postalCode: true,
                owner: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    })

    if (!payment) return res.status(404).json({ error: 'Paiement introuvable' })
    if (payment.status === 'PAID') return res.status(400).json({ error: 'Déjà marqué comme payé' })

    const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date()

    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidDate } })

    const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

    const receiptNumber = `${payment.year}${String(payment.month).padStart(2,'0')}-${payment.id.slice(-6).toUpperCase()}`

    const pdfBuffer = await generateReceiptPDF({
      receiptNumber,
      month: MONTHS[payment.month - 1],
      year: payment.year,
      landlord: {
        firstName: payment.contract.property.owner.firstName,
        lastName:  payment.contract.property.owner.lastName,
        address:   payment.contract.property.address,
      },
      tenant:   payment.contract.tenant,
      property: payment.contract.property,
      rentAmount: payment.amount,
      charges:    payment.charges,
      paidDate,
    })

    const cloudinaryPublicId = await uploadBufferToCloudinary(pdfBuffer, `receipt-${payment.contractId}-${payment.year}-${payment.month}.pdf`, {
      folder: 'bailio/receipts',
      resource_type: 'raw',
      type: 'authenticated',
    })

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { receiptCloudinaryId: cloudinaryPublicId },
    })

    return res.json({ ...updated, message: 'Loyer marqué comme payé et quittance générée' })
  } catch (err: any) {
    console.error('[payment] mark-paid error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ─── TÉLÉCHARGER UNE QUITTANCE ────────────────────────────────────────────────
// GET /payments/:id/receipt
router.get('/:id/receipt', async (req: Request, res: Response) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { contract: { select: { tenantId: true, property: { select: { ownerId: true } } } } },
  })

  if (!payment) return res.status(404).json({ error: 'Paiement introuvable' })
  if (!payment.receiptCloudinaryId) return res.status(404).json({ error: 'Quittance non encore générée' })

  const isOwner  = payment.contract.property.ownerId === req.user!.id
  const isTenant = payment.contract.tenantId === req.user!.id

  if (!isOwner && !isTenant) return res.status(403).json({ error: 'Accès refusé' })

  const signedUrl = generateSignedUrl(payment.receiptCloudinaryId)
  return res.json({ url: signedUrl, expiresIn: 3600 })
})

export default router
