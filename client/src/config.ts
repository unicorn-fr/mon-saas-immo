/**
 * Prix mensuel de l'offre « Bailio, tout inclus » (suivi). À définir : tant qu'il vaut null,
 * le site affiche « Prix à venir » et le bouton « Activer le suivi » active le suivi sans paiement.
 */
export const MONTHLY_PRICE: string | null = null

export const priceLabel = () => MONTHLY_PRICE ?? 'Prix à venir'
