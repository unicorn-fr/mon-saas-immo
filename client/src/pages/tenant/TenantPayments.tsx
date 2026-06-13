import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import toast from 'react-hot-toast'
import {
  Building2,
  CreditCard,
  Copy,
  AlertCircle,
  Info,
  ArrowRight,
  Wallet,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveContract {
  id: string
  monthlyRent: number
  charges?: number
  startDate: string
  status: string
  property: { title: string; address: string }
  owner: {
    firstName: string
    lastName: string
    avatar?: string
    iban?: string | null
    bic?: string | null
    bankName?: string | null
    bankHolder?: string | null
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function getNextPaymentDate(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  padding: 24,
  boxShadow: BAI.shadowMd,
}

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
  const [contract, setContract] = useState<ActiveContract | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const res = await apiClient.get('/contracts')
        const contracts: ActiveContract[] = res.data.data ?? []
        const active = contracts.find(c =>
          ['ACTIVE', 'SIGNED_OWNER', 'SIGNED_TENANT', 'COMPLETED'].includes(c.status)
        )
        setContract(active ?? null)
      } catch {
        // silent — show empty state
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const owner = contract?.owner ?? null
  const totalRent = contract ? (contract.monthlyRent + (contract.charges ?? 0)) : 0

  return (
    <Layout>
      {/* ── Hero sombre ── */}
      <div style={{ background: '#0a0d1a', padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
          FINANCES
        </p>
        <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1 }}>
          Mon Portefeuille
        </h1>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          Coordonnées bancaires de votre bailleur pour vos virements mensuels
        </p>

        {/* KPI glass cards */}
        <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
          {/* Solde loyer */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            padding: '16px 24px',
            minWidth: 150,
          }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              LOYER MENSUEL
            </p>
            <p style={{ fontFamily: BAI.fontDisplay, fontSize: 42, fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
              {isLoading ? '—' : contract ? `${formatEuro(totalRent)}` : '—'}
            </p>
          </div>

          {/* Payé ce mois */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            padding: '16px 24px',
            minWidth: 150,
          }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              PAYÉ CE MOIS
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: isLoading ? 'rgba(255,255,255,0.5)' : contract ? '#4ade80' : 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
              {isLoading ? '…' : contract ? getCurrentMonthLabel() : 'Aucun contrat'}
            </p>
          </div>

          {/* Prochain loyer */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 16,
            padding: '16px 24px',
            minWidth: 150,
          }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              PROCHAIN LOYER
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: isLoading ? 'rgba(255,255,255,0.5)' : contract ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
              {isLoading ? '…' : contract ? `1er — ${getNextPaymentDate()}` : '—'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: BAI.bgBase, minHeight: '60vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: BAI.inkFaint }}>
              Chargement…
            </div>
          )}

          {!isLoading && (
            <div className="flex flex-col gap-6">

              {/* ── Info banner ──────────────────────────────────────────── */}
              <div style={{ background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, borderRadius: 12, padding: '14px 18px' }} className="flex items-start gap-3">
                <Info size={16} style={{ color: BAI.tenant, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: BAI.tenant, margin: 0, lineHeight: 1.6 }}>
                  Les paiements s'effectuent <strong>directement par virement bancaire</strong> au bailleur, sans passer par Bailio. Utilisez les coordonnées ci-dessous chaque mois à la date convenue dans votre bail.
                </p>
              </div>

              {/* ── Active contract info ──────────────────────────────────── */}
              {contract && (
                <div style={cardStyle}>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 size={16} style={{ color: BAI.inkMid }} />
                    <h2 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 20, color: BAI.ink, fontStyle: 'italic', margin: 0 }}>
                      Votre location
                    </h2>
                  </div>
                  <div style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '12px 16px' }} className="flex items-center justify-between gap-4">
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>{contract.property.title}</p>
                      <p style={{ fontSize: 12, color: BAI.inkFaint, margin: '2px 0 0' }}>{contract.property.address}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: BAI.ink, margin: 0, fontFamily: BAI.fontDisplay, fontStyle: 'italic' }}>
                        {formatEuro(totalRent)}
                      </p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>/ mois (charges incluses)</p>
                    </div>
                  </div>

                  {/* Quick status row */}
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 14 }}>
                    <div className="flex items-center gap-2" style={{ padding: '6px 12px', background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, borderRadius: 20 }}>
                      <CheckCircle2 size={12} style={{ color: BAI.tenant }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: BAI.tenant, fontFamily: BAI.fontBody }}>Bail actif</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ padding: '6px 12px', background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 20 }}>
                      <CalendarClock size={12} style={{ color: BAI.inkMid }} />
                      <span style={{ fontSize: 12, color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                        Depuis le {new Date(contract.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Payer maintenant CTA si contrat actif ────────────────── */}
              {contract && owner?.iban && (
                <div style={{ background: '#0a0d1a', borderRadius: 12, padding: '20px 24px' }}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wallet size={18} style={{ color: BAI.caramel }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                          Prochain virement
                        </p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>
                          {formatEuro(totalRent)} · dû le 1er du mois
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const iban = owner.iban!
                        navigator.clipboard.writeText(iban.replace(/\s/g, '')).then(() => toast.success('IBAN copié — collez dans votre application bancaire'))
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 9, border: 'none',
                        background: BAI.caramel, color: '#ffffff',
                        fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Payer maintenant <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Owner IBAN ────────────────────────────────────────────── */}
              {owner ? (
                owner.iban ? (
                  <div style={cardStyle}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} style={{ color: BAI.inkMid }} />
                      <h2 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 20, color: BAI.ink, fontStyle: 'italic', margin: 0 }}>
                        Coordonnées bancaires du bailleur
                      </h2>
                    </div>
                    <p style={{ fontSize: 13, color: BAI.inkMid, marginBottom: 20 }}>
                      Utilisez ces informations pour effectuer votre virement mensuel
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div className="min-w-0">
                          <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Bénéficiaire</p>
                          <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500 }}>
                            {owner.bankHolder || `${owner.firstName} ${owner.lastName}`}
                          </p>
                        </div>
                        <CopyButton value={owner.bankHolder || `${owner.firstName} ${owner.lastName}`} label="Nom" />
                      </div>

                      <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                        <div className="min-w-0">
                          <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>IBAN</p>
                          <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {formatIban(owner.iban)}
                          </p>
                        </div>
                        <CopyButton value={owner.iban.replace(/\s/g, '')} label="IBAN" />
                      </div>

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

                      {owner.bankName && (
                        <div className="flex items-center justify-between gap-4" style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div className="min-w-0">
                            <p style={{ fontSize: 11, color: BAI.inkFaint, marginBottom: 2 }}>Établissement</p>
                            <p style={{ fontSize: 14, color: BAI.ink, fontWeight: 500 }}>{owner.bankName}</p>
                          </div>
                          <CopyButton value={owner.bankName} label="Banque" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, background: BAI.warningLight, border: `1px solid ${BAI.caramelBorder}` }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} style={{ color: BAI.warning, flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 14, color: BAI.warning, margin: 0 }}>
                        Votre bailleur n'a pas encore renseigné son IBAN. Contactez-le via la messagerie pour obtenir ses coordonnées bancaires.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
                  <Building2 size={36} style={{ color: BAI.border, margin: '0 auto 16px' }} />
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.ink, marginBottom: 8 }}>
                    Aucun contrat actif
                  </p>
                  <p style={{ fontSize: 14, color: BAI.inkMid, margin: 0 }}>
                    Les coordonnées bancaires de votre bailleur apparaîtront ici une fois votre bail signé.
                  </p>
                </div>
              )}

              {/* ── Quittances tip ────────────────────────────────────────── */}
              <div style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '16px 20px' }} className="flex items-start gap-3">
                <ArrowRight size={15} style={{ color: BAI.inkFaint, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}>
                  Après chaque paiement, vous pouvez demander une <strong>quittance de loyer</strong> à votre bailleur directement via la messagerie. Il la génère depuis son espace Bailio et vous la transmet par email.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
