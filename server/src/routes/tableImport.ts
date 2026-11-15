import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { MAX_IMPORT_ROWS, currentTermEnd, leasePlan, parseTable, type ImportProperty } from '../domain/tableImport.js'
import { leaseTermsSchema, type LeaseKind, type PropertyFile } from '../domain/contract.js'
import { leaseDurationMonths } from '../domain/rules.js'
import { parseIsoDate } from '../domain/lease.js'
import { prisma } from '../db.js'
import { landlordOf } from '../services/contract.js'
import { ensureReminders } from '../services/reminders.js'
import { upload } from './helpers.js'
import { createTenant, insertProperty, prepareProperty } from './space.js'

/**
 * Import de tous les logements et locataires depuis un fichier (CSV ou Excel) d'un ancien logiciel ou d'un tableur.
 * Le fichier est lu en mémoire sur notre serveur et n'est jamais enregistré : seules les lignes confirmées créent
 * des fiches, par les mêmes chemins que « Ajouter un logement » et « Ajouter un locataire ». Un logement loué
 * (locataire, date d'entrée, loyer) reçoit son bail en cours, au statut « signé, importé » : quittances, rappels,
 * retards et déclaration le suivent tout de suite ; le bail signé en PDF s'ajoute ensuite sur la page du bail.
 */
const router = Router()
router.use('/import/table', requireUser)

router.post('/import/table/preview', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choisissez le fichier à importer.')
  let preview
  try {
    preview = parseTable(req.file.buffer)
  } catch (e) {
    throw new HttpError(400, (e as Error).message)
  }
  res.json({ success: true, data: preview })
})

const cents = z.number().int().min(0).max(100_000_000).optional()
const str = (max: number) => z.string().trim().max(max).optional()
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const rowSchema = z.object({
  line: z.number().int().optional(),
  property: z.object({
    label: str(120),
    address: z.string().trim().min(1).max(300),
    postalCode: str(10),
    city: str(120),
    surface: z.number().positive().max(2000).optional(),
    rooms: z.number().int().min(1).max(30).optional(),
    kind: z.enum(['VIDE', 'MEUBLE', 'PARKING']),
    parkingType: z.enum(['GARAGE', 'BOX', 'PLACE']).optional(),
    rentCents: cents,
    chargesCents: cents,
    depositCents: cents,
    paymentDay: z.number().int().min(1).max(28).optional(),
    dpeClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
    gesClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  }),
  tenants: z
    .array(z.object({ firstNames: str(120), lastName: str(80), email: z.email().optional(), phone: str(30), entryDate: isoDay.optional(), leaseEnd: isoDay.optional() }))
    .max(6)
    .default([]),
})

/** Fiche du logement telle que l'écran « Ajouter un logement » la construit ; le loyer va dans `rent`. */
function propertyFile(p: z.infer<typeof rowSchema>['property'] | ImportProperty): PropertyFile {
  const rent = { rentCents: p.rentCents, chargesCents: p.chargesCents, depositCents: p.depositCents, paymentDay: p.paymentDay }
  const hasRent = Object.values(rent).some((v) => v != null)
  const file: Record<string, unknown> = { label: p.label, address: p.address, postalCode: p.postalCode, city: p.city }
  if (p.kind === 'PARKING') {
    file.nature = 'PARKING'
    file.parking = { type: p.parkingType ?? 'PLACE' }
  } else {
    file.nature = 'HOUSING'
    file.furnished = p.kind === 'MEUBLE'
    file.surface = p.surface
    file.rooms = p.rooms
  }
  if (hasRent) file.rent = Object.fromEntries(Object.entries(rent).filter(([, v]) => v != null))
  if (p.kind !== 'PARKING' && (p.dpeClass || p.gesClass)) file.diagnostics = { dpe: { ...(p.dpeClass ? { class: p.dpeClass } : {}), ...(p.gesClass ? { ges: p.gesClass } : {}) } }
  return file as PropertyFile
}

