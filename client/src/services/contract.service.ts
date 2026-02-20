import { apiClient as api } from './api.service'
import {
  Contract,
  CreateContractInput,
  UpdateContractInput,
  ContractFilters,
  ContractStatistics,
} from '../types/contract.types'

interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface ContractsResponse {
  contracts: Contract[]
  total: number
  page: number
  limit: number
}

export const contractService = {
  async createContract(data: CreateContractInput): Promise<Contract> {
    const response = await api.post('/contracts', data)
    return response.data.data.contract
  },

  async getContractById(id: string): Promise<Contract> {
    const response = await api.get(`/contracts/${id}`)
    return response.data.data.contract
  },

  async updateContract(id: string, data: UpdateContractInput): Promise<Contract> {
    const response = await api.put(`/contracts/${id}`, data)
    return response.data.data.contract
  },

  async deleteContract(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`)
  },

  async getContracts(
    filters?: ContractFilters,
    pagination?: PaginationParams
  ): Promise<ContractsResponse> {
    const params = { ...filters, ...pagination }
    const response = await api.get('/contracts', { params })
    return response.data.data
  },

  async sendContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/send`)
    return response.data.data.contract
  },

  async signContract(id: string, signature?: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/sign`, { signature })
    return response.data.data.contract
  },

  async activateContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/activate`)
    return response.data.data.contract
  },

  async terminateContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/terminate`)
    return response.data.data.contract
  },

  async cancelContract(id: string, reason?: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/cancel`, { reason })
    return response.data.data.contract
  },

  async getStatistics(): Promise<ContractStatistics> {
    const response = await api.get('/contracts/statistics')
    return response.data.data.statistics
  },
}
