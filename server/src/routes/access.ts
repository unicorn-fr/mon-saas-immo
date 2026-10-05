import { Router } from 'express'
import { z } from 'zod'
import type { User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { hashToken, newToken } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { landlordName } from '../pdf/labels.js'
import { propertyName, readProfile, readProperty, readTenant, tenantName } from '../services/contract.js'
import { ACCESS_ROLES, ROLE_LABEL, type AccessRole } from '../domain/access.js'

/**
 * Accès partagés. Le propriétaire invite une personne par email (rôle et logements) ; elle accepte en se connectant
 * avec cette adresse, puis travaille dans l'espace du propriétaire, limitée à ces logements (services/session.ts).
 */
const router = Router()
router.use(['/access', '/spaces'], requireUser)


const INVITE_DAYS = 14
export const ownerLabel = (u: Pick<User, 'email' | 'profile' | 'firstName' | 'lastName'>) => landlordName(readProfile(u)) || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email

const ROLE_TEXT: Record<AccessRole, string> = {
  ASSOCIATE: 'voir et gérer ces logements avec vous (baux, loyers, courriers, dépenses), sans pouvoir supprimer',
  ACCOUNTANT: 'consulter ces logements, les loyers, les dépenses et l’aide à la déclaration, sans rien modifier',
  CONTRACTOR: 'voir l’adresse du logement, le contact du locataire et les interventions, rien d’autre',
}

// ── Côté propriétaire ────────────────────────────────────────────────────────

router.get('/access', async (req, res) => {
  const rows = await prisma.access.findMany({ where: { ownerId: req.user!.id, revokedAt: null }, orderBy: { createdAt: 'desc' } })
  const props = await prisma.property.findMany({ where: { userId: req.user!.id }, select: { id: true, label: true, address: true } })
  res.json({
    success: true,
    data: rows.map((a) => ({
      id: a.id,
      email: a.email,
      role: a.role,
      roleLabel: ROLE_LABEL[a.role as AccessRole],
      status: a.acceptedAt ? 'ACTIVE' : a.inviteExpiresAt && a.inviteExpiresAt < new Date() ? 'EXPIRED' : 'PENDING',
      properties: a.propertyIds.map((id) => props.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => ({ id: p.id, name: propertyName(p) })),
      createdAt: a.createdAt.toISOString(),
    })),
  })
})

router.post('/access', async (req, res) => {
  const owner = req.user!
  const body = z.object({ email: z.email('Email invalide').transform((e) => e.trim().toLowerCase()), role: z.enum(ACCESS_ROLES), propertyIds: z.array(z.string().uuid()).min(1, 'Choisissez au moins un logement.').max(200) }).parse(req.body)
  if (body.email === owner.email.toLowerCase()) throw new HttpError(400, 'C’est votre propre adresse.')
  if (body.role === 'CONTRACTOR' && body.propertyIds.length !== 1) throw new HttpError(400, 'Un intervenant a accès à un seul logement.')
  const owned = await prisma.property.findMany({ where: { userId: owner.id, id: { in: body.propertyIds } }, select: { id: true, label: true, address: true } })
  if (owned.length !== new Set(body.propertyIds).size) throw new HttpError(404, 'Logement introuvable.')
  const token = newToken()
  const access = await prisma.access.create({ data: { ownerId: owner.id, email: body.email, role: body.role, propertyIds: owned.map((p) => p.id), inviteTokenHash: hashToken(token), inviteExpiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) } })
  const who = ownerLabel(owner)
  const url = `${env.CLIENT_URL}/invitation/${encodeURIComponent(token)}`
  const mail = layout({
    title: `${who} vous invite sur Bailio.`,
    paragraphs: [
      `Vous pourrez ${ROLE_TEXT[body.role]}.`,
      `Logement${owned.length > 1 ? 's' : ''} : ${owned.map(propertyName).join(', ')}.`,
      `Cette invitation est valable ${INVITE_DAYS} jours. Vous vous connecterez avec cette adresse, sans mot de passe.`,
      'Si vous ne connaissez pas cette personne, ignorez cet email.',
    ],
    cta: { label: 'Voir l’invitation', url },
  })
  await sendEmail({ to: body.email, subject: `${who} vous invite sur Bailio`, ...mail })
  res.status(201).json({ success: true, data: { id: access.id } })
})

/** Retirer un accès : il cesse aussitôt (la ligne est gardée, marquée retirée). */
router.delete('/access/:id', async (req, res) => {
  const r = await prisma.access.updateMany({ where: { id: String(req.params.id), ownerId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date(), inviteTokenHash: null } })
  if (!r.count) throw new HttpError(404, 'Accès introuvable.')
  res.json({ success: true, data: { revoked: true } })
})

