/**
 * OwnerSidebar — Bailio Design System
 * Thème night · fond #1a1a2e · accent caramel #c4976a · DM Sans
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, ClipboardList, Calendar, FileText,
  MessageSquare, Plus, X, LogOut,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: BAI.fontBody,
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.35)',
      margin: '16px 16px 4px',
    }}>
      {label}
    </p>
  )
}

function NavItem({
  to, icon: Icon, label, badge, end, onClick,
}: {
  to: string; icon: React.ElementType; label: string
  badge?: number; end?: boolean; onClick?: () => void
}) {
  const location = useLocation()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink to={to} end={end} onClick={onClick}
      className="mx-2 flex items-center gap-2.5"
      aria-current={active ? 'page' : undefined}
      style={active ? {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', borderRadius: BAI.radius,
        color: '#ffffff',
        fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
        background: 'rgba(196,151,106,0.15)',
        borderLeft: `3px solid ${BAI.caramel}`,
        paddingLeft: 13,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
      } : {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', borderRadius: BAI.radius,
        color: 'rgba(255,255,255,0.70)',
        fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 400,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
        borderLeft: '3px solid transparent',
        paddingLeft: 13,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = BAI.nightHover
          ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          ;(e.currentTarget as HTMLElement).style.background = 'none'
          ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.70)'
        }
      }}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: BAI.caramel, color: '#ffffff',
          borderRadius: 20, minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export function OwnerSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    applicationService.list()
      .then((apps) => setPendingAppsCount(apps.filter((a) => a.status === 'PENDING').length))
      .catch(() => {})
  }, [fetchUnreadCount])

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  const closeMobile = () => setMobileOpen(false)
  const handleLogout = () => { logout(); navigate('/') }

  const Content = () => (
    <div className="flex flex-col h-full" style={{ fontFamily: BAI.fontBody }}>

      {/* Wordmark */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${BAI.nightBorder}`,
        marginBottom: 8,
        flexShrink: 0,
      }}>
        <Link to="/" onClick={closeMobile} className="hover:opacity-75 transition-opacity block" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 22,
            color: BAI.caramel,
            letterSpacing: '-0.01em',
            userSelect: 'none',
            lineHeight: 1,
            display: 'block',
          }}>
            bailio
          </span>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: BAI.fontBody, margin: '4px 0 0' }}>
            Espace propriétaire
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" />
        <NavItem to="/dashboard/owner" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} />

        <SectionLabel label="Mon parc" />
        <NavItem to="/properties/owner/me" icon={Home} label="Mes biens" onClick={closeMobile} />
        <NavItem to="/properties/new" icon={Plus} label="Ajouter un bien" onClick={closeMobile} />

        <SectionLabel label="Locataires" />
        <NavItem to="/applications/manage" icon={ClipboardList} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} />
        <NavItem to="/bookings/manage" icon={Calendar} label="Visites" onClick={closeMobile} />

        <SectionLabel label="Administration" />
        <NavItem to="/contracts" icon={FileText} label="Contrats" onClick={closeMobile} />

        <SectionLabel label="Communication" />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} />
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: BAI.nightBorder, margin: '0 16px' }} />

      {/* Zone utilisateur */}
      <div style={{
        borderTop: `1px solid ${BAI.nightBorder}`,
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: BAI.caramelLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.caramel,
            flexShrink: 0,
          }}>
            {initials || '?'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
              color: '#ffffff', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11,
              color: 'rgba(255,255,255,0.45)', margin: 0,
            }}>
              Propriétaire
            </p>
          </div>
          <button onClick={closeMobile} className="md:hidden p-1 rounded-md" style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: BAI.fontBody, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(155,28,28,0.2)'; (e.currentTarget as HTMLElement).style.color = '#fca5a5' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}>
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  const sidebarStyle = {
    background: BAI.night,
    borderRight: `1px solid ${BAI.nightBorder}`,
  }

  return (
    <>
      <aside className="hidden md:flex flex-col flex-shrink-0 overflow-hidden" style={{ ...sidebarStyle, width: 220 }}>
        <Content />
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={closeMobile} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, width: 256, boxShadow: '4px 0 32px rgba(0,0,0,0.25)' }}>
            <Content />
          </aside>
        </>
      )}
    </>
  )
}
