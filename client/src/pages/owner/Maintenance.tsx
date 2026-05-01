import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useMaintenanceStore } from '../../store/maintenanceStore'
import { usePropertyStore } from '../../store/propertyStore'
import { maintenanceService } from '../../services/maintenance.service'
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
  Zap,
  Droplets,
  Lock,
  Hammer,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  Globe,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Contractor {
  id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  distance: number
  openingHours: string | null
  rating?: number | null
  reviewCount?: number | null
}

interface ContractorResult {
  contractors: Contractor[]
  platforms: Array<{ name: string; url: string; description: string }>
}

// ── Status helpers ──────────────────────────────────────────────────────────

function statusBg(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#fef9ec'
  if (s === 'IN_PROGRESS') return BAI.ownerLight
  if (s === 'RESOLVED')    return BAI.tenantLight
  return BAI.bgMuted
}
function statusColor(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#92400e'
  if (s === 'IN_PROGRESS') return BAI.owner
  if (s === 'RESOLVED')    return BAI.tenant
  return BAI.inkFaint
}
function statusBorder(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#f3c99a'
  if (s === 'IN_PROGRESS') return BAI.ownerBorder
  if (s === 'RESOLVED')    return BAI.tenantBorder
  return BAI.border
}

function StatusBadge({ s }: { s: MaintenanceStatus }) {
  const icons = {
    OPEN: <AlertTriangle style={{ width: 12, height: 12 }} />,
    IN_PROGRESS: <Clock style={{ width: 12, height: 12 }} />,
    RESOLVED: <CheckCircle style={{ width: 12, height: 12 }} />,
    CLOSED: <XCircle style={{ width: 12, height: 12 }} />,
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        background: statusBg(s),
        border: `1px solid ${statusBorder(s)}`,
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        color: statusColor(s),
        whiteSpace: 'nowrap',
      }}
    >
      {icons[s]}
      {MAINTENANCE_STATUS_LABELS[s]}
    </span>
  )
}

// ── Category icon ──────────────────────────────────────────────────────────

function CategoryIcon({ category, size = 16 }: { category: MaintenanceCategory; size?: number }) {
  const style = { width: size, height: size }
  if (category === 'PLOMBERIE')  return <Droplets style={{ ...style, color: '#1a6caf' }} />
  if (category === 'ELECTRICITE') return <Zap style={{ ...style, color: '#c4976a' }} />
  if (category === 'SERRURERIE')  return <Lock style={{ ...style, color: '#5a5754' }} />
  return <Hammer style={{ ...style, color: BAI.caramel }} />
}

// ── Priority helpers ───────────────────────────────────────────────────────

function priorityColor(p: MaintenancePriority): string {
  if (p === 'URGENT') return '#9b1c1c'
  if (p === 'HIGH')   return BAI.caramel
  if (p === 'MEDIUM') return BAI.owner
  return BAI.inkFaint
}
function priorityBg(p: MaintenancePriority): string {
  if (p === 'URGENT') return BAI.errorLight
  if (p === 'HIGH')   return BAI.caramelLight
  if (p === 'MEDIUM') return BAI.ownerLight
  return BAI.bgMuted
}

// ── AI severity ────────────────────────────────────────────────────────────

function severityLabel(s: string): string {
  if (s === 'low')      return 'Faible'
  if (s === 'medium')   return 'Moyen'
  if (s === 'high')     return 'Élevé'
  return 'Critique'
}
function severityColor(s: string): string {
  if (s === 'low')    return BAI.tenant
  if (s === 'medium') return BAI.caramel
  if (s === 'high')   return BAI.error
  return '#7b0000'
}

// ── Signaled message helper ────────────────────────────────────────────────

const SIGNALED_RE = /🔧\s*\[PROBLÈME SIGNALÉ\]/i

type StatusFilter = 'ALL' | MaintenanceStatus

