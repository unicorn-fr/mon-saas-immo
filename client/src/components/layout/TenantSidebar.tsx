/**
 * TenantSidebar — Maison Design System
 * bg white · accent #1b5e3b (forest green) · DM Sans
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
import { dossierService } from '../../services/dossierService'
import { useNavigate } from 'react-router-dom'

const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

const S = {
  bg:           '#ffffff',
  border:       '#e4e1db',
  tenant:       '#1b5e3b',
  tenantLight:  '#edf7f2',
  tenantBorder: '#9fd4ba',
  caramel:      '#c4976a',
  ink:          '#0d0c0a',
  inkMid:       '#5a5754',
  inkFaint:     '#9e9b96',
  bgMuted:      '#f4f2ee',
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-5 pb-1 select-none"
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: S.inkFaint,
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
        background: S.tenantLight,
        color: S.tenant,
        fontWeight: 600,
        borderLeft: `2px solid ${S.tenant}`,
        paddingLeft: 10,
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
      } : {
        color: S.inkMid,
        fontWeight: 400,
        borderLeft: '2px solid transparent',
        paddingLeft: 10,
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = S.bgMuted }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ background: S.caramel, color: '#ffffff' }}>
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
    dossierPercent >= 80 ? S.tenant
    : dossierPercent >= 50 ? '#92400e'
    : '#9b1c1c'

  const Content = () => (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <Link to="/" onClick={closeMobile} className="hover:opacity-75 transition-opacity block">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 600,
            fontStyle: 'italic',
            color: S.tenant,
            letterSpacing: '-0.01em',
          }}>
            ImmoParticuliers
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: S.inkFaint, fontFamily: 'var(--font-body)' }}>Espace locataire</p>
        </Link>
      </div>

      <div className="mx-4 mb-1" style={{ height: 1, background: S.border }} />

      {/* Navigation */}
      <nav role="navigation" aria-label="Navigation principale" className="flex-1 overflow-y-auto py-1.5 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" />
        <NavItem to="/dashboard/tenant" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} />

        <SectionLabel label="Ma recherche" />
        <NavItem to="/search" icon={Search} label="Rechercher" onClick={closeMobile} />
        <NavItem to="/favorites" icon={Heart} label="Favoris" onClick={closeMobile} />
        <NavItem to="/my-bookings" icon={Calendar} label="Mes visites" onClick={closeMobile} />

        <SectionLabel label="Mon dossier" />
        <NavItem to="/dossier" icon={FolderOpen} label="Dossier locatif" onClick={closeMobile} />
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
        <div className="mx-4 mb-3 px-3 py-2.5 rounded-lg" style={{ background: S.bgMuted, border: `1px solid ${S.border}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: S.inkFaint, fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Dossier complété</span>
            <span style={{ color: dossierColor, fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{dossierPercent}%</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: '#e4e1db' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dossierPercent}%`, backgroundColor: dossierColor }} />
          </div>
        </div>
      )}

      <div className="mx-4 mt-1" style={{ height: 1, background: S.border }} />

      {/* Profil */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: S.tenantLight, color: S.tenant }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: S.ink }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: S.inkFaint }}>Locataire</p>
          </div>
          <button onClick={closeMobile} className="md:hidden p-1 rounded-md" style={{ color: S.inkFaint }} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all"
          style={{ color: S.inkFaint }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#9b1c1c' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = S.inkFaint }}>
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  )

  const sidebarStyle = {
    background: S.bg,
    borderRight: `1px solid ${S.border}`,
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
