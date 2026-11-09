/**
 * Textes des sections de l'accueil (pages/Home.tsx). Même ordre de rubriques que les grands logiciels de gestion
 * locative, rédaction propre à Bailio. Seulement ce que l'application fait vraiment ; chiffres repris de config.ts ou de
 * docs/strategie/prix-2026-11.md (prix du marché relevés en novembre 2026). Aucun avis, aucune note inventés.
 */

/** « Tout ce que vous faisiez à la main » : une capture sur ordinateur par point (client/public/fonctionnalites/). */
export const MANUAL: Array<{ title: string; text: string; img: string; alt: string }> = [
  { title: 'Votre semaine, d’un coup d’œil', text: '« Aujourd’hui » rassemble ce qui est à faire, déjà préparé : un loyer en retard, un bail qui arrive à échéance, un état des lieux.', img: 'today', alt: 'Écran « Aujourd’hui » de Bailio avec les actions de la semaine et les prochaines échéances.' },
  { title: 'Chaque logement, avec son bail et son loyer', text: 'Une carte par logement : le locataire, le loyer, l’état du mois. Les logements d’un même immeuble sont regroupés.', img: 'logements', alt: 'Page « Vos logements » de Bailio : trois logements loués, un loyer en retard.' },
  { title: 'Qui est à jour, en un regard', text: 'Le tableau de bord met en tête ce qui demande votre attention : loyer en retard, bail à renouveler, diagnostic à refaire.', img: 'patrimoine', alt: 'Tableau de bord de Bailio : loyers attendus, ce qu’il reste, logements à surveiller.' },
  { title: 'Votre relevé pointe les loyers', text: 'Déposez le fichier de votre banque : les virements de vos locataires sont reconnus et les quittances partent.', img: 'releve', alt: 'Page « Vos loyers reçus, en un clic » de Bailio pour déposer le relevé bancaire.' },
  { title: 'Tous les actes du bail, au même endroit', text: 'Quittances, révision, congé, mise en demeure, avenant : chaque courrier est rempli avec les données du bail.', img: 'bail', alt: 'Page d’un bail dans Bailio avec ses loyers, ses quittances et ses actions.' },
  { title: 'Vos dépenses, rangées pour les impôts', text: 'Loyers encaissés, dépenses et résultat par logement, avec l’export pour votre comptable.', img: 'argent', alt: 'Page « Argent » de Bailio : loyers encaissés, dépenses et loyers par mois.' },
  { title: 'Votre déclaration, préparée à l’avance', text: 'Micro ou réel, vide ou meublé : les cases à recopier sur impots.gouv.fr, et la 2044 remplie.', img: 'impots', alt: 'Page « Déclarer vos revenus locatifs » de Bailio.' },
  { title: 'Vos candidats, triés pour vous', text: 'Un lien à coller dans votre annonce. Les dossiers arrivent complets et sont classés sur les ressources, la garantie et les pièces.', img: 'candidats', alt: 'Liste des candidats dans Bailio : dossier solide ou à compléter, avec les raisons.' },
]

/** Six automatismes : ce qui tourne sans vous, une fois réglé. */
export const AUTOMATIONS: Array<{ title: string; text: string; to: string }> = [
  { title: 'Loyers rapprochés depuis votre relevé', text: 'Le montant, la date et le nom du locataire sont comparés aux loyers attendus. Ce qui est incertain vous est montré, jamais coché seul.', to: '/fonctionnalites/quittance-de-loyer' },
  { title: 'Quittances envoyées dès le loyer reçu', text: 'Faites, rangées avec le bail et envoyées par email si votre locataire l’a accepté.', to: '/fonctionnalites/quittance-de-loyer' },
  { title: 'Relances d’impayés au bon moment', text: 'Relance amiable, second rappel puis mise en demeure, aux jours que vous choisissez. Tout s’arrête au paiement.', to: '/fonctionnalites/loyers-impayes' },
  { title: 'Bail conforme, signé en ligne', text: 'Le contrat type officiel, vérifié avant la signature : durée, dépôt, DPE, loyer en zone tendue. Signature incluse.', to: '/fonctionnalites/contrat-de-location' },
  { title: 'État des lieux sur téléphone', text: 'Pièce par pièce, photos datées, signature sur place, et la sortie comparée à l’entrée.', to: '/fonctionnalites/etat-des-lieux' },
  { title: 'Rappels et déclaration', text: 'Révision du loyer, attestation d’assurance, échéances fiscales : rappelées à temps, préparées d’avance.', to: '/fonctionnalites/declaration-impots' },
]

/** Toutes les fonctionnalités, toutes comprises dans le prix. */
export const ALL_FEATURES: string[] = [
  'Rapprochement du relevé bancaire',
  'Quittances automatiques',
  'Avis d’échéance',
  'Relances d’impayés',
  'Révision du loyer (IRL)',
  'Régularisation des charges',
  'Bail vide, meublé ou garage',
  'Signature électronique',
  'Annonce aux mentions obligatoires',
  'Candidatures sans compte',
  'Pièces filigranées contre la revente',
  'État des lieux sur téléphone',
  'Sortie comparée à l’entrée',
  'Lien du locataire (assurance, signalements)',
  'Rappels d’assurance',
  'Courriers prêts à envoyer',
  'SCI, indivision et structures',
  'Tableau de bord et rendement',
  'Aide à la déclaration et formulaires remplis',
  'Export pour le comptable',
  'Accès pour un associé ou un comptable',
  'Import par fichier ou bail en photo',
]

