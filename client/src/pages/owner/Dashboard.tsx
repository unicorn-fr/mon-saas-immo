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
  Bath,
  Square,
  FileText,
  Send,
  PenLine,
  AlertTriangle,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { statistics, myProperties, fetchMyStatistics, fetchMyProperties, isLoading } = useProperties()
  const { contracts, statistics: contractStats, fetchContracts, fetchStatistics: fetchContractStatistics } = useContractStore()

  useEffect(() => {
    fetchMyStatistics()
    fetchMyProperties({ page: 1, limit: 5 })
    fetchContracts(undefined, 1, 50)
    fetchContractStatistics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derived values
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE')
  const monthlyRevenue = activeContracts.reduce((sum, c) => sum + c.monthlyRent + (c.charges || 0), 0)
  const recentContracts = contracts.slice(0, 3)

  const totalProps = statistics?.totalProperties || 0
  const occupiedProps = statistics?.occupiedProperties || 0
  const occupancyRate = totalProps > 0 ? Math.round((occupiedProps / totalProps) * 100) : 0

  const pendingSignatures = (contractStats?.sent || 0) + (contractStats?.completed || 0)
  const drafts = contractStats?.draft || 0
  const hasUrgencies = pendingSignatures > 0 || drafts > 0

  const getContractStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'DRAFT': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'SENT': return <Send className="w-4 h-4 text-blue-600" />
      case 'SIGNED_OWNER':
      case 'SIGNED_TENANT': return <PenLine className="w-4 h-4 text-indigo-600" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-600" />
      default: return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getContractStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoye',
      SIGNED_OWNER: 'En signature',
      SIGNED_TENANT: 'En signature',
      COMPLETED: 'Signe',
      ACTIVE: 'Actif',
      EXPIRED: 'Expire',
      TERMINATED: 'Resilie',
    }
    return labels[status] || status
  }

  const PropertyQuickCard = ({ property }: { property: any }) => (
    <div
      className="flex gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <img
        src={property.images[0] || '/placeholder-property.jpg'}
        alt={property.title}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 mb-1 truncate">{property.title}</h4>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate">{property.city}, {property.postalCode}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span>
          <span className="flex items-center gap-1"><Square className="w-3 h-3" />{property.surface}m²</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-primary-600">{property.price}€</p>
        <p className="text-xs text-gray-400">/ mois</p>
      </div>
    </div>
  )

  if (isLoading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* ── NIVEAU 1 : Le Cœur ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* Revenus mensuels */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <Euro className="w-5 h-5 text-white" />
                </div>
                <span className="text-green-100 text-sm font-medium">Ce mois</span>
              </div>
              <p className="text-green-100 text-sm mb-1">Revenus locatifs mensuels</p>
              <p className="text-4xl font-bold mb-1">
                {monthlyRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
              <p className="text-green-200 text-sm">
                {activeContracts.length} contrat{activeContracts.length > 1 ? 's' : ''} actif{activeContracts.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Occupation */}
            <div className="bg-white rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary-600" />
                </div>
                <button
                  onClick={() => navigate('/properties/owner/me')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  Voir mes biens <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-1">Taux d'occupation</p>
              <div className="flex items-end gap-3 mb-3">
                <p className="text-4xl font-bold text-gray-900">{occupancyRate}%</p>
                <p className="text-gray-500 text-sm mb-1">{occupiedProps} / {totalProps} biens loues</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{occupiedProps} en location</span>
                <span>{statistics?.availableProperties || 0} disponibles</span>
              </div>
            </div>
          </div>

          {/* ── NIVEAU 2 : Alertes urgentes ────────────────────────── */}
          {hasUrgencies && (
            <div className="flex flex-wrap gap-3 mb-6">
              {pendingSignatures > 0 && (
                <Link
                  to="/contracts"
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-sm font-semibold text-orange-700">
                    {pendingSignatures} signature{pendingSignatures > 1 ? 's' : ''} en attente
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                </Link>
              )}
              {drafts > 0 && (
                <Link
                  to="/contracts"
                  className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-700">
                    {drafts} brouillon{drafts > 1 ? 's' : ''} a finaliser
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-yellow-500" />
                </Link>
              )}
            </div>
          )}

          {/* ── NIVEAU 3 : Contenu principal (2 colonnes) ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Colonne gauche : Propriétés + Contrats récents */}
            <div className="lg:col-span-2 space-y-6">

              {/* Propriétés récentes */}
              <div className="bg-white rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Proprietes recentes</h2>
                  <Link
                    to="/properties/owner/me"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {myProperties.length === 0 ? (
                  <div className="text-center py-10">
                    <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Aucune propriete pour le moment</p>
                    <Link to="/properties/new" className="btn btn-primary inline-flex">
                      <Plus className="w-4 h-4 mr-2" />
                      Creer votre premiere propriete
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myProperties.slice(0, 4).map((property) => (
                      <PropertyQuickCard key={property.id} property={property} />
                    ))}
                  </div>
                )}
              </div>

              {/* Contrats récents */}
              <div className="bg-white rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    Contrats recents
                  </h2>
                  <Link
                    to="/contracts"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    Voir mes contrats <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {recentContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Aucun contrat pour le moment</p>
                    <Link to="/contracts/new" className="btn btn-primary inline-flex">
                      <Plus className="w-4 h-4 mr-2" />
                      Creer un contrat
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentContracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        {getContractStatusIcon(contract.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">
                            {contract.property?.title || 'Contrat'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {contract.tenant?.firstName} {contract.tenant?.lastName} — {contract.monthlyRent}€/mois
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                          contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          contract.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {getContractStatusLabel(contract.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite : Actions rapides */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/properties/new')}
                    className="btn btn-primary w-full justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un bien
                  </button>
                  <button
                    onClick={() => navigate('/contracts/new')}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Nouveau contrat
                  </button>
                  <button
                    onClick={() => navigate('/properties/owner/me')}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Mes proprietes
                  </button>
                  <button
                    onClick={() => navigate('/contracts')}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Voir mes contrats
                  </button>
                </div>
              </div>

              {/* Résumé contrats compact */}
              {contractStats && (
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Mes contrats</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Actifs', value: contractStats.active, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'En signature', value: pendingSignatures, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Brouillons', value: contractStats.draft, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${bg}`}>
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className={`text-sm font-bold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── NIVEAU 4 : Stats secondaires (compact) ─────────────── */}
          {statistics && (
            <div className="bg-white rounded-2xl border p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Performance — Statistiques</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs text-gray-500">Vues totales</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{statistics.totalViews || 0}</p>
                  <p className="text-xs text-gray-400">~{totalProps > 0 ? Math.round((statistics.totalViews || 0) / totalProps) : 0} / bien</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs text-gray-500">Contacts recus</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{statistics.totalContacts || 0}</p>
                  <p className="text-xs text-gray-400">Messages locataires</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-gray-500">Conversion</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {statistics.totalViews && statistics.totalContacts
                      ? `${Math.round((statistics.totalContacts / statistics.totalViews) * 100)}%`
                      : '0%'}
                  </p>
                  <p className="text-xs text-gray-400">Contacts / Vues</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state first time */}
          {statistics?.totalProperties === 0 && (
            <div className="bg-white rounded-2xl border text-center py-16 mt-6">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur votre tableau de bord !</h2>
                <p className="text-gray-500 mb-6">
                  Commencez par ajouter votre premiere propriete pour voir vos statistiques apparaitre ici.
                </p>
                <Link to="/properties/new" className="btn btn-primary inline-flex">
                  <Plus className="w-5 h-5 mr-2" />
                  Creer ma premiere propriete
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  )
}
