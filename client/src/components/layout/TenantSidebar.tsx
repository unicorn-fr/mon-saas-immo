/**
 * TenantSidebar — Light Premium
 * bg white · thread blue #3b82f6 · Plus Jakarta Sans
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, Search, Heart, Calendar,
  FolderOpen, SendHorizonal, FileText, MessageSquare, X, LogOut,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossierService'
import { useNavigate } from 'react-router-dom'

const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

const S = {
  bg:        '#ffffff',
  border:    '#d2d2d7',
  thread:    '#007AFF',
  threadBg:  '#e8f0fe',
  threadBdr: '#aacfff',
  text:      '#1d1d1f',
  muted:     '#86868b',
  secondary: '#515154',
  hover:     '#f5f5f7',
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] select-none"
      style={{ color: S.muted }}>
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
      className="mx-3 flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150"
      aria-current={active ? 'page' : undefined}
      style={active ? {
        background: S.threadBg,
        color: S.thread,
        fontWeight: 600,
        borderLeft: `3px solid ${S.thread}`,
        paddingLeft: 9,
      } : {
        color: S.secondary,
        fontWeight: 400,
        borderLeft: '3px solid transparent',
        paddingLeft: 9,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = S.hover }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ background: S.threadBg, color: S.thread, border: `1px solid ${S.threadBdr}` }}>
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
    dossierPercent >= 80 ? '#10b981'
    : dossierPercent >= 50 ? '#f59e0b'
    : '#ef4444'

  const Content = () => (
    <div className="flex flex-col h-full" style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}>

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: S.thread }}>
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight" style={{ color: S.text }}>FOYER</p>
            <p className="text-[10px] leading-tight" style={{ color: S.muted }}>Gestion locative</p>
          </div>
        </Link>
      </div>

      <div className="mx-4 mb-2" style={{ height: 1, background: S.border }} />

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" />
        <NavItem to="/dashboard/tenant" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} />

        <SectionLabel label="Ma recherche" />
        <NavItem to="/search" icon={Search} label="Rechercher" onClick={closeMobile} />
        <NavItem to="/favorites" icon={Heart} label="Favoris" onClick={closeMobile} />
        <NavItem to="/my-bookings" icon={Calendar} label="Mes visites" onClick={closeMobile} />

        <SectionLabel label="Mon dossier" />
        <NavItem to="/dossier" icon={FolderOpen} label="Dossier locatif" onClick={closeMobile} />
        <NavItem to="/my-applications" icon={SendHorizonal} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} />

        <SectionLabel label="Mon logement" />
        <NavItem to="/contracts" icon={FileText} label="Mon contrat" onClick={closeMobile} />

        <SectionLabel label="Communication" />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} />
      </nav>

      {/* Dossier progress */}
      {dossierPercent < 100 && (
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl" style={{ background: S.threadBg, border: `1px solid ${S.threadBdr}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: S.thread }}>Dossier complété</span>
            <span className="text-[11px] font-bold" style={{ color: dossierColor }}>{dossierPercent}%</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: '#dbeafe' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dossierPercent}%`, backgroundColor: dossierColor }} />
          </div>
        </div>
      )}

      <div className="mx-4 mt-1" style={{ height: 1, background: S.border }} />

      {/* Profil */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: S.thread }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold truncate leading-tight" style={{ color: S.text }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: S.muted }}>Locataire</p>
          </div>
          <button onClick={closeMobile} className="md:hidden p-1 rounded-md" style={{ color: S.muted }} aria-label="Fermer le menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-all"
          style={{ color: S.muted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = S.muted }}>
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  const sidebarStyle = {
    background: S.bg,
    borderRight: `1px solid ${S.border}`,
    boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
  }

  return (
    <>
      <aside className="hidden md:flex flex-col flex-shrink-0 overflow-hidden" style={{ ...sidebarStyle, width: 240 }}>
        <Content />
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={closeMobile} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, width: 256, boxShadow: '4px 0 24px rgba(0,0,0,0.12)' }}>
            <Content />
          </aside>
        </>
      )}
    </>
  )
}
