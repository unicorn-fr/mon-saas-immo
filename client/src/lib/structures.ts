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
