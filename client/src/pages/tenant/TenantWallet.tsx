import { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle, Building2, Info, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { apiClient } from '../../services/api.service'

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function formatEuro(amount: number) {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

interface PaymentEntry {
  id: string
  month: number
  year: number
  amount: number
  charges: number
  status: 'PENDING' | 'PAID' | 'LATE' | 'CANCELLED'
  paidDate: string | null
  receiptCloudinaryId: string | null
  contractId: string
}

interface ContractInfo {
  id: string
  monthlyRent: number
  charges: number
  status: string
  property: { title: string; address: string; city: string }
}

function PaymentRow({ p, onDownload }: { p: PaymentEntry; onDownload: (id: string) => void }) {
  const statusColors: Record<string, string> = {
    PAID: '#16a34a', PENDING: BAI.inkFaint, LATE: BAI.error, CANCELLED: BAI.inkFaint,
  }
  const statusLabels: Record<string, string> = {
    PAID: 'Payé', PENDING: 'En attente', LATE: 'En retard', CANCELLED: 'Annulé',
  }
  const total = p.amount + p.charges

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '16px 22px', borderBottom: `1px solid ${BAI.border}`, gap: 12, transition: 'background 0.15s', alignItems: 'center' }}
      onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.month - 1]} {p.year}
          </span>
          <span style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            color: statusColors[p.status],
            background: p.status === 'PAID' ? '#f0fdf4' : BAI.bgMuted,
            padding: '2px 8px', borderRadius: 99,
          }}>
            {statusLabels[p.status] ?? p.status}
          </span>
        </div>
        {p.paidDate && (
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
            Reçu le {new Date(p.paidDate).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0, textAlign: 'right' }}>
          {formatEuro(total)}
        </p>
        {p.receiptCloudinaryId && (
          <button
            onClick={() => onDownload(p.id)}
            title="Télécharger la quittance"
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <FileText style={{ width: 14, height: 14, color: BAI.inkMid }} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function TenantWallet() {
  const [contracts, setContracts] = useState<ContractInfo[]>([])
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const contractsRes = await apiClient.get<{ success: boolean; data: { contracts: ContractInfo[] } }>('/contracts?role=tenant')
      const activeContracts = (contractsRes.data.data?.contracts ?? []).filter((c: ContractInfo) => c.status === 'ACTIVE')
      setContracts(activeContracts)

      const allPayments: PaymentEntry[] = []
      await Promise.all(
        activeContracts.map(async (c: ContractInfo) => {
          try {
            const res = await apiClient.get<PaymentEntry[]>(`/payments?contractId=${c.id}`)
            allPayments.push(...(res.data ?? []).map(p => ({ ...p, contractId: c.id })))
          } catch { /* ignore */ }
        })
      )
      allPayments.sort((a, b) => b.year - a.year || b.month - a.month)
      setPayments(allPayments)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(paymentId: string) {
    try {
      const res = await apiClient.get<{ url: string }>(`/payments/${paymentId}/receipt`)
      window.open(res.data.url, '_blank')
    } catch {
      toast.error('Quittance non disponible')
    }
  }

  const paid = payments.filter(p => p.status === 'PAID')
  const pending = payments.filter(p => p.status === 'PENDING')
  const totalPaid = paid.reduce((s, p) => s + p.amount + p.charges, 0)
  const monthlyRent = contracts.reduce((s, c) => s + c.monthlyRent + (c.charges ?? 0), 0)

  return (
    <Layout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
            Mon espace paiement
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
            Mes loyers
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
            Suivi de vos paiements et accès à vos quittances de loyer.
          </p>
        </div>

        {/* Info banner */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, borderRadius: 12, padding: '14px 18px', marginBottom: 28 }}>
          <Info style={{ width: 16, height: 16, color: BAI.tenant, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.tenant, margin: '0 0 3px' }}>
              Paiement direct à votre propriétaire
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#1a4a2e', lineHeight: 1.6, margin: 0 }}>
              Versez votre loyer directement à votre propriétaire (virement bancaire, chèque…) selon les modalités convenues dans votre bail.
              Vos quittances sont disponibles ici dès que votre propriétaire marque le paiement comme reçu.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div className="animate-spin" style={{ width: 36, height: 36, border: `3px solid ${BAI.border}`, borderTopColor: BAI.tenant, borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Carte résumé */}
            {contracts.length > 0 && (
              <div style={{ background: BAI.night, borderRadius: 20, padding: 'clamp(24px,4vw,36px)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(27,94,59,0.12)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>
                    Vue d'ensemble
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24 }}>
                    <div>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Loyer mensuel</p>
                      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.caramel, margin: 0, lineHeight: 1.1 }}>
                        {formatEuro(monthlyRent)}
                      </p>
                    </div>
                    {totalPaid > 0 && (
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 24 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Total payé</p>
                        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                          {formatEuro(totalPaid)}
                        </p>
                      </div>
                    )}
                    {pending.length > 0 && (
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 24 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>En attente</p>
                        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                          {pending.length} mois
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Loyers acquittés', value: `${paid.length}`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'En attente', value: `${pending.length}`, icon: Clock, color: BAI.inkMid, bg: BAI.bgMuted, border: BAI.border },
                { label: 'En retard', value: `${payments.filter(p => p.status === 'LATE').length}`, icon: AlertCircle, color: BAI.error, bg: BAI.errorLight, border: '#fca5a5' },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: kpi.bg, border: `1px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      <Icon style={{ width: 14, height: 14, color: kpi.color }} />
                    </div>
                    <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>{kpi.value}</p>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{kpi.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Historique */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                  Historique des loyers
                </p>
                {payments.length > 0 && (
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                    {payments.length} entrée{payments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {contracts.length === 0 ? (
                <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Building2 style={{ width: 24, height: 24, color: BAI.inkFaint }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 8px', fontWeight: 600 }}>Aucun bail actif</p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                    L'historique de vos loyers sera disponible dès que votre bail est signé.{' '}
                    <Link to="/contracts" style={{ color: BAI.caramel, fontWeight: 600, textDecoration: 'none' }}>
                      Voir mes contrats →
                    </Link>
                  </p>
                </div>
              ) : payments.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>
                    Aucun loyer enregistré pour le moment.
                  </p>
                </div>
              ) : (
                payments.map(p => <PaymentRow key={p.id} p={p} onDownload={handleDownload} />)
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
