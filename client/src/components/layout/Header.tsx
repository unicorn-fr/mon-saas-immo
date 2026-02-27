import { Link, useNavigate } from 'react-router-dom'
import { Home, User, LogOut, Settings, LayoutDashboard, Menu, X, Heart, Calendar, MessageSquare, FileText, Sun, Moon, FolderOpen, TrendingUp, Tag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../store/themeStore'
import { useState } from 'react'

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { isDark, toggleDark } = useThemeStore()

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
    <header
      className="backdrop-blur-sm border-b shadow-sm sticky top-0 z-50"
      style={{ background: 'var(--surface-overlay)', borderBottomColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)' }}
            >
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold hidden sm:block font-heading" style={{ color: 'var(--text-primary)' }}>ImmoParticuliers</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Owner Links */}
                {user?.role === 'OWNER' && (
                  <>
                    <Link
                      to="/properties/owner/me"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      Mes biens
                    </Link>
                    <Link
                      to="/bookings/manage"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      Réservations
                    </Link>
                    <Link
                      to="/contracts"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <FileText className="w-4 h-4" />
                      Contrats
                    </Link>
                  </>
                )}

                {/* Tenant Links */}
                {user?.role === 'TENANT' && (
                  <>
                    <Link
                      to="/favorites"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <Heart className="w-4 h-4" />
                      Favoris
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <Calendar className="w-4 h-4" />
                      Mes visites
                    </Link>
                    <Link
                      to="/contracts"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <FileText className="w-4 h-4" />
                      Contrats
                    </Link>
                    <Link
                      to="/dossier"
                      className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Mon dossier
                    </Link>
                  </>
                )}

                {/* Common Links for all authenticated users */}
                <Link
                  to="/messages"
                  className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
                <Link
                  to="/calculateur"
                  className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  <TrendingUp className="w-4 h-4" />
                  Calculateur
                </Link>
                <Link
                  to="/pricing"
                  className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  <Tag className="w-4 h-4" />
                  Tarifs
                </Link>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDark}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400"
                  aria-label="Basculer le mode sombre"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center dark:bg-primary-900">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-modal border border-slate-200 py-2 z-20 dark:border-slate-700">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-slate-700 truncate dark:text-slate-400">{user?.email}</p>
                          <p className="text-xs text-primary-600 mt-1 capitalize dark:text-primary-400">
                            {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                          </p>
                        </div>

                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Tableau de bord
                        </Link>

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Mon profil
                        </Link>

                        <div className="border-t border-slate-100 mt-2 pt-2 dark:border-slate-700">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
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
                {/* Public nav — same as Home page */}
                <Link to="/" className="text-slate-600 hover:text-primary-600 font-medium transition-colors dark:text-slate-400 dark:hover:text-primary-400">
                  Accueil
                </Link>
                <Link to="/#how-it-works" className="text-slate-600 hover:text-primary-600 font-medium transition-colors dark:text-slate-400 dark:hover:text-primary-400">
                  Comment ça marche
                </Link>
                <Link to="/search" className="text-slate-600 hover:text-primary-600 font-medium transition-colors dark:text-slate-400 dark:hover:text-primary-400">
                  Les biens
                </Link>
                <Link to="/calculateur" className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400">
                  <TrendingUp className="w-4 h-4" /> Calculateur
                </Link>
                <Link to="/pricing" className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 dark:text-slate-400 dark:hover:text-primary-400">
                  <Tag className="w-4 h-4" /> Tarifs
                </Link>
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDark}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400"
                  aria-label="Basculer le mode sombre"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Link to="/login" className="btn btn-secondary">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Inscription
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: Dark toggle + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 dark:hover:bg-slate-800 dark:text-slate-400"
              aria-label="Basculer le mode sombre"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-1 dark:border-slate-800">
            {isAuthenticated ? (
              <>
                {user?.role === 'OWNER' && (
                  <>
                    <Link
                      to="/properties/owner/me"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Mes biens
                    </Link>
                    <Link
                      to="/bookings/manage"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Réservations
                    </Link>
                    <Link
                      to="/contracts"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Contrats
                    </Link>
                  </>
                )}

                {user?.role === 'TENANT' && (
                  <>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Favoris
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Mes visites
                    </Link>
                    <Link
                      to="/contracts"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Contrats
                    </Link>
                    <Link
                      to="/dossier"
                      className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Mon dossier
                    </Link>
                  </>
                )}

                <Link
                  to="/messages"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Messages
                </Link>

                <Link
                  to="/profile"
                  className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Mon profil
                </Link>

                <div className="pt-2 border-t border-slate-100 mt-2 dark:border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/" className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowMobileMenu(false)}>
                  Accueil
                </Link>
                <Link to="/#how-it-works" className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowMobileMenu(false)}>
                  Comment ça marche
                </Link>
                <Link to="/search" className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowMobileMenu(false)}>
                  Les biens
                </Link>
                <Link to="/calculateur" className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowMobileMenu(false)}>
                  Calculateur
                </Link>
                <Link to="/pricing" className="block px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setShowMobileMenu(false)}>
                  Tarifs
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/login" className="btn btn-secondary w-full text-center" onClick={() => setShowMobileMenu(false)}>
                    Connexion
                  </Link>
                  <Link to="/register" className="btn btn-primary w-full text-center" onClick={() => setShowMobileMenu(false)}>
                    Inscription
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
