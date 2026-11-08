/**
 * Pages « Fonctionnalités » (/fonctionnalites, /fonctionnalites/:slug) : ce que fait Bailio, montré avec de vraies
 * captures d'un compte d'exemple (client/public/fonctionnalites/, à refaire quand les écrans changent).
 * Seulement ce que l'application fait vraiment ; une règle de droit = un lien vers le guide qui la cite avec sa source.
 * Nouvelle page : plan du site, llms.txt, page HTML et mesure d'audience la reprennent seuls (vite.config.ts, visits.ts).
 */

export interface FeatureStep {
  title: string
  text: string
  /** Capture (client/public/fonctionnalites/<img>.webp) et sa description. */
  img?: string
  alt?: string
}

export interface Feature {
  slug: string
  /** Nom court (menu, cartes). */
  name: string
  /** Titre de la page ; la partie entre crochets est mise en italique. */
  title: string
  description: string
  lead: string
  img: string
  alt: string
  steps: FeatureStep[]
  /** Ce que Bailio vérifie ou fait à votre place, en une ligne chacun. */
  checks: string[]
  faq: Array<{ q: string; a: string }>
  links: Array<{ label: string; to: string }>
}

export const FEATURES: Feature[] = [
  {
    slug: 'contrat-de-location',
    name: 'Bail et signature',
    title: 'Un bail conforme, [signé en ligne]',
    description: 'Bail vide, meublé ou garage selon le contrat type officiel, vérifié avant la signature, signé en ligne et inclus dans le prix.',
    lead: 'Vous répondez à quelques questions, Bailio rédige le bail sur le contrat type officiel et refuse ce que la loi interdit. Vous et votre locataire signez en ligne, sans frais en plus.',
    img: 'bail',
    alt: 'Page d’un bail signé dans Bailio : locataire, adresse, dates et onglets Loyers, Le bail, Locataire.',
    steps: [
      { title: 'Saisi une fois, repris partout', text: 'La fiche du logement et celle du locataire remplissent le bail. Le loyer, les diagnostics et l’équipement ne se tapent qu’une fois.' },
      { title: 'Le contrat type, rubrique par rubrique', text: 'Location vide ou meublée selon le décret de 2015, dans sa rédaction en vigueur, avec la notice d’information jointe. Garage ou place : un contrat propre au Code civil.', img: 'contrat-pdf', alt: 'Première page d’un contrat de location généré par Bailio, logement nu, désignation des parties et du logement.' },
      { title: 'Signé en ligne, sans supplément', text: 'Chacun reçoit son lien et signe sur son téléphone. Le certificat de signature est joint au bail, rangé avec le logement.' },
    ],
    checks: ['Durée du bail et dépôt de garantie dans les limites de la loi', 'Logement interdit à la location selon son DPE : bail bloqué, avec le motif', 'Diagnostics expirés signalés avant la signature', 'Loyer contrôlé en zone tendue et dans les villes encadrées'],
    faq: [
      { q: 'La signature en ligne est-elle payante ?', a: 'Non. Elle est comprise dans le prix, pour le bail comme pour l’état des lieux.' },
      { q: 'J’ai déjà un bail signé, sur papier.', a: 'Prenez-le en photo ou déposez le PDF : Bailio lit le locataire, le loyer et les dates, vous vérifiez, et le suivi repart.' },
      { q: 'Et pour un garage ou une place de parking ?', a: 'Bailio prépare un contrat de location de stationnement, avec la durée et le préavis que vous choisissez.' },
    ],
    links: [
      { label: 'Guide : le dépôt de garantie', to: '/guides/depot-de-garantie' },
      { label: 'Guide : DPE et logements interdits à la location', to: '/guides/dpe-location-interdite' },
      { label: 'Simulateur : mon logement peut-il être loué ?', to: '/simulateurs/dpe-location' },
    ],
  },
  {
    slug: 'quittance-de-loyer',
    name: 'Loyers et quittances',
    title: 'Le loyer arrive, [la quittance part]',
    description: 'Quittances de loyer envoyées toutes seules par email, relevé bancaire rapproché en un clic, avis d’échéance : le suivi des loyers sans tableur.',
    lead: 'Notez le loyer reçu, ou déposez le relevé de votre banque : Bailio reconnaît les virements de vos locataires et envoie chaque quittance tout de suite.',
    img: 'quittances',
    alt: 'Partie « Loyers et quittances » d’un bail dans Bailio : loyer du mois payé et interrupteurs d’envoi automatique.',
    steps: [
      { title: 'Un clic sur « Loyer reçu »', text: 'La quittance est faite, rangée avec le bail et envoyée par email si votre locataire l’a accepté. Un paiement partiel donne un reçu, jamais une quittance.' },
      { title: 'Votre relevé bancaire, rapproché', text: 'Téléchargez le fichier CSV ou OFX de votre banque et déposez-le : les loyers attendus sont retrouvés, vous cochez, c’est enregistré. Le fichier n’est pas conservé.', img: 'releve', alt: 'Page « Vos loyers reçus, en un clic » de Bailio : comment télécharger puis déposer le relevé bancaire.' },
      { title: 'Le bon montant, chaque mois', text: 'Après une révision, le nouveau loyer s’applique à sa date. Quittances, retards et déclaration de revenus suivent le même historique.' },
    ],
    checks: ['Loyer et charges séparés sur chaque quittance', 'Accord du locataire pour l’envoi par email respecté et daté', 'Premier mois au prorata calculé', 'Aucune quittance supposée sans votre accord exprès'],
    faq: [
      { q: 'Dois-je relier mon compte bancaire ?', a: 'Non. Vous déposez le relevé téléchargé depuis votre banque. Bailio le lit sur son serveur et ne le garde pas.' },
      { q: 'Mon locataire préfère le papier.', a: 'Sans son accord pour l’email, la quittance reste prête dans le bail : vous l’imprimez ou l’envoyez autrement.' },
    ],
    links: [
      { label: 'Guide : la quittance de loyer', to: '/guides/quittance-de-loyer' },
      { label: 'Guide : la révision du loyer avec l’IRL', to: '/guides/revision-du-loyer-irl' },
      { label: 'Simulateur : révision du loyer', to: '/simulateurs/revision-loyer' },
    ],
  },
  {
    slug: 'loyers-impayes',
    name: 'Impayés et relances',
    title: 'Un loyer en retard\u00a0? [Relancé à temps]',
    description: 'Relances automatiques d’un loyer impayé à J+3, J+8 et J+15, lettres prêtes, parcours guidé jusqu’au commandement de payer.',
    lead: 'Activez les relances une fois. Si le loyer n’est pas noté reçu, votre locataire reçoit une relance amiable, puis un second rappel, puis une mise en demeure. Vous recevez une copie de chaque envoi.',
    img: 'relances',
    alt: 'Interrupteur « Relancer automatiquement un loyer impayé » activé dans Bailio, avec les jours J+3, J+8 et J+15.',
    steps: [
      { title: 'Vous choisissez les jours', text: 'Par défaut 3, 8 et 15 jours après l’échéance, réglables. Chaque lettre reprend toute la somme due et les mois concernés.' },
      { title: 'Tout s’arrête dès le paiement', text: 'Le loyer est noté reçu, à la main ou depuis le relevé : plus aucune relance ne part. Une étape n’est jamais envoyée deux fois.' },
      { title: 'Et si ça ne suffit pas', text: 'Le parcours « Impayé » vous dit quoi faire ensuite : appel à la caution, commandement de payer, aide au logement à signaler.', img: 'today', alt: 'Écran « Aujourd’hui » de Bailio : les actions de la semaine, déjà préparées.' },
    ],
    checks: ['Retards calculés de la même façon partout (tableau, lettres, tâches)', 'Jamais de mise en demeure d’un coup si vous activez tard', 'Rappel d’envoyer aussi la mise en demeure en recommandé', 'Copie de chaque lettre dans vos documents'],
    faq: [
      { q: 'Les relances sont-elles activées d’office ?', a: 'Non. Elles restent coupées tant que vous ne les activez pas, bail par bail, après une confirmation.' },
      { q: 'Puis-je relancer moi-même ?', a: 'Oui : chaque lettre est aussi disponible à l’unité dans les courriers du bail, avec un aperçu avant l’envoi.' },
    ],
    links: [
      { label: 'Guide : 3 ans pour réclamer un impayé', to: '/guides/impaye-loyer-charges-delai-3-ans' },
      { label: 'Modèle : relance amiable', to: '/modeles/relance-loyer-impaye' },
      { label: 'Modèle : mise en demeure de payer', to: '/modeles/mise-en-demeure-loyer-impaye' },
    ],
  },
  {
    slug: 'etat-des-lieux',
    name: 'État des lieux',
    title: 'L’état des lieux [sur votre téléphone]',
    description: 'État des lieux d’entrée et de sortie pièce par pièce sur téléphone, photos datées, signature sur place, sortie comparée à l’entrée.',
    lead: 'Pièce par pièce, élément par élément, avec des photos datées par le serveur. Votre locataire signe sur votre téléphone, chacun reçoit le PDF.',
    img: 'edl',
    alt: 'État des lieux dans Bailio sur téléphone : liste des pièces à faire, séjour et chambre.',
    steps: [
      { title: 'Pièce par pièce', text: 'Sols, murs, plafonds, équipements : un état et une remarque par élément, une photo d’ensemble par pièce, les compteurs et les clés.' },
      { title: '10 jours pour un complément', text: 'Votre locataire demande un ajout depuis son lien. Vous acceptez ou refusez sur le même écran, et le PDF complété part aux deux.' },
      { title: 'La sortie, comparée à l’entrée', text: 'Sous chaque élément, l’état et les photos de l’entrée. Les évolutions sont repérées, et les retenues justifiées passent dans le solde de tout compte.' },
    ],
    checks: ['Mentions obligatoires de l’état des lieux', 'Photos horodatées par le serveur, pas par le téléphone', 'Usure normale jamais retenue', 'Délai de restitution du dépôt de garantie calculé'],
    faq: [
      { q: 'Mon logement a une pièce en plus ?', a: 'Ajoutez-la d’un clic : chaque pièce a ses éléments et sa photo d’ensemble.' },
      { q: 'Combien coûte l’état des lieux ?', a: 'Il est compris dans le prix, entrée et sortie, avec la signature.' },
    ],
    links: [
      { label: 'Guide : l’état des lieux d’entrée', to: '/guides/etat-des-lieux-entree-10-jours' },
      { label: 'Simulateur : restitution du dépôt de garantie', to: '/simulateurs/depot-de-garantie' },
      { label: 'Modèle : restitution du dépôt de garantie', to: '/modeles/restitution-depot-de-garantie' },
    ],
  },
  {
    slug: 'candidatures',
    name: 'Annonce et candidats',
    title: 'Trouver un locataire, [sans paperasse]',
    description: 'Annonce avec les mentions obligatoires, lien de candidature à coller sur Leboncoin, pièces autorisées seulement, filigranées, candidats classés sans discrimination.',
    lead: 'Bailio écrit les mentions obligatoires de l’annonce et vous donne un lien de candidature. Les candidats déposent leur dossier, vous comparez en un coup d’œil.',
    img: 'candidats',
    alt: 'Liste des candidats dans Bailio : dossier solide ou à compléter, avec les raisons.',
    steps: [
      { title: 'L’annonce, conforme', text: 'Loyer charges comprises, dépôt, surface, classes énergie et dépenses estimées : ajoutés tout seuls. Le texte se copie sur le site de votre choix.', img: 'annonce', alt: 'Page « Votre annonce » de Bailio : loyer, charges et conditions.' },
      { title: 'Seulement les pièces autorisées', text: 'Vous choisissez dans la liste officielle. Chaque justificatif reçoit un filigrane « uniquement pour louer ce logement », contre la revente des dossiers.' },
      { title: 'Comparer, puis choisir', text: 'Part du loyer dans les ressources, garantie, pièces déposées : « dossier solide », « correct » ou « à compléter ». Choisir un candidat crée sa fiche de locataire.' },
    ],
    checks: ['Aucune pièce interdite demandée', 'Jamais l’âge, la famille ou la situation comme critère', 'Pièces cachées tant que le candidat n’a pas confirmé la visite', 'Candidatures non retenues effacées après 90 jours'],
    faq: [
      { q: 'Le candidat doit-il créer un compte ?', a: 'Non. Il ouvre le lien, répond aux questions une par une et dépose ses pièces.' },
      { q: 'Et DossierFacile ?', a: 'Le candidat peut donner son lien DossierFacile : il compte comme dossier complet.' },
    ],
    links: [
      { label: 'Guide : pièces autorisées et interdites', to: '/guides/pieces-dossier-locataire-autorisees-interdites' },
      { label: 'Guide : la garantie Visale', to: '/guides/garantie-visale-proprietaire' },
    ],
  },
  {
    slug: 'declaration-impots',
    name: 'Impôts',
    title: 'Vos revenus locatifs, [sans prise de tête]',
    description: 'Micro-foncier ou réel, micro-BIC ou réel : Bailio calcule, choisit le régime le plus avantageux et vous donne les cases à recopier sur impots.gouv.fr.',
    lead: 'Vos loyers et vos dépenses de l’année sont déjà dans Bailio. Il vous donne les cases à recopier, écran par écran, et prépare la 2044 et la déclaration de CFE.',
    img: 'impots',
    alt: 'Page « Déclarer vos revenus locatifs, sans prise de tête » de Bailio, avec le choix de l’année.',
    steps: [
      { title: 'Vos chiffres, vérifiés', text: 'Une question à la fois : loyers attendus non enregistrés, intérêts d’emprunt, honoraires. Bailio propose la réponse quand il la connaît.' },
      { title: 'Le régime le plus avantageux', text: 'Micro ou réel, location vide ou meublée : la comparaison est faite, jamais le micro au-delà du plafond.' },
      { title: 'Les cases, prêtes à copier', text: 'Un bouton « Copier » par case, la 2044 remplie, et pour un premier meublé la déclaration de CFE pré-remplie.' },
    ],
    checks: ['Plafonds du micro-foncier et du micro-BIC de l’année', 'Déficit foncier et report calculés', 'SCI et sociétés : la bonne déclaration, à part', 'Déclaration d’occupation rappelée quand le locataire change'],
    faq: [
      { q: 'Bailio dépose-t-il ma déclaration ?', a: 'Non : l’administration n’accepte pas de fichier d’un particulier. Vous recopiez quelques cases, Bailio vous guide.' },
      { q: 'J’ai une SCI.', a: 'Chaque structure a sa fiche : SCI à l’IR, à l’IS ou société, avec ce qui se dépose et la date limite.' },
    ],
    links: [
      { label: 'Simulateur : micro-foncier ou réel', to: '/simulateurs/micro-foncier-ou-reel' },
    ],
  },
]

export const featurePath = (slug: string) => `/fonctionnalites/${slug}`
