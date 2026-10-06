/**
 * Aides et dispositifs, logement par logement : ce qui s'applique, pourquoi, et comment le demander.
 * Bailio oriente ; la décision revient à l'organisme (simulateurs officiels en lien). Fiches et sources :
 * docs/fiscalite/aides.md. Chiffres vérifiés en octobre 2026 :
 * - Visale (service-public.gouv.fr F33453, mis à jour le 23 janvier 2026) : 30 ans ou moins, quel que soit le statut ;
 *   plus de 30 ans salarié du privé depuis moins de 6 mois, ou gagnant au plus 1 710 € nets par mois, ou muté depuis
 *   moins de 6 mois, ou avec une promesse d'embauche ; loyer charges comprises au plus 1 940 € en Île-de-France,
 *   1 575 € dans les agglomérations de plus de 100 000 habitants, 1 365 € ailleurs, et au plus la moitié des
 *   ressources ; visa avant la signature du bail ; pas de caution en plus ; couverture des 3 premières années.
 * - MaPrimeRénov' (Anah, « Les aides financières en 2026 », septembre 2026) : rénovation d'ampleur pour un logement
 *   E, F ou G de plus de 15 ans en métropole, gain d'au moins 2 classes, 2 gestes d'isolation, Mon Accompagnateur
 *   Rénov' obligatoire ; personnes morales exclues ; location en résidence principale 6 ans ; aide déduite d'une
 *   éventuelle hausse de loyer. Éco-PTZ jusqu'à 50 000 €, sans intérêts, 20 ans au plus.
 * - Loc'Avantages (même guide, p. 28-29) : réduction d'impôt de 15 % à 65 % des loyers bruts, jusqu'au 31 décembre
 *   2027, location vide à loyer plafonné à un locataire modeste, convention de 6 ans avec l'Anah, étiquette E au moins
 *   sans travaux.
 * - Aide au logement versée au bailleur (CAF, guide du bailleur) : déduire l'aide du loyer demandé, signaler un impayé
 *   dans les 3 mois après qu'il est constitué (3 mois de suite sans la part du locataire, ou dette égale à 2 mois de
 *   loyer et charges), signaler le départ, rembourser ce qui a été versé à tort.
 */

export type AidKey = 'VISALE' | 'RENOVATION' | 'LOC_AVANTAGES' | 'HOUSING_AID'
/** LIKELY : semble ouvert ; CHECK : à vérifier sur le simulateur ; NOT : ne s'applique pas ; INFO : bon à savoir. */
export type AidStatus = 'LIKELY' | 'CHECK' | 'NOT' | 'INFO'

export interface Aid {
  key: AidKey
  title: string
  status: AidStatus
  summary: string
  reasons: string[]
  steps: string[]
  links: Array<{ label: string; url: string }>
}

export interface AidInput {
  today: string
  dpe?: string | null
  furnished: boolean
  /** Département (deux premiers chiffres du code postal). */
  department?: string | null
  constructionPeriod?: string | null
  /** Le logement appartient à une société (SCI, SARL…) : personne morale. */
  company: boolean
  rentCents?: number | null
  chargesCents?: number | null
  /** Bail en préparation (pas encore signé) : Visale se demande avant la signature. */
  leaseDraft: boolean
  leaseActive: boolean
  tenant?: { birthDate?: string | null; situation?: string | null; monthlyIncomeCents?: number | null; guarantee?: string | null } | null
}

export const LOC_AVANTAGES_END = '2027-12-31'
const IDF = new Set(['75', '77', '78', '91', '92', '93', '94', '95'])
const VISALE_CAP = { IDF: 194_000, BIG_CITY: 157_500, OTHER: 136_500 }
const VISALE_SALARY_CAP = 171_000

const LINKS = {
  visale: { label: 'Visale (Action Logement)', url: 'https://www.visale.fr/' },
  visaleSp: { label: 'Garantie Visale (service-public.gouv.fr)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33453' },
  franceRenov: { label: 'France Rénov’ : rendez-vous et dépôt de la demande', url: 'https://france-renov.gouv.fr/' },
  anahGuide: { label: 'Les aides financières en 2026 (Anah, PDF)', url: 'https://www.anah.gouv.fr/sites/default/files/2026-08/202609_guide-aides-financieres_WEB.pdf' },
  locAvantages: { label: 'Loc’Avantages : simulateur sur France Rénov’', url: 'https://france-renov.gouv.fr/' },
  cafBailleur: { label: 'Guide du bailleur (CAF)', url: 'https://www.caf.fr/sites/default/files/medias/cnaf/Partenaires/Partenaires_Logement/guidebailleur.pdf' },
}

/** Âge en années pleines à une date. */
export function ageAt(birthDate: string, date: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [y, m, d] = date.split('-').map(Number)
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0)
}

