import { Router } from 'express'
import { propertyLeaseMissing } from '../domain/checklist.js'
import { alignInsuranceReminders } from '../services/reminders.js'
import { z } from 'zod'
import type { Lease, Payment, Property, Tenant } from '@prisma/client'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { landlordProfileSchema, propertyFileSchema, tenantFileSchema, type PropertyFile, type TenantFile } from '../domain/contract.js'
import { guarantorCompletion, landlordCompletion, propertyCompletion, tenantCompletion } from '../domain/completion.js'
import { diagnosticsFor, energyRentalWarning, rentControlLikely } from '../domain/rules.js'
import { propertyColumns, propertyName, readProfile, readProperty, readTenant, readTerms, leaseKindOf, tenantName } from '../services/contract.js'
import { iso, mergeFile } from './helpers.js'
import { adPrompt, buildAd, parseAiAd } from '../domain/ad.js'
import { adSettings } from '../services/ad.js'
import { rentalJourneys } from '../services/rental.js'
import { toTrash } from '../services/trash.js'
import { publicUser } from './auth.js'

/**
 * Fiches du propriétaire : profil du bailleur, logements, locataires (et garants).
 * Chaque fiche se remplit en plusieurs fois ; la réponse indique son avancement étape par étape.
 */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/profile', '/properties', '/tenants'], requireUser)

// ── Profil du bailleur ───────────────────────────────────────────────────────

router.get('/profile', (req, res) => {
  const profile = readProfile(req.user!)
  res.json({ success: true, data: { profile, completion: landlordCompletion(profile) } })
})

router.put('/profile', async (req, res) => {
  const patch = landlordProfileSchema.partial().parse(req.body)
  const profile = landlordProfileSchema.parse(mergeFile(readProfile(req.user!), patch))
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      profile,
      // Le prénom et le nom du compte suivent le profil (salutations, emails).
      firstName: profile.firstNames?.split(/\s+/)[0] ?? req.user!.firstName,
      lastName: profile.usageName || profile.lastName || req.user!.lastName,
    },
  })
  res.json({ success: true, data: { profile, completion: landlordCompletion(profile), user: publicUser(user) } })
})

// ── Logements ────────────────────────────────────────────────────────────────

const monthKey = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

/** Situation du loyer du mois pour un bail en cours. */
export function rentStatus(lease: Pick<Lease, 'rentCents' | 'chargesCents' | 'paymentDay' | 'startDate' | 'status'>, payments: Pick<Payment, 'period' | 'amountCents' | 'receivedAt'>[], now = new Date()) {
  const period = monthKey(now)
  const due = lease.rentCents + lease.chargesCents
  const p = payments.find((x) => x.period === period)
  const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), lease.paymentDay))
  if (lease.status === 'DRAFT') return { key: 'DRAFT', label: 'Bail en préparation', lateDays: 0 }
  if (lease.startDate > now) return { key: 'UPCOMING', label: 'Bail signé, entrée à venir', lateDays: 0 }
  if (p && p.amountCents >= due) return { key: 'PAID', label: 'Payé', lateDays: 0 }
  if (p) return { key: 'PARTIAL', label: 'Paiement partiel', lateDays: 0 }
  const late = Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000)
  if (late > 0) return { key: 'LATE', label: `En retard de ${late} jour${late > 1 ? 's' : ''}`, lateDays: late }
  return { key: 'EXPECTED', label: `Attendu le ${lease.paymentDay}`, lateDays: 0 }
}

const PROPERTY_KIND = (f: PropertyFile) => {
  const type = f.habitat === 'INDIVIDUAL' ? 'Maison' : (f.rooms ?? 0) <= 1 ? 'Studio' : 'Appartement'
  const t = f.rooms && type !== 'Studio' ? ` T${f.rooms}` : ''
  return `${type}${t}${f.furnished === true ? ' meublé' : f.furnished === false ? ' vide' : ''}`
}

type LeaseFull = Lease & { payments: Payment[] }

function currentLease(leases: LeaseFull[]): LeaseFull | null {
  const now = Date.now()
  const active = leases.filter((l) => l.status === 'ACTIVE' || l.status === 'IMPORTED')
  return (
    active.find((l) => l.startDate.getTime() <= now && l.endDate.getTime() >= now) ??
    active.find((l) => l.startDate.getTime() > now) ??
    leases.find((l) => l.status === 'DRAFT') ??
    null
  )
}

async function tenantNames(userId: string, ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  const rows = await prisma.tenant.findMany({ where: { userId, id: { in: ids } } })
  return Object.fromEntries(rows.map((t) => [t.id, tenantName(readTenant(t))]))
}

