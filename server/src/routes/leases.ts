import { Router } from 'express'
import { rememberRent, rentPatch } from '../services/rent.js'
import { z } from 'zod'
import type { Lease, Prisma, Property, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { irlOneYearLater, latestIrl, quarterLabel } from '../lib/irl.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { contractFor, liveContract, leaseKindOf, leaseOwned, propertyName, readProfile, readProperty, readTenant, readTerms, tenantName } from '../services/contract.js'
import { leaseTermsSchema, type ContractInput, type LeaseKind, type LeaseTerms } from '../domain/contract.js'
import { termsCompletion } from '../domain/completion.js'
import { essential, leaseMissing, partiesMissing, type Missing } from '../domain/checklist.js'
import { formatDateFr, monthYearFr, parseIsoDate } from '../domain/lease.js'
import {
  allowedChargesModes,
  contractEndDate,
  diagnosticsFor,
  energyRentalWarning,
  firstPayment,
  forbiddenClauseReasons,
  landlordNoticeMonthsFor,
  leaseDurationMonths,
  maxDepositFor,
  renewalLabel,
  rentControlLikely,
  rentRevisionAllowed,
} from '../domain/rules.js'
import { buildJourney, type JourneyInput } from '../domain/journeys.js'
import { toTrash } from '../services/trash.js'
import { LETTER_TITLES, THIRD_PARTY_LETTERS, letterContent, letterSchema, revisedRent, tenantNoticeEnd, tenantNoticeMonths, type LetterInput, type LetterType } from '../domain/letters.js'
import { renderContractPdf } from '../pdf/contract.js'
import { renderGuaranteePdf } from '../pdf/guarantee.js'
import { renderReceiptPdf, type ReceiptInput } from '../pdf/receipt.js'
import { renderLetterPdf } from '../pdf/letter.js'
import { annexesLabel, landlordAddress, landlordName, personName, propertyAddress } from '../pdf/labels.js'
import { fileSlug, iso, mergeFile, saveGeneratedDocument, sendPdf } from './helpers.js'
import { leaseTenantLabel, rentStatus } from './space.js'

/**
 * Baux de l'espace : préparation (conditions reprises des fiches, règles appliquées), signature,
 * versions, loyers reçus (quittance ou reçu), avis d'échéance, courriers, envoi par email.
 */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/leases'], requireUser)

type LeaseWithProperty = Lease & { property: Property }

const TYPE_OF: Record<LeaseKind, 'UNFURNISHED' | 'FURNISHED'> = { VIDE: 'UNFURNISHED', MEUBLE: 'FURNISHED', ETUDIANT: 'FURNISHED', MOBILITE: 'FURNISHED' }

/** Colonnes du bail (dates, montants) recalculées à partir des conditions et des règles. */
function leaseColumns(terms: LeaseTerms, user: User) {
  const kind = terms.kind ?? 'VIDE'
  const months = leaseDurationMonths(kind, readProfile(user), terms)
  const startIso = terms.startDate ?? new Date().toISOString().slice(0, 10)
  const rent = terms.rentCents ?? 0
  return {
    type: TYPE_OF[kind],
    startDate: parseIsoDate(startIso),
    durationMonths: months,
    endDate: contractEndDate(startIso, months),
    rentCents: rent,
    chargesCents: terms.chargesCents ?? 0,
    depositCents: kind === 'MOBILITE' ? 0 : terms.depositCents ?? maxDepositFor(kind, rent),
    paymentDay: terms.paymentDay ?? 5,
  }
}

/** Règles calculées pour l'écran de préparation du bail (« Calculé par Bailio »). */
function computed(c: ContractInput) {
  const t = c.terms
  const kind = t.kind ?? 'VIDE'
  const months = leaseDurationMonths(kind, c.landlord, t)
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const dpe = c.property.diagnostics?.dpe?.class
  return {
    kind,
    durationMonths: months,
    endDate: end ? iso(end) : null,
    renewal: renewalLabel(kind, c.landlord),
    noticeMonths: landlordNoticeMonthsFor(kind),
    maxDepositCents: t.rentCents ? maxDepositFor(kind, t.rentCents) : null,
    chargesModes: allowedChargesModes(kind, Boolean(t.colocation) || c.tenants.length > 1),
    revisionAllowed: kind !== 'MOBILITE' && rentRevisionAllowed(dpe),
    energyWarning: energyRentalWarning(dpe),
    rentControlLikely: rentControlLikely(c.property.inseeCode),
    firstPayment: t.startDate && t.rentCents !== undefined && t.rentCents !== null ? firstPayment(t.startDate, t.rentCents, t.chargesCents ?? 0) : null,
    clauseWarnings: (t.clauses?.custom ?? []).map((cl) => ({ clause: cl, reasons: forbiddenClauseReasons(cl) })).filter((x) => x.reasons.length),
    diagnostics: diagnosticsFor(c.property),
    reducedAllowed: c.landlord.kind !== 'COMPANY' && !(c.landlord.kind === 'SCI' && !c.landlord.sciFamily),
  }
}

/** Chaque information manquante, avec le lien vers la fiche et l'étape où la compléter. */
function withLinks(missing: Missing[], lease: LeaseWithProperty) {
  return missing.map((m) => {
    const tenantId = m.tenant !== undefined ? lease.tenantIds[m.tenant] ?? lease.tenantIds[0] : lease.tenantIds[0]
    const coTenant = m.tenant !== undefined && m.tenant >= lease.tenantIds.length
    const to = {
      LANDLORD: `/espace/compte/profil#${m.section}`,
      PROPERTY: `/espace/logements/${lease.propertyId}/fiche#${m.section}`,
      TENANT: tenantId ? `/espace/locataires/${tenantId}/fiche#${coTenant ? 'colocation' : m.section}` : `/espace/baux/${lease.id}/contrat#parties`,
      GUARANTOR: tenantId ? `/espace/locataires/${tenantId}/caution#${m.section}` : `/espace/baux/${lease.id}/contrat#parties`,
      TERMS: `/espace/baux/${lease.id}/contrat#${m.section}`,
    }[m.where]
    return { key: m.key, label: m.label, where: m.where, to, level: m.level ?? 'ESSENTIAL' }
  })
}

/** Refuse un document tant qu'une mention obligatoire manque, en disant laquelle. */
export function assertComplete(missing: Missing[]) {
  if (!missing.length) return
  const list = missing.slice(0, 4).map((m) => m.label.charAt(0).toLowerCase() + m.label.slice(1))
  throw new HttpError(400, `Pour que ce document soit valable, il manque : ${list.join(' ; ')}${missing.length > 4 ? ` (et ${missing.length - 4} autre${missing.length > 5 ? 's' : ''})` : ''}.`)
}

/**
 * Bail créé par l'ancien tunnel public (avant la vérification des mentions obligatoires) : il a été enregistré
 * comme signé alors qu'il était peut-être incomplet. Tant qu'aucun loyer ni état des lieux n'est enregistré,
 * le propriétaire peut le repasser en préparation pour le compléter et le faire signer.
 */
async function reopenInfo(lease: LeaseWithProperty, c: ContractInput, paymentCount: number, inventorySigned: boolean) {
  const legacy = (lease.data as { legacy?: { source?: string } }).legacy
  if (lease.status !== 'ACTIVE' || !legacy || legacy.source === 'import') return null
  const missing = essential(leaseMissing(c)).length
  if (!missing) return null
  const esign = await prisma.signatureRequest.findFirst({ where: { leaseId: lease.id, status: 'COMPLETED' }, select: { id: true } })
  return { missing, allowed: paymentCount === 0 && !inventorySigned && !esign }
}

async function leaseView(user: User, lease: LeaseWithProperty) {
  const c = await contractFor(user, lease)
  const [payments, documents, inventories, reminders, tenants] = await Promise.all([
    prisma.payment.findMany({ where: { leaseId: lease.id }, orderBy: { period: 'desc' } }),
    prisma.document.findMany({ where: { leaseId: lease.id }, select: { id: true, kind: true, title: true, version: true, period: true, createdAt: true, origin: true, mimeType: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inventory.findMany({ where: { leaseId: lease.id }, orderBy: { createdAt: 'asc' } }),
    prisma.reminder.findMany({ where: { leaseId: lease.id, status: 'TODO' }, orderBy: { dueDate: 'asc' }, take: 8 }),
    prisma.tenant.findMany({ where: { userId: user.id, id: { in: lease.tenantIds } } }),
  ])
  const terms = readTerms(lease)
  const guarantors = tenants.filter((t) => readTenant(t).guarantee === 'CAUTION' && readTenant(t).guarantor).map((t) => ({ tenantId: t.id, name: personName(readTenant(t).guarantor!) }))
  const leaseDoc = documents.find((d) => d.kind === 'LEASE' || d.kind === 'LEASE_IMPORTED')
  const entry = inventories.find((i) => i.kind === 'ENTRY')
  const dpeDone = Boolean(c.property.diagnostics?.dpe?.class)
  const annexes = [
    { key: 'notice', label: 'Notice d’information (arrêté du 29 mai 2015)', status: 'Incluse à la fin du bail', done: true },
    ...diagnosticsFor(c.property)
      .filter((d) => d.required && d.annexed)
      .map((d) => {
        const has = d.key === 'dpe' ? dpeDone : Boolean(c.property.diagnostics?.[d.key]?.date || c.property.diagnostics?.[d.key]?.fileId)
        return { key: d.key, label: d.label, status: has ? 'Joint' : 'À ajouter à la fiche du logement', done: has }
      }),
    ...guarantors.map((g) => ({ key: `caution-${g.tenantId}`, label: `Acte de caution de ${g.name}`, status: 'Prêt', done: true })),
    { key: 'inventory', label: 'État des lieux d’entrée', status: entry?.status === 'SIGNED' ? 'Fait' : `À faire le ${c.terms.startDate ? formatDateFr(parseIsoDate(c.terms.startDate)) : 'jour de l’entrée'}`, done: entry?.status === 'SIGNED' },
    ...(c.property.legalRegime === 'COPRO' ? [{ key: 'copro', label: 'Extraits du règlement de copropriété', status: c.property.copro?.extractsProvided ? 'Joint' : 'À ajouter', done: Boolean(c.property.copro?.extractsProvided) }] : []),
    { key: 'repairs', label: 'Liste des réparations locatives (facultative)', status: 'Prête à joindre', done: true },
    { key: 'charges', label: 'Liste des charges récupérables (facultative)', status: 'Prête à joindre', done: true },
    ...(leaseKindOf(lease) !== 'VIDE' ? [{ key: 'furniture', label: 'Inventaire du mobilier', status: c.property.furniture?.inventory?.length ? 'Joint' : 'Avec l’état des lieux', done: Boolean(c.property.furniture?.inventory?.length) }] : []),
  ]
  const completion = termsCompletion(terms, { hasLandlord: Boolean(c.landlord.lastName || c.landlord.company?.name), hasProperty: Boolean(c.property.address && c.property.surface), hasTenant: c.tenants.length > 0, tense: Boolean(terms.zone?.tense) })
  const checklist = lease.status === 'DRAFT' ? withLinks(leaseMissing(c), lease) : []
  const esignPending = Boolean(await prisma.signatureRequest.findFirst({ where: { leaseId: lease.id, status: 'PENDING' }, select: { id: true } }))
  const reopen = await reopenInfo(lease, c, payments.length, inventories.some((i) => i.status === 'SIGNED'))
  return {
    id: lease.id,
    status: lease.status,
    ready: lease.status === 'DRAFT' && completion.percent === 100 && !checklist.some((m) => m.level === 'ESSENTIAL'),
    /** Ce que Bailio a retenu des courriers (fin du préavis, remise des clés) pour pré-remplir la suite. */
    facts: { tenantNotice: (lease.data as { tenantNotice?: unknown }).tenantNotice ?? null, keysDate: (lease.data as { keysDate?: string }).keysDate ?? null, eReceiptConsent: (lease.data as { tenantLink?: { eReceiptConsent?: { email: string; at: string } | null } }).tenantLink?.eReceiptConsent ?? null },
    checklist,
    esignPending,
    reopen,
    dirty: Boolean((lease.data as { dirty?: boolean }).dirty),
    /** Le propriétaire a relu le bail avant de l'envoyer à la signature. */
    checkedAt: (lease.data as { checkedAt?: string }).checkedAt ?? null,
    signedAt: iso(lease.signedAt),
    kind: leaseKindOf(lease),
    property: { id: lease.property.id, name: propertyName(lease.property), address: propertyAddress(c.property) },
    tenantIds: lease.tenantIds,
    tenantName: c.tenants.map((t) => personName(t, false)).join(' et '),
    tenants: tenants.map((t) => ({ id: t.id, name: tenantName(readTenant(t)), email: readTenant(t).email ?? null })),
    guarantors,
    terms,
    contract: { landlord: c.landlord, property: c.property, tenants: c.tenants, guarantors: c.guarantors },
    computed: computed(c),
    completion,
    columns: { startDate: iso(lease.startDate), endDate: iso(lease.endDate), rentCents: lease.rentCents, chargesCents: lease.chargesCents, depositCents: lease.depositCents, paymentDay: lease.paymentDay },
    rent: rentStatus(lease, payments),
    annexes,
    payments: payments.map((p) => ({ period: p.period, amountCents: p.amountCents, receivedAt: iso(p.receivedAt), full: p.amountCents >= lease.rentCents + lease.chargesCents })),
    documents,
    leaseDocumentId: leaseDoc?.id ?? null,
    inventories: inventories.map((i) => ({ id: i.id, kind: i.kind, status: i.status, date: iso(i.date) })),
    reminders: reminders.map((r) => ({ id: r.id, type: r.type, dueDate: iso(r.dueDate) })),
  }
}

// ── Liste et création ────────────────────────────────────────────────────────

router.get('/leases', async (req, res) => {
  const user = req.user!
  const leases = await prisma.lease.findMany({ where: { userId: user.id }, include: { property: true, payments: true }, orderBy: { startDate: 'desc' } })
  const tenants = await prisma.tenant.findMany({ where: { userId: user.id } })
  const names = Object.fromEntries(tenants.map((t) => [t.id, tenantName(readTenant(t))]))
  res.json({
    success: true,
    data: leases.map((l) => ({
      id: l.id,
      status: l.status,
      kind: leaseKindOf(l),
      property: { id: l.property.id, name: propertyName(l.property) },
      tenantName: leaseTenantLabel(l, names),
      startDate: iso(l.startDate),
      endDate: iso(l.endDate),
      rentCents: l.rentCents,
      chargesCents: l.chargesCents,
      rent: rentStatus(l, l.payments),
    })),
  })
})

const createSchema = z.object({
  propertyId: z.uuid(),
  tenantIds: z.array(z.uuid()).min(1).max(6),
  terms: leaseTermsSchema.optional(),
})

router.post('/leases', async (req, res) => {
  const user = req.user!
  const body = createSchema.parse(req.body)
  const property = await prisma.property.findFirst({ where: { id: body.propertyId, userId: user.id }, include: { leases: { orderBy: { endDate: 'desc' } } } })
  if (!property) throw new HttpError(404, 'Logement introuvable.')
  const tenants = await prisma.tenant.findMany({ where: { userId: user.id, id: { in: body.tenantIds } } })
  if (tenants.length !== body.tenantIds.length) throw new HttpError(404, 'Locataire introuvable.')

  const file = readProperty(property)
  const profile = readProfile(user)
  const first = readTenant(tenants[0])
  const colocation = tenants.length > 1 || first.living === 'COLOCATION'
  const kind: LeaseKind = body.terms?.kind ?? (file.furnished ? 'MEUBLE' : 'VIDE')
  const irl = await latestIrl()
  const dpe = file.diagnostics?.dpe?.class
  // Locataire précédent : dernier bail de ce logement terminé depuis moins de 18 mois.
  const prev = property.leases.find((l) => l.status !== 'DRAFT' && l.endDate.getTime() > Date.now() - 548 * 86_400_000)
  // Date d'entrée : celle choisie, sinon la date de disponibilité indiquée dans l'annonce.
  const startDate = body.terms?.startDate ?? file.ad?.availableFrom ?? undefined
  // Loyer, charges et dépôt : repris de la fiche du logement (saisis une seule fois), dans les limites de la loi.
  const rent = file.rent ?? {}
  const modes = allowedChargesModes(kind, colocation)
  const rentCents = rent.rentCents ?? undefined
  const defaults: LeaseTerms = {
    kind,
    colocation,
    chargesMode: rent.chargesMode && modes.includes(rent.chargesMode) ? rent.chargesMode : kind === 'MOBILITE' ? 'FORFAIT' : 'PROVISION',
    rentCents,
    chargesCents: rent.chargesCents ?? undefined,
    depositCents: kind === 'MOBILITE' ? 0 : rent.depositCents != null && rentCents ? Math.min(rent.depositCents, maxDepositFor(kind, rentCents)) : (rent.depositCents ?? undefined),
    paymentDay: rent.paymentDay ?? 5,
    paymentTerm: 'ADVANCE',
    paymentMethod: 'TRANSFER',
    zone: { tense: file.market?.tense ?? (rentControlLikely(file.inseeCode) ? true : undefined), control: rentControlLikely(file.inseeCode) },
    previous: prev ? { rentedWithin18Months: true, lastRentCents: prev.rentCents, lastRevisionDate: undefined, lastPaymentDate: undefined } : undefined,
    revision: { enabled: kind !== 'MOBILITE' && rentRevisionAllowed(dpe), date: startDate ? startDate.slice(5) : undefined, irlQuarter: irl?.quarter, irlValue: irl?.value },
    clauses: { resolutoire: true, solidarite: colocation },
    signature: { place: profile.city ?? undefined, mode: 'PAPER' },
  }
  const terms = leaseTermsSchema.parse(mergeFile({ ...defaults, ...(startDate ? { startDate } : {}) } as Record<string, unknown>, (body.terms ?? {}) as Record<string, unknown>))
  const lease = await prisma.lease.create({
    data: { userId: user.id, propertyId: property.id, status: 'DRAFT', tenantIds: body.tenantIds, data: { terms }, ...leaseColumns(terms, user) },
  })
  // Le locataire est rattaché au logement.
  await prisma.tenant.updateMany({ where: { id: { in: body.tenantIds }, propertyId: null }, data: { propertyId: property.id } })
  res.status(201).json({ success: true, data: { id: lease.id } })
})

router.get('/leases/:id', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  res.json({ success: true, data: await leaseView(req.user!, lease) })
})

// « J'ai relu le bail » : étape du parcours de mise en location, avant l'envoi pour signature.
router.post('/leases/:id/checked', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  await patchLeaseData(lease.id, () => ({ checkedAt: new Date().toISOString() }))
  res.json({ success: true, data: await leaseView(req.user!, await leaseOwned(req.user!.id, lease.id)) })
})

router.put('/leases/:id/terms', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  // Signature en ligne en cours : le contrat présenté aux signataires est figé.
  if (await prisma.signatureRequest.findFirst({ where: { leaseId: lease.id, status: 'PENDING' }, select: { id: true } })) {
    throw new HttpError(409, 'Une signature en ligne est en cours : le bail ne peut plus être modifié. Annulez-la depuis la page du bail pour le modifier.')
  }
  if (lease.status === 'IMPORTED') throw new HttpError(409, 'Ce bail a été importé : ses conditions figurent dans le document signé.')
  if (lease.status === 'ENDED') throw new HttpError(409, 'Ce bail est terminé.')
  const body = leaseTermsSchema.partial().extend({ tenantIds: z.array(z.uuid()).min(1).max(6).optional() }).parse(req.body)
  const { tenantIds, ...patch } = body
  const terms = leaseTermsSchema.parse(mergeFile(readTerms(lease) as Record<string, unknown>, patch as Record<string, unknown>))
  const kind = terms.kind ?? 'VIDE'
  if (terms.chargesMode && !allowedChargesModes(kind, Boolean(terms.colocation)).includes(terms.chargesMode)) {
    throw new HttpError(400, kind === 'MOBILITE' ? 'En bail mobilité, les charges sont forcément forfaitaires.' : 'En location vide, le forfait de charges n’est permis qu’en colocation.')
  }
  if (terms.depositCents && terms.rentCents && terms.depositCents > maxDepositFor(kind, terms.rentCents)) {
    throw new HttpError(400, kind === 'MOBILITE' ? 'Aucun dépôt de garantie en bail mobilité.' : `Le dépôt de garantie ne peut pas dépasser ${kind === 'VIDE' ? 'un mois' : 'deux mois'} de loyer hors charges.`)
  }
  if (tenantIds) {
    const count = await prisma.tenant.count({ where: { userId: user.id, id: { in: tenantIds } } })
    if (count !== tenantIds.length) throw new HttpError(404, 'Locataire introuvable.')
  }
  const data = lease.data as Record<string, unknown>
  // Bail en préparation : le loyer saisi ici devient celui de la fiche du logement.
  if (lease.status === 'DRAFT') await rememberRent(lease.propertyId, rentPatch(patch))
  await prisma.lease.update({
    where: { id: lease.id },
    data: {
      data: { ...data, terms, ...(lease.status === 'ACTIVE' ? { dirty: true } : {}) },
      ...(tenantIds ? { tenantIds } : {}),
      ...(lease.status === 'DRAFT' ? leaseColumns(terms, user) : { rentCents: terms.rentCents ?? lease.rentCents, chargesCents: terms.chargesCents ?? lease.chargesCents, paymentDay: terms.paymentDay ?? lease.paymentDay }),
    },
  })
  const fresh = await leaseOwned(user.id, lease.id)
  res.json({ success: true, data: await leaseView(user, fresh) })
})

// Ancien bail du tunnel, enregistré comme signé sans l'être : retour en préparation.
router.post('/leases/:id/reopen', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const view = await leaseView(user, lease)
  if (!view.reopen) throw new HttpError(409, 'Ce bail ne peut pas repasser en préparation.')
  if (!view.reopen.allowed) throw new HttpError(409, 'Des loyers ou un état des lieux sont déjà enregistrés pour ce bail : il est considéré comme signé. Pour le modifier, créez un avenant.')
  const data = lease.data as Record<string, unknown>
  await prisma.$transaction([
    prisma.lease.update({ where: { id: lease.id }, data: { status: 'DRAFT', signedAt: null, data: { ...data, snapshot: undefined, dirty: false, reopenedAt: new Date().toISOString() } as unknown as Prisma.InputJsonObject } }),
    prisma.reminder.deleteMany({ where: { leaseId: lease.id, status: 'TODO' } }),
  ])
  res.json({ success: true, data: await leaseView(user, await leaseOwned(user.id, lease.id)) })
})

