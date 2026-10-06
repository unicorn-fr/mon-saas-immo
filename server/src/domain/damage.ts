import { z } from 'zod'
import type { InventoryData } from './inventory.js'
import { itemKey, worseItems } from './inventoryCompare.js'

/**
 * Récapitulatif des dégradations, après l'état des lieux de sortie : pour chaque élément plus abîmé qu'à l'entrée,
 * le bailleur indique s'il s'agit d'usure normale (rien à retenir) ou d'une dégradation (coût, justificatif, commentaire).
 * Le locataire ne répond pas de la vétusté (loi du 6 juillet 1989, art. 7 c) ; les retenues sur le dépôt doivent être
 * « dûment justifiées » (art. 22) : devis, facture ou constat. Une part d'usure (grille de vétusté convenue, décret
 * n° 2016-382 art. 4, ou estimation) réduit la retenue.
 */
export const damageDecisionSchema = z.object({
  key: z.string().max(200),
  decision: z.enum(['WEAR', 'DAMAGE']).nullable(),
  costCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
  wearPct: z.number().int().min(0).max(100).nullable().optional(),
  justification: z.string().trim().max(160).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
})
export type DamageDecision = z.infer<typeof damageDecisionSchema>

export interface DamageLine {
  key: string
  room: string
  label: string
  entryState: string | null
  exitState: string | null
  exitNote: string | null
  exitPhotoIds: string[]
  decision: DamageDecision['decision']
  costCents: number | null
  wearPct: number | null
  justification: string | null
  comment: string | null
  /** Montant retenu : coût moins la part d'usure, arrondi au centime. */
  retainedCents: number
}

export const retained = (costCents: number | null | undefined, wearPct: number | null | undefined) => Math.round((costCents ?? 0) * (1 - Math.min(100, Math.max(0, wearPct ?? 0)) / 100))

/** Lignes du récapitulatif : éléments plus abîmés qu'à l'entrée, avec les décisions déjà enregistrées. */
export function damageLines(entry: InventoryData | null, exit: InventoryData, saved: DamageDecision[] = []): DamageLine[] {
  const byKey = new Map(saved.map((d) => [d.key, d]))
  return worseItems(entry, exit).map((w) => {
    const key = itemKey(w.room, w.label)
    const d = byKey.get(key)
    const decision = d?.decision ?? null
    const costCents = d?.costCents ?? null
    const wearPct = d?.wearPct ?? null
    return {
      key,
      room: w.room,
      label: w.label,
      entryState: w.entryState,
      exitState: w.exitState,
      exitNote: w.note,
      exitPhotoIds: w.photoIds,
      decision,
      costCents,
      wearPct,
      justification: d?.justification ?? null,
      comment: d?.comment ?? null,
      retainedCents: decision === 'DAMAGE' ? retained(costCents, wearPct) : 0,
    }
  })
}

/** Ce qui manque pour qu'une ligne soit complète (null si rien) : une décision, et pour une dégradation un coût justifié. */
export function lineMissing(l: Pick<DamageLine, 'decision' | 'costCents' | 'justification'>): string | null {
  if (!l.decision) return 'Indiquez s’il s’agit d’usure normale ou d’une dégradation.'
  if (l.decision === 'DAMAGE' && !l.costCents) return 'Indiquez le coût de la réparation.'
  if (l.decision === 'DAMAGE' && !l.justification?.trim()) return 'Indiquez le justificatif (devis, facture) : une retenue doit être justifiée.'
  return null
}

/** Retenues pour le solde de tout compte (lettre DEPOSIT_RETURN). */
export function damageDeductions(lines: DamageLine[]): Array<{ label: string; justification: string; amountCents: number }> {
  return lines
    .filter((l) => l.decision === 'DAMAGE' && l.retainedCents > 0)
    .map((l) => ({
      label: `${l.room}, ${l.label.charAt(0).toLowerCase()}${l.label.slice(1)}${l.wearPct ? ` (coût ${(l.costCents! / 100).toFixed(2).replace('.', ',')} €, usure ${l.wearPct} % déduite)` : ''}`.slice(0, 200),
      justification: (l.justification ?? '').slice(0, 160),
      amountCents: l.retainedCents,
    }))
}
