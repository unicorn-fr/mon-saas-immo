/**
 * OwnerSidebar — Bailio Design System
 * Thème night · fond #1a1a2e · accent caramel #c4976a · DM Sans
 * Responsive : desktop 220px · tablet compact 64px · mobile drawer
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, ClipboardList, Calendar, FileText,
  MessageSquare, Plus, Settings, TrendingUp, Wrench, Receipt, Wallet, BarChart2, Users, FolderOpen, Calculator,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { applicationService } from '../../services/application.service'
import { BAI } from '../../constants/bailio-tokens'
import { useWindowWidth } from '../../hooks/useWindowWidth'

function SectionLabel({ label, compact }: { label: string; compact?: boolean }) {
  if (compact) return <div style={{ height: 16 }} />
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
  to, icon: Icon, label, badge, end, onClick, compact,
}: {
  to: string; icon: React.ElementType; label: string
  badge?: number; end?: boolean; onClick?: () => void; compact?: boolean
}) {
  const location = useLocation()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={compact ? label : undefined}
      aria-current={active ? 'page' : undefined}
      style={active ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: compact ? 0 : 10,
        padding: compact ? '12px 0' : '9px 13px',
        margin: compact ? '2px 6px' : '1px 8px',
        borderRadius: BAI.radius,
        color: '#ffffff',
        fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
        background: 'rgba(196,151,106,0.15)',
        borderLeft: compact ? 'none' : `3px solid ${BAI.caramel}`,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
        position: 'relative',
      } : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: compact ? 0 : 10,
        padding: compact ? '12px 0' : '9px 13px',
        margin: compact ? '2px 6px' : '1px 8px',
        borderRadius: BAI.radius,
        color: 'rgba(255,255,255,0.70)',
        fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 400,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
        borderLeft: compact ? 'none' : '3px solid transparent',
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
      <Icon className={compact ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0'} />
      {!compact && <span className="flex-1 truncate">{label}</span>}
      {!compact && badge !== undefined && badge > 0 && (
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
      {compact && badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 7, height: 7, borderRadius: '50%',
          background: BAI.caramel,
        }} />
      )}
    </NavLink>
  )
}

export function OwnerSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)
  const windowWidth = useWindowWidth()
  const isTabletCompact = windowWidth >= BAI.bpMd && windowWidth < BAI.bpLg

  useEffect(() => {
    fetchUnreadCount()
    applicationService.list()
      .then((apps) => setPendingAppsCount(apps.filter((a) => a.status === 'PENDING').length))
      .catch(() => {})
  }, [fetchUnreadCount])

  const closeMobile = () => setMobileOpen(false)

  const Content = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex flex-col h-full" style={{ fontFamily: BAI.fontBody }}>

      {/* Wordmark / Logo */}
      <div style={{
        padding: compact ? '20px 0 16px' : '20px 20px 16px',
        borderBottom: `1px solid ${BAI.nightBorder}`,
        marginBottom: 8,
        flexShrink: 0,
        display: 'flex',
        justifyContent: compact ? 'center' : 'flex-start',
      }}>
        {compact ? (
          <Link to="/" style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic',
            fontWeight: 700, fontSize: 18, color: BAI.caramel,
            textDecoration: 'none', letterSpacing: '-0.01em', lineHeight: 1,
            userSelect: 'none',
          }}>
            b
          </Link>
        ) : (
          <Link to="/" onClick={closeMobile} className="hover:opacity-75 transition-opacity block" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic',
              fontWeight: 700, fontSize: 22, color: BAI.caramel,
              letterSpacing: '-0.01em', userSelect: 'none', lineHeight: 1, display: 'block',
            }}>
              bailio
            </span>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: BAI.fontBody, margin: '4px 0 0' }}>
              Espace propriétaire
            </p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" compact={compact} />
        <NavItem to="/dashboard/owner" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} compact={compact} />

        <SectionLabel label="Mon parc" compact={compact} />
        <NavItem to="/properties/owner/me" icon={Home} label="Mes biens" onClick={closeMobile} compact={compact} />
        <NavItem to="/properties/new" icon={Plus} label="Ajouter un bien" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Locataires" compact={compact} />
        <NavItem to="/owner/locataires" icon={Users} label="Mes locataires" onClick={closeMobile} compact={compact} />
        <NavItem to="/applications/manage" icon={ClipboardList} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} compact={compact} />
        <NavItem to="/bookings/manage" icon={Calendar} label="Visites" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Administration" compact={compact} />
        <NavItem to="/contracts" icon={FileText} label="Contrats" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/documents" icon={FolderOpen} label="Documents" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Communication" compact={compact} />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} compact={compact} />

        <SectionLabel label="Gestion" compact={compact} />
        <NavItem to="/owner/finances" icon={TrendingUp} label="Finances" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/rentabilite" icon={BarChart2} label="Rentabilité" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/outils" icon={Calculator} label="Outils" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/quittances" icon={Receipt} label="Quittances" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/maintenance" icon={Wrench} label="Maintenance" onClick={closeMobile} compact={compact} />
        <NavItem to="/owner/wallet" icon={Wallet} label="Portefeuille" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Compte" compact={compact} />
        <NavItem to="/owner/settings" icon={Settings} label="Paramètres" onClick={closeMobile} compact={compact} />
      </nav>

    </div>
  )

  const sidebarStyle = {
    background: BAI.night,
    borderRight: `1px solid ${BAI.nightBorder}`,
  }

  return (
    <>
      {/* Desktop + Tablet — visible md+ */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={{ ...sidebarStyle, width: isTabletCompact ? 64 : 220, transition: 'width 0.25s ease' }}>
        <Content compact={isTabletCompact} />
      </aside>

      {/* Mobile — drawer pleine hauteur */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={closeMobile}
            style={{
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          <aside
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, width: 'min(256px, 85vw)', boxShadow: '4px 0 32px rgba(0,0,0,0.25)', overflowX: 'hidden' }}>
            <Content compact={false} />
          </aside>
        </>
      )}
    </>
  )
}