// ── Côté invité ──────────────────────────────────────────────────────────────

/** Espaces partagés avec la personne connectée. */
router.get('/spaces', async (req, res) => {
  const rows = await prisma.access.findMany({ where: { memberId: req.user!.id, acceptedAt: { not: null }, revokedAt: null }, include: { owner: true }, orderBy: { acceptedAt: 'desc' } })
  res.json({ success: true, data: rows.map((a) => ({ id: a.id, role: a.role, roleLabel: ROLE_LABEL[a.role as AccessRole], ownerName: ownerLabel(a.owner), count: a.propertyIds.length })) })
})

router.post('/spaces/:id/leave', async (req, res) => {
  const r = await prisma.access.updateMany({ where: { id: String(req.params.id), memberId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } })
  if (!r.count) throw new HttpError(404, 'Accès introuvable.')
  res.json({ success: true, data: { left: true } })
})

async function invitation(token: string) {
  const a = await prisma.access.findUnique({ where: { inviteTokenHash: hashToken(token) }, include: { owner: true } })
  if (!a || a.revokedAt || a.acceptedAt || !a.inviteExpiresAt || a.inviteExpiresAt < new Date()) throw new HttpError(404, 'Cette invitation n’est plus valable. Demandez-en une nouvelle à la personne qui vous a invité.')
  return a
}

/** Page publique de l'invitation : qui invite, pour quoi faire, sur quels logements. */
router.get('/invitations/:token', async (req, res) => {
  const a = await invitation(String(req.params.token))
  const props = await prisma.property.findMany({ where: { userId: a.ownerId, id: { in: a.propertyIds } }, select: { label: true, address: true } })
  res.json({ success: true, data: { ownerName: ownerLabel(a.owner), email: a.email, role: a.role, roleLabel: ROLE_LABEL[a.role as AccessRole], roleText: ROLE_TEXT[a.role as AccessRole], properties: props.map(propertyName) } })
})

/** Accepter : déjà connecté avec la bonne adresse, l'accès est ouvert tout de suite. */
router.post('/invitations/:token/accept', requireUser, async (req, res) => {
  const a = await invitation(String(req.params.token))
  if (req.user!.email.toLowerCase() !== a.email.toLowerCase()) throw new HttpError(403, `Cette invitation est adressée à ${a.email}. Connectez-vous avec cette adresse.`)
  await acceptAccess(a.id, req.user!.id)
  res.json({ success: true, data: { spaceId: a.id, role: a.role, ownerName: ownerLabel(a.owner) } })
})

// ── Vue de l'intervenant : le strict nécessaire (RGPD, données minimales) ──────

router.get('/shared/view', requireUser, async (req, res) => {
  if (!req.access) throw new HttpError(404, 'Introuvable.')
  // Requêtes limitées par le filtre de l'espace partagé : seuls les logements de l'accès sont visibles.
  const properties = await prisma.property.findMany({ where: { userId: req.user!.id }, include: { leases: { where: { status: { in: ['ACTIVE', 'IMPORTED'] } }, orderBy: { startDate: 'desc' }, take: 1 }, interventions: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 30 } } })
  const tenantIds = properties.flatMap((p) => p.leases[0]?.tenantIds ?? [])
  const tenants = tenantIds.length ? await prisma.tenant.findMany({ where: { userId: req.user!.id, id: { in: tenantIds } } }) : []
  const owner = req.user!
  res.json({
    success: true,
    data: {
      ownerName: ownerLabel(owner),
      ownerPhone: readProfile(owner).phone ?? null,
      properties: properties.map((p) => {
        const f = readProperty(p)
        return {
          id: p.id,
          name: propertyName(p),
          address: p.address,
          access: [f.building, f.floorDoor].filter(Boolean).join(', ') || null,
          tenants: (p.leases[0]?.tenantIds ?? []).map((id) => tenants.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t)).map((t) => { const d = readTenant(t); return { name: tenantName(d), phone: d.phone ?? null } }),
          interventions: p.interventions.map((i) => ({ id: i.id, title: i.title, description: i.description, status: i.status, date: i.date ? i.date.toISOString().slice(0, 10) : null })),
        }
      }),
    },
  })
})

export async function acceptAccess(accessId: string, memberId: string) {
  await prisma.access.update({ where: { id: accessId }, data: { memberId, acceptedAt: new Date(), inviteTokenHash: null } })
}

/** Pas encore connecté : lien de connexion envoyé à l'adresse invitée ; l'invitation est acceptée au clic. */
export async function invitationEmailFor(token: string) {
  const a = await invitation(token)
  return { accessId: a.id, email: a.email }
}

export default router
