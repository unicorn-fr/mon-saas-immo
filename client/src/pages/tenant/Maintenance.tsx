import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import { Wrench, Plus, X, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  OPEN: { label: 'Non traité', color: BAI.error, bg: BAI.errorLight, icon: AlertCircle },
  IN_PROGRESS: { label: 'En cours', color: '#92400e', bg: '#fdf5ec', icon: Clock },
  RESOLVED: { label: 'Résolu', color: '#1b5e3b', bg: '#edf7f2', icon: CheckCircle },
  CLOSED: { label: 'Fermé', color: BAI.inkFaint, bg: BAI.bgMuted, icon: CheckCircle },
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Électricité',
  CHAUFFAGE: 'Chauffage',
  SERRURERIE: 'Serrurerie',
  AUTRE: 'Autre',
}

const CATEGORY_ICONS: Record<string, string> = {
  PLOMBERIE: '🚿',
  ELECTRICITE: '⚡',
  CHAUFFAGE: '🔥',
  SERRURERIE: '🔐',
  AUTRE: '🔧',
}

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  property?: { title: string }
}

export default function TenantMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/maintenance')
      setRequests(res.data.data?.requests ?? res.data.data ?? [])
    } catch {
      toast.error('Impossible de charger vos demandes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setSubmitting(true)
    try {
      const contractRes = await apiClient.get('/contracts?status=ACTIVE')
      const contracts = contractRes.data.data ?? []
      if (contracts.length === 0) {
        toast.error('Aucun bail actif trouvé. Vous devez avoir un bail actif pour signaler un problème.')
        return
      }
      const propertyId = contracts[0].propertyId

      await apiClient.post('/maintenance', {
        propertyId,
        title: title.trim(),
        description: description.trim(),
        category: 'AUTRE',
        priority: 'MEDIUM',
      })
      toast.success('Demande envoyée à votre propriétaire')
      setTitle('')
      setDescription('')
      setShowForm(false)
      fetchRequests()
    } catch {
      toast.error("Impossible d'envoyer la demande")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
                Mon logement
              </p>
              <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px', lineHeight: 1.15 }}>
                Maintenance
              </h1>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
                Signalez un problème à votre propriétaire
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 20px', borderRadius: 10,
                background: BAI.night, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                minHeight: 44,
              }}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Annuler' : 'Signaler un problème'}
            </button>
          </div>

          {/* New Request Form */}
          {showForm && (
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 12, padding: 24, marginBottom: 24,
              boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
            }}>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 20px' }}>
                Décrire le problème
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, display: 'block', marginBottom: 6 }}>
                    Sujet *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex : Fuite d'eau sous l'évier, Radiateur en panne..."
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1px solid ${BAI.border}`, borderRadius: 8,
                      fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
                      background: BAI.bgBase, outline: 'none', boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, display: 'block', marginBottom: 6 }}>
                    Description détaillée *
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez le problème en détail : depuis quand, où exactement, urgence ressentie..."
                    rows={5}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: `1px solid ${BAI.border}`, borderRadius: 8,
                      fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink,
                      background: BAI.bgBase, outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    alignSelf: 'flex-end', padding: '11px 28px',
                    background: submitting ? BAI.inkFaint : BAI.night,
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer', minHeight: 44,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {submitting && <Loader className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </form>
            </div>
          )}

          {/* Requests list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader className="w-6 h-6 animate-spin" style={{ color: BAI.inkFaint, margin: '0 auto' }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 12, padding: '48px 24px', textAlign: 'center',
            }}>
              <Wrench className="w-8 h-8" style={{ color: BAI.inkFaint, margin: '0 auto 12px' }} />
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: BAI.ink, margin: '0 0 8px' }}>
                Aucune demande en cours
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
                Utilisez le bouton ci-dessus pour signaler un problème à votre propriétaire.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map(req => {
                const s = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.OPEN
                const StatusIcon = s.icon
                return (
                  <div key={req.id} style={{
                    background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                    borderRadius: 12, padding: '18px 20px',
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          {req.category && (
                            <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[req.category] ?? '🔧'}</span>
                          )}
                          <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink, margin: 0 }}>
                            {req.title}
                          </h3>
                          {req.category && (
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '2px 8px',
                              borderRadius: 20, background: BAI.bgMuted, color: BAI.inkMid,
                            }}>
                              {CATEGORY_LABELS[req.category] ?? req.category}
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 8px', lineHeight: 1.5 }}>
                          {req.description}
                        </p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
                          Signalé le {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {req.property && ` · ${req.property.title}`}
                        </p>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 20,
                        background: s.bg, color: s.color,
                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
