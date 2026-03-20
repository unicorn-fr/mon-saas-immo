import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '../../store/documentStore'
import {
  ContractDocument,
  OWNER_DOCUMENT_CHECKLIST,
  TENANT_DOCUMENT_CHECKLIST,
} from '../../types/document.types'
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Trash2,
  Eye,
  AlertCircle,
  Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { WatermarkedViewer } from './WatermarkedViewer'
import { celebrateSmall } from '../../utils/celebrate'

const M = {
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  owner: '#1a3270',
  ownerLight: '#eaf0fb',
  ownerBorder: '#b8ccf0',
  tenant: '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder: '#9fd4ba',
  border: '#e4e1db',
  borderMid: '#ccc9c3',
  muted: '#f4f2ee',
  surface: '#ffffff',
  caramelBg: '#fdf5ec',
  caramel: '#92400e',
}

interface CustomChecklistItem {
  category: string
  label: string
  description: string
}

interface DocumentChecklistProps {
  contractId: string
  userRole: 'OWNER' | 'TENANT'
  isOwner: boolean // current user is the contract owner
  requiredCategories?: string[] // if provided, only show these standard categories
  customItems?: CustomChecklistItem[] // extra uploadable items added by owner
  contractRef?: string   // pour le filigrane
  tenantName?: string    // pour le filigrane
  tenantHasSigned?: boolean // accès owner aux docs locataire uniquement après signature
}

