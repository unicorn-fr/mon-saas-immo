import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle, AlertCircle, Clock, ExternalLink,
  ArrowDownRight, RefreshCw, Building2, Banknote,
  TrendingUp, ShieldCheck, Zap,
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
      padding: '16px 22px', borderBottom: `1px solid ${BAI.border}`,
      gap: 12, transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
            {MONTHS[p.periodMonth - 1]} {p.periodYear}
          </span>
          <span style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            color: statusColors[p.status] ?? BAI.inkMid,
            background: p.status === 'SUCCEEDED' ? '#f0fdf4' : BAI.bgMuted,
            padding: '2px 8px', borderRadius: 99,
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
        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, color: BAI.ink, margin: 0 }}>
          {formatEuro(netCents)}
        </p>
        {p.platformFeeCents ? (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
            -{formatEuro(p.platformFeeCents)} comm.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function AccountCard({ status, summary, onOnboard, onDashboard, onboarding, dashboardLoading, requirements }: {
  status: ConnectStatus | null
  summary: WalletSummary | null
  onOnboard: () => void
  onDashboard: () => void
  onboarding: boolean
  dashboardLoading: boolean
  requirements: string[]
}) {
  const isActive = status?.status === 'active'
  const isPending = status?.status === 'pending'
  const isRestricted = status?.status === 'restricted'
  const notCreated = !status || status.status === 'not_created'

  return (
    <div style={{
      background: BAI.night, borderRadius: 20, padding: 'clamp(24px,4vw,36px)',
      marginBottom: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Motif décoratif subtil */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(196,151,106,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(196,151,106,0.04)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* En-tête carte */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote style={{ width: 20, height: 20, color: BAI.caramel }} />
            </div>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Compte Bailio
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Bailleur · Revenus locatifs
              </p>
            </div>
          </div>

          {/* Badge statut */}
          {isActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <ShieldCheck style={{ width: 13, height: 13 }} /> Compte actif
            </span>
          )}
          {isPending && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <Clock style={{ width: 13, height: 13 }} /> Vérification en cours
            </span>
          )}
          {isRestricted && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(155,28,28,0.15)', border: '1px solid rgba(155,28,28,0.3)', color: '#f87171', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <AlertCircle style={{ width: 13, height: 13 }} /> Infos manquantes
            </span>
          )}
          {notCreated && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600 }}>
              <Clock style={{ width: 13, height: 13 }} /> Non configuré
            </span>
          )}
        </div>

        {/* Solde / Chiffre clé */}
        {isActive && summary ? (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Total collecté
            </p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(36px,6vw,52px)', fontWeight: 700, fontStyle: 'italic', color: BAI.caramel, margin: 0, lineHeight: 1.1 }}>
              {formatEuro(summary.totalReceivedCents)}
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>
              {summary.totalCount} paiement{summary.totalCount > 1 ? 's' : ''} reçu{summary.totalCount > 1 ? 's' : ''}
              {summary.pendingCount > 0 && ` · ${summary.pendingCount} en attente`}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 460 }}>
              {notCreated
                ? 'Reliez votre compte bancaire pour recevoir les loyers automatiquement. Vérification d\'identité ~5 min, aucune carte requise.'
                : isPending
                ? 'Votre vérification d\'identité est en cours. Délai habituel : 1 à 3 jours ouvrables. Vous serez notifié par email.'
                : 'Des informations supplémentaires sont requises pour activer les paiements.'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isActive ? (
            <button
              onClick={onDashboard}
              disabled={dashboardLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(196,151,106,0.4)', background: 'rgba(196,151,106,0.1)', color: BAI.caramel, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {dashboardLoading ? <RefreshCw style={{ width: 14, height: 14 }} /> : <ExternalLink style={{ width: 14, height: 14 }} />}
              Tableau de bord Stripe
            </button>
          ) : (
            <button
              onClick={onOnboard}
              disabled={onboarding}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, border: 'none', background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {onboarding ? <RefreshCw style={{ width: 14, height: 14 }} /> : <Zap style={{ width: 14, height: 14 }} />}
              {notCreated ? 'Configurer mon compte' : 'Compléter la configuration'}
            </button>
          )}
        </div>

        {/* Infos manquantes */}
        {requirements.length > 0 && (
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(155,28,28,0.12)', border: '1px solid rgba(155,28,28,0.25)', borderRadius: 10 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: '#f87171', margin: '0 0 6px' }}>
              Informations requises :
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
              {requirements.slice(0, 5).map(r => (
                <li key={r} style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(248,113,113,0.8)' }}>{getRequirementLabel(r)}</li>
              ))}
            </ul>
          </div>
        )}
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
    if (connectParam === 'success') toast.success('Compte de virement configuré avec succès !')
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
            Recevez les loyers directement sur votre compte bancaire via Stripe Connect.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${BAI.border}`, borderTopColor: BAI.owner, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Carte compte Bailio */}
            <AccountCard
              status={connectStatus}
              summary={summary}
              onOnboard={handleOnboard}
              onDashboard={handleDashboard}
              onboarding={onboarding}
              dashboardLoading={dashboardLink}
              requirements={connectStatus?.requirements ?? []}
            />

            {/* KPIs */}
            {summary && isActive && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Total reçu', value: formatEuro(summary.totalReceivedCents), icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'Paiements réussis', value: `${summary.totalCount}`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'En attente', value: `${summary.pendingCount}`, icon: Clock, color: BAI.inkMid, bg: BAI.bgMuted, border: BAI.border },
                  { label: 'Échecs', value: `${summary.failedCount}`, icon: AlertCircle, color: BAI.error, bg: BAI.errorLight, border: '#fca5a5' },
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
            )}

            {/* Historique paiements */}
            <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: BAI.ownerLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowDownRight style={{ width: 15, height: 15, color: BAI.owner }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                    Historique des virements
                  </p>
                </div>
                {payments.length > 0 && (
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{payments.length} transaction{payments.length > 1 ? 's' : ''}</span>
                )}
              </div>
              {payments.length === 0 ? (
                <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Building2 style={{ width: 24, height: 24, color: BAI.inkFaint }} />
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 4px', fontWeight: 600 }}>
                    {isActive ? 'Aucun virement enregistré' : 'Compte non configuré'}
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                    {isActive
                      ? 'Les loyers collectés via SEPA apparaîtront ici dès le premier prélèvement.'
                      : 'Configurez votre compte Bailio pour recevoir les loyers automatiquement.'}
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