router.delete('/leases/:id', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  if (lease.status !== 'DRAFT') throw new HttpError(409, 'Seul un bail en préparation peut être supprimé.')
  const { property: _p, ...row } = lease
  await toTrash(req.user!.id, 'LEASE', `Bail en préparation : ${propertyName(lease.property)}`, row)
  await prisma.lease.delete({ where: { id: lease.id } })
  res.json({ success: true, data: { deleted: true } })
})

// ── PDF du bail et de l'acte de caution ──────────────────────────────────────

export async function currentContract(user: User, lease: LeaseWithProperty): Promise<ContractInput> {
  const c = await contractFor(user, lease)
  const last = await prisma.document.findFirst({ where: { leaseId: lease.id, kind: 'LEASE' }, orderBy: { version: 'desc' } })
  const version = lease.status === 'DRAFT' || (lease.data as { dirty?: boolean }).dirty ? (last?.version ?? 0) + 1 : last?.version ?? 1
  return { ...c, version: { number: version, date: (last && lease.status !== 'DRAFT' ? last.createdAt : new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) } }
}

router.get('/leases/:id/lease.pdf', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const download = req.query.download === '1'
  if (lease.status === 'IMPORTED') {
    const doc = await prisma.document.findFirst({ where: { leaseId: lease.id, kind: 'LEASE_IMPORTED' }, orderBy: { createdAt: 'desc' } })
    if (!doc?.file) throw new HttpError(404, 'Document introuvable.')
    res.setHeader('Content-Type', doc.mimeType)
    return res.send(Buffer.from(doc.file))
  }
  // Bail signé électroniquement : le fichier signé (signatures et certificat), à l'identique.
  if (lease.status === 'ACTIVE' && !(lease.data as { dirty?: boolean }).dirty) {
    const signedDoc = await prisma.document.findFirst({ where: { leaseId: lease.id, kind: 'LEASE' }, orderBy: { version: 'desc' } })
    if (signedDoc?.file) return sendPdf(res, Buffer.from(signedDoc.file), `bail-signe.pdf`, download)
  }
  const c = await currentContract(user, lease)
  const pdf = await renderContractPdf(c)
  sendPdf(res, pdf, `bail-${fileSlug(c.tenants.map((t) => t.lastName).join('-'))}.pdf`, download)
})

