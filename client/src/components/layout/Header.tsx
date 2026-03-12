/**
 * Header / Topbar — Light Premium
 * Mode public: bg white, border, logo FOYER, nav links, auth buttons
 * Mode dashboard: slim topbar bg white, hamburger, notifs, profile
 */
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, LogOut, Settings, LayoutDashboard, Menu,
  TrendingUp, Tag, Terminal, CreditCard, Bell, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState } from 'react'

// ── Tokens ──────────────────────────────────────────────────────────────────
const H = {
  bg:        '#ffffff',
  border:    '#d2d2d7',
  text:      '#1d1d1f',
  secondary: '#515154',
  muted:     '#86868b',
  hover:     '#f5f5f7',
  shadow:    '0 1px 0 rgba(0,0,0,0.06)',
  accent:    '#007AFF',
}

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobilePublicMenu, setShowMobilePublicMenu] = useState(false)
  const { toggle: toggleSidebar } = useSidebarStore()

  const hasSidebar = isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')

  const threadColor = user?.role === 'OWNER' ? '#007AFF' : '#34C759'

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
    background: H.bg,
    borderBottom: `1px solid ${H.border}`,
    boxShadow: H.shadow,
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?'

  // ── DASHBOARD TOPBAR ──────────────────────────────────────────────────────
  if (hasSidebar) {
    return (
      <header className="flex-shrink-0 z-40 sticky top-0" style={headerStyle}>
        <div className="flex items-center justify-between h-14 px-4">

          {/* Hamburger mobile */}
          <button onClick={toggleSidebar}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ color: H.secondary }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
            aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block flex-1" />

          {/* Super Admin badge */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold mr-2"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3.5 h-3.5" /> Cerveau Central
            </Link>
          )}

          {/* Actions droite */}
          <div className="flex items-center gap-1">

            {/* Notifications */}
            <Link to="/notifications"
              className="p-2 rounded-xl transition-colors"
              style={{ color: H.muted }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover; (e.currentTarget as HTMLElement).style.color = H.secondary }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = H.muted }}>
              <Bell className="w-[18px] h-[18px]" />
            </Link>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all ml-1"
                style={{
                  border: `1px solid ${H.border}`,
                  background: showUserMenu ? H.hover : 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: threadColor }}>
                  {initials}
                </div>
                <span className="text-[13px] font-medium hidden sm:block" style={{ color: H.text }}>
                  {user?.firstName}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl py-2 z-20"
                    style={{
                      background: H.bg,
                      border: `1px solid ${H.border}`,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                    }}>
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${H.border}` }}>
                      <p className="text-sm font-semibold" style={{ color: H.text }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: H.secondary }}>{user?.email}</p>
                      <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${threadColor}14`, color: threadColor }}>
                        {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                      </span>
                    </div>

                    {[
                      { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                      { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                      { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors"
                        style={{ color: H.text }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                        onClick={() => setShowUserMenu(false)}>
                        <span style={{ color: H.muted }}>{icon}</span> {label}
                      </Link>
                    ))}

                    <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${H.border}` }}>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 w-full transition-colors"
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
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

  // ── PUBLIC HEADER ──────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-50 flex-shrink-0" style={headerStyle}>
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#007AFF' }}>
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-extrabold" style={{ color: H.text, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
              FOYER
            </span>
          </Link>

          {/* Navigation publique desktop */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/search', label: 'Les biens' },
                { to: '/calculateur', label: 'Calculateur', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { to: '/pricing', label: 'Tarifs', icon: <Tag className="w-3.5 h-3.5" /> },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to}
                  className="text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{ color: H.secondary }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#007AFF' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = H.secondary }}>
                  {icon}{label}
                </Link>
              ))}
            </nav>
          )}

          {/* Super Admin badge */}
          {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3.5 h-3.5" /> Cerveau Central
            </Link>
          )}

          {/* Droite */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/notifications"
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: H.muted }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <Bell className="w-[18px] h-[18px]" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all"
                    style={{
                      border: `1px solid ${H.border}`,
                      background: showUserMenu ? H.hover : 'transparent',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                    onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: threadColor }}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium hidden sm:block" style={{ color: H.text }}>
                      {user?.firstName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl py-2 z-20"
                        style={{
                          background: H.bg,
                          border: `1px solid ${H.border}`,
                          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
                        }}>
                        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${H.border}` }}>
                          <p className="text-sm font-semibold" style={{ color: H.text }}>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: H.secondary }}>{user?.email}</p>
                          <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${threadColor}14`, color: threadColor }}>
                            {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                          </span>
                        </div>
                        {[
                          { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                          { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                          { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors"
                            style={{ color: H.text }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                            onClick={() => setShowUserMenu(false)}>
                            <span style={{ color: H.muted }}>{icon}</span> {label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${H.border}` }}>
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 w-full transition-colors"
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
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
                {/* Mobile burger */}
                <button onClick={() => setShowMobilePublicMenu(!showMobilePublicMenu)}
                  className="md:hidden p-2 rounded-xl transition-colors"
                  style={{ color: H.secondary }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  {showMobilePublicMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* CTA desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-2 text-sm font-semibold rounded-xl transition-all"
                    style={{ color: H.text, border: `1px solid ${H.border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    Connexion
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all"
                    style={{ background: '#007AFF', boxShadow: '0 2px 8px rgba(0,122,255,0.28)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#0066d6' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#007AFF' }}>
                    Inscription
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu mobile public */}
        {!isAuthenticated && showMobilePublicMenu && (
          <div className="md:hidden py-3 space-y-1" style={{ borderTop: `1px solid ${H.border}` }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/search', label: 'Les biens' },
              { to: '/calculateur', label: 'Calculateur' },
              { to: '/pricing', label: 'Tarifs' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ color: H.text }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = H.hover }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                onClick={() => setShowMobilePublicMenu(false)}>
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 px-4">
              <Link to="/login"
                className="btn-secondary w-full text-center justify-center py-2 text-sm"
                onClick={() => setShowMobilePublicMenu(false)}>
                Connexion
              </Link>
              <Link to="/register"
                className="btn-primary w-full text-center py-2 text-sm"
                onClick={() => setShowMobilePublicMenu(false)}>
                Inscription
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
