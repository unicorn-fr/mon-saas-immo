import type { Civility, LandlordKind } from './contract'

type N<T> = T | null | undefined

/** Structure qui détient des logements : mêmes champs que le serveur (server/src/domain/structure.ts). */
export interface StructureFile {
  name?: N<string>
  kind?: N<LandlordKind>
  sciFamily?: N<boolean>
  coOwners?: N<Array<{ civility?: N<Civility>; firstNames?: N<string>; lastName?: N<string> }>>
  company?: N<{ name?: N<string>; form?: N<string>; siren?: N<string>; seat?: N<string>; representedBy?: N<string>; representativeRole?: N<string> }>
  taxRegime?: N<'IR' | 'IS'>
  associates?: N<Array<{ name?: N<string>; sharePct?: N<number> }>>
  payment?: N<{ holder?: N<string>; iban?: N<string> }>
}

export interface StructureView {
  id: string
  name: string
  file: StructureFile
  effects: string[]
  shares: { total: number; complete: boolean }
  taxRegime: 'IR' | 'IS'
  properties: Array<{ id: string; name: string }>
}

export const KIND_OPTIONS: Array<{ value: LandlordKind; label: string }> = [
  { value: 'PERSON', label: 'En mon nom' },
  { value: 'COUPLE', label: 'À plusieurs (couple, indivision)' },
  { value: 'SCI', label: 'Une SCI' },
  { value: 'COMPANY', label: 'Une autre société' },
]

export const isCompany = (k: N<LandlordKind>) => k === 'SCI' || k === 'COMPANY'

export const TAX_LABEL = { IR: 'Impôt sur le revenu', IS: 'Impôt sur les sociétés' } as const

/** Ce que la structure change pour le bail (repris de server/src/domain/structure.ts, structureEffects). */
export function effectsOf(kind: LandlordKind, sciFamily: boolean): string[] {
  const legal = kind === 'COMPANY' || (kind === 'SCI' && !sciFamily)
  const out = [legal ? 'Bail vide de 6 ans au moins (société).' : 'Bail vide de 3 ans au moins.', 'Bail meublé de 1 an.']
  if (legal) out.push('Pas de congé pour reprendre le logement : seulement pour le vendre ou pour un motif légitime et sérieux.')
  else if (kind === 'SCI') out.push('Congé pour reprise possible au profit d’un associé seulement.')
  else out.push('Congé pour reprise possible pour vous ou un proche.')
  return out
}
