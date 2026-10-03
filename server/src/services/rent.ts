import { prisma } from '../db.js'
import { propertyFileSchema, type PropertyFile } from '../domain/contract.js'
import { readProperty } from './contract.js'

type Rent = NonNullable<PropertyFile['rent']>

/** Montants connus seulement (un champ vide ne remplace jamais une valeur déjà saisie). */
export function rentPatch(src: { rentCents?: number | null; chargesCents?: number | null; chargesMode?: string | null; depositCents?: number | null; paymentDay?: number | null }): Rent {
  const out: Rent = {}
  if (src.rentCents != null) out.rentCents = src.rentCents
  if (src.chargesCents != null) out.chargesCents = src.chargesCents
  if (src.chargesMode === 'PROVISION' || src.chargesMode === 'PERIODIC' || src.chargesMode === 'FORFAIT') out.chargesMode = src.chargesMode
  if (src.depositCents != null) out.depositCents = src.depositCents
  if (src.paymentDay != null) out.paymentDay = src.paymentDay
  return out
}

/**
 * Le loyer changé dans l'annonce ou dans un bail en préparation est retenu dans la fiche du logement :
 * la prochaine annonce et le prochain bail le reprennent sans rien ressaisir. Fiche relue juste avant l'écriture.
 */
export async function rememberRent(propertyId: string, patch: Rent) {
  if (!Object.keys(patch).length) return
  const fresh = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!fresh) return
  const file = readProperty(fresh)
  const rent = { ...(file.rent ?? {}), ...patch }
  if (JSON.stringify(rent) === JSON.stringify(file.rent ?? {})) return
  await prisma.property.update({ where: { id: propertyId }, data: { data: propertyFileSchema.parse({ ...file, rent }) } })
}
