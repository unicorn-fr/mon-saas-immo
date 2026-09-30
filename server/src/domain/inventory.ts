import { z } from 'zod'
import type { PropertyFile } from './contract.js'

/**
 * État des lieux (décret n° 2016-382 du 30 mars 2016) : relevés des compteurs, clés, pièce par pièce
 * (sols, murs, plafonds, menuiseries, équipements), avec un état, une observation et des photos.
 * Les pièces viennent de la fiche du logement.
 */

export const STATES = ['Neuf', 'Bon', 'Usé', 'Mauvais', 'Hors service'] as const

const text = (max = 500) => z.string().trim().max(max)
const opt = <T extends z.ZodTypeAny>(s: T) => s.optional().nullable()

export const inventoryItemSchema = z.object({
  label: text(120),
  state: opt(z.enum(STATES)),
  note: opt(text(500)),
  photoIds: opt(z.array(z.string().uuid()).max(20)),
})

export const inventoryDataSchema = z.object({
  date: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  time: opt(z.string().regex(/^\d{2}:\d{2}$/)),
  present: opt(text(300)),
  agent: opt(text(200)),
  /** Sortie : date de l'état des lieux d'entrée et nouvelle adresse du locataire, obligatoires. */
  entryDate: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  newAddress: opt(text(300)),
  meters: opt(
    z.array(z.object({ key: text(40), label: text(80), number: opt(text(60)), index: opt(text(60)), photoId: opt(z.string().uuid()), notApplicable: opt(z.boolean()) })).max(12),
  ),
  heating: opt(z.object({ state: opt(z.enum(STATES)), note: opt(text(300)), lastMaintenance: opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)) })),
  keys: opt(z.array(z.object({ type: text(80), count: z.number().int().min(0).max(99), destination: opt(text(120)) })).max(20)),
  rooms: opt(z.array(z.object({ name: text(80), done: opt(z.boolean()), items: z.array(inventoryItemSchema).max(40), note: opt(text(600)) })).max(40)),
  furniture: opt(z.array(z.object({ item: text(120), count: z.number().int().min(1).max(999), state: opt(z.enum(STATES)), note: opt(text(300)) })).max(200)),
  vetusteGrid: opt(z.boolean()),
  notes: opt(text(2000)),
  signatures: opt(z.object({ landlord: opt(z.string().max(400_000)), tenant: opt(z.string().max(400_000)), signedAt: opt(z.string()) })),
})
export type InventoryData = z.infer<typeof inventoryDataSchema>

const BASE_ITEMS = ['Sol', 'Murs', 'Plafond', 'Fenêtres et volets', 'Porte', 'Prises et interrupteurs', 'Radiateurs']

/** Éléments à vérifier selon le nom de la pièce. */
export function itemsForRoom(name: string): string[] {
  const n = name.toLowerCase()
  if (/cuisine/.test(n)) return [...BASE_ITEMS, 'Plaques de cuisson', 'Four', 'Hotte', 'Évier et robinetterie', 'Placards']
  if (/salle de bain|salle d.eau|sdb/.test(n)) return [...BASE_ITEMS, 'Baignoire ou douche', 'Vasque et robinetterie', 'Miroir et éclairage', 'VMC']
  if (/^wc|toilette/.test(n)) return ['Sol', 'Murs', 'Plafond', 'Porte', 'Cuvette et chasse d’eau', 'Éclairage']
  if (/séjour|salon/.test(n)) return [...BASE_ITEMS, 'Détecteur de fumée']
  if (/entrée|couloir|dégagement/.test(n)) return ['Sol', 'Murs', 'Plafond', 'Porte d’entrée', 'Interphone', 'Prises et interrupteurs']
  if (/garage|cave|parking/.test(n)) return ['Sol', 'Murs', 'Porte', 'Éclairage']
  if (/extérieur|jardin|terrasse|balcon/.test(n)) return ['Sol ou pelouse', 'Clôture ou garde-corps', 'Portail', 'Éclairage extérieur']
  return BASE_ITEMS
}

/** Préparation : pièces de la fiche, compteurs selon l'énergie, clés habituelles, mobilier du meublé. */
export function initialInventory(p: PropertyFile, kind: 'ENTRY' | 'EXIT', previous?: InventoryData | null): InventoryData {
  if (previous && kind === 'EXIT') {
    // Sortie : on repart de l'entrée pour comparer, sans reprendre les états ni les photos.
    return {
      meters: previous.meters?.map((m) => ({ ...m, index: '', photoId: null })),
      keys: previous.keys,
      rooms: previous.rooms?.map((r) => ({ name: r.name, done: false, items: r.items.map((i) => ({ label: i.label })) })),
      furniture: previous.furniture?.map((f) => ({ item: f.item, count: f.count })),
      entryDate: previous.date,
      vetusteGrid: previous.vetusteGrid,
    }
  }
  const rooms = p.roomList?.length ? p.roomList.map((r) => r.name) : ['Entrée', 'Séjour', 'Cuisine', 'Chambre 1', 'Salle de bain', 'WC']
  const hasGas = p.heating?.energy === 'GAS' || p.diagnostics?.gas?.hasGas
  const annexRooms = (p.annexes ?? []).filter((a) => ['garage', 'cellar', 'garden', 'terrace', 'balcony'].includes(a)).map((a) => ({ garage: 'Garage', cellar: 'Cave', garden: 'Extérieurs', terrace: 'Extérieurs', balcony: 'Balcon' })[a as 'garage'])
  const allRooms = [...new Set([...rooms, ...annexRooms])]
  return {
    meters: [
      { key: 'elec', label: 'Électricité', number: '', index: '' },
      { key: 'water', label: 'Eau froide', number: '', index: '' },
      ...(hasGas ? [{ key: 'gas', label: 'Gaz', number: '', index: '' }] : []),
      ...(p.hotWater?.mode === 'COLLECTIVE' ? [{ key: 'hotwater', label: 'Eau chaude', number: '', index: '' }] : []),
    ],
    keys: [
      { type: 'Clé porte d’entrée', count: 2, destination: 'Porte principale' },
      { type: 'Clé boîte aux lettres', count: 1, destination: '' },
    ],
    rooms: allRooms.map((name) => ({ name, done: false, items: itemsForRoom(name).map((label) => ({ label })) })),
    furniture: p.furnished ? (p.furniture?.inventory ?? []).map((i) => ({ item: i.room ? `${i.room} : ${i.item}` : i.item, count: i.count })) : [],
    vetusteGrid: true,
  }
}

/** Avancement : compteurs relevés, pièces faites, signatures. */
export function inventoryProgress(d: InventoryData): { meters: boolean; rooms: number; roomsTotal: number; keys: boolean; signed: boolean } {
  return {
    meters: (d.meters ?? []).every((m) => m.notApplicable || Boolean(m.index)),
    rooms: (d.rooms ?? []).filter((r) => r.done).length,
    roomsTotal: (d.rooms ?? []).length,
    keys: (d.keys ?? []).length > 0,
    signed: Boolean(d.signatures?.landlord && d.signatures?.tenant),
  }
}
