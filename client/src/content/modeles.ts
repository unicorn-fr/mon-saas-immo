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

/** Texte brut de la lettre, prêt à copier. */
export const letterText = (m: Modele) =>
  [`Objet : ${m.letter.subject}`, '', '[Votre nom et adresse]', '[Nom et adresse du locataire]', '[Lieu], le [date]', '', 'Madame, Monsieur,', '', ...m.letter.paragraphs.flatMap((p) => [p, '']), 'Je vous prie d’agréer, Madame, Monsieur, mes salutations distinguées.', '', '[Signature]'].join('\n')
