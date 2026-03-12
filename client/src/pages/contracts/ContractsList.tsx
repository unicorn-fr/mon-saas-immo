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
    fetchContracts(undefined, 1, 200)
    fetchStatistics()
  }, [fetchContracts, fetchStatistics])

  const filtered = contracts.filter((c) => TAB_STATUSES[activeTab].includes(c.status))

  const counts: Record<TabKey, number> = {
    'actifs':    contracts.filter(c => c.status === 'ACTIVE').length,
    'en-cours':  contracts.filter(c => ['SENT','SIGNED_OWNER','SIGNED_TENANT','COMPLETED'].includes(c.status)).length,
    'brouillons':contracts.filter(c => c.status === 'DRAFT').length,
    'archives':  contracts.filter(c => ['TERMINATED','EXPIRED','CANCELLED'].includes(c.status)).length,
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'actifs',     label: 'Actifs' },
    { key: 'en-cours',   label: 'En cours' },
    { key: 'brouillons', label: 'Brouillons' },
    { key: 'archives',   label: 'Archives' },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
      DRAFT:        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  icon: Clock,       label: 'Brouillon' },
      SENT:         { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   icon: Send,        label: 'Envoyé' },
      SIGNED_OWNER: { bg: 'bg-[#e8f0fe]',  text: 'text-[#0055b3]',  border: 'border-[#aacfff]', icon: PenLine,     label: 'Signé (proprio)' },
      SIGNED_TENANT:{ bg: 'bg-[#e8f0fe]',  text: 'text-[#0055b3]',  border: 'border-[#aacfff]', icon: PenLine,     label: 'Signé (locataire)' },
      COMPLETED:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',icon: CheckCircle, label: 'Signé' },
      ACTIVE:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',icon: CheckCircle, label: 'Actif' },
      EXPIRED:      { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',  icon: AlertCircle, label: 'Expiré' },
      TERMINATED:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    icon: XCircle,     label: 'Résilié' },
      CANCELLED:    { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',  icon: XCircle,     label: 'Annulé' },
    }
    const v = variants[status] || variants['DRAFT']
    const Icon = v.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${v.bg} ${v.text} ${v.border}`}>
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
        className="bg-white rounded-2xl border border-[#d2d2d7] hover:border-[#bfdbfe] transition-all cursor-pointer p-5 group"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}
        onClick={() => navigate(`/contracts/${contract.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#1d1d1f] truncate mb-1 group-hover:text-[#3b82f6] transition-colors">
              {contract.property?.title}
            </h3>
            <div className="flex items-center text-sm text-[#86868b]">
              <HomeIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              {contract.property?.city}
            </div>
          </div>
          <div className="ml-3 shrink-0">{getStatusBadge(contract.status)}</div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center text-sm text-[#515154]">
            <User className="w-3.5 h-3.5 mr-2 text-[#86868b] flex-shrink-0" />
            <span className="text-[#86868b] mr-1">{isOwner ? 'Locataire :' : 'Propriétaire :'}</span>
            <span className="font-medium truncate text-[#1d1d1f]">{otherParty?.firstName} {otherParty?.lastName}</span>
          </div>
          <div className="flex items-center text-sm text-[#515154]">
            <Calendar className="w-3.5 h-3.5 mr-2 text-[#86868b] flex-shrink-0" />
            {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} →{' '}
            {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
          </div>
          <div className="flex items-center text-sm">
            <Euro className="w-3.5 h-3.5 mr-2 text-[#86868b] flex-shrink-0" />
            <span className="font-semibold text-[#3b82f6]">{contract.monthlyRent}€/mois</span>
            {contract.charges ? <span className="text-[#86868b] ml-1">+ {contract.charges}€ charges</span> : null}
          </div>
        </div>

        {inSignature && (
          <div className="pt-3 border-t border-[#f0f0f2]">
            <p className="text-xs text-[#86868b] mb-1.5">Progression des signatures</p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                {contract.ownerSignature || ['SIGNED_OWNER','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-[#515154]">Propriétaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                {contract.tenantSignature || ['SIGNED_TENANT','COMPLETED'].includes(contract.status) ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-[#515154]">Locataire</span>
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
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#515154]">Chargement des contrats…</p>
          </div>
        </div>
      </Layout>
    )
  }

  const pendingSignatures = (statistics?.sent || 0) + (statistics?.completed || 0)

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f7]">

        {/* Header */}
        <div className="bg-white border-b border-[#d2d2d7]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  Mes Contrats
                </h1>
                {statistics && (
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#86868b]">
                    <span><strong className="text-[#1d1d1f]">{statistics.total}</strong> au total</span>
                    <span className="text-[#d2d2d7]">|</span>
                    <span><strong className="text-emerald-600">{statistics.active}</strong> actifs</span>
                    {pendingSignatures > 0 && (
                      <>
                        <span className="text-[#d2d2d7]">|</span>
                        <span><strong className="text-[#3b82f6]">{pendingSignatures}</strong> en attente de signature</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              {user?.role === 'OWNER' && (
                <Link
                  to="/contracts/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl font-semibold text-sm hover:bg-[#2563eb] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau contrat
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-[#d2d2d7]">
          <div className="container mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? 'text-[#3b82f6] border-[#3b82f6]'
                      : 'text-[#86868b] border-transparent hover:text-[#515154]'
                  }`}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? 'bg-[#3b82f6] text-white'
                        : 'bg-[#f0f0f2] text-[#86868b]'
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
              <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#bfdbfe]" />
              </div>
              <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">
                {activeTab === 'actifs'     ? 'Aucun contrat actif'          :
                 activeTab === 'en-cours'   ? 'Aucun contrat en cours'       :
                 activeTab === 'brouillons' ? 'Aucun brouillon'              :
                                             'Aucun contrat archivé'}
              </h2>
              <p className="text-[#86868b] mb-6 max-w-sm mx-auto">
                {activeTab === 'actifs'     ? 'Les contrats actifs apparaîtront ici.' :
                 activeTab === 'en-cours'   ? 'Les contrats en attente de signature apparaîtront ici.' :
                 activeTab === 'brouillons' ? 'Commencez par créer un nouveau contrat.' :
                                             'Les contrats terminés apparaîtront ici.'}
              </p>
              {user?.role === 'OWNER' && activeTab === 'brouillons' && (
                <Link
                  to="/contracts/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-xl font-semibold text-sm hover:bg-[#2563eb] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer mon premier contrat
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
