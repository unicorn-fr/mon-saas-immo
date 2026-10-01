import { Router } from 'express'
import { z } from 'zod'
import type { Lease, Prisma, Property, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { irlOneYearLater, latestIrl, quarterLabel } from '../lib/irl.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { contractFor, leaseKindOf, leaseOwned, propertyName, readProfile, readProperty, readTenant, readTerms, tenantName } from '../services/contract.js'
import { leaseTermsSchema, type ContractInput, type LeaseKind, type LeaseTerms } from '../domain/contract.js'
import { termsCompletion } from '../domain/completion.js'
import { leaseMissing, partiesMissing, type Missing } from '../domain/checklist.js'
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
import { LETTER_TITLES, letterContent, letterSchema, revisedRent, type LetterInput } from '../domain/letters.js'
import { renderContractPdf } from '../pdf/contract.js'
import { renderGuaranteePdf } from '../pdf/guarantee.js'
import { renderReceiptPdf, type ReceiptInput } from '../pdf/receipt.js'
import { renderLetterPdf } from '../pdf/letter.js'
import { personName, propertyAddress } from '../pdf/labels.js'
import { fileSlug, iso, mergeFile, saveGeneratedDocument, sendPdf } from './helpers.js'
import { leaseTenantLabel, rentStatus } from './space.js'

/**
 * Baux de l'espace : préparation (conditions reprises des fiches, règles appliquées), signature,
 * versions, loyers reçus (quittance ou reçu), avis d'échéance, courriers, envoi par email.
 */
const router = Router()
router.use(requireUser)

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
    return { key: m.key, label: m.label, where: m.where, to }
  })
}

/** Refuse un document tant qu'une mention obligatoire manque, en disant laquelle. */
export function assertComplete(missing: Missing[]) {
  if (!missing.length) return
  const list = missing.slice(0, 4).map((m) => m.label.charAt(0).toLowerCase() + m.label.slice(1))
  throw new HttpError(400, `Pour que ce document soit valable, il manque : ${list.join(' ; ')}${missing.length > 4 ? ` (et ${missing.length - 4} autre${missing.length > 5 ? 's' : ''})` : ''}.`)
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
    { key: 'notice', label: 'Notice d’information', status: 'Jointe', done: true },
    ...diagnosticsFor(c.property)
      .filter((d) => d.required && d.annexed)
      .map((d) => {
        const has = d.key === 'dpe' ? dpeDone : Boolean(c.property.diagnostics?.[d.key]?.date || c.property.diagnostics?.[d.key]?.fileId)
        return { key: d.key, label: d.label, status: has ? 'Joint' : 'À ajouter à la fiche du logement', done: has }
      }),
    ...guarantors.map((g) => ({ key: `caution-${g.tenantId}`, label: `Acte de caution de ${g.name}`, status: 'Prêt', done: true })),
    { key: 'inventory', label: 'État des lieux d’entrée', status: entry?.status === 'SIGNED' ? 'Fait' : `À faire le ${c.terms.startDate ? formatDateFr(parseIsoDate(c.terms.startDate)) : 'jour de l’entrée'}`, done: entry?.status === 'SIGNED' },
    ...(c.property.legalRegime === 'COPRO' ? [{ key: 'copro', label: 'Extraits du règlement de copropriété', status: c.property.copro?.extractsProvided ? 'Joint' : 'À ajouter', done: Boolean(c.property.copro?.extractsProvided) }] : []),
    ...(leaseKindOf(lease) !== 'VIDE' ? [{ key: 'furniture', label: 'Inventaire du mobilier', status: c.property.furniture?.inventory?.length ? 'Joint' : 'Avec l’état des lieux', done: Boolean(c.property.furniture?.inventory?.length) }] : []),
  ]
  const completion = termsCompletion(terms, { hasLandlord: Boolean(c.landlord.lastName || c.landlord.company?.name), hasProperty: Boolean(c.property.address && c.property.surface), hasTenant: c.tenants.length > 0, tense: Boolean(terms.zone?.tense) })
  const checklist = lease.status === 'DRAFT' ? withLinks(leaseMissing(c), lease) : []
  const esignPending = Boolean(await prisma.signatureRequest.findFirst({ where: { leaseId: lease.id, status: 'PENDING' }, select: { id: true } }))
  return {
    id: lease.id,
    status: lease.status,
    ready: lease.status === 'DRAFT' && completion.percent === 100 && checklist.length === 0,
    checklist,
    esignPending,
    dirty: Boolean((lease.data as { dirty?: boolean }).dirty),
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
  const startDate = body.terms?.startDate
  const defaults: LeaseTerms = {
    kind,
    colocation,
    chargesMode: kind === 'MOBILITE' ? 'FORFAIT' : 'PROVISION',
    paymentDay: 5,
    paymentTerm: 'ADVANCE',
    paymentMethod: 'TRANSFER',
    zone: { tense: file.market?.tense ?? (rentControlLikely(file.inseeCode) ? true : undefined), control: rentControlLikely(file.inseeCode) },
    previous: prev ? { rentedWithin18Months: true, lastRentCents: prev.rentCents, lastRevisionDate: undefined, lastPaymentDate: undefined } : undefined,
    revision: { enabled: kind !== 'MOBILITE' && rentRevisionAllowed(dpe), date: startDate ? startDate.slice(5) : undefined, irlQuarter: irl?.quarter, irlValue: irl?.value },
    clauses: { resolutoire: true, solidarite: colocation },
    signature: { place: profile.city ?? undefined, mode: 'PAPER' },
  }
  const terms = leaseTermsSchema.parse(mergeFile(defaults as Record<string, unknown>, (body.terms ?? {}) as Record<string, unknown>))
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

router.delete('/leases/:id', async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  if (lease.status !== 'DRAFT') throw new HttpError(409, 'Seul un bail en préparation peut être supprimé.')
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
  if (lease.status === 'DRAFT') assertComplete(leaseMissing(c))
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
    prisma.lease.update({ where: { id: lease.id }, data: { status: 'ENDED', endDate: parseIsoDate(body.keysDate), data: { ...(lease.data as object), keysDate: body.keysDate } } }),
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
  const c = await contractFor(user, lease)
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
  const c = await contractFor(user, lease)
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
  const c = await contractFor(user, lease)
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
  const c = await contractFor(user, lease)
  assertComplete(partiesMissing(c))
  const to = c.tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
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
  const c = await contractFor(user, lease)
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
    else note = `À envoyer au plus tard le ${formatDateFr(new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - notice, end.getUTCDate())))} (${notice} mois avant la fin), par lettre recommandée, commissaire de justice ou remise contre signature.`
  } else if (type === 'CHARGES') {
    const year = new Date().getUTCFullYear() - 1
    const payments = await prisma.payment.findMany({ where: { leaseId: lease.id, period: { startsWith: String(year) } } })
    const provisions = payments.reduce((a, p) => a + Math.min(lease.chargesCents, Math.max(0, p.amountCents - lease.rentCents)), 0)
    const expenses = await prisma.expense.findMany({ where: { userId: user.id, propertyId: lease.propertyId, recoverableCents: { gt: 0 }, date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } })
    data = { type, year, provisionsCents: provisions, lines: expenses.map((e) => ({ label: e.description || e.vendor, amountCents: e.recoverableCents })) }
  } else if (type === 'DEPOSIT_RETURN') {
    const keys = (lease.data as { keysDate?: string }).keysDate ?? iso(lease.endDate)
    data = { type, depositCents: lease.depositCents, keysDate: keys, conform: true, deductions: [] }
  }
  res.json({ success: true, data: { title: LETTER_TITLES[type as keyof typeof LETTER_TITLES], letter: data, note, recipient: await recipientOf(user, lease, c) } })
})

