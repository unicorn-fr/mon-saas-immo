import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Search, Calendar, Bell, Star,
  FolderOpen, SendHorizonal, FileText, MessageSquare, X, LogOut, Settings,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { BAI } from '../../constants/bailio-tokens'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const SIDEBAR_BG = '#0a0d1a'
const SIDEBAR_BORDER = 'rgba(255,255,255,0.07)'

type SectionItem = {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
  end?: boolean
  id?: string
}

function NavItem({
  to, icon: Icon, label, badge, end, onClick, compact, id,
}: SectionItem & { onClick?: () => void; compact?: boolean }) {
  const location = useLocation()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      id={id}
      onClick={onClick}
      title={compact ? label : undefined}
      aria-current={active ? 'page' : undefined}
      style={{ position: 'relative', display: 'block', textDecoration: 'none' }}
    >
      {active && (
        <motion.div
          layoutId="tenantActiveNav"
          style={{
            position: 'absolute',
            inset: 0,
            margin: compact ? '2px 4px' : '1px 12px',
            borderRadius: BAI.radius,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            border: '1px solid rgba(159,212,186,0.25)',
            borderLeft: compact ? '1px solid rgba(159,212,186,0.25)' : `2px solid ${BAI.tenant}`,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <motion.div
        whileHover={!active ? { backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
        transition={{ duration: 0.12 }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'center' : 'flex-start',
          gap: compact ? 0 : 10,
          padding: compact ? '11px 0' : '7px 10px',
          margin: compact ? '2px 4px' : '1px 12px',
          borderRadius: BAI.radius,
          color: active ? '#fff' : 'rgba(255,255,255,0.70)',
          fontFamily: BAI.fontBody,
          fontSize: 13.5,
          fontWeight: active ? 600 : 450,
          transition: 'color 0.15s',
          cursor: 'pointer',
        }}
      >
        <Icon
          size={compact ? 18 : 16}
          style={{ flexShrink: 0, transition: 'opacity 0.15s', opacity: active ? 1 : 0.60 }}
        />
        {!compact && <span style={{ flex: 1 }}>{label}</span>}

        {!compact && badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: 10, fontWeight: 700,
              background: BAI.caramel, color: '#fff',
              borderRadius: 20, minWidth: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}

        {compact && badge !== undefined && badge > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: BAI.caramel,
          }} />
        )}
      </motion.div>
    </NavLink>
  )
}

export function TenantSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)
  const windowWidth = useWindowWidth()
  const isTabletCompact = windowWidth >= BAI.bpMd && windowWidth < BAI.bpLg

  useEffect(() => {
    fetchUnreadCount()
    applicationService.list()
      .then((apps) => setPendingAppsCount(apps.filter((a) => a.status === 'PENDING').length))
      .catch(() => {})
    const timer = setInterval(() => fetchUnreadCount(), 30_000)
    return () => clearInterval(timer)
  }, [fetchUnreadCount])

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?'
  const closeMobile = () => setMobileOpen(false)
  const handleLogout = () => { logout(); navigate('/') }

  const SECTIONS: { label: string | null; items: SectionItem[] }[] = [
    {
      label: null,
      items: [
        { to: '/dashboard/tenant', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
        { to: '/search', icon: Search, label: 'Rechercher', id: 'tour-tenant-search' },
        { to: '/favorites', icon: Star, label: 'Favoris' },
        { to: '/mes-alertes', icon: Bell, label: 'Mes alertes' },
      ],
    },
    {
      label: 'Mon dossier',
      items: [
        { to: '/my-applications', icon: SendHorizonal, label: 'Candidatures', badge: pendingAppsCount, id: 'tour-tenant-applications' },
        { to: '/my-bookings', icon: Calendar, label: 'Mes visites' },
        { to: '/dossier', icon: FolderOpen, label: 'Mon dossier', end: true, id: 'tour-tenant-dossier' },
      ],
    },
    {
      label: 'Contrat',
      items: [
        { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount, id: 'tour-tenant-messages' },
        { to: '/contracts', icon: FileText, label: 'Mon bail', id: 'tour-tenant-contracts' },
      ],
    },
  ]

  const Content = ({ compact = false }: { compact?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: BAI.fontBody }}>

      {/* Logo */}
      <div style={{
        padding: compact ? '20px 0 16px' : '20px 20px 14px',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        marginBottom: 6,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'space-between',
      }}>
        {compact ? (
          <Link to="/" style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic',
            fontWeight: 700, fontSize: 20, color: BAI.caramel,
            textDecoration: 'none',
          }}>b</Link>
        ) : (
          <>
            <Link to="/" onClick={closeMobile} style={{ textDecoration: 'none' }}>
              <span style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic',
                fontWeight: 700, fontSize: 22, color: '#fff',
                display: 'block', lineHeight: 1,
                letterSpacing: '-0.01em',
              }}>
                bailio<span style={{ color: BAI.caramel }}>.</span>
              </span>
              <p style={{
                fontSize: 9, color: 'rgba(255,255,255,0.28)',
                fontFamily: BAI.fontBody, margin: '5px 0 0',
                letterSpacing: '0.10em', textTransform: 'uppercase',
              }}>
                Espace locataire
              </p>
            </Link>
            <button
              onClick={closeMobile}
              className="md:hidden"
              aria-label="Fermer le menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                cursor: 'pointer',
              }}
            >
              <X size={14} color="rgba(255,255,255,0.65)" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        role="navigation"
        aria-label="Navigation principale"
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 4 }}
      >
        {SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 2 }}>
            {section.label && !compact && (
              <p style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.11em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.48)',
                padding: '14px 22px 5px',
                margin: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: BAI.tenant, flexShrink: 0, display: 'inline-block' }} />
                {section.label}
              </p>
            )}
            {section.label && compact && (
              <div style={{ height: 1, margin: '6px 10px', background: 'rgba(255,255,255,0.07)' }} />
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onClick={closeMobile}
                compact={compact}
              />
            ))}
          </div>
        ))}

        <div style={{ height: 1, margin: compact ? '6px 10px' : '6px 18px', background: 'rgba(255,255,255,0.07)' }} />

        <NavItem
          to="/tenant/settings"
          icon={Settings}
          label="Paramètres"
          onClick={closeMobile}
          compact={compact}
          id="tour-tenant-settings"
        />
      </nav>

      {/* User card */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: compact ? '10px 6px' : '10px', flexShrink: 0 }}>
        {compact ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              title={`${user?.firstName} ${user?.lastName} — Locataire`}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(27,94,59,0.28)',
                border: '1px solid rgba(159,212,186,0.25)',
                color: '#5fcf96',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, cursor: 'default',
              }}
            >
              {initials}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              title="Déconnexion"
              style={{
                width: BAI.touchMin, height: BAI.touchMin,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.40)', borderRadius: BAI.radius,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,28,28,0.18)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)' }}
            >
              <LogOut size={14} />
            </motion.button>
          </div>
        ) : (
          <div style={{
            padding: '9px 10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(27,94,59,0.28)',
              border: '1px solid rgba(159,212,186,0.25)',
              color: '#5fcf96',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, overflow: 'hidden',
            }}>
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 7 }} />
                : initials
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <span style={{
                display: 'inline-block', marginTop: 3,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 4,
                background: 'rgba(27,94,59,0.28)',
                color: '#5fcf96',
              }}>
                Locataire
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleLogout}
              title="Déconnexion"
              style={{
                width: 36, height: 36, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.28)', borderRadius: 8,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,28,28,0.18)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.28)' }}
            >
              <LogOut size={13} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )

  const sidebarStyle = {
    background: SIDEBAR_BG,
    borderRight: `1px solid ${SIDEBAR_BORDER}`,
  }

  return (
    <>
      {/* Desktop + Tablet */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={{ ...sidebarStyle, width: isTabletCompact ? 64 : 220, transition: 'width 0.25s ease' }}
      >
        <Content compact={isTabletCompact} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              onClick={closeMobile}
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
              style={{ ...sidebarStyle, width: 'min(256px, 85vw)', boxShadow: '6px 0 40px rgba(0,0,0,0.40)', overflowX: 'hidden' }}
            >
              <Content compact={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
