export interface ContractClause {
  id: string
  title: string
  description: string
  enabled: boolean
  isCustom?: boolean
}

export const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: 'destination',
    title: 'Destination des lieux',
    description:
      'Les locaux sont loues a usage exclusif d\'habitation principale. Le locataire ne pourra exercer aucune activite commerciale, artisanale ou professionnelle dans les lieux loues sans accord prealable et ecrit du bailleur.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'duration',
    title: 'Duree du bail',
    description:
      'Le bail est conclu pour une duree de 3 ans pour les locations nues et de 1 an pour les locations meublees, conformement a la loi du 6 juillet 1989. A l\'expiration de cette duree, le bail est reconduit tacitement pour la meme duree, sauf conge delivre par l\'une des parties dans les conditions legales.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'rent_payment',
    title: 'Paiement du loyer',
    description:
      'Le loyer est payable mensuellement, a terme a echoir, avant le 5 de chaque mois. Le paiement peut etre effectue par virement bancaire, prelevement automatique ou tout autre moyen convenu entre les parties. A defaut de paiement a la date convenue, des penalites de retard pourront etre appliquees conformement a la legislation en vigueur.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'charges',
    title: 'Charges locatives',
    description:
      'Les charges locatives sont payables mensuellement sous forme de provisions, avec regularisation annuelle. Le bailleur transmet au locataire le decompte des charges un mois avant la regularisation. Les charges recuperables sont definies par le decret n°87-713 du 26 aout 1987.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'deposit',
    title: 'Depot de garantie',
    description:
      'Le depot de garantie est limite a 1 mois de loyer hors charges pour les locations nues et a 2 mois de loyer hors charges pour les locations meublees. Il est restitue dans un delai maximal d\'1 mois a compter de la remise des cles si l\'etat des lieux de sortie est conforme, ou de 2 mois en cas de differences constatees. Les retenues eventuelles doivent etre justifiees.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'insurance',
    title: 'Assurance habitation',
    description:
      'Le locataire est tenu de souscrire une assurance habitation couvrant les risques locatifs (incendie, degats des eaux, explosions) et d\'en fournir une attestation au bailleur avant la remise des cles, puis chaque annee a la date anniversaire du contrat. A defaut de justificatif, le bailleur pourra, apres mise en demeure restee sans effet pendant un mois, resilier le bail.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'maintenance',
    title: 'Entretien et reparations',
    description:
      'Le locataire prend en charge l\'entretien courant du logement et les menues reparations, telles que definies par le decret du 26 aout 1987. Le bailleur est responsable des grosses reparations (article 606 du Code civil) ainsi que des travaux necessaires au maintien en l\'etat et a l\'entretien normal du logement.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'modifications',
    title: 'Travaux et transformations',
    description:
      'Le locataire ne peut realiser aucune transformation ou modification structurelle des lieux sans l\'accord prealable et ecrit du bailleur. En revanche, le locataire peut librement realiser des amenagements de decoration (peinture, pose de tablettes, etc.) a condition de ne pas denaturer les lieux. En cas de travaux non autorises, le bailleur pourra exiger la remise en etat aux frais du locataire.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'subletting',
    title: 'Sous-location',
    description:
      'La sous-location totale ou partielle du logement est interdite sans l\'accord ecrit et prealable du bailleur, conformement a l\'article 8 de la loi du 6 juillet 1989. En cas d\'autorisation, le loyer de sous-location ne peut exceder le loyer principal. Toute sous-location non autorisee constitue un motif de resiliation du bail.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'termination',
    title: 'Conge et preavis',
    description:
      'Le locataire peut donner conge a tout moment avec un preavis de 3 mois pour les locations nues (reduit a 1 mois en zones tendues, en cas de mutation professionnelle, de perte d\'emploi, de premier emploi ou pour les beneficiaires du RSA) et de 1 mois pour les locations meublees. Le conge doit etre notifie par lettre recommandee avec accuse de reception, par acte de commissaire de justice ou par remise en main propre contre emargement.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'etat_des_lieux',
    title: 'Etat des lieux',
    description:
      'Un etat des lieux d\'entree et de sortie est etabli de maniere contradictoire entre les parties, conformement a la loi ALUR. Il est realise conjointement lors de la remise et de la restitution des cles. En cas de desaccord, les parties peuvent faire appel a un commissaire de justice dont les frais sont partages par moitie.',
    enabled: true,
    isCustom: false,
  },
  {
    id: 'nuisances',
    title: 'Troubles de voisinage',
    description:
      'Le locataire est tenu d\'user paisiblement des locaux loues et de ne causer aucun trouble de voisinage, conformement a l\'article 7 de la loi du 6 juillet 1989. Il doit respecter le reglement interieur de l\'immeuble et veiller a ce que ses occupants et visiteurs fassent de meme. Les nuisances sonores repetees ou tout comportement portant atteinte a la tranquillite du voisinage peuvent constituer un motif de resiliation du bail.',
    enabled: true,
    isCustom: false,
  },
]
