import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { MAX_IMPORT_ROWS, parseTable, type ImportProperty } from '../domain/tableImport.js'
import type { PropertyFile } from '../domain/contract.js'
import { upload } from './helpers.js'
import { createTenant, insertProperty, prepareProperty } from './space.js'

/**
 * Import de tous les logements et locataires depuis un fichier (CSV ou Excel) d'un ancien logiciel ou d'un tableur.
 * Le fichier est lu en mémoire sur notre serveur et n'est jamais enregistré : seules les lignes confirmées créent
 * des fiches, par les mêmes chemins que « Ajouter un logement » et « Ajouter un locataire ». Aucun bail n'est créé.
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
  }),
  tenants: z
    .array(z.object({ firstNames: str(120), lastName: str(80), email: z.email().optional(), phone: str(30) }))
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
  return file as PropertyFile
}

router.post('/import/table/confirm', async (req, res) => {
  const { rows } = z.object({ rows: z.array(z.unknown()).max(MAX_IMPORT_ROWS, `Importez ${MAX_IMPORT_ROWS} lignes au plus à la fois.`) }).parse(req.body)
  const valid = rows.map((r) => rowSchema.safeParse(r)).filter((r) => r.success).map((r) => r.data)
  if (!valid.length) throw new HttpError(400, 'Aucune ligne valide à ajouter. Chaque logement doit avoir une adresse.')
  const user = req.user!
  let properties = 0
  let tenants = 0
  const failed: Array<{ line?: number; address: string; message: string }> = []
  for (const row of valid) {
    try {
      const { id } = await insertProperty(user, prepareProperty(propertyFile(row.property)))
      properties++
      for (const t of row.tenants) {
        try {
          await createTenant(user.id, { lastName: t.lastName, firstNames: t.firstNames, email: t.email, phone: t.phone, propertyId: id })
          tenants++
        } catch (e) {
          failed.push({ line: row.line, address: row.property.address, message: `Locataire non ajouté : ${(e as Error).message}` })
        }
      }
    } catch (e) {
      failed.push({ line: row.line, address: row.property.address, message: (e as Error).message })
    }
  }
  if (!properties) throw new HttpError(400, `Aucun logement n’a pu être ajouté : ${failed[0]?.message ?? 'lignes invalides'}`)
  res.status(201).json({ success: true, data: { properties, tenants, skipped: rows.length - valid.length, failed } })
})

export default router
