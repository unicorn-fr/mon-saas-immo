import { useEffect, useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { dossierService, TenantDocument } from '../../services/dossier.service'
import { ContractClause } from '../../types/contract.types'
import { SignaturePad } from '../../components/contract/SignaturePad'
import { ContractPDF } from '../../components/contract/ContractPDF'
import { DocumentChecklist } from '../../components/document/DocumentChecklist'
import { DossierReviewModal } from '../../components/document/DossierReviewModal'
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
import { useDocumentStore } from '../../store/documentStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { celebrateBig, celebrateSmall } from '../../utils/celebrate'


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

  const { documents, fetchDocuments } = useDocumentStore()

  const [confirmModal, setConfirmModal] = useState<ConfirmModalType>(null)
  const [showSignature, setShowSignature] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPreSendChecklist, setShowPreSendChecklist] = useState(false)
  const [showDossierModal, setShowDossierModal] = useState(false)
  const [showPreSignChecklist, setShowPreSignChecklist] = useState(false)
  // Owner pre-send checklist: well info + clauses + dossier checked
  const [preSendChecks, setPreSendChecks] = useState({ property: false, clauses: false, dossier: false, docs: false })
  // Tenant pre-sign checklist: property info + clauses + amounts
  const [preSignChecks, setPreSignChecks] = useState({ property: false, clauses: false, amounts: false })
  const [requiredDocs, setRequiredDocs] = useState<Set<string>>(new Set())
  const [customDocRequests, setCustomDocRequests] = useState<{ title: string; description: string }[]>([])
  const [newCustomDoc, setNewCustomDoc] = useState({ title: '', description: '' })
  const [showCustomDocForm, setShowCustomDocForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [docsSaved, setDocsSaved] = useState(false)
  const [tenantDossierDocs, setTenantDossierDocs] = useState<TenantDocument[]>([])

  useEffect(() => {
    if (id) {
      fetchContractById(id).then(() => setInitialLoaded(true))
      fetchDocuments(id)
    }
  }, [id, fetchContractById, fetchDocuments])

  // Charger le dossier du locataire pour vérifier les pièces requises avant signature
  useEffect(() => {
    const isTenantUser = user?.id && contract?.tenantId && user.id === contract.tenantId
    if (isTenantUser) {
      dossierService.getDocuments().then(setTenantDossierDocs).catch(() => setTenantDossierDocs([]))
    }
  }, [user?.id, contract?.tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `2px solid ${BAI.border}`,
                borderTopColor: BAI.night,
              }}
              className="animate-spin"
            />
            <p style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement du contrat…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!contract) {
    return (
      <Layout>
        <div
          className="flex flex-col items-center justify-center min-h-screen gap-4"
          style={{ background: BAI.bgBase, fontFamily: BAI.fontBody }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle style={{ width: 28, height: 28, color: BAI.inkFaint }} />
          </div>
          <p style={{ fontSize: 14, color: BAI.inkMid, fontWeight: 500 }}>Contrat introuvable</p>
          <button
            onClick={() => navigate('/contracts')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: BAI.night, color: '#ffffff',
              fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
              border: 'none', cursor: 'pointer',
            }}
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
  // ── Gate de validation documents ─────────────────────────────────────────
  // Le propriétaire doit avoir validé tous les documents du locataire avant de signer
  // Compte les docs non-rejetés qui ne sont pas encore VALIDATED
  const unvalidatedTenantDocs = documents.filter(
    (d) => d.status === 'UPLOADED' && d.fromDossier !== true
  )
  const allTenantDocsValidated = unvalidatedTenantDocs.length === 0

  const ownerCanSign = isOwner && contract.status === 'SIGNED_TENANT' && !hasSigned
  // Le propriétaire peut signer uniquement si tous les docs locataire sont validés
  const ownerSignBlocked = ownerCanSign && !allTenantDocsValidated
  const tenantCanSign = isTenant && ['SENT', 'SIGNED_OWNER'].includes(contract.status) && !hasSigned

  // Vérification du dossier locataire : IDENTITE + au moins un doc REVENUS requis
  const REQUIRED_DOSSIER_CATEGORIES: { key: string; label: string }[] = [
    { key: 'IDENTITE_LOCATAIRE', label: 'Pièce d\'identité' },
    { key: 'FICHE_PAIE_1', label: 'Fiche de paie (mois M-1)' },
  ]
  const uploadedCategories = new Set(tenantDossierDocs.map(d => d.category))
  const tenantDossierMissing = REQUIRED_DOSSIER_CATEGORIES.filter(c => !uploadedCategories.has(c.key))
  const tenantSignBlocked = tenantCanSign && tenantDossierMissing.length > 0

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
      setShowPreSendChecklist(false)
      celebrateSmall()
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
        if (result.status === 'COMPLETED' || result.status === 'ACTIVE') {
          celebrateBig()
        } else {
          celebrateSmall()
        }
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

  // Maison status config
  const statusConfig: Record<string, { bg: string; color: string; border: string; label: string; icon: typeof CheckCircle }> = {
    DRAFT:         { bg: BAI.bgMuted,       color: BAI.inkMid,  border: BAI.borderStrong,   label: 'Brouillon',                   icon: Circle },
    SENT:          { bg: BAI.warningLight,   color: BAI.warning, border: BAI.caramel,     label: 'Envoyé au locataire',          icon: Send },
    SIGNED_OWNER:  { bg: BAI.ownerLight,  color: BAI.owner,   border: BAI.ownerBorder, label: 'Signé par le propriétaire',   icon: PenTool },
    SIGNED_TENANT: { bg: BAI.ownerLight,  color: BAI.owner,   border: BAI.ownerBorder, label: 'Signé par le locataire',      icon: PenTool },
    COMPLETED:     { bg: BAI.tenantLight, color: BAI.tenant,  border: BAI.tenantBorder,label: 'Signé par les deux parties',  icon: CheckCircle },
    ACTIVE:        { bg: BAI.tenantLight, color: BAI.tenant,  border: BAI.tenantBorder,label: 'Actif',                       icon: CheckCircle },
    EXPIRED:       { bg: BAI.bgMuted,       color: BAI.inkFaint,border: BAI.border,      label: 'Expiré',                      icon: Clock },
    TERMINATED:    { bg: BAI.errorLight,    color: BAI.error,  border: '#fca5a5',     label: 'Résilié',                     icon: Ban },
    CANCELLED:     { bg: BAI.bgMuted,       color: BAI.inkFaint,border: BAI.border,      label: 'Annulé',                      icon: XCircle },
  }

  const status = statusConfig[contract.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  const cardStyle: React.CSSProperties = {
    background: BAI.bgSurface,
    border: `1px solid ${BAI.border}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
    padding: '24px',
    marginBottom: 24,
    fontFamily: BAI.fontBody,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: BAI.bgInput,
    border: `1px solid ${BAI.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: BAI.ink,
    outline: 'none',
    fontFamily: BAI.fontBody,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: BAI.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 4,
    fontFamily: BAI.fontBody,
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 8,
    background: BAI.night, color: '#ffffff',
    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
    border: 'none', cursor: 'pointer',
  }

  const btnGhost: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 8,
    background: BAI.bgSurface, color: BAI.inkMid,
    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
    border: `1px solid ${BAI.border}`, cursor: 'pointer',
  }

  const btnDanger: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 8,
    background: BAI.errorLight, color: BAI.error,
    fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
    border: `1px solid #fca5a5`, cursor: 'pointer',
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>
        {/* Header */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/contracts')}
                  style={{
                    padding: 8, background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`, borderRadius: 8,
                    color: BAI.inkMid, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}
                >
                  <ArrowLeft style={{ width: 18, height: 18 }} />
                </button>
                <div>
                  <p style={{
                    fontFamily: BAI.fontBody, fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: BAI.inkFaint, marginBottom: 4,
                  }}>
                    Gestion locative
                  </p>
                  <h1 style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 32, color: BAI.ink, lineHeight: 1.1, margin: 0,
                  }}>
                    Contrat de Location
                  </h1>
                  <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 2 }}>
                    {contract.property?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: status.bg, color: status.color,
                  border: `1px solid ${status.border}`,
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 12,
                }}>
                  <StatusIcon style={{ width: 13, height: 13 }} />
                  {status.label}
                </span>
                <PDFDownloadLink
                  document={<ContractPDF contract={contract} clauses={clauses.filter((c) => c.enabled)} />}
                  fileName={`contrat-${contract.property?.title?.replace(/\s+/g, '-').toLowerCase() || 'location'}.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <button
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8,
                        background: BAI.caramel, color: '#ffffff',
                        fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 12,
                        border: 'none', cursor: pdfLoading ? 'wait' : 'pointer',
                        opacity: pdfLoading ? 0.7 : 1,
                      }}
                      disabled={pdfLoading}
                    >
                      <Download style={{ width: 13, height: 13 }} />
                      {pdfLoading ? 'Génération…' : 'PDF'}
                    </button>
                  )}
                </PDFDownloadLink>
                {contract.status !== 'DRAFT' && (
                  <Link
                    to={`/contracts/${contract.id}/edl/session`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      background: BAI.bgMuted, color: BAI.inkMid,
                      border: `1px solid ${BAI.border}`,
                      fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 12,
                      textDecoration: 'none',
                    }}
                  >
                    <ClipboardCheck style={{ width: 13, height: 13 }} />
                    État des lieux
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">

            {/* Progress Stepper */}
            {!isTerminal && (
              <div style={cardStyle}>
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
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCompleted ? BAI.tenant : isCurrent ? BAI.night : BAI.bgMuted,
                            color: isCompleted || isCurrent ? '#ffffff' : BAI.inkFaint,
                            boxShadow: isCurrent ? `0 0 0 4px rgba(26,26,46,0.12)` : 'none',
                            transition: 'all 0.2s',
                          }}>
                            {isCompleted ? (
                              <Check style={{ width: 18, height: 18 }} />
                            ) : (
                              <StepIcon style={{ width: 18, height: 18 }} />
                            )}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 500, marginTop: 6,
                            color: isCompleted ? BAI.tenant : isCurrent ? BAI.night : BAI.inkFaint,
                          }}>
                            {step.label}
                          </span>
                          {signatureDetail && (
                            <span style={{ fontSize: 10, color: BAI.caramel, marginTop: 2 }}>{signatureDetail}</span>
                          )}
                        </div>
                        {index < CONTRACT_STEPS.length - 1 && (
                          <div style={{
                            height: 2, flex: 1, marginLeft: 4, marginRight: 4, marginTop: -24,
                            background: isCompleted ? BAI.tenant : isUpcoming ? BAI.border : BAI.ownerBorder,
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Terminal status banners */}
            {contract.status === 'CANCELLED' && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <XCircle style={{ width: 18, height: 18, color: BAI.inkFaint, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>Contrat annulé</p>
                  {cancellation?.reason && (
                    <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 4 }}>Motif : {cancellation.reason}</p>
                  )}
                  {cancellation?.cancelledAt && (
                    <p style={{ fontSize: 11, color: BAI.inkFaint, marginTop: 4 }}>
                      Annulé le {format(new Date(cancellation.cancelledAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {contract.status === 'TERMINATED' && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.errorLight, border: `1px solid #fca5a5`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <Ban style={{ width: 18, height: 18, color: BAI.error, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.error }}>Contrat résilié</p>
                  <p style={{ fontSize: 13, color: BAI.error, opacity: 0.8, marginTop: 4 }}>
                    Ce contrat a été résilié. Le bien est de nouveau disponible.
                  </p>
                </div>
              </div>
            )}

            {/* Status Alerts */}
            {contract.status === 'SENT' && isTenant && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <Info style={{ width: 18, height: 18, color: BAI.owner, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>Contrat en attente de votre signature</p>
                  <p style={{ fontSize: 13, color: BAI.owner, marginTop: 4 }}>
                    Le propriétaire vous a envoyé ce contrat. Lisez-le attentivement puis signez-le ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {isTenant && !canSign && !['COMPLETED', 'CANCELLED', 'TERMINATED', 'ACTIVE'].includes(contract.status) && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.warningLight, border: `1px solid ${BAI.caramel}`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <AlertCircle style={{ width: 18, height: 18, color: BAI.warning, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.warning }}>Impossible de signer pour le moment</p>
                  <p style={{ fontSize: 13, color: BAI.warning, opacity: 0.85, marginTop: 4 }}>
                    {hasSigned
                      ? 'Vous avez déjà signé ce contrat.'
                      : contract.status === 'DRAFT'
                      ? "Le propriétaire n'a pas encore envoyé ce contrat. Vous pourrez le signer une fois qu'il vous l'aura transmis."
                      : "Ce contrat n'est pas dans un état permettant la signature."}
                  </p>
                </div>
              </div>
            )}

            {/* Gate validation : propriétaire doit valider les docs avant de signer */}
            {ownerSignBlocked && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: '#fdf5ec', border: `1px solid #f3c99a`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <ClipboardCheck style={{ width: 18, height: 18, color: BAI.warning, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.warning }}>Validation des documents requise</p>
                  <p style={{ fontSize: 13, color: BAI.warning, opacity: 0.85, marginTop: 4 }}>
                    {unvalidatedTenantDocs.length} document{unvalidatedTenantDocs.length > 1 ? 's' : ''} en attente de validation.
                    Consultez et validez chaque pièce justificative dans la section « Dossier documents » ci-dessous avant de signer.
                  </p>
                </div>
              </div>
            )}

            {/* Owner waiting for tenant to sign */}
            {isOwner && ['SENT', 'SIGNED_OWNER'].includes(contract.status) && !hasSigned && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.warningLight, border: `1px solid ${BAI.caramel}`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <Clock style={{ width: 18, height: 18, color: BAI.warning, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.warning }}>En attente de la signature du locataire</p>
                  <p style={{ fontSize: 13, color: BAI.warning, opacity: 0.85, marginTop: 4 }}>
                    Le locataire doit signer en premier. Vous pourrez apposer votre signature une fois qu'il aura signé.
                  </p>
                </div>
              </div>
            )}

            {contract.status === 'COMPLETED' && isOwner && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <CheckCircle style={{ width: 18, height: 18, color: BAI.tenant, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.tenant }}>Les deux parties ont signé</p>
                  <p style={{ fontSize: 13, color: BAI.tenant, opacity: 0.85, marginTop: 4 }}>
                    Vous pouvez maintenant activer le contrat. Le bien sera marqué comme occupé.
                  </p>
                </div>
              </div>
            )}

            {hasSigned && !otherPartySigned && !isTerminal && (
              <div style={{
                marginBottom: 24, padding: '14px 16px',
                background: BAI.warningLight, border: `1px solid ${BAI.caramel}`,
                borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <AlertCircle style={{ width: 16, height: 16, color: BAI.warning, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: BAI.warning }}>
                  Vous avez signé ce contrat. En attente de la signature de l'autre partie.
                </p>
              </div>
            )}

            {/* Action Buttons Bar */}
            {!isTerminal && (canSend || canSign || canActivate || canTerminate || canDelete || canCancel) && (
              <div style={cardStyle}>
                <div className="flex flex-wrap gap-3">
                  {canSend && (
                    <button
                      onClick={() => { setPreSendChecks({ property: false, clauses: false, dossier: false, docs: false }); setShowPreSendChecklist(true) }}
                      disabled={actionLoading}
                      style={{ ...btnPrimary, opacity: actionLoading ? 0.5 : 1 }}
                    >
                      <Send style={{ width: 15, height: 15 }} />
                      Envoyer au locataire
                    </button>
                  )}

                  {canSign && !tenantSignBlocked && (
                    <>
                      <button
                        onClick={() => {
                          if (ownerSignBlocked) return
                          if (isTenant) {
                            setPreSignChecks({ property: false, clauses: false, amounts: false })
                            setShowPreSignChecklist(true)
                          } else {
                            setShowSignature(true)
                          }
                        }}
                        disabled={actionLoading || ownerSignBlocked}
                        title={ownerSignBlocked ? 'Validez tous les documents du locataire avant de signer' : undefined}
                        style={{
                          ...btnPrimary,
                          opacity: actionLoading || ownerSignBlocked ? 0.5 : 1,
                          cursor: ownerSignBlocked ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <PenTool style={{ width: 15, height: 15 }} />
                        Signer le contrat
                      </button>

                      {/* YouSign stub — signature électronique certifiée eIDAS */}
                      <button
                        onClick={() => toast('Intégration YouSign bientôt disponible — utilisez la signature intégrée ci-dessus en attendant.', { icon: '🔏' })}
                        disabled={actionLoading || ownerSignBlocked}
                        title="Signature certifiée eIDAS via YouSign — bientôt disponible"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          padding: '10px 18px', borderRadius: 8,
                          background: BAI.bgSurface, color: BAI.inkMid,
                          border: `1px solid ${BAI.border}`, cursor: 'pointer',
                          fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                          opacity: actionLoading || ownerSignBlocked ? 0.4 : 1,
                        }}
                      >
                        <ShieldCheck style={{ width: 15, height: 15, color: BAI.caramel }} />
                        YouSign
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: BAI.caramelLight, color: BAI.caramel,
                          border: `1px solid #e8c99a`, borderRadius: 4,
                          padding: '1px 5px', letterSpacing: '0.04em',
                        }}>
                          BIENTÔT
                        </span>
                      </button>
                    </>
                  )}

                  {tenantSignBlocked && (
                    <div style={{
                      background: '#fdf5ec',
                      border: '1px solid #f3c99a',
                      borderRadius: 10,
                      padding: '14px 18px',
                      fontFamily: BAI.fontBody,
                      width: '100%',
                    }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle style={{ width: 18, height: 18, color: '#92400e', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
                            Signature impossible — votre dossier locatif est incomplet.
                          </p>
                          <p style={{ fontSize: 12, color: '#92400e', margin: '0 0 8px' }}>
                            Les pièces suivantes sont manquantes :{' '}
                            <strong>{tenantDossierMissing.map(c => c.label).join(', ')}</strong>.
                          </p>
                          <Link
                            to="/dossier"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 600, color: '#92400e',
                              textDecoration: 'underline', textDecorationColor: '#f3c99a',
                            }}
                          >
                            <FolderOpen style={{ width: 13, height: 13 }} />
                            Compléter mon dossier
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {canActivate && (
                    <button
                      onClick={handleActivate}
                      disabled={actionLoading}
                      style={{
                        ...btnPrimary,
                        background: BAI.tenant,
                        opacity: actionLoading ? 0.5 : 1,
                      }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} />
                      Activer le contrat
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => setConfirmModal('cancel')}
                      disabled={actionLoading}
                      style={{ ...btnGhost, opacity: actionLoading ? 0.5 : 1 }}
                    >
                      <XCircle style={{ width: 15, height: 15 }} />
                      Annuler le contrat
                    </button>
                  )}

                  {canTerminate && (
                    <button
                      onClick={() => setConfirmModal('terminate')}
                      disabled={actionLoading}
                      style={{ ...btnDanger, opacity: actionLoading ? 0.5 : 1 }}
                    >
                      <Ban style={{ width: 15, height: 15 }} />
                      Résilier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => setConfirmModal('delete')}
                      disabled={actionLoading}
                      style={{ ...btnDanger, opacity: actionLoading ? 0.5 : 1 }}
                    >
                      <Trash2 style={{ width: 15, height: 15 }} />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Property Info */}
            <div style={cardStyle}>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 16,
              }}>
                Propriété
              </h2>
              <div className="flex gap-4">
                {contract.property?.images?.[0] && (
                  <img
                    src={contract.property.images[0]}
                    alt={contract.property.title}
                    style={{ width: 112, height: 112, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div className="flex-1">
                  <h3 style={{ fontWeight: 600, fontSize: 15, color: BAI.ink, marginBottom: 6 }}>
                    {contract.property?.title}
                  </h3>
                  <div className="flex items-center" style={{ fontSize: 13, color: BAI.inkMid, gap: 6, marginBottom: 6 }}>
                    <HomeIcon style={{ width: 14, height: 14, color: BAI.inkFaint }} />
                    {contract.property?.address}, {contract.property?.city} {contract.property?.postalCode}
                  </div>
                  {contract.property?.bedrooms != null && (
                    <p style={{ fontSize: 12, color: BAI.inkFaint }}>
                      {contract.property.bedrooms} chambres — {contract.property.bathrooms} SDB — {contract.property.surface} m²
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Owner */}
              <div style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 12,
                borderLeft: `3px solid ${contract.signedByOwner ? BAI.tenant : BAI.border}`,
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                padding: '20px',
              }}>
                <h3 style={{ fontWeight: 600, fontSize: 13, color: BAI.ink, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User style={{ width: 14, height: 14, color: BAI.owner }} />
                  </div>
                  Propriétaire
                </h3>
                <p style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>
                  {contract.owner?.firstName} {contract.owner?.lastName}
                </p>
                <p style={{ fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>{contract.owner?.email}</p>
                {contract.owner?.phone && <p style={{ fontSize: 12, color: BAI.inkFaint }}>{contract.owner.phone}</p>}

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BAI.border}` }}>
                  {contract.signedByOwner ? (
                    <>
                      <div className="flex items-center" style={{ fontSize: 12, color: BAI.tenant, gap: 6, marginBottom: 8 }}>
                        <CheckCircle style={{ width: 13, height: 13 }} />
                        Signé le {format(new Date(contract.signedByOwner), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </div>
                      {contract.ownerSignature && (
                        <img src={contract.ownerSignature} alt="Signature propriétaire"
                          style={{ height: 56, border: `1px solid ${BAI.border}`, borderRadius: 6, padding: 4, background: BAI.bgSurface }} />
                      )}
                      {signatureMetadata?.owner && (
                        <div className="flex items-center" style={{ marginTop: 8, gap: 4, fontSize: 11, color: BAI.inkFaint }}>
                          <ShieldCheck style={{ width: 12, height: 12, color: BAI.tenant }} />
                          Signature électronique certifiée
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center" style={{ fontSize: 12, color: BAI.caramel, gap: 6 }}>
                      <Clock style={{ width: 13, height: 13 }} />
                      En attente de signature
                    </div>
                  )}
                </div>
              </div>

              {/* Tenant */}
              <div style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 12,
                borderLeft: `3px solid ${contract.signedByTenant ? BAI.tenant : BAI.border}`,
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                padding: '20px',
              }}>
                <h3 style={{ fontWeight: 600, fontSize: 13, color: BAI.ink, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: BAI.tenantLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User style={{ width: 14, height: 14, color: BAI.tenant }} />
                  </div>
                  Locataire
                </h3>
                <p style={{ fontWeight: 600, fontSize: 14, color: BAI.ink }}>
                  {contract.tenant?.firstName} {contract.tenant?.lastName}
                </p>
                <p style={{ fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>{contract.tenant?.email}</p>
                {contract.tenant?.phone && <p style={{ fontSize: 12, color: BAI.inkFaint }}>{contract.tenant.phone}</p>}

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BAI.border}` }}>
                  {contract.signedByTenant ? (
                    <>
                      <div className="flex items-center" style={{ fontSize: 12, color: BAI.tenant, gap: 6, marginBottom: 8 }}>
                        <CheckCircle style={{ width: 13, height: 13 }} />
                        Signé le {format(new Date(contract.signedByTenant), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </div>
                      {contract.tenantSignature && (
                        <img src={contract.tenantSignature} alt="Signature locataire"
                          style={{ height: 56, border: `1px solid ${BAI.border}`, borderRadius: 6, padding: 4, background: BAI.bgSurface }} />
                      )}
                      {signatureMetadata?.tenant && (
                        <div className="flex items-center" style={{ marginTop: 8, gap: 4, fontSize: 11, color: BAI.inkFaint }}>
                          <ShieldCheck style={{ width: 12, height: 12, color: BAI.tenant }} />
                          Signature électronique certifiée
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center" style={{ fontSize: 12, color: BAI.caramel, gap: 6 }}>
                      <Clock style={{ width: 13, height: 13 }} />
                      En attente de signature
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div style={cardStyle}>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 20,
              }}>
                Détails du contrat
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p style={labelStyle}>Période</p>
                  <div className="flex items-center" style={{ fontWeight: 600, fontSize: 14, color: BAI.ink, gap: 8 }}>
                    <Calendar style={{ width: 15, height: 15, color: BAI.inkFaint }} />
                    {format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr })} —{' '}
                    {format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div style={{ background: BAI.bgMuted, borderRadius: 8, padding: '14px 16px' }}>
                  <p style={labelStyle}>Loyer mensuel</p>
                  <div className="flex items-center" style={{ fontSize: 22, fontWeight: 700, color: BAI.caramel, gap: 4 }}>
                    <Euro style={{ width: 18, height: 18 }} />
                    {contract.monthlyRent} €
                  </div>
                </div>

                {contract.charges != null && (
                  <div style={{ background: BAI.bgMuted, borderRadius: 8, padding: '14px 16px' }}>
                    <p style={labelStyle}>Charges</p>
                    <div className="flex items-center" style={{ fontSize: 22, fontWeight: 700, color: BAI.ink, gap: 4 }}>
                      <Euro style={{ width: 18, height: 18, color: BAI.inkFaint }} />
                      {contract.charges} €
                    </div>
                  </div>
                )}

                {contract.deposit != null && (
                  <div style={{ background: BAI.bgMuted, borderRadius: 8, padding: '14px 16px' }}>
                    <p style={labelStyle}>Dépôt de garantie</p>
                    <div className="flex items-center" style={{ fontSize: 22, fontWeight: 700, color: BAI.ink, gap: 4 }}>
                      <Euro style={{ width: 18, height: 18, color: BAI.inkFaint }} />
                      {contract.deposit} €
                    </div>
                  </div>
                )}
              </div>

              {contract.terms && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BAI.border}` }}>
                  <p style={labelStyle}>Conditions particulières</p>
                  <p style={{ fontSize: 13, color: BAI.inkMid, whiteSpace: 'pre-wrap', marginTop: 6 }}>{contract.terms}</p>
                </div>
              )}
            </div>

            {/* Clauses */}
            {clauses.length > 0 && (
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 20, color: BAI.ink, marginBottom: 16,
                }}>
                  Clauses du contrat
                </h2>
                <div className="space-y-3">
                  {clauses.filter((c) => c.enabled).map((clause, index) => (
                    <div key={clause.id} style={{
                      border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '12px 14px',
                    }}>
                      <h4 style={{ fontWeight: 600, fontSize: 13, color: BAI.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {index + 1}. {clause.title}
                        {clause.isCustom && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, fontFamily: BAI.fontBody,
                            background: BAI.caramelLight, color: BAI.caramel,
                            border: `1px solid ${BAI.caramel}`, borderRadius: 20,
                            padding: '2px 8px',
                          }}>
                            Personnalisée
                          </span>
                        )}
                      </h4>
                      <p style={{ fontSize: 12, color: BAI.inkMid, marginTop: 4 }}>{clause.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé financier — affiché pour le locataire uniquement */}
            {isTenant && contract.status !== 'DRAFT' && (() => {
              const rent    = contract.monthlyRent ?? 0
              const charges = contract.charges ?? 0
              const total   = rent + charges
              const deposit = contract.deposit ?? 0
              const months  = contract.startDate && contract.endDate
                ? Math.round((new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / (30.44 * 86400000))
                : null
              const annuel  = total * 12
              const fmtEUR  = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
              const fmtEURc = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

              return (
                <div style={{
                  ...cardStyle,
                  background: BAI.night,
                  border: `1px solid rgba(255,255,255,0.08)`,
                }}>
                  <h2 style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 20, color: '#ffffff', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Euro style={{ width: 18, height: 18, color: BAI.caramel }} />
                    Votre engagement financier
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 1,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.07)',
                    marginBottom: 14,
                  }}>
                    {[
                      { label: 'Loyer HC / mois', val: fmtEURc(rent) },
                      { label: 'Charges / mois', val: charges > 0 ? fmtEURc(charges) : '—' },
                      { label: 'Total / mois', val: fmtEUR(total), accent: true },
                      { label: 'Total / an', val: fmtEUR(annuel) },
                      ...(deposit > 0 ? [{ label: 'Dépôt de garantie', val: fmtEUR(deposit) }] : []),
                      ...(months ? [{ label: `Durée du bail`, val: `${months} mois` }] : []),
                      ...(months ? [{ label: `Total sur la durée`, val: fmtEUR(total * months) }] : []),
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '12px 16px', background: item.accent ? 'rgba(196,151,106,0.15)' : 'transparent' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: item.accent ? BAI.caramel : '#ffffff', margin: 0 }}>
                          {item.val}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontStyle: 'italic' }}>
                    Loyer révisable chaque année à la date anniversaire selon l'Indice de Référence des Loyers (IRL – INSEE)
                  </p>
                </div>
              )
            })()}

            {/* PDF & EDL — mis en avant */}
            <div style={{ ...cardStyle, background: BAI.night, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: '#ffffff', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <FileText style={{ width: 18, height: 18, color: BAI.caramel }} />
                Documents du contrat
              </h2>
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
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '11px 20px', borderRadius: 9,
                        background: BAI.caramel, color: '#ffffff',
                        fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13,
                        border: 'none', cursor: 'pointer',
                        opacity: loading ? 0.6 : 1,
                      }}
                      disabled={loading}
                    >
                      <Download style={{ width: 15, height: 15 }} />
                      {loading ? 'Génération…' : 'Télécharger le contrat PDF'}
                    </button>
                  )}
                </PDFDownloadLink>

                {contract.status !== 'DRAFT' && (
                  <Link
                    to={`/contracts/${contract.id}/edl/session`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '11px 20px', borderRadius: 9,
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      color: '#ffffff',
                      fontFamily: BAI.fontBody, fontWeight: 500, fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    <ClipboardCheck style={{ width: 15, height: 15 }} />
                    État des lieux
                  </Link>
                )}
              </div>
              {contract.status === 'DRAFT' && isOwner && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10, fontStyle: 'italic' }}>
                  L'état des lieux sera disponible une fois le contrat envoyé au locataire.
                </p>
              )}
            </div>

            {/* Dossier locataire — accès rapide pour le propriétaire */}
            {isOwner && contract.tenant && (
              <div style={{
                ...cardStyle,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: BAI.ownerLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ShieldCheck style={{ width: 20, height: 20, color: BAI.owner }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0, fontFamily: BAI.fontBody }}>
                      Dossier de {contract.tenant.firstName} {contract.tenant.lastName}
                    </p>
                    <p style={{ fontSize: 12, color: BAI.inkFaint, margin: '2px 0 0', fontFamily: BAI.fontBody }}>
                      Consultez les pièces justificatives · Documents filigrainés et sécurisés
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDossierModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 8,
                    background: BAI.owner, color: '#ffffff',
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13,
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <FolderOpen style={{ width: 15, height: 15 }} />
                  Consulter le dossier
                </button>
              </div>
            )}

            {/* Document Requirements Section - DRAFT mode */}
            {contract.status === 'DRAFT' && isOwner && (
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 20, color: BAI.ink, marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <FolderOpen style={{ width: 20, height: 20, color: BAI.owner }} />
                  Dossier de location — Documents requis
                </h2>
                <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                  Sélectionnez les documents que le locataire devra fournir avant la signature du contrat.
                </p>

                {/* Owner documents (DDT) */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: BAI.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Documents propriétaire (DDT)
                  </h4>
                  <div className="space-y-1">
                    {OWNER_DOCUMENT_CHECKLIST.map((item) => (
                      <label key={item.category} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <input
                          type="checkbox"
                          checked={requiredDocs.has(item.category)}
                          onChange={() => toggleRequiredDoc(item.category)}
                          style={{ marginTop: 2 }}
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: BAI.inkFaint }}>{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tenant documents */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: BAI.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Documents locataire
                  </h4>
                  <div className="space-y-1">
                    {TENANT_DOCUMENT_CHECKLIST.map((item) => (
                      <label key={item.category} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <input
                          type="checkbox"
                          checked={requiredDocs.has(item.category)}
                          onChange={() => toggleRequiredDoc(item.category)}
                          style={{ marginTop: 2 }}
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: BAI.inkFaint }}>{item.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom document requests */}
                <div style={{ marginBottom: 20 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: BAI.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Demandes personnalisées
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowCustomDocForm(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 12, fontWeight: 500, color: BAI.owner,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: BAI.fontBody,
                      }}
                    >
                      <Plus style={{ width: 14, height: 14 }} />
                      Ajouter
                    </button>
                  </div>

                  {customDocRequests.length > 0 && (
                    <div className="space-y-2" style={{ marginBottom: 12 }}>
                      {customDocRequests.map((doc, index) => (
                        <div key={index} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 12px',
                          background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                          borderRadius: 8,
                        }}>
                          <FileText style={{ width: 14, height: 14, color: BAI.owner, marginTop: 2, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>{doc.title}</p>
                            {doc.description && (
                              <p style={{ fontSize: 11, color: BAI.inkFaint, marginTop: 2 }}>{doc.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCustomDoc(index)}
                            style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint }}
                            onMouseEnter={e => (e.currentTarget.style.color = BAI.error)}
                            onMouseLeave={e => (e.currentTarget.style.color = BAI.inkFaint)}
                          >
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCustomDocForm && (
                    <div style={{
                      padding: '14px', background: BAI.bgMuted,
                      border: `1px solid ${BAI.border}`, borderRadius: 8,
                    }} className="space-y-2">
                      <input
                        type="text"
                        value={newCustomDoc.title}
                        onChange={(e) => setNewCustomDoc(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Titre du document (ex : Garantie Visale)"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={newCustomDoc.description}
                        onChange={(e) => setNewCustomDoc(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description (facultatif)"
                        style={inputStyle}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setShowCustomDocForm(false); setNewCustomDoc({ title: '', description: '' }) }}
                          style={{ ...btnGhost, padding: '6px 14px', fontSize: 12 }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAddCustomDoc}
                          disabled={!newCustomDoc.title.trim()}
                          style={{ ...btnPrimary, padding: '6px 14px', fontSize: 12, opacity: !newCustomDoc.title.trim() ? 0.5 : 1 }}
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )}

                  {customDocRequests.length === 0 && !showCustomDocForm && (
                    <p style={{ fontSize: 12, color: BAI.inkFaint, fontStyle: 'italic' }}>Aucune demande personnalisée</p>
                  )}
                </div>

                <div style={{
                  fontSize: 11, color: BAI.inkFaint, marginBottom: 16,
                  padding: '10px 14px',
                  background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
                }}>
                  Format accepté : PDF uniquement — Taille max : 5 Mo par document
                </div>

                <button
                  onClick={handleSaveDocRequirements}
                  disabled={actionLoading}
                  style={{ ...btnGhost, opacity: actionLoading ? 0.5 : 1 }}
                >
                  {docsSaved ? (
                    <>
                      <Check style={{ width: 14, height: 14, color: BAI.tenant }} />
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
              <div style={cardStyle}>
                <h2 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 20, color: BAI.ink, marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <FolderOpen style={{ width: 20, height: 20, color: BAI.owner }} />
                  Dossier de location
                </h2>
                <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                  Téléchargez les documents obligatoires pour constituer le dossier complet.
                </p>

                {isOwner && (
                  <div style={{ marginBottom: 24 }}>
                    <DocumentChecklist
                      contractId={contract.id}
                      userRole="OWNER"
                      isOwner={true}
                      requiredCategories={requiredDocuments}
                      contractRef={contract.id.substring(0, 8).toUpperCase()}
                      tenantName={`${contract.tenant?.firstName ?? ''} ${contract.tenant?.lastName ?? ''}`}
                      tenantHasSigned={!!contract.signedByTenant}
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
                      contractRef={contract.id.substring(0, 8).toUpperCase()}
                      tenantName={`${contract.tenant?.firstName ?? ''} ${contract.tenant?.lastName ?? ''}`}
                      tenantHasSigned={!!contract.signedByTenant}
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
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(13,12,10,0.45)',
          }}>
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
              maxWidth: 460, width: '100%', padding: 24,
              fontFamily: BAI.fontBody,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink }}>
                  Envoyer le contrat
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 16 }}>
                Le contrat sera envoyé au locataire avec la liste des {requiredDocs.size} document(s) requis
                {customDocRequests.length > 0 ? ` et ${customDocRequests.length} demande(s) personnalisée(s)` : ''}.
              </p>

              {requiredDocs.size === 0 && (
                <div style={{
                  marginBottom: 16, padding: '10px 14px',
                  background: BAI.warningLight, border: `1px solid ${BAI.caramel}`,
                  borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertCircle style={{ width: 15, height: 15, color: BAI.warning, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: BAI.warning }}>
                    Veuillez d'abord sélectionner les documents requis dans la section "Dossier de location" ci-dessus.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={actionLoading}
                  style={{ ...btnGhost, opacity: actionLoading ? 0.5 : 1 }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={actionLoading || requiredDocs.size === 0}
                  style={{
                    ...btnPrimary,
                    opacity: actionLoading || requiredDocs.size === 0 ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? (
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                    }} className="animate-spin" />
                  ) : (
                    <Send style={{ width: 14, height: 14 }} />
                  )}
                  Confirmer l'envoi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(13,12,10,0.45)',
          }}>
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
              maxWidth: 460, width: '100%', padding: 24,
              fontFamily: BAI.fontBody,
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink }}>
                  {confirmModal === 'delete' && 'Supprimer le contrat'}
                  {confirmModal === 'terminate' && 'Résilier le contrat'}
                  {confirmModal === 'cancel' && 'Annuler le contrat'}
                </h3>
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{
                padding: '12px 14px', borderRadius: 8, marginBottom: 16,
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: confirmModal === 'cancel' ? BAI.warningLight : BAI.errorLight,
                border: `1px solid ${confirmModal === 'cancel' ? BAI.caramel : '#fca5a5'}`,
              }}>
                <AlertTriangle style={{
                  width: 18, height: 18, flexShrink: 0, marginTop: 1,
                  color: confirmModal === 'cancel' ? BAI.warning : BAI.error,
                }} />
                <div style={{ fontSize: 13 }}>
                  {confirmModal === 'delete' && (
                    <p style={{ color: BAI.error }}>
                      Cette action est irréversible. Le contrat brouillon sera définitivement supprimé.
                    </p>
                  )}
                  {confirmModal === 'terminate' && (
                    <p style={{ color: BAI.error }}>
                      La résiliation mettra fin au contrat actif. Le bien sera remis en disponible.
                    </p>
                  )}
                  {confirmModal === 'cancel' && (
                    <>
                      <p style={{ color: BAI.warning, fontWeight: 600 }}>
                        Attention : cette action annulera le contrat en cours de signature.
                      </p>
                      <p style={{ color: BAI.warning, marginTop: 4 }}>
                        {contract.signedByOwner || contract.signedByTenant
                          ? 'Une ou plusieurs signatures ont déjà été apposées. Elles seront invalidées.'
                          : "Le locataire sera notifié de l'annulation."}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {confirmModal === 'cancel' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>
                    Motif de l'annulation (obligatoire)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex : Erreur dans les conditions, changement de locataire..."
                    style={{
                      ...inputStyle, height: 96, resize: 'none',
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setConfirmModal(null); setCancelReason('') }}
                  disabled={actionLoading}
                  style={{ ...btnGhost, opacity: actionLoading ? 0.5 : 1 }}
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
                  style={{
                    ...btnDanger,
                    background: confirmModal === 'cancel' ? BAI.warningLight : BAI.errorLight,
                    color: confirmModal === 'cancel' ? BAI.warning : BAI.error,
                    border: `1px solid ${confirmModal === 'cancel' ? BAI.caramel : '#fca5a5'}`,
                    opacity: actionLoading || (confirmModal === 'cancel' && !cancelReason.trim()) ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? (
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: `2px solid rgba(0,0,0,0.2)`,
                      borderTopColor: confirmModal === 'cancel' ? BAI.warning : BAI.error,
                    }} className="animate-spin" />
                  ) : (
                    <>
                      {confirmModal === 'delete' && <Trash2 style={{ width: 14, height: 14 }} />}
                      {confirmModal === 'terminate' && <Ban style={{ width: 14, height: 14 }} />}
                      {confirmModal === 'cancel' && <XCircle style={{ width: 14, height: 14 }} />}
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

        {/* ── Propriétaire : checklist pré-envoi ───────────────────────────────── */}
        {showPreSendChecklist && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(13,12,10,0.45)',
          }}>
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 14, boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
              maxWidth: 480, width: '100%', padding: 28, fontFamily: BAI.fontBody,
            }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardCheck style={{ width: 20, height: 20, color: BAI.owner }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: 0 }}>
                    Avant d'envoyer
                  </h3>
                  <p style={{ fontSize: 12, color: BAI.inkFaint, margin: 0 }}>Confirmez chaque point avant l'envoi au locataire</p>
                </div>
              </div>

              <div className="space-y-3" style={{ marginBottom: 24 }}>
                {/* Item dossier — spécial avec bouton d'ouverture */}
                {[
                  { key: 'property' as const, label: "J'ai vérifié les informations du bien (adresse, surface, type)", sub: `${contract.property?.address}, ${contract.property?.city}`, action: null },
                  { key: 'clauses' as const, label: "J'ai relu et validé toutes les clauses du contrat", sub: `${clauses.filter(c => c.enabled).length} clause(s) activée(s)`, action: null },
                  { key: 'dossier' as const, label: "J'ai consulté le dossier du locataire et vérifié son identité", sub: `${contract.tenant?.firstName} ${contract.tenant?.lastName}`, action: 'dossier' },
                  { key: 'docs' as const, label: "J'ai configuré les documents requis et éventuelles demandes personnalisées", sub: `${requiredDocs.size} document(s) requis sélectionné(s)`, action: null },
                ].map(({ key, label, sub, action }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      onClick={() => setPreSendChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                        border: `2px solid ${preSendChecks[key] ? BAI.owner : BAI.border}`,
                        background: preSendChecks[key] ? BAI.owner : BAI.bgSurface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {preSendChecks[key] && <Check style={{ width: 12, height: 12, color: '#ffffff' }} />}
                    </div>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setPreSendChecks(prev => ({ ...prev, [key]: !prev[key] }))}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>{sub}</p>
                    </div>
                    {action === 'dossier' && (
                      <button
                        onClick={() => {
                          setShowDossierModal(true)
                          setPreSendChecks(prev => ({ ...prev, dossier: true }))
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 6, flexShrink: 0,
                          background: BAI.ownerLight, color: BAI.owner,
                          border: `1px solid ${BAI.ownerBorder}`,
                          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        <FolderOpen style={{ width: 12, height: 12 }} />
                        Ouvrir →
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowPreSendChecklist(false)}
                  style={{ ...btnGhost }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setShowPreSendChecklist(false); setShowSendModal(true) }}
                  disabled={!Object.values(preSendChecks).every(Boolean)}
                  style={{
                    ...btnPrimary,
                    opacity: Object.values(preSendChecks).every(Boolean) ? 1 : 0.4,
                    cursor: Object.values(preSendChecks).every(Boolean) ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Send style={{ width: 14, height: 14 }} />
                  Continuer vers l'envoi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Locataire : checklist pré-signature ──────────────────────────────── */}
        {showPreSignChecklist && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(13,12,10,0.45)',
          }}>
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 14, boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
              maxWidth: 460, width: '100%', padding: 28, fontFamily: BAI.fontBody,
            }}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: BAI.tenantLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck style={{ width: 20, height: 20, color: BAI.tenant }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: 0 }}>
                    Avant de signer
                  </h3>
                  <p style={{ fontSize: 12, color: BAI.inkFaint, margin: 0 }}>Confirmez avoir vérifié chaque point. La signature est définitive.</p>
                </div>
              </div>

              <div className="space-y-3" style={{ marginBottom: 24 }}>
                {[
                  { key: 'property' as const, label: "J'ai vérifié les informations du logement", sub: `${contract.property?.address}, ${contract.property?.city} — ${contract.property?.surface} m²` },
                  { key: 'clauses' as const, label: "J'ai lu et j'accepte toutes les clauses du contrat", sub: `${clauses.filter(c => c.enabled).length} clause(s) applicable(s)` },
                  { key: 'amounts' as const, label: "J'ai vérifié les montants financiers", sub: `Loyer charges comprises : ${(contract.monthlyRent ?? 0) + (contract.charges ?? 0)} €/mois${contract.deposit ? ` — Dépôt de garantie : ${contract.deposit} €` : ''}` },
                ].map(({ key, label, sub }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <div
                      onClick={() => setPreSignChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                        border: `2px solid ${preSignChecks[key] ? BAI.tenant : BAI.border}`,
                        background: preSignChecks[key] ? BAI.tenant : BAI.bgSurface,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {preSignChecks[key] && <Check style={{ width: 12, height: 12, color: '#ffffff' }} />}
                    </div>
                    <div onClick={() => setPreSignChecks(prev => ({ ...prev, [key]: !prev[key] }))}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>{sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowPreSignChecklist(false)}
                  style={{ ...btnGhost }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                  onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setShowPreSignChecklist(false); setShowSignature(true) }}
                  disabled={!Object.values(preSignChecks).every(Boolean)}
                  style={{
                    ...btnPrimary,
                    background: BAI.tenant,
                    opacity: Object.values(preSignChecks).every(Boolean) ? 1 : 0.4,
                    cursor: Object.values(preSignChecks).every(Boolean) ? 'pointer' : 'not-allowed',
                  }}
                >
                  <PenTool style={{ width: 14, height: 14 }} />
                  Signer le contrat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal dossier locataire ──────────────────────────────────────────── */}
      {showDossierModal && contract.tenant && (
        <DossierReviewModal
          tenantId={contract.tenantId}
          tenantName={`${contract.tenant.firstName ?? ''} ${contract.tenant.lastName ?? ''}`}
          onClose={() => setShowDossierModal(false)}
        />
      )}
    </Layout>
  )
}
