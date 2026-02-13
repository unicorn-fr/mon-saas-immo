import api from './api'
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
  /**
   * Create a new contract
   */
  async createContract(data: CreateContractInput): Promise<Contract> {
    const response = await api.post('/contracts', data)
    return response.data.data.contract
  },

  /**
   * Get contract by ID
   */
  async getContractById(id: string): Promise<Contract> {
    const response = await api.get(`/contracts/${id}`)
    return response.data.data.contract
  },

  /**
   * Update contract
   */
  async updateContract(id: string, data: UpdateContractInput): Promise<Contract> {
    const response = await api.put(`/contracts/${id}`, data)
    return response.data.data.contract
  },

  /**
   * Delete contract
   */
  async deleteContract(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`)
  },

  /**
   * Get contracts with filters and pagination
   */
  async getContracts(
    filters?: ContractFilters,
    pagination?: PaginationParams
  ): Promise<ContractsResponse> {
    const params = {
      ...filters,
      ...pagination,
    }
    const response = await api.get('/contracts', { params })
    return response.data.data
  },

  /**
   * Sign contract
   */
  async signContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/sign`)
    return response.data.data.contract
  },

  /**
   * Activate contract
   */
  async activateContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/activate`)
    return response.data.data.contract
  },

  /**
   * Terminate contract
   */
  async terminateContract(id: string): Promise<Contract> {
    const response = await api.put(`/contracts/${id}/terminate`)
    return response.data.data.contract
  },

  /**
   * Get contract statistics
   */
  async getStatistics(): Promise<ContractStatistics> {
    const response = await api.get('/contracts/statistics')
    return response.data.data.statistics
  },
}
