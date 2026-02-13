import { Link, useNavigate } from 'react-router-dom'
import { Home, User, LogOut, Settings, LayoutDashboard, Menu, X, Heart, Calendar, MessageSquare, Building2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowUserMenu(false)
  }

  const getDashboardLink = () => {
    if (user?.role === 'OWNER') return '/dashboard/owner'
    if (user?.role === 'TENANT') return '/dashboard/tenant'
    if (user?.role === 'ADMIN') return '/admin'
    return '/'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ImmoParticuliers</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/search"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Rechercher
            </Link>

            {isAuthenticated ? (
              <>
                {/* Owner Links */}
                {user?.role === 'OWNER' && (
                  <>
                    <Link
                      to="/dashboard/owner"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/properties/owner/me"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Mes biens
                    </Link>
                    <Link
                      to="/bookings/manage"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Réservations
                    </Link>
                  </>
                )}

                {/* Tenant Links */}
                {user?.role === 'TENANT' && (
                  <>
                    <Link
                      to="/dashboard/tenant"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/favorites"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
                    >
                      <Heart className="w-4 h-4" />
                      Favoris
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Mes visites
                    </Link>
                  </>
                )}

                {/* Common Links for all authenticated users */}
                <Link
                  to="/messages"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          <p className="text-xs text-primary-600 mt-1 capitalize">
                            {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                          </p>
                        </div>

                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Tableau de bord
                        </Link>

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Mon profil
                        </Link>

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Inscription
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link
              to="/search"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setShowMobileMenu(false)}
            >
              Rechercher
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Tableau de bord
                </Link>

                {user?.role === 'OWNER' && (
                  <>
                    <Link
                      to="/properties/owner/me"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Mes biens
                    </Link>
                    <Link
                      to="/bookings/manage"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Réservations
                    </Link>
                  </>
                )}

                {user?.role === 'TENANT' && (
                  <>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Favoris
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Mes visites
                    </Link>
                  </>
                )}

                <Link
                  to="/messages"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Messages
                </Link>

                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Mon profil
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
