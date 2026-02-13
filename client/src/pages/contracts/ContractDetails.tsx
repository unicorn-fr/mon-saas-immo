import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import {
  FileText,
  ArrowLeft,
  Calendar,
  Euro,
  User,
  Home as HomeIcon,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  FileCheck,
  Ban,
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
    signContract,
    activateContract,
    terminateContract,
    deleteContract,
  } = useContractStore()

  const [showConfirm, setShowConfirm] = useState<'delete' | 'terminate' | null>(null)

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
  const canSign = contract.status === 'DRAFT'
  const hasSigned = isOwner ? !!contract.signedByOwner : !!contract.signedByTenant
  const otherPartySigned = isOwner ? !!contract.signedByTenant : !!contract.signedByOwner
  const bothSigned = !!contract.signedByOwner && !!contract.signedByTenant

  const handleSign = async () => {
    if (confirm('Voulez-vous signer ce contrat ?')) {
      await signContract(contract.id)
    }
  }

  const handleActivate = async () => {
    if (confirm('Voulez-vous activer ce contrat ? Cette action est irréversible.')) {
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
      if (success) {
        navigate('/contracts')
      }
      setShowConfirm(null)
    } else {
      setShowConfirm('delete')
    }
  }

  const getStatusBadge = () => {
    const variants = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      DRAFT: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Brouillon' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expiré' },
      TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Résilié' },
    }
    const variant = variants[contract.status]
    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}
      >
        {variant.label}
      </span>
    )
  }

  return (
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
          {/* Property Info */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Propriété</h2>
            <div className="flex gap-4">
              {contract.property?.images?.[0] && (
                <img
                  src={contract.property.images[0]}
                  alt={contract.property.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {contract.property?.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  {contract.property?.address}, {contract.property?.city}{' '}
                  {contract.property?.postalCode}
                </div>
                {contract.property?.bedrooms && (
                  <p className="text-sm text-gray-600">
                    {contract.property.bedrooms} chambres • {contract.property.bathrooms} SDB •{' '}
                    {contract.property.surface}m²
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
                Propriétaire
              </h3>
              <p className="text-gray-900">
                {contract.owner?.firstName} {contract.owner?.lastName}
              </p>
              <p className="text-sm text-gray-600">{contract.owner?.email}</p>
              {contract.owner?.phone && (
                <p className="text-sm text-gray-600">{contract.owner.phone}</p>
              )}
              {contract.signedByOwner && (
                <div className="mt-3 flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Signé le {format(new Date(contract.signedByOwner), 'dd MMM yyyy', { locale: fr })}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Locataire
              </h3>
              <p className="text-gray-900">
                {contract.tenant?.firstName} {contract.tenant?.lastName}
              </p>
              <p className="text-sm text-gray-600">{contract.tenant?.email}</p>
              {contract.tenant?.phone && (
                <p className="text-sm text-gray-600">{contract.tenant.phone}</p>
              )}
              {contract.signedByTenant && (
                <div className="mt-3 flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Signé le {format(new Date(contract.signedByTenant), 'dd MMM yyyy', { locale: fr })}
                </div>
              )}
            </div>
          </div>

          {/* Contract Details */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Détails du contrat</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm text-gray-600">Période</label>
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
                  {contract.monthlyRent}€
                </div>
              </div>
              {contract.charges && (
                <div>
                  <label className="text-sm text-gray-600">Charges</label>
                  <div className="flex items-center text-xl font-bold text-gray-900 mt-1">
                    <Euro className="w-5 h-5 mr-1" />
                    {contract.charges}€
                  </div>
                </div>
              )}
              {contract.deposit && (
                <div>
                  <label className="text-sm text-gray-600">Dépôt de garantie</label>
                  <div className="flex items-center text-xl font-bold text-gray-900 mt-1">
                    <Euro className="w-5 h-5 mr-1" />
                    {contract.deposit}€
                  </div>
                </div>
              )}
            </div>

            {contract.terms && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm text-gray-600 block mb-2">
                  Conditions particulières
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{contract.terms}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

            <div className="space-y-3">
              {/* Sign */}
              {canSign && !hasSigned && (
                <button onClick={handleSign} className="btn btn-primary w-full justify-center">
                  <FileCheck className="w-5 h-5 mr-2" />
                  Signer le contrat
                </button>
              )}

              {/* Activate (owner only, after both signed) */}
              {isOwner && contract.status === 'DRAFT' && bothSigned && (
                <button
                  onClick={handleActivate}
                  className="btn btn-success w-full justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Activer le contrat
                </button>
              )}

              {/* Terminate (owner only, active contracts) */}
              {isOwner && contract.status === 'ACTIVE' && (
                <button
                  onClick={handleTerminate}
                  className={`btn w-full justify-center ${
                    showConfirm === 'terminate' ? 'btn-danger' : 'btn-secondary'
                  }`}
                >
                  <Ban className="w-5 h-5 mr-2" />
                  {showConfirm === 'terminate' ? 'Confirmer la résiliation ?' : 'Résilier le contrat'}
                </button>
              )}

              {/* Delete (owner only, draft contracts) */}
              {isOwner && contract.status === 'DRAFT' && (
                <button
                  onClick={handleDelete}
                  className={`btn w-full justify-center ${
                    showConfirm === 'delete' ? 'btn-danger' : 'btn-secondary'
                  }`}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {showConfirm === 'delete' ? 'Confirmer la suppression ?' : 'Supprimer le contrat'}
                </button>
              )}

              {showConfirm && (
                <button
                  onClick={() => setShowConfirm(null)}
                  className="btn btn-ghost w-full justify-center"
                >
                  Annuler
                </button>
              )}
            </div>

            {/* Status messages */}
            {canSign && hasSigned && !otherPartySigned && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ✓ Vous avez signé ce contrat. En attente de la signature de l'autre partie.
                </p>
              </div>
            )}

            {canSign && bothSigned && isOwner && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Les deux parties ont signé. Vous pouvez maintenant activer le contrat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