async function letterPdf(user: User, lease: LeaseWithProperty, letter: LetterInput) {
  const c = await contractFor(user, lease)
  assertComplete(partiesMissing(c))
  const recipient = await recipientOf(user, lease, c)
  const content = letterContent(letter, { tenantName: recipient.name, propertyAddress: propertyAddress(c.property), guarantorName: c.guarantors[0] ? personName(c.guarantors[0]) : null })
  const input = { content, landlord: c.landlord, recipient, date: new Date() }
  return { pdf: await renderLetterPdf(input), content, input }
}

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
  const doc = await saveGeneratedDocument({ userId: user.id, kind: 'LETTER', title: LETTER_TITLES[letter.type], pdf, snapshot: { letter: input }, leaseId: lease.id, propertyId: lease.propertyId, meta: { type: letter.type } })
  // Révision : le nouveau loyer s'applique au bail et devient la nouvelle référence.
  if (letter.type === 'REVISION') {
    const next = revisedRent(letter.oldRentCents, letter.irlRef.value, letter.irlNew.value)
    const terms = readTerms(lease)
    await prisma.lease.update({ where: { id: lease.id }, data: { rentCents: next, data: { ...(lease.data as object), terms: { ...terms, rentCents: next, revision: { ...terms.revision, irlQuarter: letter.irlNew.quarter, irlValue: letter.irlNew.value } } } } })
    await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'RENT_REVISION', status: 'TODO', dueDate: { lte: new Date(Date.now() + 60 * 86_400_000) } }, data: { status: 'DONE', doneAt: new Date() } })
  }
  if (letter.type === 'INSURANCE') {
    await prisma.reminder.updateMany({ where: { leaseId: lease.id, type: 'INSURANCE', status: 'TODO', dueDate: { lte: new Date(Date.now() + 60 * 86_400_000) } }, data: { status: 'DONE', doneAt: new Date() } })
  }
  res.status(201).json({ success: true, data: { documentId: doc.id, computed: content.computed ?? [] } })
})

export { leaseView }
export default router

/** Envoi d'un courrier déjà enregistré (utilisé par la route documents). */
export async function emailLetter(user: User, leaseId: string, pdf: Buffer, subject: string) {
  const lease = await leaseOwned(user.id, leaseId)
  const c = await contractFor(user, lease)
  const to = c.tenants.map((t) => t.email).filter((e): e is string => Boolean(e))
  if (!to.length) throw new HttpError(400, 'Ajoutez l’email du locataire dans sa fiche pour lui envoyer ce courrier.')
  const mail = layout({ title: subject, paragraphs: ['Bonjour,', 'Vous trouverez en pièce jointe un courrier de votre bailleur.', 'Bonne journée.'] })
  for (const email of to) await sendEmail({ to: email, subject, ...mail, replyTo: user.email, attachments: [{ filename: `${fileSlug(subject)}.pdf`, content: pdf }] })
  return to
}

export const CLIENT_URL = env.CLIENT_URL