const eur = (c: number) => `${Math.round(c / 100).toLocaleString('fr-FR')} €`

export function visaleAid(i: AidInput): Aid {
  const reasons: string[] = []
  const rent = (i.rentCents ?? 0) + (i.chargesCents ?? 0)
  const idf = Boolean(i.department && IDF.has(i.department))
  let status: AidStatus = 'CHECK'
  const t = i.tenant
  if (t?.guarantee === 'VISALE') {
    status = 'INFO'
    reasons.push('Votre locataire a déjà indiqué Visale comme garantie.')
  } else if (!i.leaseDraft) {
    status = 'INFO'
    reasons.push('Visale se demande avant la signature du bail : pensez-y pour votre prochain locataire.')
  } else {
    const age = t?.birthDate ? ageAt(t.birthDate, i.today) : null
    if (age !== null && age <= 30) {
      status = 'LIKELY'
      reasons.push(`Votre locataire a ${age} ans : Visale est ouverte jusqu’à 30 ans, quelle que soit sa situation (étudiant, alternant, salarié…).`)
    } else if (age !== null && t?.situation === 'EMPLOYEE' && t.monthlyIncomeCents && t.monthlyIncomeCents <= VISALE_SALARY_CAP) {
      status = 'LIKELY'
      reasons.push(`Votre locataire est salarié et gagne ${eur(t.monthlyIncomeCents)} nets par mois : au-delà de 30 ans, Visale est ouverte jusqu’à ${eur(VISALE_SALARY_CAP)}.`)
    } else if (age !== null && t?.situation === 'EMPLOYEE') {
      reasons.push('Au-delà de 30 ans, Visale reste ouverte à un salarié du privé embauché ou muté depuis moins de 6 mois, ou avec une promesse d’embauche.')
    } else if (age !== null) {
      status = 'NOT'
      reasons.push(`Votre locataire a ${age} ans : au-delà de 30 ans, Visale est réservée aux salariés du privé (et aux saisonniers).`)
    } else {
      reasons.push('Indiquez la date de naissance et la situation de votre locataire dans sa fiche : Bailio vous dira si Visale est ouverte.')
    }
    if (rent && status !== 'NOT') {
      const cap = idf ? VISALE_CAP.IDF : VISALE_CAP.BIG_CITY
      if (rent > cap) {
        status = 'NOT'
        reasons.push(`Le loyer charges comprises (${eur(rent)}) dépasse le plafond garanti de ${eur(cap)}${idf ? ' en Île-de-France' : ''}.`)
      } else if (!idf && rent > VISALE_CAP.OTHER) {
        status = 'CHECK'
        reasons.push(`Le loyer (${eur(rent)}) dépasse ${eur(VISALE_CAP.OTHER)} : il n’est garanti que dans les agglomérations de plus de 100 000 habitants.`)
      }
      if (t?.monthlyIncomeCents && rent > t.monthlyIncomeCents / 2 && t.situation !== 'STUDENT' && t.situation !== 'APPRENTICE') {
        status = 'NOT'
        reasons.push(`Le loyer dépasse la moitié des revenus déclarés de votre locataire (${eur(t.monthlyIncomeCents)} par mois).`)
      }
    }
  }
  return {
    key: 'VISALE',
    title: 'Visale, la garantie gratuite contre les impayés',
    status,
    summary: 'Action Logement se porte garant de votre locataire, gratuitement : loyers impayés pendant les 3 premières années, et dégradations jusqu’à 2 mois de loyer.',
    reasons,
    steps: [
      'Votre locataire fait sa demande sur visale.fr et obtient un visa.',
      'Vous vérifiez le visa sur visale.fr, avant de signer le bail.',
      'Vous ne demandez pas de caution en plus.',
      'En cas d’impayé : mise en demeure à votre locataire, puis déclaration sur visale.fr.',
    ],
    links: [LINKS.visaleSp, LINKS.visale],
  }
}

