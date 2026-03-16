/**
 * Header — Maison Design System
 * Mode public : transparent → sticky blanc après scroll, logo Cormorant, liens DM Sans
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  TrendingUp, Tag, Terminal, CreditCard, Bell, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState, useEffect } from 'react'

const NIGHT = '#1a1a2e'
const BORDER = '#e4e1db'
const INK = '#0d0c0a'
const INK_MID = '#5a5754'
const INK_FAINT = '#9e9b96'
const BG_MUTED = '#f4f2ee'

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobilePublicMenu, setShowMobilePublicMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { toggle: toggleSidebar } = useSidebarStore()

  const hasSidebar = isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')

  const ownerColor = '#1a3270'
  const tenantColor = '#1b5e3b'
  const threadColor = user?.role === 'OWNER' ? ownerColor : tenantColor

  useEffect(() => {
    if (hasSidebar) return
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasSidebar])

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

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?'

  // ── DASHBOARD TOPBAR ────────────────────────────────────────────────────────
  if (hasSidebar) {
    return (
      <header className="flex-shrink-0 z-40 sticky top-0"
        style={{ background: '#ffffff', borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between h-[52px] px-5">

          {/* Hamburger mobile */}
          <button onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: INK_FAINT }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
            aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block flex-1" />

          {/* Super Admin badge */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mr-3"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3 h-3" /> Cerveau Central
            </Link>
          )}

          {/* Actions droite */}
          <div className="flex items-center gap-1">
            <Link to="/notifications"
              className="p-2 rounded-lg transition-colors"
              style={{ color: INK_FAINT }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED; (e.currentTarget as HTMLElement).style.color = INK_MID }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = INK_FAINT }}>
              <Bell className="w-[17px] h-[17px]" />
            </Link>

            {/* Profile */}
            <div className="relative ml-1">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg transition-all"
                style={{
                  border: `1px solid ${BORDER}`,
                  background: showUserMenu ? BG_MUTED : 'transparent',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: threadColor }}>
                  {initials}
                </div>
                <span className="text-[13px] font-medium hidden sm:block" style={{ color: INK, fontFamily: 'var(--font-body)' }}>
                  {user?.firstName}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl py-2 z-20"
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${BORDER}`,
                      boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)',
                    }}>
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <p className="text-[13px] font-semibold" style={{ color: INK, fontFamily: 'var(--font-body)' }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: INK_MID }}>{user?.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${threadColor}18`, color: threadColor }}>
                        {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                      </span>
                    </div>

                    {[
                      { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                      { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                      { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors"
                        style={{ color: INK_MID, fontFamily: 'var(--font-body)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                        onClick={() => setShowUserMenu(false)}>
                        <span style={{ color: INK_FAINT }}>{icon}</span> {label}
                      </Link>
                    ))}

                    <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-[13px] w-full transition-colors"
                        style={{ color: '#9b1c1c', fontFamily: 'var(--font-body)' }}
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
  const publicHeaderStyle: React.CSSProperties = {
    background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
    borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    transition: 'background 0.25s ease, border-color 0.25s ease',
  }

  return (
    <header className="sticky top-0 z-50 flex-shrink-0" style={publicHeaderStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 600,
              fontStyle: 'italic',
              color: NIGHT,
              letterSpacing: '-0.01em',
            }}>
              ImmoParticuliers
            </span>
          </Link>

          {/* Navigation desktop */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-7">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/search', label: 'Annonces' },
                { to: '/calculateur', label: 'Calculateur', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { to: '/pricing', label: 'Tarifs', icon: <Tag className="w-3.5 h-3.5" /> },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to}
                  className="text-[13px] font-medium flex items-center gap-1.5 transition-colors group"
                  style={{ color: INK_MID, fontFamily: 'var(--font-body)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = NIGHT }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = INK_MID }}>
                  {icon}{label}
                </Link>
              ))}
            </nav>
          )}

          {/* Super Admin badge */}
          {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3 h-3" /> Cerveau Central
            </Link>
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/notifications"
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: INK_FAINT }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <Bell className="w-[18px] h-[18px]" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-all"
                    style={{ border: `1px solid ${BORDER}`, background: showUserMenu ? BG_MUTED : 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                    onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: threadColor }}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium hidden sm:block" style={{ color: INK, fontFamily: 'var(--font-body)' }}>
                      {user?.firstName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl py-2 z-20"
                        style={{ background: '#ffffff', border: `1px solid ${BORDER}`, boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)' }}>
                        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                          <p className="text-[13px] font-semibold" style={{ color: INK }}>{user?.firstName} {user?.lastName}</p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: INK_MID }}>{user?.email}</p>
                          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${threadColor}18`, color: threadColor }}>
                            {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                          </span>
                        </div>
                        {[
                          { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
                          { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Mon profil' },
                          { to: '/pricing', icon: <CreditCard className="w-4 h-4" />, label: 'Mon abonnement' },
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to}
                            className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors"
                            style={{ color: INK_MID }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                            onClick={() => setShowUserMenu(false)}>
                            <span style={{ color: INK_FAINT }}>{icon}</span> {label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-[13px] w-full transition-colors"
                            style={{ color: '#9b1c1c' }}
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
                  className="md:hidden p-2 rounded-lg transition-colors"
                  style={{ color: INK_MID }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  {showMobilePublicMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* CTA desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all"
                    style={{ color: NIGHT, border: `1px solid ${NIGHT}`, fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#edf0f8' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    Connexion
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 text-[13px] font-semibold rounded-lg text-white transition-all"
                    style={{ background: NIGHT, fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#2a2a4a' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = NIGHT }}>
                    S'inscrire
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu mobile public */}
        {!isAuthenticated && showMobilePublicMenu && (
          <div className="md:hidden py-3 space-y-0.5" style={{ borderTop: `1px solid ${BORDER}` }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/search', label: 'Annonces' },
              { to: '/calculateur', label: 'Calculateur' },
              { to: '/pricing', label: 'Tarifs' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="block px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                style={{ color: INK_MID, fontFamily: 'var(--font-body)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG_MUTED }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                onClick={() => setShowMobilePublicMenu(false)}>
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 px-2">
              <Link to="/login"
                className="text-center py-2.5 text-[13px] font-medium rounded-lg transition-all"
                style={{ color: NIGHT, border: `1px solid ${NIGHT}` }}
                onClick={() => setShowMobilePublicMenu(false)}>
                Connexion
              </Link>
              <Link to="/register"
                className="text-center py-2.5 text-[13px] font-semibold rounded-lg text-white"
                style={{ background: NIGHT }}
                onClick={() => setShowMobilePublicMenu(false)}>
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
