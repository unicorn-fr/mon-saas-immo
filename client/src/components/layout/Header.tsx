/**
 * Header — Maison Design System
 * Mode public : transparent → sticky blanc après scroll, logo Cormorant, liens DM Sans
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  Terminal, CreditCard, Bell, X,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState } from 'react'
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
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobilePublicMenu, setShowMobilePublicMenu] = useState(false)
  const { toggle: toggleSidebar } = useSidebarStore()
  const { unreadCount } = useMessages()
  usePageTitle(user?.role)

  const hasSidebar = isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')

  const ownerColor = '#1a3270'
  const tenantColor = '#1b5e3b'
  const threadColor = user?.role === 'OWNER' ? ownerColor : tenantColor


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
      { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
      { to: settingsLink,       icon: <Settings className="w-4 h-4" />,        label: 'Paramètres & profil' },
      { to: '/pricing',         icon: <CreditCard className="w-4 h-4" />,     label: 'Mon abonnement' },
    ]

    return (
      <header
        className="z-40 pointer-events-none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 0 }}>

        {/* Hamburger mobile — flottant à gauche */}
        <button onClick={toggleSidebar}
          className="md:hidden flex items-center justify-center rounded-xl transition-colors"
          style={{
            position: 'absolute', top: 8, left: 12,
            minWidth: 44, minHeight: 44,
            background: '#ffffff', border: `1px solid ${BAI.border}`,
            color: BAI.inkFaint, pointerEvents: 'auto',
            boxShadow: '0 2px 8px rgba(13,12,10,0.08)',
          }}
          aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>

        {/* Bulle flottante — droite */}
        <div
          className="flex items-center gap-1"
          style={{
            position: 'absolute',
            top: 8,
            right: 'clamp(12px, 3vw, 16px)',
            background: '#ffffff',
            border: `1px solid ${BAI.border}`,
            borderRadius: 16,
            padding: '4px 6px',
            boxShadow: '0 2px 12px rgba(13,12,10,0.08), 0 1px 3px rgba(13,12,10,0.05)',
            pointerEvents: 'auto',
          }}>

          {/* Super Admin badge */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Messages avec badge — masqués sur mobile */}
          <Link to="/messages"
            className="relative hidden sm:flex items-center justify-center rounded-lg transition-colors"
            style={{ color: BAI.inkFaint, minWidth: 36, minHeight: 36 }}
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

          {/* Notifications — masquées sur mobile */}
          <Link to="/notifications"
            className="hidden sm:flex items-center justify-center rounded-lg transition-colors"
            style={{ color: BAI.inkFaint, minWidth: 36, minHeight: 36 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted; (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = BAI.inkFaint }}
            title="Notifications">
            <Bell className="w-4 h-4" />
          </Link>

          {/* Séparateur — masqué sur mobile */}
          <div className="hidden sm:block w-px h-5 mx-0.5" style={{ background: BAI.border }} />

          {/* Profil dropdown */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl transition-all"
              style={{
                minHeight: 44,
                background: showUserMenu ? BAI.bgMuted : 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
              onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
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
                <div className="absolute right-0 mt-2 rounded-2xl py-1.5 z-20 overflow-hidden"
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${BAI.border}`,
                    boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)',
                    width: 'min(240px, calc(100vw - 32px))',
                  }}>

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
                        className="flex items-center gap-3 px-4 transition-colors"
                        style={{ color: BAI.inkMid, fontFamily: 'var(--font-body)', fontSize: 14, minHeight: 44, display: 'flex', alignItems: 'center' }}
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
                      className="flex items-center gap-3 px-4 w-full transition-colors"
                      style={{ color: '#9b1c1c', fontFamily: 'var(--font-body)', fontSize: 14, minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}
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
  return (
    <>
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: '#ffffff',
      borderBottom: `1px solid ${BAI.border}`,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'relative' }}>

          {/* Logo */}
          <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0 flex items-center gap-2">
            <BailioLogo size={30} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px,4vw,26px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#1a3270',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}>
              Bailio<span style={{ color: BAI.caramel }}>.</span>
            </span>
          </Link>

          {/* Navigation desktop — centrée en absolu */}
          {!isAuthenticated && (
            <nav style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0,
              transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 28,
            }} className="hidden md:flex">
              {[
                { to: '/', label: 'Accueil', exact: true },
                { to: '/search', label: 'Chercher', exact: false },
                { to: '/proprietaires', label: 'Propriétaires', exact: false },
                { to: '/locataires', label: 'Locataires', exact: false },
                { to: '/pricing', label: 'Tarifs', exact: false },
                { to: '/a-propos', label: 'À propos', exact: false },
              ].map(({ to, label, exact }) => {
                const loc = location.pathname
                const isActive = exact ? loc === to : loc === to || loc.startsWith(to + '/')
                return (
                  <Link key={to} to={to}
                    style={{
                      color: isActive ? BAI.ink : BAI.inkMid,
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = BAI.ink }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}>
                    {label}
                    {isActive && (
                      <span style={{
                        position: 'absolute', left: 0, right: 0, bottom: 0,
                        height: 2, background: BAI.caramel, borderRadius: '1px 1px 0 0',
                      }} />
                    )}
                  </Link>
                )
              })}
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

          {/* Right — desktop : Se connecter + S'inscrire */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/notifications"
                  className="flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: BAI.inkFaint, minWidth: 44, minHeight: 44 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <Bell className="w-[18px] h-[18px]" />
                </Link>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 rounded-lg transition-all"
                    style={{ minHeight: 44, border: `1px solid ${BAI.border}`, background: showUserMenu ? BAI.bgMuted : 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                    onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: threadColor }}>
                      {initials}
                    </div>
                    <span className="text-sm font-medium" style={{ color: BAI.ink, fontFamily: 'var(--font-body)' }}>
                      {user?.firstName}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-2 rounded-xl py-2 z-20"
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${BAI.border}`,
                          boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)',
                          width: 224,
                        }}>
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
                            className="flex items-center gap-3 px-4 transition-colors"
                            style={{ color: BAI.inkMid, fontSize: 14, minHeight: 44, display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                            onClick={() => setShowUserMenu(false)}>
                            <span style={{ color: BAI.inkFaint }}>{icon}</span> {label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: `1px solid ${BAI.border}` }}>
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 w-full transition-colors"
                            style={{ color: '#9b1c1c', fontSize: 14, minHeight: 44, background: 'none', border: 'none', cursor: 'pointer' }}
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
                <Link to="/login"
                  style={{
                    padding: '9px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                    color: BAI.inkMid, fontFamily: 'var(--font-body)', textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = BAI.ink }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = BAI.inkMid }}>
                  Se connecter
                </Link>
                <Link to="/register"
                  style={{
                    padding: '9px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                    background: BAI.night, color: '#fff', fontFamily: 'var(--font-body)', textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.nightHover }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.night }}>
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Right — mobile uniquement (non authentifié) */}
          {!isAuthenticated && (
            <div className="flex md:hidden items-center gap-2">
              {/* S'inscrire toujours visible */}
              <Link to="/register"
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: BAI.night, color: '#fff', textDecoration: 'none',
                  fontFamily: 'var(--font-body)',
                }}>
                S'inscrire
              </Link>
              {/* Burger avec label "Menu" */}
              <button
                onClick={() => setShowMobilePublicMenu(!showMobilePublicMenu)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2, padding: '6px 10px', borderRadius: 8,
                  border: `1px solid ${BAI.border}`, background: showMobilePublicMenu ? BAI.bgMuted : 'transparent',
                  cursor: 'pointer', minHeight: 44,
                }}
                aria-label="Navigation">
                {showMobilePublicMenu
                  ? <X size={18} color={BAI.ink} />
                  : <Menu size={18} color={BAI.ink} />}
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: BAI.inkMid, lineHeight: 1 }}>
                  {showMobilePublicMenu ? 'FERMER' : 'MENU'}
                </span>
              </button>
            </div>
          )}

          {/* Right — mobile authentifié */}
          {isAuthenticated && (
            <div className="flex md:hidden items-center">
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8,
                    border: `1px solid ${BAI.border}`, background: 'transparent', cursor: 'pointer',
                    minHeight: 44,
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: threadColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {initials}
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 rounded-xl py-2 z-20"
                      style={{
                        background: '#ffffff', border: `1px solid ${BAI.border}`,
                        boxShadow: '0 20px 60px rgba(13,12,10,0.12)',
                        width: 'min(224px, calc(100vw - 32px))',
                      }}>
                      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BAI.border}` }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                        <p style={{ fontSize: 11, color: BAI.inkMid, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                      {[
                        { to: getDashboardLink(), label: 'Tableau de bord' },
                        { to: '/profile', label: 'Mon profil' },
                        { to: '/pricing', label: 'Mon abonnement' },
                      ].map(({ to, label }) => (
                        <Link key={to} to={to}
                          style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 14, minHeight: 44, color: BAI.inkMid, textDecoration: 'none' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                          onClick={() => setShowUserMenu(false)}>
                          {label}
                        </Link>
                      ))}
                      <div style={{ borderTop: `1px solid ${BAI.border}`, marginTop: 4, paddingTop: 4 }}>
                        <button onClick={handleLogout}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', width: '100%', fontSize: 14, minHeight: 44, color: '#9b1c1c', background: 'none', border: 'none', cursor: 'pointer' }}
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
          )}
        </div>
      </div>
    </header>

    {/* ── Menu mobile public — overlay fixe sous le header ─────────────────── */}
    {!isAuthenticated && showMobilePublicMenu && (
      <div
        className="md:hidden"
        style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 49,
          background: '#ffffff',
          borderBottom: `1px solid ${BAI.border}`,
          boxShadow: '0 12px 32px rgba(13,12,10,0.12)',
        }}>
        <div style={{ padding: '6px 12px 14px' }}>
          {/* Navigation links */}
          {[
            { to: '/', label: 'Accueil', sub: 'Page principale' },
            { to: '/search', label: 'Chercher un logement', sub: 'Toutes les annonces' },
            { to: '/proprietaires', label: 'Propriétaires', sub: 'Publier et gérer son bien' },
            { to: '/locataires', label: 'Locataires', sub: 'Dossier et candidatures' },
            { to: '/pricing', label: 'Tarifs', sub: 'Plans et abonnements' },
            { to: '/a-propos', label: 'À propos', sub: 'Notre mission' },
          ].map(({ to, label, sub }) => {
            const isActive = location.pathname === to
            return (
              <Link key={to} to={to}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 12px', borderRadius: 10, textDecoration: 'none',
                  background: isActive ? BAI.bgMuted : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                onClick={() => setShowMobilePublicMenu(false)}>
                <span>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 500, color: isActive ? BAI.ink : BAI.inkMid, fontFamily: 'var(--font-body)' }}>{label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: BAI.inkFaint, marginTop: 1 }}>{sub}</span>
                </span>
                {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: BAI.caramel, flexShrink: 0 }} />}
              </Link>
            )
          })}

          {/* Se connecter */}
          <div style={{ marginTop: 8, paddingTop: 10, borderTop: `1px solid ${BAI.border}` }}>
            <Link to="/login"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 0', borderRadius: 8, textDecoration: 'none',
                fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
                color: BAI.inkMid, border: `1px solid ${BAI.border}`,
              }}
              onClick={() => setShowMobilePublicMenu(false)}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    )}

    {/* Overlay sombre cliquable pour fermer */}
    {!isAuthenticated && showMobilePublicMenu && (
      <div
        className="md:hidden"
        style={{ position: 'fixed', inset: 0, top: 64, zIndex: 48, background: 'rgba(13,12,10,0.3)' }}
        onClick={() => setShowMobilePublicMenu(false)}
      />
    )}

    {/* Spacer — hauteur fixe header */}
    <div aria-hidden style={{ height: 64, flexShrink: 0 }} />
    </>
  )
}
