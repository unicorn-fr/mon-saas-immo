/**
 * TenantSidebar — navigation locataire
 * Sidebar pleine hauteur (de top à bottom), logo en tête, glassmorphisme.
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Search, Heart, Calendar, FolderOpen,
  SendHorizonal, FileText, MessageSquare, X, Receipt, HomeIcon,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useContractStore } from '../../store/contractStore'
import { useBookings } from '../../hooks/useBookings'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { dossierService } from '../../services/dossierService'

const REQUIRED_CATEGORIES = ['IDENTITE', 'EMPLOI', 'REVENUS', 'DOMICILE'] as const

function SectionLabel({ label, badge }: { label: string; badge?: boolean }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none flex items-center gap-2"
      style={{ color: 'var(--text-tertiary)' }}>
      {label}
      {badge && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
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
      className="mx-2 flex items-center gap-2.5 px-3 py-[7px] rounded-[10px] text-[13.5px] transition-all duration-150"
      style={active ? {
        background: 'rgba(59,130,246,0.10)',
        color: '#2563eb',
        fontWeight: 600,
        border: '1px solid rgba(59,130,246,0.22)',
      } : { color: 'var(--text-secondary)', border: '1px solid transparent' }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-subtle)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}>
      <Icon className="w-[15px] h-[15px] flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.22)' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export function TenantSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { contracts, fetchContracts } = useContractStore()
  const { bookings, fetchBookings } = useBookings()
  const { user } = useAuth()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)
  const [dossierPercent, setDossierPercent] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    fetchBookings()
    fetchContracts(undefined, 1, 50)
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
  }, [fetchUnreadCount, fetchBookings, fetchContracts])

  const hasActiveContract = contracts.some((c) => c.status === 'ACTIVE')
  const upcomingVisits = bookings.filter(
    (b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.visitDate) >= new Date()
  ).length

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  const closeMobile = () => setMobileOpen(false)

  const dossierColor =
    dossierPercent >= 80 ? '#10b981'
    : dossierPercent >= 50 ? '#f59e0b'
    : '#ef4444'

  const Content = () => (
    <div className="flex flex-col h-full">

      {/* ── Logo (en haut de la sidebar) ───────────────────── */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}
          >
            <HomeIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold font-heading text-gradient-brand">ImmoParticuliers</span>
        </Link>
      </div>

      {/* ── Séparateur ─────────────────────────────────────── */}
      <div className="mx-4 border-t" style={{ borderColor: 'var(--glass-border)' }} />

      {/* ── Profil utilisateur ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Locataire</p>
          </div>
          <button onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de progression dossier */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Dossier complété</span>
            <span className="text-[11px] font-semibold" style={{ color: dossierColor }}>{dossierPercent}%</span>
          </div>
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--glass-border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${dossierPercent}%`, backgroundColor: dossierColor }} />
          </div>
        </div>
      </div>

      {/* ── Séparateur ─────────────────────────────────────── */}
      <div className="mx-4 border-t" style={{ borderColor: 'var(--glass-border)' }} />

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        <SectionLabel label="Vue d'ensemble" />
        <NavItem to="/dashboard/tenant" icon={LayoutDashboard} label="Tableau de bord" end onClick={closeMobile} />

        <SectionLabel label="Ma recherche" />
        <NavItem to="/search" icon={Search} label="Annonces" onClick={closeMobile} />
        <NavItem to="/favorites" icon={Heart} label="Favoris" onClick={closeMobile} />
        <NavItem to="/my-bookings" icon={Calendar} label="Mes visites" badge={upcomingVisits} onClick={closeMobile} />

        <SectionLabel label="Ma candidature" />
        <NavItem to="/dossier" icon={FolderOpen} label="Mon dossier" onClick={closeMobile} />
        <NavItem to="/my-applications" icon={SendHorizonal} label="Candidatures" badge={pendingAppsCount} onClick={closeMobile} />

        {hasActiveContract && (
          <>
            <SectionLabel label="Mon logement" badge />
            <NavItem to="/contracts" icon={FileText} label="Mon bail" onClick={closeMobile} />
            <NavItem to="/contracts" icon={Receipt} label="Quittances" onClick={closeMobile} />
          </>
        )}

        <SectionLabel label="Communication" />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} />
      </nav>

      {/* ── CTA recherche ──────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <NavLink to="/search" onClick={closeMobile}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shimmer-btn"
          style={{ background: '#2563eb', boxShadow: '0 2px 8px rgba(37,99,235,0.28)' }}>
          <Search className="w-3.5 h-3.5" /> Chercher un logement
        </NavLink>
      </div>
    </div>
  )

  const sidebarStyle = {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    borderRight: '1px solid var(--glass-border)',
    boxShadow: '2px 0 24px rgba(0,0,0,0.06), inset -1px 0 0 rgba(255,255,255,0.10)',
  }

  return (
    <>
      {/* Desktop — full height, w-56 */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 overflow-hidden" style={sidebarStyle}>
        <Content />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" onClick={closeMobile} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col md:hidden"
            style={{ ...sidebarStyle, boxShadow: '8px 0 48px rgba(0,0,0,0.25)' }}>
            <Content />
          </aside>
        </>
      )}
    </>
  )
}