router.post('/import/table/confirm', async (req, res) => {
  const { rows, leases: withLeases } = z
    .object({ rows: z.array(z.unknown()).max(MAX_IMPORT_ROWS, `Importez ${MAX_IMPORT_ROWS} lignes au plus à la fois.`), leases: z.boolean().default(true) })
    .parse(req.body)
  const valid = rows.map((r) => rowSchema.safeParse(r)).filter((r) => r.success).map((r) => r.data)
  if (!valid.length) throw new HttpError(400, 'Aucune ligne valide à ajouter. Chaque logement doit avoir une adresse.')
  const user = req.user!
  let properties = 0
  let tenants = 0
  let leases = 0
  const today = new Date().toISOString().slice(0, 10)
  const failed: Array<{ line?: number; address: string; message: string }> = []
  for (const row of valid) {
    try {
      const { id } = await insertProperty(user, prepareProperty(propertyFile(row.property)))
      properties++
      const tenantIds: string[] = []
      for (const t of row.tenants) {
        try {
          const created = await createTenant(user.id, { lastName: t.lastName, firstNames: t.firstNames, email: t.email, phone: t.phone, living: row.tenants.length > 1 ? 'COLOCATION' : undefined, propertyId: id })
          tenantIds.push(created.id)
          tenants++
        } catch (e) {
          failed.push({ line: row.line, address: row.property.address, message: `Locataire non ajouté : ${(e as Error).message}` })
        }
      }
      // Bail en cours : seulement avec ses locataires, la date d'entrée et le loyer (règles revues sur le serveur).
      const plan = withLeases && tenantIds.length ? leasePlan(row.property, row.tenants, today) : undefined
      if (plan?.create) {
        try {
          await importLease(user, id, row.property, tenantIds, plan.startDate, plan.endDate, today)
          leases++
        } catch (e) {
          failed.push({ line: row.line, address: row.property.address, message: `Bail non repris : ${(e as Error).message}` })
        }
      }
    } catch (e) {
      failed.push({ line: row.line, address: row.property.address, message: (e as Error).message })
    }
  }
  if (!properties) throw new HttpError(400, `Aucun logement n’a pu être ajouté : ${failed[0]?.message ?? 'lignes invalides'}`)
  res.status(201).json({ success: true, data: { properties, tenants, leases, skipped: rows.length - valid.length, failed } })
})

const KIND_OF: Record<ImportProperty['kind'], LeaseKind> = { VIDE: 'VIDE', MEUBLE: 'MEUBLE', PARKING: 'PARKING' }

/**
 * Bail déjà signé hors de Bailio, repris du fichier : statut IMPORTED, comme un bail importé en photo. Ses conditions
 * restent celles du document signé ; Bailio n'invente rien (pas de dépôt supposé s'il n'est pas dans le fichier).
 * Fin : celle du fichier, sinon la fin de la période en cours (tacite reconduction).
 */
async function importLease(user: { id: string; profile: unknown }, propertyId: string, p: ImportProperty, tenantIds: string[], startDate: string, endDate: string | undefined, today: string) {
  const property = await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })
  const landlord = await landlordOf(user as never, property)
  const kind = KIND_OF[p.kind]
  const colocation = tenantIds.length > 1
  const terms = leaseTermsSchema.parse({
    kind,
    colocation,
    startDate,
    rentCents: p.rentCents,
    chargesCents: p.chargesCents ?? 0,
    ...(p.depositCents != null ? { depositCents: p.depositCents } : {}),
    chargesMode: 'PROVISION',
    paymentDay: p.paymentDay ?? 5,
    paymentTerm: 'ADVANCE',
    paymentMethod: 'TRANSFER',
    ...(kind === 'PARKING' ? { durationMonths: 12, noticeMonths: 1 } : {}),
    revision: { enabled: true, date: startDate.slice(5) },
    clauses: { resolutoire: true, solidarite: colocation },
  })
  const months = leaseDurationMonths(kind, landlord, terms)
  const end = endDate ?? currentTermEnd(startDate, months, today)
  const lease = await prisma.lease.create({
    data: {
      userId: user.id,
      propertyId,
      status: 'IMPORTED',
      type: kind === 'MEUBLE' ? 'FURNISHED' : 'UNFURNISHED',
      startDate: parseIsoDate(startDate),
      durationMonths: months,
      endDate: parseIsoDate(end),
      rentCents: p.rentCents ?? 0,
      chargesCents: p.chargesCents ?? 0,
      depositCents: p.depositCents ?? 0,
      paymentDay: p.paymentDay ?? 5,
      tenantIds,
      data: { terms, importedFrom: 'TABLE' },
    },
  })
  await ensureReminders(lease)
}

export default router