router.get('/leases/:id/guarantee/:tenantId.pdf', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const tenant = await prisma.tenant.findFirst({ where: { id: String(req.params.tenantId), userId: user.id } })
  const g = tenant ? readTenant(tenant).guarantor : null
  if (!g) throw new HttpError(404, 'Aucun garant pour ce locataire.')
  const pdf = await renderGuaranteePdf(await contractFor(user, lease), g)
  sendPdf(res, pdf, `acte-de-caution-${fileSlug(g.lastName ?? 'garant')}.pdf`, req.query.download === '1')
})

/**
 * Le bail en cours est figé (version conservée), les loyers et échéances démarrent.
 * Signature électronique : les PDF signés (signatures et certificat) sont conservés tels quels.
 */
export async function activateLease(user: User, lease: LeaseWithProperty, c: ContractInput, signed?: { leasePdf: Buffer; guarantees: Map<number, Buffer> }) {
  const view = await leaseView(user, lease)
  const pdf = signed?.leasePdf ?? (await renderContractPdf(c))
  const { version: _v, ...snapshot } = c
  await saveGeneratedDocument({ userId: user.id, kind: 'LEASE', title: `Bail ${view.kind === 'VIDE' ? 'vide' : 'meublé'}, ${view.tenantName}${signed ? ', signé électroniquement' : ''}`, pdf, snapshot: c, keepFile: Boolean(signed), leaseId: lease.id, propertyId: lease.propertyId })
  // Actes de caution : un document par garant.
  for (const g of view.guarantors) {
    const tenant = await prisma.tenant.findFirst({ where: { id: g.tenantId, userId: user.id } })
    const gf = tenant ? readTenant(tenant).guarantor : null
    if (!gf) continue
    const index = c.guarantors.findIndex((x) => x.lastName === gf.lastName && x.firstNames === gf.firstNames)
    const signedPdf = index >= 0 ? signed?.guarantees.get(index) : undefined
    await saveGeneratedDocument({ userId: user.id, kind: 'GUARANTEE', title: `Acte de caution de ${g.name}${signedPdf ? ', signé électroniquement' : ''}`, pdf: signedPdf ?? (await renderGuaranteePdf(c, gf)), snapshot: { contract: c, guarantor: gf }, keepFile: Boolean(signedPdf), leaseId: lease.id, propertyId: lease.propertyId, tenantId: g.tenantId })
  }
  const data = lease.data as Record<string, unknown>
  const updated = await prisma.lease.update({
    where: { id: lease.id },
    data: { status: 'ACTIVE', signedAt: lease.signedAt ?? new Date(), data: { ...data, terms: data.terms, snapshot, dirty: false } as unknown as Prisma.InputJsonObject, ...leaseColumns(readTerms(lease), user) },
  })
  await ensureReminders(updated)
}

