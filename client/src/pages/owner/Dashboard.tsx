import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useMessages } from '../../hooks/useMessages'
import { applicationService } from '../../services/application.service'
import { Layout } from '../../components/layout/Layout'
import {
  Home, Plus, Eye, MessageSquare, TrendingUp,
  Euro, ArrowRight, MapPin, FileText, PenLine,
  AlertTriangle, CalendarCheck, Percent, Users, ChevronRight,
  ClipboardList, Zap, Banknote, ArrowUpRight,
} from 'lucide-react'
import { scoreColor } from '../../utils/matchingEngine'
import type { Application } from '../../types/application.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiCard {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  gradient?: string
  iconGradient?: string
  accent?: string
  to?: string
  live?: boolean
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { statistics, myProperties, fetchMyStatistics, fetchMyProperties, isLoading } = useProperties()
  const { contracts, statistics: contractStats, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()
  const { unreadCount, fetchUnreadCount } = useMessages()
  const [pendingApps, setPendingApps] = useState<Application[]>([])

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 6 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
    fetchUnreadCount()
    applicationService.list().then((apps) => {
      setPendingApps(apps.filter((a) => a.status === 'PENDING'))
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Données dérivées ────────────────────────────────────────────────────────
  const activeContracts   = contracts.filter((c) => c.status === 'ACTIVE')
  const monthlyRevenue    = activeContracts.reduce((sum, c) => sum + c.monthlyRent + (c.charges || 0), 0)
  const annualRevenue     = monthlyRevenue * 12
  const totalProps        = statistics?.totalProperties || 0
  const occupiedProps     = statistics?.occupiedProperties || 0
  const availableProps    = statistics?.availableProperties || 0
  const occupancyRate     = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0
  const pendingSignatures = (contractStats?.sent || 0) + (contractStats?.completed || 0)
  const drafts            = contractStats?.draft || 0
  const urgentContracts   = contracts.filter((c) => c.status === 'SIGNED_TENANT')

  // Finance KPIs
  // Rendement brut estimé (loyers annuels / valeur estimée portefeuille — on utilise x200 comme proxy)
  const estimatedYield = monthlyRevenue > 0 ? ((annualRevenue / (monthlyRevenue * 200)) * 100).toFixed(1) : '—'
  const cashflow = monthlyRevenue // simplifié; charges déjà incluses dans monthlyRent+charges

  const statusBadge: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    AVAILABLE: { label: 'Disponible',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    OCCUPIED:  { label: 'En location',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
    RESERVED:  { label: 'Réservé',      bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    DRAFT:     { label: 'Hors marché',  bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400'   },
  }

  const getContractStatusLabel = (status: string) => ({
    DRAFT: 'Brouillon', SENT: 'Envoyé', SIGNED_OWNER: 'En signature',
    SIGNED_TENANT: '⚡ À signer', COMPLETED: 'Signé', ACTIVE: 'Actif',
    EXPIRED: 'Expiré', TERMINATED: 'Résilié',
  }[status] || status)

  const kpis: KpiCard[] = [
    {
      label: 'Cash-flow mensuel',
      value: `${monthlyRevenue.toLocaleString('fr-FR')} €`,
      sub: `${annualRevenue.toLocaleString('fr-FR')} € / an`,
      icon: <Euro className="w-5 h-5 text-white" />,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 60%, #7c3aed 100%)',
      live: true,
    },
    {
      label: "Taux d'occupation",
      value: `${occupancyRate}%`,
      sub: `${occupiedProps} loué${occupiedProps > 1 ? 's' : ''} / ${totalProps} biens`,
      icon: <Percent className="w-4 h-4 text-white" />,
      iconGradient: 'linear-gradient(135deg, #10b981, #059669)',
      accent: 'linear-gradient(90deg, #10b981, #06b6d4)',
      to: '/properties/owner/me',
    },
    {
      label: 'Rendement estimé',
      value: monthlyRevenue > 0 ? `${estimatedYield}%` : '—',
      sub: 'Voir simulateur →',
      icon: <TrendingUp className="w-4 h-4 text-white" />,
      iconGradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      accent: 'linear-gradient(90deg, #3b82f6, #7c3aed)',
      to: '/calculateur',
    },
    {
      label: 'Candidatures',
      value: String(pendingApps.length),
      sub: pendingApps.length > 0 ? 'En attente de traitement' : 'Aucune en attente',
      icon: <ClipboardList className="w-4 h-4 text-white" />,
      iconGradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
      accent: 'linear-gradient(90deg, #7c3aed, #d946ef)',
      to: '/applications/manage',
      live: pendingApps.length > 0,
    },
  ]

  if (isLoading && !statistics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  if (totalProps === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)' }}>
              <Home className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Bienvenue sur votre espace !</h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Ajoutez votre première propriété pour commencer à gérer vos locations.
            </p>
            <Link to="/properties/new" className="btn-cyan-gradient inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Ajouter ma première propriété
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-5 px-4 md:px-6 space-y-5 page-enter">

          {/* ── EN-TÊTE ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between animate-fade-up">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'var(--text-tertiary)', letterSpacing: '0.10em' }}>
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Tableau de bord
              </h1>
            </div>
            <Link to="/properties/new"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shimmer-btn"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                boxShadow: '0 4px 14px rgba(6,182,212,0.38)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}>
              <Plus className="w-4 h-4" /> Nouveau bien
            </Link>
          </div>

          {/* ── ALERTES ─────────────────────────────────────────── */}
          {(urgentContracts.length > 0 || pendingApps.length > 0 || drafts > 0) && (
            <div className="rounded-2xl p-3.5 flex flex-wrap gap-3 items-center animate-fade-up delay-50"
              style={{
                background: 'rgba(249,115,22,0.07)',
                border: '1px solid rgba(249,115,22,0.18)',
                borderLeft: '3px solid #f97316',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="live-dot" style={{ background: '#f97316', boxShadow: '0 0 0 0 rgba(249,115,22,0.45)' }} />
                <p className="text-sm font-semibold text-orange-700">Actions requises</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {urgentContracts.length > 0 && (
                  <Link to="/contracts" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}>
                    <PenLine className="w-3.5 h-3.5" />
                    {urgentContracts.length} contrat{urgentContracts.length > 1 ? 's' : ''} à signer
                  </Link>
                )}
                {pendingApps.length > 0 && (
                  <Link to="/applications/manage" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                    <ClipboardList className="w-3.5 h-3.5" />
                    {pendingApps.length} candidature{pendingApps.length > 1 ? 's' : ''} en attente
                  </Link>
                )}
                {drafts > 0 && (
                  <Link to="/contracts" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-px"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {drafts} brouillon{drafts > 1 ? 's' : ''} à finaliser
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── KPIs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {kpis.map((kpi, i) => {
              const inner = kpi.gradient ? (
                /* ── KPI Hero (gradient) ── */
                <div className="relative rounded-[18px] p-4 flex flex-col gap-3 h-full overflow-hidden shimmer-btn"
                  style={{
                    background: kpi.gradient,
                    boxShadow: '0 8px 32px rgba(6,182,212,0.28), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.30)',
                    border: '1px solid rgba(255,255,255,0.22)',
                  }}>
                  {/* Reflet interne */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)' }} />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="icon-box" style={{ background: 'rgba(255,255,255,0.22)' }}>
                      {kpi.icon}
                    </div>
                    {kpi.live && <span className="live-dot" />}
                  </div>
                  <div className="relative z-10 mt-auto">
                    <p className="text-[26px] font-extrabold leading-none text-white tracking-tight mb-1">
                      {kpi.value}
                    </p>
                    <p className="text-xs font-semibold text-white/75 mb-0.5">{kpi.label}</p>
                    <p className="text-[11px] text-white/55">{kpi.sub}</p>
                  </div>
                </div>
              ) : (
                /* ── KPI Glass ── */
                <div className="kpi-card flex flex-col gap-3 h-full group"
                  style={{ '--kpi-accent': kpi.accent } as React.CSSProperties}>
                  <div className="flex items-start justify-between">
                    <div className="icon-box" style={{ background: kpi.iconGradient }}>
                      {kpi.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {kpi.live && <span className="live-dot-violet" style={{ width: 7, height: 7 }} />}
                      {kpi.to && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[26px] font-extrabold leading-none tracking-tight mb-1 animate-count-up"
                      style={{ color: 'var(--text-primary)', animationDelay: `${i * 60}ms` }}>
                      {kpi.value}
                    </p>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{kpi.sub}</p>
                  </div>
                </div>
              )
              return kpi.to ? (
                <Link key={kpi.label} to={kpi.to} className="block animate-fade-up" style={{ animationDelay: `${i * 55}ms` }}>{inner}</Link>
              ) : (
                <div key={kpi.label} className="animate-fade-up" style={{ animationDelay: `${i * 55}ms` }}>{inner}</div>
              )
            })}
          </div>

          {/* ── CONTENU PRINCIPAL ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up delay-200">

            {/* ── Colonne principale (2/3) ──────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Mes propriétés */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box w-7 h-7" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', width: 28, height: 28, borderRadius: 8 }}>
                      <Home className="w-3.5 h-3.5 text-white" />
                    </div>
                    Mes propriétés
                  </span>
                  <Link to="/properties/owner/me" className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: '#7c3aed' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                  {myProperties.slice(0, 5).map((property) => {
                    const badge = statusBadge[property.status] || statusBadge['DRAFT']
                    return (
                      <button key={property.id} onClick={() => navigate(`/properties/${property.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-white/5"
                        style={{ transition: 'background 0.15s ease' }}>
                        <img src={property.images[0] || '/placeholder-property.jpg'} alt={property.title}
                          className="w-12 h-10 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {property.title}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{property.city}</span>
                            <span className="flex-shrink-0">· {property.bedrooms}ch · {property.surface}m²</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="font-bold text-sm" style={{ color: '#7c3aed' }}>{property.price} <span className="font-normal text-[11px]" style={{ color: 'var(--text-tertiary)' }}>€/mois</span></p>
                          <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />{badge.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="p-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                  <Link to="/properties/new"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-violet-500/10"
                    style={{ color: '#7c3aed' }}>
                    <Plus className="w-3.5 h-3.5" /> Ajouter un bien
                  </Link>
                </div>
              </div>

              {/* Candidatures en attente */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box" style={{ background: 'linear-gradient(135deg,#7c3aed,#d946ef)', width: 28, height: 28, borderRadius: 8 }}>
                      <ClipboardList className="w-3.5 h-3.5 text-white" />
                    </div>
                    Candidatures
                    {pendingApps.length > 0 && (
                      <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#d946ef)' }}>
                        {pendingApps.length}
                      </span>
                    )}
                  </span>
                  <Link to="/applications/manage" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#7c3aed' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {pendingApps.length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'var(--surface-subtle)' }}>
                      <Users className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune candidature en attente</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {pendingApps.slice(0, 4).map((app) => (
                      <div key={app.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        {/* Score ring */}
                        <div className="relative w-9 h-9 flex-shrink-0">
                          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" strokeWidth="3" fill="none" style={{ stroke: 'var(--glass-border)' }} />
                            <circle cx="18" cy="18" r="14" strokeWidth="3" className="fill-none"
                              style={{
                                stroke: app.score >= 70 ? '#10b981' : app.score >= 40 ? '#f59e0b' : '#ef4444',
                                strokeDasharray: 2 * Math.PI * 14,
                                strokeDashoffset: 2 * Math.PI * 14 * (1 - app.score / 100),
                                strokeLinecap: 'round',
                                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)',
                              }} />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${scoreColor(app.score)}`}>{app.score}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {app.tenant?.firstName} {app.tenant?.lastName}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                            {app.property?.title} · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                          </p>
                        </div>
                        <Link to="/applications/manage"
                          className="flex items-center gap-1 text-[11px] font-semibold text-white px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all hover:-translate-y-px shimmer-btn"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                          <Zap className="w-3 h-3" /> Traiter
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contrats récents */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <div className="section-header">
                  <span className="section-header-title">
                    <div className="icon-box" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', width: 28, height: 28, borderRadius: 8 }}>
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    Contrats récents
                  </span>
                  <Link to="/contracts" className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#7c3aed' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--surface-subtle)' }}>
                      <FileText className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Aucun contrat</p>
                    <Link to="/contracts/new" className="btn btn-primary inline-flex text-xs"><Plus className="w-3.5 h-3.5 mr-1.5" /> Créer un contrat</Link>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {contracts.slice(0, 4).map((contract) => (
                      <button key={contract.id} onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {contract.property?.title || 'Contrat'}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {contract.tenant?.firstName} {contract.tenant?.lastName} · {contract.monthlyRent} €/mois
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          contract.status === 'ACTIVE'        ? 'bg-emerald-100 text-emerald-700' :
                          contract.status === 'DRAFT'         ? 'bg-amber-100 text-amber-700' :
                          contract.status === 'SIGNED_TENANT' ? 'bg-orange-100 text-orange-700' :
                          'bg-violet-100 text-violet-700'
                        }`}>
                          {getContractStatusLabel(contract.status)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Sidebar droite (1/3) ──────────────────────────── */}
            <div className="space-y-4">

              {/* Actions rapides */}
              <div className="rounded-2xl p-4" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  Actions rapides
                </p>
                <div className="space-y-2">
                  <button onClick={() => navigate('/properties/new')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white shimmer-btn transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}>
                    <Plus className="w-4 h-4" /> Ajouter un bien
                  </button>
                  {[
                    { label: 'Nouveau contrat', icon: <FileText className="w-3.5 h-3.5" />, to: '/contracts/new' },
                    { label: 'Gérer les visites', icon: <CalendarCheck className="w-3.5 h-3.5" />, to: '/bookings/manage' },
                    { label: 'Messages', icon: <MessageSquare className="w-3.5 h-3.5" />, to: '/messages', badge: unreadCount > 0 ? unreadCount : undefined },
                  ].map(({ label, icon, to, badge }) => (
                    <button key={label} onClick={() => navigate(to)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-px"
                      style={{
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                      }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
                      {label}
                      {badge !== undefined && (
                        <span className="ml-auto text-[11px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>{badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parc immobilier */}
              <div className="rounded-2xl p-4" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>
                  Parc immobilier
                </p>
                <div className="space-y-3 mb-3">
                  {[
                    { label: 'En location',  value: occupiedProps,                              color: '#3b82f6', pct: totalProps > 0 ? (occupiedProps/totalProps)*100 : 0 },
                    { label: 'Disponibles',  value: availableProps,                             color: '#10b981', pct: totalProps > 0 ? (availableProps/totalProps)*100 : 0 },
                    { label: 'Hors marché',  value: totalProps - occupiedProps - availableProps, color: '#94a3b8', pct: totalProps > 0 ? ((totalProps-occupiedProps-availableProps)/totalProps)*100 : 0 },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <span className="font-bold text-sm" style={{ color }}>{value}</span>
                      </div>
                      {/* Progress bar gradient */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-subtle)' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{totalProps} bien{totalProps > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Finance résumé */}
              <div className="rounded-2xl p-4" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>Finance</p>
                  <Link to="/calculateur" className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity" style={{ color: '#7c3aed' }}>
                    Simulateur <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Revenus / an',    value: `${annualRevenue.toLocaleString('fr-FR')} €`, iconBg: 'linear-gradient(135deg,#10b981,#059669)', icon: <Banknote className="w-3 h-3 text-white" /> },
                    { label: 'Cash-flow / mois', value: `${cashflow.toLocaleString('fr-FR')} €`,    iconBg: 'linear-gradient(135deg,#3b82f6,#6366f1)', icon: <Euro className="w-3 h-3 text-white" /> },
                    { label: 'Rendement',        value: `${estimatedYield}%`,                         iconBg: 'linear-gradient(135deg,#7c3aed,#a855f7)', icon: <TrendingUp className="w-3 h-3 text-white" /> },
                  ].map(({ label, value, iconBg, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="icon-box" style={{ background: iconBg, width: 26, height: 26, borderRadius: 8 }}>{icon}</div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats annonces + contrats regroupés */}
              <div className="rounded-2xl p-4" style={{
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-reflection), 0 8px 32px rgba(0,0,0,0.07)',
              }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>Activité</p>
                <div className="space-y-2">
                  {[
                    ...(statistics ? [
                      { label: 'Vues annonces',  value: statistics.totalViews || 0,    color: '#7c3aed', icon: <Eye className="w-3 h-3 text-white" />, iconBg: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
                      { label: 'Contacts reçus', value: statistics.totalContacts || 0, color: '#10b981', icon: <Users className="w-3 h-3 text-white" />, iconBg: 'linear-gradient(135deg,#10b981,#059669)' },
                    ] : []),
                    ...(contractStats ? [
                      { label: 'Contrats actifs',  value: contractStats.active || 0,  color: '#10b981', icon: <FileText className="w-3 h-3 text-white" />, iconBg: 'linear-gradient(135deg,#10b981,#059669)' },
                      { label: 'En signature',     value: pendingSignatures,           color: '#f59e0b', icon: <PenLine className="w-3 h-3 text-white" />, iconBg: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
                    ] : []),
                  ].map(({ label, value, iconBg, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="icon-box" style={{ background: iconBg, width: 26, height: 26, borderRadius: 8 }}>{icon}</div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>
    </Layout>
  )
}
