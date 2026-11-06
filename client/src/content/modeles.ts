/**
 * Modèles de lettres gratuits (pages publiques /modeles/:slug), tirés des courriers de Bailio (server/src/domain/letters.ts)
 * avec des [crochets] à remplacer. Règles vérifiées sur une source officielle citée, avec sa date de vérification ;
 * jamais une règle de mémoire. Le plus utile en tête. Nouveau modèle : il entre seul dans le plan du site, llms.txt,
 * la mesure d'audience (/modeles/…) et le contrôle d'accessibilité.
 */
export interface Modele {
  slug: string
  title: string
  description: string
  /** Une ligne sous le titre. */
  lead: string
  /** Ce qu'il faut savoir avant d'envoyer la lettre, une règle par ligne. */
  rules: string[]
  letter: { subject: string; paragraphs: string[]; annexes?: string[] }
  /** Comment l'envoyer. */
  send: string
  /** Ce que Bailio fait de plus. */
  bailio: string
  sources: Array<{ label: string; url: string; checked: string }>
}

/** Notice d'information du bail en vigueur : texte officiel, règles citées ligne par ligne. */
const NOTICE = { label: 'Notice d’information du bail (arrêté du 29 mai 2015 modifié par l’arrêté du 9 octobre 2026), Légifrance', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030649902', checked: '6 novembre 2026' }

export const MODELES: Modele[] = [
  {
    slug: 'mise-en-demeure-loyer-impaye',
    title: 'Mise en demeure de payer le loyer : modèle gratuit',
    description: 'Modèle de mise en demeure pour un loyer impayé, à copier et compléter, avec les étapes avant et après : relance, commandement de payer, garant.',
    lead: 'Après une relance restée sans réponse, la lettre qui fixe un dernier délai avant la procédure.',
    rules: [
      'D’abord une relance amiable, par simple courrier. Sans effet, la mise en demeure, en recommandé avec avis de réception.',
      'Ensuite, le commandement de payer, délivré par un commissaire de justice (anciennement huissier) : le locataire a alors 6 semaines pour payer.',
      'Avec une caution solidaire, vous pouvez vous adresser au garant dès le premier impayé.',
      'Dette de 5 000 € ou moins : une tentative de conciliation, gratuite, est obligatoire avant de saisir le juge.',
    ],
    letter: {
      subject: 'Mise en demeure de payer',
      paragraphs: [
        'Malgré ma précédente relance, les sommes suivantes restent impayées : loyer et charges de [mois impayés], soit un total de [montant] € ([montant en lettres]).',
        'Je vous mets en demeure de régler cette somme dans un délai de [8] jours à compter de la réception de ce courrier.',
        'À défaut, je serai contraint de faire délivrer un commandement de payer par un commissaire de justice, en application de la clause résolutoire du bail, puis de saisir le juge.',
        '[Si vous avez un garant :] Votre garant, [nom du garant], est informé de cette situation.',
        'Si vous rencontrez des difficultés, vous pouvez contacter l’ADIL de votre département ou le fonds de solidarité pour le logement (FSL).',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception, à chaque locataire signataire du bail. Gardez une copie et l’avis de réception.',
    bailio: 'Dans Bailio, la relance et la mise en demeure se remplissent seules avec les mois impayés et le montant, et peuvent partir automatiquement à vos dates (par exemple 3, 8 et 15 jours après l’échéance).',
    sources: [{ label: 'Service-public.fr : loyer impayé et expulsion du locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31272', checked: '6 novembre 2026' }],
  },
  {
    slug: 'relance-loyer-impaye',
    title: 'Relance amiable de loyer impayé : modèle gratuit',
    description: 'Modèle de lettre de relance amiable pour un loyer en retard, à copier et compléter, avant la mise en demeure.',
    lead: 'La première lettre quand le loyer n’est pas arrivé : courte, polie, sans menace.',
    rules: [
      'Le loyer et les charges se paient à la date prévue au bail. Le locataire ne peut pas arrêter de payer de lui-même, même s’il reproche quelque chose au bailleur.',
      'Commencez par une relance amiable, par simple courrier ou email. Sans effet, la mise en demeure, en recommandé avec avis de réception.',
      'Aucune pénalité de retard ne peut être réclamée : une clause qui en prévoit est interdite.',
      'Le bailleur peut réclamer les loyers impayés pendant trois ans.',
    ],
    letter: {
      subject: 'Loyer de [mois]',
      paragraphs: [
        'Sauf erreur de ma part, je n’ai pas encore reçu le paiement du loyer et des charges de [mois], soit [montant] €, attendu le [date d’échéance].',
        'Il s’agit peut-être d’un simple oubli. Pouvez-vous procéder au règlement dans les meilleurs délais ? Si vous rencontrez une difficulté, n’hésitez pas à m’en parler : nous trouverons une solution ensemble.',
        'Si votre paiement a été fait entre-temps, merci de ne pas tenir compte de ce message.',
      ],
    },
    send: 'Par email ou simple courrier. Gardez une copie : elle servira si vous devez aller plus loin.',
    bailio: 'Dans Bailio, la relance se remplit seule avec le mois et le montant, et peut partir automatiquement quelques jours après l’échéance, puis un second rappel et la mise en demeure à vos dates.',
    sources: [{ label: 'Service-public.fr : loyer impayé et expulsion du locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31272', checked: '6 novembre 2026' }, NOTICE],
  },
  {
    slug: 'restitution-depot-de-garantie',
    title: 'Restitution du dépôt de garantie : modèle de lettre gratuit',
    description: 'Modèle de lettre de restitution du dépôt de garantie et de solde de tout compte, avec les délais (un ou deux mois) et la pénalité de retard.',
    lead: 'Le solde de tout compte, à envoyer après la remise des clés.',
    rules: [
      'Un mois après la remise des clés si l’état des lieux de sortie est conforme à celui d’entrée, deux mois sinon.',
      'Chaque retenue se justifie : états des lieux d’entrée et de sortie, factures, devis, lettres de réclamation des loyers impayés.',
      'En immeuble collectif, une provision de 20 % au plus peut être gardée jusqu’au mois qui suit l’approbation des comptes de l’immeuble.',
      'En retard, la somme due est majorée de 10 % du loyer mensuel par mois de retard commencé, sauf si le locataire n’a pas donné sa nouvelle adresse.',
    ],
    letter: {
      subject: 'Restitution du dépôt de garantie et solde de tout compte',
      paragraphs: [
        'Suite à la remise des clés le [date], voici le solde de tout compte de la location du logement situé [adresse du logement], à partir de votre dépôt de garantie de [montant] €.',
        '[Sans retenue :] Aucune retenue n’est appliquée. [Avec retenues :] Les retenues ci-dessous correspondent aux dégradations constatées, hors usure normale ; chacune est justifiée par la pièce jointe indiquée : [retenue, justificatif, montant].',
        'La somme de [montant à restituer] € vous sera versée au plus tard le [date limite], sur le compte que vous m’avez indiqué.',
      ],
    },
    send: 'Par email ou courrier, à la nouvelle adresse que le locataire vous a donnée, avec les justificatifs des retenues.',
    bailio: 'Dans Bailio, le solde se calcule seul : retenues reprises de l’état des lieux de sortie comparé à l’entrée, loyers dus, régularisation des charges, date limite et pénalité de retard.',
    sources: [{ label: 'Service-public.fr : dépôt de garantie dans un bail d’habitation', url: 'https://www.service-public.fr/particuliers/vosdroits/F31269', checked: '29 octobre 2026' }, NOTICE],
  },
  {
    slug: 'accuse-reception-conge-locataire',
    title: 'Réponse au congé du locataire : modèle gratuit',
    description: 'Modèle de lettre pour accuser réception du congé de votre locataire, avec la fin du préavis (trois mois ou un mois) et la suite : état des lieux, dépôt de garantie.',
    lead: 'Votre locataire part : confirmez la date de fin et préparez la sortie.',
    rules: [
      'Location vide : trois mois de préavis, un mois en zone tendue ou si le locataire justifie d’un motif prévu par la loi (premier emploi, mutation, perte d’emploi, santé, RSA, AAH, logement social, violences familiales).',
      'Location meublée : un mois.',
      'Le préavis court à partir de la réception de la lettre du locataire. Il paie le loyer jusqu’à la fin, sauf si un nouveau locataire entre plus tôt avec votre accord.',
      'Sans motif précisé et justifié dans sa lettre, le préavis de trois mois s’applique.',
    ],
    letter: {
      subject: 'Votre congé : accusé de réception et fin du préavis',
      paragraphs: [
        'J’accuse réception de votre lettre de congé concernant le logement situé [adresse du logement], reçue le [date de réception].',
        'Votre préavis est de [trois mois / un mois] : il prend fin le [date de fin].',
        'Vous restez redevable du loyer et des charges jusqu’à cette date, sauf si le logement est occupé avant la fin du préavis par un autre locataire, en accord avec moi. Si vous partez plus tôt, prévenez-moi : nous fixerons ensemble la date de l’état des lieux de sortie et de la remise des clés.',
        'Le dépôt de garantie vous sera restitué dans un délai d’un mois après la remise des clés si l’état des lieux de sortie est conforme à celui d’entrée, et de deux mois dans le cas contraire, déduction faite des sommes dues et justifiées. Merci de m’indiquer votre nouvelle adresse.',
      ],
    },
    send: 'Par email ou courrier. Gardez la lettre du locataire et son enveloppe : la date de réception compte.',
    bailio: 'Dans Bailio, la fin du préavis se calcule seule (zone tendue comprise), puis l’état des lieux de sortie et le solde de tout compte reprennent la date.',
    sources: [NOTICE],
  },
  {
    slug: 'demande-attestation-assurance',
    title: 'Demande d’attestation d’assurance habitation : modèle gratuit',
    description: 'Modèle de lettre pour demander chaque année son attestation d’assurance habitation au locataire, et ce que vous pouvez faire s’il ne répond pas.',
    lead: 'Une fois par an, l’attestation d’assurance de votre locataire.',
    rules: [
      'Le locataire doit s’assurer contre les risques locatifs (dégâts des eaux, incendie, explosion) et le justifier à la remise des clés puis chaque année, à votre demande.',
      'S’il ne le fait pas, vous pouvez demander la résiliation du bail ou souscrire une assurance à sa place et lui en refacturer le prix.',
      'Une clause résolutoire pour défaut d’assurance ne joue qu’un mois après un commandement resté sans effet.',
      'En colocation, le bail peut prévoir que le bailleur assure le logement pour le compte des colocataires.',
    ],
    letter: {
      subject: 'Attestation d’assurance habitation',
      paragraphs: [
        'Votre bail vous oblige à assurer le logement contre les risques locatifs et à m’en justifier chaque année (article 7 de la loi du 6 juillet 1989).',
        '[L’attestation que je possède arrive à échéance le [date]. / Je ne dispose pas encore de votre attestation pour cette année.]',
        'Pouvez-vous me transmettre votre nouvelle attestation d’assurance, par email ou par courrier ? Je vous remercie par avance.',
      ],
    },
    send: 'Par email ou courrier, un mois avant l’échéance de l’attestation que vous avez.',
    bailio: 'Dans Bailio, le rappel arrive avant l’échéance et le locataire dépose son attestation depuis un lien, sans compte : elle se range seule avec le bail.',
    sources: [NOTICE],
  },
  {
    slug: 'regularisation-des-charges',
    title: 'Régularisation des charges locatives : modèle gratuit',
    description: 'Modèle de lettre de régularisation annuelle des charges : décompte par nature de charges, comparaison avec les provisions, pièces justificatives.',
    lead: 'Chaque année, comparez les provisions versées aux dépenses réelles.',
    rules: [
      'Seules les charges de la liste officielle (décret n° 87-713) se récupèrent.',
      'Payées par provisions, elles se régularisent chaque année : trop-perçu à rendre, complément à demander.',
      'Joignez le décompte par nature de charges et, en immeuble collectif, le mode de répartition. Les justificatifs restent à la disposition du locataire pendant six mois.',
      'Régularisation faite plus d’un an après : le locataire peut payer le complément en douze mois. Charges au forfait (meublé, colocation) : pas de régularisation.',
    ],
    letter: {
      subject: 'Régularisation des charges [année]',
      paragraphs: [
        'Voici le décompte des charges récupérables de l’année [année], par nature de charges, comparé aux provisions que vous avez versées : [nature de charge, montant réel].',
        'Total des charges réelles : [montant] €. Provisions versées : [montant] €.',
        '[Les charges réelles dépassent vos provisions de [montant] €. Ce complément est à régler avec votre prochain loyer. / Vos provisions dépassent les charges réelles de [montant] €. Cette somme vous sera remboursée ou déduite de votre prochain loyer.]',
        'Les pièces justificatives sont à votre disposition pendant six mois à compter de l’envoi de ce décompte (article 23 de la loi du 6 juillet 1989).',
      ],
    },
    send: 'Par email ou courrier, avec le décompte. Le locataire peut demander le récapitulatif par voie électronique ou postale.',
    bailio: 'Dans Bailio, le décompte reprend les dépenses récupérables de l’année, les provisions encaissées et le prorata si le locataire est arrivé ou parti en cours d’année.',
    sources: [{ label: 'Liste des charges récupérables (décret n° 87-713), sur Bailio', url: 'https://bailio.fr/api/charges-recuperables.pdf', checked: '6 novembre 2026' }, NOTICE],
  },
  {
    slug: 'lettre-revision-loyer',
    title: 'Lettre de révision du loyer (IRL) : modèle gratuit',
    description: 'Modèle de lettre pour réviser le loyer chaque année avec l’indice de référence des loyers, avec le calcul et les délais à respecter.',
    lead: 'Une fois par an, si le bail le prévoit : le loyer suit l’indice de référence des loyers (IRL).',
    rules: [
      'Seulement si le bail contient une clause de révision.',
      'Nouveau loyer = loyer actuel × IRL de cette année ÷ IRL du même trimestre un an plus tôt. Le trimestre de référence est écrit dans le bail.',
      'Pas d’effet en arrière : la hausse compte à partir de votre demande. Après un an de retard, elle est perdue.',
      'Interdite pour un logement classé F ou G au DPE (bail signé, renouvelé ou reconduit depuis le 24 août 2022, en métropole).',
    ],
    letter: {
      subject: 'Révision annuelle du loyer, [adresse du logement]',
      paragraphs: [
        'Conformément à la clause de révision de votre bail, le loyer est révisé chaque année selon la variation de l’indice de référence des loyers (IRL) publié par l’INSEE.',
        'L’indice de référence de votre bail est celui du [trimestre et année] ([valeur]). L’indice du même trimestre publié cette année est de [nouvelle valeur] ([trimestre et année]).',
        'Votre loyer hors charges passe donc de [loyer actuel] € à [nouveau loyer] € ([loyer actuel] × [nouvelle valeur] ÷ [valeur]), à compter du [date]. Le montant des charges est inchangé.',
      ],
    },
    send: 'De préférence en recommandé avec avis de réception : la date de réception fixe le point de départ de la hausse.',
    bailio: 'Dans Bailio, la lettre est prête à la date anniversaire, avec le bon indice et le calcul, et le nouveau loyer passe ensuite dans les quittances.',
    sources: [{ label: 'Service-public.fr : augmentation et révision du loyer en cours de bail', url: 'https://www.service-public.fr/particuliers/vosdroits/F1311', checked: '3 novembre 2026' }],
  },
  {
    slug: 'conge-proprietaire-vente',
    title: 'Congé du propriétaire pour vendre : modèle gratuit',
    description: 'Modèle de lettre de congé pour vendre le logement loué, avec les délais (6 mois en vide, 3 mois en meublé), les mentions et les pièces à joindre.',
    lead: 'Pour vendre le logement libre à la fin du bail. Le congé pour reprendre ou pour un motif légitime suit les mêmes délais.',
    rules: [
      'Seulement pour la fin du bail : 3 ans en général pour une location vide, 1 an en meublé.',
      'Votre locataire doit recevoir la lettre au moins 6 mois avant la fin en vide, 3 mois en meublé. Le délai compte à la réception : prévoyez une marge.',
      'En vide, le congé pour vendre vaut offre de vente : votre locataire peut acheter en priorité, au prix indiqué.',
      'Un email ne suffit pas, même si le locataire répond.',
    ],
    letter: {
      subject: 'Congé pour la fin du bail',
      paragraphs: [
        'Je vous donne congé pour la fin de votre bail, soit le [date de fin du bail], date à laquelle vous devrez avoir libéré le logement situé [adresse du logement].',
        'Ce congé est motivé par ma décision de vendre le logement. Il vaut offre de vente à votre profit, au prix de [prix] € ([prix en lettres]), payable comptant le jour de la signature de l’acte authentique de vente.',
        'Désignation des locaux loués et de leurs dépendances, telle qu’elle figure au bail : [désignation du logement].',
        'Cette offre est valable pendant les deux premiers mois du délai de préavis. Conformément à l’article 15, II, de la loi n° 89-462 du 6 juillet 1989, dont les cinq premiers alinéas sont reproduits ci-dessous, vous pouvez l’accepter par écrit pendant ce délai.',
        '[Location vide : recopier ici, mot pour mot, les cinq premiers alinéas de l’article 15, II, de la loi n° 89-462 du 6 juillet 1989, sur legifrance.gouv.fr.]',
        'Vous pouvez quitter le logement avant cette date : vous ne devrez alors le loyer et les charges que jusqu’à la remise des clés. Nous conviendrons ensemble de la date de l’état des lieux de sortie.',
      ],
      annexes: [
        'Location vide : les cinq premiers alinéas de l’article 15, II, de la loi du 6 juillet 1989, reproduits dans la lettre.',
        'Location vide : la notice d’information de l’arrêté du 13 décembre 2017.',
        'Location meublée : rien à joindre, et pas de droit de priorité pour acheter.',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception, par acte de commissaire de justice ou remise en main propre contre signature, à chaque signataire du bail.',
    bailio: 'Dans Bailio, le congé reprend la date de fin du bail et le motif, vérifie le délai et joint la notice officielle quand elle est obligatoire.',
    sources: [{ label: 'Service-public.fr : préavis et formalités du congé donné par le propriétaire', url: 'https://www.service-public.fr/particuliers/vosdroits/F929', checked: '29 octobre 2026' }],
  },
]

export const modelePath = (m: Pick<Modele, 'slug'>) => `/modeles/${m.slug}`
export const SIMULATEUR_REVISION = '/simulateurs/revision-loyer'

/** Outils gratuits (une question par écran) : plan du site, llms.txt, page HTML propre et liste des modèles les reprennent seuls. */
export const SIMULATEURS = [
  { path: SIMULATEUR_REVISION, title: 'Simulateur de révision du loyer (IRL)', name: 'Simulateur de révision du loyer', lead: 'Votre nouveau loyer avec le dernier indice publié, en trois questions.', description: 'Simulateur gratuit de révision du loyer : votre nouveau loyer avec le dernier indice de référence des loyers (IRL) publié par l’Insee, et la lettre à envoyer.' },
  { path: '/simulateurs/date-conge-bailleur', title: 'Date limite du congé du propriétaire', name: 'Date limite pour donner congé', lead: 'Jusqu’à quand envoyer le congé à votre locataire, en deux questions.', description: 'Calculez gratuitement la date limite pour donner congé à votre locataire : 6 mois avant la fin du bail en location vide, 3 mois en meublé, avec la marge d’envoi conseillée.' },
  { path: '/simulateurs/preavis-locataire', title: 'Préavis du locataire : date de fin', name: 'Fin du préavis du locataire', lead: 'Trois mois ou un mois : la date exacte de fin, en trois questions.', description: 'Calculez gratuitement la fin du préavis de votre locataire : trois mois en location vide, un mois en zone tendue, pour un motif prévu par la loi ou en meublé.' },
  { path: '/simulateurs/depot-de-garantie', title: 'Dépôt de garantie : date limite de restitution', name: 'Restitution du dépôt de garantie', lead: 'Jusqu’à quand rendre le dépôt, et la pénalité en cas de retard.', description: 'Calculez gratuitement la date limite de restitution du dépôt de garantie (un ou deux mois après la remise des clés) et la majoration de 10 % du loyer par mois de retard.' },
  { path: '/simulateurs/micro-foncier-ou-reel', title: 'Micro-foncier ou régime réel : le comparatif', name: 'Micro-foncier ou réel', lead: 'Le régime le plus avantageux pour vos loyers d’une location vide.', description: 'Comparez gratuitement le micro-foncier (abattement de 30 %, jusqu’à 15 000 € de loyers) et le régime réel (charges réelles déduites) pour votre location vide.' },
  { path: '/simulateurs/dpe-location', title: 'DPE : mon logement peut-il être loué ?', name: 'DPE et interdiction de louer', lead: 'Les dates d’interdiction de location selon la classe énergie de votre logement.', description: 'Logement classé G, F ou E au DPE : à partir de quand il ne peut plus être loué, et ce qui est déjà interdit (hausse et révision du loyer). Calendrier officiel, métropole et outre-mer.' },
] as const

/** Texte brut de la lettre, prêt à copier. */
export const letterText = (m: Modele) =>
  [`Objet : ${m.letter.subject}`, '', '[Votre nom et adresse]', '[Nom et adresse du locataire]', '[Lieu], le [date]', '', 'Madame, Monsieur,', '', ...m.letter.paragraphs.flatMap((p) => [p, '']), 'Je vous prie d’agréer, Madame, Monsieur, mes salutations distinguées.', '', '[Signature]'].join('\n')
