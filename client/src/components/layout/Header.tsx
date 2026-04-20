/**
 * Header — Maison Design System
 * Mode public : transparent → sticky blanc après scroll, logo Cormorant, liens DM Sans
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  Tag, Terminal, CreditCard, Bell, X,
  MessageSquare, TrendingUp, User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState, useEffect } from 'react'
import { BailioLogo } from '../BailioLogo'
import { BAI } from '../../constants/bailio-tokens'
import { useMessages } from '../../hooks/useMessages'

// Titre de page selon le pathname
function usePageTitle(_role: string | undefined) {
  const location = useLocation()
  const p = location.pathname
  const map: Record<string, string> = {
    '/dashboard/owner':    'Tableau de bord',
    '/dashboard/tenant':   'Tableau de bord',
    '/properties/owner/me': 'Mes biens',
    '/properties/new':     'Nouveau bien',
    '/bookings/manage':    'Visites',
    '/applications/manage': 'Candidatures',
    '/contracts':          'Contrats',
    '/messages':           'Messages',
    '/notifications':      'Notifications',
    '/profile':            'Mon profil',
    '/owner/settings':     'Paramètres',
    '/tenant/settings':    'Paramètres',
    '/owner/rentabilite':  'Rentabilité',
    '/dossier':            'Mon dossier',
    '/dossier/partages':   'Contrôle d\'accès',
    '/my-applications':    'Mes candidatures',
    '/my-bookings':        'Mes visites',
    '/favorites':          'Mes favoris',
    '/privacy':            'Mes données',
  }
  return map[p] ?? ''
}

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobilePublicMenu, setShowMobilePublicMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { toggle: toggleSidebar } = useSidebarStore()
  const { unreadCount } = useMessages()
  const pageTitle = usePageTitle(user?.role)

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

  // ── DASHBOARD TOPBAR — sticky, enrichi ───────────────────────────────────
  if (hasSidebar) {
    const settingsLink = user?.role === 'OWNER' ? '/owner/settings' : '/tenant/settings'
    const ownerLinks = [
      { to: getDashboardLink(),     icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
      { to: '/profile',             icon: <User className="w-4 h-4" />,            label: 'Mon profil' },
      { to: settingsLink,           icon: <Settings className="w-4 h-4" />,        label: 'Paramètres' },
      ...(user?.role === 'OWNER'
        ? [{ to: '/owner/rentabilite', icon: <TrendingUp className="w-4 h-4" />, label: 'Rentabilité' }]
        : []),
      { to: '/pricing',             icon: <CreditCard className="w-4 h-4" />,     label: 'Mon abonnement' },
    ]

    return (
      <header
        className="flex-shrink-0 z-40 flex items-center justify-between px-4 sm:px-6"
        style={{
          position: 'sticky',
          top: 0,
          height: 56,
          transition: 'background 0.25s ease, box-shadow 0.25s ease',
          background: scrolled ? 'rgba(250,250,248,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(8px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BAI.border}` : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 0 rgba(13,12,10,0.06)' : 'none',
        }}>

        {/* Gauche — hamburger mobile + titre de page */}
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ background: '#ffffff', border: `1px solid ${BAI.border}`, color: BAI.inkFaint }}
            aria-label="Menu">
            <Menu className="w-4 h-4" />
          </button>
          {pageTitle && (
            <p className="hidden sm:block text-[13px] font-semibold" style={{ color: BAI.ink, fontFamily: 'var(--font-body)' }}>
              {pageTitle}
            </p>
          )}
        </div>

        {/* Droite — actions + profil */}
        <div className="flex items-center gap-1.5">

          {/* Super Admin badge */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Messages avec badge */}
          <Link to="/messages"
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: BAI.inkFaint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted; (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = BAI.inkFaint }}
            title="Messages">
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
                style={{ background: BAI.caramel }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link to="/notifications"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: BAI.inkFaint }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted; (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = BAI.inkFaint }}
            title="Notifications">
            <Bell className="w-4 h-4" />
          </Link>

          {/* Séparateur */}
          <div className="w-px h-5 mx-1" style={{ background: BAI.border }} />

          {/* Profil dropdown */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all"
              style={{
                background: showUserMenu ? BAI.bgMuted : '#ffffff',
                border: `1px solid ${BAI.border}`,
                boxShadow: '0 1px 2px rgba(13,12,10,0.05)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
              onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = '#ffffff' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: threadColor }}>
                  {initials}
                </div>
              )}
              <span className="text-[12px] font-medium hidden sm:block" style={{ color: BAI.ink, fontFamily: 'var(--font-body)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-60 rounded-2xl py-1.5 z-20 overflow-hidden"
                  style={{ background: '#ffffff', border: `1px solid ${BAI.border}`, boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)' }}>

                  {/* Profil header */}
                  <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${BAI.border}` }}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                        style={{ background: threadColor }}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: BAI.ink, fontFamily: 'var(--font-body)' }}>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: BAI.inkFaint }}>{user?.email}</p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="px-4 pt-2 pb-1">
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${threadColor}18`, color: threadColor }}>
                      {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    {ownerLinks.map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors"
                        style={{ color: BAI.inkMid, fontFamily: 'var(--font-body)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted; (e.currentTarget as HTMLElement).style.color = BAI.ink }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}
                        onClick={() => setShowUserMenu(false)}>
                        <span style={{ color: BAI.inkFaint }}>{icon}</span>
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="pt-1" style={{ borderTop: `1px solid ${BAI.border}` }}>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] w-full transition-colors"
                      style={{ color: '#9b1c1c', fontFamily: 'var(--font-body)', background: 'none', border: 'none', cursor: 'pointer' }}
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
