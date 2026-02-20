import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { ContractClause } from '../../types/contract.types'
import { SignaturePad } from '../../components/contract/SignaturePad'
import { ContractPDF } from '../../components/contract/ContractPDF'
import { DocumentChecklist } from '../../components/document/DocumentChecklist'
import { Layout } from '../../components/layout/Layout'
import { PDFDownloadLink } from '@react-pdf/renderer'
import {
  FileText,
  ArrowLeft,
  Calendar,
  Euro,
  User,
  Home as HomeIcon,
  CheckCircle,
  Clock,
  Trash2,
  Ban,
  Send,
  Download,
  PenTool,
  AlertCircle,
  Info,
  ShieldCheck,
  FolderOpen,
  ClipboardCheck,
  XCircle,
  AlertTriangle,
  X,
  Check,
  Circle,
} from 'lucide-react'
import {
  OWNER_DOCUMENT_CHECKLIST,
  TENANT_DOCUMENT_CHECKLIST,
} from '../../types/document.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Progress stepper configuration
const CONTRACT_STEPS = [
  { status: 'DRAFT', label: 'Brouillon', icon: FileText },
  { status: 'SENT', label: 'Envoye', icon: Send },
  { status: 'SIGNED', label: 'Signatures', icon: PenTool },
  { status: 'ACTIVE', label: 'Actif', icon: CheckCircle },
]

function getStepIndex(status: string): number {
  switch (status) {
    case 'DRAFT': return 0
    case 'SENT': return 1
    case 'SIGNED_OWNER':
    case 'SIGNED_TENANT':
    case 'COMPLETED': return 2
    case 'ACTIVE': return 3
    case 'EXPIRED':
    case 'TERMINATED':
    case 'CANCELLED': return -1
    default: return 0
  }
}

