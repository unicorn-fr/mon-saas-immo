import { apiClient } from './api.service'

export interface KycStatus {
  status: 'PENDING' | 'DOCUMENT_VERIFIED' | 'BIOMETRIC_VERIFIED' | 'COMPLETED' | 'FAILED' | 'REJECTED' | null
  documentType?: string
  firstName?: string
  lastName?: string
  biometricVerifiedAt?: string
  verifiedAt?: string
  attempts?: number
  documentDeletedAt?: string
}

export const kycService = {
  async getStatus(): Promise<KycStatus> {
    const res = await apiClient.get('/kyc/status')
    return (res.data.data ?? { status: null }) as KycStatus
  },
}
