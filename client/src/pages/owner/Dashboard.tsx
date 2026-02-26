import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { Layout } from '../../components/layout/Layout'
import {
  Home,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Clock,
  Euro,
  ArrowRight,
  MapPin,
  Bed,
  Square,
  FileText,
  Send,
  PenLine,
  AlertTriangle,
  CalendarCheck,
  Percent,
  Users,
  ChevronRight,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { statistics, myProperties, fetchMyStatistics, fetchMyProperties, isLoading } = useProperties()
  const { contracts, statistics: contractStats, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 6 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Données dérivées ─────────────────────────────────────────────────────
  const activeContracts   = contracts.filter((c) => c.status === 'ACTIVE')
  const pendingContracts  = contracts.filter((c) => ['SENT','SIGNED_OWNER','SIGNED_TENANT','COMPLETED'].includes(c.status))
  const monthlyRevenue    = activeContracts.reduce((sum, c) => sum + c.monthlyRent + (c.charges || 0), 0)
  const annualRevenue     = monthlyRevenue * 12

  const totalProps    = statistics?.totalProperties || 0
  const occupiedProps = statistics?.occupiedProperties || 0
  const availableProps = statistics?.availableProperties || 0
  const occupancyRate = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0

  const pendingSignatures = (contractStats?.sent || 0) + (contractStats?.completed || 0)
  const drafts            = contractStats?.draft || 0

  // Alertes urgentes : signées côté locataire → attente propriétaire
  const urgentContracts = contracts.filter((c) => c.status === 'SIGNED_TENANT')

  // Statuts des biens
  const statusBadge: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    AVAILABLE: { label: 'Disponible',   bg: 'bg-success-100',  text: 'text-success-700',  dot: 'bg-success-500'  },
    OCCUPIED:  { label: 'En location',  bg: 'bg-blue-100',     text: 'text-blue-700',     dot: 'bg-blue-500'     },
    RESERVED:  { label: 'Réservé',      bg: 'bg-warning-100',  text: 'text-warning-700',  dot: 'bg-warning-500'  },
    DRAFT:     { label: 'Hors marché',  bg: 'bg-slate-100',    text: 'text-slate-500',    dot: 'bg-slate-400'    },
  }

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':        return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'DRAFT':         return <Clock className="w-4 h-4 text-warning-500" />
      case 'SENT':          return <Send className="w-4 h-4 text-blue-500" />
      case 'SIGNED_TENANT': return <PenLine className="w-4 h-4 text-orange-500" />
      case 'SIGNED_OWNER':
      case 'COMPLETED':     return <PenLine className="w-4 h-4 text-primary-500" />
      default:              return <FileText className="w-4 h-4 text-slate-400" />
    }
  }

  const getContractStatusLabel = (status: string) => ({
    DRAFT: 'Brouillon', SENT: 'Envoyé', SIGNED_OWNER: 'En signature',
    SIGNED_TENANT: '⚡ Signer maintenant', COMPLETED: 'Signé', ACTIVE: 'Actif',
    EXPIRED: 'Expiré', TERMINATED: 'Résilié',
  }[status] || status)

  if (isLoading && !statistics) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (totalProps === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)' }}>
              <Home className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Bienvenue sur votre espace propriétaire !</h2>
            <p className="text-slate-500 mb-8">
              Ajoutez votre première propriété pour commencer à gérer vos locations et visualiser vos statistiques.
            </p>
            <Link to="/properties/new" className="btn-cyan-gradient inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter ma première propriété
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">

        {/* ── EN-TÊTE ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Tableau de bord
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Vue d'ensemble de votre portefeuille locatif
            </p>
          </div>
          <Link to="/properties/new" className="btn-cyan-gradient hidden md:inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau bien
          </Link>
        </div>

        {/* ── BANNIÈRE D'ALERTES URGENTES ──────────────────────────────── */}
        {(urgentContracts.length > 0 || pendingSignatures > 0 || drafts > 0) && (
          <div className="rounded-2xl border-l-4 border-l-orange-500 p-4 flex flex-wrap gap-3 items-center"
            style={{ backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.15)', borderLeftColor: '#f97316' }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
              <p className="text-sm font-semibold text-orange-700">Actions requises</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgentContracts.length > 0 && (
                <Link to="/contracts"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors">
                  <PenLine className="w-3.5 h-3.5" />
                  {urgentContracts.length} contrat{urgentContracts.length > 1 ? 's' : ''} à signer
                </Link>
              )}
              {pendingSignatures > 0 && urgentContracts.length === 0 && (
                <Link to="/contracts"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                  {pendingSignatures} en attente de signature
                </Link>
              )}
              {drafts > 0 && (
                <Link to="/contracts"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-100 text-warning-700 rounded-lg text-xs font-semibold hover:bg-warning-200 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {drafts} brouillon{drafts > 1 ? 's' : ''} à finaliser
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── KPIs — 4 cartes ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Revenus mensuels */}
          <div className="rounded-2xl p-5 text-white col-span-2 lg:col-span-1"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 60%, #7c3aed 100%)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Euro className="w-5 h-5" />
              </div>
              <span className="text-white/70 text-xs font-medium">/ mois</span>
            </div>
            <p className="text-2xl font-extrabold leading-none mb-1">
              {monthlyRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
            </p>
            <p className="text-white/70 text-xs">{annualRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / an</p>
          </div>

          {/* Taux occupation */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-success-100 rounded-xl flex items-center justify-center">
                <Percent className="w-4.5 h-4.5 text-success-600" />
              </div>
              <button onClick={() => navigate('/properties/owner/me')}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                Voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-2xl font-extrabold leading-none mb-1" style={{ color: 'var(--text-primary)' }}>
              {occupancyRate}%
            </p>
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              {occupiedProps} loué{occupiedProps > 1 ? 's' : ''} / {totalProps} biens
            </p>
            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--surface-subtle)' }}>
              <div className="h-1.5 rounded-full bg-success-500 transition-all" style={{ width: `${occupancyRate}%` }} />
            </div>
          </div>

          {/* Biens disponibles */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Home className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{totalProps} total</span>
            </div>
            <p className="text-2xl font-extrabold leading-none mb-1" style={{ color: 'var(--text-primary)' }}>
              {availableProps}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              bien{availableProps > 1 ? 's' : ''} disponible{availableProps > 1 ? 's' : ''}
            </p>
          </div>

          {/* Contrats actifs */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-4.5 h-4.5 text-primary-600" />
              </div>
              <button onClick={() => navigate('/contracts')}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                Voir <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-2xl font-extrabold leading-none mb-1" style={{ color: 'var(--text-primary)' }}>
              {activeContracts.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              contrat{activeContracts.length > 1 ? 's' : ''} actif{activeContracts.length > 1 ? 's' : ''}
              {pendingContracts.length > 0 && <span className="text-warning-600 font-medium"> · {pendingContracts.length} en cours</span>}
            </p>
          </div>
        </div>

        {/* ── CONTENU PRINCIPAL ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COLONNE PRINCIPALE (2/3) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Mes biens — statuts en un coup d'œil */}
            <div className="rounded-2xl border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  Mes propriétés
                </h2>
                <Link to="/properties/owner/me"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  Tout voir <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {myProperties.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <Home className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Aucune propriété pour le moment</p>
                    <Link to="/properties/new" className="btn btn-primary inline-flex">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter un bien
                    </Link>
                  </div>
                ) : (
                  myProperties.slice(0, 5).map((property) => {
                    const badge = statusBadge[property.status] || statusBadge['DRAFT']
                    return (
                      <button
                        key={property.id}
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50 group"
                      >
                        <img
                          src={property.images[0] || '/placeholder-property.jpg'}
                          alt={property.title}
                          className="w-16 h-14 rounded-xl object-cover flex-shrink-0 group-hover:scale-[1.02] transition-transform"
                          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-primary-600 transition-colors"
                            style={{ color: 'var(--text-primary)' }}>
                            {property.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs mt-0.5 mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{property.city}, {property.postalCode}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{property.bedrooms} ch.</span>
                            <span className="flex items-center gap-0.5"><Square className="w-3 h-3" />{property.surface}m²</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="font-bold text-sm text-primary-600">{property.price}€<span className="font-normal text-xs text-slate-400">/mois</span></p>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Contrats récents */}
            <div className="rounded-2xl border" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FileText className="w-4.5 h-4.5 text-primary-600" />
                  Contrats récents
                </h2>
                <Link to="/contracts"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  Tout voir <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {contracts.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Aucun contrat pour le moment</p>
                  <Link to="/contracts/new" className="btn btn-primary inline-flex">
                    <Plus className="w-4 h-4 mr-2" /> Créer un contrat
                  </Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {contracts.slice(0, 4).map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex-shrink-0">{getContractStatusIcon(contract.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary-600 transition-colors"
                          style={{ color: 'var(--text-primary)' }}>
                          {contract.property?.title || 'Contrat'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {contract.tenant?.firstName} {contract.tenant?.lastName} · {contract.monthlyRent}€/mois
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        contract.status === 'ACTIVE'        ? 'bg-success-100 text-success-700' :
                        contract.status === 'DRAFT'         ? 'bg-warning-100 text-warning-700' :
                        contract.status === 'SIGNED_TENANT' ? 'bg-orange-100 text-orange-700' :
                        'bg-primary-100 text-primary-700'
                      }`}>
                        {getContractStatusLabel(contract.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COLONNE LATÉRALE (1/3) ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Actions rapides */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>ACTIONS RAPIDES</h2>
              <div className="space-y-2">
                <button onClick={() => navigate('/properties/new')} className="btn btn-primary w-full justify-center">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter un bien
                </button>
                <button onClick={() => navigate('/contracts/new')} className="btn btn-secondary w-full justify-center">
                  <FileText className="w-4 h-4 mr-2" /> Nouveau contrat
                </button>
                <button onClick={() => navigate('/messages')} className="btn btn-secondary w-full justify-center">
                  <MessageSquare className="w-4 h-4 mr-2" /> Mes messages
                </button>
              </div>
            </div>

            {/* Résumé portefeuille */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
              <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>MON PORTEFEUILLE</h2>
              <div className="space-y-3">
                {[
                  { label: 'Biens en location',  value: occupiedProps,    color: 'text-blue-600',    bg: 'bg-blue-100',    dot: 'bg-blue-500' },
                  { label: 'Biens disponibles',  value: availableProps,   color: 'text-success-600', bg: 'bg-success-100', dot: 'bg-success-500' },
                  { label: 'Hors marché',         value: totalProps - occupiedProps - availableProps, color: 'text-slate-500', dot: 'bg-slate-400' },
                ].map(({ label, value, color, dot }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span className={`font-bold text-sm ${color}`}>{value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Total biens</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{totalProps}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contrats par statut */}
            {contractStats && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>CONTRATS</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Actifs',        value: contractStats.active || 0, color: 'text-success-600', bg: 'bg-success-50' },
                    { label: 'En signature',  value: pendingSignatures,          color: 'text-primary-600', bg: 'bg-primary-50' },
                    { label: 'Brouillons',    value: contractStats.draft || 0,  color: 'text-warning-600', bg: 'bg-warning-50' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl ${bg}`}>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats de performance */}
            {statistics && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>PERFORMANCE</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Vues totales</span>
                    </div>
                    <span className="font-bold text-sm text-primary-600">{statistics.totalViews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-success-100 rounded-lg flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-success-600" />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contacts reçus</span>
                    </div>
                    <span className="font-bold text-sm text-success-600">{statistics.totalContacts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-accent-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-accent-600" />
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Conversion</span>
                    </div>
                    <span className="font-bold text-sm text-accent-600">
                      {statistics.totalViews && statistics.totalContacts
                        ? `${Math.round((statistics.totalContacts / statistics.totalViews) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
