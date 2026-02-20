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
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentContract: contract,
    isLoading,
    fetchContractById,
    sendContract,
    signContract,
    activateContract,
    terminateContract,
    deleteContract,
  } = useContractStore()

  const [showConfirm, setShowConfirm] = useState<'delete' | 'terminate' | null>(null)
  const [showSignature, setShowSignature] = useState(false)

  useEffect(() => {
    if (id) {
      fetchContractById(id)
    }
  }, [id, fetchContractById])

  if (isLoading || !contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
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

  const handleSend = async () => {
    if (confirm('Envoyer ce contrat au locataire pour signature ?')) {
      await sendContract(contract.id)
    }
  }

  const handleSignature = async (signatureBase64: string) => {
    await signContract(contract.id, signatureBase64)
    setShowSignature(false)
  }

  const handleActivate = async () => {
    if (confirm('Activer ce contrat ? Le bien sera marque comme occupe.')) {
      await activateContract(contract.id)
    }
  }

  const handleTerminate = async () => {
    if (showConfirm === 'terminate') {
      await terminateContract(contract.id)
      setShowConfirm(null)
    } else {
      setShowConfirm('terminate')
    }
  }

  const handleDelete = async () => {
    if (showConfirm === 'delete') {
      const success = await deleteContract(contract.id)
      if (success) navigate('/contracts')
      setShowConfirm(null)
    } else {
      setShowConfirm('delete')
    }
  }

  const signerName = isOwner
    ? `${user?.firstName} ${user?.lastName}`
    : `${user?.firstName} ${user?.lastName}`

  const clauses: ContractClause[] = (contract.customClauses as ContractClause[]) || []

  const getStatusBadge = () => {
    const variants: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon' },
      SENT: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Envoye' },
      SIGNED_OWNER: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Signe (proprietaire)' },
      SIGNED_TENANT: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Signe (locataire)' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Signe par les deux parties' },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expire' },
      TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Resilie' },
    }
    const variant = variants[contract.status] || variants.DRAFT
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}>
        {variant.label}
      </span>
    )
  }

  const signatureMetadata = (contract.content as Record<string, any>)?.signatureMetadata

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
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status Alert */}
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

              {/* Owner documents */}
              {isOwner && (
                <div className="mb-6">
                  <DocumentChecklist
                    contractId={contract.id}
                    userRole="OWNER"
                    isOwner={true}
                  />
                </div>
              )}

              {/* Tenant documents */}
              {(isOwner || isTenant) && (
                <DocumentChecklist
                  contractId={contract.id}
                  userRole="TENANT"
                  isOwner={isOwner}
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

            <div className="space-y-3">
              {/* Send to tenant */}
              {canSend && (
                <button onClick={handleSend} className="btn btn-primary w-full justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  Envoyer au locataire
                </button>
              )}

              {/* Sign */}
              {canSign && (
                <button onClick={() => setShowSignature(true)} className="btn btn-primary w-full justify-center">
                  <PenTool className="w-5 h-5 mr-2" />
                  Signer le contrat
                </button>
              )}

              {/* Activate */}
              {canActivate && (
                <button onClick={handleActivate} className="btn btn-success w-full justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Activer le contrat
                </button>
              )}

              {/* Terminate */}
              {canTerminate && (
                <button
                  onClick={handleTerminate}
                  className={`btn w-full justify-center ${showConfirm === 'terminate' ? 'btn-danger' : 'btn-secondary'}`}
                >
                  <Ban className="w-5 h-5 mr-2" />
                  {showConfirm === 'terminate' ? 'Confirmer la resiliation ?' : 'Resilier le contrat'}
                </button>
              )}

              {/* Delete */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className={`btn w-full justify-center ${showConfirm === 'delete' ? 'btn-danger' : 'btn-secondary'}`}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {showConfirm === 'delete' ? 'Confirmer la suppression ?' : 'Supprimer le contrat'}
                </button>
              )}

              {showConfirm && (
                <button onClick={() => setShowConfirm(null)} className="btn btn-ghost w-full justify-center">
                  Annuler
                </button>
              )}
            </div>

            {/* Status messages */}
            {hasSigned && !otherPartySigned && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Vous avez signe ce contrat. En attente de la signature de l'autre partie.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignaturePad
        isOpen={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={handleSignature}
        signerName={signerName}
      />
    </div>
    </Layout>
  )
}
