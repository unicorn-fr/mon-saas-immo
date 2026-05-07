import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Wallet, CheckCircle, AlertCircle, Clock, ExternalLink,
  TrendingUp, ArrowDownRight, RefreshCw, Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'
import { Layout } from '../../components/layout/Layout'
import { connectService, type ConnectStatus, type WalletPayment, type WalletSummary } from '../../services/connect.service'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const STRIPE_REQUIREMENT_LABELS: Record<string, string> = {
  'individual.verification.document': 'Pièce d\'identité',
  'individual.verification.additional_document': 'Justificatif de domicile',
  'individual.dob.day': 'Date de naissance',
  'individual.dob.month': 'Date de naissance',
  'individual.dob.year': 'Date de naissance',
  'individual.first_name': 'Prénom',
  'individual.last_name': 'Nom de famille',
  'individual.address.line1': 'Adresse postale',
  'individual.address.postal_code': 'Code postal',
  'individual.address.city': 'Ville',
  'individual.phone': 'Numéro de téléphone',
  'individual.ssn_last_4': 'Numéro de sécurité sociale',
  'individual.id_number': 'Numéro d\'identité',
  'external_account': 'Coordonnées bancaires (IBAN)',
  'business_profile.url': 'Site web',
  'tos_acceptance.date': 'Acceptation des conditions d\'utilisation',
  'tos_acceptance.ip': 'Acceptation des conditions d\'utilisation',
}

const getRequirementLabel = (key: string) => STRIPE_REQUIREMENT_LABELS[key] ?? key

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function StatusBadge({ status }: { status: 'not_created' | 'pending' | 'active' | 'restricted' }) {
  const config = {
    not_created: { label: 'Non configuré', bg: BAI.bgMuted, color: BAI.inkFaint, icon: Clock },
    pending:     { label: 'En attente de validation', bg: '#fdf5ec', color: '#92400e', icon: Clock },
    restricted:  { label: 'Informations manquantes', bg: BAI.errorLight, color: BAI.error, icon: AlertCircle },
    active:      { label: 'Compte actif', bg: '#f0fdf4', color: '#16a34a', icon: CheckCircle },
  }[status]
  const Icon = config.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 99,
      background: config.bg, color: config.color,
      fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
    }}>
      <Icon style={{ width: 13, height: 13 }} />
      {config.label}
    </span>
  )
}

