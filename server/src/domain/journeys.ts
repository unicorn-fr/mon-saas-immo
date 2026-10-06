import { formatDateFr, parseIsoDate } from './lease.js'
import type { LeaseKind } from './contract.js'
import { depositDeadline, letterAllowed } from './letters.js'

/**
 * Parcours guidés « Que se passe-t-il ? » : pour une situation, les étapes dans l'ordre, avec la date limite
 * et l'état de chacune, déduit de ce que Bailio sait déjà (courriers enregistrés, loyers, états des lieux).
 * Le propriétaire n'a rien à cocher à la main, sauf ce qui se passe hors de Bailio (commandement de payer…).
 */

export type JourneyKind = 'DEPARTURE' | 'UNPAID' | 'SALE' | 'PROBLEM'
export type StepStatus = 'DONE' | 'TODO' | 'LATER' | 'OPTIONAL' | 'NA'

export type StepAction = { type: 'LETTER'; letter: string } | { type: 'INVENTORY' } | { type: 'END_LEASE' } | { type: 'MANUAL' } | { type: 'NONE' }

export interface JourneyStep {
  key: string
  title: string
  text: string
  status: StepStatus
  /** Date limite ou date conseillée (ISO). */
  due?: string | null
  doneAt?: string | null
  action: StepAction
}

export interface Journey {
  kind: JourneyKind
  title: string
  intro: string
  /** Alerte en tête du parcours (trêve hivernale, date limite dépassée…). */
  alert?: string | null
  steps: JourneyStep[]
}

export interface JourneyInput {
  today: string
  leaseKind: LeaseKind
  status: 'DRAFT' | 'ACTIVE' | 'ENDED' | 'IMPORTED'
  /** Prochaine échéance du bail. */
  leaseEnd: string
  /** Délai de congé du bailleur, en mois (null : le bail prend fin seul). */
  noticeMonths: number | null
  unpaid: { period: string; label: string; missing: number }[]
  /** Courriers enregistrés pour ce bail (type, date). */
  letters: { type: string; date: string }[]
  inventories: { kind: 'ENTRY' | 'EXIT'; status: 'DRAFT' | 'SIGNED'; date: string | null }[]
  hasGuarantor: boolean
  facts: {
    tenantNotice?: { receivedDate: string; reduced: boolean; reducedReason: string | null; endDate: string }
    landlordNotice?: { reason: string; leaseEnd: string; date: string }
    keysDate?: string
    journeyDone?: Record<string, string>
  }
}

const fr = (iso: string) => formatDateFr(parseIsoDate(iso))
const addDays = (iso: string, days: number) => {
  const d = parseIsoDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
const addMonths = (iso: string, months: number) => {
  const d = parseIsoDate(iso)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate())).toISOString().slice(0, 10)
}

