import type { PropertyFile } from './contract.js'
import { diagnosticsFor } from './rules.js'

/**
 * Dossier du logement : tout ce qu'un propriétaire doit avoir et garder, rangé par rubrique, avec ce qui manque
 * et combien de temps le conserver. Durées : service-public.gouv.fr (F19134, « Durée de conservation des papiers »)
 * et loi n° 89-462 du 6 juillet 1989, art. 7-1 (prescription de 3 ans des actions nées du bail).
 */

export const BINDER_UPLOADS = ['deed', 'propertyTax', 'ownerInsurance', 'coproRules', 'coproMinutes', 'coproCharges', 'rentalPermit', 'boiler', 'other'] as const
export type BinderUpload = (typeof BINDER_UPLOADS)[number]

export type BinderState = 'OK' | 'MISSING' | 'AUTO' | 'LATER'

export interface BinderItem {
  key: string
  label: string
  /** Pourquoi ce document compte, en une phrase. */
  why: string
  keep: string
  state: BinderState
  /** Document déjà enregistré (le plus récent). */
  docId?: string | null
  /** Ajout possible depuis le dossier (catégorie de dépôt). */
  upload?: BinderUpload | 'diagnostic'
  diagnostic?: string
  /** Page où le document se fait ou se complète. */
  to?: string
  optional?: boolean
}

export interface BinderSection {
  key: 'PROPERTY' | 'DIAGNOSTICS' | 'COPRO' | 'LEASE' | 'MONEY'
  title: string
  items: BinderItem[]
}

export interface BinderDoc {
  id: string
  kind: string
  binder?: string | null
  diagnostic?: string | null
  leaseId?: string | null
  createdAt: string
}

export interface BinderInput {
  propertyId: string
  file: PropertyFile
  docs: BinderDoc[]
  lease: null | {
    id: string
    signed: boolean
    furnished: boolean
    guarantors: number
    entryInventorySigned: boolean
    insurance: boolean
    depositReceived: boolean
    depositCents: number
    receipts: number
    boilerDate: string | null
    individualBoiler: boolean
  }
  invoices: number
}

const latest = (docs: BinderDoc[], pred: (d: BinderDoc) => boolean) => docs.filter(pred).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id ?? null

