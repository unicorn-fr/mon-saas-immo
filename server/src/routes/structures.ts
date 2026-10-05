import { Router } from 'express'
import type { Property, Structure } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { requireUser } from '../services/session.js'
import { propertyName, readProfile, readStructure, readTerms } from '../services/contract.js'
import { leaseColumns } from './leases.js'
import { ensureStructures, structureOwned } from '../services/structures.js'
import { toTrash } from '../services/trash.js'
import { defaultTaxRegime, isCompanyKind, landlordFor, sharesTotal, structureEffects, structureName, structureSchema, type StructureFile } from '../domain/structure.js'
import { mergeFile } from './helpers.js'

/**
 * Structures qui détiennent les logements (en nom propre, à plusieurs, SCI, société). Chaque logement en a une :
 * elle désigne le bailleur de ses baux.
 */
const router = Router()
router.use(['/structures', '/properties/:id/structure'], requireUser)

function view(s: Structure, properties: Pick<Property, 'id' | 'label' | 'address' | 'structureId'>[]) {
  const file = readStructure(s)
  const own = properties.filter((p) => p.structureId === s.id)
  return {
    id: s.id,
    name: structureName(file),
    file,
    effects: structureEffects(file),
    shares: sharesTotal(file),
    taxRegime: file.taxRegime ?? defaultTaxRegime(file),
    properties: own.map((p) => ({ id: p.id, name: propertyName(p) })),
  }
}

/** Société : son nom est obligatoire (il désigne le bailleur dans le bail). */
function check(file: StructureFile) {
  if (isCompanyKind(file.kind) && !file.company?.name?.trim() && !file.name?.trim()) throw new HttpError(400, 'Indiquez le nom de la société.')
}

router.get('/structures', async (req, res) => {
  const rows = await ensureStructures(req.user!)
  const properties = await prisma.property.findMany({ where: { userId: req.user!.id }, select: { id: true, label: true, address: true, structureId: true }, orderBy: { createdAt: 'asc' } })
  res.json({ success: true, data: rows.map((s) => view(s, properties)) })
})

router.get('/structures/:id', async (req, res) => {
  const s = await structureOwned(req.user!.id, String(req.params.id))
  const properties = await prisma.property.findMany({ where: { userId: req.user!.id, structureId: s.id }, select: { id: true, label: true, address: true, structureId: true }, orderBy: { createdAt: 'asc' } })
  res.json({ success: true, data: view(s, properties) })
})

router.post('/structures', async (req, res) => {
  await ensureStructures(req.user!)
  const file = structureSchema.parse(req.body)
  if (!file.kind) throw new HttpError(400, 'Indiquez qui détient le logement.')
  check(file)
  const s = await prisma.structure.create({ data: { userId: req.user!.id, data: { ...file, taxRegime: file.taxRegime ?? defaultTaxRegime(file) } } })
  res.status(201).json({ success: true, data: view(s, []) })
})

router.put('/structures/:id', async (req, res) => {
  const s = await structureOwned(req.user!.id, String(req.params.id))
  const patch = structureSchema.partial().parse(req.body)
  const file = structureSchema.parse(mergeFile(readStructure(s), patch))
  check(file)
  const saved = await prisma.structure.update({ where: { id: s.id }, data: { data: file } })
  const properties = await prisma.property.findMany({ where: { userId: req.user!.id, structureId: s.id }, select: { id: true, label: true, address: true, structureId: true } })
  res.json({ success: true, data: view(saved, properties) })
})

router.delete('/structures/:id', async (req, res) => {
  const userId = req.user!.id
  const s = await structureOwned(userId, String(req.params.id))
  const [count, total] = await Promise.all([prisma.property.count({ where: { userId, structureId: s.id } }), prisma.structure.count({ where: { userId } })])
  if (count) throw new HttpError(409, 'Rattachez d’abord ses logements à une autre structure.')
  if (total <= 1) throw new HttpError(409, 'Gardez au moins une structure.')
  await toTrash(userId, 'STRUCTURE', `Structure : ${structureName(readStructure(s))}`, s as unknown as Record<string, unknown>)
  await prisma.structure.delete({ where: { id: s.id } })
  res.json({ success: true, data: { deleted: true } })
})

/** Logement rattaché à une autre structure : ses baux en préparation suivent, un bail signé garde son bailleur. */
router.put('/properties/:id/structure', async (req, res) => {
  const userId = req.user!.id
  const { structureId } = z.object({ structureId: z.string().uuid() }).parse(req.body)
  const property = await prisma.property.findFirst({ where: { id: String(req.params.id), userId } })
  if (!property) throw new HttpError(404, 'Logement introuvable.')
  const s = await structureOwned(userId, structureId)
  await prisma.property.update({ where: { id: property.id }, data: { structureId: s.id } })
  // Baux en préparation : durée et fin recalculées avec le nouveau bailleur (6 ans pour une société).
  const landlord = landlordFor(readProfile(req.user!), readStructure(s))
  const drafts = await prisma.lease.findMany({ where: { propertyId: property.id, status: 'DRAFT' } })
  for (const l of drafts) await prisma.lease.update({ where: { id: l.id }, data: leaseColumns(readTerms(l), landlord) })
  const signed = await prisma.lease.count({ where: { propertyId: property.id, status: { not: 'DRAFT' } } })
  res.json({ success: true, data: { structureId: s.id, name: structureName(readStructure(s)), signedLeasesKept: signed } })
})

export default router