/** Nom des locataires d'un bail (fiches, ou réponses d'origine pour un bail du tunnel). */
export function leaseTenantLabel(lease: Lease, names: Record<string, string>): string {
  if (lease.tenantIds.length) return lease.tenantIds.map((id) => names[id]).filter(Boolean).join(' et ')
  const data = lease.data as { tenants?: { firstName?: string; lastName?: string }[] }
  return (data.tenants ?? []).map((t) => [t.firstName, t.lastName].filter(Boolean).join(' ')).join(' et ')
}

function propertySummary(p: Property & { leases: LeaseFull[] }, names: Record<string, string>) {
  const f = readProperty(p)
  const lease = currentLease(p.leases)
  const rented = Boolean(lease && lease.status !== 'DRAFT')
  return {
    id: p.id,
    name: propertyName(p),
    address: p.address,
    city: p.city,
    kindLabel: PROPERTY_KIND(f),
    surface: f.surface ?? null,
    rooms: f.rooms ?? null,
    floor: f.floorDoor ?? null,
    furnished: f.furnished ?? null,
    dpeClass: f.diagnostics?.dpe?.class ?? null,
    completion: propertyCompletion(f).percent,
    status: rented ? 'RENTED' : 'AVAILABLE',
    lease: lease
      ? {
          id: lease.id,
          status: lease.status,
          tenantName: leaseTenantLabel(lease, names),
          totalCents: lease.rentCents + lease.chargesCents,
          startDate: iso(lease.startDate),
          endDate: iso(lease.endDate),
          rent: rentStatus(lease, lease.payments),
        }
      : null,
  }
}

/** Syndic saisi dans la fiche du logement : il rejoint le carnet, une seule fois. */
async function rememberSyndic(userId: string, file: { copro?: { syndic?: string | null } | null }) {
  const name = file.copro?.syndic?.trim()
  if (!name) return
  if (await prisma.contact.findFirst({ where: { userId, kind: 'SYNDIC', name: { equals: name, mode: 'insensitive' } } })) return
  await prisma.contact.create({ data: { userId, kind: 'SYNDIC', name } })
}

router.get('/properties', async (req, res) => {
  const userId = req.user!.id
  const props = await prisma.property.findMany({ where: { userId }, include: { leases: { include: { payments: true } } }, orderBy: { createdAt: 'asc' } })
  const names = await tenantNames(userId, props.flatMap((p) => p.leases.flatMap((l) => l.tenantIds)))
  res.json({ success: true, data: props.map((p) => propertySummary(p, names)) })
})

router.post('/properties', async (req, res) => {
  const file = propertyFileSchema.parse(req.body)
  if (!file.address) throw new HttpError(400, 'Indiquez l’adresse du logement.')
  const p = await prisma.property.create({ data: { userId: req.user!.id, ...propertyColumns(file), data: file } })
  await rememberSyndic(req.user!.id, file)
  res.status(201).json({ success: true, data: { id: p.id } })
})

async function ownProperty(userId: string, id: string) {
  const p = await prisma.property.findFirst({ where: { id, userId }, include: { leases: { include: { payments: true }, orderBy: { startDate: 'desc' } } } })
  if (!p) throw new HttpError(404, 'Logement introuvable.')
  return p
}

