import { ApplicationStatus } from '@prisma/client'
import { prisma } from '../config/database.js'
import { notificationService } from './notification.service.js'
import { sendEmail } from '../utils/email.util.js'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SelectionCriteria {
  minSalaryRatio?: number           // e.g. 3 = salary must be ≥ 3× rent
  requiredGuarantor?: boolean
  acceptedGuarantorTypes?: string[] // ["physique", "visale"]
  requiredDocCategories?: string[]  // ["IDENTITE", "REVENUS", "SITUATION_PRO"]
  preferredContractTypes?: string[] // ["CDI"]
  autoPilot?: boolean               // auto-approve when score ≥ minScore
  minScore?: number                 // default 70
}

export interface MatchDetail {
  label: string
  points: number
  maxPoints: number
  status: 'pass' | 'partial' | 'fail' | 'na'
  explanation: string
}

export interface MatchResult {
  score: number          // 0–100
  verdict: 'ELIGIBLE' | 'PARTIAL' | 'INELIGIBLE'
  details: {
    salary: MatchDetail
    guarantor: MatchDetail
    documents: MatchDetail
    contractType: MatchDetail
  }
}

export interface CreateApplicationInput {
  propertyId: string
  tenantId: string
  coverLetter?: string
  hasGuarantor?: boolean
  guarantorType?: string
}

// ─── Matching Engine ────────────────────────────────────────────────────────────

export async function computeMatchScore(
  propertyId: string,
  tenantId: string,
  hasGuarantor = false,
  guarantorType?: string
): Promise<MatchResult> {
  const [property, tenant, tenantDocs] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId } }),
    prisma.user.findUnique({ where: { id: tenantId } }),
    prisma.tenantDocument.findMany({ where: { userId: tenantId } }),
  ])

  if (!property || !tenant) {
    throw new Error('Property or tenant not found')
  }

  const criteria = (property.selectionCriteria ?? {}) as SelectionCriteria
  const meta = (tenant.profileMeta ?? {}) as Record<string, unknown>
  const composed = (meta._composed ?? {}) as Record<string, unknown>

  const netSalary = typeof composed.netSalary === 'number' ? composed.netSalary : null
  const contractType = typeof composed.contractType === 'string' ? composed.contractType : null
  const docCategories = [...new Set(tenantDocs.map((d) => d.category))]

  // ── Salary (max 40 pts) ────────────────────────────────────────────────────
  let salaryPoints = 0
  let salaryStatus: MatchDetail['status'] = 'na'
  let salaryExplanation = ''
  const ratio = criteria.minSalaryRatio ?? 3
  const threshold = property.price * ratio

  if (netSalary === null) {
    salaryStatus = 'na'
    salaryExplanation = 'Salaire non renseigné dans votre dossier.'
    salaryPoints = 0
  } else if (netSalary >= threshold) {
    salaryStatus = 'pass'
    salaryPoints = 40
    salaryExplanation = `Salaire net (${netSalary} €) ≥ ${ratio}× le loyer (${threshold} €).`
  } else if (netSalary >= threshold * 0.8) {
    salaryStatus = 'partial'
    salaryPoints = 20
    salaryExplanation = `Salaire net (${netSalary} €) légèrement inférieur au seuil recommandé (${threshold} €).`
  } else {
    salaryStatus = 'fail'
    salaryPoints = 0
    salaryExplanation = `Salaire net (${netSalary} €) insuffisant. Seuil requis : ${threshold} €.`
  }

  // ── Guarantor (max 30 pts) ─────────────────────────────────────────────────
  let guarantorPoints = 0
  let guarantorStatus: MatchDetail['status'] = 'na'
  let guarantorExplanation = ''

  if (!criteria.requiredGuarantor) {
    guarantorStatus = 'pass'
    guarantorPoints = 30
    guarantorExplanation = 'Garant non exigé pour ce bien.'
    if (hasGuarantor) {
      guarantorExplanation = 'Garant fourni (non obligatoire) — dossier renforcé.'
    }
  } else if (!hasGuarantor) {
    guarantorStatus = 'fail'
    guarantorPoints = 0
    guarantorExplanation = 'Un garant est exigé pour ce bien.'
  } else {
    const accepted = criteria.acceptedGuarantorTypes ?? ['physique', 'visale']
    if (!guarantorType || accepted.includes(guarantorType)) {
      guarantorStatus = 'pass'
      guarantorPoints = 30
      guarantorExplanation = `Garant ${guarantorType ?? ''} accepté.`
    } else {
      guarantorStatus = 'fail'
      guarantorPoints = 0
      guarantorExplanation = `Type de garant non accepté. Acceptés : ${accepted.join(', ')}.`
    }
  }

  // ── Documents (max 20 pts) ─────────────────────────────────────────────────
  const required = criteria.requiredDocCategories ?? ['IDENTITE', 'REVENUS', 'EMPLOI']
  const present = required.filter((cat) => docCategories.includes(cat))
  const docRatio = required.length > 0 ? present.length / required.length : 1
  const docPoints = Math.round(docRatio * 20)
  const docStatus: MatchDetail['status'] =
    docRatio === 1 ? 'pass' : docRatio >= 0.5 ? 'partial' : 'fail'
  const missing = required.filter((cat) => !docCategories.includes(cat))
  const docExplanation =
    docRatio === 1
      ? 'Tous les documents obligatoires sont présents.'
      : `Documents manquants : ${missing.join(', ')}.`

  // ── Contract type (max 10 pts) ─────────────────────────────────────────────
  let contractPoints = 0
  let contractStatus: MatchDetail['status'] = 'na'
  let contractExplanation = ''
  const preferred = criteria.preferredContractTypes ?? ['CDI']

  if (!contractType) {
    contractStatus = 'na'
    contractExplanation = 'Type de contrat non renseigné.'
    contractPoints = 5 // neutral
  } else if (preferred.includes(contractType)) {
    contractStatus = 'pass'
    contractPoints = 10
    contractExplanation = `Contrat ${contractType} correspond aux critères du propriétaire.`
  } else {
    contractStatus = 'partial'
    contractPoints = 5
    contractExplanation = `Contrat ${contractType} accepté mais non prioritaire (${preferred.join(', ')} préféré).`
  }

  const totalScore = salaryPoints + guarantorPoints + docPoints + contractPoints
  const minScore = criteria.minScore ?? 70
  const verdict: MatchResult['verdict'] =
    totalScore >= minScore ? 'ELIGIBLE' : totalScore >= 40 ? 'PARTIAL' : 'INELIGIBLE'

  return {
    score: totalScore,
    verdict,
    details: {
      salary:       { label: 'Solvabilité',           points: salaryPoints,   maxPoints: 40, status: salaryStatus,   explanation: salaryExplanation },
      guarantor:    { label: 'Garant',                points: guarantorPoints, maxPoints: 30, status: guarantorStatus, explanation: guarantorExplanation },
      documents:    { label: 'Complétude du dossier', points: docPoints,      maxPoints: 20, status: docStatus,      explanation: docExplanation },
      contractType: { label: 'Stabilité professionnelle', points: contractPoints, maxPoints: 10, status: contractStatus, explanation: contractExplanation },
    },
  }
}

