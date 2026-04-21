/**
 * TenantSidebar — Bailio Design System
 * Thème night · accent tenant vert #1b5e3b · DM Sans
 * Responsive : desktop 220px · tablet compact 64px · mobile drawer
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Search, Heart, Calendar,
  FolderOpen, SendHorizonal, FileText, MessageSquare, X, LogOut, Settings,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossier.service'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

function SectionLabel({ label, compact }: { label: string; compact?: boolean }) {
  if (compact) return <div style={{ height: 16 }} />
  return (
    <p className="px-4 pt-5 pb-1 select-none"
      style={{
        fontFamily: BAI.fontBody,
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'rgba(255,255,255,0.35)',
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
        padding: compact ? '12px 0' : '7px 10px',
        margin: compact ? '2px 6px' : '1px 12px',
        borderRadius: BAI.radius,
        color: '#ffffff',
        fontFamily: BAI.fontBody, fontSize: '13px', fontWeight: 600,
        background: 'rgba(196,151,106,0.18)',
        borderLeft: compact ? 'none' : `3px solid ${BAI.caramel}`,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
        position: 'relative',
      } : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: compact ? 0 : 10,
        padding: compact ? '12px 0' : '7px 10px',
        margin: compact ? '2px 6px' : '1px 12px',
        borderRadius: BAI.radius,
        color: 'rgba(255,255,255,0.70)',
        fontFamily: BAI.fontBody, fontSize: '13px', fontWeight: 400,
        cursor: 'pointer', transition: BAI.transition,
        textDecoration: 'none',
        borderLeft: compact ? 'none' : '3px solid transparent',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = BAI.nightHover }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}>
      <Icon className={compact ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0'} />
      {!compact && <span className="flex-1 truncate">{label}</span>}
      {!compact && badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ background: BAI.caramel, color: '#ffffff' }}>
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

export function TenantSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)
  const [dossierPercent, setDossierPercent] = useState(0)
  const windowWidth = useWindowWidth()
  const isTabletCompact = windowWidth >= BAI.bpMd && windowWidth < BAI.bpLg

  useEffect(() => {
    fetchUnreadCount()
    applicationService.list()
      .then((apps) => setPendingAppsCount(apps.filter((a) => a.status === 'PENDING').length))
      .catch(() => {})
    dossierService.getDocuments()
      .then((docs) => {
        const uploaded = new Set(docs.map((d) => d.category))
        const covered = REQUIRED_CATEGORIES.filter((cat) => uploaded.has(cat)).length
        setDossierPercent(Math.round((covered / REQUIRED_CATEGORIES.length) * 100))
      })
      .catch(() => {})
  }, [fetchUnreadCount])

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  const closeMobile = () => setMobileOpen(false)
  const handleLogout = () => { logout(); navigate('/') }

  const dossierColor =
    dossierPercent >= 80 ? BAI.tenantBorder
    : dossierPercent >= 50 ? BAI.caramel
    : '#ef4444'

  const Content = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex flex-col h-full" style={{ fontFamily: BAI.fontBody }}>

      {/* Logo */}
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
          }}>
            b
          </Link>
        ) : (
          <Link to="/" onClick={closeMobile} className="hover:opacity-75 transition-opacity block" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic',
              fontWeight: 700, fontSize: 24, color: BAI.caramel,
              letterSpacing: '-0.02em', lineHeight: 1, display: 'block',
            }}>
              bailio
            </span>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: BAI.fontBody, margin: '4px 0 0' }}>
              Espace locataire
            </p>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" compact={compact} />
        <NavItem to="/dashboard/tenant" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} compact={compact} />

        <SectionLabel label="Ma recherche" compact={compact} />
        <NavItem to="/search" icon={Search} label="Rechercher" onClick={closeMobile} compact={compact} />
        <NavItem to="/favorites" icon={Heart} label="Favoris" onClick={closeMobile} compact={compact} />
        <NavItem to="/my-bookings" icon={Calendar} label="Mes visites" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Mon dossier" compact={compact} />
        <NavItem to="/dossier" icon={FolderOpen} label="Dossier locatif" end onClick={closeMobile} compact={compact} />
        <NavItem to="/my-applications" icon={SendHorizonal} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} compact={compact} />

        <SectionLabel label="Mon logement" compact={compact} />
        <NavItem to="/contracts" icon={FileText} label="Mon contrat" onClick={closeMobile} compact={compact} />

        <SectionLabel label="Communication" compact={compact} />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} compact={compact} />

        <SectionLabel label="Compte" compact={compact} />
        <NavItem to="/tenant/settings" icon={Settings} label="Paramètres" onClick={closeMobile} compact={compact} />
      </nav>

      {/* Dossier progress — masqué en mode compact, cliquable */}
      {!compact && dossierPercent < 100 && (
        <Link
          to="/dossier"
          onClick={closeMobile}
          className="mx-4 mb-3 px-3 py-2.5 rounded-lg block"
          style={{ background: BAI.nightHover, border: `1px solid ${BAI.nightBorder}`, textDecoration: 'none', transition: 'background 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BAI.nightHover }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Dossier complété</span>
            <span style={{ color: dossierColor, fontSize: '11px', fontWeight: 600, fontFamily: BAI.fontDisplay }}>{dossierPercent}%</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: BAI.nightBorder }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dossierPercent}%`, backgroundColor: dossierColor }} />
          </div>
        </Link>
      )}

      <div style={{ height: 1, background: BAI.nightBorder, margin: compact ? '0 8px' : '0 16px' }} />

      {/* Profil */}
      <div style={{
        padding: compact ? '12px 0' : '16px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: compact ? 'center' : 'stretch',
        gap: compact ? 8 : 0,
      }}>
        {compact ? (
          <>
            <div
              title={`${user?.firstName} ${user?.lastName} — Locataire`}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: BAI.caramelLight, color: BAI.caramel,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, cursor: 'default',
              }}>
              {initials}
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              style={{
                minWidth: BAI.touchMin, minHeight: BAI.touchMin,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.50)', borderRadius: BAI.radius,
                transition: BAI.transition,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#9b1c1c' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)' }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: BAI.tenantLight, color: BAI.tenant }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.40)' }}>Locataire</p>
              </div>
              <button onClick={closeMobile} className="md:hidden p-1 rounded-md" style={{ color: 'rgba(255,255,255,0.40)' }} aria-label="Fermer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button onClick={handleLogout}
              style={{
                color: 'rgba(255,255,255,0.50)',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: BAI.radius,
                fontSize: 13, transition: BAI.transition,
                background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                minHeight: BAI.touchMin,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#9b1c1c' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)' }}>
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </>
        )}
      </div>
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

      {/* Mobile — drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={closeMobile}
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: BAI.glassBlurLight,
              WebkitBackdropFilter: BAI.glassBlurLight,
            }}
          />
          <aside
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, width: 'min(256px, 85vw)', boxShadow: '4px 0 24px rgba(13,12,10,0.12)', overflowX: 'hidden' }}>
            <Content compact={false} />
          </aside>
        </>
      )}
    </>
  )
}
