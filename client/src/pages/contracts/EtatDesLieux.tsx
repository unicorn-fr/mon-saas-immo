import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import {
  EDLType,
  EtatElement,
  EtatDesLieux as EDLData,
  ETAT_LABELS,
  ETAT_COLORS,
  prefillEDLFromContract,
} from '../../data/etatDesLieuxTemplate'
import {
  ArrowLeft,
  ClipboardCheck,
  Save,
  ChevronDown,
  ChevronRight,
  Key,
  Gauge,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function EtatDesLieux() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useAuth()
  const { currentContract: contract, fetchContractById } = useContractStore()

  const [edlType, setEdlType] = useState<EDLType>('ENTREE')
  const [edl, setEdl] = useState<EDLData | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(['entree']))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) fetchContractById(id)
  }, [id, fetchContractById])

  useEffect(() => {
    if (contract) {
      // Check if there's an existing EDL in contract.content
      const content = contract.content as Record<string, any> || {}
      const existingEdl = content[`edl_${edlType.toLowerCase()}`]
      if (existingEdl) {
        setEdl(existingEdl)
      } else {
        setEdl(prefillEDLFromContract(edlType, contract))
      }
    }
  }, [contract, edlType])

  if (!contract || !edl) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev)
      next.has(roomId) ? next.delete(roomId) : next.add(roomId)
      return next
    })
  }

  const updateElement = (roomId: string, elementId: string, field: 'etat' | 'observation', value: string) => {
    setEdl(prev => {
      if (!prev) return prev
      return {
        ...prev,
        rooms: prev.rooms.map(room =>
          room.id === roomId ? {
            ...room,
            elements: room.elements.map(el =>
              el.id === elementId ? { ...el, [field]: value } : el
            ),
          } : room
        ),
      }
    })
  }

  const updateCompteur = (index: number, field: 'numero' | 'releve', value: string) => {
    setEdl(prev => {
      if (!prev) return prev
      return {
        ...prev,
        compteurs: prev.compteurs.map((c, i) => i === index ? { ...c, [field]: value } : c),
      }
    })
  }

  const updateCle = (index: number, field: 'quantite' | 'description', value: string | number) => {
    setEdl(prev => {
      if (!prev) return prev
      return {
        ...prev,
        cles: prev.cles.map((c, i) => i === index ? { ...c, [field]: value } : c),
      }
    })
  }

  const handleSave = async () => {
    if (!edl || !contract) return
    setSaving(true)
    try {
      const content = (contract.content as Record<string, any>) || {}
      const key = `edl_${edlType.toLowerCase()}`
      const updatedContent = { ...content, [key]: { ...edl, date: new Date().toISOString() } }

      // Use the contract store to update
      const { useContractStore } = await import('../../store/contractStore')
      const store = useContractStore.getState()
      await store.updateContract(contract.id, { content: updatedContent })

      toast.success(`Etat des lieux ${edlType === 'ENTREE' ? 'd\'entree' : 'de sortie'} sauvegarde`)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const etatOptions: EtatElement[] = ['NEUF', 'BON', 'USAGE', 'MAUVAIS', 'NA']

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/contracts/${id}`)} className="btn btn-ghost p-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardCheck className="w-7 h-7 text-primary-600" />
                    Etat des Lieux
                  </h1>
                  <p className="text-gray-600 mt-1">{contract.property?.title}</p>
                </div>
              </div>

              {/* Type toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setEdlType('ENTREE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    edlType === 'ENTREE' ? 'bg-white text-primary-700 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Entree
                </button>
                <button
                  onClick={() => setEdlType('SORTIE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    edlType === 'SORTIE' ? 'bg-white text-primary-700 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sortie
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Room-by-room inspection */}
            {edl.rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl border overflow-hidden">
                <button
                  onClick={() => toggleRoom(room.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {room.elements.filter(e => e.etat !== 'NA' && e.etat !== 'BON').length > 0
                        ? `${room.elements.filter(e => e.etat !== 'NA' && e.etat !== 'BON').length} remarque(s)`
                        : 'RAS'}
                    </span>
                    {expandedRooms.has(room.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedRooms.has(room.id) && (
                  <div className="border-t divide-y">
                    {room.elements.map((element) => (
                      <div key={element.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{element.label}</p>
                            {/* Etat selector */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {etatOptions.map((etat) => (
                                <button
                                  key={etat}
                                  onClick={() => updateElement(room.id, element.id, 'etat', etat)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    element.etat === etat
                                      ? ETAT_COLORS[etat]
                                      : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                                  }`}
                                >
                                  {ETAT_LABELS[etat]}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Observation */}
                          <input
                            type="text"
                            placeholder="Observation..."
                            value={element.observation}
                            onChange={(e) => updateElement(room.id, element.id, 'observation', e.target.value)}
                            className="w-48 text-sm border rounded-lg px-3 py-1.5 text-gray-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Compteurs */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary-600" />
                Releves des compteurs
              </h3>
              <div className="space-y-4">
                {edl.compteurs.map((compteur, index) => (
                  <div key={compteur.type} className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-900">{compteur.label}</label>
                    <input
                      type="text"
                      placeholder="N° compteur"
                      value={compteur.numero}
                      onChange={(e) => updateCompteur(index, 'numero', e.target.value)}
                      className="text-sm border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Releve (index)"
                      value={compteur.releve}
                      onChange={(e) => updateCompteur(index, 'releve', e.target.value)}
                      className="text-sm border rounded-lg px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cles */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary-600" />
                Remise des cles
              </h3>
              <div className="space-y-3">
                {edl.cles.map((cle, index) => (
                  <div key={cle.type} className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-gray-900">{cle.type}</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Quantite"
                      value={cle.quantite || ''}
                      onChange={(e) => updateCle(index, 'quantite', parseInt(e.target.value) || 0)}
                      className="text-sm border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={cle.description}
                      onChange={(e) => updateCle(index, 'description', e.target.value)}
                      className="text-sm border rounded-lg px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Observations generales */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations generales</h3>
              <textarea
                value={edl.observationsGenerales}
                onChange={(e) => setEdl(prev => prev ? { ...prev, observationsGenerales: e.target.value } : prev)}
                placeholder="Observations generales sur l'etat du logement..."
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate(`/contracts/${id}`)}
                className="btn btn-secondary"
              >
                Retour au contrat
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
