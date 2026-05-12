import { useEffect, useState } from 'react'
import {
  CheckCircle, Clock, AlertCircle, TrendingUp,
  Building2, ArrowDownRight, Info,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

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
  contract: {
    id: string
    monthlyRent: number
    tenant: { firstName: string; lastName: string; email: string }
    property: { title: string; address: string; city: string }
  }
}

function PaymentRow({ p }: { p: PaymentEntry }) {
  const statusColors: Record<string, string> = {
    PAID: '#16a34a', PENDING: BAI.inkFaint, LATE: BAI.error, CANCELLED: BAI.inkFaint,
  }
  const statusLabels: Record<string, string> = {
    PAID: 'Reçu', PENDING: 'En attente', LATE: 'En retard', CANCELLED: 'Annulé',
  }
  const total = p.amount + p.charges

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '16px 22px', borderBottom: `1px solid ${BAI.border}`, gap: 12, transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.month - 1]} {p.year}
          </span>
          <span style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            color: statusColors[p.status] ?? BAI.inkMid,
            background: p.status === 'PAID' ? '#f0fdf4' : BAI.bgMuted,
            padding: '2px 8px', borderRadius: 99,
          }}>
            {statusLabels[p.status] ?? p.status}
          </span>
        </div>
        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
          {p.contract.tenant.firstName} {p.contract.tenant.lastName} · {p.contract.property.title}
        </span>
        {p.paidDate && (
          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
            Reçu le {new Date(p.paidDate).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0 }}>
          {formatEuro(total)}
        </p>
        {p.charges > 0 && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
            Loyer {formatEuro(p.amount)} + ch. {formatEuro(p.charges)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function OwnerWallet() {
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { loadData() }, [showAll])

  async function loadData() {
    setLoading(true)
    try {
      const res = await apiClient.get<{ success: boolean; data: PaymentEntry[] }>(`/payments/by-owner?all=${showAll}`)
      setPayments(res.data.data ?? [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const paid = payments.filter(p => p.status === 'PAID')
  const pending = payments.filter(p => p.status === 'PENDING')
  const late = payments.filter(p => p.status === 'LATE')
  const totalReceived = paid.reduce((s, p) => s + p.amount + p.charges, 0)

  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
            Mon portefeuille
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
            Revenus locatifs
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
            Suivi des loyers perçus — les paiements s'effectuent directement entre vous et vos locataires.
          </p>
        </div>

        {/* Info banner */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#eaf0fb', border: '1px solid #b8ccf0', borderRadius: 12, padding: '14px 18px', marginBottom: 28 }}>
          <Info style={{ width: 16, height: 16, color: BAI.owner, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.owner, margin: '0 0 3px' }}>
              Paiement direct entre propriétaire et locataire
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: '#2a4a8a', lineHeight: 1.6, margin: 0 }}>
              Les loyers sont versés directement sur votre compte bancaire (virement, prélèvement, chèque…).
              Marquez les loyers comme reçus depuis la page{' '}
              <Link to="/owner/quittances" style={{ color: BAI.owner, fontWeight: 600, textDecoration: 'none' }}>Quittances</Link>
              {' '}pour générer et envoyer les quittances à vos locataires.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div className="animate-spin" style={{ width: 36, height: 36, border: `3px solid ${BAI.border}`, borderTopColor: BAI.owner, borderRadius: '50%', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total reçu', value: formatEuro(totalReceived), icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'Loyers reçus', value: `${paid.length}`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { label: 'En attente', value: `${pending.length}`, icon: Clock, color: BAI.inkMid, bg: BAI.bgMuted, border: BAI.border },
                { label: 'En retard', value: `${late.length}`, icon: AlertCircle, color: BAI.error, bg: BAI.errorLight, border: '#fca5a5' },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: kpi.bg, border: `1px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Icon style={{ width: 16, height: 16, color: kpi.color }} />
                    </div>
                    <p style={{ fontFamily: BAI.fontDisplay, fontSize: 26, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>{kpi.value}</p>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{kpi.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Historique */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownRight style={{ width: 15, height: 15, color: BAI.owner }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                    Historique des loyers
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {payments.length > 0 && (
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                      {payments.length} entrée{payments.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => setShowAll(v => !v)}
                    style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showAll ? 'Voir les 3 derniers mois' : 'Voir tout'}
                  </button>
                </div>
              </div>

              {payments.length === 0 ? (
                <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Building2 style={{ width: 24, height: 24, color: BAI.inkFaint }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 4px', fontWeight: 600 }}>
                    Aucun loyer enregistré
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                    Générez des échéances de loyer depuis la page{' '}
                    <Link to="/owner/quittances" style={{ color: BAI.caramel, fontWeight: 600, textDecoration: 'none' }}>Quittances</Link>
                    {' '}pour les faire apparaître ici.
                  </p>
                </div>
              ) : (
                payments.map(p => <PaymentRow key={p.id} p={p} />)
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
