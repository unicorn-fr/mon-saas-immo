/**
 * Super Admin — Properties Review
 * Lists PENDING_REVIEW properties with approve/reject actions
 */

import { useEffect, useState, useCallback } from 'react'
import { propertyService } from '../../services/property.service'
import { Home, RefreshCw, CheckCircle, XCircle, Clock, MapPin, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Property } from '../../types/property.types'

export default function SAProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await propertyService.getPendingReviewProperties()
      setProperties(data)
    } catch {
      toast.error('Erreur chargement des biens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      await propertyService.approveProperty(id)
      toast.success('Bien approuvé et publié')
      setProperties((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'approbation')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectNote.trim()) return
    setProcessing(rejectModal.id)
    try {
      await propertyService.rejectProperty(rejectModal.id, rejectNote.trim())
      toast.success('Bien refusé')
      setProperties((prev) => prev.filter((p) => p.id !== rejectModal.id))
      setRejectModal(null)
      setRejectNote('')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du refus')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-[#00b4d8]" /> Biens à valider
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '—' : properties.length} bien{properties.length !== 1 ? 's' : ''} en attente de vérification
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-[#00b4d8] mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucun bien en attente de vérification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-[#0d1526] border border-[#1a2744] rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a2744]">
                  {property.images[0] ? (
                    <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-white text-sm">{property.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{property.address}, {property.city} {property.postalCode}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      En attente
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span>{property.type} · {property.surface} m²</span>
                    <span>{property.bedrooms} ch. · {property.bathrooms} sdb</span>
                    <span className="text-[#00b4d8] font-medium">{property.price} €/mois</span>
                    {property.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {property.owner.firstName} {property.owner.lastName}
                      </span>
                    )}
                    <span>Soumis le {format(new Date(property.updatedAt), 'd MMM yyyy', { locale: fr })}</span>
                  </div>

                  {/* Verification documents */}
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${property.ownerIdDocument ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                      {property.ownerIdDocument ? '✓' : '✗'} Pièce d'identité
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${property.propertyProofDocument ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                      {property.propertyProofDocument ? '✓' : '✗'} Justificatif propriété
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#1a2744]">
                <button
                  onClick={() => handleApprove(property.id)}
                  disabled={processing === property.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={() => { setRejectModal({ id: property.id, title: property.title }); setRejectNote('') }}
                  disabled={processing === property.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </button>
                {property.ownerIdDocument && (
                  <a
                    href={property.ownerIdDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1a2744] text-slate-400 hover:text-white transition-all ml-auto"
                  >
                    Voir CNI
                  </a>
                )}
                {property.propertyProofDocument && (
                  <a
                    href={property.propertyProofDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1a2744] text-slate-400 hover:text-white transition-all"
                  >
                    Voir justificatif
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Refuser le bien</h2>
            <p className="text-sm text-slate-400 line-clamp-2">{rejectModal.title}</p>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Motif de refus (visible par le propriétaire)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                placeholder="Ex: Documents illisibles, photos insuffisantes, informations manquantes..."
                className="w-full px-3 py-2 bg-[#0a0e1a] border border-[#1a2744] text-sm text-white rounded-lg resize-none outline-none focus:border-[#00b4d8]/50 placeholder-slate-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2 text-sm text-slate-400 bg-[#1a2744] rounded-lg hover:text-white transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectNote.trim() || processing === rejectModal.id}
                className="flex-1 py-2 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {processing === rejectModal.id ? 'Envoi...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
