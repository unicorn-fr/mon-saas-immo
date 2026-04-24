// Shared API types — pagination et réponses génériques

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore?: boolean
}
