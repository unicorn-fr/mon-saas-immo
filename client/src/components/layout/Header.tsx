/**
 * Header — Maison Design System
 * Mode public : transparent sur hero → sticky blanc après scroll (Hyperbeat-style), nav plate
 * Mode dashboard : topbar 52px fond blanc, dropdown profil raffiné
 */
import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut, Settings, LayoutDashboard, Menu,
  Terminal, CreditCard, Bell, X, ArrowRight,
  MessageSquare, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSidebarStore } from '../../store/sidebarStore'
import { useState, useEffect, useRef } from 'react'
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
  const { toggle: toggleSidebar, mobileOpen } = useSidebarStore()
  const { unreadCount } = useMessages()
  usePageTitle(user?.role)

  const isHomePage = location.pathname === '/'
  // isDark conservé pour compatibilité avec useDarkSection (pages hero sombres)
  useHeaderStore((s) => s.isDark)

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
      { to: '/owner/abonnement', icon: <CreditCard className="w-4 h-4" />,     label: 'Mon abonnement' },
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
            {/* Hamburger — bascule en X quand sidebar ouverte */}
            <button onClick={toggleSidebar} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: `1px solid ${mobileOpen ? BAI.caramel : BAI.border}`, background: mobileOpen ? `${BAI.caramel}14` : 'transparent', color: mobileOpen ? BAI.caramel : BAI.inkMid, cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s' }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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

  // ── PUBLIC HEADER — Hyperbeat style ───────────────────────────────────────
  const [scrolled, setScrolled] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isSticky = scrolled || !isHomePage

  // Nav tokens : blanc sur fond sombre hero, encré sur fond blanc après scroll
  const navTextColor  = isSticky ? BAI.inkMid          : 'rgba(255,255,255,0.88)'
  const navTextHover  = isSticky ? BAI.ink              : '#ffffff'
  const logoColor     = isSticky ? BAI.ink              : '#ffffff'

  const LOCATION_DROPDOWN = [
    { label: 'Appartements à louer', to: '/search?type=APARTMENT' },
    { label: 'Maisons à louer',      to: '/search?type=HOUSE'     },
    { label: 'Studios à louer',      to: '/search?type=STUDIO'    },
    { label: 'Toutes les annonces',  to: '/search'                },
    null,
    { label: 'Paris',     to: '/location/paris'     },
    { label: 'Lyon',      to: '/location/lyon'      },
    { label: 'Marseille', to: '/location/marseille' },
    { label: 'Bordeaux',  to: '/location/bordeaux'  },
  ]

  const MOBILE_NAV_LINKS = [
    { to: '/search',        label: 'Location' },
    { to: '/locataires',    label: 'Locataires' },
    { to: '/pricing',       label: 'Tarifs'    },
    { to: '/proprietaires', label: 'Propriétaires' },
    { to: '/estimer',       label: 'Estimer'   },
    { to: '/guide',         label: 'Guide'     },
  ]

  const closeMobileMenu = () => setShowMobilePublicMenu(false)

  const navLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: 6,
    fontFamily: BAI.fontBody,
    fontSize: 14,
    fontWeight: 500,
    color: navTextColor,
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s, background 0.2s',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  }

  return (
    <>
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: 60,
      display: 'flex', alignItems: 'center',
      background: isSticky ? BAI.bgSurface : 'transparent',
      borderBottom: isSticky ? `1px solid ${BAI.border}` : '1px solid transparent',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 clamp(16px,3vw,32px)',
        width: '100%', height: 60,
        boxSizing: 'border-box',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
          <BailioLogo size={20} />
          <span style={{
            fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700,
            fontStyle: 'italic', color: logoColor,
            letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap',
            transition: 'color 0.3s',
          }}>
            Bailio<span style={{ color: BAI.caramel }}>.</span>
          </span>
        </Link>

        {/* ── Nav centrale — plate, sans pill, sans backdrop-filter ── */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center" style={{ gap: 0, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>

            {/* Location avec dropdown */}
            <div
              ref={locationDropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => setLocationDropdownOpen(true)}
              onMouseLeave={() => setLocationDropdownOpen(false)}
            >
              <button
                style={{ ...navLinkStyle, gap: 4 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                Location <ChevronDown size={13} style={{ opacity: 0.65, marginLeft: 2 }} />
              </button>

              {/* Dropdown simple — fond blanc, border, pas de backdrop-filter */}
              {locationDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-40%)',
                  paddingTop: 8,
                  minWidth: 220, zIndex: 10,
                }}>
                  <div style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(13,12,10,0.12), 0 2px 8px rgba(13,12,10,0.06)',
                    paddingTop: 6, paddingBottom: 6,
                    overflow: 'hidden',
                  }}>
                    {LOCATION_DROPDOWN.map((item, i) =>
                      item === null ? (
                        <div key={`sep-${i}`} style={{ height: 1, background: BAI.border, margin: '4px 12px' }} />
                      ) : (
                        <Link key={item.to} to={item.to}
                          style={{ display: 'block', padding: '9px 16px', textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, transition: 'background 0.12s, color 0.12s' }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = BAI.bgMuted; el.style.color = BAI.ink }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = BAI.inkMid }}>
                          {item.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Locataires */}
            <Link to="/locataires"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Locataires
            </Link>

            {/* Tarifs */}
            <Link to="/pricing"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Tarifs
            </Link>

            {/* Propriétaires */}
            <Link to="/proprietaires"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Propriétaires
            </Link>

            {/* Estimer */}
            <Link to="/estimer"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Estimer
            </Link>

            {/* Guide */}
            <Link to="/guide"
              style={navLinkStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = navTextHover; (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = navTextColor; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              Guide
            </Link>
          </nav>
        )}

        {/* Super Admin badge */}
        {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
          <Link to="/super-admin"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(0,180,216,0.10)', color: '#00b4d8', border: '1px solid rgba(0,180,216,0.25)' }}>
            <Terminal className="w-3 h-3" /> Cerveau Central
          </Link>
        )}

        {/* ── Actions droite desktop ── */}
        <div className="hidden md:flex items-center" style={{ gap: 8, flexShrink: 0 }}>
          {isAuthenticated ? (
            <>
              <Link to="/notifications"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: isSticky ? BAI.inkFaint : 'rgba(255,255,255,0.70)', width: 36, height: 36 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.12)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                <Bell size={17} />
              </Link>
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 6px',
                    borderRadius: 8, border: `1px solid ${isSticky ? BAI.border : 'rgba(255,255,255,0.25)'}`,
                    background: showUserMenu ? BAI.bgMuted : 'transparent', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.12)' }}
                  onMouseLeave={(e) => { if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: threadColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{initials}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isSticky ? BAI.ink : '#ffffff', fontFamily: BAI.fontBody }}>{user?.firstName}</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 8,
                      background: BAI.bgSurface,
                      border: `1px solid ${BAI.border}`,
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(13,12,10,0.12), 0 4px 16px rgba(13,12,10,0.06)',
                      width: 220, zIndex: 20, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BAI.border}` }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                        <p style={{ fontSize: 11, color: BAI.inkMid, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                      {[
                        { to: getDashboardLink(), icon: <LayoutDashboard size={15} />, label: 'Tableau de bord' },
                        { to: '/profile',         icon: <Settings size={15} />,        label: 'Mon profil'      },
                        { to: '/owner/abonnement', icon: <CreditCard size={15} />,      label: 'Mon abonnement'  },
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
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', width: '100%', fontSize: 13.5, minHeight: 42, color: BAI.error, background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.errorLight }}
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
              {/* Se connecter — flat, contextuel */}
              <Link to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 13.5, fontWeight: 500, fontFamily: BAI.fontBody,
                  background: 'transparent',
                  border: isSticky ? `1px solid ${BAI.border}` : '1px solid rgba(255,255,255,0.30)',
                  color: isSticky ? BAI.inkMid : 'rgba(255,255,255,0.90)',
                  textDecoration: 'none',
                  transition: 'color 0.2s, background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = isSticky ? BAI.ink : '#fff'; el.style.background = isSticky ? BAI.bgMuted : 'rgba(255,255,255,0.12)' }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = isSticky ? BAI.inkMid : 'rgba(255,255,255,0.90)'; el.style.background = 'transparent' }}>
                Se connecter
              </Link>

              {/* Déposer une annonce — CTA solid */}
              <Link to="/register?role=OWNER"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  fontSize: 13.5, fontWeight: 600, fontFamily: BAI.fontBody,
                  background: BAI.night,
                  border: '1px solid transparent',
                  color: '#ffffff', textDecoration: 'none',
                  transition: 'opacity 0.18s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                Déposer une annonce
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>

        {/* ── Droite mobile ── */}
        <div className="flex md:hidden items-center" style={{ flexShrink: 0, gap: 8 }}>
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex', alignItems: 'center', width: 40, height: 40,
                  borderRadius: 10,
                  background: isSticky ? 'transparent' : 'rgba(255,255,255,0.12)',
                  border: isSticky ? `1px solid ${BAI.border}` : '1px solid rgba(255,255,255,0.22)',
                  cursor: 'pointer', justifyContent: 'center',
                }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: threadColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{initials}</div>
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 8,
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(13,12,10,0.12)',
                    width: 'min(220px,calc(100vw - 32px))', zIndex: 20, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BAI.border}` }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                      <p style={{ fontSize: 11, color: BAI.inkMid, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                    {[
                      { to: getDashboardLink(), label: 'Tableau de bord' },
                      { to: '/profile',         label: 'Mon profil'      },
                      { to: '/owner/abonnement', label: 'Mon abonnement'  },
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
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', width: '100%', fontSize: 14, minHeight: 44, color: BAI.error, background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.errorLight }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}>
                        <LogOut size={15} /> Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowMobilePublicMenu(!showMobilePublicMenu)}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                gap: 5, width: 40, height: 40, borderRadius: 10,
                background: isSticky ? 'transparent' : 'rgba(255,255,255,0.10)',
                border: isSticky ? `1px solid ${BAI.border}` : '1px solid rgba(255,255,255,0.28)',
                cursor: 'pointer', padding: 0,
              }}
              aria-label="Menu">
              <span style={{ display: 'block', width: 18, height: 1.5, background: isSticky ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', transform: showMobilePublicMenu ? 'rotate(45deg) translateY(6.5px)' : 'none' }} />
              <span style={{ display: 'block', width: 18, height: 1.5, background: isSticky ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', opacity: showMobilePublicMenu ? 0 : 1 }} />
              <span style={{ display: 'block', width: 18, height: 1.5, background: isSticky ? BAI.ink : '#fff', borderRadius: 2, transition: 'all .25s', transform: showMobilePublicMenu ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }} />
            </button>
          )}
        </div>

      </div>
    </header>

    {/* ── Menu mobile fullscreen — fond dark ── */}
    {!isAuthenticated && showMobilePublicMenu && (
      <div
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#0a0d1a',
          display: 'flex', flexDirection: 'column',
        }}>

        {/* Topbar overlay */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 60, padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          <Link to="/" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <BailioLogo size={20} />
            <span style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', lineHeight: 1 }}>
              Bailio<span style={{ color: BAI.caramel }}>.</span>
            </span>
          </Link>
          <button onClick={closeMobileMenu}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}>
            <X size={18} color="#ffffff" />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '32px 24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
          {MOBILE_NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to} onClick={closeMobileMenu}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                }}>
                <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,7vw,36px)', color: isActive ? BAI.caramel : 'rgba(255,255,255,0.88)', lineHeight: 1 }}>
                  {label}
                </span>
                <ArrowRight size={16} color={isActive ? BAI.caramel : 'rgba(255,255,255,0.25)'} />
              </Link>
            )
          })}
        </nav>

        {/* Boutons auth en bas */}
        <div style={{ padding: '20px 24px', paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 20px))', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <Link to="/register?role=OWNER" onClick={closeMobileMenu}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 10, textDecoration: 'none',
              fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
              background: BAI.night, color: '#fff',
              border: `1px solid ${BAI.caramel}`,
            }}>
            Déposer une annonce
          </Link>
          <Link to="/login" onClick={closeMobileMenu}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', borderRadius: 10, textDecoration: 'none',
              fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 500,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.88)',
            }}>
            Se connecter
          </Link>
        </div>
      </div>
    )}

    {!isHomePage && <div aria-hidden style={{ height: 60, flexShrink: 0, background: 'transparent' }} />}
    </>
  )
}