/** Six raisons de choisir Bailio. */
export const REASONS: Array<{ title: string; text: string }> = [
  { title: 'Un bail qui respecte la loi, vérifié pour vous', text: 'Bailio refuse ce que la loi interdit avant la signature : dépôt trop élevé, logement interdit à la location, loyer au-dessus du plafond.' },
  { title: 'Tout est compris, sans option', text: 'Signature en ligne, états des lieux, relances et aide à la déclaration : rien n’est facturé à l’acte.' },
  { title: 'Le prix le plus bas des offres complètes', text: 'Moins que les logiciels complets relevés en novembre 2026, et bien moins qu’une agence (4 à 10 % du loyer).' },
  { title: 'Les dossiers de vos candidats protégés', text: 'Chaque justificatif reçoit un filigrane « uniquement pour louer ce logement », contre les fausses annonces et la revente.' },
  { title: 'Vos données en Suisse, sans traceur', text: 'Hébergées chez Infomaniak à Genève, sans cookie publicitaire ni mesure d’audience tierce.' },
  { title: 'Une personne vous rappelle', text: 'Une question, une reprise de vos baux : on vous rappelle le jour même, du lundi au vendredi.' },
]

/** « Derrière chaque règle, une source officielle » : remplace l'argument de l'expert maison. */
export const EXPERTISE = {
  title: 'Derrière chaque règle, une source officielle.',
  points: [
    'Les règles de la loi du 6 juillet 1989 sont écrites dans le code de Bailio et testées : durée du bail, dépôt maximum, préavis, interdiction de louer selon le DPE, plafonds de loyer.',
    'Les textes officiels joints au bail (notice d’information, listes des réparations et des charges) sont reproduits mot pour mot, dans leur dernière version.',
    'Chaque guide et chaque modèle cite sa source (service-public.fr, Légifrance) et la date de sa vérification.',
  ],
}

/** Garanties, sous le prix. */
export const GUARANTEES: string[] = [
  'Premier mois offert, sans carte bancaire',
  'Sans engagement : vous partez quand vous voulez',
  'Toutes vos données exportables en un clic',
  'Un email vous prévient avant tout paiement',
]

/** Tableur, agence ou logiciel : que choisir ? Faits généraux, sans nommer personne. */
export const COMPARE = {
  columns: ['Tableur', 'Agence', 'Bailio'] as const,
  rows: [
    { label: 'Prix', values: ['Gratuit', '4 à 10 % du loyer', 'PRICE'] },
    { label: 'Bail conforme', values: ['À vérifier vous-même', 'Oui', 'Vérifié avant la signature'] },
    { label: 'Quittances', values: ['À faire à la main', 'Oui', 'Envoyées seules'] },
    { label: 'Loyers impayés', values: ['À surveiller vous-même', 'Selon le mandat', 'Relances automatiques'] },
    { label: 'Déclaration de revenus', values: ['À calculer', 'Selon le mandat', 'Cases préparées'] },
    { label: 'Qui décide', values: ['Vous', 'L’agence, par mandat', 'Vous'] },
  ],
}

/** Opérationnel en quelques minutes. */
export const START: Array<{ title: string; text: string }> = [
  { title: 'Créez votre espace', text: 'Votre email suffit : un lien de connexion, pas de mot de passe.' },
  { title: 'Ajoutez vos logements', text: 'Un fichier Excel ou CSV depuis votre ancien logiciel, un bail en photo, ou quelques questions.' },
  { title: 'Laissez tourner', text: 'Quittances, relances, rappels et déclaration se préparent seuls. Vous validez.' },
]

/** Comment choisir son logiciel de gestion locative : critères généraux, utiles même sans Bailio. */
export const CHOOSE: Array<{ title: string; text: string }> = [
  { title: 'Un bail juridiquement solide', text: 'Le contrat type officiel, à jour des derniers décrets, et des contrôles avant la signature : c’est ce qui vous protège en cas de litige.' },
  { title: 'Des quittances et des relances automatiques', text: 'Ce sont les tâches les plus répétées de l’année : elles doivent partir seules, au bon moment.' },
  { title: 'Le suivi des loyers', text: 'Savoir sans effort qui a payé : relevé bancaire rapproché ou connexion à la banque.' },
  { title: 'L’aide à la déclaration', text: 'Micro ou réel, vide ou meublé : le logiciel doit vous donner les cases, pas seulement un total.' },
  { title: 'Un prix lisible, tout compris', text: 'Méfiez-vous des options payantes à l’acte (signature, recommandé) qui font grimper la facture.' },
  { title: 'Vos données protégées', text: 'Où sont-elles hébergées ? Pouvez-vous tout exporter en partant ? Y a-t-il des traceurs publicitaires ?' },
]

/** Bandeau de confiance, en bas de page. */
export const TRUST: Array<{ title: string; text: string }> = [
  { title: 'Hébergé en Suisse', text: 'Infomaniak, Genève' },
  { title: 'Aucun traceur', text: 'Ni cookie publicitaire, ni bandeau' },
  { title: 'Règles sourcées', text: 'service-public.fr, Légifrance' },
  { title: 'Sans engagement', text: 'Premier mois offert' },
]
