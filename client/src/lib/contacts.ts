/** Carnet et interventions (server/src/routes/contacts.ts). */

export type ContactKind = 'ARTISAN' | 'SYNDIC' | 'INSURER' | 'AGENCY' | 'OTHER'

export interface Contact {
  id: string
  kind: ContactKind
  name: string
  trade: string | null
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  interventions?: number
}

export interface Intervention {
  id: string
  propertyId: string
  title: string
  description: string | null
  status: 'TODO' | 'PLANNED' | 'DONE'
  date: string | null
  costCents: number | null
  expenseId: string | null
  contact: { id: string; name: string; trade: string | null; phone: string | null } | null
}

export const CONTACT_KIND: Record<ContactKind, string> = {
  ARTISAN: 'Artisans',
  SYNDIC: 'Syndic',
  INSURER: 'Assurances',
  AGENCY: 'Agences et gestion',
  OTHER: 'Autres',
}

export const INTERVENTION_STATUS: Record<Intervention['status'], string> = { TODO: 'À organiser', PLANNED: 'Prévue', DONE: 'Terminée' }