export function propertyBinder(i: BinderInput): BinderSection[] {
  const f = i.file
  const p = `/espace/logements/${i.propertyId}`
  const up = (key: BinderUpload) => latest(i.docs, (d) => d.binder === key)
  const item = (key: BinderUpload, label: string, why: string, keep: string, extra: Partial<BinderItem> = {}): BinderItem => {
    const docId = up(key)
    return { key, label, why, keep, state: docId ? 'OK' : 'MISSING', docId, upload: key, ...extra }
  }
  const sections: BinderSection[] = []

  sections.push({
    key: 'PROPERTY',
    title: 'Le logement',
    items: [
      item('deed', 'Titre de propriété (acte notarié)', 'Prouve que vous êtes propriétaire ; utile en cas de vente, de sinistre ou de litige.', 'Tant que vous êtes propriétaire'),
      item('propertyTax', 'Dernier avis de taxe foncière', 'Sert à la déclaration des revenus et à récupérer la taxe d’enlèvement des ordures ménagères sur le locataire.', 'Jusqu’à la fin de l’année suivante'),
      item('ownerInsurance', 'Assurance propriétaire non occupant', f.legalRegime === 'COPRO' ? 'Obligatoire en copropriété (loi du 10 juillet 1965, art. 9-1).' : 'Recommandée : couvre les dégâts que l’assurance du locataire ne prend pas en charge.', 'Tant que le contrat court, puis 2 ans', {
        state: up('ownerInsurance') || f.ownerInsurance?.policyNumber ? 'OK' : 'MISSING',
        optional: f.legalRegime !== 'COPRO',
      }),
      ...(f.rentalPermit?.required ? [item('rentalPermit', 'Autorisation de mise en location (permis de louer)', 'Exigée par votre commune avant de louer.', 'Tant que le logement est loué', { state: up('rentalPermit') || f.rentalPermit.reference ? 'OK' : 'MISSING' })] : []),
    ],
  })

  sections.push({
    key: 'DIAGNOSTICS',
    title: 'Diagnostics à remettre au locataire',
    items: diagnosticsFor(f)
      .filter((d) => d.required)
      .map((d) => {
        const v = f.diagnostics?.[d.key]
        const docId = v?.fileId ?? latest(i.docs, (x) => x.diagnostic === d.key)
        return {
          key: `diag.${d.key}`,
          label: d.label,
          why: d.reason,
          keep: `Valable ${d.validity}`,
          state: docId || v?.date ? 'OK' : 'MISSING',
          docId,
          upload: 'diagnostic' as const,
          diagnostic: d.key,
          to: `${p}?onglet=diagnostics`,
        }
      }),
  })

  if (f.legalRegime === 'COPRO')
    sections.push({
      key: 'COPRO',
      title: 'Copropriété',
      items: [
        item('coproRules', 'Règlement de copropriété', 'Ses extraits sur la jouissance des parties privatives et communes sont à joindre au bail.', 'Tant que vous êtes propriétaire', { state: up('coproRules') || f.copro?.extractsProvided ? 'OK' : 'MISSING' }),
        item('coproMinutes', 'Procès-verbaux des dernières assemblées générales', 'Travaux votés, charges à venir : à connaître avant de fixer les provisions.', '10 ans'),
        item('coproCharges', 'Décompte annuel des charges du syndic', 'Indispensable pour la régularisation annuelle des charges avec le locataire.', 'Durée de la location et 3 ans'),
      ],
    })

  const l = i.lease
  const leaseItems: BinderItem[] = []
  if (!l) {
    leaseItems.push({ key: 'lease', label: 'Bail signé', why: 'Créé par Bailio sur le modèle officiel, signé en ligne avec certificat de preuve.', keep: 'Durée de la location et 3 ans', state: 'LATER', to: `/espace/baux/nouveau?logement=${i.propertyId}` })
  } else {
    const leaseDoc = latest(i.docs, (d) => d.leaseId === l.id && (d.kind === 'LEASE' || d.kind === 'LEASE_IMPORTED'))
    const to = `/espace/baux/${l.id}`
    leaseItems.push(
      { key: 'lease', label: 'Bail signé et son certificat de signature', why: 'Le contrat lui-même : à produire en cas de litige.', keep: 'Durée de la location et 3 ans', state: l.signed ? 'OK' : 'LATER', docId: leaseDoc, to },
      { key: 'notice', label: 'Notice d’information (arrêté du 29 mai 2015)', why: 'Obligatoire, jointe automatiquement à la fin du bail.', keep: 'Avec le bail', state: 'AUTO', to },
      ...(l.guarantors ? [{ key: 'guarantee', label: 'Acte de cautionnement', why: 'Sans lui, le garant ne peut pas être appelé à payer.', keep: 'Durée de l’engagement et 3 ans', state: (l.signed ? 'OK' : 'LATER') as BinderState, to }] : []),
      { key: 'inventory', label: 'État des lieux d’entrée', why: 'Sans état des lieux, le logement est présumé remis en bon état : aucune retenue possible sur le dépôt.', keep: 'Durée de la location et 3 ans', state: l.entryInventorySigned ? 'OK' : l.signed ? 'MISSING' : 'LATER', to: `${to}/etat-des-lieux` },
      ...(l.furnished ? [{ key: 'furniture', label: 'Inventaire du mobilier', why: 'Obligatoire en meublé, fait avec l’état des lieux.', keep: 'Durée de la location et 3 ans', state: (l.entryInventorySigned || f.furniture?.inventory?.length ? 'OK' : l.signed ? 'MISSING' : 'LATER') as BinderState, to: `${p}/fiche#furniture` }] : []),
      ...(l.depositCents ? [{ key: 'deposit', label: 'Reçu du dépôt de garantie', why: 'Prouve le montant reçu, à restituer dans le mois (ou deux mois) après le départ.', keep: 'Durée de la location et 3 ans', state: (l.depositReceived ? 'OK' : l.signed ? 'MISSING' : 'LATER') as BinderState, to: `${to}/courriers?type=DEPOSIT_RECEIPT` }] : []),
      { key: 'insurance', label: 'Attestation d’assurance habitation du locataire', why: 'Obligatoire chaque année ; sans elle, la clause résolutoire peut jouer.', keep: 'Un an, puis la suivante', state: l.insurance ? 'OK' : l.signed ? 'MISSING' : 'LATER', to: `${to}#locataire` },
      { key: 'receipts', label: 'Quittances et loyers reçus', why: 'Faites par Bailio à chaque loyer enregistré.', keep: 'Durée de la location et 3 ans', state: l.receipts ? 'OK' : 'LATER', to: `${to}#paiements` },
      ...(l.individualBoiler ? [{ key: 'boiler', label: 'Attestation d’entretien de la chaudière', why: 'Entretien annuel obligatoire, à la charge du locataire : demandez-lui l’attestation.', keep: '2 ans', state: (l.boilerDate || up('boiler') ? 'OK' : l.signed ? 'MISSING' : 'LATER') as BinderState, docId: up('boiler'), upload: 'boiler' as const, to: `${to}#locataire` }] : []),
    )
  }
  sections.push({ key: 'LEASE', title: 'La location', items: leaseItems })

  sections.push({
    key: 'MONEY',
    title: 'Travaux et dépenses',
    items: [
      { key: 'invoices', label: 'Factures de travaux et d’entretien', why: 'Déductibles de vos revenus fonciers (régime réel) ; les gros travaux comptent aussi en cas de vente.', keep: '10 ans pour les gros travaux, 5 ans pour les autres', state: i.invoices ? 'OK' : 'LATER', to: `/espace/argent/facture?logement=${i.propertyId}`, optional: true },
    ],
  })
  return sections
}

/** Ce qui manque vraiment (hors facultatif et « plus tard »). */
export const binderMissing = (sections: BinderSection[]) => sections.flatMap((s) => s.items).filter((x) => x.state === 'MISSING' && !x.optional)
