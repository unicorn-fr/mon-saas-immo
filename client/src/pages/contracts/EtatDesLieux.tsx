import { useEffect, useState, useRef } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { useParams, useNavigate } from 'react-router-dom'
import { useContractStore } from '../../store/contractStore'
import { useDocumentStore } from '../../store/documentStore'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import { EDLPDF } from '../../components/contract/EDLPDF'
import {
  EDLType,
  EtatElement,
  EtatDesLieux as EDLData,
  ETAT_LABELS,
  ETAT_COLORS,
  prefillEDLFromContract,
  createEmptyEDL,
} from '../../data/etatDesLieuxTemplate'
import {
  ArrowLeft,
  ClipboardCheck,
  Save,
  ChevronDown,
  ChevronRight,
  Key,
  Gauge,
  Download,
  Upload,
  FileText,
  CheckCircle,
  Eye,
  Trash2,
  Lock,
  Camera,
  Image,
} from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import toast from 'react-hot-toast'
import { celebrateSmall } from '../../utils/celebrate'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'


export default function EtatDesLieux() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useAuth()
  const { currentContract: contract, fetchContractById } = useContractStore()
  const { documents, fetchDocuments, uploadDocument, deleteDocument } = useDocumentStore()

  const [edlType, setEdlType] = useState<EDLType>('ENTREE')
  const [edl, setEdl] = useState<EDLData | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(['entree']))
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (id) {
      fetchContractById(id)
      fetchDocuments(id)
    }
  }, [id, fetchContractById, fetchDocuments])

  useEffect(() => {
    if (contract) {
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
            <p style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Get uploaded EDL documents
  const edlCategory = edlType === 'ENTREE' ? 'EDL_ENTREE' : 'EDL_SORTIE'
  const uploadedEdl = documents.find(d => d.category === edlCategory)

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

  const isLocked = !!(edl as any)?.lockedAt

  const handleSave = async () => {
    if (!edl || !contract || isLocked) return
    setSaving(true)
    try {
      const content = (contract.content as Record<string, any>) || {}
      const key = `edl_${edlType.toLowerCase()}`
      const updatedContent = { ...content, [key]: { ...edl, date: new Date().toISOString() } }

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

  const handleLock = async () => {
    if (!edl || !contract || isLocked) return
    if (!confirm('Finaliser et verrouiller cet état des lieux ? Il ne sera plus modifiable.')) return
    setSaving(true)
    try {
      const content = (contract.content as Record<string, any>) || {}
      const key = `edl_${edlType.toLowerCase()}`
      const lockedEdl = { ...edl, date: new Date().toISOString(), lockedAt: new Date().toISOString() }
      const updatedContent = { ...content, [key]: lockedEdl }

      const { useContractStore } = await import('../../store/contractStore')
      const store = useContractStore.getState()
      await store.updateContract(contract.id, { content: updatedContent })
      setEdl(lockedEdl as any)

      toast.success('État des lieux finalisé et verrouillé')
      celebrateSmall()
    } catch {
      toast.error('Erreur lors du verrouillage')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadEdl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !contract) return

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptes')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas depasser 5 Mo')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      await uploadDocument(contract.id, edlCategory, file)
      toast.success('EDL scanne televerse avec succes')
    } catch {
      toast.error('Erreur lors du telechargement')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteEdl = async () => {
    if (!uploadedEdl) return
    if (!confirm('Supprimer l\'EDL scanne ?')) return
    try {
      await deleteDocument(uploadedEdl.id)
      toast.success('Document supprime')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !contract) return

    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées')
      if (e.target) e.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10 Mo')
      if (e.target) e.target.value = ''
      return
    }

    setUploadingPhoto(true)
    try {
      const photoCategory = edlType === 'ENTREE' ? 'EDL_ENTREE' : 'EDL_SORTIE'
      await uploadDocument(contract.id, photoCategory, file)
      toast.success('Photo ajoutée à l\'EDL')
    } catch {
      toast.error('Erreur lors de l\'upload de la photo')
    } finally {
      setUploadingPhoto(false)
      if (e.target) e.target.value = ''
    }
  }

  // Build blank EDL for PDF
  const blankEdl = contract ? prefillEDLFromContract(edlType, contract) : createEmptyEDL(edlType)

  const etatOptions: EtatElement[] = ['NEUF', 'BON', 'USAGE', 'MAUVAIS', 'NA']

  // Style helpers
  const cardStyle: React.CSSProperties = {
    background: BAI.bgSurface,
    border: `1px solid ${BAI.border}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
    fontFamily: BAI.fontBody,
  }

  const inputStyle: React.CSSProperties = {
    background: BAI.bgInput,
    border: `1px solid ${BAI.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    color: BAI.ink,
    outline: 'none',
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

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>

        {/* Header */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate(`/contracts/${id}`)}
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
                    fontSize: 'clamp(22px, 5vw, 32px)', color: BAI.ink, lineHeight: 1.1, margin: 0,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <ClipboardCheck style={{ width: 26, height: 26, color: BAI.owner }} />
                    État des Lieux
                  </h1>
                  <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 2 }}>{contract.property?.title}</p>
                </div>
              </div>

              {/* Type toggle */}
              <div style={{
                display: 'flex',
                background: BAI.bgMuted, borderRadius: 10, padding: 4,
                border: `1px solid ${BAI.border}`,
              }}>
                <button
                  onClick={() => setEdlType('ENTREE')}
                  style={{
                    padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                    fontFamily: BAI.fontBody, cursor: 'pointer', border: 'none',
                    background: edlType === 'ENTREE' ? BAI.bgSurface : 'transparent',
                    color: edlType === 'ENTREE' ? BAI.night : BAI.inkFaint,
                    boxShadow: edlType === 'ENTREE' ? '0 1px 4px rgba(13,12,10,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  Entrée
                </button>
                <button
                  onClick={() => setEdlType('SORTIE')}
                  style={{
                    padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                    fontFamily: BAI.fontBody, cursor: 'pointer', border: 'none',
                    background: edlType === 'SORTIE' ? BAI.bgSurface : 'transparent',
                    color: edlType === 'SORTIE' ? BAI.night : BAI.inkFaint,
                    boxShadow: edlType === 'SORTIE' ? '0 1px 4px rgba(13,12,10,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  Sortie
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

            {/* Lock banner */}
            {isLocked && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`,
                borderRadius: 12,
              }}>
                <Lock style={{ width: 18, height: 18, color: BAI.owner, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: BAI.owner, margin: 0 }}>
                    État des lieux finalisé — lecture seule
                  </p>
                  <p style={{ fontSize: 12, color: BAI.owner, opacity: 0.75, margin: '2px 0 0' }}>
                    Verrouillé le{' '}
                    {format(new Date((edl as any).lockedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}.
                    {' '}Aucune modification n'est possible.
                  </p>
                </div>
              </div>
            )}

            {/* PDF Downloads & Upload */}
            <div style={{ ...cardStyle, padding: '24px' }}>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <FileText style={{ width: 18, height: 18, color: BAI.owner }} />
                Documents EDL
              </h3>

              <div className="flex flex-wrap gap-2 sm:gap-3" style={{ marginBottom: 16 }}>
                {/* Download blank PDF */}
                <PDFDownloadLink
                  document={<EDLPDF edl={blankEdl} blank={true} />}
                  fileName={`edl-${edlType.toLowerCase()}-vierge-${contract.property?.title?.replace(/\s+/g, '-').toLowerCase() || 'logement'}.pdf`}
                >
                  {({ loading }) => (
                    <button style={{ ...btnGhost, opacity: loading ? 0.5 : 1 }} disabled={loading}>
                      <Download style={{ width: 14, height: 14 }} />
                      {loading ? 'Génération...' : 'PDF vierge'}
                    </button>
                  )}
                </PDFDownloadLink>

                {/* Download filled PDF */}
                <PDFDownloadLink
                  document={<EDLPDF edl={edl} blank={false} />}
                  fileName={`edl-${edlType.toLowerCase()}-rempli-${contract.property?.title?.replace(/\s+/g, '-').toLowerCase() || 'logement'}.pdf`}
                >
                  {({ loading }) => (
                    <button style={{ ...btnGhost, opacity: loading ? 0.5 : 1 }} disabled={loading}>
                      <Download style={{ width: 14, height: 14 }} />
                      {loading ? 'Génération...' : 'PDF rempli'}
                    </button>
                  )}
                </PDFDownloadLink>

                {/* Upload scanned EDL (PDF) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleUploadEdl}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ ...btnGhost, opacity: uploading ? 0.5 : 1 }}
                >
                  <Upload style={{ width: 14, height: 14 }} />
                  {uploading ? 'Envoi...' : 'EDL scanné (PDF)'}
                </button>

                {/* ── Mobile photo capture — appareil photo natif ── */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    ...btnGhost,
                    opacity: uploadingPhoto ? 0.5 : 1,
                    color: BAI.tenant,
                    borderColor: BAI.tenantBorder,
                    background: BAI.tenantLight,
                  }}
                  title="Prendre une photo avec l'appareil photo (mobile)"
                >
                  <Camera style={{ width: 14, height: 14 }} />
                  {uploadingPhoto ? 'Envoi...' : 'Photo (mobile)'}
                </button>

                {/* Galerie photos */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{ ...btnGhost, opacity: uploadingPhoto ? 0.5 : 1 }}
                  title="Sélectionner des photos depuis la galerie"
                >
                  <Image style={{ width: 14, height: 14 }} />
                  Galerie
                </button>
              </div>

              {/* Show uploaded EDL */}
              {uploadedEdl && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                  borderRadius: 8,
                }}>
                  <CheckCircle style={{ width: 18, height: 18, color: BAI.tenant, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600, color: BAI.tenant }}>EDL scanné téléversé</p>
                    <p style={{ fontSize: 11, color: BAI.tenant, opacity: 0.75 }} className="truncate">
                      {uploadedEdl.fileName}
                    </p>
                  </div>
                  <a
                    href={uploadedEdl.fileUrl.startsWith('http') ? uploadedEdl.fileUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${uploadedEdl.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: 6, borderRadius: 6, color: BAI.tenant,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Voir"
                    onMouseEnter={e => (e.currentTarget.style.background = BAI.tenantBorder)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Eye style={{ width: 15, height: 15 }} />
                  </a>
                  <button
                    onClick={handleDeleteEdl}
                    style={{
                      padding: 6, borderRadius: 6, background: 'none', border: 'none',
                      cursor: 'pointer', color: BAI.inkFaint,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Supprimer"
                    onMouseEnter={e => {
                      e.currentTarget.style.background = BAI.errorLight
                      e.currentTarget.style.color = BAI.error
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.color = BAI.inkFaint
                    }}
                  >
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              )}

              <p style={{ fontSize: 11, color: BAI.inkFaint, marginTop: 12 }}>
                Format accepté : PDF uniquement — Taille max : 5 Mo
              </p>
            </div>

            {/* Editable form sections — disabled when locked */}
            <fieldset disabled={isLocked} style={{ border: 'none', padding: 0, margin: 0, opacity: isLocked ? 0.72 : 1 }}>

            {/* Room-by-room inspection */}
            {edl.rooms.map((room) => {
              const remarques = room.elements.filter(e => e.etat !== 'NA' && e.etat !== 'BON').length
              const isExpanded = expandedRooms.has(room.id)

              return (
                <div key={room.id} style={{ ...cardStyle, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleRoom(room.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: BAI.fontBody,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <h3 style={{ fontWeight: 600, fontSize: 15, color: BAI.ink }}>{room.name}</h3>
                    <div className="flex items-center gap-3">
                      {remarques > 0 ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600, fontFamily: BAI.fontBody,
                          background: BAI.warningLight, color: BAI.warning,
                          border: `1px solid ${BAI.caramel}`, borderRadius: 20,
                          padding: '2px 8px',
                        }}>
                          {remarques} remarque(s)
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: BAI.inkFaint }}>RAS</span>
                      )}
                      {isExpanded
                        ? <ChevronDown style={{ width: 16, height: 16, color: BAI.inkFaint }} />
                        : <ChevronRight style={{ width: 16, height: 16, color: BAI.inkFaint }} />
                      }
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${BAI.border}` }}>
                      {room.elements.map((element, idx) => (
                        <div
                          key={element.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: idx < room.elements.length - 1 ? `1px solid ${BAI.border}` : 'none',
                          }}
                        >
                          {/* Mobile-first: stack label+etat / observation */}
                          <div className="flex flex-col gap-2">
                            <p style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>
                              {element.label}
                            </p>
                            {/* État selector — pill buttons, large tap targets on mobile */}
                            <div className="flex flex-wrap gap-1.5">
                              {etatOptions.map((etat) => (
                                <button
                                  key={etat}
                                  onClick={() => updateElement(room.id, element.id, 'etat', etat)}
                                  style={{
                                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                    fontFamily: BAI.fontBody, cursor: 'pointer', border: 'none',
                                    minHeight: 36,
                                    background: element.etat === etat ? undefined : BAI.bgMuted,
                                    color: element.etat === etat ? undefined : BAI.inkFaint,
                                  }}
                                  className={element.etat === etat ? ETAT_COLORS[etat] : ''}
                                >
                                  {ETAT_LABELS[etat]}
                                </button>
                              ))}
                            </div>
                            {/* Observation — full width */}
                            <input
                              type="text"
                              placeholder="Observation (optionnel)..."
                              value={element.observation}
                              onChange={(e) => updateElement(room.id, element.id, 'observation', e.target.value)}
                              style={{ ...inputStyle, width: '100%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Compteurs */}
            <div style={{ ...cardStyle, padding: '24px' }}>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Gauge style={{ width: 18, height: 18, color: BAI.owner }} />
                Relevés des compteurs
              </h3>
              <div className="space-y-4">
                {edl.compteurs.map((compteur, index) => (
                  <div key={compteur.type} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <label style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>{compteur.label}</label>
                    <input
                      type="text"
                      placeholder="N° compteur"
                      value={compteur.numero}
                      onChange={(e) => updateCompteur(index, 'numero', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="Relevé (index)"
                      value={compteur.releve}
                      onChange={(e) => updateCompteur(index, 'releve', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Clés */}
            <div style={{ ...cardStyle, padding: '24px' }}>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Key style={{ width: 18, height: 18, color: BAI.owner }} />
                Remise des clés
              </h3>
              <div className="space-y-3">
                {edl.cles.map((cle, index) => (
                  <div key={cle.type} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <label style={{ fontSize: 13, fontWeight: 500, color: BAI.ink }}>{cle.type}</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Quantité"
                      value={cle.quantite || ''}
                      onChange={(e) => updateCle(index, 'quantite', parseInt(e.target.value) || 0)}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={cle.description}
                      onChange={(e) => updateCle(index, 'description', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Observations générales */}
            <div style={{ ...cardStyle, padding: '24px' }}>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 20, color: BAI.ink, marginBottom: 16,
              }}>
                Observations générales
              </h3>
              <textarea
                value={edl.observationsGenerales}
                onChange={(e) => setEdl(prev => prev ? { ...prev, observationsGenerales: e.target.value } : prev)}
                placeholder="Observations générales sur l'état du logement..."
                rows={4}
                style={{
                  ...inputStyle, width: '100%', resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            </fieldset>

            {/* Save button */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3" style={{ paddingBottom: 32 }}>
              <button
                onClick={() => navigate(`/contracts/${id}`)}
                style={btnGhost}
                onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}
              >
                Retour au contrat
              </button>
              {!isLocked && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ ...btnGhost, opacity: saving ? 0.5 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                    onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}
                  >
                    <Save style={{ width: 15, height: 15 }} />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleLock}
                    disabled={saving}
                    style={{
                      ...btnPrimary,
                      background: BAI.tenant,
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    <Lock style={{ width: 15, height: 15 }} />
                    Finaliser et verrouiller
                  </button>
                </>
              )}
              {isLocked && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 8,
                  background: BAI.ownerLight, color: BAI.owner,
                  border: `1px solid ${BAI.ownerBorder}`,
                  fontSize: 13, fontFamily: BAI.fontBody,
                }}>
                  <Lock style={{ width: 14, height: 14 }} />
                  EDL verrouillé
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
