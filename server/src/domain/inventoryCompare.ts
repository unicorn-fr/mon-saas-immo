import { STATES, type InventoryData } from './inventory.js'

/**
 * État des lieux de sortie comparé à l'entrée (décret n° 2016-382 du 30 mars 2016, art. 3 : même présentation que
 * l'entrée pour permettre la comparaison, et évolution de l'état de chaque pièce depuis l'entrée).
 * Rapprochement par nom de pièce puis par élément ; un état plus mauvais qu'à l'entrée est « à regarder » : ce n'est pas
 * forcément une dégradation à la charge du locataire (usure normale, vétusté).
 */
export type Change = 'SAME' | 'WORSE' | 'BETTER' | 'NEW' | 'UNKNOWN'

export interface ItemComparison {
  entryState: string | null
  entryNote: string | null
  entryPhotoIds: string[]
  change: Change
}

const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
const rank = (state: string | null | undefined) => (state ? (STATES as readonly string[]).indexOf(state) : -1)

/** Évolution d'un élément : NEW s'il n'existait pas à l'entrée, UNKNOWN si l'un des deux états manque. */
export function changeOf(entryState: string | null | undefined, exitState: string | null | undefined, existedAtEntry = true): Change {
  if (!existedAtEntry) return 'NEW'
  const a = rank(entryState)
  const b = rank(exitState)
  if (a < 0 || b < 0) return 'UNKNOWN'
  return b > a ? 'WORSE' : b < a ? 'BETTER' : 'SAME'
}

export const CHANGE_LABEL: Record<Change, string> = { SAME: 'Identique', WORSE: 'À regarder', BETTER: 'Meilleur', NEW: 'Nouveau', UNKNOWN: '' }

/** Pour chaque pièce et élément de la sortie, ce qui avait été relevé à l'entrée. Clé : « pièce/élément ». */
export function compareWithEntry(entry: InventoryData | null, exit: InventoryData): Record<string, ItemComparison> {
  const out: Record<string, ItemComparison> = {}
  const entryRooms = new Map((entry?.rooms ?? []).map((r) => [norm(r.name), r]))
  for (const room of exit.rooms ?? []) {
    const er = entryRooms.get(norm(room.name))
    const items = new Map((er?.items ?? []).map((i) => [norm(i.label), i]))
    for (const it of room.items) {
      const ei = items.get(norm(it.label))
      out[itemKey(room.name, it.label)] = {
        entryState: ei?.state ?? null,
        entryNote: ei?.note ?? null,
        entryPhotoIds: ei?.photoIds ?? [],
        change: entry ? changeOf(ei?.state, it.state, Boolean(ei)) : 'UNKNOWN',
      }
    }
  }
  return out
}

export const itemKey = (room: string, label: string) => `${norm(room)}/${norm(label)}`

/** Résumé : éléments plus abîmés qu'à l'entrée, pièce par pièce (base du récapitulatif des dégradations). */
export function worseItems(entry: InventoryData | null, exit: InventoryData): Array<{ room: string; label: string; entryState: string | null; exitState: string | null; note: string | null; photoIds: string[] }> {
  const cmp = compareWithEntry(entry, exit)
  return (exit.rooms ?? []).flatMap((r) =>
    r.items
      .filter((it) => cmp[itemKey(r.name, it.label)]?.change === 'WORSE')
      .map((it) => ({ room: r.name, label: it.label, entryState: cmp[itemKey(r.name, it.label)].entryState, exitState: it.state ?? null, note: it.note ?? null, photoIds: it.photoIds ?? [] })),
  )
}

/** Compteurs : index d'entrée en regard de l'index de sortie, et consommation si les deux sont des nombres. */
export function meterComparison(entry: InventoryData | null, exit: InventoryData): Record<string, { entryIndex: string | null; consumption: number | null }> {
  const entryMeters = new Map((entry?.meters ?? []).map((m) => [m.key, m]))
  const num = (v: string | null | undefined) => {
    const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'))
    return v && Number.isFinite(n) ? n : null
  }
  return Object.fromEntries(
    (exit.meters ?? []).map((m) => {
      const e = entryMeters.get(m.key)
      const a = num(e?.index)
      const b = num(m.index)
      return [m.key, { entryIndex: e?.index || null, consumption: a !== null && b !== null && b >= a ? Math.round((b - a) * 1000) / 1000 : null }]
    }),
  )
}