router.get('/properties/:id', async (req, res) => {
  const userId = req.user!.id
  const p = await ownProperty(userId, String(req.params.id))
  const f = readProperty(p)
  const names = await tenantNames(userId, p.leases.flatMap((l) => l.tenantIds))
  const year = new Date().getUTCFullYear()
  const [expenses, documents, inventories, tenants] = await Promise.all([
    prisma.expense.findMany({ where: { userId, propertyId: p.id }, orderBy: { date: 'desc' } }),
    prisma.document.findMany({ where: { userId, OR: [{ propertyId: p.id }, { leaseId: { in: p.leases.map((l) => l.id) } }] }, select: { id: true, kind: true, title: true, createdAt: true, origin: true, period: true, leaseId: true, version: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inventory.findMany({ where: { userId, leaseId: { in: p.leases.map((l) => l.id) } }, orderBy: { createdAt: 'desc' } }),
    prisma.tenant.findMany({ where: { userId, propertyId: p.id } }),
  ])
  const income = p.leases.flatMap((l) => l.payments).filter((x) => x.period.startsWith(String(year))).reduce((a, x) => a + x.amountCents, 0)
  const spent = expenses.filter((e) => e.date.getUTCFullYear() === year).reduce((a, e) => a + e.amountCents, 0)

  // Chronologie : loyers, dépenses, documents, entrées.
  const events = [
    ...p.leases.flatMap((l) => l.payments.map((x) => ({ date: iso(x.receivedAt)!, kind: 'Loyer', title: `Loyer de ${x.period} reçu`, detail: `${(x.amountCents / 100).toFixed(2).replace('.', ',')} €` }))),
    ...expenses.map((e) => ({ date: iso(e.date)!, kind: e.category === 'TAX' ? 'Impôt' : e.category === 'REPAIR' ? 'Travaux' : 'Dépense', title: e.description || e.vendor, detail: `${e.vendor} · ${(e.amountCents / 100).toFixed(2).replace('.', ',')} €${e.status === 'TO_VERIFY' ? ' à vérifier' : ''}` })),
    ...p.leases.filter((l) => l.status !== 'DRAFT').map((l) => ({ date: iso(l.startDate)!, kind: 'Bail', title: `Entrée de ${leaseTenantLabel(l, names) || 'votre locataire'}`, detail: `Bail ${leaseKindOf(l) === 'VIDE' ? 'vide' : 'meublé'}` })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)

  res.json({
    success: true,
    data: {
      ...propertySummary(p, names),
      file: f,
      completion: propertyCompletion(f),
      diagnostics: diagnosticsFor(f),
      /** Ce qui manque au logement pour faire un bail (contrat type, diagnostics, mobilier). */
      leaseMissing: propertyLeaseMissing(f, f.furnished ? 'MEUBLE' : 'VIDE'),
      journey: (await rentalJourneys(req.user!, [p.id])).get(p.id) ?? [],
      energyWarning: energyRentalWarning(f.diagnostics?.dpe?.class),
      rentControlLikely: rentControlLikely(f.inseeCode),
      leases: p.leases.map((l) => ({ id: l.id, status: l.status, kind: leaseKindOf(l), tenantName: leaseTenantLabel(l, names), startDate: iso(l.startDate), endDate: iso(l.endDate), rentCents: l.rentCents, chargesCents: l.chargesCents, depositCents: l.depositCents, rent: rentStatus(l, l.payments) })),
      tenants: tenants.map((t) => ({ id: t.id, name: tenantName(readTenant(t)) })),
      year: { year, incomeCents: income, expensesCents: spent },
      events,
      expenses: expenses.slice(0, 20).map((e) => ({ id: e.id, vendor: e.vendor, description: e.description, amountCents: e.amountCents, date: iso(e.date), category: e.category, status: e.status, chargeTo: e.chargeTo })),
      documents,
      inventories: inventories.map((i) => ({ id: i.id, kind: i.kind, status: i.status, leaseId: i.leaseId, date: iso(i.date), createdAt: i.createdAt })),
    },
  })
})

router.put('/properties/:id', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const patch = propertyFileSchema.partial().parse(req.body)
  const file = propertyFileSchema.parse(mergeFile(readProperty(p), patch))
  await prisma.property.update({ where: { id: p.id }, data: { ...propertyColumns(file), data: file } })
  await rememberSyndic(req.user!.id, file)
  res.json({ success: true, data: { id: p.id, file, completion: propertyCompletion(file), diagnostics: diagnosticsFor(file), energyWarning: energyRentalWarning(file.diagnostics?.dpe?.class) } })
})

// Étape facultative de la mise en location écartée (ou reprise) : annonce, candidatures.
router.post('/properties/:id/steps/:key', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const key = z.enum(['AD', 'CANDIDATES']).parse(req.params.key)
  const { skip } = z.object({ skip: z.boolean() }).parse(req.body)
  const file = readProperty(p)
  const skippedSteps = [...new Set([...(file.skippedSteps ?? []).filter((k) => k !== key), ...(skip ? [key] : [])])]
  await prisma.property.update({ where: { id: p.id }, data: { data: propertyFileSchema.parse({ ...file, skippedSteps }) } })
  res.json({ success: true, data: { journey: (await rentalJourneys(req.user!, [p.id])).get(p.id) ?? [] } })
})

// ── Annonce ──────────────────────────────────────────────────────────────────

router.get('/properties/:id/ad', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const settings = adSettings(p, p.leases)
  const file = readProperty(p)
  res.json({ success: true, data: { settings, ad: buildAd(file, settings), prompt: adPrompt(file, settings), habitat: file.habitat ?? null, saved: Boolean(file.ad) } })
})

router.put('/properties/:id/ad', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const settings = propertyFileSchema.shape.ad.parse(req.body) ?? {}
  const file = propertyFileSchema.parse({ ...readProperty(p), ad: settings })
  await prisma.property.update({ where: { id: p.id }, data: { data: file } })
  res.json({ success: true, data: { settings, ad: buildAd(file, settings), prompt: adPrompt(file, settings), habitat: file.habitat ?? null, saved: true } })
})

