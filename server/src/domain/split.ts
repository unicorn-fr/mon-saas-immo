/**
 * Dépense d'un immeuble répartie entre ses logements (charges communes : électricité des parties communes, ménage,
 * entretien, taxe d'enlèvement des ordures ménagères…). Chaque logement reçoit sa part, et la part récupérable
 * (décret n° 87-713) passe dans la régularisation des charges de son locataire.
 * Clés : surface habitable (m², fiche du logement), tantièmes (saisis), parts égales. Arrondi au centime par la
 * méthode du plus fort reste : la somme des parts est toujours exactement le total.
 */
export type SplitKey = 'SURFACE' | 'TANTIEMES' | 'EQUAL'

export const SPLIT_KEY_LABEL: Record<SplitKey, string> = { SURFACE: 'Surface habitable', TANTIEMES: 'Tantièmes', EQUAL: 'Parts égales' }

/** Répartit `total` centimes selon les poids (positifs), au plus fort reste. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, w) => a + w, 0)
  if (!weights.length || sum <= 0) throw new Error('Clé de répartition vide.')
  const exact = weights.map((w) => (total * w) / sum)
  const base = exact.map(Math.floor)
  let rest = total - base.reduce((a, x) => a + x, 0)
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const o of order) {
    if (rest <= 0) break
    base[o.i]++
    rest--
  }
  return base
}

export interface SplitShare {
  propertyId: string
  name: string
  weight: number
  amountCents: number
  recoverableCents: number
  /** « 45 m² sur 120 m² », « 250 / 1 000 tantièmes », « 1 part sur 3 ». */
  basis: string
}

export function splitExpense(input: { amountCents: number; recoverableCents: number; key: SplitKey; units: Array<{ propertyId: string; name: string; surface?: number | null; tantiemes?: number | null }> }): SplitShare[] {
  const { key, units } = input
  if (units.length < 2) throw new Error('Choisissez au moins deux logements.')
  if (input.recoverableCents > input.amountCents) throw new Error('La part récupérable ne peut pas dépasser le montant.')
  const weights = units.map((u) => {
    const w = key === 'SURFACE' ? u.surface : key === 'TANTIEMES' ? u.tantiemes : 1
    if (!w || w <= 0) throw new Error(key === 'SURFACE' ? `Indiquez la surface de « ${u.name} » dans sa fiche.` : `Indiquez les tantièmes de « ${u.name} ».`)
    return w
  })
  const amounts = allocate(input.amountCents, weights)
  const recoverable = allocate(input.recoverableCents, weights)
  const sum = weights.reduce((a, w) => a + w, 0)
  const num = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  return units.map((u, i) => ({
    propertyId: u.propertyId,
    name: u.name,
    weight: weights[i],
    amountCents: amounts[i],
    recoverableCents: recoverable[i],
    basis: key === 'SURFACE' ? `${num(weights[i])} m² sur ${num(sum)} m²` : key === 'TANTIEMES' ? `${num(weights[i])} / ${num(sum)} tantièmes` : `1 part sur ${units.length}`,
  }))
}