// ─── Service ────────────────────────────────────────────────────────────────────

class ApplicationService {
  /**
   * Compute eligibility without creating an application (live pre-qual check)
   */
  async prequalify(propertyId: string, tenantId: string, hasGuarantor = false, guarantorType?: string) {
    return computeMatchScore(propertyId, tenantId, hasGuarantor, guarantorType)
  }

  /**
   * Submit a candidature
   */
  async createApplication(data: CreateApplicationInput) {
    const { propertyId, tenantId, coverLetter, hasGuarantor = false, guarantorType } = data

    // Check property exists and is available
    const property = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!property) throw new Error('Annonce introuvable')
    if (property.status !== 'AVAILABLE') throw new Error('Ce bien n\'est plus disponible')

    // Vérifier que le locataire a un dossier suffisamment complet (≥ 50/100)
    // Calcul à la volée sur les documents réels (ne pas dépendre du champ tenantScore potentiellement NULL)
    const tenantDocs = await prisma.tenantDocument.findMany({
      where: { userId: tenantId },
      select: { category: true, status: true },
    })
    const dossierWeights: Record<string, number> = { IDENTITE: 25, EMPLOI: 20, REVENUS: 30, DOMICILE: 15, GARANTIES: 10 }
    const validCats = new Set(
      tenantDocs.filter(d => d.status === 'UPLOADED' || d.status === 'VALIDATED').map(d => d.category)
    )
    let dossierScore = 0
    for (const [cat, w] of Object.entries(dossierWeights)) {
      if (validCats.has(cat)) dossierScore += w
    }
    // Mettre à jour tenantScore en base pour cohérence
    await prisma.user.update({ where: { id: tenantId }, data: { tenantScore: dossierScore } })

