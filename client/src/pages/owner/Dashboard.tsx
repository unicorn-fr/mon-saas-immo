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

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
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
  const estimatedYield    = monthlyRevenue > 0 ? ((annualRevenue / (monthlyRevenue * 200)) * 100).toFixed(1) : '—'
  const cashflow          = monthlyRevenue

  const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
    AVAILABLE: { label: 'Disponible',  bg: '#f0fdf4', text: '#15803d' },
    OCCUPIED:  { label: 'En location', bg: '#eff6ff', text: '#1d4ed8' },
    RESERVED:  { label: 'Réservé',     bg: '#fffbeb', text: '#b45309' },
    DRAFT:     { label: 'Hors marché', bg: '#f5f5f7', text: '#64748b' },
  }

  const getContractStatusLabel = (status: string) => ({
    DRAFT: 'Brouillon', SENT: 'Envoyé', SIGNED_OWNER: 'En signature',
    SIGNED_TENANT: 'À signer', COMPLETED: 'Signé', ACTIVE: 'Actif',
    EXPIRED: 'Expiré', TERMINATED: 'Résilié',
  }[status] || status)

  const kpis = [
    {
      label: 'Cash-flow mensuel',
      value: `${monthlyRevenue.toLocaleString('fr-FR')} €`,
      sub: `${annualRevenue.toLocaleString('fr-FR')} € / an`,
      icon: <Euro className="w-5 h-5" style={{ color: '#007AFF' }} />,
      to: undefined as string | undefined,
    },
    {
      label: "Taux d'occupation",
      value: `${occupancyRate}%`,
      sub: `${occupiedProps} loué${occupiedProps > 1 ? 's' : ''} / ${totalProps} biens`,
      icon: <Percent className="w-5 h-5" style={{ color: '#007AFF' }} />,
      to: '/properties/owner/me',
    },
    {
      label: 'Rendement estimé',
      value: monthlyRevenue > 0 ? `${estimatedYield}%` : '—',
      sub: 'Voir simulateur →',
      icon: <TrendingUp className="w-5 h-5" style={{ color: '#007AFF' }} />,
      to: '/calculateur',
    },
    {
      label: 'Candidatures',
      value: String(pendingApps.length),
      sub: pendingApps.length > 0 ? 'En attente de traitement' : 'Aucune en attente',
      icon: <ClipboardList className="w-5 h-5" style={{ color: '#007AFF' }} />,
      to: '/applications/manage',
    },
  ]

  if (isLoading && !statistics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#007AFF' }} />
        </div>
      </Layout>
    )
  }

  if (totalProps === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#f5f5f7' }}>
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#e8f0fe' }}>
              <Home className="w-10 h-10" style={{ color: '#007AFF' }} />
            </div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#1d1d1f' }}>Bienvenue sur votre espace !</h2>
            <p className="mb-8" style={{ color: '#515154' }}>
              Ajoutez votre première propriété pour commencer à gérer vos locations.
            </p>
            <Link to="/properties/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#007AFF' }}>
              <Plus className="w-5 h-5" /> Ajouter ma première propriété
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#f5f5f7' }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#86868b' }}>
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
              <h1 className="text-2xl font-extrabold" style={{ color: '#1d1d1f' }}>
                Tableau de bord
              </h1>
            </div>
            <Link to="/properties/new"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#007AFF', boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}>
              <Plus className="w-4 h-4" /> Nouveau bien
            </Link>
          </div>

          {/* Alertes */}
          {(urgentContracts.length > 0 || pendingApps.length > 0 || drafts > 0) && (
            <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-center"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderLeft: '3px solid #f59e0b',
              }}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#b45309' }} />
                <p className="text-sm font-semibold" style={{ color: '#b45309' }}>Actions requises</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {urgentContracts.length > 0 && (
                  <Link to="/contracts"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: '#f59e0b' }}>
                    <PenLine className="w-3.5 h-3.5" />
                    {urgentContracts.length} contrat{urgentContracts.length > 1 ? 's' : ''} à signer
                  </Link>
                )}
                {pendingApps.length > 0 && (
                  <Link to="/applications/manage"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: '#007AFF' }}>
                    <ClipboardList className="w-3.5 h-3.5" />
                    {pendingApps.length} candidature{pendingApps.length > 1 ? 's' : ''} en attente
                  </Link>
                )}
                {drafts > 0 && (
                  <Link to="/contracts"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-px"
                    style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {drafts} brouillon{drafts > 1 ? 's' : ''} à finaliser
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => {
              const inner = (
                <div className="rounded-2xl p-5 flex flex-col gap-3 h-full transition-all duration-200 hover:-translate-y-0.5 group"
                  style={{
                    ...cardStyle,
                    borderTop: '3px solid #007AFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
                  }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                      {kpi.icon}
                    </div>
                    {kpi.to && (
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: '#86868b' }} />
                    )}
                  </div>
                  <div className="mt-auto">
                    <p className="text-2xl font-extrabold leading-none tracking-tight mb-1" style={{ color: '#1d1d1f' }}>
                      {kpi.value}
                    </p>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#515154' }}>{kpi.label}</p>
                    <p className="text-xs" style={{ color: '#86868b' }}>{kpi.sub}</p>
                  </div>
                </div>
              )
              return kpi.to ? (
                <Link key={kpi.label} to={kpi.to} className="block" style={{ animationDelay: `${i * 55}ms` }}>{inner}</Link>
              ) : (
                <div key={kpi.label} style={{ animationDelay: `${i * 55}ms` }}>{inner}</div>
              )
            })}
          </div>

          {/* Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Colonne principale (2/3) */}
            <div className="lg:col-span-2 space-y-5">

              {/* Mes propriétés */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #d2d2d7' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                      <Home className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: '#1d1d1f' }}>Mes propriétés</span>
                  </div>
                  <Link to="/properties/owner/me"
                    className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: '#007AFF' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  {myProperties.slice(0, 5).map((property) => {
                    const badge = statusBadge[property.status] || statusBadge['DRAFT']
                    return (
                      <button key={property.id} onClick={() => navigate(`/properties/${property.id}`)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                        style={{ borderBottom: '1px solid #f0f0f2' }}>
                        <img src={property.images[0] || '/placeholder-property.jpg'} alt={property.title}
                          className="w-12 h-10 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1d1d1f' }}>
                            {property.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#86868b' }}>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{property.city}</span>
                            <span className="flex-shrink-0">· {property.bedrooms}ch · {property.surface}m²</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <p className="font-bold text-sm" style={{ color: '#007AFF' }}>
                            {property.price} <span className="font-normal text-xs" style={{ color: '#86868b' }}>€/mois</span>
                          </p>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: badge.bg, color: badge.text }}>
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="px-5 py-3" style={{ borderTop: '1px solid #d2d2d7' }}>
                  <Link to="/properties/new"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-[#e8f0fe]"
                    style={{ color: '#007AFF' }}>
                    <Plus className="w-3.5 h-3.5" /> Ajouter un bien
                  </Link>
                </div>
              </div>

              {/* Candidatures en attente */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #d2d2d7' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                      <ClipboardList className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: '#1d1d1f' }}>Candidatures</span>
                    {pendingApps.length > 0 && (
                      <span className="text-xs font-bold text-white rounded-full px-2 py-0.5"
                        style={{ background: '#007AFF' }}>
                        {pendingApps.length}
                      </span>
                    )}
                  </div>
                  <Link to="/applications/manage"
                    className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#007AFF' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {pendingApps.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: '#f5f5f7' }}>
                      <Users className="w-5 h-5" style={{ color: '#86868b' }} />
                    </div>
                    <p className="text-sm" style={{ color: '#515154' }}>Aucune candidature en attente</p>
                  </div>
                ) : (
                  <div>
                    {pendingApps.slice(0, 4).map((app) => (
                      <div key={app.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                        style={{ borderBottom: '1px solid #f0f0f2' }}>
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="16" strokeWidth="3" fill="none" stroke="#d2d2d7" />
                            <circle cx="20" cy="20" r="16" strokeWidth="3" className="fill-none"
                              style={{
                                stroke: app.score >= 70 ? '#16a34a' : app.score >= 40 ? '#d97706' : '#dc2626',
                                strokeDasharray: 2 * Math.PI * 16,
                                strokeDashoffset: 2 * Math.PI * 16 * (1 - app.score / 100),
                                strokeLinecap: 'round',
                                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)',
                              }} />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${scoreColor(app.score)}`}>{app.score}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1d1d1f' }}>
                            {app.tenant?.firstName} {app.tenant?.lastName}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#86868b' }}>
                            {app.property?.title} · {format(new Date(app.createdAt), 'd MMM', { locale: fr })}
                          </p>
                        </div>
                        <Link to="/applications/manage"
                          className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-xl flex-shrink-0 transition-all hover:-translate-y-px"
                          style={{ background: '#007AFF' }}>
                          <Zap className="w-3 h-3" /> Traiter
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contrats récents */}
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #d2d2d7' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
                      <FileText className="w-4 h-4" style={{ color: '#007AFF' }} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: '#1d1d1f' }}>Contrats récents</span>
                  </div>
                  <Link to="/contracts"
                    className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#007AFF' }}>
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {contracts.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f5f5f7' }}>
                      <FileText className="w-5 h-5" style={{ color: '#86868b' }} />
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#515154' }}>Aucun contrat</p>
                    <Link to="/contracts/new"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-xl"
                      style={{ background: '#007AFF' }}>
                      <Plus className="w-3.5 h-3.5" /> Créer un contrat
                    </Link>
                  </div>
                ) : (
                  <div>
                    {contracts.slice(0, 4).map((contract) => (
                      <button key={contract.id} onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                        style={{ borderBottom: '1px solid #f0f0f2' }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1d1d1f' }}>
                            {contract.property?.title || 'Contrat'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#86868b' }}>
                            {contract.tenant?.firstName} {contract.tenant?.lastName} · {contract.monthlyRent} €/mois
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={
                            contract.status === 'ACTIVE'        ? { background: '#f0fdf4', color: '#15803d' } :
                            contract.status === 'DRAFT'         ? { background: '#fffbeb', color: '#b45309' } :
                            contract.status === 'SIGNED_TENANT' ? { background: '#fff7ed', color: '#c2410c' } :
                            { background: '#e8f0fe', color: '#0055b3' }
                          }>
                          {getContractStatusLabel(contract.status)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar droite (1/3) */}
            <div className="space-y-4">

              {/* Actions rapides */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#86868b' }}>
                  Actions rapides
                </p>
                <div className="space-y-2">
                  <button onClick={() => navigate('/properties/new')}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
                    style={{ background: '#007AFF', boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}>
                    <Plus className="w-4 h-4" /> Ajouter un bien
                  </button>
                  {[
                    { label: 'Nouveau contrat',  icon: <FileText className="w-3.5 h-3.5" />,      to: '/contracts/new' },
                    { label: 'Gérer les visites', icon: <CalendarCheck className="w-3.5 h-3.5" />, to: '/bookings/manage' },
                    { label: 'Messages',          icon: <MessageSquare className="w-3.5 h-3.5" />, to: '/messages', badge: unreadCount > 0 ? unreadCount : undefined },
                  ].map(({ label, icon, to, badge }) => (
                    <button key={label} onClick={() => navigate(to)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-slate-50 hover:-translate-y-px"
                      style={{ background: '#ffffff', border: '1px solid #d2d2d7', color: '#515154' }}>
                      <span style={{ color: '#86868b' }}>{icon}</span>
                      {label}
                      {badge !== undefined && (
                        <span className="ml-auto text-xs font-bold text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                          style={{ background: '#007AFF' }}>{badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parc immobilier */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#86868b' }}>
                  Parc immobilier
                </p>
                <div className="space-y-3 mb-3">
                  {[
                    { label: 'En location',  value: occupiedProps,                              color: '#007AFF', pct: totalProps > 0 ? (occupiedProps/totalProps)*100 : 0 },
                    { label: 'Disponibles',  value: availableProps,                             color: '#16a34a', pct: totalProps > 0 ? (availableProps/totalProps)*100 : 0 },
                    { label: 'Hors marché',  value: totalProps - occupiedProps - availableProps, color: '#86868b', pct: totalProps > 0 ? ((totalProps-occupiedProps-availableProps)/totalProps)*100 : 0 },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-xs" style={{ color: '#515154' }}>{label}</span>
                        </div>
                        <span className="font-bold text-sm" style={{ color }}>{value}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#f0f0f2' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #d2d2d7' }}>
                  <span className="text-xs font-medium" style={{ color: '#515154' }}>Total</span>
                  <span className="font-bold text-sm" style={{ color: '#1d1d1f' }}>{totalProps} bien{totalProps > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Finance résumé */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#86868b' }}>Finance</p>
                  <Link to="/calculateur"
                    className="text-xs font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
                    style={{ color: '#007AFF' }}>
                    Simulateur <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Revenus / an',     value: `${annualRevenue.toLocaleString('fr-FR')} €`,  icon: <Banknote className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                    { label: 'Cash-flow / mois',  value: `${cashflow.toLocaleString('fr-FR')} €`,      icon: <Euro className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                    { label: 'Rendement',          value: `${estimatedYield}%`,                          icon: <TrendingUp className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>{icon}</div>
                        <span className="text-xs" style={{ color: '#515154' }}>{label}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: '#1d1d1f' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activité */}
              <div className="rounded-2xl p-5" style={cardStyle}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#86868b' }}>Activité</p>
                <div className="space-y-3">
                  {[
                    ...(statistics ? [
                      { label: 'Vues annonces',  value: statistics.totalViews || 0,    icon: <Eye className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                      { label: 'Contacts reçus', value: statistics.totalContacts || 0, icon: <Users className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                    ] : []),
                    ...(contractStats ? [
                      { label: 'Contrats actifs',  value: contractStats.active || 0,  icon: <FileText className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                      { label: 'En signature',     value: pendingSignatures,           icon: <PenLine className="w-3.5 h-3.5" style={{ color: '#007AFF' }} /> },
                    ] : []),
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e8f0fe' }}>{icon}</div>
                        <span className="text-xs" style={{ color: '#515154' }}>{label}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: '#1d1d1f' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