/** Vérifications avant signature : fiches complètes et mentions obligatoires présentes. */
export async function assertReadyToSign(user: User, lease: LeaseWithProperty): Promise<ContractInput> {
  if (lease.status === 'IMPORTED' || lease.status === 'ENDED') throw new HttpError(409, 'Ce bail ne peut plus être modifié.')
  const view = await leaseView(user, lease)
  if (lease.status === 'DRAFT' && view.completion.percent < 100) {
    const missing = view.completion.steps.filter((s) => s.applicable && !s.done).map((s) => s.label.toLowerCase())
    throw new HttpError(400, `Il manque encore : ${missing.join(', ')}.`)
  }
  const c = await currentContract(user, lease)
  // Seules les informations primordiales bloquent : les autres laissent une ligne à compléter dans le bail.
  if (lease.status === 'DRAFT') assertComplete(essential(leaseMissing(c)))
  return c
}

// Signature sur papier : le propriétaire indique que le bail est signé.
router.post('/leases/:id/sign', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const c = await assertReadyToSign(user, lease)
  await activateLease(user, lease, c)
  res.json({ success: true, data: await leaseView(user, await leaseOwned(user.id, lease.id)) })
})

// Départ du locataire : fin du bail, nouvelle adresse pour la restitution du dépôt.
router.post('/leases/:id/end', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const body = z.object({ keysDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), newAddress: z.string().trim().max(300).optional() }).parse(req.body)
  if (lease.status === 'DRAFT') throw new HttpError(409, 'Ce bail n’a pas encore été signé.')
  await prisma.$transaction([
    prisma.lease.update({ where: { id: lease.id }, data: { status: 'ENDED', endDate: parseIsoDate(body.keysDate), tenantCode: null, data: { ...(lease.data as object), keysDate: body.keysDate } } }),
    prisma.reminder.deleteMany({ where: { leaseId: lease.id, status: 'TODO' } }),
  ])
  if (body.newAddress) {
    for (const id of lease.tenantIds) {
      const t = await prisma.tenant.findFirst({ where: { id, userId: user.id } })
      if (t) await prisma.tenant.update({ where: { id }, data: { data: { ...readTenant(t), newAddress: body.newAddress } } })
    }
  }
  res.json({ success: true, data: await leaseView(user, await leaseOwned(user.id, lease.id)) })
})

// Envoi du bail aux locataires (et garants) par email, en pièce jointe.
router.post('/leases/:id/send', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const c = await currentContract(user, lease)
  const to = c.tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
  if (!to.length) throw new HttpError(400, 'Ajoutez l’email du locataire dans sa fiche pour lui envoyer le bail.')
  const pdf = await renderContractPdf(c)
  const landlord = personName({ firstNames: c.landlord.firstNames, lastName: c.landlord.lastName }, false) || 'Votre bailleur'
  const mail = layout({
    title: 'Votre bail de location.',
    paragraphs: [
      'Bonjour,',
      `${landlord} vous adresse le bail du logement situé ${propertyAddress(c.property)}, en pièce jointe.`,
      'Relisez-le avant la signature. Pour toute question, répondez directement à votre bailleur.',
    ],
  })
  for (const email of to) {
    await sendEmail({ to: email, subject: 'Votre bail de location', ...mail, replyTo: user.email, attachments: [{ filename: 'bail.pdf', content: pdf }] })
  }
  res.json({ success: true, data: { sentTo: to } })
})

// ── Loyers reçus, quittances, reçus, avis d'échéance ─────────────────────────

const periodRe = /^\d{4}-(0[1-9]|1[0-2])$/

function receiptInput(c: ContractInput, lease: Lease, period: string, kind: ReceiptInput['kind'], payment?: { amountCents: number; receivedAt: Date } | null): ReceiptInput {
  const [y, m] = period.split('-').map(Number)
  const chargesMode = c.terms.chargesMode ?? 'PROVISION'
  return {
    kind,
    landlord: c.landlord,
    tenants: c.tenants,
    propertyAddress: propertyAddress(c.property),
    year: y,
    month: m,
    rentCents: lease.rentCents,
    chargesCents: lease.chargesCents,
    chargesLabel: chargesMode === 'FORFAIT' ? 'Forfait de charges' : 'Provision pour charges',
    paidCents: payment?.amountCents,
    paidOn: payment?.receivedAt ?? null,
    dueDate: new Date(Date.UTC(y, m - 1, lease.paymentDay)),
    place: c.landlord.city,
    iban: c.landlord.payment?.iban,
  }
}

