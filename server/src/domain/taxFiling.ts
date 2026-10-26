import { declarationDeadline } from './fiscalCalendar.js'
import { resultDeadline, type SheetKind } from './structureTax.js'

/**
 * Fiche « Préparer votre dépôt » : pour chaque situation du propriétaire (location vide au micro ou au réel, meublé,
 * début d'activité en meublé, occupation des logements, SCI, société), les documents à réunir, les étapes sur
 * impots.gouv.fr, les liens directs, les dates et les contacts. Bailio ne dépose rien.
 *
 * Sources relues en octobre 2026 (docs/fiscalite/declaration.md, ligne par ligne) : impots.gouv.fr (locations
 * meublées, régimes d'imposition, SIRET du loueur en meublé, SCI, contacts, formulaires 1447-C-SD et 1208-OD-SD,
 * notices 2044, 2072-S et 2072-C de 2026, FAQ LMNP de mars 2026), BOFiP (option pour le réel), INPI (guichet unique).
 */

export interface Link {
  label: string
  url: string
}

export interface FilingGuide {
  id: 'VIDE_MICRO' | 'VIDE_REEL' | 'MEUBLE_MICRO' | 'MEUBLE_REEL' | 'MEUBLE_DEBUT' | 'OCCUPATION' | 'SCI_IR' | 'COMPANY_IR' | 'IS'
  title: string
  /** Pour qui, en une phrase. */
  summary: string
  /** Date limite, déjà écrite en français ; null si elle n'est pas encore publiée. */
  deadline: string | null
  documents: Array<{ label: string; detail?: string; bailio?: boolean }>
  steps: Array<{ title: string; detail?: string; link?: Link }>
  links: Link[]
  /** Pièges fréquents. */
  watch: string[]
  /** Nom de la structure (SCI, société) concernée. */
  structure?: string
  /** L'autre régime possible (micro ou réel), moins avantageux d'après Bailio : affiché en second. */
  alternative?: boolean
}

export interface Contact {
  label: string
  value: string
  detail: string
  url?: string
}

export interface FilingInput {
  /** Année des revenus. */
  year: number
  postalCode?: string | null
  /** Location vide en nom propre : régime le plus avantageux d'après Bailio. */
  vide: null | { regime: 'MICRO' | 'REAL'; microAllowed: boolean }
  meuble: null | { regime: 'MICRO' | 'REAL'; microAllowed: boolean }
  /** Premier bail meublé commencé dans l'année (ou après) : immatriculation et CFE à faire. */
  furnishedStart: boolean
  /** Un occupant a changé : déclaration d'occupation à faire. */
  occupancy: boolean
  structures: Array<{ name: string; kind: SheetKind }>
}

