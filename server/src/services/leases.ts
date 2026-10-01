import type { Draft, Lease, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import {
  durationMonths,
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
import { ensureReminders } from './reminders.js'
import { upgradeLegacyLeases } from './upgrade.js'

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
        // Bail du tunnel : en préparation, complété puis signé dans l'espace (mentions obligatoires vérifiées).
        status: imported ? 'IMPORTED' : 'DRAFT',
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
  // Les réponses du tunnel alimentent tout de suite les fiches du compte (profil, logement, locataires).
  await upgradeLegacyLeases(user)

  if (!imported) {
    const mail = layout({
      title: 'Votre bail est presque prêt.',
      paragraphs: [
        `Bonjour ${input.landlord.firstName},`,
        `Le bail du logement situé ${input.property.address} est enregistré dans votre espace.`,
        'Il reste quelques mentions que la loi impose (diagnostics, chauffage, équipements…). Bailio vous les demande une par une, puis vous le faites signer en ligne ou sur papier.',
      ],
      cta: { label: 'Compléter mon bail', url: `${env.CLIENT_URL}/espace/baux/${lease.id}` },
    })
    sendEmail({ to: user.email, subject: 'Votre bail est presque prêt', ...mail }).catch((err) => console.error('[email] bail', err))
  }

  return { lease, created: true }
}