export function renovationAid(i: AidInput): Aid {
  const reasons: string[] = []
  const dpe = i.dpe ?? null
  const recent = i.constructionPeriod === 'AFTER_2005'
  let status: AidStatus
  if (!dpe) {
    status = 'CHECK'
    reasons.push('Indiquez la classe du DPE dans la fiche du logement.')
  } else if (['E', 'F', 'G'].includes(dpe)) {
    status = i.company ? 'CHECK' : 'LIKELY'
    reasons.push(`Logement classé ${dpe} : MaPrimeRénov’ finance une rénovation d’ampleur qui le fait gagner au moins 2 classes.`)
    if (dpe === 'G') reasons.push('Un logement G ne peut plus être loué depuis le 1er janvier 2025.')
    if (dpe === 'F') reasons.push('Un logement F ne pourra plus être loué à partir du 1er janvier 2028.')
    if (dpe === 'E') reasons.push('Un logement E ne pourra plus être loué à partir du 1er janvier 2034.')
  } else {
    status = 'INFO'
    reasons.push(`Logement classé ${dpe} : pas de rénovation d’ampleur, mais MaPrimeRénov’ par geste peut aider à remplacer le chauffage par un système décarboné.`)
  }
  if (i.company) reasons.push('Le logement appartient à une société : MaPrimeRénov’ est fermée aux personnes morales. L’éco-prêt à taux zéro reste possible pour une société civile à l’impôt sur le revenu.')
  if (recent) reasons.push('Construit après 2005 : MaPrimeRénov’ demande un logement de plus de 15 ans, à vérifier.')
  return {
    key: 'RENOVATION',
    title: 'Rénovation énergétique : MaPrimeRénov’ et éco-prêt',
    status,
    summary: 'Des aides pour les travaux qui font baisser la consommation du logement, et un prêt sans intérêts jusqu’à 50 000 € sur 20 ans au plus.',
    reasons,
    steps: [
      'Prenez rendez-vous avec un conseiller France Rénov’ (obligatoire avant la demande).',
      'Pour une rénovation d’ampleur, choisissez un Accompagnateur Rénov’ : il fait l’audit et monte le dossier.',
      'Déposez la demande sur france-renov.gouv.fr avant de commencer les travaux, avec des devis d’artisans RGE.',
      'En échange : louer le logement en résidence principale pendant 6 ans, et déduire l’aide d’une éventuelle hausse de loyer.',
    ],
    links: [LINKS.franceRenov, LINKS.anahGuide],
  }
}

export function locAvantagesAid(i: AidInput): Aid {
  const reasons: string[] = []
  let status: AidStatus = 'CHECK'
  if (i.today > LOC_AVANTAGES_END) {
    status = 'NOT'
    reasons.push('Le dispositif prenait fin le 31 décembre 2027, sauf prolongation.')
  } else if (i.furnished) {
    status = 'NOT'
    reasons.push('Loc’Avantages est réservé à la location vide.')
  } else if (i.dpe && ['F', 'G'].includes(i.dpe)) {
    status = 'NOT'
    reasons.push(`Logement classé ${i.dpe} : il faut au moins E sans travaux, ou D après des travaux aidés par l’Anah.`)
  } else {
    reasons.push('Location vide : vous pouvez louer sous un plafond de loyer fixé pour votre commune, à un locataire aux revenus modestes.')
    if (!i.dpe) reasons.push('Indiquez la classe du DPE : il faut au moins E.')
  }
  return {
    key: 'LOC_AVANTAGES',
    title: 'Loc’Avantages, une réduction d’impôt contre un loyer modéré',
    status,
    summary: 'Réduction d’impôt de 15 % à 65 % des loyers encaissés, selon le niveau du loyer, si vous louez moins cher que le marché à un ménage modeste, pendant 6 ans.',
    reasons,
    steps: [
      'Comparez sur le simulateur de l’Anah le loyer plafonné de votre commune et la réduction d’impôt.',
      'Signez une convention avec l’Anah avant ou pendant le bail, pour 6 ans.',
      'Louez vide, en résidence principale, à un locataire sous les plafonds de ressources, hors de votre famille.',
      'Déclarez la réduction chaque année avec vos revenus.',
    ],
    links: [LINKS.locAvantages, LINKS.anahGuide],
  }
}

export function housingAid(i: AidInput): Aid {
  return {
    key: 'HOUSING_AID',
    title: 'Aide au logement de votre locataire versée à vous',
    status: i.leaseActive || i.leaseDraft ? 'INFO' : 'NOT',
    summary: 'Si votre locataire touche l’APL ou l’allocation logement, la CAF ou la MSA peut vous la verser directement. Vous la déduisez du loyer que vous lui demandez.',
    reasons: [],
    steps: [
      'L’APL vous est versée directement ; l’allocation logement aussi si vous le demandez à la CAF.',
      'Demandez à votre locataire seulement le reste du loyer et des charges.',
      'Impayé constitué (3 mois de suite sans sa part, ou une dette de 2 mois de loyer et charges) : signalez-le à la CAF dans les 3 mois.',
      'Signalez son départ, et remboursez ce qui a été versé à tort.',
    ],
    links: [LINKS.cafBailleur],
  }
}

/** Les quatre aides, dans l'ordre : ce qui semble ouvert d'abord, ce qui ne s'applique pas à la fin. */
export function aidsFor(i: AidInput): Aid[] {
  const order: Record<AidStatus, number> = { LIKELY: 0, CHECK: 1, INFO: 2, NOT: 3 }
  return [visaleAid(i), renovationAid(i), locAvantagesAid(i), housingAid(i)].sort((a, b) => order[a.status] - order[b.status])
}
