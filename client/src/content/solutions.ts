/**
 * Pages « solutions » de bailio.fr : une page par type de bail (/bail/:slug) et une page par profil de propriétaire
 * (/gestion-locative/:slug), pour être trouvé dans Google. Chaque règle citée est vérifiée sur une source officielle,
 * indiquée en fin de page (« vérifié le »). Seulement ce que Bailio fait vraiment (CLAUDE.md, server/src/domain/rules.ts).
 * Texte simple (vouvoiement, phrases courtes, terme juridique expliqué). Le prix vient de config.ts, jamais écrit ici.
 * Nouvelle page : l'ajouter à SOLUTIONS ; plan du site, llms.txt, page HTML et mesure d'audience la reprennent seuls.
 */
import { CONTACT_EMAIL, FOUNDER_LINKEDIN } from '../config'
import { ADD_PARKING_PATH } from '../lib/contract'
import type { GuideBlock } from './guides'

export type SolutionBlock =
  | GuideBlock
  /** Frise : les dates clés, de la signature à la fin du bail. */
  | { steps: Array<{ title: string; text: string }> }
  /** Le prix, repris de config.ts à l'affichage. */
  | { price: true }

export interface Solution {
  slug: string
  kind: 'bail' | 'profil'
  /** Nom court, pour les menus. */
  name: string
  /** Titre de la page (h1). */
  title: string
  /** Une phrase, pour la description de la page. */
  description: string
  lead: string
  cta: { to: string; label: string; state?: { from: string } }
  /** Encadré « L'essentiel » : [intitulé, valeur]. */
  facts: Array<[string, string]>
  blocks: SolutionBlock[]
  faq: Array<[string, string]>
  links: Array<{ to: string; label: string }>
  sources: Array<{ label: string; url: string; checked: string }>
}

const CHECKED = '9 novembre 2026'
const SP = 'https://www.service-public.gouv.fr/particuliers/vosdroits'
const src = (label: string, url: string) => ({ label, url, checked: CHECKED })

const DEPOT = src('Service-public.fr : dépôt de garantie dans un bail d’habitation (F31269)', `${SP}/F31269`)
const CONGE_BAILLEUR = src('Service-public.fr : congé donné par le propriétaire (F929)', `${SP}/F929`)
const CONGE_LOCATAIRE = src('Service-public.fr : congé donné par le locataire, préavis (F1168)', `${SP}/F1168`)
const REDACTION = src('Service-public.fr : rédaction du bail d’habitation (F920)', `${SP}/F920`)
const MEUBLE = src('Service-public.fr : location d’un logement meublé (F2315)', `${SP}/F2315`)
const MOBILITE = src('Service-public.fr : règles du bail mobilité (F34759)', `${SP}/F34759`)
const COLOC = src('Service-public.fr : colocation (F34661)', `${SP}/F34661`)
const COLOC_DEPART = src('Service-public.fr : durée de la solidarité d’un colocataire qui part (F2044)', `${SP}/F2044`)
const GARAGE = src('Service-public.fr : location d’un garage ou d’un parking (F14747)', `${SP}/F14747`)
const MICRO_FONCIER = src('Service-public.fr : revenus fonciers, micro-foncier et régime réel (F1991)', `${SP}/F1991`)
const LMNP = src('Service-public.fr : location meublée non professionnelle (F32744)', `${SP}/F32744`)

const G = {
  depot: { to: '/guides/depot-de-garantie', label: 'Guide : le dépôt de garantie' },
  conge: { to: '/guides/conge-du-proprietaire', label: 'Guide : le congé du propriétaire' },
  irl: { to: '/guides/revision-du-loyer-irl', label: 'Guide : la révision du loyer (IRL)' },
  dpe: { to: '/guides/dpe-location-interdite', label: 'Guide : DPE et interdiction de louer' },
  quittance: { to: '/guides/quittance-de-loyer', label: 'Guide : la quittance de loyer' },
  edl: { to: '/guides/etat-des-lieux-entree-10-jours', label: 'Guide : l’état des lieux d’entrée' },
  visale: { to: '/guides/garantie-visale-proprietaire', label: 'Guide : la garantie Visale' },
  preavis: { to: '/guides/preavis-locataire-zone-tendue', label: 'Guide : le préavis du locataire' },
  charges: { to: '/guides/charges-recuperables-taxe-fonciere', label: 'Guide : les charges récupérables' },
  avenant: { to: '/modeles/avenant-au-bail', label: 'Modèle : avenant au bail' },
  caution: { to: '/modeles/appel-a-la-caution', label: 'Modèle : appel à la caution' },
  mfoncier: { to: '/simulateurs/micro-foncier-ou-reel', label: 'Outil : micro-foncier ou régime réel' },
  contrat: { to: '/fonctionnalites/contrat-de-location', label: 'Fonctionnalité : bail et signature en ligne' },
  impots: { to: '/fonctionnalites/declaration-impots', label: 'Fonctionnalité : déclaration d’impôts' },
  loyers: { to: '/fonctionnalites/quittance-de-loyer', label: 'Fonctionnalité : loyers et quittances' },
  impayes: { to: '/fonctionnalites/loyers-impayes', label: 'Fonctionnalité : impayés et relances' },
  etat: { to: '/fonctionnalites/etat-des-lieux', label: 'Fonctionnalité : état des lieux' },
  candidats: { to: '/fonctionnalites/candidatures', label: 'Fonctionnalité : annonce et candidats' },
  congeDate: { to: '/simulateurs/date-conge-bailleur', label: 'Outil : date limite du congé du propriétaire' },
  preavisDate: { to: '/simulateurs/preavis-locataire', label: 'Outil : fin du préavis du locataire' },
}

const START = { to: '/commencer', label: 'Créer mon bail gratuit' }

