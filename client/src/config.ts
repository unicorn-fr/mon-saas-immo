/**
 * Prix de l'offre « Bailio, tout inclus » (suivi), par logement loué : sous le prix du marché (Qalimo 4,90 €,
 * docs/strategie/prix-2026-11.md), sans option payante. Garage, box ou place : prix réduit. Paiement à l'année mis en avant.
 */
export const MONTHLY_PRICE: string | null = '3,49 €'
export const PRICE_UNIT = 'par logement et par mois'
export const YEARLY_PRICE = '34,90 €'
export const PARKING_PRICE = '1,49 €'
/** Mêmes prix en centimes, pour les calculs (À VALIDER PAR ENZO : options de prix dans PLAN.md, partie 8). */
export const MONTHLY_PRICE_CENTS = 349
export const YEARLY_PRICE_CENTS = 3490
export const PARKING_PRICE_CENTS = 149

/**
 * Plafond : Bailio reste toujours moins cher que Qalimo (forfait de 34,30 € par mois ou 343 € par an de 7 à 40 biens,
 * qalimo.fr/tarif lu le 15 novembre 2026, docs/strategie/couts-reels-2026-11.md). Dès 9 biens, la facture ne dépasse
 * plus 29,90 € par mois ou 299 € par an, jusqu'à 40 biens ; au-delà, sur devis.
 */
export const CAP_MONTHLY_CENTS = 2990
export const CAP_YEARLY_CENTS = 29900
export const CAP_FROM_HOMES = 9
export const CAP_MAX_HOMES = 40
export const CAP_MONTHLY = '29,90 €'
export const CAP_YEARLY = '299 €'

/** Prix à payer en centimes pour des logements et des garages, plafond compris ; null au-delà de 40 biens (sur devis). */
export const billCents = (homes: number, garages: number, yearly: boolean): number | null => {
  if (homes + garages > CAP_MAX_HOMES) return null
  const raw = yearly ? homes * YEARLY_PRICE_CENTS + garages * PARKING_PRICE_CENTS * 12 : homes * MONTHLY_PRICE_CENTS + garages * PARKING_PRICE_CENTS
  return Math.min(raw, yearly ? CAP_YEARLY_CENTS : CAP_MONTHLY_CENTS)
}

export const priceLabel = () => MONTHLY_PRICE ?? 'Prix à venir'
/** « 3,49 € par logement et par mois » */
export const priceText = () => (MONTHLY_PRICE ? `${MONTHLY_PRICE} ${PRICE_UNIT}` : 'Prix à venir')
/** Détail complet, pour les pages légales et Mon compte. */
export const priceDetail = () => (MONTHLY_PRICE ? `${priceText()} (ou ${YEARLY_PRICE} par logement et par an), ${PARKING_PRICE} par mois pour un garage, un box ou une place, jamais plus de ${CAP_MONTHLY} par mois (${CAP_YEARLY} par an) jusqu'à ${CAP_MAX_HOMES} biens` : 'Prix à venir')

/** Aucun paiement n'est encore demandé : affiché partout où le prix apparaît (accueil, Mon compte). */
export const LAUNCH_OFFER = 'Premier mois offert'

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
  phone: '09 52 14 05 90',
  company: null,
  registration: null,
  vat: null,
}

/**
 * Médiateur de la consommation (Code de la consommation, art. L612-1 et L616-1) : obligatoire avant de
 * facturer un consommateur. Affiché dans les conditions et la page des prix dès qu'il est désigné.
 */
export const MEDIATOR: { name: string; url: string; address: string } | null = null
