import type { Draft, Lease, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import {
  durationMonths,
  formatDateFr,
  leaseEndDate,
  leaseInputSchema,
  maxDepositCents,
  parseIsoDate,
  type LeaseInput,
} from '../domain/lease.js'
import { HttpError } from '../lib/http.js'
import { latestIrl } from '../lib/irl.js'
import { layout, sendEmail } from '../lib/email.js'
import { sha256 } from '../lib/tokens.js'
import { renderLeasePdf } from '../pdf/lease.js'
import { ensureReminders } from './reminders.js'

/** Valide un brouillon complet. Le dépôt de garantie prend par défaut le maximum légal. */
export function draftToLeaseInput(draft: Pick<Draft, 'data'>): LeaseInput {
  const parsed = leaseInputSchema.safeParse(draft.data)
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Le bail est incomplet.', parsed.error.issues)
  }
  const lease = parsed.data
  if (lease.rent.depositCents === undefined) lease.rent.depositCents = maxDepositCents(lease.type, lease.rent.rentCents)
  lease.tenants = lease.tenants.map((t) => ({ ...t, email: t.email || undefined }))
  return lease
}

/**
 * Transforme le brouillon en logement + bail + document + rappels, rattachés au compte.
 * Idempotent : un brouillon déjà transformé renvoie le bail existant.
 */
export async function createLeaseFromDraft(user: User, draftId: string): Promise<{ lease: Lease; created: boolean }> {
  const draft = await prisma.draft.findUnique({ where: { id: draftId } })
  if (!draft) throw new HttpError(404, 'Brouillon introuvable.')
  if (draft.leaseId) {
    const existing = await prisma.lease.findUnique({ where: { id: draft.leaseId } })
    if (existing && existing.userId === user.id) return { lease: existing, created: false }
    throw new HttpError(403, 'Ce bail appartient à un autre compte.')
  }

  const input = draftToLeaseInput(draft)
  const imported = input.source === 'import'
  if (!imported && !input.irl) {
    const irl = await latestIrl()
    if (irl) input.irl = { quarter: irl.quarter, value: irl.value }
  }

  const start = parseIsoDate(input.rent.startDate)
  const months = durationMonths(input.type)
  const pdf = imported ? null : await renderLeasePdf(input)

  const lease = await prisma.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        userId: user.id,
        address: input.property.address,
        postalCode: input.property.postalCode,
        city: input.property.city,
        inseeCode: input.property.inseeCode,
        banId: input.property.banId,
        surface: input.property.surface,
        rooms: input.property.rooms,
        dpeClass: input.property.dpeClass,
        dpeNumber: input.property.dpeNumber,
      },
    })
    const lease = await tx.lease.create({
      data: {
        userId: user.id,
        propertyId: property.id,
        type: input.type,
        status: imported ? 'IMPORTED' : 'ACTIVE',
        startDate: start,
        durationMonths: months,
        endDate: leaseEndDate(start, months),
        rentCents: input.rent.rentCents,
        chargesCents: input.rent.chargesCents,
        depositCents: input.rent.depositCents!,
        paymentDay: input.rent.paymentDay,
        data: input,
      },
    })
    if (imported) {
      if (!draft.importFile) throw new HttpError(400, 'Le document importé est introuvable.')
      const file = Buffer.from(draft.importFile)
      await tx.document.create({
        data: {
          userId: user.id,
          leaseId: lease.id,
          kind: 'LEASE_IMPORTED',
          title: draft.importName ?? 'Bail signé',
          mimeType: draft.importMime ?? 'application/pdf',
          sha256: sha256(file),
          sizeBytes: file.length,
          file,
        },
      })
    } else {
      await tx.document.create({
        data: {
          userId: user.id,
          leaseId: lease.id,
          kind: 'LEASE',
          title: `Bail — ${input.property.address}`,
          mimeType: 'application/pdf',
          sha256: sha256(pdf!),
          sizeBytes: pdf!.length,
          snapshot: input,
        },
      })
    }
    await tx.draft.update({ where: { id: draft.id }, data: { leaseId: lease.id, userId: user.id, importFile: null } })
    if (!user.firstName && !user.lastName) {
      await tx.user.update({
        where: { id: user.id },
        data: { firstName: input.landlord.firstName, lastName: input.landlord.lastName },
      })
    }
    return lease
  })

  await ensureReminders(lease)

  if (pdf) {
    const mail = layout({
      title: 'Votre bail est prêt.',
      paragraphs: [
        `Bonjour ${input.landlord.firstName},`,
        `Vous trouverez en pièce jointe le bail du logement situé ${input.property.address}, qui prend effet le ${formatDateFr(start)}.`,
        'Imprimez-le en autant d’exemplaires que de signataires. Chacun signe en faisant précéder sa signature de la mention « lu et approuvé ».',
        'Votre bail reste disponible à tout moment dans votre espace Bailio.',
      ],
      cta: { label: 'Ouvrir mon espace', url: `${env.CLIENT_URL}/connexion` },
    })
    sendEmail({
      to: user.email,
      subject: 'Votre bail est prêt',
      ...mail,
      attachments: [{ filename: 'bail.pdf', content: pdf }],
    }).catch((err) => console.error('[email] bail', err))
  }

  return { lease, created: true }
}