router.post('/leases/:id/payments', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  if (lease.status === 'DRAFT') throw new HttpError(409, 'Le bail n’est pas encore signé.')
  const now = new Date()
  const body = z
    .object({
      period: z.string().regex(periodRe).default(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`),
      amountCents: z.number().int().positive().max(10_000_000).optional(),
      receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })
    .parse(req.body ?? {})
  const due = lease.rentCents + lease.chargesCents
  const amount = body.amountCents ?? due
  const receivedAt = body.receivedAt ? parseIsoDate(body.receivedAt) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const payment = await prisma.payment.upsert({
    where: { leaseId_period: { leaseId: lease.id, period: body.period } },
    create: { userId: user.id, leaseId: lease.id, period: body.period, amountCents: amount, receivedAt },
    update: { amountCents: amount, receivedAt },
  })
  const [y, m] = body.period.split('-').map(Number)
  if (amount >= due) {
    await prisma.reminder.updateMany({
      where: { leaseId: lease.id, type: 'RENT_RECEIPT', dueDate: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) } },
      data: { status: 'DONE', doneAt: new Date() },
    })
  }
  // Quittance (paiement complet) ou reçu (paiement partiel), rangé dans les documents.
  const c = await liveContract(user, lease)
  const kind = amount >= due ? 'RECEIPT' : 'PARTIAL'
  const missing = partiesMissing(c)
  if (missing.length) {
    // Le loyer est enregistré ; la quittance attend les mentions obligatoires (nom et adresse du bailleur…).
    return res.json({ success: true, data: { period: payment.period, amountCents: payment.amountCents, receivedAt: iso(payment.receivedAt), full: amount >= due, documentId: null, missing: withLinks(missing, lease) } })
  }
  const input = receiptInput(c, lease, body.period, kind, payment)
  const pdf = await renderReceiptPdf(input)
  const names = c.tenants.map((t) => personName(t, false)).join(' et ')
  await prisma.document.deleteMany({ where: { leaseId: lease.id, period: body.period, kind: { in: ['RECEIPT', 'PARTIAL_RECEIPT'] } } })
  const doc = await saveGeneratedDocument({ userId: user.id, kind: kind === 'RECEIPT' ? 'RECEIPT' : 'PARTIAL_RECEIPT', title: `${kind === 'RECEIPT' ? 'Quittance' : 'Reçu'} de ${monthYearFr(y, m)}, ${names}`, pdf, snapshot: input, leaseId: lease.id, propertyId: lease.propertyId, period: body.period })
  res.json({ success: true, data: { period: payment.period, amountCents: payment.amountCents, receivedAt: iso(payment.receivedAt), full: amount >= due, documentId: doc.id } })
})

router.delete('/leases/:id/payments/:period', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const period = z.string().regex(periodRe).parse(req.params.period)
  await prisma.payment.deleteMany({ where: { leaseId: lease.id, period } })
  await prisma.document.deleteMany({ where: { leaseId: lease.id, period, kind: { in: ['RECEIPT', 'PARTIAL_RECEIPT'] } } })
  const [y, m] = period.split('-').map(Number)
  await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'RENT_RECEIPT', dueDate: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) } }, data: { status: 'TODO', doneAt: null } })
  res.json({ success: true, data: { deleted: true } })
})

// Quittance (ou reçu) d'un mois, à la volée ; avis d'échéance.
router.get('/leases/:id/receipts/:period.pdf', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const period = z.string().regex(periodRe).parse(req.params.period)
  const payment = await prisma.payment.findUnique({ where: { leaseId_period: { leaseId: lease.id, period } } })
  const due = lease.rentCents + lease.chargesCents
  const kind = !payment || payment.amountCents >= due ? 'RECEIPT' : 'PARTIAL'
  const c = await liveContract(user, lease)
  assertComplete(partiesMissing(c))
  const pdf = await renderReceiptPdf(receiptInput(c, lease, period, kind, payment))
  sendPdf(res, pdf, `${kind === 'RECEIPT' ? 'quittance' : 'recu'}-${period}.pdf`, req.query.download === '1')
})

// Ancienne adresse des quittances (année/mois), conservée pour les liens déjà envoyés.
router.get('/leases/:id/receipts/:year/:month.pdf', async (req, res) => {
  const { year, month } = z.object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(1).max(12) }).parse(req.params)
  res.redirect(307, `../../receipts/${year}-${String(month).padStart(2, '0')}.pdf${req.query.download === '1' ? '?download=1' : ''}`)
})

router.get('/leases/:id/notice/:period.pdf', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const period = z.string().regex(periodRe).parse(req.params.period)
  const c = await liveContract(user, lease)
  assertComplete(partiesMissing(c))
  const pdf = await renderReceiptPdf(receiptInput(c, lease, period, 'NOTICE'))
  sendPdf(res, pdf, `avis-echeance-${period}.pdf`, req.query.download === '1')
})

// Envoi de la quittance au locataire par email.
router.post('/leases/:id/receipts/:period/send', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const period = z.string().regex(periodRe).parse(req.params.period)
  const payment = await prisma.payment.findUnique({ where: { leaseId_period: { leaseId: lease.id, period } } })
  if (!payment) throw new HttpError(400, 'Enregistrez d’abord le loyer reçu pour ce mois.')
  const c = await liveContract(user, lease)
  assertComplete(partiesMissing(c))
  // Accord du locataire pour la quittance par email (art. 21) : son adresse sert à l'envoi ; un accord retiré bloque l'envoi.
  const link = (lease.data as { tenantLink?: { eReceiptConsent?: { email: string } | null; eReceiptWithdrawnAt?: string | null } }).tenantLink
  if (link?.eReceiptWithdrawnAt && !link.eReceiptConsent) throw new HttpError(400, 'Votre locataire a retiré son accord pour recevoir ses quittances par email : remettez-la-lui sur papier.')
  const to = [...new Set([...c.tenants.map((t) => t.email), link?.eReceiptConsent?.email].filter((e): e is string => Boolean(e)))]
  if (!to.length) throw new HttpError(400, 'Ajoutez l’email du locataire dans sa fiche pour lui envoyer sa quittance.')
  const full = payment.amountCents >= lease.rentCents + lease.chargesCents
  const pdf = await renderReceiptPdf(receiptInput(c, lease, period, full ? 'RECEIPT' : 'PARTIAL', payment))
  const [y, m] = period.split('-').map(Number)
  const what = full ? 'quittance' : 'reçu'
  const mail = layout({ title: `Votre ${what} de ${monthYearFr(y, m)}.`, paragraphs: ['Bonjour,', `Vous trouverez en pièce jointe votre ${what} de loyer de ${monthYearFr(y, m)}.`, 'Bonne journée.'] })
  for (const email of to) await sendEmail({ to: email, subject: `Votre ${what} de loyer, ${monthYearFr(y, m)}`, ...mail, replyTo: user.email, attachments: [{ filename: `${what}-${period}.pdf`, content: pdf }] })
  res.json({ success: true, data: { sentTo: to } })
})

// ── Courriers ────────────────────────────────────────────────────────────────

async function recipientOf(user: User, lease: LeaseWithProperty, c: ContractInput) {
  const ended = lease.status === 'ENDED'
  const t = c.tenants[0]
  return {
    name: c.tenants.map((x) => personName(x)).join(' et ') || 'Locataire',
    address: ended && t && 'newAddress' in t && t.newAddress ? String(t.newAddress) : propertyAddress(c.property),
  }
}

/**
 * Ce que Bailio retient d'un bail au fil des courriers : rien n'est à ressaisir d'un document à l'autre
 * (congé reçu → fin du préavis, reçu du dépôt, entretien de la chaudière, brouillons en cours).
 */
interface LeaseFacts {
  keysDate?: string
  tenantNotice?: { receivedDate: string; reduced: boolean; reducedReason: string | null; endDate: string }
  landlordNotice?: { reason: string; leaseEnd: string; date: string }
  depositReceivedAt?: string
  depositMethod?: string | null
  boilerServiceDate?: string | null
  smokeInstalledDate?: string | null
  ownerChange?: { newOwnerName: string; effectiveDate: string }
  letterDrafts?: Partial<Record<LetterType, { letter: Record<string, unknown>; savedAt: string }>>
}
const leaseFacts = (lease: Lease): LeaseFacts => (lease.data ?? {}) as LeaseFacts

/** Mise à jour d'une partie des données du bail, relues juste avant l'écriture. */
export async function patchLeaseData(leaseId: string, patch: (facts: LeaseFacts & Record<string, unknown>) => Record<string, unknown>) {
  const fresh = await prisma.lease.findUniqueOrThrow({ where: { id: leaseId } })
  const data = (fresh.data ?? {}) as LeaseFacts & Record<string, unknown>
  await prisma.lease.update({ where: { id: leaseId }, data: { data: { ...data, ...patch(data) } as Prisma.InputJsonObject } })
}

/** Destinataire : le locataire, sauf l'appel à la caution (le garant). */
function recipientFor(letter: { type: string; recipient?: unknown }, tenant: { name: string; address: string }, c: ContractInput) {
  const type = letter.type
  if (isThirdParty(type)) {
    const r = (letter.recipient ?? {}) as { name?: string; address?: string }
    return { name: r.name ?? '', address: r.address ?? '' }
  }
  if (type !== 'GUARANTOR_CALL') return tenant
  const g = c.guarantors[0]
  return g ? { name: personName(g), address: g.address ?? '' } : { name: 'Garant', address: '' }
}

const isThirdParty = (type: string) => (THIRD_PARTY_LETTERS as readonly string[]).includes(type)

const contactRecipient = (c: { id: string; name: string; address: string | null; email: string | null } | null) => ({ name: c?.name ?? '', address: c?.address ?? '', email: c?.email ?? '', contactId: c?.id ?? null })

/** Assureur ou artisan saisi dans un courrier : il rejoint le carnet (ou ses coordonnées y sont complétées). */
async function rememberRecipient(userId: string, lease: Lease, letter: LetterInput) {
  if (letter.type !== 'INSURANCE_CLAIM' && letter.type !== 'CONTRACTOR_CLAIM') return
  const r = letter.recipient
  const kind = letter.type === 'INSURANCE_CLAIM' ? 'INSURER' : 'ARTISAN'
  const existing = r.contactId ? await prisma.contact.findFirst({ where: { id: r.contactId, userId } }) : await prisma.contact.findFirst({ where: { userId, kind, name: { equals: r.name, mode: 'insensitive' } } })
  const contact = existing
    ? await prisma.contact.update({ where: { id: existing.id }, data: { address: existing.address || r.address || null, email: existing.email || r.email || null } })
    : await prisma.contact.create({ data: { userId, kind, name: r.name, address: r.address || null, email: r.email || null } })
  if (letter.type === 'INSURANCE_CLAIM') {
    const p = await prisma.property.findUniqueOrThrow({ where: { id: lease.propertyId } })
    const file = readProperty(p)
    await prisma.property.update({ where: { id: p.id }, data: { data: { ...file, ownerInsurance: { policyNumber: letter.policyNumber || file.ownerInsurance?.policyNumber || null, contactId: contact.id } } } })
  }
}

/** Mois échus non payés (ou payés partiellement), du plus ancien au plus récent. */
async function unpaid(lease: Lease) {
  const payments = await prisma.payment.findMany({ where: { leaseId: lease.id } })
  const due = lease.rentCents + lease.chargesCents
  const out: { period: string; missing: number }[] = []
  const now = new Date()
  for (let i = 12; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, lease.paymentDay))
    if (d < lease.startDate || d > now) continue
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const paid = payments.find((p) => p.period === period)?.amountCents ?? 0
    if (paid < due) out.push({ period, missing: due - paid })
  }
  return out
}

const monthLabel = (period: string) => {
  const [y, m] = period.split('-').map(Number)
  return monthYearFr(y, m)
}

router.get('/leases/:id/letters/defaults/:type', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const type = z.enum(Object.keys(LETTER_TITLES) as [string, ...string[]]).parse(req.params.type)
  const terms = readTerms(lease)
  const c = await liveContract(user, lease)
  const facts = leaseFacts(lease)
  let data: Record<string, unknown> = { type }
  let note: string | null = null
  if (type === 'REVISION') {
    const ref = terms.revision?.irlQuarter && terms.revision.irlValue ? { quarter: terms.revision.irlQuarter, value: terms.revision.irlValue } : null
    const next = ref ? await irlOneYearLater(ref.quarter) : null
    const now = new Date()
    const anniversary = new Date(Date.UTC(now.getUTCFullYear(), lease.startDate.getUTCMonth(), lease.startDate.getUTCDate()))
    if (anniversary < now) anniversary.setUTCFullYear(anniversary.getUTCFullYear() + (anniversary.getTime() < now.getTime() - 300 * 86_400_000 ? 1 : 0))
    if (!rentRevisionAllowed(c.property.diagnostics?.dpe?.class)) note = 'Logement classé F ou G : la loi interdit la révision du loyer.'
    else if (!ref) note = 'Le trimestre de référence de l’IRL n’est pas indiqué dans le bail.'
    else if (!next) note = `L’INSEE n’a pas encore publié l’IRL du ${quarterLabel(`${Number(ref.quarter.slice(0, 4)) + 1}${ref.quarter.slice(4)}`)}.`
    data = { type, oldRentCents: lease.rentCents, irlRef: ref, irlNew: next ? { quarter: next.quarter, value: next.value } : null, effectiveDate: iso(anniversary) }
  } else if (type === 'INSURANCE') {
    const tenant = lease.tenantIds[0] ? await prisma.tenant.findFirst({ where: { id: lease.tenantIds[0] } }) : null
    data = { type, expiresAt: tenant ? readTenant(tenant).insurance?.expiresAt ?? null : null }
  } else if (type === 'REMINDER' || type === 'FORMAL_NOTICE') {
    const u = await unpaid(lease)
    data = { type, amountCents: u.reduce((a, x) => a + x.missing, 0), periods: u.map((x) => monthLabel(x.period)), dueDate: u[0] ? iso(new Date(Date.UTC(Number(u[0].period.slice(0, 4)), Number(u[0].period.slice(5)) - 1, lease.paymentDay))) : null, delayDays: 8, guarantorInformed: true }
    if (!u.length) note = 'Aucun loyer impayé n’est enregistré pour ce bail.'
  } else if (type === 'NOTICE_TO_LEAVE') {
    let end = lease.endDate
    while (end < new Date()) end = contractEndDate(iso(new Date(end.getTime() + 86_400_000))!, lease.durationMonths)
    data = { type, reason: 'SALE', leaseEnd: iso(end) }
    const notice = landlordNoticeMonthsFor(leaseKindOf(lease))
    if (!notice) note = 'Ce bail prend fin tout seul à son terme : aucun congé n’est nécessaire.'
    else
      note = `À envoyer au plus tard le ${formatDateFr(new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - notice, end.getUTCDate())))} (${notice} mois avant la fin), à chaque locataire, par lettre recommandée avec avis de réception, commissaire de justice ou remise en main propre contre signature. ${
        leaseKindOf(lease) === 'VIDE'
          ? 'La notice officielle est jointe automatiquement au congé pour vendre ou pour reprendre.'
          : 'En meublé, le congé pour vendre ne donne pas au locataire de droit de priorité pour acheter.'
      } Attention : un locataire de plus de 65 ans aux revenus modestes ne peut recevoir un congé que si vous lui proposez un relogement proche, sauf si vous avez vous-même plus de 65 ans ou des revenus modestes (article ${leaseKindOf(lease) === 'VIDE' ? '15, III' : '25-8, III'}).`
  } else if (type === 'CHARGES') {
    const year = new Date().getUTCFullYear() - 1
    const payments = await prisma.payment.findMany({ where: { leaseId: lease.id, period: { startsWith: String(year) } } })
    const provisions = payments.reduce((a, p) => a + Math.min(lease.chargesCents, Math.max(0, p.amountCents - lease.rentCents)), 0)
    const expenses = await prisma.expense.findMany({ where: { userId: user.id, propertyId: lease.propertyId, recoverableCents: { gt: 0 }, date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } })
    data = { type, year, provisionsCents: provisions, lines: expenses.map((e) => ({ label: e.description || e.vendor, amountCents: e.recoverableCents })) }
  } else if (type === 'TENANT_NOTICE') {
    const tense = Boolean(terms.zone?.tense)
    data = { type, receivedDate: iso(new Date()), reduced: leaseKindOf(lease) === 'VIDE' && tense, reducedReason: tense ? 'logement situé en zone tendue' : null }
    note =
      leaseKindOf(lease) === 'VIDE'
        ? `Logement vide : préavis de trois mois, réduit à un mois si le logement est en zone tendue${tense ? ' (c’est le cas ici)' : ''} ou si le locataire justifie d’un premier emploi, d’une mutation, d’une perte d’emploi, d’un nouvel emploi après une perte d’emploi, de son état de santé, du RSA ou de l’AAH, ou d’un logement social attribué.`
        : 'Location meublée : le préavis du locataire est toujours d’un mois.'
  } else if (type === 'DEPOSIT_RETURN') {
    const keys = facts.keysDate ?? facts.tenantNotice?.endDate ?? iso(lease.endDate)
    const u = await unpaid(lease)
    data = { type, depositCents: lease.depositCents, keysDate: keys, conform: true, deductions: [], unpaidCents: u.reduce((a, x) => a + x.missing, 0), chargesBalanceCents: 0, heldCents: 0 }
    if (u.length) note = `Loyers non réglés repris automatiquement : ${u.map((x) => monthLabel(x.period)).join(', ')}.`
  } else if (type === 'GUARANTOR_CALL') {
    const u = await unpaid(lease)
    data = { type, amountCents: u.reduce((a, x) => a + x.missing, 0), periods: u.map((x) => monthLabel(x.period)), delayDays: 15, commandDate: null }
    note = !c.guarantors.length ? 'Aucun garant n’est enregistré pour ce bail : ajoutez-le dans la fiche du locataire.' : !u.length ? 'Aucun loyer impayé n’est enregistré pour ce bail.' : null
  } else if (type === 'NUISANCE') {
    data = { type, facts: '', dates: '', delayDays: 8 }
  } else if (type === 'DAMAGE_REPAIR') {
    data = { type, items: [{ label: '' }], delayDays: 30 }
  } else if (type === 'BOILER') {
    data = { type, lastServiceDate: facts.boilerServiceDate ?? c.property.heating?.lastMaintenance ?? null }
    const h = c.property.heating
    if (h?.mode !== 'INDIVIDUAL' || !['GAS', 'FUEL', 'WOOD'].includes(String(h.energy))) note = 'D’après la fiche du logement, il n’y a pas de chaudière individuelle au gaz, au fioul ou au bois : ce courrier n’est peut-être pas nécessaire.'
  } else if (type === 'SHORT_NOTICE_PROOF') {
    data = { type, receivedDate: facts.tenantNotice?.receivedDate ?? iso(new Date()), reason: facts.tenantNotice?.reducedReason ?? '' }
    if (!facts.tenantNotice) note = 'Enregistrez d’abord l’accusé de réception du congé du locataire : la date et le motif seront repris ici.'
  } else if (type === 'RENT_CERTIFICATE') {
    const u = await unpaid(lease)
    data = { type, since: iso(lease.startDate), rentCents: lease.rentCents, chargesCents: lease.chargesCents, upToDate: u.length === 0 }
  } else if (type === 'DEPOSIT_RECEIPT') {
    data = { type, amountCents: lease.depositCents, receivedDate: facts.depositReceivedAt ?? iso(lease.startDate), method: facts.depositMethod ?? '' }
  } else if (type === 'OWNER_CHANGE') {
    data = { type, newOwnerName: '', newOwnerAddress: '', effectiveDate: iso(new Date()), paymentInfo: '' }
  } else if (type === 'SMOKE_DETECTOR') {
    data = { type, count: Math.max(1, c.property.smokeDetectors ?? 1), installedDate: facts.smokeInstalledDate ?? null }
  } else if (type === 'INSURANCE_CLAIM') {
    // Assureur du logement : repris du carnet, avec le numéro de contrat retenu la dernière fois.
    const own = readProperty(lease.property).ownerInsurance
    const insurer = (own?.contactId ? await prisma.contact.findFirst({ where: { id: own.contactId, userId: user.id } }) : null) ?? (await prisma.contact.findFirst({ where: { userId: user.id, kind: 'INSURER' }, orderBy: { createdAt: 'asc' } }))
    data = { type, recipient: contactRecipient(insurer), policyNumber: own?.policyNumber ?? '', eventDate: iso(new Date()), cause: 'WATER', circumstances: '', damages: '' }
  } else if (type === 'CONTRACTOR_CLAIM') {
    // Dernière intervention terminée dans le logement : artisan, travaux et date déjà connus.
    const last = await prisma.intervention.findFirst({ where: { propertyId: lease.propertyId, status: 'DONE', contactId: { not: null } }, include: { contact: true }, orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }] })
    data = { type, recipient: contactRecipient(last?.contact ?? null), work: last?.title ?? '', workDate: last?.date ? iso(last.date) : null, invoiceRef: '', problems: '', delayDays: 15 }
  } else if (type === 'E_RECEIPT_CONSENT') {
    data = { type, email: c.tenants.find((t) => t.email)?.email ?? '' }
    if (!c.tenants.some((t) => t.email)) note = 'Ajoutez l’email du locataire dans sa fiche : il sera repris ici.'
  }
  // Ce que le propriétaire a déjà saisi pour ce courrier et pas encore enregistré est repris tel quel.
  const draft = facts.letterDrafts?.[type as LetterType]
  if (draft?.letter) data = { ...data, ...draft.letter, type }
  res.json({ success: true, data: { title: LETTER_TITLES[type as keyof typeof LETTER_TITLES], letter: data, note, recipient: recipientFor(data as { type: string }, await recipientOf(user, lease, c), c), draftSavedAt: draft?.savedAt ?? null } })
})

/** Désignation des locaux loués, comme au bail : type, surface, pièces, annexes. */
function premisesLabel(p: ContractInput['property']): string {
  const type = p.habitat === 'INDIVIDUAL' ? 'maison individuelle' : 'logement dans un immeuble collectif'
  const parts = [`${type} situé${p.habitat === 'INDIVIDUAL' ? 'e' : ''} ${propertyAddress(p)}`, p.surface ? `d’une surface habitable de ${p.surface} m²` : '', p.rooms ? `comprenant ${p.rooms} pièce${p.rooms > 1 ? 's' : ''} principale${p.rooms > 1 ? 's' : ''}` : '']
  const annexes = annexesLabel(p)
  return parts.filter(Boolean).join(', ') + (annexes ? `, avec ${annexes.charAt(0).toLowerCase()}${annexes.slice(1)}` : '')
}

async function letterPdf(user: User, lease: LeaseWithProperty, letter: LetterInput) {
  const c = await liveContract(user, lease)
  assertComplete(partiesMissing(c))
  const recipient = await recipientOf(user, lease, c)
  const kind = leaseKindOf(lease)
  if (letter.type === 'NOTICE_TO_LEAVE' && !landlordNoticeMonthsFor(kind)) throw new HttpError(400, 'Ce bail prend fin tout seul à son terme : aucun congé n’est nécessaire.')
  if (letter.type === 'NOTICE_TO_LEAVE' && letter.reason === 'SALE' && kind === 'VIDE' && !letter.priceCents) throw new HttpError(400, 'Indiquez le prix de vente : sans lui, le congé pour vendre est nul.')
  if (letter.type === 'NOTICE_TO_LEAVE' && letter.reason === 'RESUMPTION' && (!letter.beneficiary?.name || !letter.beneficiary.address || !letter.beneficiary.link)) throw new HttpError(400, 'Indiquez le nom, l’adresse et le lien de parenté du bénéficiaire de la reprise : ces mentions sont obligatoires.')
  if (letter.type === 'NOTICE_TO_LEAVE' && letter.reason !== 'SALE' && !letter.justification?.trim()) throw new HttpError(400, letter.reason === 'RESUMPTION' ? 'Expliquez en une phrase pourquoi la reprise est réelle et sérieuse : cette mention est obligatoire.' : 'Indiquez le motif légitime et sérieux du congé.')
  if (letter.type === 'GUARANTOR_CALL' && !c.guarantors.length) throw new HttpError(400, 'Aucun garant n’est enregistré pour ce bail : ajoutez-le dans la fiche du locataire.')
  const g = c.guarantors[0]
  const content = letterContent(letter, {
    tenantName: recipient.name,
    propertyAddress: propertyAddress(c.property),
    guarantorName: g ? personName(g) : null,
    guarantor: g ? { name: personName(g), solidaire: g.engagement !== 'SIMPLE' } : null,
    kind,
    premises: premisesLabel(c.property),
    landlordName: landlordName(c.landlord),
    landlordAddress: landlordAddress(c.landlord),
    leaseStart: c.terms.startDate ?? iso(lease.startDate),
  })
  const input = { content, landlord: c.landlord, recipient: recipientFor(letter, recipient, c), date: new Date() }
  return { pdf: await renderLetterPdf(input), content, input }
}

/** Les faits utiles d'un courrier enregistré sont gardés avec le bail, et son brouillon est effacé. */
async function rememberLetter(lease: Lease, letter: LetterInput) {
  const today = iso(new Date())!
  await patchLeaseData(lease.id, (f) => {
    const { [letter.type]: _done, ...drafts } = f.letterDrafts ?? {}
    const patch: Record<string, unknown> = { letterDrafts: drafts }
    if (letter.type === 'TENANT_NOTICE') {
      const months = tenantNoticeMonths(leaseKindOf(lease), letter.reduced)
      patch.tenantNotice = { receivedDate: letter.receivedDate, reduced: letter.reduced, reducedReason: letter.reducedReason ?? null, endDate: iso(tenantNoticeEnd(letter.receivedDate, months)) }
    }
    if (letter.type === 'NOTICE_TO_LEAVE') patch.landlordNotice = { reason: letter.reason, leaseEnd: letter.leaseEnd, date: today }
    if (letter.type === 'DEPOSIT_RECEIPT') Object.assign(patch, { depositReceivedAt: letter.receivedDate, depositMethod: letter.method ?? null })
    if (letter.type === 'BOILER' && letter.lastServiceDate) patch.boilerServiceDate = letter.lastServiceDate
    if (letter.type === 'SMOKE_DETECTOR' && letter.installedDate) patch.smokeInstalledDate = letter.installedDate
    if (letter.type === 'OWNER_CHANGE') patch.ownerChange = { newOwnerName: letter.newOwnerName, effectiveDate: letter.effectiveDate }
    if (letter.type === 'DEPOSIT_RETURN') patch.keysDate = f.keysDate ?? letter.keysDate
    return patch
  })
  // Dernier entretien de la chaudière : aussi dans la fiche du logement, pour le prochain bail.
  if (letter.type === 'BOILER' && letter.lastServiceDate) {
    const p = await prisma.property.findUniqueOrThrow({ where: { id: lease.propertyId } })
    const file = readProperty(p)
    await prisma.property.update({ where: { id: p.id }, data: { data: { ...file, heating: { ...(file.heating ?? {}), lastMaintenance: letter.lastServiceDate } } } })
  }
}

// Brouillon d'un courrier : chaque saisie est gardée, même sans enregistrer le PDF.
router.put('/leases/:id/letters/draft/:type', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const type = z.enum(Object.keys(LETTER_TITLES) as [LetterType, ...LetterType[]]).parse(req.params.type)
  const letter = z.record(z.string(), z.unknown()).parse(req.body)
  if (JSON.stringify(letter).length > 20_000) throw new HttpError(413, 'Ce courrier est trop long.')
  const savedAt = new Date().toISOString()
  await patchLeaseData(lease.id, (f) => ({ letterDrafts: { ...(f.letterDrafts ?? {}), [type]: { letter: { ...letter, type }, savedAt } } }))
  res.json({ success: true, data: { savedAt } })
})

// « Repartir des valeurs proposées par Bailio »
router.delete('/leases/:id/letters/draft/:type', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const type = String(req.params.type)
  await patchLeaseData(lease.id, (f) => {
    const { [type as LetterType]: _gone, ...drafts } = f.letterDrafts ?? {}
    return { letterDrafts: drafts }
  })
  res.json({ success: true, data: { cleared: true } })
})

router.post('/leases/:id/letters/preview', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const letter = letterSchema.parse(req.body)
  const { pdf } = await letterPdf(user, lease, letter)
  sendPdf(res, pdf, 'courrier.pdf', false)
})

router.post('/leases/:id/letters', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const letter = letterSchema.parse(req.body)
  const { pdf, content, input } = await letterPdf(user, lease, letter)
  const doc = await saveGeneratedDocument({ userId: user.id, kind: 'LETTER', title: LETTER_TITLES[letter.type], pdf, snapshot: { letter: input, input: letter }, leaseId: lease.id, propertyId: lease.propertyId, meta: { type: letter.type } })
  await rememberLetter(lease, letter)
  await rememberRecipient(user.id, lease, letter)
  // Révision : le nouveau loyer s'applique au bail et devient la nouvelle référence.
  if (letter.type === 'REVISION') {
    const next = revisedRent(letter.oldRentCents, letter.irlRef.value, letter.irlNew.value)
    const terms = readTerms(lease)
    await prisma.lease.update({ where: { id: lease.id }, data: { rentCents: next } })
    await patchLeaseData(lease.id, () => ({ terms: { ...terms, rentCents: next, revision: { ...terms.revision, irlQuarter: letter.irlNew.quarter, irlValue: letter.irlNew.value } } }))
    await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'RENT_REVISION', status: 'TODO', dueDate: { lte: new Date(Date.now() + 60 * 86_400_000) } }, data: { status: 'DONE', doneAt: new Date() } })
  }
  if (letter.type === 'INSURANCE') {
    await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'INSURANCE', status: 'TODO', dueDate: { lte: new Date(Date.now() + 60 * 86_400_000) } }, data: { status: 'DONE', doneAt: new Date() } })
  }
  res.status(201).json({ success: true, data: { documentId: doc.id, computed: content.computed ?? [] } })
})

// ── Parcours guidés « Que se passe-t-il ? » ─────────────────────────────────

const journeyKind = z.enum(['DEPARTURE', 'UNPAID', 'SALE', 'PROBLEM'])

/** Prochaine fin du bail, à partir d'aujourd'hui (le bail a pu être reconduit). */
function nextLeaseEnd(lease: Lease): Date {
  let end = lease.endDate
  while (end < new Date()) end = contractEndDate(iso(new Date(end.getTime() + 86_400_000))!, lease.durationMonths)
  return end
}

router.get('/leases/:id/journeys/:kind', async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const kind = journeyKind.parse(req.params.kind)
  const c = await liveContract(user, lease)
  const [docs, inventories, u] = await Promise.all([
    prisma.document.findMany({ where: { leaseId: lease.id, kind: 'LETTER' }, select: { meta: true, createdAt: true } }),
    prisma.inventory.findMany({ where: { leaseId: lease.id }, select: { kind: true, status: true, date: true } }),
    unpaid(lease),
  ])
  const journey = buildJourney(kind, {
    today: iso(new Date())!,
    leaseKind: leaseKindOf(lease),
    status: lease.status as JourneyInput['status'],
    leaseEnd: iso(nextLeaseEnd(lease))!,
    noticeMonths: landlordNoticeMonthsFor(leaseKindOf(lease)),
    unpaid: u.map((x) => ({ ...x, label: monthLabel(x.period) })),
    letters: docs.flatMap((d) => ((d.meta as { type?: string } | null)?.type ? [{ type: (d.meta as { type: string }).type, date: iso(d.createdAt)! }] : [])),
    inventories: inventories.map((i) => ({ kind: i.kind as 'ENTRY' | 'EXIT', status: i.status as 'DRAFT' | 'SIGNED', date: i.date ? iso(i.date) : null })),
    hasGuarantor: c.guarantors.length > 0,
    facts: leaseFacts(lease) as JourneyInput['facts'],
  })
  res.json({ success: true, data: { ...journey, lease: { id: lease.id, tenantName: c.tenants.map((t) => personName(t)).join(' et '), address: propertyAddress(c.property) } } })
})

// Étape faite en dehors de Bailio (commandement de payer…), cochée par le propriétaire.
router.post('/leases/:id/journeys/:kind/:step/done', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const key = `${journeyKind.parse(req.params.kind)}.${z.string().regex(/^[a-z]{2,20}$/).parse(req.params.step)}`
  const { done } = z.object({ done: z.boolean() }).parse(req.body)
  await patchLeaseData(lease.id, (f) => {
    const all = { ...((f.journeyDone as Record<string, string> | undefined) ?? {}) }
    if (done) all[key] = iso(new Date())!
    else delete all[key]
    return { journeyDone: all }
  })
  res.json({ success: true, data: { done } })
})

export { leaseView }
export default router

/** Envoi d'un courrier déjà enregistré (utilisé par la route documents). */
export async function emailLetter(user: User, leaseId: string, pdf: Buffer, subject: string, letter?: { type?: string; recipient?: { email?: string | null } } | null) {
  const lease = await leaseOwned(user.id, leaseId)
  const c = await liveContract(user, lease)
  // Chaque courrier part à son destinataire : le garant pour l'appel à la caution, l'assureur ou l'artisan pour une réclamation.
  let to: string[]
  let from = 'votre bailleur'
  if (letter?.type === 'GUARANTOR_CALL') {
    to = c.guarantors.map((g) => g.email).filter((e): e is string => Boolean(e)).slice(0, 1)
    if (!to.length) throw new HttpError(400, 'Ajoutez l’email du garant dans la fiche du locataire pour lui envoyer ce courrier.')
  } else if (letter?.type && isThirdParty(letter.type)) {
    to = letter.recipient?.email ? [letter.recipient.email] : []
    if (!to.length) throw new HttpError(400, 'Ce courrier n’a pas d’adresse email de destinataire : imprimez-le, ou recréez-le avec l’email.')
    from = landlordName(c.landlord) || 'un propriétaire'
  } else {
    to = c.tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
    if (!to.length) throw new HttpError(400, 'Ajoutez l’email du locataire dans sa fiche pour lui envoyer ce courrier.')
  }
  const mail = layout({ title: subject, paragraphs: ['Bonjour,', `Vous trouverez en pièce jointe un courrier de ${from}.`, 'Bonne journée.'] })
  for (const email of to) await sendEmail({ to: email, subject, ...mail, replyTo: user.email, attachments: [{ filename: `${fileSlug(subject)}.pdf`, content: pdf }] })
  return to
}

export const CLIENT_URL = env.CLIENT_URL
