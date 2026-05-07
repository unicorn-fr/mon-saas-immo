import React, { useState, useEffect, useCallback } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'
import {
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
  X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string
  contractId: string
  amount: number
  charges: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'LATE' | 'WAIVED'
  month: number
  year: number
  receiptCloudinaryId?: string
  contract: {
    id: string
    monthlyRent: number
    tenant: { firstName: string; lastName: string; email: string }
    property: { title: string; address: string; city: string }
  }
}

interface ContractSettings {
  dayOfMonth: number
  autoSend: boolean
}

interface ContractGroup {
  contractId: string
  propertyTitle: string
  propertyCity: string
  tenantName: string
  tenantEmail: string
  payments: Payment[]
  settings: ContractSettings | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES_FR[month - 1] ?? month} ${year}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function groupByContract(payments: Payment[]): ContractGroup[] {
  const map = new Map<string, ContractGroup>()
  for (const p of payments) {
    const key = p.contractId
    if (!map.has(key)) {
      map.set(key, {
        contractId: p.contractId,
        propertyTitle: p.contract.property.title,
        propertyCity: p.contract.property.city,
        tenantName: `${p.contract.tenant.firstName} ${p.contract.tenant.lastName}`,
        tenantEmail: p.contract.tenant.email,
        payments: [],
        settings: null,
      })
    }
    map.get(key)!.payments.push(p)
  }
  // Sort payments desc by date within each group
  map.forEach(group => {
    group.payments.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })
  })
  return Array.from(map.values())
}

function getStatusStyle(status: Payment['status']): React.CSSProperties {
  switch (status) {
    case 'PAID':
      return { background: BAI.tenantLight, color: BAI.tenant, border: `1px solid ${BAI.tenantBorder}` }
    case 'PENDING':
      return { background: BAI.caramelLight, color: BAI.caramel, border: `1px solid ${BAI.caramelBorder}` }
    case 'LATE':
      return { background: BAI.errorLight, color: BAI.error, border: `1px solid #fca5a5` }
    case 'WAIVED':
      return { background: BAI.bgMuted, color: BAI.inkFaint, border: `1px solid ${BAI.border}` }
  }
}

function getStatusLabel(status: Payment['status']): string {
  switch (status) {
    case 'PAID': return 'Payé'
    case 'PENDING': return 'En attente'
    case 'LATE': return 'En retard'
    case 'WAIVED': return 'Annulé'
  }
}

