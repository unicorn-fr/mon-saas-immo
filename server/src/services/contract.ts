import type { Lease, Property, Tenant, User } from '@prisma/client'
import { prisma } from '../db.js'
import {
  dpeClass,
  guarantorSchema,
  landlordProfileSchema,
  leaseTermsSchema,
  propertyFileSchema,
  tenantFileSchema,
  type ContractInput,
  type Guarantor,
  type LandlordProfile,
  type LeaseKind,
  type LeaseTerms,
  type PropertyFile,
  type TenantFile,
} from '../domain/contract.js'
import type { LeaseInput } from '../domain/lease.js'
import { HttpError } from '../lib/http.js'

/**
 * Lecture sûre des fiches enregistrées en JSON : une donnée invalide (ancienne version, saisie abîmée)
 * est ignorée plutôt que de bloquer tout le document.
 */
function safe<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown): T {
  const r = schema.safeParse(value ?? {})
  if (r.success) return r.data as T
  // Dernier recours : on garde les champs un à un.
  const out: Record<string, unknown> = {}
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const one = schema.safeParse({ [k]: v })
      if (one.success) out[k] = v
    }
  }
  return out as T
}

export const readProfile = (u: Pick<User, 'profile'>): LandlordProfile => safe(landlordProfileSchema, u.profile)
export const readTerms = (l: Pick<Lease, 'data'>): LeaseTerms => safe(leaseTermsSchema, (l.data as { terms?: unknown } | null)?.terms)
export const readTenant = (t: Pick<Tenant, 'data'>): TenantFile => safe(tenantFileSchema, t.data)
export const readGuarantor = (g: unknown): Guarantor => safe(guarantorSchema, g)

/** Fiche du logement : les colonnes (adresse, surface, DPE…) complètent le JSON. */
export function readProperty(p: Property): PropertyFile {
  const data = safe<PropertyFile>(propertyFileSchema, p.data)
  return {
    ...data,
    label: data.label ?? p.label ?? undefined,
    address: data.address ?? p.address,
    postalCode: data.postalCode ?? p.postalCode ?? undefined,
    city: data.city ?? p.city ?? undefined,
    inseeCode: data.inseeCode ?? p.inseeCode ?? undefined,
    banId: data.banId ?? p.banId ?? undefined,
    surface: data.surface ?? p.surface ?? undefined,
    rooms: data.rooms ?? p.rooms ?? undefined,
    diagnostics: {
      ...data.diagnostics,
      dpe: { ...data.diagnostics?.dpe, class: data.diagnostics?.dpe?.class ?? (dpeClass.safeParse(p.dpeClass).data ?? undefined), number: data.diagnostics?.dpe?.number ?? p.dpeNumber ?? undefined },
    },
  }
}

/** Colonnes indexées tenues à jour à partir de la fiche. */
export function propertyColumns(f: PropertyFile) {
  return {
    label: f.label ?? null,
    address: f.address ?? '',
    postalCode: f.postalCode ?? null,
    city: f.city ?? null,
    inseeCode: f.inseeCode ?? null,
    banId: f.banId ?? null,
    surface: f.surface ?? null,
    rooms: f.rooms ?? null,
    dpeClass: f.diagnostics?.dpe?.class ?? null,
    dpeNumber: f.diagnostics?.dpe?.number ?? null,
  }
}

export const leaseKindOf = (lease: Pick<Lease, 'type' | 'data'>): LeaseKind => readTerms(lease).kind ?? (lease.type === 'FURNISHED' ? 'MEUBLE' : 'VIDE')

/** Nom court d'un logement : « Studio rue Foch », sinon l'adresse. */
export function propertyName(p: Pick<Property, 'label' | 'address'>): string {
  return p.label || p.address
}

export function tenantName(t: TenantFile): string {
  return [t.firstNames?.split(/\s+/)[0], t.lastName].filter(Boolean).join(' ') || 'Locataire sans nom'
}

// ── Anciens baux (tunnel) ────────────────────────────────────────────────────

/** Un bail créé par le tunnel public garde ses réponses d'origine ; elles sont converties au format des fiches. */
export function isLegacy(data: unknown): data is LeaseInput {
  return Boolean(data && typeof data === 'object' && 'landlord' in data && 'rent' in data)
}