export default function Maintenance() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [contractorsMap, setContractorsMap] = useState<Record<string, ContractorResult>>({})
  const [loadingContractors, setLoadingContractors] = useState<string | null>(null)
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

  async function handleFindContractors(req: { id: string; category: MaintenanceCategory; property?: { title: string; city?: string; latitude?: number | null; longitude?: number | null } }) {
    if (contractorsMap[req.id]) {
      // toggle off if already loaded
      setContractorsMap(m => { const n = { ...m }; delete n[req.id]; return n })
      return
    }
    setLoadingContractors(req.id)
    try {
      const result = await maintenanceService.findContractors({
        category: req.category,
        city: req.property?.city ?? '',
        latitude: req.property?.latitude ?? null,
        longitude: req.property?.longitude ?? null,
      })
      setContractorsMap(m => ({ ...m, [req.id]: result }))
      if (result.contractors.length === 0) toast('Aucun artisan trouvé à proximité — essayez les plateformes ci-dessous.', { icon: 'ℹ️' })
    } catch (e) {
      toast.error('Erreur lors de la recherche d\'artisans')
    } finally {
      setLoadingContractors(null)
    }
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
    { value: 'ALL',         label: 'Tous' },
    { value: 'OPEN',        label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED',    label: 'Résolu' },
    { value: 'CLOSED',      label: 'Fermé' },
  ]

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
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
                    background: BAI.errorLight,
                    border: `1px solid #fca5a5`,
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    fontWeight: 700,
                    color: BAI.error,
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
              minHeight: 44,
            }}
          >
            <PlusCircle style={{ width: 16, height: 16 }} />
            Nouvelle demande
          </button>
        </div>

        {/* ── Create form ─────────────────────────────────────────────────── */}
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
                  minHeight: 44,
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
                  minHeight: 44,
                }}
              >
                Créer la demande
              </button>
            </div>
          </form>
        )}

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: statusFilter === opt.value ? 'none' : `1px solid ${BAI.border}`,
                background: statusFilter === opt.value ? BAI.night : 'transparent',
                color: statusFilter === opt.value ? '#fff' : BAI.inkMid,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: BAI.transition,
                minHeight: 36,
              }}
            >
              {opt.label}
              {opt.value !== 'ALL' && (
                <span
                  style={{
                    marginLeft: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: statusFilter === opt.value ? 'rgba(255,255,255,0.20)' : BAI.bgMuted,
                    fontSize: 10,
                    fontWeight: 700,
                    color: statusFilter === opt.value ? '#fff' : BAI.inkFaint,
                  }}
                >
                  {requests.filter(r => r.status === opt.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Request list ────────────────────────────────────────────────── */}
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
              // Check if request originated from a chat signal
              const isFromChat = req.description ? SIGNALED_RE.test(req.description) : false

              return (
                <div
                  key={req.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: BAI.shadowSm,
                  }}
                >
                  {/* From chat badge */}
                  {isFromChat && (
                    <div
                      style={{
                        padding: '6px 16px',
                        background: BAI.caramelLight,
                        borderBottom: `1px solid ${BAI.caramelBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 12 }}>🔧</span>
                      <span
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 11,
                          fontWeight: 700,
                          color: BAI.caramel,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Signalé par le locataire via la messagerie
                      </span>
                    </div>
                  )}

                  {/* Card header */}
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                  >
                    {/* Category icon circle */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: BAI.bgMuted,
                        border: `1px solid ${BAI.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon category={req.category} size={20} />
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 6,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 15,
                            fontWeight: 700,
                            color: BAI.ink,
                            margin: 0,
                          }}
                        >
                          {req.title}
                        </p>

                        {/* Status badge */}
                        <StatusBadge s={req.status} />

                        {/* Priority badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: priorityBg(req.priority),
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 700,
                            color: priorityColor(req.priority),
                          }}
                        >
                          {MAINTENANCE_PRIORITY_LABELS[req.priority]}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 12,
                            color: BAI.inkMid,
                            fontWeight: 600,
                          }}
                        >
                          {MAINTENANCE_CATEGORY_LABELS[req.category]}
                        </span>
                        {req.property && (
                          <>
                            <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                              {req.property.title}
                            </span>
                          </>
                        )}
                        {req.tenant && (
                          <>
                            <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                              {req.tenant.firstName} {req.tenant.lastName}
                            </span>
                          </>
                        )}
                        <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                          {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          color: BAI.inkMid,
                          margin: 0,
                          lineHeight: 1.6,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {req.description}
                      </p>

                      {/* Action buttons row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginTop: 12,
                        }}
                      >
                        {/* AI analyze button */}
                        <button
                          onClick={() => {
                            analyzeWithAI(req.id)
                            setExpandedId(req.id)
                          }}
                          disabled={analyzing}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: `1px solid ${BAI.caramelBorder}`,
                            background: analyzing ? BAI.caramelLight : 'transparent',
                            fontFamily: BAI.fontBody,
                            fontSize: 12,
                            fontWeight: 600,
                            color: BAI.caramel,
                            cursor: analyzing ? 'wait' : 'pointer',
                            whiteSpace: 'nowrap',
                            minHeight: 36,
                          }}
                        >
                          <Sparkles style={{ width: 13, height: 13 }} />
                          {analyzing ? 'Analyse...' : req.aiAnalysis ? "Ré-analyser avec l'IA" : "Analyser avec l'IA"}
                        </button>

                        {/* Expand AI result toggle */}
                        {req.aiAnalysis && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : req.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: 'none',
                              border: `1px solid ${BAI.border}`,
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontFamily: BAI.fontBody,
                              fontSize: 12,
                              fontWeight: 600,
                              color: BAI.inkMid,
                              padding: '7px 14px',
                              minHeight: 36,
                            }}
                          >
                            {expanded ? (
                              <ChevronUp style={{ width: 13, height: 13 }} />
                            ) : (
                              <ChevronDown style={{ width: 13, height: 13 }} />
                            )}
                            {expanded ? "Masquer l'analyse" : "Voir l'analyse IA"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: status select */}
                    <div style={{ flexShrink: 0 }}>
                      <select
                        value={req.status}
                        onChange={e =>
                          updateStatus(req.id, { status: e.target.value as MaintenanceStatus })
                        }
                        onClick={e => e.stopPropagation()}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: `1px solid ${BAI.border}`,
                          background: BAI.bgMuted,
                          fontFamily: BAI.fontBody,
                          fontSize: 12,
                          color: BAI.ink,
                          outline: 'none',
                          cursor: 'pointer',
                          minHeight: 36,
                        }}
                      >
                        {(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map(k => (
                          <option key={k} value={k}>
                            {MAINTENANCE_STATUS_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── AI Analysis panel ──────────────────────────────────────── */}
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

                      {/* Find contractors button */}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BAI.border}` }}>
                        <button
                          onClick={() => handleFindContractors(req)}
                          disabled={loadingContractors === req.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 8, border: 'none',
                            background: BAI.night, color: '#fff',
                            fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                            cursor: loadingContractors === req.id ? 'wait' : 'pointer',
                            minHeight: 40, opacity: loadingContractors === req.id ? 0.7 : 1,
                          }}
                        >
                          <Search style={{ width: 14, height: 14 }} />
                          {loadingContractors === req.id
                            ? 'Recherche en cours...'
                            : contractorsMap[req.id]
                              ? 'Masquer les artisans'
                              : 'Trouver un artisan à proximité'}
                        </button>

                        {/* Contractor cards */}
                        {contractorsMap[req.id] && (() => {
                          const res = contractorsMap[req.id]
                          return (
                            <div style={{ marginTop: 16 }}>
                              {res.contractors.length > 0 ? (
                                <>
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.inkMid, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {res.contractors.length} artisan{res.contractors.length > 1 ? 's' : ''} à proximité
                                  </p>
                                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                    {res.contractors.map(c => (
                                      <div key={c.id} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0, background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: 14 }}>
                                        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                        {c.distance != null && (
                                          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin style={{ width: 11, height: 11 }} />
                                            {c.distance < 1 ? `${Math.round(c.distance * 1000)} m` : `${c.distance.toFixed(1)} km`}
                                          </p>
                                        )}
                                        {c.address && (
                                          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</p>
                                        )}
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          {c.phone && (
                                            <a href={`tel:${c.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner, minHeight: 36 }}>
                                              <Phone style={{ width: 12, height: 12 }} /> Appeler
                                            </a>
                                          )}
                                          {c.website && (
                                            <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.caramel, minHeight: 36 }}>
                                              <Globe style={{ width: 12, height: 12 }} /> Site
                                            </a>
                                          )}
                                          {!c.phone && !c.website && (
                                            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>Aucun contact disponible</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 10px' }}>
                                  Aucun artisan trouvé via OpenStreetMap. Consultez ces plateformes :
                                </p>
                              )}

                              {/* Platform links */}
                              {res.platforms.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: res.contractors.length > 0 ? 12 : 0 }}>
                                  {res.platforms.map(p => (
                                    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, minHeight: 34 }}>
                                      <ExternalLink style={{ width: 11, height: 11 }} /> {p.name}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      {/* AI platforms (from analysis) */}
                      {req.aiAnalysis.platforms.length > 0 && !contractorsMap[req.id] && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, margin: '0 0 8px' }}>
                            Plateformes recommandées par l'IA
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {req.aiAnalysis.platforms.map(p => (
                              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1px solid ${BAI.caramelBorder}`, background: BAI.caramelLight, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.caramel, minHeight: 36 }}>
                                <ExternalLink style={{ width: 11, height: 11 }} /> {p.name}
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