    if (dossierScore < 50) {
      throw new Error('DOSSIER_INCOMPLET:Votre dossier locatif est incomplet. Ajoutez au minimum une pièce d\'identité et vos justificatifs de revenus avant de postuler.')
    }

    // Check for existing application — block only if PENDING or APPROVED (active)
    const existing = await prisma.application.findUnique({
      where: { propertyId_tenantId: { propertyId, tenantId } },
    })
    if (existing && existing.status === 'PENDING') {
      throw new Error('Votre candidature est déjà en cours d\'examen')
    }
    if (existing && existing.status === 'APPROVED') {
      throw new Error('Votre candidature a déjà été approuvée')
    }
    // REJECTED or WITHDRAWN → allow reapplication

    // Compute score (informational only — owner always decides manually)
    const match = await computeMatchScore(propertyId, tenantId, hasGuarantor, guarantorType)

    const appData = {
      propertyId,
      tenantId,
      coverLetter,
      hasGuarantor,
      guarantorType,
      score: match.score,
      matchDetails: match.details as object,
      status: 'PENDING' as ApplicationStatus, // Always PENDING — owner decides
    }

    const appEmailHtml = (tenantFirstName: string, tenantLastName: string, propertyTitle: string) => {
      const frontendUrl = process.env.FRONTEND_URL ?? ''
      const tenantFullName = `${tenantFirstName} ${tenantLastName}`
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><style>
          *{box-sizing:border-box;margin:0;padding:0;}
          body{background:#fafaf8;font-family:'DM Sans',Arial,sans-serif;color:#0d0c0a;}
          .wrapper{max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e4e1db;border-radius:16px;overflow:hidden;}
          .header{background:#1a1a2e;padding:32px 40px;text-align:center;}
          .header-logo{color:#ffffff;font-size:22px;font-weight:600;}
          .header-logo span{color:#c4976a;}
          .body{padding:40px;}
          .overline{font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9e9b96;margin-bottom:12px;}
          .title{font-size:26px;font-weight:700;font-style:italic;color:#0d0c0a;margin-bottom:16px;line-height:1.25;}
          .text{font-size:14px;color:#5a5754;line-height:1.7;margin-bottom:16px;}
          .btn{display:inline-block;padding:14px 32px;background:#c4976a;color:#ffffff!important;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin:24px 0;}
          .footer{padding:24px 40px;background:#f4f2ee;text-align:center;font-size:12px;color:#9e9b96;line-height:1.6;}
        </style></head><body>
          <div class="wrapper">
            <div class="header"><div class="header-logo">Bai<span>lio</span></div></div>
            <div class="body">
              <div class="overline">Candidature reçue</div>
              <div class="title">${tenantFullName} postule pour ${propertyTitle}</div>
              <p class="text">${tenantFullName} vient de postuler pour votre bien <strong>${propertyTitle}</strong>. Consultez son dossier et répondez depuis votre espace propriétaire.</p>
              <div style="text-align:center;"><a href="${frontendUrl}/dashboard/owner" class="btn">Voir la candidature →</a></div>
            </div>
            <div class="footer"><p>Bailio — Plateforme de gestion locative</p></div>
          </div>
        </body></html>`
    }

    // Upsert if previously rejected or withdrawn
    if (existing) {
      const updated = await prisma.application.update({
        where: { id: existing.id },
        data: appData,
        include: {
          tenant: { select: { id: true, firstName: true, lastName: true } },
          property: { select: { id: true, title: true, price: true, city: true, ownerId: true, owner: { select: { email: true } } } },
        },
      })
      notificationService.notifyApplicationReceived(
        updated.property.ownerId, updated.id, updated.property.title,
        `${updated.tenant.firstName} ${updated.tenant.lastName}`, updated.score
      ).catch(() => {})
      sendEmail({
        to: updated.property.owner.email,
        subject: `Nouvelle candidature — ${updated.property.title}`,
        html: appEmailHtml(updated.tenant.firstName, updated.tenant.lastName, updated.property.title),
      }).catch(() => {})
      return updated
    }

    const created = await prisma.application.create({
      data: appData,
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, title: true, price: true, city: true, ownerId: true, owner: { select: { email: true } } } },
      },
    })
    notificationService.notifyApplicationReceived(
      created.property.ownerId, created.id, created.property.title,
      `${created.tenant.firstName} ${created.tenant.lastName}`, created.score
    ).catch(() => {})
    sendEmail({
      to: created.property.owner.email,
      subject: `Nouvelle candidature — ${created.property.title}`,
      html: appEmailHtml(created.tenant.firstName, created.tenant.lastName, created.property.title),
    }).catch(() => {})
    return created
  }

  /**
   * List applications — owner sees for their properties, tenant sees their own
   */
  async listApplications(userId: string, role: string, propertyId?: string) {
    const where: Record<string, unknown> = {}

    if (role === 'OWNER' || role === 'ADMIN') {
      where.property = { ownerId: userId }
      if (propertyId) where.propertyId = propertyId
    } else {
      where.tenantId = userId
      if (propertyId) where.propertyId = propertyId
    }

    return prisma.application.findMany({
      where,
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, profileMeta: true } },
        property: { select: { id: true, title: true, price: true, city: true, address: true, images: true, selectionCriteria: true, ownerId: true, visitDuration: true, visitAvailabilitySlots: { select: { dayOfWeek: true, startTime: true, endTime: true } } } },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Get single application
   */
  async getApplication(id: string, userId: string, role: string) {
    const app = await prisma.application.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, profileMeta: true } },
        property: { include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    })
    if (!app) throw new Error('Candidature introuvable')
    const isOwner = app.property.ownerId === userId
    const isTenant = app.tenantId === userId
    if (role !== 'ADMIN' && !isOwner && !isTenant) throw new Error('Accès refusé')
    return app
  }

  /**
   * Owner approves or rejects a candidature
   */
  async updateStatus(id: string, ownerId: string, status: ApplicationStatus) {
    const app = await prisma.application.findUnique({
      where: { id },
      include: { property: true },
    })
    if (!app) throw new Error('Candidature introuvable')
    if (app.property.ownerId !== ownerId) throw new Error('Accès refusé')
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new Error('Statut invalide')

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true } },
      },
    })

    // Auto-create CalendarInvite when application is approved so tenant can book visits
    if (status === 'APPROVED') {
      await prisma.calendarInvite.upsert({
        where: { propertyId_tenantId: { propertyId: app.propertyId, tenantId: app.tenantId } },
        create: { propertyId: app.propertyId, ownerId, tenantId: app.tenantId },
        update: {},
      })
    }

    // Notify tenant of decision
    if (status === 'APPROVED' || status === 'REJECTED') {
      notificationService.notifyApplicationStatus(
        updated.tenant.id, updated.id, updated.property.title, status
      ).catch(() => {})
    }

    return updated
  }

  /**
   * Owner cancels a rejection — puts the application back to PENDING
   * Also restores property to AVAILABLE if it was set to RENTED/UNAVAILABLE prematurely
   */
  async unrejectApplication(id: string, ownerId: string) {
    const app = await prisma.application.findUnique({
      where: { id },
      include: { property: true },
    })
    if (!app) throw new Error('Candidature introuvable')
    if (app.property.ownerId !== ownerId) throw new Error('Accès refusé')
    if (app.status !== 'REJECTED') throw new Error('La candidature n\'est pas refusée')

    const updated = await prisma.application.update({
      where: { id },
      data: { status: 'PENDING' },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true } },
      },
    })

    // If property is not available anymore, restore it
    if (app.property.status !== 'AVAILABLE') {
      await prisma.property.update({
        where: { id: app.propertyId },
        data: { status: 'AVAILABLE' },
      })
    }

    return updated
  }

  /**
   * After all candidatures for a property are REJECTED or WITHDRAWN,
   * auto-restore property status to AVAILABLE so it can receive new applications.
   */
  async maybeRestorePropertyAvailability(propertyId: string) {
    const active = await prisma.application.count({
      where: {
        propertyId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    })
    if (active === 0) {
      await prisma.property.updateMany({
        where: { id: propertyId, status: { not: 'AVAILABLE' } },
        data: { status: 'AVAILABLE' },
      })
    }
  }

  /**
   * Tenant withdraws candidature
   */
  async withdraw(id: string, tenantId: string) {
    const app = await prisma.application.findUnique({ where: { id } })
    if (!app) throw new Error('Candidature introuvable')
    if (app.tenantId !== tenantId) throw new Error('Accès refusé')
    return prisma.application.update({ where: { id }, data: { status: 'WITHDRAWN' } })
  }

  /**
   * Check if a tenant has an approved application for a property (booking gate)
   */
  async hasApprovedApplication(propertyId: string, tenantId: string): Promise<boolean> {
    const app = await prisma.application.findUnique({
      where: { propertyId_tenantId: { propertyId, tenantId } },
    })
    return app?.status === 'APPROVED'
  }
}

export const applicationService = new ApplicationService()
