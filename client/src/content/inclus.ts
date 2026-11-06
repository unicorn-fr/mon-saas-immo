/**
 * « Tout compris » : ce que l'abonnement comprend, sans option payante en plus. Affiché sur l'accueil (offre « Tout
 * inclus ») et sur « Changer pour Bailio ». N'y mettre que ce qui existe vraiment dans Bailio.
 */
export const INCLUS = [
  'Bail conforme au contrat type, vérifié avant la signature',
  'Signature électronique, pour le locataire et le garant',
  'États des lieux d’entrée et de sortie, comparés',
  'Quittances envoyées dès le loyer reçu',
  'Relances automatiques si le loyer manque',
  'Révision du loyer avec le bon indice',
  'Aide à la déclaration des revenus, formulaires pré-remplis',
  'Annonce, candidatures et pièces protégées',
] as const

/** Promesse de rappel : affichée sur l'accueil, la page Contact et « Changer pour Bailio ». À tenir chaque jour ouvré. */
export const CALLBACK_PROMISE = 'On vous rappelle le jour même, du lundi au vendredi.'
