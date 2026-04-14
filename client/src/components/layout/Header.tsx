/**
 * Header — Maison Design System
 * Mode public : transparent → sticky blanc après scroll, logo Cormorant, liens DM Sans
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  Tag, Terminal, CreditCard, Bell, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState, useEffect } from 'react'
import { BailioLogo } from '../BailioLogo'
import { BAI } from '../../constants/bailio-tokens'

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
    const threshold = hasSidebar ? 8 : 20
    const onScroll = () => setScrolled(window.scrollY > threshold)
    // For dashboard, listen on the main scroll container
    const target = hasSidebar
      ? (document.getElementById('main-content') ?? window)
      : window
    target.addEventListener('scroll', onScroll, { passive: true })
    return () => target.removeEventListener('scroll', onScroll)
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

  // ── DASHBOARD TOPBAR — sticky avec verre au scroll ───────────────────────
  if (hasSidebar) {
    return (
      <header
        className="flex-shrink-0 z-40 flex items-center justify-end px-4 py-2.5 gap-2 glass-navbar"
        style={{
          position: 'sticky',
          top: 0,
          transition: 'background 0.25s ease, box-shadow 0.25s ease',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.20)' : 'none',
        }}>

        {/* Mobile hamburger */}
        <button onClick={toggleSidebar}
          className="md:hidden mr-auto flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.70)' }}
          aria-label="Menu">
          <Menu className="w-4 h-4" />
        </button>

        {/* Super Admin badge */}
        {user?.role === 'SUPER_ADMIN' && (
          <Link to="/super-admin"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: 'rgba(0,180,216,0.15)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.30)' }}>
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}

        {/* Pill : Bell + Profile */}
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}>

          <Link to="/notifications"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.90)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}>
            <Bell className="w-4 h-4" />
          </Link>

          <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.20)' }} />

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg transition-all"
              style={{ background: showUserMenu ? 'rgba(255,255,255,0.12)' : 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: threadColor }}>
                {initials}
              </div>
              <span className="text-[12px] font-medium hidden sm:block pr-0.5" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}>
                {user?.firstName}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl py-2 z-20"
                  style={{ background: 'rgba(20,16,48,0.90)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--font-body)' }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{user?.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${threadColor}30`, color: threadColor }}>
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
                      style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                      onClick={() => setShowUserMenu(false)}>
                      <span style={{ color: 'rgba(255,255,255,0.40)' }}>{icon}</span> {label}
                    </Link>
                  ))}
                  <div className="mt-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-[13px] w-full transition-colors"
                      style={{ color: '#f87171', fontFamily: 'var(--font-body)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    )
  }

  // ── PUBLIC HEADER ──────────────────────────────────────────────────────────
  const publicHeaderStyle: React.CSSProperties = {
    background: scrolled ? BAI.glassLight : 'transparent',
    backdropFilter: scrolled ? BAI.glassBlur : 'none',
    WebkitBackdropFilter: scrolled ? BAI.glassBlur : 'none',
    borderBottom: scrolled ? `1px solid ${BAI.glassBorder}` : '1px solid transparent',
    boxShadow: scrolled ? BAI.glassShadow : 'none',
    transition: 'background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease, box-shadow 0.25s ease',
  }

  return (
    <header className="sticky top-0 z-50 flex-shrink-0" style={publicHeaderStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0 flex items-center gap-2">
            <BailioLogo size={30} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: BAI.night,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              Bailio
            </span>
          </Link>

          {/* Navigation desktop */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-7">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/search', label: 'Annonces' },
                { to: '/pricing', label: 'Tarifs', icon: <Tag className="w-3.5 h-3.5" /> },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to}
                  className="text-[13px] font-medium flex items-center gap-1.5 transition-colors group"
                  style={{ color: BAI.inkMid, fontFamily: 'var(--font-body)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = BAI.night }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}>
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
                  style={{ color: BAI.inkFaint }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <Bell className="w-[18px] h-[18px]" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-all"
                    style={{ border: `1px solid ${BAI.border}`, background: showUserMenu ? BAI.bgMuted : 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                    onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: threadColor }}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium hidden sm:block" style={{ color: BAI.ink, fontFamily: 'var(--font-body)' }}>
                      {user?.firstName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl py-2 z-20"
                        style={{ background: '#ffffff', border: `1px solid ${BAI.border}`, boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)' }}>
                        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BAI.border}` }}>
                          <p className="text-[13px] font-semibold" style={{ color: BAI.ink }}>{user?.firstName} {user?.lastName}</p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: BAI.inkMid }}>{user?.email}</p>
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
                            style={{ color: BAI.inkMid }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                            onClick={() => setShowUserMenu(false)}>
                            <span style={{ color: BAI.inkFaint }}>{icon}</span> {label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${BAI.border}` }}>
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
                  style={{ color: BAI.inkMid }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  {showMobilePublicMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* CTA desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all"
                    style={{ color: BAI.night, border: `1px solid ${BAI.night}`, fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#edf0f8' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                    Connexion
                  </Link>
                  <Link to="/register"
                    className="px-4 py-2 text-[13px] font-semibold rounded-lg text-white transition-all"
                    style={{ background: BAI.night, fontFamily: 'var(--font-body)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.nightHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.night }}>
                    S'inscrire
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu mobile public */}
        {!isAuthenticated && showMobilePublicMenu && (
          <div className="md:hidden py-3 space-y-0.5" style={{ borderTop: `1px solid ${BAI.border}` }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/search', label: 'Annonces' },
              { to: '/pricing', label: 'Tarifs' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="block px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
                style={{ color: BAI.inkMid, fontFamily: 'var(--font-body)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                onClick={() => setShowMobilePublicMenu(false)}>
                {label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 px-2">
              <Link to="/login"
                className="text-center py-2.5 text-[13px] font-medium rounded-lg transition-all"
                style={{ color: BAI.night, border: `1px solid ${BAI.night}` }}
                onClick={() => setShowMobilePublicMenu(false)}>
                Connexion
              </Link>
              <Link to="/register"
                className="text-center py-2.5 text-[13px] font-semibold rounded-lg text-white"
                style={{ background: BAI.night }}
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
