import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Contract, ContractStatus } from '../../types/contract.types'
import { Layout } from '../../components/layout/Layout'
import {
  FileText,
  Plus,
  Calendar,
  Euro,
  User,
  Home as HomeIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  PenLine,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ContractsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { contracts, statistics, isLoading, fetchContracts, fetchStatistics } =
    useContractStore()

  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>('ALL')

  useEffect(() => {
    const filters = statusFilter !== 'ALL' ? { status: statusFilter } : undefined
    fetchContracts(filters)
    fetchStatistics()
  }, [statusFilter, fetchContracts, fetchStatistics])

  const statusLabels: Record<ContractStatus, string> = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyé',
    SIGNED_OWNER: 'Signé (proprio)',
    SIGNED_TENANT: 'Signé (locataire)',
    COMPLETED: 'Signé',
    ACTIVE: 'Actif',
    EXPIRED: 'Expiré',
    TERMINATED: 'Résilié',
  }

  const getStatusBadge = (status: ContractStatus) => {
    const variants: Record<
      ContractStatus,
      { bg: string; text: string; icon: typeof CheckCircle }
    > = {
      DRAFT: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      SENT: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Send },
      SIGNED_OWNER: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PenLine },
      SIGNED_TENANT: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PenLine },
      COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle },
      TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    }

    const variant = variants[status]
    const Icon = variant.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
        <Icon className="w-3 h-3" />
        {statusLabels[status]}
      </span>
    )
  }

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const isOwner = user?.role === 'OWNER'
    const otherParty = isOwner ? contract.tenant : contract.owner

    return (
      <div
        className="card hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/contracts/${contract.id}`)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{contract.property?.title}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <HomeIcon className="w-4 h-4 mr-1" />
              {contract.property?.city}
            </div>
          </div>
          {getStatusBadge(contract.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium mr-1">
              {isOwner ? 'Locataire:' : 'Propriétaire:'}
            </span>
            {otherParty?.firstName} {otherParty?.lastName}
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} -{' '}
              {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <Euro className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-semibold text-primary-600">{contract.monthlyRent}€/mois</span>
            {contract.charges && (
              <span className="text-gray-500 ml-1">+ {contract.charges}€ charges</span>
            )}
          </div>
        </div>

        {['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(contract.status) && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                {contract.ownerSignature || contract.status === 'SIGNED_OWNER' || contract.status === 'COMPLETED' ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <Clock className="w-3 h-3 text-yellow-600" />
                )}
                <span className="text-gray-600">Propriétaire</span>
              </div>
              <div className="flex items-center gap-1">
                {contract.tenantSignature || contract.status === 'SIGNED_TENANT' || contract.status === 'COMPLETED' ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <Clock className="w-3 h-3 text-yellow-600" />
                )}
                <span className="text-gray-600">Locataire</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary-600" />
                Mes Contrats
              </h1>
              <p className="text-gray-600 mt-1">Gérez vos contrats de location</p>
            </div>
            {user?.role === 'OWNER' && (
              <Link to="/contracts/new" className="btn btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau contrat
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Actifs</p>
              <p className="text-3xl font-bold text-green-600">{statistics.active}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Brouillons</p>
              <p className="text-3xl font-bold text-yellow-600">{statistics.draft}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Envoyés</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.sent}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Signés</p>
              <p className="text-3xl font-bold text-emerald-600">{statistics.completed}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Résiliés</p>
              <p className="text-3xl font-bold text-red-600">{statistics.terminated}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-600 mb-1">Expirés</p>
              <p className="text-3xl font-bold text-gray-600">{statistics.expired}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'DRAFT', 'SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED', 'ACTIVE', 'TERMINATED', 'EXPIRED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {status === 'ALL' ? 'Tous' : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts Grid */}
        {contracts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Aucun contrat</h2>
            <p className="text-gray-600 mb-6">
              {statusFilter !== 'ALL'
                ? 'Aucun contrat trouvé avec ce statut'
                : 'Vous n\'avez pas encore de contrat'}
            </p>
            {user?.role === 'OWNER' && statusFilter === 'ALL' && (
              <Link to="/contracts/new" className="btn btn-primary inline-flex">
                <Plus className="w-5 h-5 mr-2" />
                Créer mon premier contrat
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        )}
      </div>
    </div>
    </Layout>
  )
}
