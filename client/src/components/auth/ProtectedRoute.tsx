import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../types/auth.types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Redirects to verify-email if email not verified
 * Redirects to home if user doesn't have required role
 */
export const ProtectedRoute = ({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e4e1db', borderTopColor: '#1a1a2e', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Email non vérifié → rediriger vers la saisie du code
  if (user && !user.emailVerified) {
    return <Navigate to="/verify-email" state={{ email: user.email, from: location.pathname }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