export const LINKS = {
  espace: { label: 'Votre espace particulier sur impots.gouv.fr', url: 'https://www.impots.gouv.fr/accueil' },
  pro: { label: 'Espace professionnel sur impots.gouv.fr', url: 'https://www.impots.gouv.fr/professionnel' },
  contacts: { label: 'Contacts et rendez-vous (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/contacts' },
  rdv: { label: 'Prendre rendez-vous avec votre centre des impôts', url: 'https://www.impots.gouv.fr/particulier/questions/comment-prendre-rendez-vous-avec-mon-service' },
  notice2044: { label: 'Notice de la déclaration 2044 (2026)', url: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2044/2026/2044_5487.pdf' },
  fonciers: { label: 'Dépliant « Revenus fonciers » (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/sites/default/files/media/3_Documentation/depliants/nid_4009_gp_172.pdf' },
  regimes: { label: 'Les régimes d’imposition (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/particulier/les-regimes-dimposition' },
  meubles: { label: 'Les locations meublées (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/particulier/les-locations-meublees' },
  depliantMeuble: { label: 'Dépliant « Loueurs en meublé » (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/sites/default/files/media/3_Documentation/depliants/nid_4011_gp_178.pdf' },
  faqLmnp: { label: 'Foire aux questions des locations meublées (mars 2026)', url: 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/5_international/actualite/faq-lmnp-03_2026.pdf' },
  siret: { label: 'Louer en meublé : déclarer un début d’activité (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/particulier/questions/si-je-mets-en-location-un-meuble-dois-je-minscrire-au-greffe-du-tribunal-de' },
  inpi: { label: 'Guichet unique des formalités d’entreprises (INPI)', url: 'https://procedures.inpi.fr/' },
  cfe: { label: 'Formulaire 1447-C-SD : déclaration initiale de CFE', url: 'https://www.impots.gouv.fr/formulaire/1447-c-sd/declaration-initiale-de-cotisation-fonciere-des-entreprises' },
  occupation: { label: 'Déclaration d’occupation, formulaire papier 1208-OD-SD', url: 'https://www.impots.gouv.fr/formulaire/1208-od-sd/declaration-doccupation-des-locaux-par-le-proprietaire' },
  faqGmbi: { label: 'Foire aux questions « Gérer mes biens immobiliers »', url: 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/1_particulier/EV/5_patrimoine_logement/560_travaux_habitation/faq_gmbi.pdf' },
  sci: { label: 'Déclarer les résultats d’une SCI (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/professionnel/questions/comment-declarer-les-resultats-de-ma-sci' },
  sciPasAPas: { label: 'Télédéclarer la 2072 pas à pas (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/1_particulier/EV/5_patrimoine_logement/550_invest_location_nue/teledeclaration_sci-pas_a_pas.pdf' },
  notice2072s: { label: 'Notice de la 2072-S (2026)', url: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2072-s-sd/2026/2072-s-sd_5354.pdf' },
  notice2072c: { label: 'Notice de la 2072-C (2026)', url: 'https://www.impots.gouv.fr/sites/default/files/formulaires/2072-c-sd/2026/2072-c-sd_5358.pdf' },
  teleprocedures: { label: 'Téléprocédures des professionnels (EFI ou EDI)', url: 'https://www.impots.gouv.fr/professionnel/teleprocedures-efi-ou-edi' },
  bic: { label: 'Dépôt de la déclaration de résultat au réel (impots.gouv.fr)', url: 'https://www.impots.gouv.fr/professionnel/questions/dans-le-cas-dune-entreprise-concernee-par-un-regime-reel-dimposition-limpot' },
} satisfies Record<string, Link>

/** Où trouver de l'aide : l'administration n'a pas d'adresse email publique, la messagerie sécurisée en tient lieu. */
export const CONTACTS: Contact[] = [
  { label: 'Messagerie sécurisée', value: 'Votre espace particulier, rubrique « Messagerie »', detail: 'L’équivalent d’un email avec votre centre des impôts : la réponse arrive dans votre espace. Les impôts n’ont pas d’adresse email publique.', url: LINKS.espace.url },
  { label: 'Téléphone, particuliers', value: '0 809 401 401', detail: 'Du lundi au vendredi, de 8 h 30 à 19 h. Service gratuit, prix d’un appel.', url: LINKS.contacts.url },
  { label: 'SCI, société ou meublé au réel', value: 'Messagerie de l’espace professionnel', detail: 'Elle arrive au service des impôts des entreprises (SIE) dont dépend la société ou le logement meublé. Numéro national des entreprises : 0 806 807 807.', url: LINKS.pro.url },
  { label: 'Problème technique sur l’espace professionnel', value: '0 809 400 210', detail: 'Assistance aux services en ligne des professionnels, du lundi au vendredi.', url: LINKS.contacts.url },
  { label: 'Rendez-vous', value: 'Au téléphone ou au guichet', detail: 'Depuis votre espace, rubrique « Contact », ou depuis la page contacts.', url: LINKS.rdv.url },
]

const frDate = (isoDay: string) => {
  const [y, m, d] = isoDay.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Date limite de la déclaration de revenus (en ligne) pour les revenus de `year`. */
export function personalDeadline(year: number, postalCode?: string | null): string {
  const d = declarationDeadline(year + 1, postalCode)
  return d.date ? `${frDate(d.date)} en ligne, selon votre département` : `fin mai ou début juin ${year + 1} en ligne, selon votre département (date publiée en avril sur impots.gouv.fr)`
}

/** Date limite des déclarations de résultat (2072, 2031, 2065 sur l'année civile) pour les revenus de `year`. */
export function companyDeadline(year: number): string {
  const d = resultDeadline(year)
  return `${frDate(d.online)} en ligne (${frDate(d.legal)} sur papier)`
}

const ACCESS = { label: 'Vos identifiants impots.gouv.fr', detail: 'Numéro fiscal (sur votre dernier avis d’impôt) et mot de passe, ou FranceConnect.' }
const RENTS = { label: 'Le total des loyers encaissés de l’année', detail: 'Calculé ici par Bailio, et dans l’export de l’onglet Argent.', bailio: true }

function videMicro(i: FilingInput): FilingGuide {
  return {
    id: 'VIDE_MICRO',
    title: 'Location vide au micro-foncier',
    summary: 'Vos loyers de location vide ne dépassent pas 15 000 € sur l’année, pour tout le foyer. Une seule case à remplir.',
    deadline: personalDeadline(i.year, i.postalCode),
    documents: [ACCESS, { ...RENTS, label: 'Le total des loyers encaissés, hors charges' }],
    steps: [
      { title: 'Ouvrez votre déclaration en ligne', detail: 'Connectez-vous, puis « Déclarer mes revenus ».', link: LINKS.espace },
      { title: 'Cochez les revenus fonciers', detail: 'À l’étape « Revenus et charges », cochez « Revenus fonciers ».' },
      { title: 'Case 4BE', detail: 'Indiquez le total des loyers hors charges. L’administration retire elle-même 30 % pour vos frais : n’enlevez rien.' },
      { title: 'Vérifiez et signez', detail: 'Gardez l’accusé de réception envoyé par email.' },
    ],
    links: [LINKS.fonciers, LINKS.regimes],
    watch: ['Au micro-foncier, aucune dépense ne se déduit : travaux, intérêts et taxe foncière sont déjà compris dans les 30 %.', 'Si vos dépenses dépassent 30 % des loyers, le régime réel est souvent plus intéressant (il vous engage pour trois ans).'],
  }
}

function videReel(i: FilingInput): FilingGuide {
  return {
    id: 'VIDE_REEL',
    title: 'Location vide au régime réel (2044)',
    summary: 'Plus de 15 000 € de loyers, ou vous choisissez de déduire vos dépenses réelles. Vous remplissez la déclaration annexe 2044.',
    deadline: personalDeadline(i.year, i.postalCode),
    documents: [
      ACCESS,
      RENTS,
      { label: 'Les factures de travaux payées dans l’année', detail: 'Entretien, réparation, amélioration. Pas l’agrandissement ni la construction.', bailio: true },
      { label: 'L’avis de taxe foncière', detail: 'Sans la taxe d’ordures ménagères si vous l’avez récupérée sur le locataire.' },
      { label: 'Les décomptes de charges du syndic', detail: 'Provisions payées et régularisation de l’an dernier (ligne 230).' },
      { label: 'L’attestation annuelle de votre banque', detail: 'Intérêts, assurance emprunteur et frais d’emprunt payés dans l’année (ligne 250).' },
      { label: 'Vos primes d’assurance', detail: 'Propriétaire non occupant, loyers impayés.' },
      { label: 'Honoraires et frais de gestion', detail: 'Agence, comptable, frais de procédure (ligne 221).' },
      { label: 'Votre 2044 ou votre avis d’impôt de l’an dernier', detail: 'Pour reprendre un déficit foncier reporté.' },
    ],
    steps: [
      { title: 'Ouvrez votre déclaration en ligne', detail: 'Connectez-vous, puis « Déclarer mes revenus ».', link: LINKS.espace },
      { title: 'Ajoutez la déclaration 2044', detail: 'À l’étape « Revenus et charges », cochez « Revenus fonciers », puis choisissez la déclaration annexe 2044.' },
      { title: 'Recopiez les lignes de Bailio', detail: 'Logement par logement : ligne 211 (loyers), puis 221 à 250. Les totaux sont plus haut sur cette page.' },
      { title: 'Laissez reporter le résultat', detail: 'Le revenu (case 4BA) ou le déficit (4BB, 4BC) passe tout seul sur la déclaration principale.' },
      { title: 'Vérifiez et signez', detail: 'Gardez l’accusé de réception et toutes les factures.' },
    ],
    links: [LINKS.notice2044, LINKS.fonciers, LINKS.regimes],
    watch: [
      'Remplir une 2044 sous le seuil de 15 000 € vaut choix du réel pour trois ans, pour tous les logements loués vides du foyer.',
      'Gardez les factures : l’administration peut les demander pendant trois ans.',
      'Une dépense se déclare l’année où elle est payée, pas l’année de la facture.',
    ],
  }
}

function meubleMicro(i: FilingInput): FilingGuide {
  return {
    id: 'MEUBLE_MICRO',
    title: 'Location meublée au micro-BIC',
    summary: `Location meublée non professionnelle (LMNP) : recettes jusqu’à ${i.year >= 2026 ? '83 600' : '77 700'} € par an. Une seule case sur la déclaration complémentaire 2042-C-PRO.`,
    deadline: personalDeadline(i.year, i.postalCode),
    documents: [ACCESS, { ...RENTS, label: 'Le total encaissé, charges comprises' }, { label: 'Votre numéro SIRET', detail: 'Reçu après la déclaration de début d’activité.' }],
    steps: [
      { title: 'Ouvrez votre déclaration en ligne', link: LINKS.espace },
      { title: 'Cochez les locations meublées', detail: 'À l’étape « Revenus et charges », cochez « Revenus des locations meublées non professionnelles » (déclaration 2042-C-PRO).' },
      { title: 'Case 5NI', detail: 'Le total encaissé, charges comprises (5OI pour le second déclarant). L’administration retire elle-même 50 %.' },
      { title: 'Vérifiez et signez', detail: 'Gardez l’accusé de réception.' },
    ],
    links: [LINKS.meubles, LINKS.depliantMeuble, LINKS.faqLmnp],
    watch: ['Ne déclarez pas ces recettes en revenus fonciers (case 4BE) : le meublé relève des bénéfices industriels et commerciaux (BIC).', 'Au-delà de 23 000 € de recettes, et si elles dépassent vos autres revenus d’activité, vous devenez loueur professionnel (LMP) : parlez-en à un expert-comptable.'],
  }
}

function meubleReel(i: FilingInput): FilingGuide {
  return {
    id: 'MEUBLE_REEL',
    title: 'Location meublée au régime réel',
    summary: 'Vous déduisez charges et amortissements. Deux déclarations : la liasse 2031 dans l’espace professionnel, puis le résultat sur votre 2042-C-PRO.',
    deadline: `liasse 2031 avant le ${companyDeadline(i.year)} ; déclaration de revenus avant le ${personalDeadline(i.year, i.postalCode)}`,
    documents: [
      ACCESS,
      RENTS,
      { label: 'L’acte d’achat et les frais de notaire', detail: 'Pour l’amortissement du logement (hors terrain).' },
      { label: 'L’inventaire et les factures du mobilier', detail: 'Le mobilier s’amortit à part.' },
      { label: 'Les factures de travaux, la taxe foncière, la CFE, les charges du syndic, les assurances', bailio: true },
      { label: 'L’attestation annuelle de votre banque', detail: 'Intérêts et assurance de l’emprunt.' },
      { label: 'La liasse de l’an dernier', detail: 'Amortissements et déficits reportés.' },
      { label: 'Votre numéro SIRET et l’accès à l’espace professionnel' },
    ],
    steps: [
      { title: 'Choisissez qui fait la liasse', detail: 'Un expert-comptable ou un logiciel agréé : la liasse 2031 et ses annexes (2033) se transmettent en ligne.', link: LINKS.teleprocedures },
      { title: 'Envoyez la liasse 2031', detail: 'Depuis l’espace professionnel ou par votre expert-comptable.', link: LINKS.bic },
      { title: 'Reportez le résultat', detail: 'Sur la 2042-C-PRO : case 5NA pour un bénéfice, 5NY pour un déficit.', link: LINKS.espace },
    ],
    links: [LINKS.regimes, LINKS.meubles, LINKS.faqLmnp],
    watch: [
      'Pour passer du micro-BIC au réel, l’option se fait au plus tard à la date de dépôt de la déclaration de l’année précédente (courrier au SIE ou dépôt de la 2031 la première année).',
      'Depuis 2025, les amortissements déduits sont repris dans le calcul de la plus-value à la revente.',
      'Un déficit de location meublée ne se déduit que des bénéfices de location meublée, pendant dix ans.',
    ],
  }
}

function meubleDebut(i: FilingInput): FilingGuide {
  return {
    id: 'MEUBLE_DEBUT',
    title: 'Première année en meublé : les formalités',
    summary: 'Avant votre première déclaration, deux démarches : obtenir un numéro SIRET, puis déclarer la cotisation foncière des entreprises (CFE).',
    deadline: `déclaration de début d’activité dans les 15 jours qui suivent la première location ; CFE avant le 31 décembre ${i.year}`,
    documents: [
      { label: 'Une pièce d’identité', detail: 'Et une adresse email pour le compte INPI.' },
      { label: 'L’adresse du logement et la date de début de la location' },
      { label: 'Le régime choisi', detail: 'Micro-BIC (par défaut) ou réel.' },
    ],
    steps: [
      { title: 'Déclarez le début d’activité', detail: 'Sur le guichet unique de l’INPI : créez un compte, puis « Créer une entreprise », activité de location meublée. Vous recevez votre SIRET (votre numéro d’entreprise).', link: LINKS.inpi },
      { title: 'Créez votre espace professionnel', detail: 'Sur impots.gouv.fr, avec votre SIRET : un code d’activation arrive par courrier. L’avis de CFE n’est disponible que là.', link: LINKS.pro },
      { title: 'Déclarez la CFE', detail: 'Formulaire 1447-C-SD, au service des impôts des entreprises du lieu du logement, par la messagerie de l’espace professionnel ou par courrier.', link: LINKS.cfe },
      { title: 'Nouveau logement meublé plus tard', detail: 'Sur le guichet unique : « Effectuer une formalité de modification ».', link: LINKS.inpi },
    ],
    links: [LINKS.siret, LINKS.faqLmnp, LINKS.cfe],
    watch: ['La CFE n’est pas due l’année du début d’activité si la déclaration 1447-C-SD est faite à temps.', 'La CFE se paie ensuite chaque année, au plus tard le 15 décembre, depuis l’espace professionnel. Sous 5 000 € de recettes par an, vous en êtes exonéré.'],
  }
}

function occupation(i: FilingInput): FilingGuide {
  return {
    id: 'OCCUPATION',
    title: 'Déclaration d’occupation des logements',
    summary: 'Un locataire est arrivé ou parti : vous indiquez qui occupe chaque logement, dans « Gérer mes biens immobiliers ».',
    deadline: `dès que l’occupant change, et au plus tard le 30 juin ${i.year + 1}`,
    documents: [ACCESS, { label: 'Le nom des occupants et leurs dates d’arrivée ou de départ', detail: 'Dans chaque bail Bailio.', bailio: true }],
    steps: [
      { title: 'Ouvrez « Biens immobiliers »', detail: 'Dans votre espace particulier, menu « Biens immobiliers ».', link: LINKS.espace },
      { title: 'Choisissez le logement', detail: 'Puis « Déclarer l’occupation » : location, nom du locataire, date de début.' },
      { title: 'Validez', detail: 'Faites-le pour chaque logement dont l’occupant a changé.' },
    ],
    links: [LINKS.faqGmbi, LINKS.occupation],
    watch: ['Un oubli, une omission ou une erreur coûte 150 € par logement.', 'Une SCI fait cette déclaration depuis son espace professionnel.'],
  }
}

function sciIr(i: FilingInput, name: string): FilingGuide {
  return {
    id: 'SCI_IR',
    structure: name,
    title: `${name} : SCI à l’impôt sur le revenu`,
    summary: 'La SCI déclare son résultat (2072) depuis son propre espace professionnel, puis chaque associé reporte sa part sur sa déclaration.',
    deadline: `2072 avant le ${companyDeadline(i.year)} ; parts des associés avant le ${personalDeadline(i.year, i.postalCode)}`,
    documents: [
      { label: 'Le SIREN de la SCI et l’accès à son espace professionnel' },
      { label: 'Les statuts et la liste des associés avec leurs parts' },
      { label: 'Les relevés du compte bancaire de la SCI' },
      { ...RENTS, detail: 'Pour les logements de cette SCI.' },
      { label: 'Les factures, la taxe foncière, les charges du syndic, les assurances', bailio: true },
      { label: 'L’attestation annuelle de la banque', detail: 'Intérêts et assurance de l’emprunt de la SCI.' },
      { label: 'Le compte rendu de gestion aux associés', detail: 'Le gérant rend compte au moins une fois par an (code civil, art. 1856).' },
    ],
    steps: [
      { title: 'Créez l’espace professionnel de la SCI', detail: '« Créer mon espace professionnel » avec le SIREN : le code d’activation arrive par courrier. Prévoyez deux semaines.', link: LINKS.pro },
      { title: 'Remplissez la 2072-S', detail: '« Déclarer » puis « Revenus SCI non soumises IS », mode simplifié. La 2072-C pour les cas complexes.', link: LINKS.sciPasAPas },
      { title: 'Donnez sa part à chaque associé', detail: 'La 2072 indique la part de chacun : Bailio la calcule plus haut si les parts sont renseignées.' },
      { title: 'Chaque associé déclare sa part', detail: 'Case 4BA de sa 2042 s’il n’a que des parts de SCI ; paragraphe 110 de la 2044 s’il loue aussi en direct.', link: LINKS.espace },
    ],
    links: [LINKS.sci, LINKS.notice2072s, LINKS.notice2072c, LINKS.notice2044],
    watch: ['Un associé qui n’a que des parts de SCI n’a pas droit au micro-foncier.', 'Une SCI qui loue en meublé de façon habituelle peut devenir imposable à l’impôt sur les sociétés : vérifiez avec un expert-comptable.'],
  }
}

function companyIr(i: FilingInput, name: string): FilingGuide {
  return {
    id: 'COMPANY_IR',
    structure: name,
    title: `${name} : société à l’impôt sur le revenu`,
    summary: 'Par exemple une SARL de famille qui loue en meublé : la liasse 2031 est faite par l’expert-comptable, puis chaque associé reporte sa part.',
    deadline: `liasse avant le ${companyDeadline(i.year)}`,
    documents: [
      { label: 'Le SIREN et l’accès à l’espace professionnel de la société' },
      { label: 'Le bilan et la liasse de l’an dernier' },
      { label: 'Les relevés du compte bancaire de la société' },
      { ...RENTS, detail: 'Pour les logements de cette société.' },
      { label: 'Les factures, la taxe foncière, la CFE, les assurances, les emprunts', bailio: true },
    ],
    steps: [
      { title: 'Transmettez les chiffres à l’expert-comptable', detail: 'Les totaux de Bailio et l’export de l’onglet Argent.' },
      { title: 'La liasse 2031 part en ligne', detail: 'Transmise par l’expert-comptable (procédure EDI).', link: LINKS.teleprocedures },
      { title: 'Chaque associé déclare sa part', detail: 'Sur sa 2042-C-PRO, avec les montants donnés par l’expert-comptable.', link: LINKS.espace },
    ],
    links: [LINKS.bic, LINKS.teleprocedures],
    watch: ['L’option d’une SARL de famille pour l’impôt sur le revenu doit avoir été faite : vérifiez-la dans les statuts ou auprès du SIE.'],
  }
}

function companyIs(i: FilingInput, name: string): FilingGuide {
  return {
    id: 'IS',
    structure: name,
    title: `${name} : société à l’impôt sur les sociétés`,
    summary: 'La société déclare et paie elle-même l’impôt (2065 et liasse 2033). Les associés ne déclarent que les dividendes reçus.',
    deadline: `liasse avant le ${companyDeadline(i.year)} (exercice clos le 31 décembre)`,
    documents: [
      { label: 'Le SIREN et l’accès à l’espace professionnel de la société' },
      { label: 'Le bilan et la liasse de l’an dernier', detail: 'Avec le tableau des amortissements.' },
      { label: 'Les relevés du compte bancaire de la société' },
      { ...RENTS, detail: 'Pour les logements de cette société.' },
      { label: 'Les factures, la taxe foncière, les assurances, les emprunts', bailio: true },
    ],
    steps: [
      { title: 'Transmettez les chiffres à l’expert-comptable', detail: 'Les totaux de Bailio et l’export de l’onglet Argent.' },
      { title: 'La 2065 et la liasse partent en ligne', detail: 'Transmises par l’expert-comptable (procédure EDI).', link: LINKS.teleprocedures },
      { title: 'Approbation des comptes', detail: 'Les associés approuvent les comptes de l’année, comme le prévoient les statuts.' },
    ],
    links: [LINKS.sci, LINKS.teleprocedures],
    watch: ['L’impôt sur les sociétés se paie par acomptes et solde, depuis l’espace professionnel : votre expert-comptable vous donne les dates.'],
  }
}

/** Les fiches qui concernent ce propriétaire, dans l'ordre où il les traitera. */
export function filingGuides(i: FilingInput): FilingGuide[] {
  const out: FilingGuide[] = []
  if (i.furnishedStart) out.push(meubleDebut(i))
  // Le régime conseillé d'abord ; l'autre reste consultable s'il est permis (vous avez peut-être déjà opté).
  const both = (regime: 'MICRO' | 'REAL', microAllowed: boolean, micro: FilingGuide, real: FilingGuide) => {
    const [first, second] = regime === 'REAL' ? [real, micro] : [micro, real]
    out.push(first)
    if (microAllowed) out.push({ ...second, alternative: true })
  }
  if (i.vide) both(i.vide.regime, i.vide.microAllowed, videMicro(i), videReel(i))
  if (i.meuble) both(i.meuble.regime, i.meuble.microAllowed, meubleMicro(i), meubleReel(i))
  for (const st of i.structures) {
    if (st.kind === 'SCI_IR') out.push(sciIr(i, st.name))
    else if (st.kind === 'COMPANY_IR') out.push(companyIr(i, st.name))
    else if (st.kind === 'IS') out.push(companyIs(i, st.name))
  }
  if (i.occupancy) out.push(occupation(i))
  return out
}
