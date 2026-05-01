export interface CityPrice {
  city: string
  region: string
  prixM2: number
  trend: number
  trendLabel: 'up' | 'down' | 'stable'
}

export const FRENCH_CITY_PRICES: CityPrice[] = [
  { city: 'Paris', region: 'Île-de-France', prixM2: 9800, trend: -3.2, trendLabel: 'down' },
  { city: 'Lyon', region: 'Auvergne-Rhône-Alpes', prixM2: 4900, trend: 1.4, trendLabel: 'up' },
  { city: 'Marseille', region: 'PACA', prixM2: 3100, trend: 2.8, trendLabel: 'up' },
  { city: 'Bordeaux', region: 'Nouvelle-Aquitaine', prixM2: 4600, trend: -1.1, trendLabel: 'down' },
  { city: 'Toulouse', region: 'Occitanie', prixM2: 3800, trend: 3.5, trendLabel: 'up' },
  { city: 'Nantes', region: 'Pays de la Loire', prixM2: 3900, trend: -0.8, trendLabel: 'stable' },
  { city: 'Strasbourg', region: 'Grand Est', prixM2: 3500, trend: 1.2, trendLabel: 'up' },
  { city: 'Lille', region: 'Hauts-de-France', prixM2: 3200, trend: 2.0, trendLabel: 'up' },
  { city: 'Rennes', region: 'Bretagne', prixM2: 3700, trend: 1.8, trendLabel: 'up' },
  { city: 'Montpellier', region: 'Occitanie', prixM2: 3400, trend: 4.1, trendLabel: 'up' },
  { city: 'Nice', region: 'PACA', prixM2: 5100, trend: 2.3, trendLabel: 'up' },
  { city: 'Grenoble', region: 'Auvergne-Rhône-Alpes', prixM2: 2800, trend: 0.5, trendLabel: 'stable' },
  { city: 'Toulon', region: 'PACA', prixM2: 2900, trend: 3.2, trendLabel: 'up' },
  { city: 'Dijon', region: 'Bourgogne-Franche-Comté', prixM2: 2600, trend: 1.0, trendLabel: 'up' },
  { city: 'Angers', region: 'Pays de la Loire', prixM2: 2900, trend: 0.3, trendLabel: 'stable' },
  { city: 'Saint-Étienne', region: 'Auvergne-Rhône-Alpes', prixM2: 1200, trend: -2.5, trendLabel: 'down' },
  { city: 'Le Mans', region: 'Pays de la Loire', prixM2: 1700, trend: 0.8, trendLabel: 'stable' },
  { city: 'Aix-en-Provence', region: 'PACA', prixM2: 5600, trend: 1.9, trendLabel: 'up' },
  { city: 'Reims', region: 'Grand Est', prixM2: 2200, trend: 1.5, trendLabel: 'up' },
  { city: 'Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes', prixM2: 2100, trend: 2.2, trendLabel: 'up' },
]

export function getCityPrice(city: string): CityPrice | undefined {
  return FRENCH_CITY_PRICES.find(c => c.city.toLowerCase() === city.toLowerCase())
}
