import { apiClient } from './api.service'

export interface CityPrice {
  city: string
  slug: string
  rentPerSqm: number
  buyPerSqm: number
  trend: string
  zone: string
  population: number
}

export interface MarketData {
  prices: CityPrice[]
  source: string
  lastUpdated: string
}

export interface Commune {
  nom: string
  code: string
  codesPostaux: string[]
  departement: { nom: string; code: string }
}

export interface DvfEstimation {
  codePostal: string
  commune: string
  type: string
  medianPricePerM2: number
  minPricePerM2: number
  maxPricePerM2: number
  q1PricePerM2: number
  q3PricePerM2: number
  nbTransactions: number
  annee: number
  source: string
}

export const marketService = {
  async getCityPrices(): Promise<MarketData> {
    const res = await apiClient.get('/market/city-prices')
    return res.data.data as MarketData
  },

  async getCityPrice(slug: string): Promise<CityPrice | null> {
    try {
      const res = await apiClient.get(`/market/city-prices/${slug}`)
      return res.data.data as CityPrice
    } catch {
      return null
    }
  },

  async searchCommunes(q: string): Promise<Commune[]> {
    if (q.trim().length < 2) return []
    try {
      const res = await apiClient.get(`/market/communes?q=${encodeURIComponent(q)}`)
      return (res.data.data as Commune[]) ?? []
    } catch {
      return []
    }
  },

  async getEstimation(codePostal: string, type: string = ''): Promise<DvfEstimation | null> {
    try {
      const res = await apiClient.get(`/market/estimation?codePostal=${encodeURIComponent(codePostal)}&type=${encodeURIComponent(type)}`)
      return res.data.success ? (res.data.data as DvfEstimation) : null
    } catch {
      return null
    }
  },
}