export const SOLUTIONS: Solution[] = [
  {
    slug: 'location-vide',
    kind: 'bail',
    name: 'Location vide',
    title: 'Bail de location vide : conditions, durée, dépôt',
    description: 'Le bail d’un logement vide : 3 ans, dépôt d’un mois de loyer, congé 6 mois avant l’échéance. Les règles de la loi, les annexes et un bail conforme prêt à signer.',
    lead: 'Vous louez un logement sans meubles comme résidence principale du locataire : voici ce que la loi impose, et comment Bailio prépare le bail avec les bonnes dates et les bons montants.',
    cta: START,
    facts: [
      ['Durée', '3 ans si vous êtes un particulier, 6 ans si le bailleur est une personne morale'],
      ['Dépôt de garantie', '1 mois de loyer hors charges au plus'],
      ['Congé du bailleur', '6 mois avant l’échéance, pour vendre, reprendre ou un motif légitime et sérieux'],
      ['Préavis du locataire', '3 mois, ramené à 1 mois en zone tendue ou dans certains cas'],
      ['À l’échéance', 'Le bail est reconduit, faute de congé'],
    ],
    blocks: [
      { h: 'Qu’est-ce que le bail de location vide ?' },
      { p: 'C’est le contrat d’un logement loué sans meubles, comme résidence principale du locataire. Il suit la loi du 6 juillet 1989 et un contrat type fixé par décret : le contrat type est le modèle officiel dont un bail ne peut pas s’écarter sur l’essentiel.' },
      { h: 'Conditions' },
      { list: ['Le logement est la résidence principale du locataire.', 'Il est décent : le DPE (diagnostic de performance énergétique) compte, et certains logements classés G, F puis E sont interdits à la location selon un calendrier.', 'Le bail est écrit, avec les mentions obligatoires du contrat type.'] },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : au moins 3 ans pour un particulier, 6 ans pour une personne morale. Une durée plus courte, d’au moins 1 an, est possible si vous devez reprendre le logement pour un motif familial ou professionnel précis, écrit dans le bail.', 'Loyer : fixé librement, sauf dans les communes à encadrement des loyers et en zone tendue, où il est limité. Si le précédent locataire est parti depuis moins de 18 mois, son dernier loyer figure dans le bail.', 'Charges : provisions avec régularisation chaque année, ou paiement périodique. Le forfait n’est possible qu’en colocation.', 'Dépôt de garantie : 1 mois de loyer hors charges au plus. Vous le rendez dans le mois si l’état des lieux de sortie est conforme à celui d’entrée, dans les 2 mois sinon.'] },
      { h: 'Le bail date par date' },
      { steps: [
        { title: 'Signature', text: 'Vous et le locataire signez, de préférence en ligne. Le plafond du loyer et les diagnostics sont contrôlés avant.' },
        { title: 'Entrée dans les lieux', text: 'État des lieux d’entrée signé, remise des clés, premier loyer. Le locataire peut le compléter dans les 10 jours.' },
        { title: 'Chaque année : révision', text: 'À la date anniversaire, si le bail la prévoit, le loyer suit l’indice de référence des loyers (IRL). Elle est interdite pour un logement classé F ou G.' },
        { title: '6 mois avant l’échéance : congé', text: 'Pour mettre fin au bail, vous devez prévenir au plus tard 6 mois avant la fin des 3 ans, et seulement pour un motif prévu par la loi.' },
        { title: 'Échéance', text: 'Sans congé, le bail est reconduit pour la même durée. Le locataire, lui, peut partir à tout moment avec son préavis.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { p: 'Le bail doit indiquer le loyer, ses modalités de paiement et ses règles de révision. En zone d’encadrement des loyers, il donne aussi le loyer de référence et le loyer de référence majoré. Le PDF de Bailio reprend les rubriques du contrat type dans l’ordre.' },
      { p: 'Certaines clauses sont interdites et ne s’appliquent pas si elles figurent au bail :' },
      { list: ['imposer le prélèvement automatique pour payer le loyer ;', 'interdire d’héberger des personnes qui ne vivent pas habituellement avec le locataire ;', 'prévoir des frais de délivrance ou d’envoi de quittance.'] },
      { h: 'Annexes à joindre' },
      { list: ['le dossier de diagnostic technique : DPE, plomb, électricité et gaz s’ils ont plus de 15 ans, état des risques, bruit selon la zone ;', 'la notice d’information ;', 'les états des lieux d’entrée et de sortie ;', 'l’attestation d’assurance du locataire ;', 'l’acte de caution ou la garantie Visale, si vous l’exigez ;', 'la grille de vétusté, si elle est convenue ;', 'l’extrait du règlement de copropriété, si le logement est en copropriété.'] },
      { p: 'Bailio joint la notice d’information à jour et les diagnostics que vous déposez, et bloque la signature quand un diagnostic a expiré.' },
      { h: 'Modifier ou mettre fin au bail' },
      { p: 'Un changement en cours de bail (nouveau colocataire, travaux, charges) se fait par avenant, un écrit signé par les deux parties. De votre côté, vous ne pouvez donner congé qu’à l’échéance : lettre recommandée avec accusé de réception, acte d’un commissaire de justice ou remise en main propre contre récépissé. Un simple email n’est pas valable.' },
      { h: 'Fiscalité en bref' },
      { p: 'Les loyers d’une location vide sont des revenus fonciers. Jusqu’à 15 000 € de loyers par an, le micro-foncier applique un abattement de 30 %. Au-delà, ou si vous choisissez le régime réel, vous déduisez vos charges réelles. L’outil gratuit compare les deux.' },
    ],
    faq: [
      ['Quelle est la durée d’un bail de location vide ?', 'Au moins 3 ans si le propriétaire est un particulier, 6 ans si c’est une personne morale. Une durée d’au moins 1 an est possible pour un motif familial ou professionnel précis, écrit dans le bail.'],
      ['Quel dépôt de garantie puis-je demander ?', 'Au plus 1 mois de loyer hors charges. Si le loyer est payé par trimestre, aucun dépôt n’est permis.'],
      ['Quand puis-je donner congé ?', 'À l’échéance du bail seulement, au moins 6 mois avant, pour vendre, reprendre le logement ou un motif légitime et sérieux.'],
      ['Mon locataire peut-il partir plus tôt ?', 'Oui, à tout moment, avec un préavis de 3 mois. Il tombe à 1 mois en zone tendue ou dans certains cas, si la lettre le précise.'],
      ['Quelles clauses sont interdites ?', 'Le prélèvement automatique imposé, l’interdiction d’héberger un proche, les frais de quittance. Elles sont réputées non écrites.'],
      ['Bailio vérifie-t-il le plafond du loyer ?', 'Oui, avant la signature : encadrement des loyers, loyer du locataire précédent en zone tendue, logements F et G. Une signature est refusée si une règle n’est pas respectée.'],
      ['Faut-il un compte pour préparer le bail ?', 'Non. Le parcours démarre sans compte, et le premier bail est gratuit.'],
    ],
    links: [G.depot, G.conge, G.irl, G.dpe, G.contrat, G.congeDate, G.mfoncier, G.avenant],
    sources: [REDACTION, DEPOT, CONGE_BAILLEUR, CONGE_LOCATAIRE, MICRO_FONCIER],
  },
  {
    slug: 'location-meublee',
    kind: 'bail',
    name: 'Location meublée',
    title: 'Bail de location meublée : durée, dépôt, mobilier',
    description: 'Le bail d’un logement meublé : 1 an, dépôt de 2 mois de loyer, congé 3 mois avant l’échéance, mobilier obligatoire. Les règles et un bail conforme prêt à signer.',
    lead: 'Le meublé est plus souple que le vide, mais il a ses règles : durée, dépôt, mobilier à fournir. Bailio les applique et les contrôle avant la signature.',
    cta: START,
    facts: [
      ['Durée', '1 an, renouvelable'],
      ['Dépôt de garantie', '2 mois de loyer hors charges au plus'],
      ['Congé du bailleur', '3 mois avant l’échéance, pour vendre, reprendre ou un motif légitime et sérieux'],
      ['Préavis du locataire', '1 mois, à tout moment'],
      ['Mobilier', 'Une liste minimale est obligatoire : Bailio vérifie les 11 éléments'],
    ],
    blocks: [
      { h: 'Qu’est-ce que le bail meublé ?' },
      { p: 'C’est le contrat d’un logement loué avec les meubles et équipements nécessaires pour y vivre, comme résidence principale du locataire. Il relève de la loi du 6 juillet 1989 (le titre consacré au meublé) et d’un contrat type propre au meublé.' },
      { h: 'Conditions' },
      { list: ['Le logement est la résidence principale du locataire.', 'Les meubles et équipements de la liste minimale sont fournis.', 'Le logement respecte les critères de décence énergétique : en métropole, certains logements classés G, F puis E sont interdits à la location selon un calendrier.'] },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : 1 an, renouvelable à l’échéance faute de congé. Elle peut être ramenée à 9 mois pour un étudiant (page « Bail étudiant »).', 'Loyer : fixé librement, sauf dans les communes à encadrement des loyers.', 'Charges : provisions avec régularisation, paiement périodique ou forfait, au choix.', 'Dépôt de garantie : 2 mois de loyer hors charges au plus, rendu dans le mois ou les 2 mois selon l’état des lieux de sortie.'] },
      { h: 'Le bail date par date' },
      { steps: [
        { title: 'Signature', text: 'Bail et inventaire du mobilier signés en ligne ou sur papier.' },
        { title: 'Entrée dans les lieux', text: 'État des lieux d’entrée, remise des clés, premier loyer.' },
        { title: 'Chaque année : révision', text: 'À la date anniversaire, si le bail la prévoit : l’IRL du bon trimestre.' },
        { title: '3 mois avant l’échéance : congé', text: 'Pour mettre fin au bail à la fin de l’année, vous prévenez au plus tard 3 mois avant, pour un motif prévu par la loi.' },
        { title: 'Échéance', text: 'Sans congé, le bail se renouvelle pour 1 an. Le locataire peut partir à tout moment avec 1 mois de préavis.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { p: 'Le bail suit le contrat type du meublé : parties, logement, durée, loyer et sa révision, charges, dépôt de garantie, mobilier. En zone d’encadrement, il indique le loyer de référence et le loyer de référence majoré. Les clauses interdites du bail d’habitation s’appliquent aussi : prélèvement automatique imposé, interdiction d’héberger des proches, frais de quittance.' },
      { h: 'Annexes à joindre' },
      { list: ['l’inventaire du mobilier et des équipements ;', 'les diagnostics (DPE, plomb, électricité et gaz s’ils ont plus de 15 ans, état des risques) ;', 'la notice d’information ;', 'les états des lieux d’entrée et de sortie ;', 'l’attestation d’assurance du locataire ;', 'l’acte de caution ou la garantie Visale, si vous l’exigez.'] },
      { h: 'Modifier ou mettre fin au bail' },
      { p: 'Pour modifier le bail, utilisez un avenant signé des deux parties. Le congé du propriétaire se donne 3 mois avant l’échéance, par lettre recommandée avec accusé de réception, acte de commissaire de justice ou remise en main propre contre récépissé. Le locataire peut partir à tout moment avec 1 mois de préavis, sans justification.' },
      { h: 'Fiscalité en bref' },
      { p: 'Les loyers d’un meublé sont des bénéfices industriels et commerciaux (BIC), pas des revenus fonciers. Vous choisissez entre le micro-BIC (abattement de 50 %) et le régime réel. Pour un premier meublé, une inscription est à faire dans les 15 jours qui suivent la première location : la page « Loueur meublé (LMNP) » détaille la démarche.' },
    ],
    faq: [
      ['Quelle est la durée d’un bail meublé ?', '1 an, renouvelable. Elle peut être ramenée à 9 mois si le locataire est étudiant.'],
      ['Quel dépôt de garantie puis-je demander ?', 'Au plus 2 mois de loyer hors charges, sauf si le loyer est payé par trimestre : aucun dépôt n’est alors permis.'],
      ['Quel préavis pour mon locataire ?', '1 mois, à tout moment, sans motif à donner.'],
      ['Et pour moi, propriétaire ?', 'Vous ne pouvez mettre fin au bail qu’à l’échéance, au moins 3 mois avant, pour vendre, reprendre le logement ou un motif légitime et sérieux.'],
      ['Quel mobilier faut-il fournir ?', 'Une liste minimale d’éléments est obligatoire. Bailio en vérifie les 11 éléments dans la fiche du logement avant de créer le bail.'],
      ['Mon logement meublé peut-il être interdit à la location ?', 'Oui, comme un logement vide, selon sa classe au DPE. Bailio refuse la création du bail et vous dit pourquoi.'],
      ['Puis-je louer un meublé en colocation ?', 'Oui : voir la page « Colocation ».'],
    ],
    links: [G.depot, G.conge, G.irl, G.dpe, G.contrat, G.etat, G.congeDate, G.impots],
    sources: [MEUBLE, DEPOT, CONGE_BAILLEUR, CONGE_LOCATAIRE, REDACTION, LMNP],
  },
  {
    slug: 'bail-etudiant',
    kind: 'bail',
    name: 'Bail étudiant',
    title: 'Bail étudiant : le meublé de 9 mois',
    description: 'Le bail étudiant est un bail meublé de 9 mois, sans reconduction : durée, dépôt de 2 mois de loyer, préavis d’un mois. Les règles et un bail prêt à signer.',
    lead: 'Un étudiant peut louer un meublé pour 9 mois, le temps de l’année universitaire. Voici les règles, et comment Bailio prépare ce bail.',
    cta: START,
    facts: [
      ['Durée', '9 mois, sans reconduction'],
      ['Dépôt de garantie', '2 mois de loyer hors charges au plus'],
      ['Congé du bailleur', 'Aucun congé à donner : le bail prend fin à son terme'],
      ['Préavis du locataire', '1 mois, même pour un bail de 9 mois'],
      ['Pour qui', 'Un locataire étudiant'],
    ],
    blocks: [
      { h: 'Qu’est-ce que le bail étudiant ?' },
      { p: 'Ce n’est pas un contrat à part : c’est un bail meublé dont la durée est réduite à 9 mois lorsque le locataire est étudiant. Il suit donc les règles de la location meublée, avec une particularité : il n’est pas reconduit.' },
      { h: 'Conditions' },
      { list: ['Le locataire est étudiant.', 'Le logement est meublé, avec le mobilier obligatoire, et c’est sa résidence principale.', 'Le bail de 9 mois est écrit comme tel. Pour un bail d’un an, le bail meublé classique s’applique.'] },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : 9 mois. Le bail prend fin à son terme, sans que personne ait à donner congé. Pour continuer, vous signez un nouveau bail.', 'Loyer : libre, sauf dans les communes à encadrement des loyers.', 'Charges : provisions, paiement périodique ou forfait, au choix.', 'Dépôt de garantie : 2 mois de loyer hors charges au plus.'] },
      { h: 'Le bail date par date' },
      { steps: [
        { title: 'Signature', text: 'Avant la rentrée : bail et inventaire du mobilier signés.' },
        { title: 'Entrée dans les lieux', text: 'État des lieux d’entrée et remise des clés.' },
        { title: 'Pendant le bail', text: 'Loyers et quittances chaque mois. Le locataire peut partir à tout moment avec 1 mois de préavis.' },
        { title: 'Fin du bail, au bout de 9 mois', text: 'Le bail s’arrête de lui-même : aucun congé à envoyer. État des lieux de sortie et restitution du dépôt.' },
        { title: 'Et après ?', text: 'Pour poursuivre la location, un nouveau bail est signé.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { p: 'Le bail reprend le contrat type du meublé. Les clauses interdites sont les mêmes que pour tout bail d’habitation : prélèvement automatique imposé, interdiction d’héberger des proches, frais de quittance.' },
      { h: 'Annexes à joindre' },
      { list: ['l’inventaire du mobilier ;', 'les diagnostics et la notice d’information ;', 'les états des lieux d’entrée et de sortie ;', 'l’attestation d’assurance du locataire ;', 'l’acte de caution ou la garantie Visale, si vous l’exigez.'] },
      { h: 'Modifier ou mettre fin au bail' },
      { p: 'Le bail de 9 mois ne se renouvelle pas. Si l’étudiant reste, un nouveau bail est signé. Pour modifier une clause en cours de bail, utilisez un avenant. Le locataire donne son préavis de 1 mois par lettre recommandée avec accusé de réception, acte de commissaire de justice ou remise en main propre contre récépissé.' },
      { h: 'Fiscalité en bref' },
      { p: 'Comme tout meublé : bénéfices industriels et commerciaux, au micro-BIC (abattement de 50 %) ou au régime réel.' },
    ],
    faq: [
      ['Le bail étudiant est-il reconduit ?', 'Non. À la fin des 9 mois, il s’arrête sans congé de personne. Pour continuer, un nouveau bail est signé.'],
      ['Quel dépôt de garantie ?', 'Au plus 2 mois de loyer hors charges, comme tout meublé.'],
      ['L’étudiant peut-il partir avant 9 mois ?', 'Oui, avec un préavis de 1 mois, même si le bail ne dure que 9 mois.'],
      ['Faut-il que le locataire soit étudiant ?', 'Oui : la durée de 9 mois est prévue pour un locataire étudiant.'],
      ['Quelle différence avec le bail mobilité ?', 'Le bail mobilité dure de 1 à 10 mois, ne permet aucun dépôt de garantie et vise plusieurs situations (études, stage, mission…). Voir la page « Bail mobilité ».'],
      ['L’étudiant peut-il avoir une caution ?', 'Oui. La garantie Visale, gratuite, peut convenir : la demande se fait avant la signature du bail.'],
    ],
    links: [G.depot, G.visale, G.edl, G.contrat, G.etat, G.avenant],
    sources: [MEUBLE, src('Service-public.fr : rédaction du bail meublé (F35109)', `${SP}/F35109`), DEPOT, CONGE_LOCATAIRE],
  },
  {
    slug: 'bail-mobilite',
    kind: 'bail',
    name: 'Bail mobilité',
    title: 'Bail mobilité : 1 à 10 mois, sans dépôt de garantie',
    description: 'Le bail mobilité loue un meublé de 1 à 10 mois à un locataire en formation, études, stage ou mission : pas de dépôt de garantie, charges au forfait, non renouvelable.',
    lead: 'Un stagiaire, un apprenti, un salarié en mission : le bail mobilité est fait pour les séjours courts. Il a des règles très différentes du meublé classique.',
    cta: START,
    facts: [
      ['Durée', 'De 1 à 10 mois, non renouvelable'],
      ['Dépôt de garantie', 'Interdit'],
      ['Charges', 'Au forfait seulement'],
      ['Préavis du locataire', '1 mois, à tout moment'],
      ['Loyer', 'Non révisable pendant le bail'],
    ],
    blocks: [
      { h: 'Qu’est-ce que le bail mobilité ?' },
      { p: 'C’est un bail meublé de courte durée, pour un locataire qui n’occupe le logement que temporairement. Il est régi par la loi du 6 juillet 1989, mais avec ses propres règles.' },
      { h: 'Conditions' },
      { p: 'Le locataire doit être, au début du bail, dans l’une de ces situations, et le prouver :' },
      { list: ['formation professionnelle ;', 'études supérieures ;', 'contrat d’apprentissage ;', 'stage ;', 'engagement volontaire dans le cadre d’un service civique ;', 'mutation professionnelle ;', 'mission temporaire dans le cadre de son activité professionnelle.'] },
      { p: 'Le logement est meublé, avec au minimum la liste officielle d’équipements, et un inventaire du mobilier signé est annexé au bail.' },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : au moins 1 mois, au plus 10 mois. Elle ne peut être ni renouvelée ni reconduite. Une seule modification par avenant est possible, dans la limite de 10 mois au total.', 'Loyer : libre, sauf encadrement ou zone tendue, et jamais révisé pendant le bail.', 'Charges : un forfait versé avec le loyer, pas de provisions.', 'Dépôt de garantie : interdit. Vous pouvez en revanche demander une caution, et le locataire peut utiliser la garantie Visale.'] },
      { h: 'Le bail date par date' },
      { steps: [
        { title: 'Signature', text: 'Le bail indique le motif du locataire, la durée et la mention « bail mobilité ». L’inventaire du mobilier est annexé.' },
        { title: 'Entrée dans les lieux', text: 'État des lieux d’entrée, remise des clés, premier loyer.' },
        { title: 'Pendant le bail', text: 'Loyer forfaitaire chaque mois, sans révision. Le locataire peut partir à tout moment avec 1 mois de préavis.' },
        { title: 'Fin du bail', text: 'Le bail s’arrête à sa date, sans congé de votre part. État des lieux de sortie.' },
        { title: 'Si la location continue', text: 'Un nouveau contrat doit être un bail d’habitation classique.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { list: ['Mentions : les parties, la date de début, la durée, le motif qui permet au locataire de signer, le loyer, et la mention qu’il s’agit d’un bail mobilité soumis à la loi de 1989.', 'Interdit : un dépôt de garantie.', 'Interdit en colocation : une clause de solidarité entre les colocataires ou leurs cautions.'] },
      { h: 'Annexes à joindre' },
      { list: ['l’inventaire du mobilier ;', 'les diagnostics et la notice d’information ;', 'les états des lieux d’entrée et de sortie ;', 'l’attestation d’assurance du locataire (risques locatifs : incendie, explosion, dégâts des eaux).'] },
      { h: 'Modifier ou mettre fin au bail' },
      { p: 'Le locataire peut partir à tout moment avec 1 mois de préavis, par lettre recommandée avec accusé de réception, acte de commissaire de justice ou remise en main propre contre récépissé. Vous n’avez pas de congé à donner : le bail s’arrête à sa date. La sous-location demande votre accord écrit.' },
      { h: 'Fiscalité en bref' },
      { p: 'Comme tout meublé : bénéfices industriels et commerciaux, micro-BIC ou régime réel. La page « Loueur meublé (LMNP) » détaille ce que fait Bailio.' },
    ],
    faq: [
      ['Quelle est la durée d’un bail mobilité ?', 'De 1 à 10 mois. Il ne se renouvelle pas et ne se reconduit pas.'],
      ['Puis-je demander un dépôt de garantie ?', 'Non, c’est interdit. Vous pouvez demander une caution, par exemple la garantie Visale.'],
      ['Comment sont comptées les charges ?', 'Au forfait, versé avec le loyer. Bailio ne propose que le forfait pour ce bail.'],
      ['Qui peut signer un bail mobilité ?', 'Un locataire en formation professionnelle, études supérieures, apprentissage, stage, service civique, mutation ou mission temporaire, avec un justificatif.'],
      ['Peut-on louer en colocation ?', 'Oui, mais le bail ne peut pas contenir de clause de solidarité entre les colocataires ou leurs cautions.'],
      ['Que se passe-t-il à la fin ?', 'Le bail s’arrête sans congé. Si vous continuez à louer au même locataire, il faut signer un bail d’habitation classique.'],
      ['Puis-je réviser le loyer ?', 'Non, le loyer ne se révise pas pendant le bail.'],
    ],
    links: [G.visale, G.edl, G.contrat, G.etat, G.avenant],
    sources: [MOBILITE, DEPOT, CONGE_LOCATAIRE],
  },
  {
    slug: 'colocation',
    kind: 'bail',
    name: 'Colocation',
    title: 'Bail de colocation : solidarité, départ, dépôt',
    description: 'Colocation : bail unique ou baux séparés, clause de solidarité, départ d’un colocataire après 6 mois, dépôt de garantie. Les règles et un bail de colocation prêt à signer.',
    lead: 'Plusieurs locataires, un seul logement : la colocation demande une clause de solidarité claire et un départ bien géré. Voici les règles.',
    cta: START,
    facts: [
      ['Forme', 'Un bail commun signé par tous, ou un bail par colocataire'],
      ['Solidarité', 'Chacun et sa caution doivent la totalité du loyer, si le bail le prévoit'],
      ['Départ d’un colocataire', 'Solidarité jusqu’à 6 mois après la fin du préavis, ou jusqu’à l’arrivée d’un remplaçant'],
      ['Charges', 'Le forfait est permis, même en logement vide'],
      ['Dépôt de garantie', 'Selon le type de bail : 1 mois en vide, 2 mois en meublé'],
    ],
    blocks: [
      { h: 'Qu’est-ce que la colocation ?' },
      { p: 'C’est la location d’un même logement par plusieurs colocataires. Elle peut prendre la forme d’un bail commun, signé par tous, ou de baux individuels, un par colocataire, avec sa chambre privative et les parties communes. Bailio prépare le bail commun, vide ou meublé.' },
      { h: 'Conditions' },
      { list: ['Un bail commun, vide ou meublé, signé par tous les colocataires et vous.', 'Une clause de solidarité, si vous la souhaitez : sans elle, chacun ne doit que sa part.', 'Une assurance contre les risques locatifs (incendie, explosion, dégâts des eaux), collective ou individuelle.'] },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : celle du bail choisi, vide ou meublé.', 'Loyer : un loyer total, soumis à l’encadrement ou au plafond de zone tendue quand ils s’appliquent. En bail commun, le plafond vise le total perçu.', 'Charges : provisions avec régularisation annuelle, ou forfait. Le forfait est inscrit au bail, ne doit pas être manifestement disproportionné et ne donne lieu à aucun complément.', 'Dépôt de garantie : demandé à l’entrée, rendu quand tous les colocataires sont partis et ont remis les clés (bail commun).'] },
      { h: 'Le bail date par date' },
      { steps: [
        { title: 'Signature', text: 'Tous les colocataires et vous signez le même bail, avec la clause de solidarité si elle est prévue.' },
        { title: 'Entrée dans les lieux', text: 'État des lieux d’entrée en présence de tous les colocataires, daté et signé par chacun.' },
        { title: 'Un colocataire part', text: 'Il donne son préavis. Avec la clause de solidarité, il reste tenu 6 mois après la fin du préavis, avec sa caution.' },
        { title: 'Un remplaçant arrive', text: 'Si un nouveau colocataire le remplace pendant le préavis, la solidarité du partant s’arrête à la fin du préavis.' },
        { title: 'Fin du bail', text: 'État des lieux de sortie quand le dernier colocataire quitte les lieux, puis restitution du dépôt.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { p: 'Le bail reprend celui du logement vide ou meublé. La clause de solidarité y a sa rubrique : si elle est prévue, chaque colocataire et sa caution doivent la totalité du loyer et des charges. En bail mobilité, elle est interdite.' },
      { h: 'Annexes à joindre' },
      { list: ['les diagnostics et la notice d’information ;', 'les états des lieux d’entrée et de sortie, signés par chaque colocataire ;', 'l’inventaire du mobilier, en meublé ;', 'l’attestation d’assurance, à fournir chaque année ;', 'les actes de caution, s’il y en a.'] },
      { h: 'Modifier ou mettre fin au bail' },
      { p: 'Un colocataire qui part, ou qui arrive, se gère par avenant. Chaque colocataire donne son propre préavis, selon le type de bail (voir le guide du préavis). Le propriétaire dispose de 3 ans pour réclamer un impayé.' },
      { h: 'Fiscalité en bref' },
      { p: 'Les règles sont celles du vide ou du meublé : revenus fonciers pour un logement vide, bénéfices industriels et commerciaux pour un meublé.' },
    ],
    faq: [
      ['Bail commun ou baux séparés ?', 'Le bail commun est un seul contrat signé par tous. Avec des baux individuels, chaque colocataire a son contrat et ne paie que sa part. Bailio prépare le bail commun.'],
      ['Qu’est-ce que la clause de solidarité ?', 'Chaque colocataire, et sa caution, doit la totalité du loyer et des charges, pas seulement sa part. Sans cette clause, chacun ne doit que sa part.'],
      ['Combien de temps un colocataire reste-t-il tenu après son départ ?', 'Avec la clause de solidarité, 6 mois après la fin de son préavis, ou jusqu’à la fin du préavis si un remplaçant arrive pendant celui-ci. Sans clause, jusqu’à la fin de son préavis.'],
      ['Le forfait de charges est-il permis ?', 'Oui en colocation, même pour un logement vide. Il est inscrit au bail et ne donne lieu à aucun complément.'],
      ['Qui reçoit le dépôt de garantie ?', 'En bail commun, il est rendu une fois tous les colocataires partis, à l’un d’eux.'],
      ['Combien de temps pour réclamer un impayé ?', '3 ans.'],
    ],
    links: [G.depot, G.caution, G.charges, G.preavis, G.edl, G.contrat, G.etat],
    sources: [COLOC, COLOC_DEPART, MOBILITE, DEPOT],
  },
  {
    slug: 'garage-parking',
    kind: 'bail',
    name: 'Garage, box ou place',
    title: 'Bail de garage, box ou place de parking',
    description: 'Louer un garage, un box ou une place de parking seul : contrat libre, durée et préavis à convenir. Ce que prévoit la loi, ce que contient le contrat Bailio.',
    lead: 'Un garage loué seul n’est pas un bail d’habitation : le contrat est libre. Bailio le prépare avec une durée, un préavis et un dépôt clairs.',
    cta: { to: '/inscription', label: 'Créer mon contrat de garage', state: { from: ADD_PARKING_PATH } },
    facts: [
      ['Règles', 'Contrat libre (Code civil), pas la loi de 1989'],
      ['Durée', 'À convenir : 12 mois par défaut dans Bailio, reconduite tacitement'],
      ['Préavis', 'À convenir : 1 mois par défaut dans Bailio, pour les deux parties'],
      ['Dépôt de garantie', 'Libre : Bailio propose 1 mois et accepte 2 mois au plus'],
      ['Loyer', 'Révisable par l’IRL si le contrat le prévoit'],
    ],
    blocks: [
      { h: 'Qu’est-ce qu’un bail de garage ?' },
      { p: 'Un garage, un box ou une place de parking loué seul, sans logement, relève du droit commun du Code civil. La loi du 6 juillet 1989 ne s’applique pas : les parties s’entendent sur le loyer, la durée et la fin du contrat. Un écrit est conseillé pour éviter les conflits, même si un accord oral est possible.' },
      { p: 'Cas particulier : si le garage est loué avec un logement, il n’y a pas de bail spécifique. Il figure dans le bail d’habitation comme une dépendance du logement, et ses règles s’appliquent aussi au garage.' },
      { h: 'Conditions' },
      { list: ['Le garage, le box ou la place est loué seul, à un locataire qui peut ou non habiter votre immeuble.', 'Le contrat écrit prévoit le loyer et sa date de paiement, les règles de révision, la durée et la façon d’y mettre fin.'] },
      { h: 'Durée, loyer, charges, dépôt' },
      { list: ['Durée : libre. Bailio propose 12 mois, reconduits tacitement.', 'Loyer : libre, révisable si le contrat le prévoit, avec l’IRL dans Bailio.', 'Charges : au choix.', 'Dépôt de garantie : aucun plafond légal. Bailio propose 1 mois et en accepte 2 au plus.'] },
      { h: 'Le contrat date par date' },
      { steps: [
        { title: 'Signature', text: 'Contrat signé, avec la durée et le préavis choisis.' },
        { title: 'Entrée', text: 'Remise des clés ou du badge, premier loyer.' },
        { title: 'Chaque année : révision', text: 'Si le contrat la prévoit, le loyer suit l’IRL à la date anniversaire.' },
        { title: 'Congé', text: 'Chaque partie prévient avec le préavis du contrat : 1 mois par défaut dans Bailio.' },
        { title: 'Fin', text: 'À la fin du préavis, le locataire rend les clés et vous rendez le dépôt.' },
      ] },
      { h: 'Mentions obligatoires et clauses interdites' },
      { p: 'Aucune liste de mentions imposée par la loi de 1989 : le contrat de Bailio indique les parties, l’emplacement (numéro, niveau, couvert ou non, accès), le loyer, les charges, la durée, le préavis, le dépôt et la révision. Les quittances et le contrat portent la mention « TVA non applicable, article 293 B du CGI ».' },
      { h: 'Annexes à joindre' },
      { p: 'Il n’y a ni diagnostic de performance énergétique, ni diagnostics techniques, ni notice d’information à joindre à un garage loué seul.' },
      { h: 'Modifier ou mettre fin au contrat' },
      { p: 'Le contrat se modifie par avenant. Il prend fin par lettre, avec le préavis qu’il prévoit. Bailio prépare pour le garage les courriers adaptés (congé avec le préavis du contrat, dépôt rendu dans le mois) et masque ceux qui relèvent de la loi de 1989.' },
      { h: 'Fiscalité en bref' },
      { p: 'Les loyers d’un garage loué seul sont traités comme une location vide : revenus fonciers, micro-foncier ou régime réel. L’outil gratuit compare les deux.' },
    ],
    faq: [
      ['La loi de 1989 s’applique-t-elle à un garage ?', 'Non, pas à un garage loué seul : le contrat est libre. Si le garage est loué avec le logement, les règles du bail d’habitation s’appliquent aussi au garage.'],
      ['Faut-il un écrit ?', 'Un accord oral est possible, mais un contrat écrit est conseillé pour éviter les conflits.'],
      ['Quelle durée choisir ?', 'Elle est libre. Bailio propose 12 mois, reconduits tacitement, et vous pouvez la changer.'],
      ['Quel préavis ?', 'Celui que vous écrivez au contrat. Bailio propose 1 mois pour les deux parties.'],
      ['Puis-je demander un dépôt de garantie ?', 'Aucun plafond n’est fixé par la loi. Bailio propose 1 mois de loyer et accepte 2 mois au plus.'],
      ['Combien coûte Bailio pour un garage ?', 'Le prix du garage est indiqué sur la page « Tarifs » : il est calculé à part du prix d’un logement.'],
    ],
    links: [G.irl, G.quittance, G.avenant, G.loyers, G.mfoncier],
    sources: [GARAGE, MICRO_FONCIER],
  },
  {
    slug: 'particulier',
    kind: 'profil',
    name: 'Propriétaire particulier',
    title: 'Logiciel de gestion locative pour propriétaire particulier',
    description: 'Un ou quelques logements en nom propre : bail conforme, loyers et quittances qui se gèrent seuls, révision, charges et déclaration. Premier mois offert, sans engagement.',
    lead: 'Vous louez en votre nom un studio ou quelques appartements. Bailio prépare le bail, suit les loyers et vous donne les cases de la déclaration.',
    cta: START,
    facts: [
      ['Bail vide', '3 ans pour un particulier, dépôt d’un mois de loyer au plus'],
      ['Bail meublé', '1 an, dépôt de 2 mois au plus'],
      ['Congé du bailleur', '6 mois avant l’échéance en vide, 3 mois en meublé'],
      ['Micro-foncier', 'Jusqu’à 15 000 € de loyers par an, abattement de 30 %'],
      ['Revenus', 'Fonciers en vide, BIC en meublé'],
    ],
    blocks: [
      { h: 'Ce qui s’applique à vous' },
      { p: 'En nom propre, la loi du 6 juillet 1989 s’applique : bail de 3 ans en vide et d’un an en meublé, dépôt de garantie plafonné, congé encadré. La durée la plus longue, 6 ans, est réservée aux bailleurs personnes morales.' },
      { h: 'Un bail conforme, et le bon locataire' },
      { list: ['Le contrat type officiel, à jour des derniers décrets, avec la notice d’information et vos diagnostics en annexe.', 'Avant la signature, Bailio contrôle le plafond du loyer, le DPE et la validité des diagnostics, et refuse de signer si une règle n’est pas respectée.', 'Pour trouver le locataire : une annonce avec les mentions obligatoires et un lien de candidature sans compte, qui ne demande que les pièces autorisées.'] },
      { h: 'Le loyer qui se gère seul' },
      { list: ['Vous déposez le relevé de votre banque : les virements sont rapprochés des loyers attendus.', 'La quittance part dès que le loyer est noté reçu, avec l’accord du locataire.', 'En cas d’impayé, trois lettres peuvent partir à vos dates, si vous activez les relances automatiques.'] },
      { h: 'Révision, charges et déclaration' },
      { list: ['Révision : l’IRL du bon trimestre, le calcul et la lettre, à la date anniversaire. Bailio la refuse pour un logement classé F ou G.', 'Charges : régularisation au prorata des jours d’occupation.', 'Déclaration : micro-foncier ou réel, le régime le plus avantageux, et les cases à recopier sur impots.gouv.fr.'] },
      { h: 'Pourquoi Bailio' },
      { list: ['Les règles de la loi sont codées et testées, et les textes officiels reproduits à l’identique.', 'Un prix unique, tout compris : signature en ligne, quittances, relances et déclaration sans option payante.', 'Vos données sont hébergées en Suisse chez Infomaniak, sans aucun traceur.', 'Vous gardez la main : chaque envoi à un locataire passe d’abord par une confirmation.'] },
      { price: true },
      { h: 'Ce que le logiciel doit faire pour vous' },
      { list: ['Un bail juridiquement solide, avec des contrôles avant la signature.', 'Des quittances et des relances qui partent au bon moment.', 'Le suivi des loyers sans ressaisie.', 'L’aide à la déclaration : les cases, pas seulement un total.', 'Des données protégées, exportables, sans traceur publicitaire.'] },
    ],
    faq: [
      ['Bailio convient-il pour un seul logement ?', 'Oui. Le prix se calcule par logement et par mois, et le premier mois est offert.'],
      ['Mon locataire doit-il avoir un compte ?', 'Non, il n’y a pas d’espace locataire. Il reçoit des liens par email pour signer, envoyer ses pièces ou son attestation d’assurance.'],
      ['Bailio encaisse-t-il les loyers ?', 'Non. Les loyers arrivent sur votre compte : Bailio les suit et édite les quittances.'],
      ['Bailio dépose-t-il ma déclaration ?', 'Non, l’administration n’accepte pas de fichier d’un particulier. Bailio vous donne les cases à recopier.'],
      ['Puis-je tout exporter si je pars ?', 'L’export de vos données est disponible dans « Mon compte », confirmé par un code envoyé par email.'],
      ['Y a-t-il des options payantes à l’acte ?', 'Non : la signature en ligne, les quittances et les relances sont comprises dans le prix.'],
    ],
    links: [G.contrat, G.loyers, G.impayes, G.impots, G.mfoncier, G.irl, { to: '/tarifs', label: 'Tarifs' }, { to: '/demo', label: 'Essayer la démo sans compte' }],
    sources: [REDACTION, DEPOT, CONGE_BAILLEUR, MICRO_FONCIER],
  },
  {
    slug: 'sci',
    kind: 'profil',
    name: 'SCI et sociétés',
    title: 'Gestion locative pour une SCI ou une société',
    description: 'Une SCI ou une société détient vos logements : bail conforme, associés et parts, loyers suivis, et la bonne déclaration pour chaque structure. Premier mois offert.',
    lead: 'Vos logements sont détenus par une SCI ou une société. Chaque logement est rattaché à sa structure, et chaque structure a sa fiche.',
    cta: START,
    facts: [
      ['Bailleur personne morale', 'Bail de 6 ans en vide'],
      ['Structures dans Bailio', 'En votre nom, à plusieurs, SCI familiale ou non, autre société'],
      ['Régime fiscal', 'IR ou IS, avec associés et parts'],
      ['Congé pour reprise', 'Refusé à une personne morale'],
      ['Loyers', 'Reçus sur le compte de la structure'],
    ],
    blocks: [
      { h: 'Ce qui s’applique à vous' },
      { p: 'Un bail vide conclu par une personne morale dure au moins 6 ans, contre 3 ans pour un particulier. Bailio applique la durée prévue selon la nature de la structure, SCI familiale ou non, indiquée dans sa fiche.' },
      { p: 'Le congé pour reprendre le logement n’est pas ouvert à une personne morale : Bailio le refuse, avec la règle propre à la SCI familiale prise en compte.' },
      { h: 'Un bail conforme et le bon locataire' },
      { list: ['Le bailleur du bail réunit votre profil (identité, signature) et la structure (société, co-propriétaires, IBAN).', 'Un bail signé garde le bailleur de sa signature ; les baux en préparation suivent la structure.', 'Contrat type officiel, notice d’information et diagnostics en annexe, avec les mêmes contrôles avant la signature que pour un particulier.'] },
      { h: 'Le loyer qui se gère seul' },
      { list: ['Chaque logement est rattaché à sa structure, choisie à sa création.', 'Les loyers sont suivis par logement : attendu, reçu, en retard.', 'Quittances et relances partent seules, avec le compte de la structure sur le bail.'] },
      { h: 'Révision, charges et déclaration' },
      { list: ['Révision et régularisation des charges comme pour tout bail.', 'La déclaration personnelle ne reprend que les logements détenus en nom propre ou à plusieurs.', 'Chaque SCI ou société reçoit sa fiche : ce qui se dépose, la part de chaque associé et la date limite.', 'Bailio ne dépose rien : la liasse d’une société à l’IS se fait avec un expert-comptable.'] },
      { h: 'Pourquoi Bailio' },
      { list: ['Plusieurs structures, un seul espace, avec un accès partagé possible pour un associé ou un comptable.', 'Des règles de la loi codées et testées.', 'Aucun traceur, hébergement en Suisse chez Infomaniak.', 'Un prix unique, tout compris, par logement.'] },
      { price: true },
      { h: 'Ce que le logiciel doit faire pour vous' },
      { list: ['Séparer chaque structure : logements, associés, compte qui reçoit les loyers.', 'Donner la bonne déclaration pour chacune.', 'Laisser un associé ou un comptable consulter, sans tout modifier.', 'Exporter les loyers et dépenses pour le comptable.'] },
    ],
    faq: [
      ['Quelle durée de bail pour une SCI ?', 'Un bail vide conclu par une personne morale dure au moins 6 ans. Bailio applique la durée selon la nature de la structure, indiquée dans sa fiche.'],
      ['Puis-je gérer plusieurs SCI ?', 'Oui : chaque logement est rattaché à sa structure, et chaque structure a sa fiche.'],
      ['Bailio fait-il la comptabilité de ma société ?', 'Non. Il suit loyers et dépenses, exporte pour le comptable, et indique la déclaration à faire. La liasse d’une société à l’IS reste à faire avec un expert-comptable.'],
      ['Mon associé peut-il avoir accès ?', 'Oui : vous invitez un associé, un comptable (lecture seule) ou un intervenant, et vous retirez l’accès quand vous voulez.'],
      ['Qui encaisse les loyers ?', 'Vous. Bailio n’encaisse jamais les loyers : ils arrivent sur le compte de la structure.'],
      ['Puis-je reprendre mes baux existants ?', 'Oui : un bail signé s’importe en photo, ou depuis un fichier CSV ou Excel pour plusieurs logements.'],
    ],
    links: [G.contrat, G.loyers, G.impots, G.mfoncier, G.irl, { to: '/changer-pour-bailio', label: 'Changer pour Bailio' }, { to: '/tarifs', label: 'Tarifs' }],
    sources: [REDACTION, MICRO_FONCIER],
  },
  {
    slug: 'lmnp',
    kind: 'profil',
    name: 'Loueur meublé (LMNP)',
    title: 'Gestion locative pour loueur en meublé non professionnel',
    description: 'Location meublée non professionnelle : bail meublé conforme, micro-BIC ou réel estimé, CFE 1447-C-SD pré-remplie, rappel du guichet de l’INPI. Premier mois offert.',
    lead: 'Vous louez un meublé en tant que particulier. Bailio prépare le bail et compare micro-BIC et régime réel pour vous.',
    cta: START,
    facts: [
      ['Statut', 'Loueur meublé non professionnel (LMNP), revenus en BIC'],
      ['Micro-BIC', 'Abattement de 50 %, plafond de 83 600 € pour les revenus 2026'],
      ['Début d’activité', 'À déclarer au guichet unique dans les 15 jours, SIRET gratuit'],
      ['Régime réel', 'Charges et amortissements déduits, déficit reporté 10 ans'],
      ['Bail', '1 an, dépôt de 2 mois au plus'],
    ],
    blocks: [
      { h: 'Ce qui s’applique à vous' },
      { p: 'Vous êtes loueur meublé non professionnel (LMNP) si vos recettes de location sont inférieures à 23 000 € par an, ou inférieures à vos autres revenus professionnels : au moins l’une des deux conditions suffit. Vos loyers sont des bénéfices industriels et commerciaux (BIC). Pour la première location, vous vous inscrivez sur le guichet unique des formalités d’entreprises dans les 15 jours, gratuitement, ce qui donne un numéro SIRET à reporter sur votre déclaration.' },
      { h: 'Un bail conforme et le bon locataire' },
      { list: ['Bail meublé d’un an, ou de 9 mois pour un étudiant, avec dépôt de 2 mois de loyer au plus.', 'Bailio vérifie les 11 éléments de mobilier obligatoires avant de créer le bail.', 'Un inventaire du mobilier est annexé, comme les diagnostics et la notice d’information.'] },
      { h: 'Le loyer qui se gère seul' },
      { list: ['Relevé bancaire rapproché des loyers attendus.', 'Quittances envoyées dès que le loyer est noté reçu.', 'Relances d’impayés à vos dates, si vous les activez.'] },
      { h: 'Révision, charges et déclaration' },
      { list: ['Micro-BIC : les recettes moins un abattement forfaitaire de 50 %, plafond de 83 600 € pour les revenus 2026 (77 700 € pour 2025).', 'Régime réel : Bailio estime le résultat avec des amortissements simplifiés (logement hors terrain, mobilier, travaux), et le compare au micro-BIC.', 'CFE : la déclaration 1447-C-SD d’un meublé commencé dans l’année sort pré-remplie, avec votre SIRET.', 'Bailio vous rappelle l’inscription au guichet unique de l’INPI.', 'La liasse fiscale du régime réel (2031) reste à faire avec un expert-comptable ou un logiciel agréé.'] },
      { h: 'Pourquoi Bailio' },
      { list: ['Micro-BIC et réel comparés, jamais le micro au-delà du plafond.', 'Un parcours guidé de la déclaration, case par case.', 'Aucun traceur, hébergement en Suisse chez Infomaniak.', 'Un prix unique, tout compris.'] },
      { price: true },
      { h: 'Ce que le logiciel doit faire pour vous' },
      { list: ['Un bail meublé complet, avec le mobilier vérifié.', 'Le régime le plus avantageux, expliqué.', 'Les démarches du début d’activité : SIRET et CFE.', 'Les cases à recopier, sans prise de tête.'] },
    ],
    faq: [
      ['Qu’est-ce qu’un LMNP ?', 'Un loueur en meublé non professionnel : un particulier dont les recettes de location sont inférieures à 23 000 € par an, ou inférieures à ses autres revenus professionnels.'],
      ['Micro-BIC ou régime réel ?', 'Le micro-BIC applique un abattement de 50 % et ne déduit aucune charge. Le réel déduit les charges et les amortissements. Bailio estime les deux et vous montre le plus avantageux.'],
      ['Quel est le plafond du micro-BIC ?', '83 600 € de recettes pour les revenus de 2026, 77 700 € pour ceux de 2025.'],
      ['Dois-je m’inscrire quelque part ?', 'Oui, sur le guichet unique des formalités d’entreprises, dans les 15 jours qui suivent la première location. C’est gratuit et vous obtenez un SIRET.'],
      ['Bailio fait-il ma liasse fiscale ?', 'Non. Bailio estime votre résultat. La liasse du régime réel se fait avec un expert-comptable ou un logiciel agréé.'],
      ['Et la CFE ?', 'Bailio pré-remplit la déclaration 1447-C-SD d’un meublé commencé dans l’année. Savoir si vous devez la CFE dépend de votre situation : le service des impôts des entreprises vous renseigne.'],
    ],
    links: [G.contrat, G.impots, G.loyers, G.irl, { to: '/bail/location-meublee', label: 'Bail de location meublée' }, { to: '/bail/bail-etudiant', label: 'Bail étudiant' }, { to: '/tarifs', label: 'Tarifs' }],
    sources: [LMNP, MEUBLE, DEPOT],
  },
]

export const solutionPath = (s: Pick<Solution, 'slug' | 'kind'>) => (s.kind === 'bail' ? `/bail/${s.slug}` : `/gestion-locative/${s.slug}`)

export const BAUX = SOLUTIONS.filter((s) => s.kind === 'bail')
export const PROFILS = SOLUTIONS.filter((s) => s.kind === 'profil')

/** Prénom et nom tirés de l'adresse LinkedIn du fondateur (config.ts) : rien d'autre n'est affirmé sur lui. */
export const founderName = () =>
  (FOUNDER_LINKEDIN.replace(/\/$/, '').split('/').pop() ?? '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/** À propos : la page de présentation (/a-propos). */
export const ABOUT_FAQ: Array<[string, string]> = [
  ['Qui a créé Bailio ?', `Bailio a été créé par ${founderName()}. Son profil LinkedIn est lié sur cette page.`],
  ['Où sont mes données ?', 'En Suisse, chez Infomaniak. Aucun cookie ni traceur, aucune donnée envoyée à un service d’IA.'],
  ['Bailio encaisse-t-il mes loyers ?', 'Non. Les loyers arrivent directement sur votre compte. Bailio les suit, rapproche votre relevé bancaire et édite les quittances.'],
  ['Bailio est-il un avocat ?', 'Non. Bailio applique les règles de la loi et vous en avertit, mais ne donne pas de conseil juridique personnalisé.'],
  ['Comment joindre l’équipe ?', `Par la page Contact (on vous rappelle le jour même, du lundi au vendredi) ou par email à ${CONTACT_EMAIL}.`],
]
