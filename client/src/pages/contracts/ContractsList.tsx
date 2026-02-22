import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Contract } from '../../types/contract.types'
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

type TabKey = 'actifs' | 'en-cours' | 'brouillons' | 'archives'

const TAB_STATUSES: Record<TabKey, string[]> = {
  'actifs':    ['ACTIVE'],
  'en-cours':  ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'],
  'brouillons':['DRAFT'],
  'archives':  ['TERMINATED', 'EXPIRED', 'CANCELLED'],
}

export default function ContractsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { contracts, statistics, isLoading, fetchContracts, fetchStatistics } = useContractStore()
  const [activeTab, setActiveTab] = useState<TabKey>('actifs')

  useEffect(() => {
    fetchContracts(undefined, 1, 200) // fetch all, filter client-side
    fetchStatistics()
  }, [fetchContracts, fetchStatistics])

  const filtered = contracts.filter((c) => TAB_STATUSES[activeTab].includes(c.status))

  // Tab counts
  const counts: Record<TabKey, number> = {
    'actifs':    contracts.filter(c => c.status === 'ACTIVE').length,
    'en-cours':  contracts.filter(c => ['SENT','SIGNED_OWNER','SIGNED_TENANT','COMPLETED'].includes(c.status)).length,
    'brouillons':contracts.filter(c => c.status === 'DRAFT').length,
    'archives':  contracts.filter(c => ['TERMINATED','EXPIRED','CANCELLED'].includes(c.status)).length,
  }

  const tabs: { key: TabKey; label: string; color: string; activeColor: string }[] = [
    { key: 'actifs',     label: 'Actifs',     color: 'text-green-600',  activeColor: 'bg-green-600' },
    { key: 'en-cours',   label: 'En cours',   color: 'text-blue-600',   activeColor: 'bg-blue-600' },
    { key: 'brouillons', label: 'Brouillons', color: 'text-yellow-600', activeColor: 'bg-yellow-500' },
    { key: 'archives',   label: 'Archives',   color: 'text-gray-500',   activeColor: 'bg-gray-500' },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      DRAFT:        { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock,       label: 'Brouillon' },
      SENT:         { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Send,        label: 'Envoye' },
      SIGNED_OWNER: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PenLine,     label: 'Signe (proprio)' },
      SIGNED_TENANT:{ bg: 'bg-indigo-100', text: 'text-indigo-700', icon: PenLine,     label: 'Signe (locataire)' },
      COMPLETED:    { bg: 'bg-emerald-100',text: 'text-emerald-700',icon: CheckCircle, label: 'Signe' },
      ACTIVE:       { bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle, label: 'Actif' },
      EXPIRED:      { bg: 'bg-gray-100',   text: 'text-gray-700',   icon: AlertCircle, label: 'Expire' },
      TERMINATED:   { bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle,     label: 'Resilie' },
      CANCELLED:    { bg: 'bg-orange-100', text: 'text-orange-700', icon: XCircle,     label: 'Annule' },
    }
    const v = variants[status] || variants['DRAFT']
    const Icon = v.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
        <Icon className="w-3 h-3" />
        {v.label}
      </span>
    )
  }

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const isOwner = user?.role === 'OWNER'
    const otherParty = isOwner ? contract.tenant : contract.owner
    const inSignature = ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(contract.status)

    return (
      <div
        className="bg-white rounded-xl border hover:shadow-md transition-shadow cursor-pointer p-5"
        onClick={() => navigate(`/contracts/${contract.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate mb-1">{contract.property?.title}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <HomeIcon className="w-3.5 h-3.5 mr-1" />
              {contract.property?.city}
            </div>
          </div>
          <div className="ml-3 shrink-0">{getStatusBadge(contract.status)}</div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="text-gray-400 mr-1">{isOwner ? 'Locataire :' : 'Proprietaire :'}</span>
            <span className="font-medium truncate">{otherParty?.firstName} {otherParty?.lastName}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
            {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} →{' '}
            {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
          </div>
          <div className="flex items-center text-sm">
            <Euro className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="font-semibold text-primary-600">{contract.monthlyRent}€/mois</span>
            {contract.charges ? <span className="text-gray-400 ml-1">+ {contract.charges}€ charges</span> : null}
          </div>
        </div>

        {inSignature && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1.5">Progression des signatures</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                {contract.ownerSignature || ['SIGNED_OWNER','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                )}
                <span className="text-gray-600">Proprietaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                {contract.tenantSignature || ['SIGNED_TENANT','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
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
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  const pendingSignatures = (statistics?.sent || 0) + (statistics?.completed || 0)

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-7 h-7 text-primary-600" />
                  Mes Contrats
                </h1>
                {statistics && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span><strong className="text-gray-900">{statistics.total}</strong> au total</span>
                    <span className="text-gray-300">|</span>
                    <span><strong className="text-green-600">{statistics.active}</strong> actifs</span>
                    {pendingSignatures > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span><strong className="text-blue-600">{pendingSignatures}</strong> en attente de signature</span>
                      </>
                    )}
                  </div>
                )}
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

        {/* Smart Tabs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? `${tab.color} border-current`
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? `${tab.activeColor} text-white`
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {activeTab === 'actifs'     ? 'Aucun contrat actif'          :
                 activeTab === 'en-cours'   ? 'Aucun contrat en cours'       :
                 activeTab === 'brouillons' ? 'Aucun brouillon'              :
                                             'Aucun contrat archive'}
              </h2>
              <p className="text-gray-400 mb-6">
                {activeTab === 'actifs'     ? 'Les contrats actives apparaitront ici.' :
                 activeTab === 'en-cours'   ? 'Les contrats en attente de signature apparaitront ici.' :
                 activeTab === 'brouillons' ? 'Commencez par creer un nouveau contrat.' :
                                             'Les contrats termines apparaitront ici.'}
              </p>
              {user?.role === 'OWNER' && activeTab === 'brouillons' && (
                <Link to="/contracts/new" className="btn btn-primary inline-flex">
                  <Plus className="w-5 h-5 mr-2" />
                  Creer mon premier contrat
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