function PaymentRow({ p }: { p: WalletPayment }) {
  const statusColors: Record<string, string> = {
    SUCCEEDED: '#16a34a', PROCESSING: '#92400e', PENDING: BAI.inkFaint,
    FAILED: BAI.error, REFUNDED: BAI.inkMid,
  }
  const statusLabels: Record<string, string> = {
    SUCCEEDED: 'Reçu', PROCESSING: 'En cours', PENDING: 'Prévu',
    FAILED: 'Échoué', REFUNDED: 'Remboursé',
  }
  const netCents = p.totalAmountCents - (p.platformFeeCents ?? 0)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto',
      padding: '14px 20px', borderBottom: `1px solid ${BAI.border}`,
      gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.periodMonth - 1]} {p.periodYear}
          </span>
          <span style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            color: statusColors[p.status] ?? BAI.inkMid,
            background: p.status === 'SUCCEEDED' ? '#f0fdf4' : BAI.bgMuted,
            padding: '2px 7px', borderRadius: 99,
          }}>
            {statusLabels[p.status] ?? p.status}
          </span>
        </div>
        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
          {p.tenant?.firstName} {p.tenant?.lastName} · {p.contract.property.title}
        </span>
        {p.failureReason && (
          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error }}>{p.failureReason}</span>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, color: BAI.ink, margin: 0 }}>
          {formatEuro(netCents)}
        </p>
        {p.platformFeeCents ? (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
            -{formatEuro(p.platformFeeCents)} commission
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function OwnerWallet() {
  const [searchParams] = useSearchParams()
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [payments, setPayments] = useState<WalletPayment[]>([])
  const [summary, setSummary] = useState<WalletSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboarding, setOnboarding] = useState(false)
  const [dashboardLink, setDashboardLink] = useState(false)

  useEffect(() => {
    const connectParam = searchParams.get('connect')
    if (connectParam === 'success') {
      toast.success('Compte de virement configuré avec succès !')
    }
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [status, wallet] = await Promise.all([
        connectService.getConnectStatus(),
        connectService.getWallet().catch(() => ({ payments: [], summary: { totalReceivedCents: 0, totalCount: 0, pendingCount: 0, failedCount: 0 } })),
      ])
      setConnectStatus(status)
      setPayments(wallet.payments)
      setSummary(wallet.summary)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleOnboard() {
    setOnboarding(true)
    try {
      const url = await connectService.getOnboardingLink()
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setOnboarding(false)
    }
  }

  async function handleDashboard() {
    setDashboardLink(true)
    try {
      const url = await connectService.getDashboardLink()
      window.open(url, '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setDashboardLink(false)
    }
  }

  const isActive = connectStatus?.status === 'active'

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
            Mon portefeuille
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
            Revenus locatifs
          </h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0 }}>
            Recevez les loyers directement sur votre compte bancaire via Stripe.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${BAI.border}`, borderTopColor: BAI.owner, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Bloc statut compte */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: isActive ? '#f0fdf4' : BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet style={{ width: 22, height: 22, color: isActive ? '#16a34a' : BAI.inkFaint }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink, margin: '0 0 6px' }}>
                      Compte de virement Stripe
                    </p>
                    <StatusBadge status={connectStatus?.status ?? 'not_created'} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {isActive ? (
                    <button
                      onClick={handleDashboard}
                      disabled={dashboardLink}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: `1px solid ${BAI.border}`, background: 'transparent', color: BAI.inkMid, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <ExternalLink style={{ width: 14, height: 14 }} />
                      Tableau de bord Stripe
                    </button>
                  ) : (
                    <button
                      onClick={handleOnboard}
                      disabled={onboarding}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, border: 'none', background: BAI.owner, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {onboarding ? <RefreshCw style={{ width: 14, height: 14 }} /> : <Wallet style={{ width: 14, height: 14 }} />}
                      {connectStatus?.status === 'not_created' ? 'Configurer mon compte' : 'Continuer la configuration'}
                    </button>
                  )}
                </div>
              </div>

              {connectStatus?.status === 'not_created' && (
                <div style={{ marginTop: 16, padding: '14px 16px', background: BAI.bgMuted, borderRadius: 10, fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6 }}>
                  <strong>Comment ça marche :</strong> Stripe collecte les loyers de vos locataires et vire automatiquement le montant net (loyer − commission Bailio) sur votre IBAN chaque semaine. Vous n'avez rien d'autre à faire.
                  <br />Vérification d'identité ~5 min · Aucune carte requise · Virements automatiques
                </div>
              )}

              {connectStatus?.requirements && connectStatus.requirements.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: BAI.errorLight, border: `1px solid #fca5a5`, borderRadius: 10 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.error, margin: '0 0 4px' }}>
                    Informations manquantes pour activer les paiements :
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {connectStatus.requirements.slice(0, 5).map(r => (
                      <li key={r} style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.error }}>{getRequirementLabel(r)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* KPIs */}
            {summary && isActive && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total reçu', value: formatEuro(summary.totalReceivedCents), icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Paiements réussis', value: `${summary.totalCount}`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'En attente', value: `${summary.pendingCount}`, icon: Clock, color: BAI.inkMid, bg: BAI.bgMuted },
                  { label: 'Échecs', value: `${summary.failedCount}`, icon: AlertCircle, color: BAI.error, bg: BAI.errorLight },
                ].map(kpi => {
                  const Icon = kpi.icon
                  return (
                    <div key={kpi.label} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: 14, height: 14, color: kpi.color }} />
                        </div>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>{kpi.label}</span>
                      </div>
                      <p style={{ fontFamily: BAI.fontDisplay, fontSize: 24, fontWeight: 700, color: BAI.ink, margin: 0 }}>{kpi.value}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Historique paiements */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ArrowDownRight style={{ width: 16, height: 16, color: BAI.owner }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                  Historique des virements
                </p>
              </div>
              {payments.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <Building2 style={{ width: 32, height: 32, color: BAI.inkFaint, margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint }}>
                    {isActive
                      ? 'Aucun paiement enregistré. Les loyers SEPA apparaîtront ici.'
                      : 'Configurez votre compte pour commencer à recevoir les loyers automatiquement.'}
                  </p>
                </div>
              ) : (
                payments.map(p => <PaymentRow key={p.id} p={p} />)
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  )
}