/** Dernier courrier d'un type, enregistré à partir d'une date. */
function lastLetter(input: JourneyInput, type: string, since?: string) {
  return input.letters.filter((l) => l.type === type && (!since || l.date >= since)).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

/** Trêve hivernale : aucune expulsion du 1er novembre au 31 mars. */
export function inWinterTruce(iso: string): boolean {
  const m = Number(iso.slice(5, 7))
  return m >= 11 || m <= 3
}

export function buildJourney(kind: JourneyKind, input: JourneyInput): Journey {
  const journey = journeyFor(kind, input)
  if (input.leaseKind !== 'PARKING') return journey
  // Garage loué seul : seulement les courriers qui ont un sens hors de la loi de 1989, sans les aides au logement.
  return { ...journey, steps: journey.steps.filter((s) => (s.action.type !== 'LETTER' || letterAllowed(s.action.letter as never, 'PARKING')) && s.key !== 'help') }
}

function journeyFor(kind: JourneyKind, input: JourneyInput): Journey {
  switch (kind) {
    case 'DEPARTURE':
      return departure(input)
    case 'UNPAID':
      return unpaid(input)
    case 'SALE':
      return sale(input)
    case 'PROBLEM':
      return problem(input)
  }
}

function departure(input: JourneyInput): Journey {
  const notice = input.facts.tenantNotice
  const exit = input.inventories.find((i) => i.kind === 'EXIT')
  const ended = input.status === 'ENDED'
  const keys = input.facts.keysDate ?? (exit?.status === 'SIGNED' ? exit.date : null) ?? notice?.endDate ?? null
  const proofNeeded = Boolean(notice?.reduced && !/zone tendue/i.test(notice.reducedReason ?? '')) && input.leaseKind === 'VIDE'
  const proof = lastLetter(input, 'SHORT_NOTICE_PROOF', notice?.receivedDate)
  const settle = lastLetter(input, 'DEPOSIT_RETURN', notice?.receivedDate)
  const deadline = keys ? depositDeadline(keys, true).toISOString().slice(0, 10) : null
  return {
    kind: 'DEPARTURE',
    title: 'Mon locataire part',
    intro: notice ? `Congé reçu le ${fr(notice.receivedDate)} : le préavis prend fin le ${fr(notice.endDate)}.` : 'Quatre étapes, dans l’ordre. Bailio reprend à chaque fois ce que vous avez déjà indiqué.',
    alert: settle || !deadline || deadline >= input.today || input.leaseKind === 'PARKING' ? null : `La date limite de restitution du dépôt de garantie (${fr(deadline)}) est dépassée : le locataire peut réclamer 10 % du loyer par mois de retard.`,
    steps: [
      {
        key: 'ack',
        title: 'Accuser réception du congé',
        text: notice ? `Préavis ${input.leaseKind === 'PARKING' ? 'prévu au contrat' : notice.reduced ? 'réduit à un mois' : input.leaseKind === 'VIDE' ? 'de trois mois' : 'd’un mois'}, jusqu’au ${fr(notice.endDate)}.` : 'Indiquez la date de réception de sa lettre : Bailio calcule la fin du préavis.',
        status: notice ? 'DONE' : 'TODO',
        doneAt: notice?.receivedDate ?? null,
        action: { type: 'LETTER', letter: 'TENANT_NOTICE' },
      },
      {
        key: 'proof',
        title: 'Demander le justificatif du préavis d’un mois',
        text: proofNeeded ? `Motif invoqué : ${notice?.reducedReason ?? 'non précisé'}. Sans justificatif, le préavis est de trois mois.` : 'Seulement si le locataire demande un préavis réduit sans le justifier (hors zone tendue).',
        status: !proofNeeded ? 'NA' : proof ? 'DONE' : 'TODO',
        doneAt: proof?.date ?? null,
        action: { type: 'LETTER', letter: 'SHORT_NOTICE_PROOF' },
      },
      {
        key: 'exit',
        title: 'Faire l’état des lieux de sortie',
        text: input.leaseKind === 'PARKING' ? 'Ensemble, le jour de la remise des clés et des badges.' : 'Ensemble, le jour de la remise des clés. Bailio reprend l’état des lieux d’entrée pour comparer, pièce par pièce.',
        status: exit?.status === 'SIGNED' ? 'DONE' : notice ? 'TODO' : 'LATER',
        due: notice?.endDate ?? null,
        doneAt: exit?.status === 'SIGNED' ? exit.date : null,
        action: { type: 'INVENTORY' },
      },
      {
        key: 'end',
        title: 'Enregistrer le départ',
        text: 'Date de remise des clés et nouvelle adresse du locataire : les loyers s’arrêtent et le bail passe dans l’historique.',
        status: ended ? 'DONE' : exit?.status === 'SIGNED' || notice ? 'TODO' : 'LATER',
        due: notice?.endDate ?? null,
        doneAt: ended ? keys : null,
        action: { type: 'END_LEASE' },
      },
      {
        key: 'settle',
        title: 'Envoyer le solde de tout compte',
        text: 'Dépôt de garantie, retenues justifiées, loyers restant dus et charges : un seul document, avec la somme à rendre.',
        status: settle ? 'DONE' : ended || exit?.status === 'SIGNED' ? 'TODO' : 'LATER',
        due: deadline,
        doneAt: settle?.date ?? null,
        action: { type: 'LETTER', letter: 'DEPOSIT_RETURN' },
      },
    ],
  }
}

function unpaid(input: JourneyInput): Journey {
  const first = input.unpaid[0]
  const total = input.unpaid.reduce((a, u) => a + u.missing, 0)
  const since = first ? `${first.period}-01` : undefined
  const reminder = lastLetter(input, 'REMINDER', since)
  const formal = lastLetter(input, 'FORMAL_NOTICE', since)
  const call = lastLetter(input, 'GUARANTOR_CALL', since)
  const command = input.facts.journeyDone?.['UNPAID.command'] ?? null
  const truce = inWinterTruce(input.today)
  return {
    kind: 'UNPAID',
    title: 'Mon locataire ne paie pas',
    intro: input.unpaid.length ? `Loyers non réglés : ${input.unpaid.map((u) => u.label).join(', ')}.` : 'Aucun loyer impayé n’est enregistré pour ce bail. Si un paiement manque, indiquez-le dans les loyers du bail.',
    alert: truce ? 'Trêve hivernale (1er novembre – 31 mars) : les démarches restent possibles, mais aucune expulsion ne peut avoir lieu pendant cette période.' : null,
    steps: [
      {
        key: 'reminder',
        title: 'Relance amiable',
        text: 'Un message courtois : souvent un simple oubli. Proposez d’en parler si le locataire est en difficulté.',
        status: !input.unpaid.length ? 'LATER' : reminder ? 'DONE' : 'TODO',
        doneAt: reminder?.date ?? null,
        action: { type: 'LETTER', letter: 'REMINDER' },
      },
      {
        key: 'formal',
        title: 'Mise en demeure',
        text: `En lettre recommandée${total ? `, pour ${(total / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : ''}. Conseillée une quinzaine de jours après la relance restée sans effet.`,
        status: !input.unpaid.length ? 'LATER' : formal ? 'DONE' : reminder ? 'TODO' : 'LATER',
        due: reminder ? addDays(reminder.date, 15) : null,
        doneAt: formal?.date ?? null,
        action: { type: 'LETTER', letter: 'FORMAL_NOTICE' },
      },
      {
        key: 'guarantor',
        title: 'Appel à la caution',
        text: input.hasGuarantor ? 'Le garant paie à la place du locataire, selon son engagement.' : 'Aucun garant n’est enregistré pour ce bail.',
        status: !input.hasGuarantor ? 'NA' : !input.unpaid.length ? 'LATER' : call ? 'DONE' : formal ? 'TODO' : 'LATER',
        doneAt: call?.date ?? null,
        action: { type: 'LETTER', letter: 'GUARANTOR_CALL' },
      },
      {
        key: 'command',
        title: 'Commandement de payer par un commissaire de justice',
        text: 'Il laisse six semaines au locataire pour payer et déclenche la clause résolutoire. Le commissaire le signifie aussi au garant dans les 15 jours. Indiquez-le ici quand c’est fait.',
        status: !input.unpaid.length ? 'LATER' : command ? 'DONE' : formal ? 'TODO' : 'LATER',
        doneAt: command,
        action: { type: 'MANUAL' },
      },
      {
        key: 'help',
        title: 'Orienter vers les aides',
        text: 'Le fonds de solidarité pour le logement (FSL) et l’ADIL du département peuvent aider votre locataire à régler sa dette. Le commissaire de justice signale le commandement à la commission de prévention des expulsions (CCAPEX).',
        status: 'OPTIONAL',
        action: { type: 'NONE' },
      },
    ],
  }
}

function sale(input: JourneyInput): Journey {
  const months = input.noticeMonths
  const deadline = months ? addMonths(input.leaseEnd, -months) : null
  const given = input.facts.landlordNotice
  const ownerChange = lastLetter(input, 'OWNER_CHANGE')
  const late = deadline && deadline < input.today && !given
  return {
    kind: 'SALE',
    title: input.leaseKind === 'PARKING' ? 'Je veux récupérer ou vendre l’emplacement' : 'Je veux vendre ou reprendre le logement',
    intro: months
      ? `Prochaine fin du bail : ${fr(input.leaseEnd)}. Le congé doit être reçu au plus tard le ${fr(deadline!)}, ${months} mois avant.`
      : 'Ce bail prend fin tout seul à son terme : aucun congé n’est nécessaire.',
    alert: late
      ? input.leaseKind === 'PARKING'
        ? 'La date limite du congé pour cette échéance est passée : le contrat sera reconduit. Le prochain congé sera possible pour la fin de la période suivante.'
        : `La date limite du congé pour cette échéance est passée : le bail sera reconduit. Le prochain congé sera possible pour le ${fr(addMonths(input.leaseEnd, input.leaseKind === 'VIDE' ? 36 : 12))}.`
      : null,
    steps: [
      {
        key: 'notice',
        title: input.leaseKind === 'PARKING' ? 'Donner congé pour la fin du contrat' : 'Vendre libre ou reprendre : donner congé',
        text: input.leaseKind === 'PARKING' ? 'Garage loué seul : le congé n’a pas à être motivé, il suffit de respecter le préavis du contrat.' : input.leaseKind === 'VIDE' ? 'Pour vendre, le congé vaut offre de vente au locataire, qui est prioritaire. Bailio joint la notice officielle et recopie l’article de loi obligatoire.' : 'En meublé, le congé est motivé mais le locataire n’a pas de priorité pour acheter.',
        status: !months ? 'NA' : given ? 'DONE' : 'TODO',
        due: deadline,
        doneAt: given?.date ?? null,
        action: { type: 'LETTER', letter: 'NOTICE_TO_LEAVE' },
      },
      {
        key: 'occupied',
        title: 'Vendre avec le locataire en place : le prévenir après la vente',
        text: 'Le bail continue avec l’acheteur, qui reprend aussi le dépôt de garantie. Aucun congé n’est nécessaire.',
        status: ownerChange ? 'DONE' : 'OPTIONAL',
        doneAt: ownerChange?.date ?? null,
        action: { type: 'LETTER', letter: 'OWNER_CHANGE' },
      },
    ],
  }
}

function problem(input: JourneyInput): Journey {
  const step = (key: string, title: string, text: string, letter: string): JourneyStep => {
    const l = lastLetter(input, letter)
    return { key, title, text, status: 'OPTIONAL', doneAt: l?.date ?? null, action: { type: 'LETTER', letter } }
  }
  return {
    kind: 'PROBLEM',
    title: 'Un problème dans le logement',
    intro: 'Choisissez le courrier qui correspond. Il est déjà rempli avec les informations du bail.',
    steps: [
      step('damage', 'Des dégradations', 'Demander au locataire de réparer ce qui relève de l’entretien courant ou de sa responsabilité.', 'DAMAGE_REPAIR'),
      step('nuisance', 'Un trouble de voisinage', 'Mettre en demeure de faire cesser le trouble : la loi vous oblige à agir.', 'NUISANCE'),
      step('insurance', 'L’assurance du locataire', 'Demander l’attestation annuelle d’assurance habitation.', 'INSURANCE'),
      step('boiler', 'L’entretien de la chaudière', 'Demander l’attestation d’entretien annuel.', 'BOILER'),
      step('smoke', 'Les détecteurs de fumée', 'Attester de leur installation, par exemple pour l’assureur.', 'SMOKE_DETECTOR'),
    ],
  }
}
