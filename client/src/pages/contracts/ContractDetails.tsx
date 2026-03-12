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
  Plus,
} from 'lucide-react'
import {
  OWNER_DOCUMENT_CHECKLIST,
  TENANT_DOCUMENT_CHECKLIST,
} from '../../types/document.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Progress stepper configuration
const CONTRACT_STEPS = [
  { status: 'DRAFT', label: 'Brouillon', icon: FileText },
  { status: 'SENT', label: 'Envoyé', icon: Send },
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
  const [requiredDocs, setRequiredDocs] = useState<Set<string>>(new Set())
  const [customDocRequests, setCustomDocRequests] = useState<{ title: string; description: string }[]>([])
  const [newCustomDoc, setNewCustomDoc] = useState({ title: '', description: '' })
  const [showCustomDocForm, setShowCustomDocForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [docsSaved, setDocsSaved] = useState(false)

  useEffect(() => {
    if (id) {
      fetchContractById(id).then(() => setInitialLoaded(true))
    }
  }, [id, fetchContractById])

  // Load requiredDocs and customDocRequests from contract content once loaded
  useEffect(() => {
    if (contract) {
      const content = (contract.content as Record<string, any>) || {}
      if (content.requiredDocuments && Array.isArray(content.requiredDocuments)) {
        setRequiredDocs(new Set(content.requiredDocuments))
      } else {
        const defaults = new Set<string>()
        OWNER_DOCUMENT_CHECKLIST.filter(d => d.required).forEach(d => defaults.add(d.category))
        TENANT_DOCUMENT_CHECKLIST.filter(d => d.required).forEach(d => defaults.add(d.category))
        setRequiredDocs(defaults)
      }
      if (content.customDocRequests && Array.isArray(content.customDocRequests)) {
        setCustomDocRequests(content.customDocRequests)
      }
    }
  }, [contract?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialLoaded || (!contract && isLoading)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#515154]">Chargement du contrat…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f7] gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#f0f0f2] flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#86868b]" />
          </div>
          <p className="text-[#515154] font-medium">Contrat introuvable</p>
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] transition-colors"
          >
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
  const ownerCanSign = isOwner && ['DRAFT', 'SENT', 'SIGNED_TENANT'].includes(contract.status) && !hasSigned
  const tenantCanSign = isTenant && ['SENT', 'SIGNED_OWNER'].includes(contract.status) && !hasSigned
  const canSign = ownerCanSign || tenantCanSign
  const canSend = isOwner && contract.status === 'DRAFT'
  const canActivate = isOwner && contract.status === 'COMPLETED'
  const canTerminate = isOwner && contract.status === 'ACTIVE'
  const canDelete = isOwner && contract.status === 'DRAFT'
  const canCancel = isOwner && ['SENT', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(contract.status)
  const isTerminal = ['EXPIRED', 'TERMINATED', 'CANCELLED'].includes(contract.status)

  if (import.meta.env.DEV) {
    console.log('[ContractDetails Debug]', {
      userRole: isOwner ? 'OWNER' : isTenant ? 'TENANT' : 'NONE',
      userId: user?.id,
      contractOwnerId: contract.ownerId,
      contractTenantId: contract.tenantId,
      contractStatus: contract.status,
      canSign,
      ownerCanSign,
      tenantCanSign,
      hasSigned,
      signedByOwner: contract.signedByOwner,
      signedByTenant: contract.signedByTenant,
      isOwner,
      isTenant,
    })
  }

  const handleSend = async () => {
    if (requiredDocs.size === 0) {
      toast.error('Veuillez sélectionner au moins un document requis dans la section Dossier')
      return
    }
    setActionLoading(true)
    try {
      const content = (contract.content as Record<string, any>) || {}
      await updateContract(contract.id, {
        content: {
          ...content,
          requiredDocuments: Array.from(requiredDocs),
          customDocRequests,
        },
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
    setDocsSaved(false)
  }

  const handleSaveDocRequirements = async () => {
    setActionLoading(true)
    try {
      const content = (contract.content as Record<string, any>) || {}
      await updateContract(contract.id, {
        content: {
          ...content,
          requiredDocuments: Array.from(requiredDocs),
          customDocRequests,
        },
      })
      setDocsSaved(true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCustomDoc = () => {
    if (!newCustomDoc.title.trim()) return
    setCustomDocRequests(prev => [...prev, { title: newCustomDoc.title.trim(), description: newCustomDoc.description.trim() }])
    setNewCustomDoc({ title: '', description: '' })
    setShowCustomDocForm(false)
    setDocsSaved(false)
  }

  const handleRemoveCustomDoc = (index: number) => {
    setCustomDocRequests(prev => prev.filter((_, i) => i !== index))
    setDocsSaved(false)
  }

  const handleSignature = async (signatureBase64: string) => {
    setActionLoading(true)
    try {
      const result = await signContract(contract.id, signatureBase64)
      if (result) {
        setShowSignature(false)
      }
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

  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: typeof CheckCircle }> = {
    DRAFT:        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  label: 'Brouillon',                    icon: Circle },
    SENT:         { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   label: 'Envoyé au locataire',           icon: Send },
    SIGNED_OWNER: { bg: 'bg-[#e8f0fe]',  text: 'text-[#0055b3]',  border: 'border-[#aacfff]', label: 'Signé par le propriétaire',     icon: PenTool },
    SIGNED_TENANT:{ bg: 'bg-[#e8f0fe]',  text: 'text-[#0055b3]',  border: 'border-[#aacfff]', label: 'Signé par le locataire',        icon: PenTool },
    COMPLETED:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',label: 'Signé par les deux parties',    icon: CheckCircle },
    ACTIVE:       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',label: 'Actif',                         icon: CheckCircle },
    EXPIRED:      { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',  label: 'Expiré',                        icon: Clock },
    TERMINATED:   { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    label: 'Résilié',                       icon: Ban },
    CANCELLED:    { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',  label: 'Annulé',                        icon: XCircle },
  }

  const status = statusConfig[contract.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  const cardClass = 'bg-white rounded-2xl border border-[#d2d2d7] p-6 mb-6'
  const cardStyle = { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }
  const inputClass = 'w-full bg-white border border-[#d2d2d7] rounded-xl px-3 py-2.5 text-sm text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]'
  const labelClass = 'block text-xs font-medium text-[#86868b] mb-1 uppercase tracking-wide'

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Header */}
        <div className="bg-white border-b border-[#d2d2d7]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/contracts')}
                  className="p-2 bg-white border border-[#d2d2d7] rounded-xl text-[#515154] hover:bg-[#f5f5f7] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    Contrat de Location
                  </h1>
                  <p className="text-[#86868b] mt-0.5 text-sm">{contract.property?.title}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${status.bg} ${status.text} ${status.border}`}>
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
              <div className={`${cardClass}`} style={cardStyle}>
                <div className="flex items-center justify-between">
                  {CONTRACT_STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isCompleted = currentStepIndex > index
                    const isCurrent = currentStepIndex === index
                    const isUpcoming = currentStepIndex < index

                    let signatureDetail = ''
                    if (index === 2 && currentStepIndex === 2) {
                      if (contract.status === 'SIGNED_OWNER') signatureDetail = 'Propriétaire OK'
                      else if (contract.status === 'SIGNED_TENANT') signatureDetail = 'Locataire OK'
                      else if (contract.status === 'COMPLETED') signatureDetail = 'Les 2 parties'
                    }

                    return (
                      <div key={step.status} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                ? 'bg-[#3b82f6] text-white ring-4 ring-[rgba(59,130,246,0.15)]'
                                : 'bg-[#f0f0f2] text-[#86868b]'
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
                              isCompleted ? 'text-emerald-600' : isCurrent ? 'text-[#3b82f6]' : 'text-[#86868b]'
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
                              isCompleted ? 'bg-emerald-400' : isUpcoming ? 'bg-[#d2d2d7]' : 'bg-[#bfdbfe]'
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
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#1d1d1f]">Contrat annulé</p>
                  {cancellation?.reason && (
                    <p className="text-sm text-[#515154] mt-1">Motif : {cancellation.reason}</p>
                  )}
                  {cancellation?.cancelledAt && (
                    <p className="text-xs text-[#86868b] mt-1">
                      Annulé le {format(new Date(cancellation.cancelledAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {contract.status === 'TERMINATED' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Contrat résilié</p>
                  <p className="text-sm text-red-600 mt-1">Ce contrat a été résilié. Le bien est de nouveau disponible.</p>
                </div>
              </div>
            )}

            {/* Status Alerts */}
            {contract.status === 'SENT' && isTenant && (
              <div className="mb-6 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#1d1d1f]">Contrat en attente de votre signature</p>
                  <p className="text-sm text-[#3b82f6] mt-1">
                    Le propriétaire vous a envoyé ce contrat. Lisez-le attentivement puis signez-le ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {isTenant && !canSign && !['COMPLETED', 'CANCELLED', 'TERMINATED', 'ACTIVE'].includes(contract.status) && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Impossible de signer pour le moment</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {hasSigned
                      ? 'Vous avez déjà signé ce contrat.'
                      : contract.status === 'DRAFT'
                      ? "Le propriétaire n'a pas encore envoyé ce contrat. Vous pourrez le signer une fois qu'il vous l'aura transmis."
                      : "Ce contrat n'est pas dans un état permettant la signature."}
                  </p>
                </div>
              </div>
            )}

            {contract.status === 'COMPLETED' && isOwner && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-700">Les deux parties ont signé</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Vous pouvez maintenant activer le contrat. Le bien sera marqué comme occupé.
                  </p>
                </div>
              </div>
            )}

            {hasSigned && !otherPartySigned && !isTerminal && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Vous avez signé ce contrat. En attente de la signature de l'autre partie.
                </p>
              </div>
            )}

            {/* Action Buttons Bar */}
            {!isTerminal && (canSend || canSign || canActivate || canTerminate || canDelete || canCancel) && (
              <div className={`${cardClass}`} style={cardStyle}>
                <div className="flex flex-wrap gap-3">
                  {canSend && (
                    <button
                      onClick={() => setShowSendModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer au locataire
                    </button>
                  )}

                  {canSign && (
                    <button
                      onClick={() => setShowSignature(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
                    >
                      <PenTool className="w-4 h-4" />
                      Signer le contrat
                    </button>
                  )}

                  {canActivate && (
                    <button
                      onClick={handleActivate}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Activer le contrat
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setConfirmModal('cancel')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler le contrat
                    </button>
                  )}

                  {canTerminate && (
                    <button
                      onClick={() => setConfirmModal('terminate')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Résilier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => setConfirmModal('delete')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Property Info */}
            <div className={cardClass} style={cardStyle}>
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">Propriété</h2>
              <div className="flex gap-4">
                {contract.property?.images?.[0] && (
                  <img
                    src={contract.property.images[0]}
                    alt={contract.property.title}
                    className="w-28 h-28 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1d1d1f] mb-2">{contract.property?.title}</h3>
                  <div className="flex items-center text-sm text-[#515154] mb-2">
                    <HomeIcon className="w-4 h-4 mr-2 text-[#86868b]" />
                    {contract.property?.address}, {contract.property?.city} {contract.property?.postalCode}
                  </div>
                  {contract.property?.bedrooms != null && (
                    <p className="text-sm text-[#86868b]">
                      {contract.property.bedrooms} chambres — {contract.property.bathrooms} SDB — {contract.property.surface} m²
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Owner */}
              <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5" style={cardStyle}>
                <h3 className="font-semibold text-[#1d1d1f] mb-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#3b82f6]" />
                  </div>
                  Propriétaire
                </h3>
                <p className="font-medium text-[#1d1d1f]">{contract.owner?.firstName} {contract.owner?.lastName}</p>
                <p className="text-sm text-[#86868b] mt-0.5">{contract.owner?.email}</p>
                {contract.owner?.phone && <p className="text-sm text-[#86868b]">{contract.owner.phone}</p>}

                {contract.signedByOwner ? (
                  <div className="mt-3 pt-3 border-t border-[#f0f0f2]">
                    <div className="flex items-center text-sm text-emerald-600 mb-2">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Signé le {format(new Date(contract.signedByOwner), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                    {contract.ownerSignature && (
                      <img src={contract.ownerSignature} alt="Signature propriétaire" className="h-14 border border-[#d2d2d7] rounded-lg p-1 bg-white" />
                    )}
                    {signatureMetadata?.owner && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-[#86868b]">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Signature électronique certifiée
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center text-sm text-amber-600 pt-3 border-t border-[#f0f0f2]">
                    <Clock className="w-4 h-4 mr-1.5" />
                    En attente de signature
                  </div>
                )}
              </div>

              {/* Tenant */}
              <div className="bg-white rounded-2xl border border-[#d2d2d7] p-5" style={cardStyle}>
                <h3 className="font-semibold text-[#1d1d1f] mb-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#3b82f6]" />
                  </div>
                  Locataire
                </h3>
                <p className="font-medium text-[#1d1d1f]">{contract.tenant?.firstName} {contract.tenant?.lastName}</p>
                <p className="text-sm text-[#86868b] mt-0.5">{contract.tenant?.email}</p>
                {contract.tenant?.phone && <p className="text-sm text-[#86868b]">{contract.tenant.phone}</p>}

                {contract.signedByTenant ? (
                  <div className="mt-3 pt-3 border-t border-[#f0f0f2]">
                    <div className="flex items-center text-sm text-emerald-600 mb-2">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Signé le {format(new Date(contract.signedByTenant), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                    {contract.tenantSignature && (
                      <img src={contract.tenantSignature} alt="Signature locataire" className="h-14 border border-[#d2d2d7] rounded-lg p-1 bg-white" />
                    )}
                    {signatureMetadata?.tenant && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-[#86868b]">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Signature électronique certifiée
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center text-sm text-amber-600 pt-3 border-t border-[#f0f0f2]">
                    <Clock className="w-4 h-4 mr-1.5" />
                    En attente de signature
                  </div>
                )}
              </div>
            </div>

            {/* Contract Details */}
            <div className={cardClass} style={cardStyle}>
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-5">Détails du contrat</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className={labelClass}>Période</p>
                  <div className="flex items-center text-[#1d1d1f] font-medium">
                    <Calendar className="w-4 h-4 mr-2 text-[#86868b]" />
                    {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} —{' '}
                    {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#f5f5f7] rounded-xl p-4">
                  <p className={labelClass}>Loyer mensuel</p>
                  <div className="flex items-center text-xl font-bold text-[#3b82f6]">
                    <Euro className="w-5 h-5 mr-1" />
                    {contract.monthlyRent} €
                  </div>
                </div>
                {contract.charges != null && (
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <p className={labelClass}>Charges</p>
                    <div className="flex items-center text-xl font-bold text-[#1d1d1f]">
                      <Euro className="w-5 h-5 mr-1 text-[#86868b]" />
                      {contract.charges} €
                    </div>
                  </div>
                )}
                {contract.deposit != null && (
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <p className={labelClass}>Dépôt de garantie</p>
                    <div className="flex items-center text-xl font-bold text-[#1d1d1f]">
                      <Euro className="w-5 h-5 mr-1 text-[#86868b]" />
                      {contract.deposit} €
                    </div>
                  </div>
                )}
              </div>

              {contract.terms && (
                <div className="mt-6 pt-6 border-t border-[#f0f0f2]">
                  <p className={labelClass}>Conditions particulières</p>
                  <p className="text-sm text-[#515154] whitespace-pre-wrap mt-1">{contract.terms}</p>
                </div>
              )}
            </div>

            {/* Clauses */}
            {clauses.length > 0 && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">Clauses du contrat</h2>
                <div className="space-y-3">
                  {clauses.filter((c) => c.enabled).map((clause, index) => (
                    <div key={clause.id} className="border border-[#d2d2d7] rounded-xl p-3">
                      <h4 className="font-medium text-[#1d1d1f] text-sm">
                        {index + 1}. {clause.title}
                        {clause.isCustom && (
                          <span className="ml-2 text-xs bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe] px-2 py-0.5 rounded-full">
                            Personnalisée
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-[#515154] mt-1">{clause.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF & EDL */}
            <div className={cardClass} style={cardStyle}>
              <h3 className="font-semibold text-[#1d1d1f] mb-4">Documents</h3>
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
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                      disabled={loading}
                    >
                      {loading ? (
                        'Génération du PDF...'
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Télécharger le contrat PDF
                        </>
                      )}
                    </button>
                  )}
                </PDFDownloadLink>

                {contract.status !== 'DRAFT' && (
                  <Link
                    to={`/contracts/${contract.id}/edl`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    État des lieux
                  </Link>
                )}
              </div>
            </div>

            {/* Document Requirements Section - DRAFT mode */}
            {contract.status === 'DRAFT' && isOwner && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-lg font-semibold text-[#1d1d1f] mb-1.5 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#3b82f6]" />
                  Dossier de location — Documents requis
                </h2>
                <p className="text-sm text-[#86868b] mb-5">
                  Sélectionnez les documents que le locataire devra fournir avant la signature du contrat.
                </p>

                {/* Owner documents (DDT) */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2.5">Documents propriétaire (DDT)</h4>
                  <div className="space-y-1">
                    {OWNER_DOCUMENT_CHECKLIST.map((item) => (
                      <label key={item.category} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={requiredDocs.has(item.category)}
                          onChange={() => toggleRequiredDoc(item.category)}
                          className="mt-0.5 rounded border-[#d2d2d7] text-[#3b82f6] focus:ring-[rgba(59,130,246,0.2)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1d1d1f]">{item.label}</p>
                          <p className="text-xs text-[#86868b]">{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tenant documents */}
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-[#1d1d1f] mb-2.5">Documents locataire</h4>
                  <div className="space-y-1">
                    {TENANT_DOCUMENT_CHECKLIST.map((item) => (
                      <label key={item.category} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={requiredDocs.has(item.category)}
                          onChange={() => toggleRequiredDoc(item.category)}
                          className="mt-0.5 rounded border-[#d2d2d7] text-[#3b82f6] focus:ring-[rgba(59,130,246,0.2)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1d1d1f]">{item.label}</p>
                          <p className="text-xs text-[#86868b]">{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom document requests */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-sm font-semibold text-[#1d1d1f]">Demandes personnalisées</h4>
                    <button
                      type="button"
                      onClick={() => setShowCustomDocForm(true)}
                      className="text-sm text-[#3b82f6] hover:text-[#2563eb] flex items-center gap-1 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  {customDocRequests.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {customDocRequests.map((doc, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl">
                          <FileText className="w-4 h-4 text-[#3b82f6] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1d1d1f]">{doc.title}</p>
                            {doc.description && (
                              <p className="text-xs text-[#86868b] mt-0.5">{doc.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCustomDoc(index)}
                            className="p-1 rounded text-[#86868b] hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCustomDocForm && (
                    <div className="p-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl space-y-2.5">
                      <input
                        type="text"
                        value={newCustomDoc.title}
                        onChange={(e) => setNewCustomDoc(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Titre du document (ex : Garantie Visale)"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={newCustomDoc.description}
                        onChange={(e) => setNewCustomDoc(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description (facultatif)"
                        className={inputClass}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setShowCustomDocForm(false); setNewCustomDoc({ title: '', description: '' }) }}
                          className="px-3 py-1.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-xs font-semibold hover:bg-[#f5f5f7] transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAddCustomDoc}
                          disabled={!newCustomDoc.title.trim()}
                          className="px-3 py-1.5 bg-[#3b82f6] text-white rounded-xl text-xs font-semibold hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}

                  {customDocRequests.length === 0 && !showCustomDocForm && (
                    <p className="text-xs text-[#86868b] italic">Aucune demande personnalisée</p>
                  )}
                </div>

                <div className="text-xs text-[#86868b] mb-4 p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl">
                  Format accepté : PDF uniquement — Taille max : 5 Mo par document
                </div>

                <button
                  onClick={handleSaveDocRequirements}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                >
                  {docsSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      Enregistré
                    </>
                  ) : (
                    'Enregistrer les documents requis'
                  )}
                </button>
              </div>
            )}

            {/* Documents - Dossier de location (after DRAFT) */}
            {contract.status !== 'DRAFT' && (
              <div className={cardClass} style={cardStyle}>
                <h2 className="text-lg font-semibold text-[#1d1d1f] mb-1.5 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#3b82f6]" />
                  Dossier de location
                </h2>
                <p className="text-sm text-[#86868b] mb-5">
                  Téléchargez les documents obligatoires pour constituer le dossier complet.
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

                {(isOwner || isTenant) && (() => {
                  const customDocItems = (contractContent.customDocRequests ?? []).map(
                    (req: { title: string; description: string }, i: number) => ({
                      category: `CUSTOM_${i}`,
                      label: req.title,
                      description: req.description || '',
                    })
                  )
                  const tenantRequired = isOwner ? undefined : requiredDocuments
                  return (
                    <DocumentChecklist
                      contractId={contract.id}
                      userRole="TENANT"
                      isOwner={isOwner}
                      requiredCategories={tenantRequired}
                      customItems={customDocItems}
                    />
                  )
                })()}
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

        {/* Send Confirmation Modal */}
        {showSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#d2d2d7]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1d1d1f]">Envoyer le contrat</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#f0f0f2] transition-colors"
                >
                  <X className="w-5 h-5 text-[#86868b]" />
                </button>
              </div>

              <p className="text-sm text-[#515154] mb-4">
                Le contrat sera envoyé au locataire avec la liste des {requiredDocs.size} document(s) requis
                {customDocRequests.length > 0 ? ` et ${customDocRequests.length} demande(s) personnalisée(s)` : ''}.
              </p>

              {requiredDocs.size === 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Veuillez d'abord sélectionner les documents requis dans la section "Dossier de location" ci-dessus.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={actionLoading || requiredDocs.size === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white rounded-xl text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Confirmer l'envoi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#d2d2d7]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1d1d1f]">
                  {confirmModal === 'delete' && 'Supprimer le contrat'}
                  {confirmModal === 'terminate' && 'Résilier le contrat'}
                  {confirmModal === 'cancel' && 'Annuler le contrat'}
                </h3>
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  className="p-1.5 rounded-xl hover:bg-[#f0f0f2] transition-colors"
                >
                  <X className="w-5 h-5 text-[#86868b]" />
                </button>
              </div>

              <div className={`p-3 rounded-xl mb-4 flex items-start gap-2 ${
                confirmModal === 'cancel' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  confirmModal === 'cancel' ? 'text-amber-500' : 'text-red-500'
                }`} />
                <div className="text-sm">
                  {confirmModal === 'delete' && (
                    <p className="text-red-700">
                      Cette action est irréversible. Le contrat brouillon sera définitivement supprimé.
                    </p>
                  )}
                  {confirmModal === 'terminate' && (
                    <p className="text-red-700">
                      La résiliation mettra fin au contrat actif. Le bien sera remis en disponible.
                    </p>
                  )}
                  {confirmModal === 'cancel' && (
                    <>
                      <p className="text-amber-800 font-medium">
                        Attention : cette action annulera le contrat en cours de signature.
                      </p>
                      <p className="text-amber-700 mt-1">
                        {contract.signedByOwner || contract.signedByTenant
                          ? 'Une ou plusieurs signatures ont déjà été apposées. Elles seront invalidées.'
                          : "Le locataire sera notifié de l'annulation."}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {confirmModal === 'cancel' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                    Motif de l'annulation (obligatoire)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex : Erreur dans les conditions, changement de locataire..."
                    className="w-full bg-white border border-[#d2d2d7] rounded-xl p-3 text-sm text-[#1d1d1f] h-24 resize-none outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)] placeholder:text-[#86868b]"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-white border border-[#d2d2d7] text-[#515154] rounded-xl text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50 transition-colors"
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
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors ${
                    confirmModal === 'cancel' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'
                  }`}
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
                  {confirmModal === 'delete' && 'Supprimer définitivement'}
                  {confirmModal === 'terminate' && 'Confirmer la résiliation'}
                  {confirmModal === 'cancel' && "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
