import { apiClient, handleApiError } from './api.service'

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export interface ConnectStatus {
  status: 'not_created' | 'pending' | 'active' | 'restricted'
  accountId: string | null
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements: string[]
}

export interface SepaMandate {
  isActive: boolean
  ibanLast4: string | null
  bankName: string | null
  holderName: string | null
  createdAt: string
  revokedAt: string | null
  stripePaymentMethodId: string | null
}

export interface WalletPayment {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
  totalAmountCents: number
  platformFeeCents: number | null
  netRevenueCents: number | null
  scheduledDate: string
  processedAt: string | null
  periodMonth: number
  periodYear: number
  failureReason: string | null
  tenant?: { firstName: string; lastName: string; email: string }
  contract: { id?: string; property: { title: string; address: string; city: string } }
}

export interface WalletSummary {
  totalReceivedCents: number
  totalCount: number
  pendingCount: number
  failedCount: number
}

class ConnectService {
  // ── Propriétaire ──────────────────────────────────────────────────────────

  async getOnboardingLink(): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<{ url: string }>>('/connect/onboard')
      return res.data.data.url
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getConnectStatus(): Promise<ConnectStatus> {
    try {
      const res = await apiClient.get<ApiResponse<ConnectStatus>>('/connect/status')
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getDashboardLink(): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<{ url: string }>>('/connect/dashboard-link')
      return res.data.data.url
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getWallet(): Promise<{ payments: WalletPayment[]; summary: WalletSummary }> {
    try {
      const res = await apiClient.get<ApiResponse<{ payments: WalletPayment[]; summary: WalletSummary }>>('/connect/wallet')
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async collectRent(rentPaymentId: string): Promise<void> {
    try {
      await apiClient.post('/connect/collect', { rentPaymentId })
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  // ── Locataire ─────────────────────────────────────────────────────────────

  async setupMandate(contractId: string): Promise<{ clientSecret: string; setupIntentId: string }> {
    try {
      const res = await apiClient.post<ApiResponse<{ clientSecret: string; setupIntentId: string }>>('/connect/mandate/setup', { contractId })
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getMandate(contractId: string): Promise<SepaMandate | null> {
    try {
      const res = await apiClient.get<ApiResponse<SepaMandate | null>>(`/connect/mandate/${contractId}`)
      return res.data.data
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async revokeMandate(contractId: string): Promise<void> {
    try {
      await apiClient.delete(`/connect/mandate/${contractId}`)
    } catch (e) { throw new Error(handleApiError(e)) }
  }

  async getTenantPayments(): Promise<WalletPayment[]> {
    try {
      const res = await apiClient.get<ApiResponse<{ payments: WalletPayment[] }>>('/connect/payments')
      return res.data.data.payments
    } catch (e) { throw new Error(handleApiError(e)) }
  }
}

export const connectService = new ConnectService()
