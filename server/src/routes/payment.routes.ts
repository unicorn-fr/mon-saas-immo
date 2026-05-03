import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'
import { generateReceiptPDF } from '../templates/receiptPDF.js'
import { generateSignedUrl, uploadBufferToCloudinary } from '../utils/cloudinary.util.js'
import { sendEmail } from '../utils/email.util.js'

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

// ─── TOUS LES PAIEMENTS DU PROPRIÉTAIRE CONNECTÉ ─────────────────────────────
// GET /payments/by-owner?all=true
router.get('/by-owner', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const all = req.query.all === 'true'
    const ownerId = req.user!.id

    const dateFilter = all
      ? undefined
      : { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // derniers 3 mois

    const payments = await prisma.payment.findMany({
      where: {
        contract: { ownerId },
        ...(dateFilter ? { dueDate: dateFilter } : {}),
      },
      include: {
        contract: {
          select: {
            id: true,
            monthlyRent: true,
            tenant: { select: { firstName: true, lastName: true, email: true } },
            property: { select: { title: true, address: true, city: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return res.json({ success: true, data: payments })
  } catch (err: any) {
    console.error('[payment] by-owner error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
})

// ─── PARAMÈTRES QUITTANCES — GET ─────────────────────────────────────────────
// GET /payments/settings/:contractId
router.get('/settings/:contractId', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params

    // Vérifier que le contrat appartient bien à cet owner
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, ownerId: req.user!.id },
      select: { id: true },
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })

    const settings = await prisma.paymentSettings.findUnique({
      where: { contractId },
    })

    // Retourner les valeurs par défaut si aucun enregistrement
    return res.json({
      success: true,
      data: settings ?? { dayOfMonth: 5, autoSend: true },
    })
  } catch (err: any) {
    console.error('[payment] settings get error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
})

// ─── PARAMÈTRES QUITTANCES — UPSERT ──────────────────────────────────────────
// PUT /payments/settings/:contractId
router.put('/settings/:contractId', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params
    const { dayOfMonth, autoSend } = req.body

    // Validation dayOfMonth
    if (dayOfMonth !== undefined) {
      const day = Number(dayOfMonth)
      if (!Number.isInteger(day) || day < 1 || day > 28) {
        return res.status(400).json({ success: false, message: 'dayOfMonth doit être un entier entre 1 et 28' })
      }
    }

    // Vérifier que le contrat appartient à cet owner
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, ownerId: req.user!.id },
      select: { id: true },
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })

    const settings = await prisma.paymentSettings.upsert({
      where: { contractId },
      create: {
        contractId,
        dayOfMonth: dayOfMonth !== undefined ? Number(dayOfMonth) : 5,
        autoSend: autoSend !== undefined ? Boolean(autoSend) : true,
      },
      update: {
        ...(dayOfMonth !== undefined && { dayOfMonth: Number(dayOfMonth) }),
        ...(autoSend !== undefined && { autoSend: Boolean(autoSend) }),
      },
    })

    return res.json({ success: true, data: settings })
  } catch (err: any) {
    console.error('[payment] settings upsert error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GÉNÉRER UN PAIEMENT ──────────────────────────────────────────────────────
// POST /payments/generate
router.post('/generate', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const { contractId, month, year, amount, charges } = req.body

    if (!contractId || !month || !year) {
      return res.status(400).json({ success: false, message: 'contractId, month et year sont requis' })
    }

    const monthNum = Number(month)
    const yearNum = Number(year)

    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: 'month doit être entre 1 et 12' })
    }

    // Charger le contrat avec ses paramètres de paiement
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, ownerId: req.user!.id },
      include: { paymentSettings: true },
    })
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable' })

    const dayOfMonth = contract.paymentSettings?.dayOfMonth ?? 5
    const rentAmount = amount !== undefined ? Number(amount) : contract.monthlyRent
    const chargesAmount = charges !== undefined ? Number(charges) : (contract.charges ?? 0)

    // Calculer la date d'échéance
    const dueDate = new Date(yearNum, monthNum - 1, dayOfMonth)

    const payment = await prisma.payment.upsert({
      where: { contractId_month_year: { contractId, month: monthNum, year: yearNum } },
      create: {
        contractId,
        amount: rentAmount,
        charges: chargesAmount,
        dueDate,
        status: 'PENDING',
        month: monthNum,
        year: yearNum,
      },
      update: {
        amount: rentAmount,
        charges: chargesAmount,
        dueDate,
      },
    })

    return res.status(201).json({ success: true, data: payment })
  } catch (err: any) {
    console.error('[payment] generate error:', err)
    return res.status(500).json({ success: false, message: err.message })
  }
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
            paymentSettings: true,
            owner: { select: { firstName: true, lastName: true } },
            tenant: { select: { firstName: true, lastName: true, email: true } },
            property: {
              select: {
                address: true, city: true, postalCode: true,
                ownerId: true,
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

    // Auto-envoi si activé dans les paramètres
    if (payment.contract.paymentSettings?.autoSend && payment.contract.tenant.email) {
      try {
        const MONTHS_AUTO = ['Janvier','Février','Mars','Avril','Mai','Juin',
          'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
        const autoReceiptUrl = generateSignedUrl(cloudinaryPublicId)
        const autoMonthLabel = MONTHS_AUTO[payment.month - 1]
        const autoTotal = (payment.amount + payment.charges).toFixed(2)
        const autoTenant = payment.contract.tenant
        const autoOwner = payment.contract.owner
        const autoProp = payment.contract.property
        const autoOwnerName = `${autoOwner.firstName} ${autoOwner.lastName}`
        const autoPropAddress = `${autoProp.address}, ${autoProp.city}`

        const autoHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden">
    <div style="background:#1a1a2e;padding:28px 32px">
      <p style="color:#c4976a;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px">Bailio</p>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Votre quittance de loyer</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#0d0c0a;font-size:15px;line-height:1.6;margin:0 0 16px">Bonjour ${autoTenant.firstName},</p>
      <p style="color:#5a5754;font-size:14px;line-height:1.6;margin:0 0 24px">
        Votre propriétaire <strong>${autoOwnerName}</strong> vous transmet votre quittance de loyer pour
        <strong>${autoMonthLabel} ${payment.year}</strong> concernant le bien situé au <strong>${autoPropAddress}</strong>.
      </p>
      <div style="background:#f4f2ee;border-radius:8px;padding:16px 20px;margin:0 0 24px">
        <p style="color:#9e9b96;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">Montant total</p>
        <p style="color:#1a1a2e;font-size:28px;font-weight:700;margin:0">${autoTotal} €</p>
        <p style="color:#5a5754;font-size:13px;margin:4px 0 0">Loyer ${payment.amount.toFixed(2)} € + Charges ${payment.charges.toFixed(2)} €</p>
      </div>
      <a href="${autoReceiptUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">Télécharger la quittance (PDF)</a>
      <p style="color:#9e9b96;font-size:12px;margin:24px 0 0">Ce lien est valable 1 heure. — Bailio · plateforme de gestion locative</p>
    </div>
  </div>
</body>
</html>`

        await sendEmail({
          to: autoTenant.email,
          subject: `Quittance de loyer — ${autoMonthLabel} ${payment.year}`,
          html: autoHtml,
        })
        console.log(`[payment] auto-send quittance → ${autoTenant.email}`)
      } catch (autoErr: any) {
        console.error('[payment] auto-send failed (non-bloquant):', autoErr.message)
      }
    }

    const autoSent = payment.contract.paymentSettings?.autoSend && !!payment.contract.tenant.email
    return res.json({ ...updated, message: 'Loyer marqué comme payé et quittance générée', autoSent })
  } catch (err: any) {
    console.error('[payment] mark-paid error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ─── ENVOYER LA QUITTANCE PAR EMAIL ──────────────────────────────────────────
// POST /payments/:id/send-email
router.post('/:id/send-email', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        contract: {
          include: {
            tenant: { select: { firstName: true, lastName: true, email: true } },
            owner: { select: { firstName: true, lastName: true } },
            property: { select: { address: true, city: true, ownerId: true } },
          },
        },
      },
    })

    if (!payment) return res.status(404).json({ success: false, message: 'Paiement introuvable' })

    // Seul le propriétaire du contrat peut envoyer
    if (payment.contract.property.ownerId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' })
    }

    if (!payment.receiptCloudinaryId) {
      return res.status(400).json({ success: false, message: 'Marquer le paiement comme payé d\'abord' })
    }

    const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

    const receiptUrl = generateSignedUrl(payment.receiptCloudinaryId)
    const monthLabel = MONTHS[payment.month - 1]
    const total = (payment.amount + payment.charges).toFixed(2)
    const tenant = payment.contract.tenant
    const owner = payment.contract.owner
    const property = payment.contract.property

    const ownerName = `${owner.firstName} ${owner.lastName}`
    const propertyAddress = `${property.address}, ${property.city}`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:'DM Sans',system-ui,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e4e1db;border-radius:12px;overflow:hidden">
    <div style="background:#1a1a2e;padding:28px 32px">
      <p style="color:#c4976a;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px">Bailio</p>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Votre quittance de loyer</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#0d0c0a;font-size:15px;line-height:1.6;margin:0 0 16px">Bonjour ${tenant.firstName},</p>
      <p style="color:#5a5754;font-size:14px;line-height:1.6;margin:0 0 24px">Votre propriétaire <strong>${ownerName}</strong> vous transmet votre quittance de loyer pour <strong>${monthLabel} ${payment.year}</strong> concernant le bien situé au <strong>${propertyAddress}</strong>.</p>
      <div style="background:#f4f2ee;border-radius:8px;padding:16px 20px;margin:0 0 24px">
        <p style="color:#9e9b96;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">Montant total</p>
        <p style="color:#1a1a2e;font-size:28px;font-weight:700;margin:0">${total} €</p>
        <p style="color:#5a5754;font-size:13px;margin:4px 0 0">Loyer ${payment.amount.toFixed(2)} € + Charges ${payment.charges.toFixed(2)} €</p>
      </div>
      <a href="${receiptUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">Télécharger la quittance (PDF)</a>
      <p style="color:#9e9b96;font-size:12px;margin:24px 0 0">Ce lien est valable 1 heure. — Bailio · plateforme de gestion locative</p>
    </div>
  </div>
</body>
</html>`

    await sendEmail({
      to: tenant.email,
      subject: `Quittance de loyer — ${monthLabel} ${payment.year}`,
      html,
    })

    return res.json({ success: true, data: { sent: true, to: tenant.email } })
  } catch (err: any) {
    console.error('[payment] send-email error:', err)
    return res.status(500).json({ success: false, message: err.message })
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

// POST /payments/auto-generate-all
router.post('/auto-generate-all', authorize('OWNER'), async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const contracts = await prisma.contract.findMany({
      where: { ownerId, status: 'ACTIVE' },
      include: {
        paymentSettings: true,
        property: { select: { title: true, city: true } },
      },
    })

    const results: Array<{ contractId: string; propertyTitle: string; status: 'created' | 'already_exists' }> = []

    for (const contract of contracts) {
      const dayOfMonth = contract.paymentSettings?.dayOfMonth ?? 5
      const dueDate = new Date(year, month - 1, Math.min(dayOfMonth, 28))
      try {
        await prisma.payment.upsert({
          where: { contractId_month_year: { contractId: contract.id, month, year } },
          create: { contractId: contract.id, amount: contract.monthlyRent, charges: contract.charges ?? 0, dueDate, month, year, status: 'PENDING' },
          update: {},
        })
        results.push({ contractId: contract.id, propertyTitle: contract.property.title, status: 'created' })
      } catch {
        results.push({ contractId: contract.id, propertyTitle: contract.property.title, status: 'already_exists' })
      }
    }

    return res.json({ success: true, data: { generated: results.length, results, month, year } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

export default router
