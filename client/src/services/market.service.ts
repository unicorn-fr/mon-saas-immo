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
}