type ConfirmModalType = 'delete' | 'terminate' | 'cancel' | null

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentContract: contract,
    isLoading,
    fetchContractById,
    updateContract,
    sendContract,
    signContract,
    activateContract,
    terminateContract,
    deleteContract,
    cancelContract,
  } = useContractStore()

  const [confirmModal, setConfirmModal] = useState<ConfirmModalType>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [requiredDocs, setRequiredDocs] = useState<Set<string>>(() => {
    // Pre-select required docs by default
    const defaults = new Set<string>()
    OWNER_DOCUMENT_CHECKLIST.filter(d => d.required).forEach(d => defaults.add(d.category))
    TENANT_DOCUMENT_CHECKLIST.filter(d => d.required).forEach(d => defaults.add(d.category))
    return defaults
  })
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  useEffect(() => {
    if (id) {
      fetchContractById(id).then(() => setInitialLoaded(true))
    }
  }, [id, fetchContractById])

  // Only show full-page spinner on initial load
  if (!initialLoaded || (!contract && isLoading)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600">Contrat introuvable</p>
          <button onClick={() => navigate('/contracts')} className="btn btn-primary">
            Retour aux contrats
          </button>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === contract.ownerId
  const isTenant = user?.id === contract.tenantId
  const hasSigned = isOwner ? !!contract.signedByOwner : !!contract.signedByTenant
  const otherPartySigned = isOwner ? !!contract.signedByTenant : !!contract.signedByOwner
  const canSign = ['DRAFT', 'SENT', 'SIGNED_OWNER', 'SIGNED_TENANT'].includes(contract.status) && !hasSigned
  const canSend = isOwner && contract.status === 'DRAFT'
  const canActivate = isOwner && contract.status === 'COMPLETED'
  const canTerminate = isOwner && contract.status === 'ACTIVE'
  const canDelete = isOwner && contract.status === 'DRAFT'
  const canCancel = isOwner && ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(contract.status)
  const isTerminal = ['EXPIRED', 'TERMINATED', 'CANCELLED'].includes(contract.status)

  const handleSend = async () => {
    setActionLoading(true)
    try {
      // Save required documents to contract content before sending
      const content = (contract.content as Record<string, any>) || {}
      await updateContract(contract.id, {
        content: { ...content, requiredDocuments: Array.from(requiredDocs) },
      })
      await sendContract(contract.id)
      setShowSendModal(false)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleRequiredDoc = (category: string) => {
    setRequiredDocs(prev => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })
  }

  const handleSignature = async (signatureBase64: string) => {
    setActionLoading(true)
    try {
      await signContract(contract.id, signatureBase64)
      setShowSignature(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    setActionLoading(true)
    try {
      await activateContract(contract.id)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTerminate = async () => {
    setActionLoading(true)
    try {
      await terminateContract(contract.id)
      setConfirmModal(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const success = await deleteContract(contract.id)
      if (success) navigate('/contracts')
    } finally {
      setActionLoading(false)
      setConfirmModal(null)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    setActionLoading(true)
    try {
      await cancelContract(contract.id, cancelReason.trim())
      setConfirmModal(null)
      setCancelReason('')
    } finally {
      setActionLoading(false)
    }
  }

  const signerName = `${user?.firstName} ${user?.lastName}`
  const clauses: ContractClause[] = (contract.customClauses as ContractClause[]) || []
  const contractContent = (contract.content as Record<string, any>) || {}
  const signatureMetadata = contractContent.signatureMetadata
  const cancellation = contractContent.cancellation
  const requiredDocuments: string[] | undefined = contractContent.requiredDocuments
  const currentStepIndex = getStepIndex(contract.status)

  // Status badge config
  const statusConfig: Record<string, { bg: string; text: string; label: string; icon: typeof CheckCircle }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon', icon: Circle },
    SENT: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Envoye au locataire', icon: Send },
    SIGNED_OWNER: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Signe par le proprietaire', icon: PenTool },
    SIGNED_TENANT: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Signe par le locataire', icon: PenTool },
    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Signe par les deux parties', icon: CheckCircle },
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif', icon: CheckCircle },
    EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expire', icon: Clock },
    TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Resilie', icon: Ban },
    CANCELLED: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Annule', icon: XCircle },
  }

  const status = statusConfig[contract.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/contracts')} className="btn btn-ghost p-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-7 h-7 text-primary-600" />
                    Contrat de Location
                  </h1>
                  <p className="text-gray-600 mt-1">{contract.property?.title}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress Stepper */}
            {!isTerminal && (
              <div className="bg-white rounded-xl border p-6 mb-6">
                <div className="flex items-center justify-between">
                  {CONTRACT_STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isCompleted = currentStepIndex > index
                    const isCurrent = currentStepIndex === index
                    const isUpcoming = currentStepIndex < index

                    let signatureDetail = ''
                    if (index === 2 && currentStepIndex === 2) {
                      if (contract.status === 'SIGNED_OWNER') signatureDetail = 'Proprietaire OK'
                      else if (contract.status === 'SIGNED_TENANT') signatureDetail = 'Locataire OK'
                      else if (contract.status === 'COMPLETED') signatureDetail = 'Les 2 parties'
                    }

                    return (
                      <div key={step.status} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <StepIcon className="w-5 h-5" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium mt-2 ${
                              isCompleted ? 'text-green-600' : isCurrent ? 'text-primary-700' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          {signatureDetail && (
                            <span className="text-xs text-amber-600 mt-0.5">{signatureDetail}</span>
                          )}
                        </div>
                        {index < CONTRACT_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-2 -mt-6 ${
                              isCompleted ? 'bg-green-400' : isUpcoming ? 'bg-gray-200' : 'bg-primary-200'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Terminal status banner */}
            {contract.status === 'CANCELLED' && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Contrat annule</p>
                  {cancellation?.reason && (
                    <p className="text-sm text-orange-700 mt-1">Motif : {cancellation.reason}</p>
                  )}
                  {cancellation?.cancelledAt && (
                    <p className="text-xs text-orange-600 mt-1">
                      Annule le {format(new Date(cancellation.cancelledAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {contract.status === 'TERMINATED' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Contrat resilie</p>
                  <p className="text-sm text-red-700 mt-1">Ce contrat a ete resilie. Le bien est de nouveau disponible.</p>
                </div>
              </div>
            )}

            {/* Status Alerts */}
            {contract.status === 'SENT' && isTenant && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Contrat en attente de votre signature</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Le proprietaire vous a envoye ce contrat. Lisez-le attentivement puis signez-le ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {contract.status === 'COMPLETED' && isOwner && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Les deux parties ont signe</p>
                  <p className="text-sm text-green-700 mt-1">
                    Vous pouvez maintenant activer le contrat. Le bien sera marque comme occupe.
                  </p>
                </div>
              </div>
            )}

            {hasSigned && !otherPartySigned && !isTerminal && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Vous avez signe ce contrat. En attente de la signature de l'autre partie.
                </p>
              </div>
            )}

            {/* Action Buttons Bar */}
            {!isTerminal && (canSend || canSign || canActivate || canTerminate || canDelete || canCancel) && (
              <div className="bg-white rounded-xl border p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                  {canSend && (
                    <button
                      onClick={() => setShowSendModal(true)}
                      disabled={actionLoading}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer au locataire
                    </button>
                  )}

                  {canSign && (
                    <button
                      onClick={() => setShowSignature(true)}
                      disabled={actionLoading}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <PenTool className="w-4 h-4" />
                      Signer le contrat
                    </button>
                  )}

                  {canActivate && (
                    <button
                      onClick={handleActivate}
                      disabled={actionLoading}
                      className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Activer le contrat
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setConfirmModal('cancel')}
                      disabled={actionLoading}
                      className="btn btn-secondary flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler le contrat
                    </button>
                  )}

                  {canTerminate && (
                    <button
                      onClick={() => setConfirmModal('terminate')}
                      disabled={actionLoading}
                      className="btn btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" />
                      Resilier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => setConfirmModal('delete')}
                      disabled={actionLoading}
                      className="btn btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Property Info */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Propriete</h2>
              <div className="flex gap-4">
                {contract.property?.images?.[0] && (
                  <img
                    src={contract.property.images[0]}
                    alt={contract.property.title}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{contract.property?.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <HomeIcon className="w-4 h-4 mr-2" />
                    {contract.property?.address}, {contract.property?.city} {contract.property?.postalCode}
                  </div>
                  {contract.property?.bedrooms != null && (
                    <p className="text-sm text-gray-600">
                      {contract.property.bedrooms} chambres - {contract.property.bathrooms} SDB - {contract.property.surface}m2
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Proprietaire
                </h3>
                <p className="text-gray-900">{contract.owner?.firstName} {contract.owner?.lastName}</p>
                <p className="text-sm text-gray-600">{contract.owner?.email}</p>
                {contract.owner?.phone && <p className="text-sm text-gray-600">{contract.owner.phone}</p>}

                {contract.signedByOwner ? (
                  <div className="mt-3">
                    <div className="flex items-center text-sm text-green-600 mb-2">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Signe le {format(new Date(contract.signedByOwner), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                    {contract.ownerSignature && (
                      <img src={contract.ownerSignature} alt="Signature proprietaire" className="h-16 border rounded p-1 bg-white" />
                    )}
                    {signatureMetadata?.owner && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        Signature electronique certifiee
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center text-sm text-yellow-600">
                    <Clock className="w-4 h-4 mr-1" />
                    En attente de signature
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Locataire
                </h3>
                <p className="text-gray-900">{contract.tenant?.firstName} {contract.tenant?.lastName}</p>
                <p className="text-sm text-gray-600">{contract.tenant?.email}</p>
                {contract.tenant?.phone && <p className="text-sm text-gray-600">{contract.tenant.phone}</p>}

                {contract.signedByTenant ? (
                  <div className="mt-3">
                    <div className="flex items-center text-sm text-green-600 mb-2">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Signe le {format(new Date(contract.signedByTenant), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                    {contract.tenantSignature && (
                      <img src={contract.tenantSignature} alt="Signature locataire" className="h-16 border rounded p-1 bg-white" />
                    )}
                    {signatureMetadata?.tenant && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        Signature electronique certifiee
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center text-sm text-yellow-600">
                    <Clock className="w-4 h-4 mr-1" />
                    En attente de signature
                  </div>
                )}
              </div>
            </div>

            {/* Contract Details */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Details du contrat</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm text-gray-600">Periode</label>
                  <div className="flex items-center text-gray-900 mt-1">
                    <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                    {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} -{' '}
                    {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-gray-600">Loyer mensuel</label>
                  <div className="flex items-center text-xl font-bold text-primary-600 mt-1">
                    <Euro className="w-5 h-5 mr-1" />
                    {contract.monthlyRent}EUR
                  </div>
                </div>
                {contract.charges != null && (
                  <div>
                    <label className="text-sm text-gray-600">Charges</label>
                    <div className="flex items-center text-xl font-bold text-gray-900 mt-1">
                      <Euro className="w-5 h-5 mr-1" />
                      {contract.charges}EUR
                    </div>
                  </div>
                )}
                {contract.deposit != null && (
                  <div>
                    <label className="text-sm text-gray-600">Depot de garantie</label>
                    <div className="flex items-center text-xl font-bold text-gray-900 mt-1">
                      <Euro className="w-5 h-5 mr-1" />
                      {contract.deposit}EUR
                    </div>
                  </div>
                )}
              </div>

              {contract.terms && (
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm text-gray-600 block mb-2">Conditions particulieres</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{contract.terms}</p>
                </div>
              )}
            </div>

            {/* Clauses */}
            {clauses.length > 0 && (
              <div className="card mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Clauses du contrat</h2>
                <div className="space-y-3">
                  {clauses.filter((c) => c.enabled).map((clause, index) => (
                    <div key={clause.id} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {index + 1}. {clause.title}
                        {clause.isCustom && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Personnalisee
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{clause.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF & EDL */}
            <div className="card mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
              <div className="flex flex-wrap gap-3">
                <PDFDownloadLink
                  document={
                    <ContractPDF
                      contract={contract}
                      clauses={clauses.filter((c) => c.enabled)}
                    />
                  }
                  fileName={`contrat-${contract.property?.title?.replace(/\s+/g, '-').toLowerCase() || 'location'}.pdf`}
                >
                  {({ loading }) => (
                    <button className="btn btn-secondary" disabled={loading}>
                      {loading ? (
                        'Generation du PDF...'
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Telecharger le contrat PDF
                        </>
                      )}
                    </button>
                  )}
                </PDFDownloadLink>

                {contract.status !== 'DRAFT' && (
                  <Link
                    to={`/contracts/${contract.id}/edl`}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Etat des lieux
                  </Link>
                )}
              </div>
            </div>

            {/* Documents - Dossier de location */}
            {contract.status !== 'DRAFT' && (
              <div className="card mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                  Dossier de location
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Telechargez les documents obligatoires pour constituer le dossier complet.
                </p>

                {isOwner && (
                  <div className="mb-6">
                    <DocumentChecklist
                      contractId={contract.id}
                      userRole="OWNER"
                      isOwner={true}
                      requiredCategories={requiredDocuments}
                    />
                  </div>
                )}

                {(isOwner || isTenant) && (
                  <DocumentChecklist
                    contractId={contract.id}
                    userRole="TENANT"
                    isOwner={isOwner}
                    requiredCategories={requiredDocuments}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signature Modal */}
        <SignaturePad
          isOpen={showSignature}
          onClose={() => setShowSignature(false)}
          onConfirm={handleSignature}
          signerName={signerName}
        />

        {/* Send Modal - Required Documents Selection */}
        {showSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Envoyer le contrat</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Selectionnez les documents que le locataire devra fournir. Ces documents seront requis dans le dossier de location.
              </p>

              {/* Owner documents */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents proprietaire (DDT)</h4>
                <div className="space-y-2">
                  {OWNER_DOCUMENT_CHECKLIST.map((item) => (
                    <label key={item.category} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredDocs.has(item.category)}
                        onChange={() => toggleRequiredDoc(item.category)}
                        className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tenant documents */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents locataire</h4>
                <div className="space-y-2">
                  {TENANT_DOCUMENT_CHECKLIST.map((item) => (
                    <label key={item.category} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredDocs.has(item.category)}
                        onChange={() => toggleRequiredDoc(item.category)}
                        className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
                Format accepte : PDF uniquement - Taille max : 5 Mo par document
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={actionLoading || requiredDocs.size === 0}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Envoyer au locataire
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              {/* Close button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmModal === 'delete' && 'Supprimer le contrat'}
                  {confirmModal === 'terminate' && 'Resilier le contrat'}
                  {confirmModal === 'cancel' && 'Annuler le contrat'}
                </h3>
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Warning */}
              <div className={`p-3 rounded-lg mb-4 flex items-start gap-2 ${
                confirmModal === 'delete' ? 'bg-red-50' : confirmModal === 'cancel' ? 'bg-orange-50' : 'bg-red-50'
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  confirmModal === 'cancel' ? 'text-orange-500' : 'text-red-500'
                }`} />
                <div className="text-sm">
                  {confirmModal === 'delete' && (
                    <p className="text-red-800">
                      Cette action est irreversible. Le contrat brouillon sera definitivement supprime.
                    </p>
                  )}
                  {confirmModal === 'terminate' && (
                    <p className="text-red-800">
                      La resiliation mettra fin au contrat actif. Le bien sera remis en disponible.
                    </p>
                  )}
                  {confirmModal === 'cancel' && (
                    <>
                      <p className="text-orange-800 font-medium">
                        Attention : cette action annulera le contrat en cours de signature.
                      </p>
                      <p className="text-orange-700 mt-1">
                        {contract.signedByOwner || contract.signedByTenant
                          ? 'Une ou plusieurs signatures ont deja ete apposees. Elles seront invalidees.'
                          : 'Le locataire sera notifie de l\'annulation.'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Cancel reason */}
              {confirmModal === 'cancel' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif de l'annulation (obligatoire)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex: Erreur dans les conditions, changement de locataire..."
                    className="w-full border rounded-lg p-3 text-sm h-24 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Retour
                </button>
                <button
                  onClick={
                    confirmModal === 'delete' ? handleDelete :
                    confirmModal === 'terminate' ? handleTerminate :
                    handleCancel
                  }
                  disabled={actionLoading || (confirmModal === 'cancel' && !cancelReason.trim())}
                  className={`btn text-white flex items-center gap-2 ${
                    confirmModal === 'cancel' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {confirmModal === 'delete' && <Trash2 className="w-4 h-4" />}
                      {confirmModal === 'terminate' && <Ban className="w-4 h-4" />}
                      {confirmModal === 'cancel' && <XCircle className="w-4 h-4" />}
                    </>
                  )}
                  {confirmModal === 'delete' && 'Supprimer definitivement'}
                  {confirmModal === 'terminate' && 'Confirmer la resiliation'}
                  {confirmModal === 'cancel' && 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
