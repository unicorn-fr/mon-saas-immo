import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useMaintenanceStore } from '../../store/maintenanceStore'
import { usePropertyStore } from '../../store/propertyStore'
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  CreateMaintenanceInput,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
} from '../../types/maintenance.types'
import {
  Wrench,
  PlusCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

// Priority colors
function priorityColor(p: MaintenancePriority): string {
  if (p === 'URGENT') return '#9b1c1c'
  if (p === 'HIGH') return '#c4976a'
  if (p === 'MEDIUM') return '#1a3270'
  return '#9e9b96'
}
function priorityBg(p: MaintenancePriority): string {
  if (p === 'URGENT') return '#fef2f2'
  if (p === 'HIGH') return '#fdf5ec'
  if (p === 'MEDIUM') return '#eaf0fb'
  return '#f4f2ee'
}

// Status icon
function StatusIcon({ s }: { s: MaintenanceStatus }) {
  if (s === 'OPEN') return <AlertTriangle style={{ width: 14, height: 14, color: '#c4976a' }} />
  if (s === 'IN_PROGRESS') return <Clock style={{ width: 14, height: 14, color: '#1a3270' }} />
  if (s === 'RESOLVED') return <CheckCircle style={{ width: 14, height: 14, color: '#1b5e3b' }} />
  return <XCircle style={{ width: 14, height: 14, color: '#9e9b96' }} />
}

// Severity label
function severityLabel(s: string): string {
  if (s === 'low') return 'Faible'
  if (s === 'medium') return 'Moyen'
  if (s === 'high') return 'Élevé'
  return 'Critique'
}
function severityColor(s: string): string {
  if (s === 'low') return '#1b5e3b'
  if (s === 'medium') return '#c4976a'
  if (s === 'high') return '#9b1c1c'
  return '#7b0000'
}

type StatusFilter = 'ALL' | MaintenanceStatus

export default function Maintenance() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'ALL'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateMaintenanceInput>({
    propertyId: '',
    title: '',
    description: '',
    category: 'PLOMBERIE',
    priority: 'MEDIUM',
  })

  const { requests, isLoading, isAnalyzing, fetchRequests, createRequest, updateStatus, analyzeWithAI } =
    useMaintenanceStore()
  const { myProperties, fetchMyProperties } = usePropertyStore()

  useEffect(() => {
    fetchRequests()
    fetchMyProperties()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCount = requests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length

  const filtered = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false
    return true
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createRequest(form)
      setShowForm(false)
      setForm({ propertyId: '', title: '', description: '', category: 'PLOMBERIE', priority: 'MEDIUM' })
    } catch {}
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${BAI.border}`,
    background: BAI.bgMuted,
    fontFamily: BAI.fontBody,
    fontSize: 14,
    color: BAI.ink,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: BAI.fontBody,
    fontSize: 12,
    fontWeight: 600,
    color: BAI.inkMid,
    display: 'block',
    marginBottom: 4,
  }

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'Tous' },
    { value: 'OPEN', label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED', label: 'Résolu' },
    { value: 'CLOSED', label: 'Fermé' },
  ]

  const priorityOptions: Array<{ value: MaintenancePriority | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Toutes priorités' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'Élevé' },
    { value: 'MEDIUM', label: 'Moyen' },
    { value: 'LOW', label: 'Faible' },
  ]

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 6px',
              }}
            >
              Propriétaire
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(28px,5vw,38px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: BAI.ink,
                  margin: 0,
                }}
              >
                Maintenance
              </h1>
              {openCount > 0 && (
                <span
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9b1c1c',
                  }}
                >
                  {openCount} en attente
                </span>
              )}
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '8px 0 0' }}>
              Suivez les demandes et laissez l'IA trouver les meilleurs artisans
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: BAI.night,
              color: '#fff',
              fontFamily: BAI.fontBody,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <PlusCircle style={{ width: 16, height: 16 }} />
            Nouvelle demande
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 700,
                color: BAI.ink,
                margin: '0 0 16px',
              }}
            >
              Déclarer un problème
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Bien concerné</label>
                <select
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  style={inputStyle}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {myProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MaintenanceCategory }))}
                  style={inputStyle}
                >
                  {(Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[]).map(k => (
                    <option key={k} value={k}>
                      {MAINTENANCE_CATEGORY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priorité</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as MaintenancePriority }))}
                  style={inputStyle}
                >
                  {(Object.keys(MAINTENANCE_PRIORITY_LABELS) as MaintenancePriority[]).map(k => (
                    <option key={k} value={k}>
                      {MAINTENANCE_PRIORITY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Titre</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={inputStyle}
                placeholder="Ex: Fuite sous l'évier"
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description détaillée</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Décrivez le problème en détail pour que l'IA puisse analyser et trouver les bons artisans..."
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: `1px solid ${BAI.border}`,
                  background: 'transparent',
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  color: BAI.inkMid,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: BAI.night,
                  color: '#fff',
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Créer la demande
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: statusFilter === opt.value ? 'none' : `1px solid ${BAI.border}`,
                background: statusFilter === opt.value ? BAI.night : 'transparent',
                color: statusFilter === opt.value ? '#fff' : BAI.inkMid,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as MaintenancePriority | 'ALL')}
              style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: 12 }}
            >
              {priorityOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests list */}
        {isLoading && requests.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: BAI.inkFaint,
              fontFamily: BAI.fontBody,
              fontSize: 14,
            }}
          >
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Wrench
              style={{ width: 40, height: 40, color: BAI.border, margin: '0 auto 12px', display: 'block' }}
            />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: 0 }}>
              Aucune demande de maintenance
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(req => {
              const expanded = expandedId === req.id
              const analyzing = isAnalyzing === req.id

              return (
                <div
                  key={req.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    {/* Priority badge */}
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: priorityBg(req.priority),
                        border: `1px solid ${priorityColor(req.priority)}30`,
                        fontFamily: BAI.fontBody,
                        fontSize: 11,
                        fontWeight: 700,
                        color: priorityColor(req.priority),
                      }}
                    >
                      {MAINTENANCE_PRIORITY_LABELS[req.priority]}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 14,
                            fontWeight: 700,
                            color: BAI.ink,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {req.title}
                        </p>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: BAI.bgMuted,
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            color: BAI.inkMid,
                          }}
                        >
                          {MAINTENANCE_CATEGORY_LABELS[req.category]}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StatusIcon s={req.status} />
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
                            {MAINTENANCE_STATUS_LABELS[req.status]}
                          </span>
                        </div>
                        {req.property && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                            {req.property.title}
                          </span>
                        )}
                        {req.tenant && (
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                            · {req.tenant.firstName} {req.tenant.lastName}
                          </span>
                        )}
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                          {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          color: BAI.inkMid,
                          margin: '8px 0 0',
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {req.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                      }}
                    >
                      {/* Status select */}
                      <select
                        value={req.status}
                        onChange={e =>
                          updateStatus(req.id, { status: e.target.value as MaintenanceStatus })
                        }
                        onClick={e => e.stopPropagation()}
                        style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 11 }}
                      >
                        {(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map(k => (
                          <option key={k} value={k}>
                            {MAINTENANCE_STATUS_LABELS[k]}
                          </option>
                        ))}
                      </select>

                      {/* AI analyze button */}
                      <button
                        onClick={() => {
                          analyzeWithAI(req.id)
                          setExpandedId(req.id)
                        }}
                        disabled={analyzing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: `1px solid ${BAI.caramel}`,
                          background: analyzing ? `${BAI.caramel}18` : 'transparent',
                          fontFamily: BAI.fontBody,
                          fontSize: 12,
                          fontWeight: 600,
                          color: BAI.caramel,
                          cursor: analyzing ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Sparkles style={{ width: 13, height: 13 }} />
                        {analyzing ? 'Analyse...' : req.aiAnalysis ? "Ré-analyser" : "Analyser avec l'IA"}
                      </button>

                      {/* Expand toggle if AI result exists */}
                      {req.aiAnalysis && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : req.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            color: BAI.inkFaint,
                            padding: 0,
                          }}
                        >
                          {expanded ? (
                            <ChevronUp style={{ width: 13, height: 13 }} />
                          ) : (
                            <ChevronDown style={{ width: 13, height: 13 }} />
                          )}
                          {expanded ? 'Masquer' : "Voir l'analyse"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis panel */}
                  {expanded && req.aiAnalysis && (
                    <div
                      style={{
                        borderTop: `1px solid ${BAI.border}`,
                        padding: '20px',
                        background: BAI.bgBase,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Sparkles style={{ width: 15, height: 15, color: BAI.caramel }} />
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 13,
                            fontWeight: 700,
                            color: BAI.ink,
                            margin: 0,
                          }}
                        >
                          Analyse IA
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                        {/* Severity */}
                        <div
                          style={{
                            background: BAI.bgSurface,
                            border: `1px solid ${BAI.border}`,
                            borderRadius: 10,
                            padding: '12px 16px',
                            flex: 1,
                            minWidth: 140,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 11,
                              color: BAI.inkFaint,
                              margin: '0 0 4px',
                            }}
                          >
                            Sévérité
                          </p>
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 14,
                              fontWeight: 700,
                              color: severityColor(req.aiAnalysis.severity),
                              margin: 0,
                            }}
                          >
                            {severityLabel(req.aiAnalysis.severity)}
                          </p>
                        </div>
                        {/* Cost */}
                        <div
                          style={{
                            background: BAI.bgSurface,
                            border: `1px solid ${BAI.border}`,
                            borderRadius: 10,
                            padding: '12px 16px',
                            flex: 1,
                            minWidth: 140,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 11,
                              color: BAI.inkFaint,
                              margin: '0 0 4px',
                            }}
                          >
                            Coût estimé
                          </p>
                          <p
                            style={{
                              fontFamily: BAI.fontDisplay,
                              fontSize: 18,
                              fontWeight: 700,
                              fontStyle: 'italic',
                              color: BAI.ink,
                              margin: 0,
                            }}
                          >
                            {req.aiAnalysis.estimatedCost.min.toLocaleString('fr-FR')} –{' '}
                            {req.aiAnalysis.estimatedCost.max.toLocaleString('fr-FR')} €
                          </p>
                        </div>
                      </div>

                      {/* Advice */}
                      <div
                        style={{
                          background: BAI.bgSurface,
                          border: `1px solid ${BAI.border}`,
                          borderRadius: 10,
                          padding: '14px 16px',
                          marginBottom: 16,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            color: BAI.inkFaint,
                            margin: '0 0 6px',
                          }}
                        >
                          Conseil
                        </p>
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 13,
                            color: BAI.ink,
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {req.aiAnalysis.advice}
                        </p>
                      </div>

                      {/* Platforms */}
                      {req.aiAnalysis.platforms.length > 0 && (
                        <div>
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 12,
                              fontWeight: 600,
                              color: BAI.inkMid,
                              margin: '0 0 10px',
                            }}
                          >
                            Trouver un artisan
                          </p>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {req.aiAnalysis.platforms.map(p => (
                              <a
                                key={p.name}
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 14px',
                                  borderRadius: 8,
                                  border: `1px solid ${BAI.caramel}`,
                                  background: `${BAI.caramel}10`,
                                  fontFamily: BAI.fontBody,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: BAI.caramel,
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink style={{ width: 12, height: 12 }} />
                                {p.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
