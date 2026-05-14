import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'
import {
  Building2,
  CreditCard,
  Download,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string
  month: number
  year: number
  amount: number
  status: 'PENDING' | 'PAID' | 'LATE' | 'CANCELLED'
  paidAt?: string
  receiptUrl?: string
  contract: {
    id: string
    monthlyRent: number
    charges?: number
    property: { title: string; address: string }
    owner: {
      firstName: string
      lastName: string
      avatar?: string
      iban?: string
      bic?: string
      bankName?: string
      bankHolder?: string
    }
  }
}

// ── Status config ──────────────────────────────────────────────────────────────

const statusConfig = {
  PAID:      { label: 'Payé',       bg: '#edf7f2', color: '#1b5e3b', border: '#9fd4ba' },
  PENDING:   { label: 'En attente', bg: '#fdf5ec', color: '#92400e', border: '#f3c99a' },
  LATE:      { label: 'En retard',  bg: '#fef2f2', color: '#9b1c1c', border: '#fca5a5' },
  CANCELLED: { label: 'Annulé',     bg: BAI.bgMuted, color: BAI.inkFaint, border: BAI.border },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function formatEuro(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

// ── Shared card style ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copié`)
    } catch {
      toast.error('Impossible de copier')
    }
  }
  return (
    <button
      onClick={handleCopy}
      title={`Copier ${label}`}
      style={{
        background: BAI.bgMuted,
        border: `1px solid ${BAI.border}`,
        borderRadius: 6,
        padding: '4px 8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: BAI.inkMid,
        fontFamily: BAI.fontBody,
        fontSize: 12,
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BAI.border }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = BAI.bgMuted }}
    >
      <Copy size={12} />
      Copier
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TenantPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await apiClient.get('/payments/by-tenant')
        setPayments(res.data.data as Payment[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // KPI counts
  const paidCount    = payments.filter(p => p.status === 'PAID').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const lateCount    = payments.filter(p => p.status === 'LATE').length

  // Owner from first payment (all from same tenant, same owner expected)
  const owner = payments[0]?.contract?.owner ?? null

  // Sort by year desc, month desc
  const sorted = [...payments].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  )

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <p style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BAI.caramel,
              fontFamily: BAI.fontBody,
              fontWeight: 700,
              marginBottom: 6,
            }}>
              Mes loyers
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay,
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 'clamp(28px,5vw,40px)',
              color: BAI.ink,
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
              Paiements & Quittances
            </h1>
            <p style={{ fontSize: 14, color: BAI.inkMid }}>
              Suivez vos paiements et téléchargez vos quittances
            </p>
          </div>

          {/* ── Loading / Error ───────────────────────────────────────────── */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: BAI.inkFaint, fontFamily: BAI.fontBody }}>
              Chargement…
            </div>
          )}

          {!isLoading && error && (
            <div style={{ ...cardStyle, background: BAI.errorLight, border: '1px solid #fca5a5', marginBottom: 24 }}>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} style={{ color: BAI.error }} />
                <p style={{ color: BAI.error, fontSize: 14 }}>{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex flex-col gap-6">

              {/* ── KPI Row ─────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Payés */}
                <div style={{ ...cardStyle, borderLeft: `4px solid #1b5e3b` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                      Loyers payés
                    </p>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#edf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={15} style={{ color: '#1b5e3b' }} />
                    </div>
                  </div>
                  <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 700, fontStyle: 'italic', color: '#1b5e3b', margin: 0 }}>
                    {paidCount}
                  </p>
                </div>

                {/* En attente */}
                <div style={{ ...cardStyle, borderLeft: `4px solid #92400e` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                      En attente
                    </p>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fdf5ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={15} style={{ color: '#92400e' }} />
                    </div>
                  </div>
                  <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 700, fontStyle: 'italic', color: '#92400e', margin: 0 }}>
                    {pendingCount}
                  </p>
                </div>

                {/* En retard */}
                <div style={{ ...cardStyle, borderLeft: `4px solid ${BAI.error}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                      En retard
                    </p>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: BAI.errorLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={15} style={{ color: BAI.error }} />
                    </div>
                  </div>
                  <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 700, fontStyle: 'italic', color: BAI.error, margin: 0 }}>
                    {lateCount}
                  </p>
                </div>
              </div>

              {/* ── Payment instructions ─────────────────────────────────── */}
              {owner ? (
                owner.iban ? (
                  <div style={cardStyle}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} style={{ color: BAI.inkMid }} />
                      <h2 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 22, color: BAI.ink, fontStyle: 'italic', margin: 0 }}>
                        Virement bancaire
                      </h2>
                    </div>
                    <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                      Effectuez votre virement vers ce compte
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Owner name */}
                      <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div className="min-w-0">
                          <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Bénéficiaire</p>
                          <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500 }}>
                            {owner.firstName} {owner.lastName}
                          </p>
                        </div>
                        <CopyButton value={`${owner.firstName} ${owner.lastName}`} label="Nom" />
                      </div>

                      {/* IBAN */}
                      <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div className="min-w-0">
                          <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>IBAN</p>
                          <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {formatIban(owner.iban)}
                          </p>
                        </div>
                        <CopyButton value={owner.iban.replace(/\s/g, '')} label="IBAN" />
                      </div>

                      {/* BIC */}
                      {owner.bic && (
                        <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div className="min-w-0">
                            <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>BIC / SWIFT</p>
                            <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                              {owner.bic}
                            </p>
                          </div>
                          <CopyButton value={owner.bic} label="BIC" />
                        </div>
                      )}

                      {/* Bank name */}
                      {owner.bankName && (
                        <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div className="min-w-0">
                            <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Banque</p>
                            <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500 }}>
                              {owner.bankName}
                            </p>
                          </div>
                          <CopyButton value={owner.bankName} label="Banque" />
                        </div>
                      )}

                      {/* Bank holder */}
                      {owner.bankHolder && (
                        <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div className="min-w-0">
                            <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Titulaire</p>
                            <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500 }}>
                              {owner.bankHolder}
                            </p>
                          </div>
                          <CopyButton value={owner.bankHolder} label="Titulaire" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, background: '#fdf5ec', border: '1px solid #f3c99a' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} style={{ color: '#92400e', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 14, color: '#92400e', margin: 0 }}>
                        Votre bailleur n'a pas encore renseigné son IBAN. Contactez-le via la messagerie.
                      </p>
                    </div>
                  </div>
                )
              ) : null}

              {/* ── Payment history ──────────────────────────────────────── */}
              <div style={cardStyle}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} style={{ color: BAI.inkMid }} />
                  <h2 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 22, color: BAI.ink, fontStyle: 'italic', margin: 0 }}>
                    Historique des paiements
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                  Tous les loyers enregistrés sur vos contrats
                </p>

                {sorted.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: BAI.inkFaint }}>
                    <Building2 size={32} style={{ color: BAI.border, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14 }}>Aucun paiement enregistré pour vos contrats.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: BAI.fontBody }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${BAI.border}` }}>
                            {['Période', 'Bien', 'Montant', 'Statut', 'Quittance'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((p, i) => {
                            const cfg = statusConfig[p.status]
                            const total = p.amount ?? (p.contract.monthlyRent + (p.contract.charges ?? 0))
                            return (
                              <tr
                                key={p.id}
                                style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${BAI.border}` : 'none' }}
                              >
                                <td style={{ padding: '12px', fontSize: 14, color: BAI.ink, fontWeight: 500 }}>
                                  {MONTH_NAMES[p.month - 1]} {p.year}
                                </td>
                                <td style={{ padding: '12px', fontSize: 13, color: BAI.inkMid, maxWidth: 180 }}>
                                  <p style={{ margin: 0, fontWeight: 500, color: BAI.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.contract.property.title}
                                  </p>
                                  <p style={{ margin: 0, fontSize: 11, color: BAI.inkFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.contract.property.address}
                                  </p>
                                </td>
                                <td style={{ padding: '12px', fontSize: 14, color: BAI.ink, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {formatEuro(total)}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    background: cfg.bg,
                                    color: cfg.color,
                                    border: `1px solid ${cfg.border}`,
                                    borderRadius: 20,
                                    padding: '3px 10px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {cfg.label}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {p.receiptUrl ? (
                                    <a
                                      href={p.receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        background: BAI.bgMuted,
                                        border: `1px solid ${BAI.border}`,
                                        borderRadius: 6,
                                        padding: '4px 10px',
                                        fontSize: 12,
                                        color: BAI.inkMid,
                                        textDecoration: 'none',
                                        fontFamily: BAI.fontBody,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <Download size={12} />
                                      Télécharger
                                    </a>
                                  ) : (
                                    <span style={{ color: BAI.inkFaint, fontSize: 12 }}>—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      {sorted.map(p => {
                        const cfg = statusConfig[p.status]
                        const total = p.amount ?? (p.contract.monthlyRent + (p.contract.charges ?? 0))
                        return (
                          <div key={p.id} style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '12px 14px' }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                                  {MONTH_NAMES[p.month - 1]} {p.year}
                                </p>
                                <p style={{ fontSize: 12, color: BAI.inkFaint, margin: '2px 0 0' }}>
                                  {p.contract.property.title}
                                </p>
                              </div>
                              <span style={{
                                background: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.border}`,
                                borderRadius: 20,
                                padding: '3px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p style={{ fontSize: 16, fontWeight: 700, color: BAI.ink, margin: 0 }}>
                                {formatEuro(total)}
                              </p>
                              {p.receiptUrl && (
                                <a
                                  href={p.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: BAI.bgSurface,
                                    border: `1px solid ${BAI.border}`,
                                    borderRadius: 6,
                                    padding: '4px 10px',
                                    fontSize: 12,
                                    color: BAI.inkMid,
                                    textDecoration: 'none',
                                    fontFamily: BAI.fontBody,
                                  }}
                                >
                                  <Download size={12} />
                                  Quittance
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
