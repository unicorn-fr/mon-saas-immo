/**
 * OwnerSidebar — navigation propriétaire
 * Sidebar pleine hauteur (de top à bottom), logo en tête, glassmorphisme.
 * Style SaaS sérieux : Linear / Revolut / Apple.
 */
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Home, ClipboardList, Calendar, FileText,
  MessageSquare, TrendingUp, Plus, X, HomeIcon,
} from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
      style={{ color: 'var(--text-tertiary)' }}>
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

export function OwnerSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const { user } = useAuth()
  const [pendingAppsCount, setPendingAppsCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    applicationService.list()
      .then((apps) => setPendingAppsCount(apps.filter((a) => a.status === 'PENDING').length))
      .catch(() => {})
  }, [fetchUnreadCount])

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  const closeMobile = () => setMobileOpen(false)

  const Content = () => (
    <div className="flex flex-col h-full">

      {/* ── Logo (en haut de la sidebar, avant tout) ───────── */}
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
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Propriétaire
            </p>
          </div>
          <button onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Séparateur ─────────────────────────────────────── */}
      <div className="mx-4 border-t" style={{ borderColor: 'var(--glass-border)' }} />

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
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

        <SectionLabel label="Finance" />
        <NavItem to="/calculateur" icon={TrendingUp} label="Simulateur rendement" onClick={closeMobile} />

        <SectionLabel label="Communication" />
        <NavItem to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} onClick={closeMobile} />
      </nav>
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
