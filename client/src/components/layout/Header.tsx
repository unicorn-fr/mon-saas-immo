/**
 * Header — Maison Design System
 * Mode public : transparent → sticky blanc après scroll, logo Cormorant, liens DM Sans
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  Terminal, CreditCard, Bell, X, ArrowRight,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState } from 'react'
import { BailioLogo } from '../BailioLogo'
import { BAI } from '../../constants/bailio-tokens'
import { useMessages } from '../../hooks/useMessages'
import { useHeaderStore } from '../../store/headerStore'

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

  const isHomePage = location.pathname === '/'
  // isDark vient du store — mis à jour par useDarkSection dans chaque page hero sombre
  const isDark = useHeaderStore((s) => s.isDark)

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

  // ── DASHBOARD HEADER ─────────────────────────────────────────────────────
  if (hasSidebar) {
    const settingsLink = user?.role === 'OWNER' ? '/owner/settings' : '/tenant/settings'
    const ownerLinks = [
      { to: getDashboardLink(), icon: <LayoutDashboard className="w-4 h-4" />, label: 'Tableau de bord' },
      { to: settingsLink,       icon: <Settings className="w-4 h-4" />,        label: 'Paramètres & profil' },
      { to: '/pricing',         icon: <CreditCard className="w-4 h-4" />,     label: 'Mon abonnement' },
    ]

    const ProfileDropdown = () => showUserMenu ? (
      <>
        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
        <div className="absolute right-0 mt-2 py-1.5 z-20 overflow-hidden"
          style={{
            background: '#ffffff',
            border: `1px solid ${BAI.border}`,
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)',
            width: 'min(240px, calc(100vw - 32px))',
          }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${BAI.border}` }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: threadColor }}>{initials}</div>
            }
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: BAI.ink, fontFamily: 'var(--font-body)' }}>{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] truncate" style={{ color: BAI.inkFaint }}>{user?.email}</p>
            </div>
          </div>
          <div className="px-4 pt-2 pb-1">
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${threadColor}18`, color: threadColor }}>
              {user?.role === 'OWNER' ? 'Propriétaire' : user?.role === 'TENANT' ? 'Locataire' : user?.role}
            </span>
          </div>
          <div className="py-1">
            {ownerLinks.map(({ to, icon, label }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-4 transition-colors"
                style={{ color: BAI.inkMid, fontFamily: 'var(--font-body)', fontSize: 14, minHeight: 44, display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted; (e.currentTarget as HTMLElement).style.color = BAI.ink }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = BAI.inkMid }}
                onClick={() => setShowUserMenu(false)}>
                <span style={{ color: BAI.inkFaint }}>{icon}</span>{label}
              </Link>
            ))}
          </div>
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
    ) : null

    return (
      <>
        {/* ── Mobile topbar — en flux, prend sa place naturellement ── */}
        <header
          className="md:hidden flex-shrink-0"
          style={{
            background: BAI.bgSurface,
            borderBottom: `1px solid ${BAI.border}`,
            boxShadow: '0 1px 4px rgba(13,12,10,0.06)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}>
          <div style={{
            height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 12px',
          }}>
            {/* Hamburger */}
            <button onClick={toggleSidebar} aria-label="Menu"
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, cursor: 'pointer', flexShrink: 0 }}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo centré */}
            <Link to={getDashboardLink()} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <BailioLogo size={18} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, whiteSpace: 'nowrap' }}>
                Bailio<span style={{ color: BAI.caramel }}>.</span>
              </span>
            </Link>

            {/* Actions droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* Messages */}
              <Link to="/messages"
                style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `1px solid ${BAI.border}`, color: BAI.inkFaint, textDecoration: 'none' }}>
                <MessageSquare className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: BAI.caramel }} />
                )}
              </Link>
              {/* Avatar / profil */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', overflow: 'hidden', padding: 0 }}>
                  {user?.avatar
                    ? <img src={user.avatar} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                    : <div style={{ width: 40, height: 40, background: threadColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{initials}</div>
                  }
                </button>
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* ── Desktop/Tablet — bulle flottante (inchangée) ── */}
        <header
          className="hidden md:block z-40 pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 0 }}>

          {/* Bulle flottante droite */}
          <div className="flex items-center gap-1"
            style={{
              position: 'absolute', top: 8, right: 'clamp(12px, 3vw, 16px)',
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 20,
              border: `1px solid ${BAI.border}`,
              padding: '4px 6px',
              boxShadow: BAI.shadowMd,
              pointerEvents: 'auto',
            }}>
            {user?.role === 'SUPER_ADMIN' && (
              <Link to="/super-admin"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
                style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
                <Terminal className="w-3 h-3" /> Admin
              </Link>
            )}
            <Link to="/messages" className="relative flex items-center justify-center rounded-lg transition-colors"
              style={{ color: BAI.inkFaint, minWidth: 36, minHeight: 36 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
              title="Messages">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
                  style={{ background: BAI.caramel }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </Link>
            <Link to="/notifications" className="flex items-center justify-center rounded-lg transition-colors"
              style={{ color: BAI.inkFaint, minWidth: 36, minHeight: 36 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
              title="Notifications">
              <Bell className="w-4 h-4" />
            </Link>
            <div className="w-px h-5 mx-0.5" style={{ background: BAI.border }} />
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl"
                style={{ minHeight: 44, background: showUserMenu ? BAI.bgMuted : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: threadColor }}>{initials}</div>
                }
                <span className="text-[12px] font-medium" style={{ color: BAI.ink, fontFamily: 'var(--font-body)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.firstName}
                </span>
              </button>
              <ProfileDropdown />
            </div>
          </div>
        </header>
      </>
    )
  }

  // ── PUBLIC HEADER ──────────────────────────────────────────────────────────
  const NAV_LINKS = [
    { to: '/', label: 'Accueil', exact: true },
    { to: '/search', label: 'Chercher', exact: false },
    { to: '/proprietaires', label: 'Propriétaires', exact: false },
    { to: '/locataires', label: 'Locataires', exact: false },
    { to: '/pricing', label: 'Tarifs', exact: false },
    { to: '/a-propos', label: 'À propos', exact: false },
  ]

  const closeMobileMenu = () => setShowMobilePublicMenu(false)

  return (
    <>
    {/* ── Barre de navigation ── */}
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      paddingTop: 'env(safe-area-inset-top, 0px)',
      height: 'calc(64px + env(safe-area-inset-top, 0px))',
      display: 'flex', alignItems: 'flex-end',
      background: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: !isDark
        ? '1px solid rgba(13,12,10,0.06)'
        : '1px solid rgba(255,255,255,0.10)',
      borderRadius: '0 0 16px 16px',
      transition: 'border-color 0.3s ease',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 0', width: '100%', boxSizing: 'border-box', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', minWidth: 0 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0, minWidth: 0 }}>
            <BailioLogo size={22} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
              fontStyle: 'italic',
              color: !isDark ? BAI.ink : '#fff',
              letterSpacing: '-0.01em', lineHeight: 1,
              whiteSpace: 'nowrap',
              transition: 'color 0.3s ease',
            }}>
              Bailio<span style={{ color: BAI.caramel }}>.</span>
            </span>
          </Link>

          {/* Nav desktop centrée — display géré uniquement par Tailwind (hidden md:flex) */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1"
              style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              {NAV_LINKS.map(({ to, label, exact }) => {
                const isActive = exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <Link key={to} to={to}
                    style={{
                      color: !isDark
                        ? (isActive ? BAI.ink : BAI.inkMid)
                        : (isActive ? '#fff' : 'rgba(255,255,255,0.65)'),
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                      background: isActive
                        ? (!isDark ? BAI.bgMuted : 'rgba(255,255,255,0.10)')
                        : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'color 0.3s, background 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      if (!isActive) {
                        el.style.color = !isDark ? BAI.ink : '#fff'
                        el.style.background = !isDark ? BAI.bgMuted : 'rgba(255,255,255,0.10)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      if (!isActive) {
                        el.style.color = !isDark ? BAI.inkMid : 'rgba(255,255,255,0.65)'
                        el.style.background = 'transparent'
                      }
                    }}>
                    {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: BAI.caramel, flexShrink: 0 }} />}
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Super Admin badge desktop */}
          {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
            <Link to="/super-admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
              <Terminal className="w-3 h-3" /> Cerveau Central
            </Link>
          )}

          {/* ── Droite desktop ── */}
          <div className="hidden md:flex items-center gap-2" style={{ flexShrink: 0 }}>
            {isAuthenticated ? (
              <>
                <Link to="/notifications"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: BAI.inkFaint, width: 36, height: 36 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                  <Bell size={17} />
                </Link>
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 6px',
                      borderRadius: 8, border: `1px solid ${BAI.border}`,
                      background: showUserMenu ? BAI.bgMuted : 'transparent', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                    onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: threadColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{initials}</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: BAI.ink, fontFamily: 'var(--font-body)' }}>{user?.firstName}</span>
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: `1px solid ${BAI.border}`, borderRadius: 12, boxShadow: '0 16px 48px rgba(13,12,10,0.12)', width: 220, zIndex: 20, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BAI.border}` }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                          <p style={{ fontSize: 11, color: BAI.inkMid, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                        </div>
                        {[
                          { to: getDashboardLink(), icon: <LayoutDashboard size={15} />, label: 'Tableau de bord' },
                          { to: '/profile', icon: <Settings size={15} />, label: 'Mon profil' },
                          { to: '/pricing', icon: <CreditCard size={15} />, label: 'Mon abonnement' },
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to} onClick={() => setShowUserMenu(false)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontSize: 13.5, minHeight: 42, color: BAI.inkMid, textDecoration: 'none' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                            <span style={{ color: BAI.inkFaint }}>{icon}</span>{label}
                          </Link>
                        ))}
                        <div style={{ borderTop: `1px solid ${BAI.border}`, paddingTop: 4 }}>
                          <button onClick={handleLogout}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', width: '100%', fontSize: 13.5, minHeight: 42, color: '#9b1c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                            <LogOut size={15} /> Déconnexion
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
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '7px 18px', borderRadius: 24, fontSize: 13.5, fontWeight: 500,
                    color: !isDark ? BAI.inkMid : 'rgba(255,255,255,0.85)', textDecoration: 'none',
                    border: !isDark ? `1px solid ${BAI.border}` : '1px solid rgba(255,255,255,0.22)',
                    background: 'transparent',
                    transition: 'color 0.3s, border-color 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = !isDark ? BAI.ink : '#fff'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = !isDark ? BAI.borderStrong : 'rgba(255,255,255,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = !isDark ? BAI.inkMid : 'rgba(255,255,255,0.85)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderColor = !isDark ? BAI.border : 'rgba(255,255,255,0.22)'
                  }}>
                  Se connecter
                </Link>
                <Link to="/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '7px 18px', borderRadius: 24, fontSize: 13.5, fontWeight: 600,
                    background: BAI.caramel, color: '#fff', textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}>
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* ── Droite mobile ── */}
          <div className="flex md:hidden items-center" style={{ flexShrink: 0 }}>
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{ display: 'flex', alignItems: 'center', width: 36, height: 36, borderRadius: 8, border: `1px solid ${BAI.border}`, background: 'transparent', cursor: 'pointer', justifyContent: 'center' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: threadColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{initials}</div>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: `1px solid ${BAI.border}`, borderRadius: 12, boxShadow: '0 16px 48px rgba(13,12,10,0.12)', width: 'min(220px,calc(100vw - 32px))', zIndex: 20, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BAI.border}` }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                        <p style={{ fontSize: 11, color: BAI.inkMid, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                      {[
                        { to: getDashboardLink(), label: 'Tableau de bord' },
                        { to: '/profile', label: 'Mon profil' },
                        { to: '/pricing', label: 'Mon abonnement' },
                      ].map(({ to, label }) => (
                        <Link key={to} to={to} onClick={() => setShowUserMenu(false)}
                          style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 14, minHeight: 44, color: BAI.inkMid, textDecoration: 'none' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                          {label}
                        </Link>
                      ))}
                      <div style={{ borderTop: `1px solid ${BAI.border}`, paddingTop: 4 }}>
                        <button onClick={handleLogout}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', width: '100%', fontSize: 14, minHeight: 44, color: '#9b1c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                          <LogOut size={15} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Hamburger seul — icône 3 barres propre */
              <button
                onClick={() => setShowMobilePublicMenu(!showMobilePublicMenu)}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  gap: 5, width: 40, height: 40, borderRadius: 8,
                  border: !isDark ? `1px solid ${BAI.border}` : '1px solid rgba(255,255,255,0.22)',
                  background: 'transparent', cursor: 'pointer', padding: 0,
                  transition: 'border-color 0.3s',
                }}
                aria-label="Menu">
                <span style={{ display: 'block', width: 18, height: 1.5, background: !isDark ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', transform: showMobilePublicMenu ? 'rotate(45deg) translateY(6.5px)' : 'none' }} />
                <span style={{ display: 'block', width: 18, height: 1.5, background: !isDark ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', opacity: showMobilePublicMenu ? 0 : 1 }} />
                <span style={{ display: 'block', width: 18, height: 1.5, background: !isDark ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', transform: showMobilePublicMenu ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }} />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>

    {/* ── FULLSCREEN mobile menu — pattern Stripe / Linear ───────────────────── */}
    {!isAuthenticated && showMobilePublicMenu && (
      <div
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: BAI.night,
          display: 'flex', flexDirection: 'column',
        }}>

        {/* Topbar overlay */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 56, padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.10)', flexShrink: 0,
        }}>
          <Link to="/" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <BailioLogo size={22} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1 }}>
              Bailio<span style={{ color: BAI.caramel }}>.</span>
            </span>
          </Link>
          <button onClick={closeMobileMenu}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer' }}>
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Nav links — grands, aérés */}
        <nav style={{ flex: 1, padding: '32px 24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
          {NAV_LINKS.map(({ to, label, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to} onClick={closeMobileMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(24px,7vw,36px)', color: isActive ? BAI.caramel : 'rgba(255,255,255,0.90)',
                  lineHeight: 1,
                }}>
                  {label}
                </span>
                <ArrowRight size={16} color={isActive ? BAI.caramel : 'rgba(255,255,255,0.30)'} />
              </Link>
            )
          })}
        </nav>

        {/* Boutons auth en bas */}
        <div style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <Link to="/register" onClick={closeMobileMenu}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 10, textDecoration: 'none',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              background: BAI.caramel, color: '#fff',
            }}>
            S'inscrire gratuitement
          </Link>
          <Link to="/login" onClick={closeMobileMenu}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 10, textDecoration: 'none',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)',
            }}>
            Se connecter
          </Link>
        </div>
      </div>
    )}

    {/* Spacer uniquement sur les pages hors home (header overlay sur hero) */}
    {!isHomePage && <div aria-hidden style={{ height: 'calc(64px + env(safe-area-inset-top, 0px))', flexShrink: 0, background: 'transparent' }} />}
    </>
  )
}