export const DocumentChecklist = ({
  contractId, userRole, isOwner, requiredCategories, customItems,
  contractRef = '', tenantName = 'Locataire', tenantHasSigned = false,
}: DocumentChecklistProps) => {
  const { documents, isLoading, fetchDocuments, uploadDocument, deleteDocument, updateDocumentStatus } = useDocumentStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null)
  const [viewerDoc, setViewerDoc] = useState<ContractDocument | null>(null)
  const [viewedDocIds, setViewedDocIds] = useState<Set<string>>(new Set())

  const openViewer = (doc: ContractDocument) => {
    setViewerDoc(doc)
    setViewedDocIds(prev => new Set([...prev, doc.id]))
  }

  useEffect(() => {
    fetchDocuments(contractId)
  }, [contractId, fetchDocuments])

  // Debug: Log documents state
  if (import.meta.env.DEV) {
    console.log('[DocumentChecklist]', {
      contractId,
      userRole,
      isOwner,
      totalDocuments: documents.length,
      documents: documents.map(d => ({
        id: d.id,
        category: d.category,
        fileName: d.fileName,
        status: d.status,
        fileUrl: d.fileUrl,
      })),
    })
  }

  const fullChecklist = userRole === 'OWNER' ? OWNER_DOCUMENT_CHECKLIST : TENANT_DOCUMENT_CHECKLIST
  const standardChecklist = requiredCategories && requiredCategories.length > 0
    ? fullChecklist.filter(item => requiredCategories.includes(item.category))
    : fullChecklist

  // Custom items added by owner (only for tenant role, always shown)
  const customChecklistItems = userRole === 'TENANT' ? (customItems ?? []).map(item => ({
    category: item.category,
    label: item.label,
    description: item.description,
    role: 'TENANT' as const,
    required: true,
    acceptedTypes: ['application/pdf'],
    maxSizeMB: 5,
  })) : []

  const checklist = [...standardChecklist, ...customChecklistItems]

  const getDocumentForCategory = (category: string): ContractDocument | undefined => {
    return documents.find(d => d.category === category)
  }

  const handleFileSelect = (category: string) => {
    setUploadingCategory(category)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingCategory) return

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptes')
      setUploadingCategory(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas depasser 5 Mo')
      setUploadingCategory(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      await uploadDocument(contractId, uploadingCategory, file)
      toast.success('Document televerse avec succes')
    } catch {
      toast.error('Erreur lors du telechargement')
    } finally {
      setUploadingCategory(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      await deleteDocument(docId)
      toast.success('Document supprime')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleValidate = async (docId: string) => {
    try {
      await updateDocumentStatus(docId, 'VALIDATED')
      toast.success('Document validé ✓')
      celebrateSmall()
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de la validation'
      toast.error(message)
      console.error('[DocumentChecklist Validate Error]', error)
    }
  }

  const handleReject = async () => {
    if (!rejectingDocId) return
    try {
      await updateDocumentStatus(rejectingDocId, 'REJECTED', rejectReason)
      toast.success('Document refuse')
      setRejectingDocId(null)
      setRejectReason('')
    } catch (error: any) {
      const message = error?.message || 'Erreur lors du refus'
      toast.error(message)
      console.error('[DocumentChecklist Reject Error]', error)
    }
  }

  const statusIcon = (doc: ContractDocument | undefined) => {
    if (!doc) return <Clock className="w-5 h-5" style={{ color: M.inkFaint }} />
    switch (doc.status) {
      case 'UPLOADED': return <Clock className="w-5 h-5" style={{ color: M.owner }} />
      case 'VALIDATED': return <CheckCircle className="w-5 h-5" style={{ color: M.tenant }} />
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5" style={{ color: M.inkFaint }} />
    }
  }

  const statusLabel = (doc: ContractDocument | undefined) => {
    if (!doc) return 'Non fourni'
    switch (doc.status) {
      case 'UPLOADED': return 'En attente de validation'
      case 'VALIDATED': return 'Valide'
      case 'REJECTED': return 'Refuse'
      default: return 'En attente'
    }
  }

  const completedCount = checklist.filter(item => {
    const doc = getDocumentForCategory(item.category)
    return doc && (doc.status === 'UPLOADED' || doc.status === 'VALIDATED')
  }).length


  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />

      {/* Read-only indicator when owner views tenant docs */}
      {isOwner && userRole === 'TENANT' && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{
            background: tenantHasSigned ? M.ownerLight : M.surface,
            border: `1px solid ${tenantHasSigned ? M.ownerBorder : M.border}`,
            color: tenantHasSigned ? M.owner : M.inkMid,
          }}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            {tenantHasSigned
              ? 'Documents accessibles avec filigrane de protection — Le locataire a signé le contrat.'
              : 'Les pièces justificatives seront accessibles après la signature du locataire.'}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="rounded-xl border p-4" style={{ background: M.surface, borderColor: M.border }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: M.ink }}>
            {userRole === 'OWNER' ? 'Documents proprietaire' : 'Documents locataire'}
          </h3>
          <span className="text-sm" style={{ color: M.inkFaint }}>
            {completedCount}/{checklist.length} fournis
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: M.border }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${(completedCount / checklist.length) * 100}%`,
              background: M.tenant,
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map((item) => {
          const doc = getDocumentForCategory(item.category)
          return (
            <div
              key={item.category}
              className="rounded-xl border p-4"
              style={
                doc?.status === 'REJECTED'
                  ? { background: '#fef2f2', borderColor: '#fca5a5' }
                  : { background: M.surface, borderColor: M.border }
              }
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5">{statusIcon(doc)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium" style={{ color: M.ink }}>
                      {item.label}
                    </p>
                    {doc?.fromDossier && doc.status !== 'REJECTED' && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: M.tenantLight, color: M.tenant, border: `1px solid ${M.tenantBorder}` }}
                      >
                        Importé du dossier
                      </span>
                    )}
                    {item.category.startsWith('CUSTOM_') && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: M.caramelBg, color: M.caramel }}
                      >
                        Demande perso.
                      </span>
                    )}
                    {item.required && (
                      <span className="text-xs text-red-500 font-medium">Obligatoire</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: M.inkFaint }}>{item.description}</p>

                  {/* Document info */}
                  {doc && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5" style={{ color: M.inkFaint }} />
                      <span className="truncate" style={{ color: M.inkMid }}>{doc.fileName}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium"
                        style={
                          doc.status === 'VALIDATED'
                            ? { background: M.tenantLight, color: M.tenant }
                            : doc.status === 'REJECTED'
                            ? { background: '#fef2f2', color: '#9b1c1c' }
                            : { background: M.ownerLight, color: M.owner }
                        }
                      >
                        {statusLabel(doc)}
                      </span>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {doc?.status === 'REJECTED' && doc.rejectionReason && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{doc.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Upload button: only the matching role can upload (owner cannot upload tenant docs) */}
                  {((!doc || doc.status === 'REJECTED') && item.role === userRole && (
                    (userRole === 'OWNER' && isOwner) || (userRole === 'TENANT' && !isOwner)
                  )) && (
                    <button
                      onClick={() => handleFileSelect(item.category)}
                      disabled={isLoading}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: M.inkMid }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = M.tenantLight
                        e.currentTarget.style.color = M.tenant
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = M.inkMid
                      }}
                      title="Telecharger"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}

                  {/* View button */}
                  {doc && (
                    isOwner && item.role === 'TENANT' ? (
                      // Propriétaire : accès avec filigrane uniquement si locataire a signé
                      tenantHasSigned ? (
                        <button
                          onClick={() => openViewer(doc)}
                          className="p-2 rounded-xl transition-colors"
                          style={{ color: viewedDocIds.has(doc.id) ? M.owner : M.inkMid }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = M.ownerLight
                            e.currentTarget.style.color = M.owner
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = viewedDocIds.has(doc.id) ? M.owner : M.inkMid
                          }}
                          title={viewedDocIds.has(doc.id) ? 'Consulter à nouveau' : 'Consulter avec filigrane (requis avant validation)'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          title="Disponible après signature du locataire"
                          style={{ padding: 8, color: M.inkFaint, cursor: 'default', display: 'flex', alignItems: 'center' }}
                        >
                          <Eye className="w-4 h-4 opacity-30" />
                        </span>
                      )
                    ) : (
                      <a
                        href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl transition-colors"
                        style={{ color: M.inkMid }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = M.tenantLight
                          e.currentTarget.style.color = M.tenant
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = M.inkMid
                        }}
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )
                  )}

                  {/* Delete button: only the uploader's role can delete (owner can't delete tenant docs) */}
                  {doc && (doc.status !== 'VALIDATED') && (
                    (item.role === 'OWNER' && isOwner) || (item.role === 'TENANT' && !isOwner)
                  ) && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ color: M.inkMid }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef2f2'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = M.inkMid
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Validate / Reject buttons (owner only, for tenant docs, only after viewing) */}
                  {isOwner && doc && doc.status === 'UPLOADED' && item.role === 'TENANT' && tenantHasSigned && (
                    <>
                      <button
                        onClick={() => viewedDocIds.has(doc.id) && handleValidate(doc.id)}
                        disabled={!viewedDocIds.has(doc.id)}
                        className="p-2 rounded-xl transition-colors"
                        style={{
                          color: viewedDocIds.has(doc.id) ? M.tenant : M.inkFaint,
                          cursor: viewedDocIds.has(doc.id) ? 'pointer' : 'not-allowed',
                          opacity: viewedDocIds.has(doc.id) ? 1 : 0.4,
                        }}
                        onMouseEnter={(e) => {
                          if (viewedDocIds.has(doc.id)) e.currentTarget.style.background = M.tenantLight
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        title={viewedDocIds.has(doc.id) ? 'Valider ce document' : 'Consultez le document avant de pouvoir le valider'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => viewedDocIds.has(doc.id) && setRejectingDocId(doc.id)}
                        disabled={!viewedDocIds.has(doc.id)}
                        className="p-2 rounded-xl transition-colors"
                        style={{
                          color: M.inkMid,
                          cursor: viewedDocIds.has(doc.id) ? 'pointer' : 'not-allowed',
                          opacity: viewedDocIds.has(doc.id) ? 1 : 0.4,
                        }}
                        onMouseEnter={(e) => {
                          if (viewedDocIds.has(doc.id)) {
                            e.currentTarget.style.background = '#fef2f2'
                            e.currentTarget.style.color = '#dc2626'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = M.inkMid
                        }}
                        title={viewedDocIds.has(doc.id) ? 'Refuser' : 'Consultez le document avant de pouvoir le refuser'}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Watermarked viewer modal */}
      {viewerDoc && (
        <WatermarkedViewer
          fileUrl={viewerDoc.fileUrl}
          fileName={viewerDoc.fileName}
          contractRef={contractRef}
          tenantName={tenantName}
          onClose={() => setViewerDoc(null)}
          actions={isOwner && viewerDoc.status === 'UPLOADED' ? {
            onValidate: async () => {
              try {
                await updateDocumentStatus(viewerDoc.id, 'VALIDATED')
                toast.success('Document validé')
              } catch {
                toast.error('Erreur lors de la validation')
              }
            },
            onReject: async (reason: string) => {
              try {
                await updateDocumentStatus(viewerDoc.id, 'REJECTED', reason)
                toast.success('Document refusé')
              } catch {
                toast.error('Erreur lors du refus')
              }
            },
            docLabel: viewerDoc.fileName,
          } : undefined}
        />
      )}

      {/* Reject modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ background: M.surface }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: M.ink }}>Refuser le document</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus (obligatoire)..."
              className="w-full rounded-xl p-3 text-sm mb-4 h-24 resize-none"
              style={{ border: `1px solid ${M.border}`, outline: 'none', color: M.ink }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectingDocId(null); setRejectReason('') }}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
