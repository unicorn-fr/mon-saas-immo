/**
 * Guides publics de bailio.fr (/guides) : un article écrit par vidéo publiée, pour être trouvé dans Google.
 * Chaque règle citée est vérifiée sur une source officielle, indiquée en fin d'article (« Vérifié le »).
 * Texte simple seulement (pas de HTML) : vouvoiement, phrases courtes, tout terme juridique expliqué.
 * Nouvel article : en tête de la liste (le plus récent d'abord). Sitemap et llms.txt le reprennent seuls (vite.config.ts).
 */

export type GuideBlock =
  | { h: string }
  | { p: string }
  | { list: string[] }
  /** Encadré « À retenir ». */
  | { note: string }

export interface Guide {
  slug: string
  title: string
  /** Une phrase, reprise dans la liste des guides et la description de la page. */
  description: string
  /** Date de publication, AAAA-MM-JJ. */
  date: string
  blocks: GuideBlock[]
  sources: Array<{ label: string; url: string; checked: string }>
}

export const GUIDES: Guide[] = [
  {
    slug: 'impaye-loyer-charges-delai-3-ans',
    title: 'Loyer ou charges impayés : 3 ans pour les réclamer',
    description: 'Combien de temps vous avez pour réclamer un loyer ou des charges impayés, et ce que votre locataire peut exiger après une régularisation tardive.',
    date: '2026-11-08',
    blocks: [
      { p: 'Votre locataire vous doit encore un loyer, ou des charges oubliées lors d’une régularisation ? Vous pouvez toujours les réclamer, mais pas indéfiniment.' },
      { h: 'Le délai : 3 ans' },
      { p: 'Vous avez 3 ans pour réclamer un loyer ou des charges impayés. Exemple : une dette d’octobre 2026 peut être réclamée jusqu’en octobre 2029.' },
      { p: 'Ce délai joue aussi dans l’autre sens : votre locataire a 3 ans pour vous demander le remboursement des charges qu’il a payées en trop.' },
      { h: 'Une régularisation tardive reste possible' },
      { p: 'Vous avez oublié de régulariser les charges ? Vous pouvez encore le faire dans ce délai, que le retard vienne d’un oubli ou d’une négligence. Mais le juge peut refuser un rappel de charges qu’il juge déloyal ou brutal, par exemple si votre locataire vous avait demandé la régularisation sans réponse de votre part.' },
      { h: 'Paiement en 12 mois' },
      { p: 'Si la régularisation n’a pas été faite avant la fin de l’année qui suit celle où les charges étaient dues, votre locataire peut exiger de payer le rappel en 12 mois. Il vous le demande par lettre recommandée avec accusé de réception.' },
      { note: 'Dans Bailio, la régularisation des charges se calcule chaque année à partir des provisions reçues et des dépenses enregistrées, et les impayés restent suivis mois par mois.' },
    ],
    sources: [
      { label: 'Service-public.fr : charges à payer par le locataire (charges récupérables), régularisation tardive', url: 'https://www.service-public.fr/particuliers/vosdroits/F947', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'garantie-visale-proprietaire',
    title: 'Garantie Visale : la caution gratuite qui couvre vos loyers impayés',
    description: 'Ce que couvre Visale, quels locataires peuvent l’obtenir et pourquoi la demande doit être faite avant la signature du bail.',
    date: '2026-11-08',
    blocks: [
      { p: 'Visale est une caution gratuite, accordée par Action Logement. Une caution est la personne ou l’organisme qui s’engage à payer à la place du locataire s’il ne paie pas.' },
      { h: 'Ce qu’elle couvre' },
      { list: ['Jusqu’à 36 mois de loyers et charges impayés pendant les 3 premières années du bail.', 'Les dégradations locatives, quand le locataire quitte définitivement le logement.'] },
      { h: 'Quels locataires ?' },
      { list: ['Les locataires de 30 ans et moins (à partir de 17 ans et 10 mois), sous conditions selon leur situation : étudiant, alternant, salarié, sans emploi…', 'Certains locataires de plus de 30 ans, par exemple un salarié du secteur privé qui gagne 1 710 € nets par mois au plus.'] },
      { p: 'Le loyer charges comprises ne doit pas dépasser un plafond, qui dépend de la région et de la situation du locataire. Le locataire et vous ne devez pas être de la même famille (grands-parents, parents, enfants).' },
      { h: 'Le point à ne pas manquer' },
      { p: 'Votre locataire fait sa demande sur le site de Visale et obtient un visa. Cette demande doit être faite avant la signature du bail. Ensuite, vous signez le contrat de cautionnement en ligne.' },
      { h: 'En cas d’impayé ou de dégradations' },
      { p: 'Vous déclarez l’impayé à Action Logement en respectant ses délais. Pour les dégradations, vous avez 60 jours après avoir récupéré le logement pour demander leur prise en charge.' },
      { note: 'Dans Bailio, la page « Aides et dispositifs » de chaque logement vous dit si Visale semble possible d’après le loyer et la fiche du locataire.' },
    ],
    sources: [
      { label: 'Service-public.fr : garantie Visale, caution pour le locataire (impayés et dégradations)', url: 'https://www.service-public.fr/particuliers/vosdroits/F33453', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'etat-des-lieux-entree-10-jours',
    title: 'État des lieux d’entrée : ce qu’il doit contenir et 10 jours pour le compléter',
    description: 'Comment faire l’état des lieux d’entrée, ce qu’il doit indiquer, combien il coûte et le délai de votre locataire pour le faire compléter.',
    date: '2026-11-08',
    blocks: [
      { p: 'L’état des lieux d’entrée décrit le logement le jour où vous remettez les clés. À la sortie, on le compare à l’état des lieux de sortie : c’est votre preuve en cas de dégradation.' },
      { h: 'Comment le faire ?' },
      { p: 'Vous le faites ensemble, votre locataire et vous (ou votre représentant), à la remise des clés et avec un bon éclairage. Il est écrit, sur papier ou en version électronique, et chacun en reçoit un exemplaire signé.' },
      { h: 'Ce qu’il doit indiquer' },
      { list: ['Le type d’état des lieux (entrée) et sa date.', 'L’adresse du logement et le nom des parties.', 'Les relevés des compteurs individuels d’eau et d’énergie, s’il y en a.', 'Les clés et moyens d’accès remis.', 'Pour chaque pièce : l’état des sols, des murs, des plafonds, des équipements et des meubles, avec vos observations. Des photos peuvent l’illustrer.', 'Les signatures.'] },
      { h: 'Combien ça coûte ?' },
      { p: 'Fait entre vous et votre locataire, il ne coûte rien. Fait par un professionnel, votre locataire paie au plus la moitié des frais, dans une limite fixée. Si l’un de vous refuse de le faire, l’autre peut appeler un commissaire de justice (anciennement huissier) : les frais sont partagés par moitié.' },
      { h: '10 jours pour le compléter' },
      { p: 'Votre locataire peut vous demander de compléter l’état des lieux d’entrée dans les 10 jours qui suivent, pour tout élément du logement. Pour le chauffage, il peut le faire pendant le premier mois de la période de chauffe.' },
      { p: 'Si vous refusez, il peut saisir la commission départementale de conciliation, une instance gratuite qui cherche un accord entre propriétaire et locataire.' },
      { note: 'Dans Bailio, l’état des lieux se remplit pièce par pièce sur téléphone, avec photos datées, et votre locataire demande un complément depuis son lien : vous acceptez ou refusez sur le même écran.' },
    ],
    sources: [
      { label: 'Service-public.fr : état des lieux d’entrée dans un bail d’habitation', url: 'https://www.service-public.fr/particuliers/vosdroits/F31270', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'pieces-dossier-locataire-autorisees-interdites',
    title: 'Dossier de location : les pièces que vous pouvez demander, et celles interdites',
    description: 'La liste officielle des justificatifs autorisés pour un candidat locataire, les pièces interdites et l’amende encourue.',
    date: '2026-11-08',
    blocks: [
      { p: 'Pour choisir votre locataire, vous pouvez vérifier son identité, son domicile, son activité et ses ressources. Mais seulement avec les pièces d’une liste fixée par la loi. Tout le reste est interdit.' },
      { h: 'Les pièces autorisées' },
      { list: ['Identité : une seule pièce en cours de validité, carte d’identité, passeport, permis de conduire ou titre de séjour.', 'Domicile : un seul justificatif, par exemple les 3 dernières quittances de loyer, une attestation de l’hébergeant ou le dernier avis de taxe foncière.', 'Activité : par exemple un contrat de travail, une carte d’étudiant, un extrait K bis pour un commerçant.', 'Ressources : par exemple le dernier ou l’avant-dernier avis d’imposition, les 3 dernières fiches de paie, les 2 derniers bilans pour un indépendant, les justificatifs d’allocations ou de bourse.'] },
      { p: 'Votre candidat peut vous donner une copie. Vous avez le droit de demander à voir l’original.' },
      { h: 'Les pièces interdites' },
      { p: 'Tout document qui n’est pas dans la liste, par exemple un relevé de compte bancaire ou une carte Vitale.' },
      { h: 'Aucun argent avant le bail' },
      { p: 'Vous ne pouvez réclamer aucune somme pour réserver le logement : pas de chèque de réservation, pas d’acompte. Aucune somme ne peut être demandée avant la signature du bail.' },
      { h: 'L’amende' },
      { p: 'Demander une pièce non autorisée expose à une amende pouvant aller jusqu’à 3 000 € (15 000 € pour une société).' },
      { note: 'Dans Bailio, le lien de candidature ne demande que des pièces autorisées, et chaque justificatif reçoit un filigrane qui le protège contre la revente.' },
    ],
    sources: [
      { label: 'Service-public.fr : futur locataire d’un logement privé, justificatifs à donner au propriétaire', url: 'https://www.service-public.fr/particuliers/vosdroits/F1169', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'charges-recuperables-taxe-fonciere',
    title: 'Charges récupérables : la taxe foncière, les ordures ménagères et la régularisation',
    description: 'Ce que votre locataire paie et ne paie pas, la taxe d’ordures ménagères, et comment régulariser les charges chaque année.',
    date: '2026-11-08',
    blocks: [
      { p: 'Les charges récupérables, ou charges locatives, sont les dépenses que vous payez puis que vous pouvez demander à votre locataire. Leur liste est fixée par un décret : ce qui n’y figure pas reste à votre charge.' },
      { h: 'La taxe foncière : non' },
      { p: 'La taxe foncière n’est pas dans la liste. Vous ne pouvez pas la refacturer à votre locataire.' },
      { h: 'La taxe d’ordures ménagères : oui' },
      { p: 'La taxe ou redevance d’enlèvement des ordures ménagères, souvent inscrite sur votre avis de taxe foncière, fait partie des charges récupérables. Tout comme la taxe de balayage et la redevance assainissement.' },
      { h: 'D’autres exemples' },
      { list: ['L’entretien courant des parties communes et le personnel d’entretien.', 'Le fonctionnement et l’entretien courant de l’ascenseur.', 'L’eau des parties communes et des espaces extérieurs.'] },
      { h: 'La régularisation annuelle' },
      { p: 'Si votre locataire paie des provisions, c’est-à-dire des avances mensuelles, vous comparez au moins une fois par an ce qu’il a versé et les dépenses réelles. Un mois avant, vous lui envoyez le décompte par nature de charges. Puis vous tenez les justificatifs à sa disposition pendant 6 mois.' },
      { note: 'Dans Bailio, la régularisation des charges se calcule toute seule, au prorata des jours d’occupation, et le décompte part par courrier ou par email.' },
    ],
    sources: [
      { label: 'Service-public.fr : charges à payer par le locataire (charges locatives ou charges récupérables)', url: 'https://www.service-public.fr/particuliers/vosdroits/F947', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'preavis-locataire-zone-tendue',
    title: 'Préavis du locataire : 1 mois ou 3 mois, la règle de la zone tendue',
    description: 'Quand votre locataire peut partir avec un mois de préavis, ce qu’il doit écrire dans sa lettre et à partir de quand le délai compte.',
    date: '2026-11-08',
    blocks: [
      { p: 'Votre locataire peut quitter le logement à tout moment, à condition de vous prévenir. Ce délai s’appelle le préavis.' },
      { h: 'Location meublée : 1 mois' },
      { p: 'En meublé, le préavis est toujours d’un mois, sans motif à donner.' },
      { h: 'Location vide : 3 mois, ou 1 mois' },
      { p: 'En location vide, le préavis est de 3 mois. Il tombe à 1 mois dans plusieurs cas, notamment si le logement est situé en zone tendue, c’est-à-dire une commune où il est difficile de trouver un logement (liste fixée par décret).' },
      { p: 'Condition : votre locataire doit indiquer dans sa lettre de congé l’adresse du logement et qu’il bénéficie du préavis réduit à un mois. S’il ne le précise pas, le préavis est de 3 mois.' },
      { p: 'Le préavis est aussi d’un mois pour d’autres motifs, par exemple un premier emploi, une mutation, une perte d’emploi, un nouvel emploi après une perte d’emploi ou certains problèmes de santé, avec un justificatif.' },
      { h: 'À partir de quand ?' },
      { p: 'Le préavis commence le jour où vous recevez la lettre recommandée, le jour où le commissaire de justice vous la remet, ou le jour de la remise en main propre contre signature. Exemple : lettre reçue le 10 novembre en zone tendue, fin du préavis le 10 décembre.' },
      { note: 'Dans Bailio, enregistrez le congé de votre locataire : la date de fin du préavis se calcule et le départ (état des lieux, dépôt de garantie) se prépare étape par étape. Vérifiez aussi la date avec notre simulateur gratuit.' },
    ],
    sources: [
      { label: 'Service-public.fr : préavis et formalités du congé donné par le locataire', url: 'https://www.service-public.fr/particuliers/vosdroits/F1168', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'sous-location-airbnb-locataire',
    title: 'Sous-location : votre locataire peut-il louer votre logement sur Airbnb ?',
    description: 'L’accord écrit obligatoire, le loyer maximum de la sous-location et ce que risque un locataire qui sous-loue sans autorisation.',
    date: '2026-11-08',
    blocks: [
      { p: 'Sous-louer, c’est louer à quelqu’un d’autre tout ou partie du logement dont on est soi-même locataire. Par exemple sur Airbnb pendant les vacances.' },
      { h: 'Votre accord écrit est obligatoire' },
      { p: 'En location vide comme en meublée, votre locataire doit d’abord obtenir votre autorisation écrite. Elle porte sur la sous-location et sur le montant du loyer demandé au sous-locataire.' },
      { h: 'Le loyer est plafonné' },
      { p: 'Le loyer au mètre carré demandé au sous-locataire ne peut pas dépasser celui que votre locataire vous paie. La sous-location ne dure pas plus longtemps que son bail, et votre locataire doit remettre au sous-locataire votre autorisation et une copie du bail.' },
      { h: 'Sans autorisation' },
      { p: 'Sous-louer sans votre accord peut entraîner la résiliation du bail, c’est-à-dire sa fin décidée par le juge. Votre locataire peut aussi être condamné à vous reverser les sous-loyers encaissés, voire des dommages et intérêts.' },
      { h: 'Une exception' },
      { p: 'Un locataire de 60 ans ou plus peut sous-louer une partie de son logement à un jeune de moins de 30 ans, dans le cadre d’un contrat de cohabitation intergénérationnelle solidaire. Il doit vous en informer, mais vous ne pouvez pas vous y opposer.' },
      { note: 'Une annonce de votre logement sur une plateforme de location courte ? Écrivez à votre locataire pour lui rappeler la règle, par lettre recommandée. Dans Bailio, vos courriers restent rangés avec le bail.' },
    ],
    sources: [
      { label: 'Service-public.fr : un locataire peut-il sous-louer son logement ?', url: 'https://www.service-public.fr/particuliers/vosdroits/F2449', checked: '8 novembre 2026' },
    ],
  },
  {
    slug: 'quittance-de-loyer',
    title: 'Quittance de loyer : comment la faire, gratuite et obligatoire sur demande',
    description: 'Comment faire une quittance de loyer, ce qu’elle doit contenir, quand vous devez la remettre, et pourquoi vous ne pouvez rien facturer.',
    date: '2026-11-03',
    blocks: [
      { p: 'La quittance de loyer est le reçu qui prouve que votre locataire a payé son loyer et ses charges pour une période. Il s’en sert souvent pour un dossier de location, une aide au logement ou une démarche administrative.' },
      { h: 'Quand devez-vous la remettre ?' },
      { p: 'Dès que votre locataire vous la demande, vous devez la lui transmettre. Vous ne pouvez pas refuser.' },
      { h: 'Que doit-elle indiquer ?' },
      { p: 'Le détail des sommes versées, en séparant le loyer et les charges.' },
      { h: 'Comment faire une quittance de loyer ?' },
      { p: 'La loi impose une seule règle de contenu : séparer le loyer et les charges. En pratique, pour qu’elle serve de preuve sans discussion, indiquez aussi :' },
      { list: ['vos nom et adresse, et ceux de votre locataire ;', 'l’adresse du logement loué ;', 'la période payée, par exemple « novembre 2026 » ;', 'le montant du loyer, puis celui des charges, puis le total ;', 'la date du paiement ;', 'la date de la quittance et votre signature.'] },
      { p: 'Si le loyer n’a été payé qu’en partie, ne faites pas de quittance pour le mois entier : remettez un reçu du montant versé.' },
      { h: 'Par email ou par courrier ?' },
      { p: 'La quittance peut partir par email si votre locataire est d’accord. Sinon, vous la lui remettez sur papier.' },
      { h: 'Combien pouvez-vous la facturer ?' },
      { p: 'Rien. La quittance est gratuite. Aucuns frais liés à l’avis d’échéance ou à la quittance ne peuvent être demandés au locataire : ni timbre, ni frais de gestion. Une clause du bail qui prévoit des frais d’envoi de quittance est interdite, donc sans effet.' },
      { note: 'Dans Bailio, la quittance part toute seule par email dès que vous enregistrez le loyer, si votre locataire a donné son accord pour la recevoir ainsi.' },
    ],
    sources: [
      { label: 'Notice d’information jointe au bail (arrêté du 29 mai 2015 modifié), paragraphes 1.1 et 1.3.4 ; loi n° 89-462 du 6 juillet 1989, articles 4 et 21', url: 'https://bailio.fr/api/notice-information.pdf', checked: '3 novembre 2026' },
    ],
  },
  {
    slug: 'dpe-location-interdite',
    title: 'DPE : les logements interdits à la location en 2025, 2028 et 2034',
    description: 'Le calendrier des logements G, F et E, ce qui se passe pour un bail qui se renouvelle et le gel du loyer en F et G.',
    date: '2026-11-03',
    blocks: [
      { p: 'Le DPE, ou diagnostic de performance énergétique, note votre logement de A (très économe) à G (très énergivore). Cette note décide maintenant si vous pouvez louer le logement.' },
      { h: 'Le calendrier' },
      { list: ['Depuis 2025 : seuls les logements classés A à F peuvent être loués. Un logement classé G ne peut plus l’être.', 'De 2028 à 2033 : seuls les logements classés A à E pourront être loués.', 'À partir de 2034 : seuls les logements classés A à D pourront être loués.'] },
      { h: 'Et le bail en cours ?' },
      { p: 'La règle vaut pour chaque bail signé, renouvelé ou reconduit tacitement, c’est-à-dire prolongé automatiquement à son échéance. Un bail en cours n’échappe donc pas à la règle : elle s’applique à sa prochaine échéance.' },
      { h: 'Le loyer gelé en F et en G' },
      { p: 'En métropole, pour un bail signé, renouvelé ou reconduit depuis le 24 août 2022, le loyer d’un logement classé F ou G ne peut plus être révisé chaque année.' },
      { h: 'Que faire maintenant ?' },
      { p: 'Vérifiez la date et la note de votre DPE. Un DPE ancien peut ne plus être valable. Si votre logement est classé E, F ou G, faites chiffrer les travaux de rénovation énergétique dès maintenant : les délais des artisans et des aides sont longs.' },
      { note: 'Dans Bailio, le tableau de bord de vos logements signale un DPE à refaire et une interdiction de louer qui arrive dans les 4 ans.' },
    ],
    sources: [
      { label: 'Service-public.fr : logement à louer décent', url: 'https://www.service-public.fr/particuliers/vosdroits/F2042', checked: '3 novembre 2026' },
      { label: 'Service-public.fr : augmentation et révision du loyer en cours de bail', url: 'https://www.service-public.fr/particuliers/vosdroits/F1311', checked: '3 novembre 2026' },
    ],
  },
  {
    slug: 'revision-du-loyer-irl',
    title: 'Réviser le loyer avec l’IRL : calcul, délai et interdictions',
    description: 'Quand vous pouvez augmenter le loyer en cours de bail, comment le calculer avec l’indice de référence des loyers, et ce que vous perdez en attendant.',
    date: '2026-11-03',
    blocks: [
      { p: 'La révision du loyer est l’augmentation que vous pouvez appliquer une fois par an pendant le bail. Elle n’est possible que si le bail contient une clause de révision. Sans cette clause, le loyer ne bouge pas.' },
      { h: 'Le plafond : l’IRL' },
      { p: 'L’IRL, ou indice de référence des loyers, est publié chaque trimestre par l’Insee. Votre hausse ne peut pas dépasser son évolution sur un an. Le dernier indice, celui du 3e trimestre 2026, vaut 148,06 : + 1,57 % sur un an (publié le 15 octobre 2026).' },
      { h: 'Le calcul' },
      { p: 'Nouveau loyer = loyer actuel × IRL du trimestre de référence de cette année ÷ IRL du même trimestre de l’année précédente. Le trimestre de référence est écrit dans le bail. Le résultat s’arrondit au centime.' },
      { p: 'Exemple : un loyer de 800 € avec le 3e trimestre comme référence : 800 × 148,06 ÷ 145,77 = 812,57 €, soit 12,57 € de plus par mois.' },
      { h: 'Interdite en F et en G' },
      { p: 'En métropole, pour un bail signé, renouvelé ou reconduit depuis le 24 août 2022, la révision est interdite si le logement est classé F ou G au DPE.' },
      { h: 'Ne tardez pas' },
      { p: 'La révision n’est pas automatique : vous l’annoncez à votre locataire par courrier, de préférence en recommandé avec accusé de réception. Elle ne s’applique pas en arrière : la hausse compte seulement à partir de votre demande. Et si vous attendez plus d’un an après la date de révision, elle est perdue.' },
      { note: 'Dans Bailio, la lettre de révision est prête à la date anniversaire, avec le bon indice et le calcul ; le nouveau loyer passe ensuite dans les quittances.' },
    ],
    sources: [
      { label: 'Service-public.fr : augmentation et révision du loyer en cours de bail', url: 'https://www.service-public.fr/particuliers/vosdroits/F1311', checked: '3 novembre 2026' },
    ],
  },
  {
    slug: 'treve-hivernale',
    title: 'Trêve hivernale 2026-2027 : ce qui change pour le propriétaire',
    description: 'Du 1er novembre 2026 au 31 mars 2027 : ce que la trêve interdit, ce qu’elle n’efface pas et les personnes qu’elle ne protège pas.',
    date: '2026-11-02',
    blocks: [
      { p: 'La trêve hivernale est la période pendant laquelle un locataire ne peut pas être expulsé de son logement. Elle revient chaque année, du 1er novembre au 31 mars. Cette année, elle court du 1er novembre 2026 au 31 mars 2027.' },
      { h: 'Ce que la trêve interdit' },
      { p: 'Pendant la trêve, vous ne pouvez pas faire expulser votre locataire, même si un juge a déjà décidé son expulsion. Cela vaut pour tous les motifs, loyers impayés compris.' },
      { p: 'Les coupures de gaz et d’électricité du logement sont, elles aussi, interdites pendant cette période.' },
      { h: 'Ce que la trêve n’efface pas' },
      { p: 'La trêve ne supprime pas les dettes de loyer. Le loyer reste dû chaque mois, et votre locataire doit continuer, ou commencer, à rembourser ce qu’il vous doit.' },
      { p: 'À la fin de la trêve, si un juge a déjà rendu une décision d’expulsion, elle peut être exécutée par un commissaire de justice (anciennement huissier), à partir du 1er avril 2027.' },
      { h: 'Les personnes que la trêve ne protège pas' },
      { list: [
        'Les personnes qui bénéficient d’un relogement adapté aux besoins de leur famille.',
        'Les occupants d’un immeuble visé par un arrêté de mise en sécurité, c’est-à-dire un bâtiment jugé dangereux par la mairie ou la préfecture.',
        'Les squatteurs qui occupent un domicile, résidence principale ou secondaire.',
        'Les squatteurs d’un garage ou d’un terrain : le juge qui ordonne l’expulsion peut supprimer ou réduire la trêve.',
      ] },
      { p: 'Dans certains cas de violences dans le couple ou sur un enfant, le juge aux affaires familiales peut aussi ordonner l’expulsion pendant la trêve.' },
      { h: 'Que faire si votre locataire ne paie plus ?' },
      { p: 'N’attendez pas le printemps. Parlez-en vite avec votre locataire : un retard d’un mois se règle plus facilement qu’une dette de six mois. Proposez-lui, si besoin, un échéancier, c’est-à-dire un remboursement en plusieurs fois, et gardez une trace écrite de chaque échange.' },
      { note: 'Dans Bailio, un loyer en retard apparaît dans « Aujourd’hui » et le parcours « Impayé » vous guide étape par étape : lettre de relance prête à envoyer, puis appel au garant s’il y en a un.' },
    ],
    sources: [
      { label: 'Service-public.fr : Trêve hivernale 2026-2027, ce que vous devez savoir (actualité du 2 octobre 2026)', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A14632', checked: '2 novembre 2026' },
    ],
  },
  {
    slug: 'conge-du-proprietaire',
    title: 'Donner congé à son locataire : délais et motifs',
    description: 'Quand et pourquoi un propriétaire peut mettre fin au bail, et comment envoyer la lettre pour qu’elle soit valable.',
    date: '2026-10-29',
    blocks: [
      { p: 'Le congé est la lettre par laquelle vous annoncez à votre locataire que vous ne renouvelez pas le bail. Il se prépare longtemps à l’avance : envoyé trop tard, il n’est pas valable et le bail continue.' },
      { h: 'À quelle date ?' },
      { p: 'Vous ne pouvez donner congé que pour la fin du bail, appelée l’échéance. Pour une location vide, la durée habituelle est de 3 ans ; pour une location meublée, d’un an.' },
      { list: ['Location vide : votre locataire doit recevoir la lettre au moins 6 mois avant l’échéance.', 'Location meublée : au moins 3 mois avant l’échéance.'] },
      { p: 'Le délai se compte à partir du jour où votre locataire reçoit la lettre, pas du jour où vous l’envoyez. Prévoyez donc une marge de quelques semaines.' },
      { h: 'Pour quel motif ?' },
      { p: 'Le congé doit toujours donner son motif. Il n’en existe que trois :' },
      { list: ['Vendre le logement libre. Pour une location vide, votre locataire peut alors l’acheter en priorité : c’est son droit de préemption.', 'Reprendre le logement pour y habiter, ou pour y loger un proche (conjoint, enfant, parent…).', 'Un motif légitime et sérieux, par exemple des loyers impayés à répétition ou des troubles graves.'] },
      { p: 'Si vous venez d’acheter un logement déjà loué, des règles particulières s’appliquent : selon la date d’achat, le congé ne peut parfois être donné que pour la fin du bail suivant.' },
      { h: 'Comment l’envoyer ?' },
      { p: 'Un simple email ne suffit pas, même si votre locataire répond qu’il a bien reçu. Trois moyens sont valables :' },
      { list: ['La lettre recommandée avec accusé de réception.', 'L’acte de commissaire de justice (anciennement huissier).', 'La remise en main propre, contre une signature de votre locataire.'] },
      { p: 'La lettre est adressée à chaque signataire du bail. Pour une vente ou une reprise d’un logement vide, la notice d’information officielle doit être jointe à la lettre.' },
      { note: 'Dans Bailio, le courrier de congé est prêt à envoyer : il reprend la date de fin du bail et le motif, et joint la notice officielle quand elle est obligatoire.' },
    ],
    sources: [
      { label: 'Service-public.fr : préavis et formalités du congé donné par le propriétaire', url: 'https://www.service-public.fr/particuliers/vosdroits/F929', checked: '29 octobre 2026' },
    ],
  },
  {
    slug: 'depot-de-garantie',
    title: 'Le dépôt de garantie : combien demander et quand le rendre',
    description: 'Le montant maximum en location vide et meublée, les retenues possibles et le délai pour le rendre au locataire.',
    date: '2026-10-29',
    blocks: [
      { p: 'Le dépôt de garantie est la somme que votre locataire vous verse à la signature du bail. Vous la gardez pendant toute la location, pour couvrir un éventuel loyer impayé ou des dégâts. On l’appelle souvent « caution », à tort : la caution est la personne qui se porte garante.' },
      { h: 'Combien demander ?' },
      { list: ['Location vide : 1 mois de loyer hors charges au plus.', 'Location meublée : 2 mois de loyer hors charges au plus.'] },
      { p: 'Le montant est écrit dans le bail. Il ne peut pas augmenter pendant la location, ni quand le bail est renouvelé. Si le loyer se paie par trimestre d’avance, aucun dépôt ne peut être demandé.' },
      { h: 'Quand le rendre ?' },
      { p: 'Le délai part du jour où votre locataire vous rend les clés. Il dépend de l’état des lieux de sortie, comparé à celui d’entrée :' },
      { list: ['État des lieux de sortie identique à l’entrée : 1 mois au plus.', 'Différences constatées : 2 mois au plus.'] },
      { p: 'En copropriété, vous pouvez garder jusqu’à 20 % du dépôt en attendant les comptes annuels de l’immeuble, puis rendre le solde dans le mois qui suit leur approbation.' },
      { h: 'Que pouvez-vous retenir ?' },
      { p: 'Seulement ce que votre locataire vous doit encore : un loyer ou des charges impayés, ou des réparations dues à un mauvais entretien. Chaque retenue se justifie, par exemple avec les états des lieux, des photos, un devis ou une facture. L’usure normale du logement, elle, ne se retient jamais.' },
      { h: 'Et en cas de retard ?' },
      { p: 'Rendu trop tard, le dépôt est augmenté de 10 % du loyer mensuel hors charges pour chaque mois de retard commencé. Exemple : pour un loyer de 700 € et 2 mois de retard, vous devez 140 € en plus. Cette pénalité ne s’applique pas si votre locataire ne vous a pas donné sa nouvelle adresse en rendant les clés.' },
      { note: 'Dans Bailio, l’état des lieux de sortie se compare seul à celui d’entrée, et le solde de tout compte calcule la date limite et les retenues justifiées.' },
    ],
    sources: [
      { label: 'Service-public.fr : dépôt de garantie dans un bail d’habitation', url: 'https://www.service-public.fr/particuliers/vosdroits/F31269', checked: '29 octobre 2026' },
    ],
  },
]

export const guidePath = (g: Pick<Guide, 'slug'>) => `/guides/${g.slug}`
