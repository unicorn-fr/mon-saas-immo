export type UserRole = 'TENANT' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar: string | null
  phone: string | null
  bio: string | null
  emailVerified: boolean
  phoneVerified: boolean
  // Identity document fields (extracted by AI scanner)
  birthDate: string | null
  birthCity: string | null
  nationality: string | null
  nationalNumber: string | null
  documentNumber: string | null
  documentExpiry: string | null
  // Flexible AI-extracted metadata from ALL scanned documents
  profileMeta: Record<string, Record<string, unknown>> | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  isNewUser?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  'cf-turnstile-response'?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
