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
  {
    slug: 'quittance-de-loyer',
    title: 'Quittance de loyer : modèle gratuit à copier',
    description: 'Modèle de quittance de loyer gratuit à compléter : loyer et charges détaillés, paiement partiel, envoi par email avec l’accord du locataire. Ce que dit la loi.',
    lead: 'Le reçu qui prouve que le loyer et les charges d’un mois sont payés.',
    rules: [
      'Vous devez remettre gratuitement une quittance au locataire qui vous la demande (article 21 de la loi du 6 juillet 1989).',
      'Elle porte le détail des sommes versées, en distinguant le loyer et les charges.',
      'Aucuns frais liés à la gestion de l’avis d’échéance ou de la quittance ne peuvent être facturés au locataire.',
      'L’envoi par voie dématérialisée (email) demande l’accord exprès du locataire.',
      'Si le locataire ne paie qu’une partie de la somme due, vous devez lui délivrer un reçu.',
    ],
    letter: {
      subject: 'Quittance de loyer de [mois et année]',
      paragraphs: [
        'Je soussigné(e) [votre nom], propriétaire du logement situé [adresse du logement], déclare avoir reçu de [nom du locataire], le [date du paiement], la somme de [total] € ([total en lettres]) au titre du loyer et des charges de la période du [début de période] au [fin de période], et lui en donne quittance.',
        'Détail du règlement : loyer hors charges : [montant du loyer] € ; charges : [montant des charges] € ; total : [total] €.',
        '[Si le paiement est partiel, remplacer le paragraphe précédent par :] J’ai reçu de [nom du locataire], le [date du paiement], la somme de [montant reçu] € à valoir sur le loyer et les charges de [mois et année], soit [total dû] € au total. Il reste dû [reste à payer] €. Ce document est un reçu de paiement partiel.',
      ],
    },
    send: 'Par email si le locataire a donné son accord exprès, sinon par courrier ou en main propre. Gardez un double de chaque quittance.',
    bailio: 'Dans Bailio, la quittance se fait et part toute seule par email dès que vous enregistrez le loyer reçu, avec le loyer et les charges séparés, si votre locataire a donné son accord.',
    sources: [{ label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 21', url: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028806698', checked: '9 novembre 2026' }],
  },
  {
    slug: 'avis-echeance-loyer',
    title: 'Avis d’échéance de loyer : modèle gratuit',
    description: 'Modèle d’avis d’échéance de loyer à compléter : somme à payer, date limite, loyer et charges séparés. Ce qui est facultatif et ce qui ne se facture pas.',
    lead: 'Le rappel envoyé avant la date de paiement : ce qu’il faut régler, et quand.',
    rules: [
      'La loi de 1989 ne l’impose pas : son article 21 se borne à interdire de facturer au locataire la gestion de l’avis d’échéance.',
      'Un avis d’échéance annonce une somme à payer. Il ne prouve pas le paiement : la preuve, c’est la quittance, remise une fois le loyer reçu.',
      'Indiquez le loyer et les charges séparément, comme sur la quittance.',
      'Le montant reprend celui du bail, ou le dernier loyer révisé s’il y a eu une révision.',
    ],
    letter: {
      subject: 'Avis d’échéance du loyer de [mois et année]',
      paragraphs: [
        'Voici l’avis d’échéance du loyer du logement situé [adresse du logement], pour la période du [début de période] au [fin de période].',
        'Loyer hors charges : [montant du loyer] €. Charges : [montant des charges] €. Total à payer : [total] €.',
        'Ce montant est à régler au plus tard le [date d’échéance], par [mode de paiement] sur le compte [IBAN].',
        'Une quittance vous sera remise une fois le paiement reçu.',
      ],
    },
    send: 'Par email ou courrier, quelques jours avant l’échéance. Aucun frais d’envoi ne peut être demandé au locataire.',
    bailio: 'Dans Bailio, les loyers attendus de chaque mois sont suivis pour vous, et la quittance part dès que vous enregistrez le paiement.',
    sources: [{ label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 21', url: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028806698', checked: '9 novembre 2026' }],
  },
  {
    slug: 'attestation-paiement-loyers',
    title: 'Attestation de paiement des loyers : modèle gratuit',
    description: 'Modèle d’attestation de paiement des loyers (attestation de loyer à jour) pour le dossier de location de votre locataire, à copier et compléter.',
    lead: 'Votre locataire déménage : la lettre qui dit qu’il est à jour de ses loyers et charges.',
    rules: [
      'Un futur propriétaire peut demander, comme justificatif de domicile, les 3 dernières quittances de loyer ou, si nécessaire, une attestation du précédent propriétaire (ou de son mandataire) indiquant que le locataire est à jour de ses loyers et charges.',
      'Cette attestation tient donc lieu des quittances quand elles manquent. Un justificatif de domicile suffit : le futur propriétaire n’a pas le droit d’en exiger d’autres.',
      'N’attestez que ce qui est exact : si un loyer est en retard, ne le déclarez pas à jour.',
    ],
    letter: {
      subject: 'Attestation de paiement des loyers',
      paragraphs: [
        'Je soussigné(e) [votre nom], propriétaire (ou mandataire du propriétaire) du logement situé [adresse du logement], atteste que [nom du locataire] occupe ce logement depuis le [date d’entrée] en qualité de locataire.',
        'Le loyer mensuel actuel est de [montant du loyer] € hors charges, plus [montant des charges] € de charges.',
        'À la date de cette attestation, le [date], [nom du locataire] est à jour du paiement de ses loyers et de ses charges.',
        'Cette attestation est établie pour servir et valoir ce que de droit, notamment à l’appui d’un dossier de location.',
      ],
    },
    send: 'Par email ou courrier, à la demande du locataire, qui la remet à son futur propriétaire.',
    bailio: 'Dans Bailio, l’attestation de loyer se remplit seule avec le loyer, les charges et la date d’entrée du bail, et part au locataire.',
    sources: [{ label: 'Service-public.fr : justificatifs à donner au propriétaire par le futur locataire (décret n° 2015-1437 du 5 novembre 2015)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1169', checked: '9 novembre 2026' }],
  },
  {
    slug: 'conge-proprietaire-reprise',
    title: 'Congé pour reprise du logement : modèle gratuit',
    description: 'Modèle de lettre de congé pour reprendre votre logement vide et l’habiter ou y loger un proche : délai de 6 mois, bénéficiaire, lien de parenté, motif réel et sérieux.',
    lead: 'Vous ou un proche voulez habiter le logement à la fin du bail : la lettre, avec les mentions que la loi exige.',
    rules: [
      'Votre locataire doit recevoir la lettre au moins 6 mois avant la fin du bail. Reçue en retard, elle n’est pas valable.',
      'Vous pouvez reprendre pour vous, votre époux, votre concubin (depuis au moins 1 an), votre partenaire de Pacs, vos ascendants ou vos descendants, ou ceux de votre époux, concubin ou partenaire.',
      'La lettre indique le motif (reprendre le logement pour l’habiter ou pour y loger un proche), le nom et l’adresse du bénéficiaire, son lien avec vous et une indication justifiant le caractère réel et sérieux de la reprise.',
      'Elle est accompagnée de la notice d’information sur les obligations du bailleur et les voies de recours du locataire.',
      'Certains locataires sont protégés (âge, faibles ressources) : le bail est alors renouvelé. Une reprise frauduleuse expose à une amende pénale pouvant aller jusqu’à 6 000 €.',
    ],
    letter: {
      subject: 'Congé pour reprise du logement',
      paragraphs: [
        'Je vous donne congé pour la fin de votre bail, soit le [date de fin du bail], date à laquelle vous devrez avoir libéré le logement situé [adresse du logement].',
        'Ce congé est motivé par ma décision de reprendre le logement pour [l’habiter moi-même / y loger [nom du bénéficiaire]], demeurant [adresse du bénéficiaire], qui est [mon conjoint, concubin, partenaire de Pacs, ascendant, descendant, … : lien avec le propriétaire].',
        'Le caractère réel et sérieux de cette reprise s’explique ainsi : [raison : par exemple, rapprochement du lieu de travail, besoin de logement du bénéficiaire].',
        'Vous trouverez ci-joint la notice d’information relative aux obligations du bailleur et aux voies de recours et d’indemnisation du locataire.',
        'Vous pouvez quitter le logement avant cette date : vous ne devrez alors le loyer et les charges que jusqu’à la remise des clés. Nous conviendrons ensemble de la date de l’état des lieux de sortie.',
      ],
      annexes: ['La notice d’information de l’arrêté du 13 décembre 2017 (obligatoire).'],
    },
    send: 'Par lettre recommandée avec avis de réception, par acte de commissaire de justice ou remise en main propre contre signature, à chaque signataire du bail. Un simple email ne suffit pas.',
    bailio: 'Dans Bailio, le congé reprend la date de fin du bail, vérifie le délai de six mois et joint la notice officielle.',
    sources: [
      { label: 'Service-public.fr : préavis et formalités du congé donné par le propriétaire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F929', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 15', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'conge-motif-legitime-serieux',
    title: 'Congé pour motif légitime et sérieux : modèle gratuit',
    description: 'Modèle de lettre de congé du propriétaire pour motif légitime et sérieux (impayés, nuisances, défaut d’assurance, travaux) : délai de 6 mois, preuve du motif.',
    lead: 'Mettre fin au bail à son échéance parce que le locataire n’a pas respecté ses obligations, ou pour un motif lié à vous.',
    rules: [
      'Comme pour tout congé du propriétaire, votre locataire doit recevoir la lettre au moins 6 mois avant la fin du bail, en location vide.',
      'La loi ne définit pas le motif légitime et sérieux. Il peut tenir au locataire (nuisances, loyers impayés, absence d’assurance habitation) ou à vous (gros travaux).',
      'En cas de contestation, c’est à vous de prouver le bien-fondé du congé : gardez les lettres de relance, mises en demeure et constats.',
      'Un locataire protégé (âge, faibles ressources) garde son bail. Un email ne suffit pas pour envoyer le congé.',
    ],
    letter: {
      subject: 'Congé pour motif légitime et sérieux',
      paragraphs: [
        'Je vous donne congé pour la fin de votre bail, soit le [date de fin du bail], date à laquelle vous devrez avoir libéré le logement situé [adresse du logement].',
        'Ce congé est fondé sur un motif légitime et sérieux : [motif précis, par exemple : loyers impayés depuis [mois], malgré mes lettres du [dates] / troubles de voisinage constatés les [dates] / absence d’attestation d’assurance malgré ma mise en demeure du [date]].',
        '[Pièces à l’appui : [liste des lettres, constats, témoignages].]',
        'Vous pouvez quitter le logement avant cette date : vous ne devrez alors le loyer et les charges que jusqu’à la remise des clés. Nous conviendrons ensemble de la date de l’état des lieux de sortie.',
      ],
      annexes: ['Les pièces qui prouvent le motif, en copie.'],
    },
    send: 'Par lettre recommandée avec avis de réception, par acte de commissaire de justice ou remise en main propre contre signature, à chaque signataire du bail.',
    bailio: 'Dans Bailio, les courriers de relance et de mise en demeure sont rangés avec le bail : vous retrouvez d’un clic les preuves du motif.',
    sources: [
      { label: 'Service-public.fr : préavis et formalités du congé donné par le propriétaire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F929', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 15', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'demande-entretien-chaudiere',
    title: 'Demande d’attestation d’entretien de la chaudière : modèle gratuit',
    description: 'Modèle de lettre pour demander à votre locataire l’attestation d’entretien annuel de la chaudière : qui doit l’entretenir, délai de l’attestation, retenue possible.',
    lead: 'Une fois par an, la preuve que la chaudière a été entretenue.',
    rules: [
      'En général, le locataire fait entretenir la chaudière chaque année civile par un chauffagiste qualifié de son choix. Le bail peut prévoir que c’est le bailleur ; pour une chaudière collective, c’est le propriétaire ou le syndicat.',
      'Le professionnel remet une attestation d’entretien dans les 15 jours suivant sa visite, qui peut être envoyée par voie électronique. Elle se conserve au moins 2 ans.',
      'Aucune sanction n’est prévue en l’absence d’entretien. Sans attestation, vous pouvez cependant retenir le coût de l’entretien sur le dépôt de garantie, et l’assureur peut refuser d’indemniser un accident.',
    ],
    letter: {
      subject: 'Attestation d’entretien annuel de la chaudière',
      paragraphs: [
        'La chaudière du logement situé [adresse du logement] doit être entretenue chaque année civile par un professionnel qualifié.',
        '[Le dernier entretien dont j’ai connaissance date du [date]. / Je n’ai pas encore reçu d’attestation d’entretien pour [année].]',
        'Pouvez-vous me transmettre l’attestation remise par le professionnel lors de sa dernière visite, par email ou par courrier ? Si l’entretien n’a pas encore eu lieu cette année, merci de le programmer et de m’en informer.',
        'Je vous remercie par avance.',
      ],
    },
    send: 'Par email ou courrier simple, de préférence au début de l’automne, avant la saison de chauffe.',
    bailio: 'Dans Bailio, le locataire dépose l’attestation depuis son lien, sans compte : elle se range avec le bail et la fiche du logement, et la date du prochain entretien se rappelle seule.',
    sources: [{ label: 'Service-public.fr : entretien annuel de la chaudière, les règles pour le locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F20760', checked: '9 novembre 2026' }],
  },
  {
    slug: 'lettre-bienvenue-locataire',
    title: 'Lettre de bienvenue au nouveau locataire : modèle gratuit',
    description: 'Modèle de lettre de bienvenue pour un nouveau locataire : informations pratiques, documents remis, contacts, sans règle compliquée.',
    lead: 'Un mot chaleureux à l’entrée dans les lieux, avec ce qu’il faut savoir au quotidien.',
    rules: [
      'Cette lettre n’est pas obligatoire : elle ne remplace ni le bail ni l’état des lieux d’entrée.',
      'Le bail est accompagné de documents que le locataire doit recevoir : dossier de diagnostics, notice d’information, état des lieux d’entrée et, selon le cas, acte de cautionnement, grille de vétusté ou extrait du règlement de copropriété.',
      'Le locataire remet à la remise des clés son attestation d’assurance habitation, puis chaque année à votre demande.',
      'Ne mettez dans la lettre que ce qui est exact : le bail et la loi s’appliquent, pas un résumé.',
    ],
    letter: {
      subject: 'Bienvenue dans votre nouveau logement',
      paragraphs: [
        'Je suis heureux de vous accueillir dans le logement situé [adresse du logement], et je vous souhaite une très bonne installation.',
        'Quelques informations pratiques : [emplacement du compteur d’eau, d’électricité ou de gaz et du tableau électrique / jours de ramassage des poubelles et tri / accès à la cave, au local vélos, au parking / fonctionnement du chauffage ou de la chaudière].',
        'Vous trouverez avec le bail les documents remis à l’entrée : [dossier de diagnostics, notice d’information, état des lieux d’entrée, … : liste des documents].',
        'Pour toute question ou si un problème survient dans le logement, vous pouvez me joindre au [téléphone] ou à [email]. [Syndic ou gardien : nom et téléphone.]',
        'Merci de me transmettre votre attestation d’assurance habitation si vous ne l’avez pas déjà fait.',
      ],
    },
    send: 'En main propre à la remise des clés, ou par email le jour de l’entrée.',
    bailio: 'Dans Bailio, le lien du locataire lui donne accès à l’envoi de son attestation d’assurance et au signalement d’un problème dans le logement, sans compte.',
    sources: [
      { label: 'Service-public.fr : rédaction du bail d’habitation, documents à remettre au locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F920', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : assurance habitation du locataire (risques locatifs)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1349', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'appel-a-la-caution',
    title: 'Appel à la caution (garant) après un impayé : modèle gratuit',
    description: 'Modèle de lettre au garant d’un locataire après un loyer impayé : ce que vous pouvez lui demander, le commandement de payer et le délai de 15 jours.',
    lead: 'Le locataire ne paie plus : la lettre qui prévient son garant et lui demande de payer.',
    rules: [
      'Dès le premier impayé, vous pouvez demander le paiement au garant choisi à la signature du bail.',
      'Si le bail a une clause résolutoire, le commandement de payer est d’abord signifié au locataire par un commissaire de justice, puis à la caution. La loi (article 24) impose de le signifier à la caution dans les 15 jours suivant celui du locataire. À défaut, la caution ne peut pas être tenue de payer les pénalités ou intérêts de retard.',
      'Avec la garantie Visale, l’impayé se déclare dans les 30 jours.',
      'Le garant ne paie que dans les limites de son acte de cautionnement (montant, durée) : vérifiez-le avant d’écrire.',
    ],
    letter: {
      subject: 'Loyers impayés de [nom du locataire] : appel à la caution',
      paragraphs: [
        'Vous vous êtes porté caution de [nom du locataire] pour le logement situé [adresse du logement], par acte du [date de l’acte de cautionnement].',
        'Malgré mes relances, les sommes suivantes sont impayées : loyer et charges de [mois impayés], soit [montant] € ([montant en lettres]).',
        'En application de votre engagement, je vous demande de régler cette somme dans un délai de [15] jours à compter de la réception de cette lettre, par [virement sur le compte indiqué ci-dessous / chèque].',
        '[Un commandement de payer a été signifié au locataire le [date] ; il vous est signifié par commissaire de justice dans le délai de quinze jours prévu par la loi.]',
        'Je reste à votre disposition pour en parler et trouver une solution amiable.',
      ],
      annexes: ['L’acte de cautionnement, en copie.', 'Le décompte des sommes dues, mois par mois.', 'Les relances adressées au locataire.'],
    },
    send: 'Par lettre recommandée avec avis de réception. Le commandement de payer, lui, est signifié par un commissaire de justice.',
    bailio: 'Dans Bailio, l’appel à la caution reprend le montant dû et les mois impayés, et le courrier part au garant, pas au locataire.',
    sources: [
      { label: 'Service-public.fr : loyer impayé et expulsion du locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31272', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 24', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'reponse-demande-travaux-locataire',
    title: 'Réponse à une demande de travaux du locataire : modèle gratuit',
    description: 'Modèle de lettre pour répondre à un locataire qui veut faire des travaux : accord écrit pour les transformations, adaptation au handicap, rénovation énergétique, délai de deux mois.',
    lead: 'Votre locataire veut transformer ou aménager le logement : votre réponse écrite.',
    rules: [
      'Le locataire ne peut pas faire de gros travaux de transformation sans votre accord écrit. Sans cet accord, vous pouvez garder les transformations sans l’indemniser, ou exiger la remise des lieux en l’état à ses frais.',
      'Pour des travaux d’adaptation (handicap, perte d’autonomie) ou de rénovation énergétique, il vous écrit en recommandé avec avis de réception, en décrivant les travaux et l’entreprise.',
      'Vous avez 2 mois pour répondre. Sans réponse de votre part, votre accord est acquis. Vous pouvez aussi demander à faire les travaux vous-même dans un délai d’un an, ou saisir le juge pour un motif sérieux et légitime.',
      'Après les travaux, le locataire doit attester dans les 2 mois que l’entreprise et les travaux correspondent à ce qui était prévu.',
    ],
    letter: {
      subject: 'Votre demande de travaux du [date]',
      paragraphs: [
        'J’ai bien reçu votre demande du [date] concernant des travaux dans le logement situé [adresse du logement] : [nature des travaux].',
        '[Accord :] Je vous donne mon accord écrit pour ces travaux, aux conditions suivantes : [conditions : par exemple, entreprise qualifiée, respect des règles de la copropriété, remise en état à votre départ ou non].',
        '[Refus :] Je ne peux pas accepter ces travaux pour le motif suivant : [motif sérieux et légitime]. [Je vous propose de les faire moi-même, dans un délai de [durée].]',
        'Merci de me tenir informé de la date de début des travaux et de me remettre, à leur fin, l’attestation que l’entreprise et les travaux réalisés correspondent à ceux prévus.',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception si la demande est une demande d’adaptation ou de rénovation énergétique ; par email ou courrier sinon, en gardant une copie.',
    bailio: 'Dans Bailio, la demande du locataire arrive par son lien : elle devient une intervention du logement, avec photos et suivi.',
    sources: [{ label: 'Service-public.fr : utilisation du logement et travaux par le locataire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1874', checked: '9 novembre 2026' }],
  },
  {
    slug: 'mise-en-demeure-defaut-assurance',
    title: 'Mise en demeure pour défaut d’assurance habitation : modèle gratuit',
    description: 'Modèle de mise en demeure à un locataire qui n’a pas d’assurance habitation : délai d’un mois, assurance souscrite par le bailleur pour son compte, remboursement de la prime.',
    lead: 'Le locataire ne répond pas à vos demandes d’attestation : la lettre qui lui donne un mois pour s’assurer.',
    rules: [
      'Le locataire doit s’assurer au moins contre les risques locatifs (incendie, explosion, dégât des eaux) et en justifier à la remise des clés, puis une fois par an à votre demande.',
      'Pour souscrire une assurance à sa place, envoyez-lui d’abord une lettre recommandée avec avis de réception : il a alors un mois pour s’assurer.',
      'Une fois cette lettre envoyée, vous ne pouvez plus demander la résiliation du bail pour absence d’assurance, même s’il y a une clause résolutoire.',
      'Le locataire vous rembourse la prime, majorée de 10 % au plus, par douzièmes avec le loyer mensuel.',
    ],
    letter: {
      subject: 'Mise en demeure de justifier d’une assurance habitation',
      paragraphs: [
        'Malgré mes demandes du [dates], je n’ai pas reçu l’attestation d’assurance habitation du logement situé [adresse du logement].',
        'Votre bail et la loi vous obligent à assurer le logement au moins contre les risques locatifs (article 7 g de la loi n° 89-462 du 6 juillet 1989).',
        'Je vous mets en demeure de souscrire cette assurance et de me remettre l’attestation dans un délai d’un mois à compter de la réception de cette lettre.',
        'À défaut, je souscrirai une assurance pour votre compte. Son coût vous sera réclamé : la prime, majorée au plus de 10 %, sera répartie par douzièmes avec votre loyer mensuel.',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception. Gardez une copie et l’avis de réception : la date de réception fait partir le délai d’un mois.',
    bailio: 'Dans Bailio, la demande d’attestation part avec un rappel avant l’échéance et le locataire la dépose depuis son lien.',
    sources: [
      { label: 'Service-public.fr : obligation du locataire, assurance habitation couvrant les risques locatifs', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1349', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 7', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'mise-en-demeure-troubles-voisinage',
    title: 'Mise en demeure pour troubles de voisinage : modèle gratuit',
    description: 'Modèle de mise en demeure à un locataire qui cause des nuisances (bruit, odeurs) : lettre recommandée, justificatifs, suite possible (conciliation, résiliation du bail).',
    lead: 'Des voisins se plaignent de votre locataire : la lettre qui lui demande d’y mettre fin.',
    rules: [
      'Le locataire doit user paisiblement du logement, et il répond des personnes qu’il héberge. Les bruits de la vie courante ne suffisent pas : les nuisances visées sont répétées, excessives ou anormales.',
      'Vous pouvez être tenu responsable si vous n’agissez pas pour les faire cesser dès que vous en avez connaissance : la mise en demeure est la première étape.',
      'Envoyez-la en recommandé avec avis de réception (ou par acte de commissaire de justice), avec les justificatifs : plaintes, constats, témoignages.',
      'Sans effet, vous pouvez saisir un conciliateur de justice (gratuit) ou un médiateur (payant), puis demander la résiliation du bail, ou donner congé pour motif légitime et sérieux au moins 6 mois avant la fin du bail.',
    ],
    letter: {
      subject: 'Mise en demeure de cesser des troubles de voisinage',
      paragraphs: [
        'Des troubles m’ont été signalés au sujet du logement que vous louez, situé [adresse du logement] : [faits précis : nature, jours et heures, par exemple « bruit de musique après 23 h les [dates] »].',
        'Votre bail et la loi vous obligent à user paisiblement du logement et à respecter la tranquillité du voisinage. Je suis moi-même tenu d’agir pour faire cesser ces troubles.',
        'Je vous mets en demeure d’y mettre fin sans délai, et au plus tard dans les [8] jours suivant la réception de cette lettre.',
        'À défaut, je serai contraint d’engager les démarches prévues par la loi, qui peuvent aller jusqu’à la résiliation du bail par le juge.',
      ],
      annexes: ['Les plaintes, constats ou témoignages reçus, en copie.'],
    },
    send: 'Par lettre recommandée avec avis de réception, avec les justificatifs. Gardez une copie et l’avis de réception.',
    bailio: 'Dans Bailio, la mise en demeure se remplit avec les faits et les dates, se range avec le bail et sert de preuve en cas de suite.',
    sources: [{ label: 'Service-public.fr : le propriétaire est-il responsable des nuisances causées par son locataire ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31522', checked: '9 novembre 2026' }],
  },
  {
    slug: 'renouvellement-loyer-sous-evalue',
    title: 'Proposition de renouvellement avec loyer sous-évalué : modèle gratuit',
    description: 'Modèle de lettre pour proposer un nouveau loyer au renouvellement du bail quand il est manifestement sous-évalué : délai de 6 mois, références, mentions obligatoires.',
    lead: 'Le loyer est nettement en dessous des loyers voisins : la proposition à envoyer avant la fin du bail.',
    rules: [
      'Au renouvellement, le loyer n’est réévalué que s’il est manifestement sous-évalué. La proposition doit être reçue au moins 6 mois avant la fin du bail.',
      'Elle reproduit le texte intégral de l’article 17-2, I, de la loi du 6 juillet 1989 (sans lui, elle n’est pas valable), indique le nouveau loyer et la liste des références : au moins 6 loyers dans une agglomération de plus d’un million d’habitants, au moins 3 ailleurs.',
      'Impossible pour un logement classé F ou G au DPE. En zone tendue, la hausse est plafonnée.',
      'Le locataire répond par écrit au plus tard 4 mois avant la fin du bail ; l’absence de réponse vaut refus. Il faut alors saisir la commission départementale de conciliation, avant le juge.',
    ],
    letter: {
      subject: 'Proposition de nouveau loyer pour le renouvellement du bail',
      paragraphs: [
        'Votre bail du logement situé [adresse du logement] se termine le [date de fin du bail]. Je vous propose de le renouveler en réévaluant le loyer, aujourd’hui manifestement sous-évalué.',
        'Nouveau loyer proposé : [montant] € par mois hors charges, contre [loyer actuel] € aujourd’hui.',
        'Pour justifier cette proposition, voici les loyers de logements comparables : [liste d’au moins 3 références (6 dans une agglomération de plus d’un million d’habitants) : adresse, surface, loyer, date du bail, en incluant des baux récents et des baux de plus de 3 ans].',
        '[Recopier ici, mot pour mot, le texte de l’article 17-2, I, de la loi n° 89-462 du 6 juillet 1989, sur legifrance.gouv.fr.]',
        'Vous disposez d’un délai pour accepter par écrit cette proposition, jusqu’à 4 mois avant la fin du bail, soit le [date]. Sans réponse, je la considérerai comme refusée.',
      ],
      annexes: ['Le texte de l’article 17-2, I, de la loi du 6 juillet 1989, reproduit dans la lettre.', 'Les références des loyers comparables.'],
    },
    send: 'Par lettre recommandée avec avis de réception, par acte de commissaire de justice ou remise en main propre contre récépissé.',
    bailio: 'Dans Bailio, la date limite se calcule seule et la lettre rappelle l’interdiction pour un logement F ou G.',
    sources: [
      { label: 'Service-public.fr : hausse d’un loyer sous-évalué au renouvellement du bail', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1312', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 17-2', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'avenant-au-bail',
    title: 'Avenant au bail de location : modèle gratuit',
    description: 'Modèle d’avenant au bail pour changer de colocataire, ou fixer une majoration de loyer après des travaux d’amélioration, avec les règles à connaître.',
    lead: 'Le bail change en cours de route : le texte simple que tous les signataires datent et signent.',
    rules: [
      'Colocation : un nouveau colocataire qui en remplace un parti peut demander la signature d’un avenant à l’état des lieux d’entrée d’origine.',
      'Bail commun avec clause de solidarité : le colocataire qui part et sa caution restent tenus 6 mois après la fin de son préavis (jusqu’à la fin du préavis si un remplaçant est trouvé). Sans cette clause, il paie sa part jusqu’à la fin de son préavis.',
      'Le dépôt de garantie : le colocataire qui part ne peut pas en réclamer sa part au propriétaire, il s’arrange avec ses colocataires.',
      'Un avenant peut aussi fixer une majoration de loyer après des travaux d’amélioration (location vide), jamais pour un logement classé F ou G. La révision annuelle, elle, suit la clause du bail.',
    ],
    letter: {
      subject: 'Avenant au bail du [date du bail]',
      paragraphs: [
        'Entre [nom du bailleur] et [noms des locataires] ayant conclu, le [date], un bail portant sur le logement situé [adresse du logement], il est convenu ce qui suit.',
        '[Colocation :] À compter du [date], [nom du colocataire qui part] cesse d’être locataire et [nom du nouveau colocataire] devient locataire, avec les mêmes droits et obligations que ceux du bail. [Le nouveau colocataire reconnaît avoir pris connaissance du bail et de l’état des lieux d’entrée.]',
        '[Loyer, après travaux d’amélioration :] À compter du [date], le loyer mensuel hors charges est porté de [ancien loyer] € à [nouveau loyer] €, en raison des travaux suivants : [nature et coût des travaux].',
        'Toutes les autres clauses du bail restent inchangées.',
        'Fait à [lieu], le [date], en [nombre] exemplaires, un pour chaque signataire. [Signatures : bailleur, locataires, nouveau colocataire, caution si elle est maintenue.]',
      ],
    },
    send: 'Remis en main propre contre signature ou signé en ligne, avec un exemplaire pour chacun. Gardez-le avec le bail.',
    bailio: 'Dans Bailio, l’arrivée d’un colocataire se fait dans la fiche du locataire, et le bail garde l’historique du loyer avec la date d’effet de chaque changement.',
    sources: [
      { label: 'Service-public.fr : colocation, les règles', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34661', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : augmentation et révision du loyer en cours de bail', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1311', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'convocation-etat-des-lieux-sortie',
    title: 'Convocation à l’état des lieux de sortie : modèle gratuit',
    description: 'Modèle de lettre pour convoquer votre locataire à l’état des lieux de sortie : date convenue, recommandé, commissaire de justice avec 7 jours de préavis.',
    lead: 'Votre locataire part : fixez par écrit le jour de l’état des lieux et de la remise des clés.',
    rules: [
      'L’état des lieux de sortie se fait à la libération des lieux ou très peu de temps après, avec le locataire ou son représentant. Convenir de la date par lettre recommandée est conseillé.',
      'Si l’une des parties refuse de venir, de le faire ou de le signer, l’autre peut faire appel à un commissaire de justice, qui établit un constat. Il prévient alors par lettre recommandée au moins 7 jours à l’avance, et ses frais sont partagés par moitié.',
      'Fait à l’amiable, l’état des lieux est gratuit : le locataire n’a pas à payer de frais d’agence pour cela.',
      'Les différences dues à la vétusté ne donnent pas lieu à retenue sur le dépôt de garantie.',
    ],
    letter: {
      subject: 'État des lieux de sortie du [date]',
      paragraphs: [
        'Suite à votre congé, qui prend fin le [date de fin du préavis], je vous propose de réaliser l’état des lieux de sortie du logement situé [adresse du logement] le [date] à [heure].',
        'Il sera établi contradictoirement, en comparaison avec l’état des lieux d’entrée du [date], et signé par nous deux. Merci d’apporter toutes les clés (y compris badges et télécommandes).',
        'Si cette date ne vous convient pas, merci de me proposer une autre date avant le [date limite].',
        'Lors de la remise des clés, merci de m’indiquer votre nouvelle adresse et vos coordonnées bancaires, pour la restitution du dépôt de garantie.',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception (conseillé), ou par email avec accord écrit du locataire sur la date.',
    bailio: 'Dans Bailio, l’état des lieux de sortie se compare à l’entrée pièce par pièce, avec photos, et le solde de tout compte reprend les écarts.',
    sources: [{ label: 'Service-public.fr : état des lieux de sortie pour un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33671', checked: '9 novembre 2026' }],
  },
  {
    slug: 'decompte-retenues-depot-de-garantie',
    title: 'Décompte des retenues sur le dépôt de garantie : modèle gratuit',
    description: 'Modèle de décompte du dépôt de garantie avec retenues justifiées (loyers, charges, dégradations) et pièces à joindre, à copier et compléter.',
    lead: 'Vous gardez une partie du dépôt : le tableau qui justifie chaque retenue.',
    rules: [
      'Vous pouvez garder ce que le locataire doit encore : loyers ou charges impayés, dégradations, travaux locatifs non réalisés. La somme rendue peut donc être inférieure au dépôt.',
      'Chaque retenue se justifie par des pièces : états des lieux, photos, constat de commissaire de justice, factures ou devis, lettre de réclamation restée sans réponse.',
      'L’usure normale (vétusté) ne se retient jamais.',
      'Le délai est d’un mois après la remise des clés si l’état des lieux de sortie est conforme, deux mois sinon. En copropriété, une provision de 20 % du dépôt au plus peut être gardée jusqu’à l’arrêté des comptes.',
    ],
    letter: {
      subject: 'Décompte du dépôt de garantie',
      paragraphs: [
        'Voici le décompte du dépôt de garantie de [montant] € versé pour le logement situé [adresse du logement], après la remise des clés le [date].',
        'Retenues : [nature de la retenue : par exemple loyer de [mois] impayé / remise en état de [élément] : montant € ; pièce justificative jointe : état des lieux, facture n° …, devis].',
        'Total des retenues : [montant] €. [Provision pour charges de copropriété : [montant] € (20 % du dépôt au plus), à régulariser dans le mois suivant l’approbation des comptes.]',
        'Somme à vous restituer : [montant] €, versée le [date], sur le compte que vous m’avez indiqué.',
      ],
      annexes: ['Les états des lieux d’entrée et de sortie.', 'Les factures, devis, photos ou lettres de réclamation qui justifient chaque retenue.'],
    },
    send: 'Par email ou courrier à la nouvelle adresse du locataire, avec les justificatifs, avant la fin du délai d’un ou deux mois.',
    bailio: 'Dans Bailio, les retenues viennent de l’état des lieux comparé à l’entrée et du récapitulatif des dégradations, avec leurs justificatifs et la pénalité de retard calculée.',
    sources: [{ label: 'Service-public.fr : dépôt de garantie dans un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31269', checked: '9 novembre 2026' }, { label: 'Service-public.fr : état des lieux de sortie pour un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33671', checked: '9 novembre 2026' }],
  },
  {
    slug: 'information-travaux-locataire',
    title: 'Information du locataire avant des travaux : modèle gratuit',
    description: 'Modèle de lettre pour prévenir votre locataire de travaux dans le logement : nature, dates, accès, samedis et jours fériés, réduction de loyer au-delà de 21 jours.',
    lead: 'Des travaux à faire dans le logement loué : la lettre qui prévient le locataire avant qu’ils commencent.',
    rules: [
      'Avant le début des travaux, vous devez informer le locataire de leur nature et de la façon dont ils seront exécutés (date de début, durée, accès au logement).',
      'Envoyez la lettre en recommandé avec avis de réception, ou remettez-la en main propre.',
      'Aucun travail le samedi, le dimanche ou un jour férié sans l’accord exprès du locataire.',
      'Au-delà de 21 jours de travaux, une réduction de loyer proportionnelle à la durée est due. Des travaux abusifs ou non conformes à ce que vous avez annoncé peuvent être arrêtés par le juge.',
    ],
    letter: {
      subject: 'Travaux dans votre logement à partir du [date]',
      paragraphs: [
        'Je vous informe que des travaux seront réalisés dans le logement situé [adresse du logement] : [nature des travaux].',
        'Ils commenceront le [date de début] et dureront environ [durée]. Ils seront réalisés par [entreprise] du lundi au vendredi, de [heure] à [heure]. [L’entreprise devra accéder à [pièces concernées] : merci de lui en faciliter l’accès.]',
        'Aucun travail n’aura lieu le samedi, le dimanche ni les jours fériés sans votre accord exprès.',
        '[Si les travaux durent plus de 21 jours :] Une réduction de loyer proportionnelle à leur durée vous sera accordée : [montant ou mode de calcul].',
        'Pour toute question, vous pouvez me joindre au [téléphone] ou à [email].',
      ],
    },
    send: 'Par lettre recommandée avec avis de réception, ou en main propre contre signature, assez tôt avant le début des travaux.',
    bailio: 'Dans Bailio, les travaux se suivent comme des interventions du logement : date prévue, coût, et le locataire est prévenu par email s’il est coché.',
    sources: [
      { label: 'Service-public.fr : bail d’habitation, travaux à la charge du propriétaire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31699', checked: '9 novembre 2026' },
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 7 e', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000509310', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'refus-de-sous-location',
    title: 'Refus de sous-location : modèle gratuit',
    description: 'Modèle de lettre pour refuser la sous-location de votre logement par votre locataire : accord écrit obligatoire, loyer plafonné, risques de résiliation.',
    lead: 'Votre locataire veut sous-louer : votre réponse écrite, et ce que la loi prévoit.',
    rules: [
      'Le locataire doit d’abord obtenir votre accord écrit, sur la sous-location et sur le loyer demandé. Il est conseillé qu’il le demande par lettre recommandée.',
      'Le loyer au m² demandé au sous-locataire ne peut pas dépasser celui que paie le locataire.',
      'Sous-louer sans autorisation peut entraîner la résiliation du bail du locataire et de celui du sous-locataire, avec remboursement des sous-loyers perçus et dommages et intérêts.',
      'Exception : dans la cohabitation intergénérationnelle solidaire, le propriétaire ne peut pas s’y opposer.',
    ],
    letter: {
      subject: 'Votre demande de sous-location',
      paragraphs: [
        'J’ai bien reçu votre demande du [date] de sous-louer [tout ou partie du] logement situé [adresse du logement].',
        'Je ne donne pas mon accord à cette sous-location. Le bail et la loi la subordonnent à mon accord écrit, que je ne donne pas.',
        'Je vous rappelle qu’une sous-location faite sans autorisation peut entraîner la résiliation de votre bail.',
        '[Je reste à votre disposition pour en discuter : par exemple, une autre solution pour la durée de votre absence.]',
      ],
    },
    send: 'Par email ou courrier. Si le locataire vous a écrit en recommandé, répondez de la même façon et gardez une copie.',
    bailio: 'Dans Bailio, vos réponses aux locataires sont rangées avec le bail, pour retrouver la date de chaque échange.',
    sources: [{ label: 'Service-public.fr : un locataire peut-il sous-louer son logement ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2449', checked: '9 novembre 2026' }],
  },
  {
    slug: 'attestation-remise-des-cles',
    title: 'Attestation de remise des clés et de fin de bail : modèle gratuit',
    description: 'Modèle d’attestation de remise des clés à la fin du bail : date de départ du délai de restitution du dépôt de garantie, état des lieux de sortie, nouvelle adresse du locataire.',
    lead: 'La preuve écrite que les clés ont été rendues, qui fait partir le délai pour restituer le dépôt.',
    rules: [
      'Le délai de restitution du dépôt de garantie (un mois si l’état des lieux de sortie est conforme, deux mois sinon) court à partir de la remise des clés, en main propre ou par lettre recommandée avec avis de réception.',
      'À la remise des clés, le locataire indique sa nouvelle adresse et ses coordonnées bancaires. Sans nouvelle adresse, la majoration de 10 % du loyer par mois de retard ne s’applique pas.',
      'L’attestation complète l’état des lieux de sortie, elle ne le remplace pas.',
    ],
    letter: {
      subject: 'Attestation de remise des clés',
      paragraphs: [
        'Je soussigné(e) [nom du bailleur], propriétaire du logement situé [adresse du logement], atteste avoir reçu de [nom du locataire], le [date], à [heure], les clés suivantes : [nombre et type de clés, badges, télécommandes].',
        'Le bail conclu le [date] prend fin ce jour. L’état des lieux de sortie établi le [date] [est / n’est pas] conforme à l’état des lieux d’entrée.',
        'Le dépôt de garantie de [montant] € sera restitué, déduction faite des sommes dues et justifiées, au plus tard le [date limite : un mois ou deux mois après la remise des clés], à la nouvelle adresse et sur le compte indiqués ci-dessous : [nouvelle adresse du locataire, coordonnées bancaires].',
        'Fait à [lieu], le [date]. [Signatures : bailleur et locataire.]',
      ],
    },
    send: 'Signée en deux exemplaires à la remise des clés, ou envoyée par email avec l’état des lieux de sortie.',
    bailio: 'Dans Bailio, la date de remise des clés et la nouvelle adresse du locataire sont reprises dans sa fiche et dans le solde de tout compte, avec la date limite de restitution.',
    sources: [{ label: 'Service-public.fr : dépôt de garantie dans un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31269', checked: '9 novembre 2026' }, { label: 'Service-public.fr : état des lieux de sortie pour un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33671', checked: '9 novembre 2026' }],
  },
  {
    slug: 'acte-de-caution-solidaire',
    title: 'Acte de caution solidaire pour un bail d’habitation : modèle gratuit',
    description: 'Modèle d’acte de cautionnement solidaire d’un locataire : loyer et révision, mention écrite par la caution, durée, résiliation, exemplaire du bail remis. Avec les règles à respecter à peine de nullité.',
    lead: 'L’engagement écrit du garant, avec les mentions que la loi impose pour qu’il soit valable.',
    rules: [
      'La caution est une personne physique : elle signe l’acte, qui indique le montant du loyer et ses conditions de révision, tels qu’ils figurent au bail, et reproduit l’avant-dernier alinéa de l’article 22-1 de la loi du 6 juillet 1989 (repris tel quel dans le modèle).',
      'Elle écrit elle-même la mention de l’article 2297 du code civil : elle s’engage en qualité de caution à payer au bailleur ce que lui doit le locataire s’il fait défaut, dans la limite d’un montant en principal et accessoires, en toutes lettres et en chiffres. En cas de différence, c’est la somme en toutes lettres qui compte.',
      'Caution solidaire : elle renonce à exiger que vous poursuiviez d’abord le locataire ou que vous divisiez vos poursuites entre les cautions, et elle le reconnaît dans sa mention (article 2297). Sans cela, elle peut s’en prévaloir. Vous pouvez alors lui réclamer les sommes dès le premier impayé.',
      'Vous remettez à la caution un exemplaire du bail. Toutes ces formalités sont prescrites à peine de nullité du cautionnement : un oubli peut rendre l’acte sans effet.',
      'Le montant de l’engagement est fixé librement par les parties. Il est d’usage d’indiquer le loyer × 12 × la durée du bail. La durée peut être déterminée ou indéterminée.',
      'Ces règles valent pour les cautionnements conclus depuis le 1er janvier 2022 (ordonnance n° 2021-1192 du 15 septembre 2021).',
    ],
    letter: {
      subject: 'Acte de cautionnement solidaire du bail de [nom du locataire]',
      paragraphs: [
        'Je soussigné(e) [nom, prénom, date et lieu de naissance, adresse de la caution], me porte caution solidaire de [nom du locataire] pour le bail conclu le [date du bail] avec [nom du bailleur], portant sur le logement situé [adresse du logement].',
        'Le loyer mensuel est de [montant] € hors charges, plus [montant] € de charges. Il est révisé chaque année à la date du [date de révision] selon l’indice de référence des loyers (IRL) du [trimestre de référence], comme prévu au bail.',
        'Durée de mon engagement : [durée déterminée : jusqu’au (date) / durée indéterminée].',
        'Montant maximal de mon engagement, en principal et accessoires : [montant en chiffres] € ([montant en lettres]).',
        'Reproduction de l’avant-dernier alinéa de l’article 22-1 de la loi n° 89-462 du 6 juillet 1989 : « Lorsque le cautionnement d’obligations résultant d’un contrat de location conclu en application du présent titre ne comporte aucune indication de durée ou lorsque la durée du cautionnement est stipulée indéterminée, la caution peut le résilier unilatéralement. La résiliation prend effet au terme du contrat de location, qu’il s’agisse du contrat initial ou d’un contrat reconduit ou renouvelé, au cours duquel le bailleur reçoit notification de la résiliation. »',
        '[À écrire par la caution elle-même, de sa main : « Je m’engage en qualité de caution solidaire à payer à [nom du bailleur] ce que lui doit [nom du locataire] en cas de défaillance de celui-ci, dans la limite de [montant en chiffres] € ([montant en lettres]), en principal et accessoires. Je reconnais ne pouvoir exiger du créancier qu’il poursuive d’abord le débiteur ni qu’il divise ses poursuites entre les cautions. »]',
        'Je reconnais avoir reçu un exemplaire du contrat de location.',
        'Fait à [lieu], le [date]. [Signature de la caution.]',
      ],
      annexes: ['Un exemplaire du contrat de location, remis à la caution.', 'Une copie de la pièce d’identité de la caution (facultative pour la validité de l’acte).'],
    },
    send: 'Faites signer l’acte en deux exemplaires en même temps que le bail, ou avant, et remettez à la caution un exemplaire du bail. Gardez l’original : il servira si vous devez appeler la caution.',
    bailio: 'Dans Bailio, le garant est enregistré dans la fiche du locataire avec son engagement (montant, durée), et l’appel à la caution reprend ces informations en cas d’impayé.',
    sources: [
      { label: 'Légifrance : loi n° 89-462 du 6 juillet 1989, article 22-1', url: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044073458', checked: '9 novembre 2026' },
      { label: 'Légifrance : code civil, article 2297', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044071230', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : se porter caution solidaire (ou simple) d’un locataire', url: 'https://www.service-public.gouv.fr/simulateur/calcul/ActeCautionnement', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'charte-de-colocation',
    title: 'Charte de colocation : modèle gratuit de règlement intérieur',
    description: 'Modèle de charte de colocation entre colocataires : charges, ménage, invités, départ d’un colocataire. Un accord entre colocataires qui ne remplace pas le bail.',
    lead: 'Les règles de vie commune que les colocataires se donnent, par écrit, pour éviter les disputes.',
    rules: [
      'Cette charte est un accord entre colocataires. Elle ne remplace pas le bail et ne le modifie pas : en cas de différence, c’est le bail qui s’applique.',
      'Avec un bail commun et une clause de solidarité, chaque colocataire et sa caution peuvent devoir payer la part des autres. Un colocataire qui part reste tenu 6 mois après la fin de son préavis, ou jusqu’à la fin du préavis si un remplaçant le rejoint pendant celui-ci. La charte ne peut pas raccourcir ce délai à l’égard du bailleur.',
      'Un colocataire qui part ne peut pas demander sa part du dépôt de garantie au bailleur : il s’arrange avec les colocataires qui restent.',
      'Dans tous les cas, le bailleur dispose de 3 ans pour réclamer des loyers ou charges impayés.',
    ],
    letter: {
      subject: 'Charte de colocation du logement situé [adresse du logement]',
      paragraphs: [
        'Entre les colocataires soussignés : [noms des colocataires], titulaires du bail du [date du bail] conclu avec [nom du bailleur].',
        'Cette charte organise la vie commune. Elle ne remplace pas le bail, qui reste applicable en toutes circonstances, notamment pour la solidarité à l’égard du bailleur.',
        'Loyer et charges : le loyer et les charges sont de [montant] € par mois, répartis ainsi entre nous : [répartition par colocataire]. Chacun verse sa part à [la personne qui centralise / directement au bailleur] avant le [jour] de chaque mois. Les factures d’énergie, d’internet et d’assurance sont réparties [à parts égales / selon la répartition ci-dessus].',
        'Ménage et entretien : les parties communes sont entretenues [à tour de rôle selon le planning joint / selon la répartition suivante : ...]. Les produits d’entretien communs sont achetés [modalités].',
        'Invités : chacun peut recevoir des invités après en avoir informé les autres [au moins (délai) à l’avance pour une nuitée]. Un invité ne reste pas plus de [nombre] nuits par mois sans l’accord de tous. Le colocataire qui l’invite en est responsable.',
        'Bruit et vie en commun : [horaires de calme], [règles pour la cuisine, le tabac, les animaux, etc.].',
        'Départ d’un colocataire : il prévient les autres et envoie son préavis au bailleur dans les formes prévues au bail. Nous nous informons mutuellement du remplaçant proposé, qui est présenté au bailleur. Le colocataire qui part règle avec nous sa part de dépôt de garantie et des frais communs.',
        'Dégradations : chacun répare ou rembourse ce qu’il abîme. Les dégradations dont l’auteur est inconnu sont partagées [modalités].',
        'Fait à [lieu], le [date], en [nombre] exemplaires. [Signatures de tous les colocataires.]',
      ],
    },
    send: 'À signer par tous les colocataires et à garder en un exemplaire chacun. Remettez une copie à un nouveau colocataire en même temps que le bail.',
    bailio: 'Dans Bailio, le bail de colocation (bail commun avec ou sans clause de solidarité, ou bail individuel) se prépare avec tous les colocataires et leurs garants : la charte vient en complément.',
    sources: [
      { label: 'Service-public.fr : colocation, quelles sont les règles ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F34661', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : un colocataire doit-il payer les dettes après avoir donné son préavis ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2044', checked: '9 novembre 2026' },
    ],
  },
  {
    slug: 'etat-des-lieux-vierge',
    title: 'État des lieux vierge (entrée et sortie) : modèle gratuit',
    description: 'Trame d’état des lieux d’entrée ou de sortie à compléter pièce par pièce, avec les mentions du décret du 30 mars 2016 : compteurs, clés, signatures.',
    lead: 'La trame à remplir avec le locataire, pièce par pièce, le jour de la remise des clés.',
    rules: [
      'L’état des lieux d’entrée se fait lors de la remise des clés, ensemble par le locataire et le bailleur, sur papier ou en version électronique. Chacun en reçoit un exemplaire à la signature.',
      'Mentions du décret n° 2016-382 à l’entrée et à la sortie : le type d’état des lieux, sa date, la localisation du logement, les parties et l’adresse du bailleur, l’éventuel mandataire, les relevés des compteurs individuels d’eau ou d’énergie, les clés et autres moyens d’accès, la description pièce par pièce des revêtements, équipements et éléments (avec observations, réserves et images possibles) et les signatures.',
      'À la sortie, s’ajoutent la nouvelle adresse du locataire, la date de l’état des lieux d’entrée et, s’il y a lieu, les différences constatées pièce par pièce.',
      'Le locataire peut demander de le compléter dans les 10 jours qui suivent l’état des lieux d’entrée. Pour le chauffage, la demande peut se faire pendant le premier mois de la période de chauffe.',
      'En cas de désaccord, ou si l’autre partie ne vient pas, un commissaire de justice peut établir un constat après une lettre recommandée envoyée au moins 7 jours avant. Les frais sont alors partagés.',
    ],
    letter: {
      subject: 'État des lieux d’[entrée / de sortie]',
      paragraphs: [
        'Type : [entrée / sortie]. Date : [date]. Logement : [adresse, étage, porte, lot]. Bailleur : [nom et adresse du bailleur]. Locataire(s) : [noms]. [Mandataire éventuel : nom et adresse.]',
        'Compteurs individuels : eau froide [relevé], eau chaude [relevé], électricité [relevé], gaz [relevé], chauffage [relevé].',
        'Clés et accès : [nombre de clés de la porte d’entrée, boîte aux lettres, cave, garage, badges, télécommandes, digicode, interphone].',
        'Pièce par pièce (entrée, séjour, cuisine, chambres, salle de bains, WC, autres) : pour chaque pièce, l’état du sol, des murs, du plafond, des fenêtres et volets, des portes, des prises et interrupteurs, de l’éclairage, du chauffage, de la plomberie et des équipements, en [bon état / état d’usage / mauvais état], avec les observations et réserves : [observations].',
        'Observations et réserves générales : [observations]. Photos jointes : [nombre].',
        '[À la sortie seulement : nouvelle adresse du locataire : [adresse]. Date de l’état des lieux d’entrée : [date]. Différences constatées pièce par pièce : [différences].]',
        'Fait à [lieu], le [date], en [nombre] exemplaires. [Signatures du bailleur et du locataire ou de leurs mandataires.]',
      ],
      annexes: ['Les photos prises pendant l’état des lieux.', 'À la sortie : l’état des lieux d’entrée.'],
    },
    send: 'À signer sur place par les deux parties, chacune gardant un exemplaire. Rangez-le avec le bail : il servira pour le dépôt de garantie.',
    bailio: 'Dans Bailio, l’état des lieux se fait sur téléphone, pièce par pièce, avec photos et signatures, et celui de sortie est comparé automatiquement à celui d’entrée.',
    sources: [
      { label: 'Légifrance : décret n° 2016-382 du 30 mars 2016, article 2', url: 'https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000032320574', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : état des lieux d’entrée pour un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31270', checked: '9 novembre 2026' },
      { label: 'Service-public.fr : état des lieux de sortie pour un bail d’habitation', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F33671', checked: '9 novembre 2026' },
    ],
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
  { path: '/simulateurs/rentabilite-locative', title: 'Rentabilité locative : rendement brut et net', name: 'Rentabilité locative', lead: 'Rendement brut et net de charges de votre logement, en cinq questions.', description: 'Calculez gratuitement la rentabilité locative de votre logement : rendement brut et rendement net de charges, avant impôt, à partir du prix d’achat, des frais, du loyer et des charges.' },
  { path: '/simulateurs/piece-autorisee', title: 'Pièce autorisée dans un dossier de location ?', name: 'Pièce autorisée dans un dossier de location', lead: 'Choisissez une pièce : autorisée ou interdite, avec la raison.', description: 'Carte Vitale, relevé de compte, photo d’identité, chèque de réservation… Quelles pièces pouvez-vous demander à un locataire ? Autorisée ou interdite, selon la liste officielle du décret du 5 novembre 2015.' },
] as const

/** Texte brut de la lettre, prêt à copier. */
export const letterText = (m: Modele) =>
  [`Objet : ${m.letter.subject}`, '', '[Votre nom et adresse]', '[Nom et adresse du locataire]', '[Lieu], le [date]', '', 'Madame, Monsieur,', '', ...m.letter.paragraphs.flatMap((p) => [p, '']), 'Je vous prie d’agréer, Madame, Monsieur, mes salutations distinguées.', '', '[Signature]'].join('\n')