/** Texte rédigé par une IA (ou ailleurs) et collé par le propriétaire : titre et description enregistrés. */
router.post('/properties/:id/ad/paste', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  const { text } = z.object({ text: z.string().trim().min(1, 'Collez le texte de l’annonce.').max(6000) }).parse(req.body)
  const parsed = parseAiAd(text)
  if (!parsed.description) throw new HttpError(400, 'Le texte collé est vide.')
  const settings = { ...adSettings(p, p.leases), description: parsed.description, ...(parsed.title ? { title: parsed.title } : {}) }
  const file = propertyFileSchema.parse({ ...readProperty(p), ad: settings })
  await prisma.property.update({ where: { id: p.id }, data: { data: file } })
  res.json({ success: true, data: { settings: file.ad, ad: buildAd(file, file.ad ?? {}), prompt: adPrompt(file, file.ad ?? {}), habitat: file.habitat ?? null, saved: true } })
})

router.delete('/properties/:id', async (req, res) => {
  const p = await ownProperty(req.user!.id, String(req.params.id))
  if (p.leases.some((l) => l.status === 'ACTIVE')) throw new HttpError(409, 'Ce logement a un bail en cours : enregistrez d’abord le départ du locataire.')
  await prisma.property.delete({ where: { id: p.id } })
  res.json({ success: true, data: { deleted: true } })
})

// ── Locataires ───────────────────────────────────────────────────────────────

async function ownTenant(userId: string, id: string) {
  const t = await prisma.tenant.findFirst({ where: { id, userId }, include: { property: true } })
  if (!t) throw new HttpError(404, 'Locataire introuvable.')
  return t
}

async function leasesOfTenant(userId: string, tenantId: string) {
  return prisma.lease.findMany({ where: { userId, tenantIds: { has: tenantId } }, include: { payments: { orderBy: { period: 'desc' } }, property: true }, orderBy: { startDate: 'desc' } })
}

interface TenantHome { id: string; name: string; leaseId: string | null; status: string | null; startDate: string | null; endDate: string | null }
/** Un locataire peut être lié à plusieurs logements (baux successifs ou simultanés, garage…) : un par logement, bail le plus récent. */
function tenantHomes(t: Tenant & { property: Property | null }, leases: (LeaseFull & { property: Property })[]): TenantHome[] {
  const homes = new Map<string, TenantHome>()
  for (const l of leases) if (!homes.has(l.property.id)) homes.set(l.property.id, { id: l.property.id, name: propertyName(l.property), leaseId: l.id, status: l.status, startDate: iso(l.startDate), endDate: iso(l.endDate) })
  if (t.property && !homes.has(t.property.id)) homes.set(t.property.id, { id: t.property.id, name: propertyName(t.property), leaseId: null, status: null, startDate: null, endDate: null })
  return [...homes.values()]
}

const initials = (f: TenantFile) => `${f.firstNames?.[0] ?? ''}${f.lastName?.[0] ?? ''}`.toUpperCase() || '?'

function tenantSummary(t: Tenant & { property: Property | null }, leases: (LeaseFull & { property: Property })[]) {
  const f = readTenant(t)
  const lease = currentLease(leases) as (LeaseFull & { property: Property }) | null
  const rent = lease ? rentStatus(lease, lease.payments) : null
  const situation = !lease ? 'Sans bail' : lease.status === 'DRAFT' ? 'Bail à signer' : rent?.key === 'LATE' ? 'Loyer en retard' : rent?.key === 'PARTIAL' ? 'Paiement partiel' : 'À jour'
  return {
    id: t.id,
    name: tenantName(f),
    initials: initials(f),
    email: f.email ?? null,
    phone: f.phone ?? null,
    property: lease ? { id: lease.property.id, name: propertyName(lease.property) } : t.property ? { id: t.property.id, name: propertyName(t.property) } : null,
    totalCents: lease ? lease.rentCents + lease.chargesCents : null,
    leaseId: lease?.id ?? null,
    situation,
    completion: tenantCompletion(f).percent,
  }
}

