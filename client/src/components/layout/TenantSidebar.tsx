/**
 * TenantSidebar — Bailio Design System
 * Night theme · accent BAI.tenant · DM Sans
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Search, Heart, Calendar,
  FolderOpen, SendHorizonal, FileText, MessageSquare, X, LogOut, ShieldCheck,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossier.service'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

function SectionLabel({ label }: { label: string }) {
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
  to, icon: Icon, label, badge, end, onClick,
}: {
  to: string; icon: React.ElementType; label: string
  badge?: number; end?: boolean; onClick?: () => void
}) {
  const location = useLocation()
  const active = end ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <NavLink to={to} end={end} onClick={onClick}
      className="mx-3 flex items-center gap-3 px-3 py-[7px] rounded-lg transition-all duration-100"
      aria-current={active ? 'page' : undefined}
      style={active ? {
        background: 'rgba(27,94,59,0.20)',
        color: BAI.tenant,
        fontWeight: 600,
        borderLeft: `3px solid ${BAI.tenant}`,
        paddingLeft: 10,
        fontFamily: BAI.fontBody,
        fontSize: '13px',
      } : {
        color: 'rgba(255,255,255,0.70)',
        fontWeight: 400,
        borderLeft: '3px solid transparent',
        paddingLeft: 10,
        fontFamily: BAI.fontBody,
        fontSize: '13px',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = BAI.nightHover }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ background: BAI.caramel, color: '#ffffff' }}>
          {badge > 99 ? '99+' : badge}
        </span>
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

  const Content = () => (
    <div className="flex flex-col h-full" style={{ fontFamily: BAI.fontBody }}>

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <Link to="/" onClick={closeMobile} className="hover:opacity-75 transition-opacity block">
          <div className="flex items-center gap-2 mb-1">
            <span style={{
              fontFamily: BAI.fontDisplay,
              fontSize: '24px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: BAI.caramel,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              bailio
            </span>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: BAI.fontBody }}>Espace locataire</p>
        </Link>
      </div>

      <div className="mx-4 mb-1" style={{ height: 1, background: BAI.nightBorder }} />

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" />
        <NavItem to="/dashboard/tenant" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} />

        <SectionLabel label="Ma recherche" />
        <NavItem to="/search" icon={Search} label="Rechercher" onClick={closeMobile} />
        <NavItem to="/favorites" icon={Heart} label="Favoris" onClick={closeMobile} />
        <NavItem to="/my-bookings" icon={Calendar} label="Mes visites" onClick={closeMobile} />

        <SectionLabel label="Mon dossier" />
        <NavItem to="/dossier" icon={FolderOpen} label="Dossier locatif" end onClick={closeMobile} />
        <NavItem to="/dossier/partages" icon={ShieldCheck} label="Contrôle d'accès" onClick={closeMobile} />
        <NavItem to="/my-applications" icon={SendHorizonal} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} />

        <SectionLabel label="Mon logement" />
        <NavItem to="/contracts" icon={FileText} label="Mon contrat" onClick={closeMobile} />

        <SectionLabel label="Communication" />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} />

        <SectionLabel label="Confidentialité" />
        <NavItem to="/privacy" icon={ShieldCheck} label="Mes données & RGPD" onClick={closeMobile} />
      </nav>

      {/* Dossier progress */}
      {dossierPercent < 100 && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg" style={{ background: BAI.nightHover, border: `1px solid ${BAI.nightBorder}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Dossier complété</span>
            <span style={{ color: dossierColor, fontSize: '11px', fontWeight: 600, fontFamily: BAI.fontDisplay }}>{dossierPercent}%</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: BAI.nightBorder }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dossierPercent}%`, backgroundColor: dossierColor }} />
          </div>
        </div>
      )}

      <div className="mx-4 mt-1" style={{ height: 1, background: BAI.nightBorder }} />

      {/* Profil */}
      <div className="p-4 flex-shrink-0">
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
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
          style={{ color: 'rgba(255,255,255,0.50)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#9b1c1c' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)' }}>
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
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={closeMobile} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, width: 256, boxShadow: '4px 0 24px rgba(13,12,10,0.12)' }}>
            <Content />
          </aside>
        </>
      )}
    </>
  )
}
