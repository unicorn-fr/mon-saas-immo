import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

/**
 * Custom hook to access auth state and actions
 */
export const useAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
    setTokens,
    clearAuth,
    loadUser,
    setLoading,
    setError,
  } = useAuthStore()

  // Load user on mount if token exists
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadUser()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    setUser,
    setTokens,
    clearAuth,
    loadUser,
    setLoading,
    setError,

    // Computed
    isOwner: user?.role === 'OWNER',
    isTenant: user?.role === 'TENANT',
    isAdmin: user?.role === 'ADMIN',
  }
}
