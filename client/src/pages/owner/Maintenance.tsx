import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import {
  Wrench, Droplets, Zap, Flame, Lock, HelpCircle,
  AlertCircle, Clock, CheckCircle, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

type Category = 'PLOMBERIE' | 'ELECTRICITE' | 'CHAUFFAGE' | 'SERRURERIE' | 'AUTRE'
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'PLOMBERIE', label: 'Plomberie', icon: Droplets, color: '#1a6fab' },
  { value: 'ELECTRICITE', label: 'Électricité', icon: Zap, color: '#b45309' },
  { value: 'CHAUFFAGE', label: 'Chauffage', icon: Flame, color: '#c2410c' },
  { value: 'SERRURERIE', label: 'Serrurerie', icon: Lock, color: '#4a5568' },
  { value: 'AUTRE', label: 'Autre', icon: HelpCircle, color: BAI.inkMid },
]

const STATUSES: { value: Status; label: string; color: string; bg: string; icon: React.ElementType }[] = [
  { value: 'OPEN', label: 'Non traité', color: BAI.error, bg: BAI.errorLight, icon: AlertCircle },
  { value: 'IN_PROGRESS', label: 'En cours', color: '#92400e', bg: '#fdf5ec', icon: Clock },
  { value: 'RESOLVED', label: 'Résolu', color: '#1b5e3b', bg: '#edf7f2', icon: CheckCircle },
]

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  category: Category
  status: Status
  createdAt: string
  updatedAt: string
  property?: { title: string; city: string }
  tenant?: { firstName: string; lastName: string }
}

function CategorySelect({ value, onChange }: { value: Category; onChange: (v: Category) => void }) {
  const [open, setOpen] = useState(false)
  const current = CATEGORIES.find(c => c.value === value) ?? CATEGORIES[4]
  const Icon = current.icon
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
          fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
          color: current.color, cursor: 'pointer',
        }}
      >
        <Icon className="w-3.5 h-3.5" />
        {current.label}
        <ChevronDown className="w-3 h-3" style={{ color: BAI.inkFaint }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
          background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
          borderRadius: 10, padding: 4, minWidth: 160,
          boxShadow: '0 8px 24px rgba(13,12,10,0.12)',
        }}>
          {CATEGORIES.map(cat => {
            const CatIcon = cat.icon
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onChange(cat.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: 'none', background: cat.value === value ? BAI.bgMuted : 'transparent',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 500,
                  color: cat.color, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <CatIcon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusButton({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const statuses = STATUSES
  const currentIdx = statuses.findIndex(s => s.value === value)
  const current = statuses[currentIdx] ?? statuses[0]
  const StatusIcon = current.icon

  const nextStatus = () => {
    const next = statuses[(currentIdx + 1) % statuses.length]
    onChange(next.value)
  }

  return (
    <button
      type="button"
      onClick={nextStatus}
      title="Cliquer pour changer le statut"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 20,
        background: current.bg, color: current.color,
        border: `1px solid ${current.color}30`,
        fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      <StatusIcon className="w-3.5 h-3.5" />
      {current.label}
    </button>
  )
}

export default function Maintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/maintenance')
      setRequests(res.data.data?.requests ?? res.data.data ?? [])
    } catch {
      toast.error('Impossible de charger les demandes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleUpdate = async (id: string, patch: { category?: Category; status?: Status }) => {
    setUpdating(id)
    try {
      await apiClient.patch(`/maintenance/${id}`, patch)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
      if (patch.status) {
        const s = STATUSES.find(s => s.value === patch.status)
        toast.success(`Statut mis à jour : ${s?.label}`)
      }
    } catch {
      toast.error('Impossible de mettre à jour')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter)
  const counts = {
    ALL: requests.length,
    OPEN: requests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: requests.filter(r => r.status === 'IN_PROGRESS').length,
    RESOLVED: requests.filter(r => r.status === 'RESOLVED').length,
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', padding: 'clamp(20px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
              Gestion
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px', lineHeight: 1.15 }}>
              Maintenance
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
              Demandes signalées par vos locataires
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {([
              ['ALL', 'Toutes'],
              ['OPEN', 'Non traitées'],
              ['IN_PROGRESS', 'En cours'],
              ['RESOLVED', 'Résolues'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: filter === val ? `1.5px solid ${BAI.night}` : `1.5px solid ${BAI.border}`,
                  background: filter === val ? BAI.night : BAI.bgSurface,
                  color: filter === val ? '#fff' : BAI.inkMid,
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: filter === val ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {label}
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  background: filter === val ? 'rgba(255,255,255,0.2)' : BAI.bgMuted,
                  color: filter === val ? '#fff' : BAI.inkFaint,
                  borderRadius: 10, padding: '1px 6px',
                }}>
                  {counts[val]}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 12, padding: '48px 24px', textAlign: 'center',
            }}>
              <Wrench className="w-8 h-8" style={{ color: BAI.inkFaint, margin: '0 auto 12px' }} />
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 20, fontWeight: 700, color: BAI.ink, margin: '0 0 8px' }}>
                Aucune demande
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
                Les signalements de vos locataires apparaîtront ici.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(req => (
                <div
                  key={req.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${req.status === 'OPEN' ? '#fca5a5' : BAI.border}`,
                    borderRadius: 12, padding: '16px 20px',
                    boxShadow: '0 1px 2px rgba(13,12,10,0.04)',
                    opacity: updating === req.id ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink, margin: '0 0 4px' }}>
                        {req.title}
                      </h3>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 10px', lineHeight: 1.55 }}>
                        {req.description}
                      </p>
                      <div style={{ display: 'flex', gap: '6px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                          {req.tenant ? `${req.tenant.firstName} ${req.tenant.lastName}` : 'Locataire'}
                          {req.property && ` · ${req.property.title}`}
                        </span>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                          {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                      {/* Status toggle */}
                      <StatusButton
                        value={req.status}
                        onChange={v => handleUpdate(req.id, { status: v })}
                      />
                      {/* Category picker */}
                      <CategorySelect
                        value={req.category}
                        onChange={v => handleUpdate(req.id, { category: v })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