function getStatusIcon(status: Payment['status']) {
  switch (status) {
    case 'PAID': return <CheckCircle size={12} />
    case 'PENDING': return <Clock size={12} />
    case 'LATE': return <AlertCircle size={12} />
    case 'WAIVED': return <X size={12} />
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  contractId: string
  settings: ContractSettings | null
  onClose: () => void
  onSaved: (contractId: string, settings: ContractSettings) => void
}

function SettingsPanel({ contractId, settings, onClose, onSaved }: SettingsPanelProps) {
  const [dayOfMonth, setDayOfMonth] = useState(settings?.dayOfMonth ?? 1)
  const [autoSend, setAutoSend] = useState(settings?.autoSend ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await apiClient.put(`/payments/settings/${contractId}`, { dayOfMonth, autoSend })
      onSaved(contractId, { dayOfMonth, autoSend })
      toast.success('Paramètres sauvegardés')
      onClose()
    } catch {
      toast.error('Impossible de sauvegarder les paramètres')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        marginTop: 8,
        boxShadow: BAI.shadowMd,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink }}>
          Paramètres d'envoi
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Toggle autoSend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 500, color: BAI.ink }}>
            Envoi automatique
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>
            Envoie la quittance au locataire chaque mois
          </p>
        </div>
        <button
          onClick={() => setAutoSend(v => !v)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: autoSend ? BAI.tenant : BAI.border,
            position: 'relative',
            transition: BAI.transition,
            flexShrink: 0,
          }}
          aria-checked={autoSend}
          role="switch"
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: autoSend ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: BAI.bgSurface,
              boxShadow: BAI.shadowSm,
              transition: BAI.transition,
            }}
          />
        </button>
      </div>

      {/* Day selector */}
      <div className="mb-5">
        <label
          htmlFor={`day-${contractId}`}
          style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 500, color: BAI.ink, display: 'block', marginBottom: 6 }}
        >
          Jour d'envoi dans le mois
        </label>
        <select
          id={`day-${contractId}`}
          value={dayOfMonth}
          onChange={e => setDayOfMonth(Number(e.target.value))}
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 13,
            color: BAI.ink,
            background: BAI.bgInput,
            border: `1px solid ${BAI.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            width: '100%',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
            <option key={d} value={d}>
              {d} du mois
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            background: saving ? BAI.inkFaint : BAI.night,
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: saving ? 'not-allowed' : 'pointer',
            minHeight: 36,
            transition: BAI.transition,
          }}
        >
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button
          onClick={onClose}
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 500,
            color: BAI.ink,
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            minHeight: 36,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

interface MarkPaidInlineProps {
  paymentId: string
  onConfirm: (paymentId: string, paidDate: string) => Promise<void>
  onCancel: () => void
}

function MarkPaidInline({ paymentId, onConfirm, onCancel }: MarkPaidInlineProps) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(paymentId, paidDate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      style={{
        background: BAI.tenantLight,
        border: `1px solid ${BAI.tenantBorder}`,
        borderRadius: 8,
        padding: '8px 12px',
        marginTop: 8,
      }}
    >
      <Calendar size={14} style={{ color: BAI.tenant, flexShrink: 0 }} />
      <input
        type="date"
        value={paidDate}
        onChange={e => setPaidDate(e.target.value)}
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 13,
          color: BAI.ink,
          background: BAI.bgSurface,
          border: `1px solid ${BAI.tenantBorder}`,
          borderRadius: 6,
          padding: '4px 8px',
          outline: 'none',
          minHeight: 32,
        }}
      />
      <button
        onClick={handleConfirm}
        disabled={loading}
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background: loading ? BAI.inkFaint : BAI.tenant,
          border: 'none',
          borderRadius: 6,
          padding: '4px 12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          minHeight: 32,
          transition: BAI.transition,
        }}
      >
        {loading ? '…' : 'Confirmer'}
      </button>
      <button
        onClick={onCancel}
        style={{
          fontFamily: BAI.fontBody,
          fontSize: 12,
          color: BAI.inkMid,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          minHeight: 32,
        }}
      >
        Annuler
      </button>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Quittances() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [groups, setGroups] = useState<ContractGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [openSettings, setOpenSettings] = useState<string | null>(null) // contractId
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)   // paymentId
  const [actionLoading, setActionLoading] = useState<string | null>(null) // paymentId
  const [generatingAll, setGeneratingAll] = useState(false)

  // ── Fetch data ───────────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/payments/by-owner?all=true')
      const raw: Payment[] = res.data.data ?? []
      setPayments(raw)
      const grouped = groupByContract(raw)
      // Fetch settings for each contract
      const withSettings = await Promise.all(
        grouped.map(async group => {
          try {
            const sRes = await apiClient.get(`/payments/settings/${group.contractId}`)
            return { ...group, settings: sRes.data.data as ContractSettings }
          } catch {
            return { ...group, settings: null }
          }
        })
      )
      setGroups(withSettings)
    } catch {
      setError('Impossible de charger les quittances')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // ── Stats ────────────────────────────────────────────────────────────────────

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const thisMonth = payments.filter(p => p.month === currentMonth && p.year === currentYear)
  const totalThisMonth = thisMonth.length
  const paidThisMonth = thisMonth.filter(p => p.status === 'PAID').length
  const pendingThisMonth = thisMonth.filter(p => p.status === 'PENDING').length
  const lateThisMonth = thisMonth.filter(p => p.status === 'LATE').length

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function handleMarkPaid(paymentId: string, paidDate: string) {
    setActionLoading(paymentId)
    try {
      await apiClient.put(`/payments/${paymentId}/mark-paid`, { paidDate })
      setPayments(prev =>
        prev.map(p => p.id === paymentId ? { ...p, status: 'PAID', paidDate } : p)
      )
      setGroups(prev =>
        prev.map(g => ({
          ...g,
          payments: g.payments.map(p => p.id === paymentId ? { ...p, status: 'PAID' as const, paidDate } : p),
        }))
      )
      setMarkingPaid(null)
      toast.success('Paiement marqué comme reçu')
    } catch {
      toast.error('Impossible de marquer ce paiement')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDownload(paymentId: string) {
    setActionLoading(paymentId)
    try {
      const res = await apiClient.get(`/payments/${paymentId}/receipt`)
      const url: string = res.data.url ?? res.data.data?.url
      if (!url) throw new Error('URL manquante')
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Impossible de télécharger la quittance')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResend(paymentId: string) {
    setActionLoading(paymentId)
    try {
      await apiClient.post(`/payments/${paymentId}/send-email`)
      toast.success('Quittance renvoyée au locataire')
    } catch {
      toast.error('Impossible d\'envoyer la quittance')
    } finally {
      setActionLoading(null)
    }
  }

  function handleSettingsSaved(contractId: string, settings: ContractSettings) {
    setGroups(prev =>
      prev.map(g => g.contractId === contractId ? { ...g, settings } : g)
    )
  }

  function toggleGroup(contractId: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(contractId)) next.delete(contractId)
      else next.add(contractId)
      return next
    })
  }

  async function handleGenerateAll() {
    setGeneratingAll(true)
    try {
      await apiClient.post('/payments/auto-generate-all')
      toast.success('Paiements du mois générés')
      await fetchPayments()
    } catch {
      toast.error('Impossible de générer les paiements du mois')
    } finally {
      setGeneratingAll(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div
        style={{
          minHeight: '100vh',
          background: BAI.bgBase,
          padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 40px)',
          fontFamily: BAI.fontBody,
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between flex-wrap gap-4"
          style={{ marginBottom: 32 }}
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
                marginBottom: 6,
              }}
            >
              Gestion locative
            </p>
            <h1
              style={{
                fontFamily: BAI.fontDisplay,
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: BAI.ink,
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Quittances de loyer
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, marginTop: 8 }}>
              Gérez les paiements, générez et envoyez les quittances à vos locataires.
            </p>
          </div>

          {/* Générer le mois en cours */}
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: BAI.fontBody,
              fontSize: 13,
              fontWeight: 600,
              color: BAI.ink,
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 10,
              padding: '10px 18px',
              cursor: generatingAll ? 'not-allowed' : 'pointer',
              minHeight: 44,
              opacity: generatingAll ? 0.7 : 1,
              transition: BAI.transition,
              flexShrink: 0,
              alignSelf: 'flex-end',
            }}
          >
            <RefreshCw
              size={15}
              style={{
                color: BAI.caramel,
                animation: generatingAll ? 'spin 1s linear infinite' : 'none',
              }}
            />
            {generatingAll ? 'Génération…' : 'Générer le mois en cours'}
          </button>
        </div>

        {/* ── Stats Bar ── */}
        {!loading && !error && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 32 }}
          >
            {[
              {
                label: 'Total ce mois',
                value: totalThisMonth,
                suffix: 'paiements',
                bg: BAI.bgSurface,
                color: BAI.ink,
                border: BAI.border,
              },
              {
                label: 'Payés',
                value: paidThisMonth,
                suffix: 'reçus',
                bg: BAI.tenantLight,
                color: BAI.tenant,
                border: BAI.tenantBorder,
              },
              {
                label: 'En attente',
                value: pendingThisMonth,
                suffix: 'en cours',
                bg: BAI.caramelLight,
                color: BAI.caramel,
                border: BAI.caramelBorder,
              },
              {
                label: 'En retard',
                value: lateThisMonth,
                suffix: 'retards',
                bg: BAI.errorLight,
                color: BAI.error,
                border: '#fca5a5',
              },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: stat.bg,
                  border: `1px solid ${stat.border}`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: BAI.shadowSm,
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: stat.color, marginBottom: 6 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 12, color: stat.color, opacity: 0.7, marginTop: 4 }}>
                  {stat.suffix}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center" style={{ padding: '64px 0' }}>
            <RefreshCw size={24} style={{ color: BAI.caramel, animation: 'spin 1s linear infinite' }} />
            <p style={{ marginLeft: 12, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
              Chargement des quittances…
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div
            style={{
              background: BAI.errorLight,
              border: `1px solid #fca5a5`,
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AlertCircle size={20} style={{ color: BAI.error, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.error }}>{error}</p>
              <button
                onClick={fetchPayments}
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: BAI.error,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontFamily: BAI.fontBody,
                }}
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && groups.length === 0 && (
          <div
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <CheckCircle size={40} style={{ color: BAI.inkFaint, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: BAI.ink, marginBottom: 8 }}>
              Aucun paiement trouvé
            </p>
            <p style={{ fontSize: 14, color: BAI.inkMid }}>
              Les quittances apparaîtront ici une fois vos contrats actifs.
            </p>
          </div>
        )}

        {/* ── Contract Groups ── */}
        {!loading && !error && groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map(group => {
              const isCollapsed = collapsedGroups.has(group.contractId)
              const isSettingsOpen = openSettings === group.contractId

              return (
                <div
                  key={group.contractId}
                  style={{
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: 12,
                    boxShadow: BAI.shadowSm,
                    overflow: 'hidden',
                  }}
                >
                  {/* Group header */}
                  <div
                    className="flex items-center justify-between flex-wrap gap-3"
                    style={{
                      padding: '16px 20px',
                      borderBottom: isCollapsed ? 'none' : `1px solid ${BAI.border}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleGroup(group.contractId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div style={{ flexShrink: 0, color: BAI.inkFaint }}>
                        {isCollapsed
                          ? <ChevronRight size={18} />
                          : <ChevronDown size={18} />
                        }
                      </div>
                      <div className="min-w-0">
                        <p
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 15,
                            fontWeight: 600,
                            color: BAI.ink,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {group.propertyTitle}
                        </p>
                        <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 2 }}>
                          {group.tenantName} · {group.propertyCity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* AutoSend badge */}
                      <span
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding: '3px 10px',
                          borderRadius: 99,
                          ...(group.settings?.autoSend
                            ? { background: BAI.tenantLight, color: BAI.tenant, border: `1px solid ${BAI.tenantBorder}` }
                            : { background: BAI.bgMuted, color: BAI.inkFaint, border: `1px solid ${BAI.border}` }
                          ),
                        }}
                      >
                        Envoi auto : {group.settings?.autoSend ? 'ON' : 'OFF'}
                      </span>

                      {/* Settings button */}
                      <button
                        onClick={() => setOpenSettings(isSettingsOpen ? null : group.contractId)}
                        title="Paramètres d'envoi"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          border: `1px solid ${BAI.border}`,
                          background: isSettingsOpen ? BAI.bgMuted : BAI.bgSurface,
                          cursor: 'pointer',
                          color: isSettingsOpen ? BAI.ink : BAI.inkMid,
                          transition: BAI.transition,
                        }}
                      >
                        <Settings size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Settings panel */}
                  {isSettingsOpen && (
                    <div style={{ padding: '0 20px 4px' }}>
                      <SettingsPanel
                        contractId={group.contractId}
                        settings={group.settings}
                        onClose={() => setOpenSettings(null)}
                        onSaved={handleSettingsSaved}
                      />
                    </div>
                  )}

                  {/* Payments list */}
                  {!isCollapsed && (
                    <div>
                      {group.payments.map((payment, idx) => {
                        const isLast = idx === group.payments.length - 1
                        const isMarkingThisOne = markingPaid === payment.id
                        const isActing = actionLoading === payment.id
                        const total = payment.amount + (payment.charges ?? 0)

                        return (
                          <div
                            key={payment.id}
                            style={{
                              padding: '14px 20px',
                              borderBottom: isLast ? 'none' : `1px solid ${BAI.border}`,
                            }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              {/* Left: month + amount */}
                              <div className="flex items-center gap-4 min-w-0">
                                <div>
                                  <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                                    {formatMonthYear(payment.month, payment.year)}
                                  </p>
                                  <p style={{ fontSize: 13, color: BAI.inkMid, marginTop: 2 }}>
                                    {formatEuro(payment.amount)}
                                    {payment.charges > 0 && (
                                      <span style={{ color: BAI.inkFaint }}> + {formatEuro(payment.charges)} charges</span>
                                    )}
                                    {' '}={' '}
                                    <strong style={{ color: BAI.ink }}>{formatEuro(total)}</strong>
                                  </p>
                                  {payment.paidDate && (
                                    <p style={{ fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>
                                      Payé le {formatDate(payment.paidDate)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: status + actions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Status badge */}
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '4px 10px',
                                    borderRadius: 99,
                                    ...getStatusStyle(payment.status),
                                  }}
                                >
                                  {getStatusIcon(payment.status)}
                                  {getStatusLabel(payment.status)}
                                </span>

                                {/* Action: Mark paid */}
                                {(payment.status === 'PENDING' || payment.status === 'LATE') && (
                                  <button
                                    onClick={() => setMarkingPaid(isMarkingThisOne ? null : payment.id)}
                                    disabled={isActing}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#fff',
                                      background: isActing ? BAI.inkFaint : BAI.tenant,
                                      border: 'none',
                                      borderRadius: 8,
                                      padding: '6px 12px',
                                      cursor: isActing ? 'not-allowed' : 'pointer',
                                      minHeight: 32,
                                      transition: BAI.transition,
                                    }}
                                  >
                                    <CheckCircle size={13} />
                                    Marquer payé
                                  </button>
                                )}

                                {/* Action: Download receipt */}
                                {payment.status === 'PAID' && payment.receiptCloudinaryId && (
                                  <button
                                    onClick={() => handleDownload(payment.id)}
                                    disabled={isActing}
                                    title="Télécharger la quittance"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: BAI.ink,
                                      background: BAI.bgSurface,
                                      border: `1px solid ${BAI.border}`,
                                      borderRadius: 8,
                                      padding: '6px 12px',
                                      cursor: isActing ? 'not-allowed' : 'pointer',
                                      minHeight: 32,
                                      transition: BAI.transition,
                                      opacity: isActing ? 0.5 : 1,
                                    }}
                                  >
                                    <Download size={13} />
                                    Télécharger
                                  </button>
                                )}

                                {/* Action: Resend receipt */}
                                {payment.status === 'PAID' && payment.receiptCloudinaryId && (
                                  <button
                                    onClick={() => handleResend(payment.id)}
                                    disabled={isActing}
                                    title="Renvoyer la quittance"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      color: BAI.owner,
                                      background: BAI.ownerLight,
                                      border: `1px solid ${BAI.ownerBorder}`,
                                      borderRadius: 8,
                                      padding: '6px 12px',
                                      cursor: isActing ? 'not-allowed' : 'pointer',
                                      minHeight: 32,
                                      transition: BAI.transition,
                                      opacity: isActing ? 0.5 : 1,
                                    }}
                                  >
                                    <Send size={13} />
                                    Renvoyer
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Mark paid inline UI */}
                            {isMarkingThisOne && (
                              <MarkPaidInline
                                paymentId={payment.id}
                                onConfirm={handleMarkPaid}
                                onCancel={() => setMarkingPaid(null)}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Spin keyframe */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </Layout>
  )
}