export function legacyToContract(input: LeaseInput): ContractInput {
  const kind: LeaseKind = input.type === 'FURNISHED' ? 'MEUBLE' : 'VIDE'
  return {
    landlord: { kind: 'PERSON', firstNames: input.landlord.firstName, lastName: input.landlord.lastName, address: input.landlord.address },
    property: {
      address: input.property.address,
      postalCode: input.property.postalCode,
      city: input.property.city,
      inseeCode: input.property.inseeCode,
      surface: input.property.surface,
      rooms: input.property.rooms,
      furnished: kind === 'MEUBLE',
      diagnostics: { dpe: { class: input.property.dpeClass, number: input.property.dpeNumber } },
    },
    tenants: input.tenants.map((t) => ({ firstNames: t.firstName, lastName: t.lastName, email: t.email || undefined })),
    guarantors: input.guarantor ? [{ firstNames: input.guarantor.firstName, lastName: input.guarantor.lastName, address: input.guarantor.address, engagement: 'SOLIDAIRE' }] : [],
    terms: {
      kind,
      startDate: input.rent.startDate,
      rentCents: input.rent.rentCents,
      chargesCents: input.rent.chargesCents,
      chargesMode: 'PROVISION',
      depositCents: input.rent.depositCents,
      paymentDay: input.rent.paymentDay,
      paymentTerm: 'ADVANCE',
      revision: input.irl ? { enabled: true, irlQuarter: input.irl.quarter, irlValue: input.irl.value } : { enabled: true },
      clauses: { resolutoire: true, solidarite: input.tenants.length > 1 },
    },
  }
}

// ── Assemblage d'un bail ─────────────────────────────────────────────────────

type LeaseWithProperty = Lease & { property: Property }

/** Tout ce qu'il faut pour produire le bail : fiches actuelles (bail en préparation) ou copie figée (bail signé). */
export async function contractFor(user: User, lease: LeaseWithProperty): Promise<ContractInput> {
  const data = lease.data as Record<string, unknown>
  if (isLegacy(data)) return legacyToContract(data)
  if (data.snapshot && lease.status !== 'DRAFT') return data.snapshot as ContractInput

  const tenants = lease.tenantIds.length ? await prisma.tenant.findMany({ where: { id: { in: lease.tenantIds }, userId: user.id } }) : []
  const ordered = lease.tenantIds.map((id) => tenants.find((t) => t.id === id)).filter((t): t is Tenant => Boolean(t))
  const files = ordered.map(readTenant)
  // Colocataires saisis dans la fiche du locataire principal, sans fiche à eux
  const coTenants = files.flatMap((f) => f.coTenants ?? []).map((c) => ({ civility: c.civility, firstNames: c.firstNames, lastName: c.lastName, email: c.email }))
  return {
    landlord: readProfile(user),
    property: readProperty(lease.property),
    tenants: [...files, ...coTenants],
    guarantors: files.filter((f) => f.guarantee === 'CAUTION' && f.guarantor).map((f) => f.guarantor!),
    terms: readTerms(lease),
  }
}

/**
 * Bail signé, pour les quittances, courriers, états des lieux et envois : l'identité des parties reste celle du bail,
 * mais les coordonnées viennent des fiches actuelles (email ajouté après la signature, nouvelle adresse au départ,
 * adresse, IBAN et signature du bailleur). Le PDF du bail, lui, reste la copie figée.
 */
export async function liveContract(user: User, lease: LeaseWithProperty): Promise<ContractInput> {
  const c = await contractFor(user, lease)
  const data = lease.data as Record<string, unknown>
  if (isLegacy(data) || !data.snapshot || lease.status === 'DRAFT') return c
  const rows = lease.tenantIds.length ? await prisma.tenant.findMany({ where: { id: { in: lease.tenantIds }, userId: user.id } }) : []
  const files = lease.tenantIds.map((id) => rows.find((t) => t.id === id)).filter((t): t is Tenant => Boolean(t)).map(readTenant)
  const filled = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '')) as Partial<T>
  const profile = readProfile(user)
  const liveGuarantors = files.filter((f) => f.guarantee === 'CAUTION' && f.guarantor).map((f) => f.guarantor!)
  return {
    ...c,
    landlord: { ...c.landlord, ...filled({ address: profile.address, postalCode: profile.postalCode, city: profile.city, email: profile.email, phone: profile.phone, payment: profile.payment, signature: profile.signature, agent: profile.agent }) },
    tenants: c.tenants.map((t, i) => (files[i] ? { ...t, ...filled({ email: files[i].email, phone: files[i].phone, newAddress: files[i].newAddress }) } : t)),
    guarantors: c.guarantors.map((g, i) => (liveGuarantors[i] ? { ...g, ...filled({ email: liveGuarantors[i].email, address: liveGuarantors[i].address }) } : g)),
  }
}

export async function leaseOwned(userId: string, leaseId: string): Promise<LeaseWithProperty> {
  const lease = await prisma.lease.findFirst({ where: { id: leaseId, userId }, include: { property: true } })
  if (!lease) throw new HttpError(404, 'Bail introuvable.')
  return lease
}
