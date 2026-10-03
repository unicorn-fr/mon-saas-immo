/** Prix mensuel de l'offre « Bailio, tout inclus » (suivi). */
export const MONTHLY_PRICE: string | null = '9,99 €'

export const priceLabel = () => MONTHLY_PRICE ?? 'Prix à venir'

/** Aucun paiement n'est encore demandé : affiché partout où le prix apparaît (accueil, Mon compte). */
export const LAUNCH_OFFER = 'Offert pendant le lancement'

/** Adresse de contact affichée sur le site (mentions légales, confidentialité, contact). */
export const CONTACT_EMAIL = 'contact@bailio.fr'

/** Profil public du fondateur et éditeur du site. */
export const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/enzo-mercier/'

/**
 * Coordonnées de l'éditeur exigées par la loi n° 2004-575 du 21 juin 2004 (LCEN), art. 6-III : pour une
 * personne physique, domicile et téléphone ; pour une société, dénomination, siège, capital et immatriculation.
 * Affichées dans les mentions légales dès qu'elles sont renseignées.
 */
export const EDITOR: { address: string | null; phone: string | null; company: string | null; registration: string | null; vat: string | null } = {
  address: null,
  phone: null,
  company: null,
  registration: null,
  vat: null,
}

/**
 * Médiateur de la consommation (Code de la consommation, art. L612-1 et L616-1) : obligatoire avant de
 * facturer un consommateur. Affiché dans les conditions et la page des prix dès qu'il est désigné.
 */
export const MEDIATOR: { name: string; url: string; address: string } | null = null
