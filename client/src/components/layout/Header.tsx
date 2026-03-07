/**
 * Header / Topbar
 *
 * Mode public (non authentifié) :
 *   Logo · Nav · [Connexion] [Inscription] — barre pleine largeur
 *
 * Mode dashboard (authentifié OWNER/TENANT) :
 *   Topbar slim dans la colonne droite — hamburger mobile · espace · mode sombre · notifs · profil
 *   Le logo est dans la sidebar, pas besoin de le répéter ici.
 */
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, User, LogOut, Settings, LayoutDashboard, Menu,
  Sun, Moon, TrendingUp, Tag, Terminal,
  CreditCard, Bell, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../store/themeStore'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState } from 'react'

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobilePublicMenu, setShowMobilePublicMenu] = useState(false)
  const { isDark, toggleDark } = useThemeStore()
  const { toggle: toggleSidebar } = useSidebarStore()

  const hasSidebar = isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowUserMenu(false)
  }

  const getDashboardLink = () => {
    if (user?.role === 'SUPER_ADMIN') return '/super-admin'
    if (user?.role === 'OWNER') return '/dashboard/owner'
    if (user?.role === 'TENANT') return '/dashboard/tenant'
    if (user?.role === 'ADMIN') return '/admin'
    return '/'
  }

  const headerStyle = {
    background: hasSidebar
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    borderBottom: '1px solid var(--glass-border)',
    boxShadow: hasSidebar
      ? 'inset 0 -1px 0 rgba(255,255,255,0.08)'
      : 'inset 0 -1px 0 rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.05)',
  }

  // ── MODE DASHBOARD — Topbar slim (h-12) ───────────────────────────────────
  if (hasSidebar) {
    return (
      <header className="flex-shrink-0 z-40 sticky top-0 border-b" style={headerStyle}>
        <div className="flex items-center justify-between h-12 px-4">

          {/* Gauche — hamburger mobile uniquement */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Espace vide sur desktop (la sidebar a le logo) */}
          <div className="hidden md:block flex-1" />

          {/* Super Admin badge */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold mr-2"
              style={{ background: 'rgba(0,180,216,0.12)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.3)' }}>
              <Terminal className="w-3.5 h-3.5" /> Cerveau Central
            </Link>
          )}

          {/* Droite — actions */}
          <div className="flex items-center gap-1">

            {/* Mode sombre */}
            <button onClick={toggleDark}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label="Basculer le mode sombre">
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notifications */}
            <Link to="/notifications"
              className="relative p-2 rounded-xl transition-colors"
              style={{ color: 'var(--text-tertiary)' }}>
              <Bell className="w-[18px] h-[18px]" />
            </Link>

            {/* Profil dropdown */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl transition-colors ml-1"
                style={{
                  background: showUserMenu ? 'var(--surface-subtle)' : '',
                  border: '1px solid var(--glass-border)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
                onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = '' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-[13px] font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-2 z-20"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(24px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                      borderColor: 'var(--glass-border)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.70)',
                    }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                        {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                      </span>
                    </div>

                    {[
                      { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                      { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                      { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                        onClick={() => setShowUserMenu(false)}>
                        {icon} {label}
                      </Link>
                    ))}

                    <div className="border-t mt-2 pt-2" style={{ borderColor: 'var(--glass-border)' }}>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 w-full transition-colors"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // ── MODE PUBLIC — Header pleine largeur ───────────────────────────────────
  return (
    <header className="sticky top-0 z-50 flex-shrink-0 border-b" style={headerStyle}>
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' }}
            >
              <Home className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold hidden sm:block font-heading text-gradient-brand">
              ImmoParticuliers
            </span>
          </Link>

          {/* Navigation publique desktop */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-5">
              <Link to="/" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                Accueil
              </Link>
              <Link to="/search" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                Les biens
              </Link>
              <Link to="/calculateur" className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                <TrendingUp className="w-3.5 h-3.5" /> Calculateur
              </Link>
              <Link to="/pricing" className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                <Tag className="w-3.5 h-3.5" /> Tarifs
              </Link>
            </nav>
          )}

          {/* Super Admin badge */}
          {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(0,180,216,0.12)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.3)' }}>
              <Terminal className="w-3.5 h-3.5" /> Cerveau Central
            </Link>
          )}

          {/* Droite */}
          <div className="flex items-center gap-1.5">

            {/* Mode sombre */}
            <button onClick={toggleDark}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label="Basculer le mode sombre">
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/notifications"
                  className="relative p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <Bell className="w-[18px] h-[18px]" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-colors"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)' }}>
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                      {user?.firstName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-2 z-20"
                        style={{
                          background: 'rgba(255,255,255,0.14)',
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                          borderColor: 'var(--glass-border)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.70)',
                        }}>
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(124,58,237,0.10)', color: '#7c3aed' }}>
                            {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                          </span>
                        </div>

                        {[
                          { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                          { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                          { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to}
                            className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                            onClick={() => setShowUserMenu(false)}>
                            {icon} {label}
                          </Link>
                        ))}

                        <div className="border-t mt-2 pt-2" style={{ borderColor: 'var(--glass-border)' }}>
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 w-full transition-colors"
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                            <LogOut className="w-4 h-4" /> Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Mobile burger public */}
                <button onClick={() => setShowMobilePublicMenu(!showMobilePublicMenu)}
                  className="md:hidden p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  {showMobilePublicMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* CTA desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login" className="btn-neon-violet text-sm px-4 py-2">Connexion</Link>
                  <Link to="/register" className="btn btn-primary text-sm py-2 px-4">Inscription</Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu mobile public */}
        {!isAuthenticated && showMobilePublicMenu && (
          <div className="md:hidden border-t py-3 space-y-1" style={{ borderColor: 'var(--glass-border)' }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/search', label: 'Les biens' },
              { to: '/calculateur', label: 'Calculateur' },
              { to: '/pricing', label: 'Tarifs' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                onClick={() => setShowMobilePublicMenu(false)}>
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 px-4">
              <Link to="/login" className="btn-neon-violet w-full text-center justify-center" onClick={() => setShowMobilePublicMenu(false)}>Connexion</Link>
              <Link to="/register" className="btn btn-primary w-full text-center" onClick={() => setShowMobilePublicMenu(false)}>Inscription</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