router.get('/tenants', async (req, res) => {
  const userId = req.user!.id
  const tenants = await prisma.tenant.findMany({ where: { userId }, include: { property: true }, orderBy: { createdAt: 'asc' } })
  const leases = await prisma.lease.findMany({ where: { userId }, include: { payments: true, property: true } })
  res.json({ success: true, data: tenants.map((t) => tenantSummary(t, leases.filter((l) => l.tenantIds.includes(t.id)))) })
})

router.post('/tenants', async (req, res) => {
  const body = tenantFileSchema.extend({ propertyId: z.uuid().optional().nullable() }).parse(req.body)
  const { propertyId, ...file } = body
  if (!file.lastName && !file.firstNames) throw new HttpError(400, 'Indiquez le nom du locataire.')
  if (propertyId && !(await prisma.property.findFirst({ where: { id: propertyId, userId: req.user!.id } }))) throw new HttpError(404, 'Logement introuvable.')
  const t = await prisma.tenant.create({ data: { userId: req.user!.id, propertyId: propertyId ?? null, data: file } })
  res.status(201).json({ success: true, data: { id: t.id } })
})

router.get('/tenants/:id', async (req, res) => {
  const userId = req.user!.id
  const t = await ownTenant(userId, String(req.params.id))
  const leases = await leasesOfTenant(userId, t.id)
  const f = readTenant(t)
  const lease = currentLease(leases) as (LeaseFull & { property: Property }) | null
  res.json({
    success: true,
    data: {
      ...tenantSummary(t, leases),
      propertyId: t.propertyId,
      file: f,
      completion: tenantCompletion(f, lease?.status === 'ENDED'),
      guarantorCompletion: f.guarantor ? guarantorCompletion(f.guarantor) : null,
      lease: lease
        ? {
            id: lease.id,
            status: lease.status,
            kind: leaseKindOf(lease),
            startDate: iso(lease.startDate),
            endDate: iso(lease.endDate),
            rentCents: lease.rentCents,
            chargesCents: lease.chargesCents,
            depositCents: lease.depositCents,
            chargesMode: readTerms(lease).chargesMode ?? 'PROVISION',
            property: { id: lease.property.id, name: propertyName(lease.property) },
          }
        : null,
      /** Un locataire peut être lié à plusieurs logements (baux successifs ou simultanés, garage…). */
      homes: tenantHomes(t, leases),
      payments: (lease?.payments ?? []).slice(0, 12).map((x) => ({ period: x.period, amountCents: x.amountCents, receivedAt: iso(x.receivedAt), full: lease ? x.amountCents >= lease.rentCents + lease.chargesCents : true })),
    },
  })
})

router.put('/tenants/:id', async (req, res) => {
  const t = await ownTenant(req.user!.id, String(req.params.id))
  const body = tenantFileSchema.partial().extend({ propertyId: z.uuid().optional().nullable() }).parse(req.body)
  const { propertyId, ...patch } = body
  const file = tenantFileSchema.parse(mergeFile(readTenant(t), patch))
  if (propertyId && !(await prisma.property.findFirst({ where: { id: propertyId, userId: req.user!.id } }))) throw new HttpError(404, 'Logement introuvable.')
  await prisma.tenant.update({ where: { id: t.id }, data: { data: file, ...(propertyId !== undefined ? { propertyId } : {}) } })
  // Nouvelle attestation d'assurance saisie : les rappels des baux en cours suivent sa date de fin.
  const expires = file.insurance?.expiresAt
  if (expires && expires !== readTenant(t).insurance?.expiresAt) {
    for (const l of await prisma.lease.findMany({ where: { userId: req.user!.id, tenantIds: { has: t.id }, status: { in: ['ACTIVE', 'IMPORTED'] } } })) await alignInsuranceReminders(l.id, l.userId, expires)
  }
  res.json({ success: true, data: { id: t.id, file, completion: tenantCompletion(file), guarantorCompletion: file.guarantor ? guarantorCompletion(file.guarantor) : null } })
})

router.delete('/tenants/:id', async (req, res) => {
  const userId = req.user!.id
  const t = await ownTenant(userId, String(req.params.id))
  const leases = await leasesOfTenant(userId, t.id)
  if (leases.some((l) => l.status === 'ACTIVE')) throw new HttpError(409, 'Ce locataire a un bail en cours : enregistrez d’abord son départ.')
  const { property: _p, ...row } = t
  await toTrash(userId, 'TENANT', `Locataire : ${tenantName(readTenant(t)) || 'sans nom'}`, row)
  await prisma.tenant.delete({ where: { id: t.id } })
  res.json({ success: true, data: { deleted: true } })
})

export default router
