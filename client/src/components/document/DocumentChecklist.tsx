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

interface DocumentChecklistProps {
  contractId: string
  userRole: 'OWNER' | 'TENANT'
  isOwner: boolean // current user is the contract owner
  requiredCategories?: string[] // if provided, only show these categories
}

export const DocumentChecklist = ({ contractId, userRole, isOwner, requiredCategories }: DocumentChecklistProps) => {
  const { documents, isLoading, fetchDocuments, uploadDocument, deleteDocument, updateDocumentStatus } = useDocumentStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments(contractId)
  }, [contractId, fetchDocuments])

  const fullChecklist = userRole === 'OWNER' ? OWNER_DOCUMENT_CHECKLIST : TENANT_DOCUMENT_CHECKLIST
  const checklist = requiredCategories
    ? fullChecklist.filter(item => requiredCategories.includes(item.category))
    : fullChecklist

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
      await deleteDocument(contractId, docId)
      toast.success('Document supprime')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleValidate = async (docId: string) => {
    try {
      await updateDocumentStatus(contractId, docId, 'VALIDATED')
      toast.success('Document valide')
    } catch {
      toast.error('Erreur lors de la validation')
    }
  }

  const handleReject = async () => {
    if (!rejectingDocId) return
    try {
      await updateDocumentStatus(contractId, rejectingDocId, 'REJECTED', rejectReason)
      toast.success('Document refuse')
      setRejectingDocId(null)
      setRejectReason('')
    } catch {
      toast.error('Erreur lors du refus')
    }
  }

  const statusIcon = (doc: ContractDocument | undefined) => {
    if (!doc) return <Clock className="w-5 h-5 text-gray-300" />
    switch (doc.status) {
      case 'UPLOADED': return <Clock className="w-5 h-5 text-blue-500" />
      case 'VALIDATED': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
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
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Eye className="w-4 h-4 shrink-0" />
          <span>Mode lecture seule — Vous pouvez consulter et verifier les documents du locataire.</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {userRole === 'OWNER' ? 'Documents proprietaire' : 'Documents locataire'}
          </h3>
          <span className="text-sm text-gray-500">
            {completedCount}/{checklist.length} fournis
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / checklist.length) * 100}%` }}
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
              className={`bg-white rounded-xl border p-4 ${
                doc?.status === 'REJECTED' ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5">{statusIcon(doc)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    {item.required && (
                      <span className="text-xs text-red-500 font-medium">Obligatoire</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>

                  {/* Document info */}
                  {doc && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600 truncate">{doc.fileName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        doc.status === 'VALIDATED' ? 'bg-green-100 text-green-700' :
                        doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
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
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                      title="Telecharger"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}

                  {/* View button */}
                  {doc && (
                    <a
                      href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${doc.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}

                  {/* Delete button: only the uploader's role can delete (owner can't delete tenant docs) */}
                  {doc && (doc.status !== 'VALIDATED') && (
                    (item.role === 'OWNER' && isOwner) || (item.role === 'TENANT' && !isOwner)
                  ) && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Validate / Reject buttons (owner only, for tenant docs) */}
                  {isOwner && doc && doc.status === 'UPLOADED' && item.role === 'TENANT' && (
                    <>
                      <button
                        onClick={() => handleValidate(doc.id)}
                        className="p-2 rounded-lg hover:bg-green-50 text-gray-500 hover:text-green-600 transition-colors"
                        title="Valider"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRejectingDocId(doc.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        title="Refuser"
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

      {/* Reject modal */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Refuser le document</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus (obligatoire)..."
              className="w-full border rounded-lg p-3 text-sm mb-4 h-24 resize-none"
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
