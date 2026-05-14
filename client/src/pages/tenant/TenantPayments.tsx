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

const cardStyle: React.CSSProperties = {
  background: BAI.bgSurface,
  border: `1px solid ${BAI.border}`,
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
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
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <p style={{
              fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, fontFamily: BAI.fontBody, fontWeight: 700, marginBottom: 6,
            }}>
              Mes loyers
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(28px,5vw,40px)', color: BAI.ink, lineHeight: 1.1, marginBottom: 8,
            }}>
              Paiements & Quittances
            </h1>
            <p style={{ fontSize: 14, color: BAI.inkMid }}>
              Coordonnées bancaires de votre bailleur pour vos virements mensuels
            </p>
          </div>

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
                      <p style={{ fontSize: 18, fontWeight: 700, color: BAI.ink, margin: 0, fontFamily: BAI.fontDisplay, fontStyle: 'italic' }}>
                        {formatEuro(totalRent)}
                      </p>
                      <p style={{ fontSize: 11, color: BAI.inkFaint, margin: '2px 0 0' }}>/ mois (charges incluses)</p>
                    </div>
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
                  <div style={{ ...cardStyle, background: '#fdf5ec', border: '1px solid #f3c99a' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} style={{ color: '#92400e', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 14, color: '#92400e', margin: 0 }}>
                        Votre bailleur n'a pas encore renseigné son IBAN. Contactez-le via la messagerie pour obtenir ses coordonnées bancaires.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
                  <Building2 size={36} style={{ color: BAI.border, margin: '0 auto 16px' }} />
                  <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 20, color: BAI.ink, marginBottom: 8 }}>
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
