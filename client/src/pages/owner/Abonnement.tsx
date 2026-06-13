import { useState } from 'react'
import { Check, Star, Crown, ArrowRight, Loader2, X } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { usePlan } from '../../hooks/usePlan'
import { apiClient } from '../../services/api.service'
import { PLANS, FEATURE_TABLE, FAQ_ITEMS } from '../../config/pricing'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// Map DB plan enum → frontend plan id
function toPlanId(planEnum: string): 'free' | 'pro' {
  if (!planEnum || planEnum === 'FREE') return 'free'
  return 'pro' // SOLO, PRO, EXPERT → pro
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Star,
  pro: Crown,
}

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  free: { bg: BAI.bgMuted,    border: BAI.border,      text: BAI.inkMid },
  pro:  { bg: BAI.ownerLight, border: BAI.ownerBorder, text: BAI.owner  },
}

type BillingCycle = 'monthly' | 'annual'

export default function Abonnement() {
  const { plan: currentPlanEnum, status, loading } = usePlan()
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const currentPlanId = toPlanId(currentPlanEnum)
  const currentPlan = PLANS.find(p => p.id === currentPlanId) ?? PLANS[0]

  const handleUpgrade = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId)
    if (!plan?.priceIds) {
      toast.error('Plan non disponible.')
      return
    }
    setUpgrading(planId)
    try {
      const priceId = billing === 'annual' ? plan.priceIds.annual : plan.priceIds.monthly
      const res = await apiClient.post<{ url: string }>('/stripe/checkout', { priceId })
      window.location.href = res.data.url
    } catch {
      toast.error('Erreur lors de la redirection Stripe. Réessayez.')
    } finally {
      setUpgrading(null)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await apiClient.post<{ url: string }>('/stripe/portal')
      window.location.href = res.data.url
    } catch {
      toast.error('Impossible d\'ouvrir le portail de gestion.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bgBase }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: BAI.inkFaint }} />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div>

        {/* ── DARK HERO ── */}
        <div style={{
          background: '#0a0d1a',
          padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(32px,5vw,56px)',
        }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0,
          }}>COMPTE</p>
          <h1 style={{
            fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,42px)',
            fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: '6px 0 8px', lineHeight: 1.1,
          }}>Mon Abonnement</h1>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Passez au Pro à tout moment, sans engagement.
          </p>
          <div className="flex flex-wrap gap-3" style={{ marginTop: 28 }}>
            {/* Plan actuel en glass proéminent */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.13)', borderRadius: 16, padding: '20px 28px',
            }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>PLAN ACTUEL</p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, fontStyle: 'italic', color: '#ffffff', margin: 0, lineHeight: 1 }}>
                {currentPlan.name}
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: `1px solid ${status === 'ACTIVE' ? 'rgba(155,212,186,0.4)' : 'rgba(255,255,255,0.13)'}`,
              borderRadius: 16, padding: '20px 24px', minWidth: 130,
            }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>STATUT</p>
              <p style={{ fontFamily: BAI.fontDisplay, fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: status === 'ACTIVE' ? '#9fd4ba' : 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1 }}>
                {status === 'ACTIVE' ? 'Actif' : status === 'TRIALING' ? 'Essai' : 'Gratuit'}
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENU LIGHT ── */}
        <div style={{ background: BAI.bgBase, padding: '40px 0 80px', fontFamily: BAI.fontBody }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* ── Plan actuel ── */}
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            borderRadius: 16, padding: '20px 24px', marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
            boxShadow: BAI.shadowMd,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {(() => {
                const colors = PLAN_COLORS[currentPlanId]
                const Icon = PLAN_ICONS[currentPlanId] ?? Star
                return (
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 20, height: 20, color: colors.text }} />
                  </div>
                )
              })()}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: BAI.ink }}>
                    Plan {currentPlan.name}
                  </p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: status === 'ACTIVE' ? '#edf7f2' : status === 'TRIALING' ? BAI.caramelLight : '#fef2f2',
                    color: status === 'ACTIVE' ? BAI.tenant : status === 'TRIALING' ? BAI.caramel : '#9b1c1c',
                    border: `1px solid ${status === 'ACTIVE' ? '#9fd4ba' : status === 'TRIALING' ? BAI.caramel + '40' : '#fca5a5'}`,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {status === 'ACTIVE' ? 'Actif' : status === 'TRIALING' ? 'Essai' : status ?? 'Gratuit'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: BAI.inkMid }}>
                  {currentPlan.monthlyPrice === 0
                    ? 'Gratuit — mise en ligne uniquement'
                    : `${currentPlan.monthlyPrice.toFixed(2).replace('.', ',')} €/mois · Tout inclus`}
                </p>
              </div>
            </div>

            {currentPlanId !== 'free' && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                style={{
                  padding: '9px 18px', borderRadius: 9, border: `1px solid ${BAI.border}`,
                  background: BAI.bgSurface, color: BAI.inkMid,
                  fontSize: 13, fontWeight: 500, cursor: portalLoading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {portalLoading ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> : null}
                Gérer la facturation
              </button>
            )}
          </div>

          {/* ── Toggle mensuel / annuel ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', background: BAI.bgMuted, borderRadius: 10, padding: 4, gap: 4, border: `1px solid ${BAI.border}` }}>
              {(['monthly', 'annual'] as BillingCycle[]).map(cycle => (
                <button
                  key={cycle}
                  onClick={() => setBilling(cycle)}
                  style={{
                    padding: '7px 18px', borderRadius: 8, border: 'none',
                    background: billing === cycle ? BAI.bgSurface : 'transparent',
                    color: billing === cycle ? BAI.ink : BAI.inkMid,
                    fontSize: 13, fontWeight: billing === cycle ? 600 : 400,
                    cursor: 'pointer', boxShadow: billing === cycle ? BAI.shadowSm : 'none',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  {cycle === 'annual' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: BAI.tenantLight, color: BAI.tenant, border: `1px solid ${BAI.tenantBorder}` }}>
                      −2 mois
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── 2 cartes plans côte à côte ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20, marginBottom: 48 }}>
            {PLANS.map(plan => {
              const isCurrent = currentPlanId === plan.id
              const isUpgrade = plan.id === 'pro' && currentPlanId === 'free'
              const isDowngrade = plan.id === 'free' && currentPlanId === 'pro'
              const Icon = PLAN_ICONS[plan.id] ?? Star
              const colors = PLAN_COLORS[plan.id]
              const price = billing === 'annual' ? plan.annualMonthlyEquiv : plan.monthlyPrice
              const isLoading = upgrading === plan.id

              return (
                <div
                  key={plan.id}
                  style={{
                    background: BAI.bgSurface,
                    border: `2px solid ${plan.highlight ? BAI.owner : isCurrent ? BAI.caramel : BAI.border}`,
                    borderRadius: 20,
                    padding: '28px 24px',
                    position: 'relative',
                    opacity: isDowngrade ? 0.55 : 1,
                    boxShadow: plan.highlight ? `0 6px 32px rgba(26,50,112,0.14)` : BAI.shadowMd,
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {plan.badge && !isCurrent && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: BAI.owner, color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                      letterSpacing: '0.06em',
                    }}>
                      {plan.badge}
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: BAI.caramel, color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      Plan actuel
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 18, height: 18, color: colors.text }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: BAI.ink }}>{plan.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: BAI.inkFaint }}>{plan.propertyLimit === null ? 'Biens illimités' : `${plan.propertyLimit} bien`}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    {plan.monthlyPrice === 0 ? (
                      <p style={{ margin: 0, fontFamily: BAI.fontDisplay, fontSize: 32, fontWeight: 700, color: BAI.ink }}>Gratuit</p>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontFamily: BAI.fontDisplay, fontSize: 36, fontWeight: 700, color: BAI.ink }}>
                            {price.toFixed(2).replace('.', ',')} €
                          </span>
                          <span style={{ fontSize: 13, color: BAI.inkFaint }}>/mois HT</span>
                        </div>
                        {billing === 'annual' && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: BAI.tenant }}>
                            Facturé {plan.annualPrice.toFixed(0)} €/an — économisez 2 mois
                          </p>
                        )}
                      </>
                    )}
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: BAI.inkMid, lineHeight: 1.5 }}>{plan.description}</p>
                  </div>

                  <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                        <Check style={{ width: 14, height: 14, color: BAI.tenant, marginTop: 2, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div style={{ padding: '10px', borderRadius: 10, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, color: BAI.inkFaint, fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                      Plan actuel
                    </div>
                  ) : isUpgrade ? (
                    <>
                      <button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={!!upgrading}
                        style={{
                          padding: '12px', borderRadius: 10, border: 'none',
                          background: BAI.owner, color: '#fff',
                          fontSize: 14, fontWeight: 700,
                          cursor: upgrading ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: upgrading && !isLoading ? 0.5 : 1,
                        }}
                      >
                        {isLoading
                          ? <><Loader2 className="animate-spin" style={{ width: 14, height: 14 }} /> Chargement…</>
                          : <>{plan.cta} <ArrowRight style={{ width: 14, height: 14 }} /></>
                        }
                      </button>
                      {plan.trialDays && (
                        <p style={{ margin: '8px 0 0', fontSize: 11, color: BAI.inkFaint, textAlign: 'center' }}>
                          {plan.trialDays} jours gratuits · sans carte bancaire
                        </p>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '10px', borderRadius: 10, border: `1px solid ${BAI.border}`, color: BAI.inkFaint, fontSize: 12, fontWeight: 400, textAlign: 'center' }}>
                      Plan actuel plus avancé
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Tableau comparatif ── */}
          <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: BAI.shadowMd, marginBottom: 48 }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BAI.border}` }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: BAI.ink }}>Comparatif des fonctionnalités</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: BAI.fontBody }}>
                <thead>
                  <tr style={{ background: BAI.bgMuted }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: BAI.inkMid, borderBottom: `1px solid ${BAI.border}` }}>Fonctionnalité</th>
                    {PLANS.map(p => (
                      <th key={p.id} style={{
                        padding: '10px 20px', textAlign: 'center', fontSize: 11, fontWeight: 700, minWidth: 120,
                        color: currentPlanId === p.id ? BAI.caramel : BAI.inkMid,
                        borderBottom: `1px solid ${BAI.border}`,
                        borderLeft: `1px solid ${BAI.border}`,
                      }}>
                        {p.name}
                        {currentPlanId === p.id && (
                          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: BAI.caramel }}>ACTUEL</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_TABLE.map((row, i) => (
                    <tr key={row.label} style={{ background: i % 2 === 0 ? BAI.bgSurface : BAI.bgBase }}>
                      <td style={{ padding: '10px 20px', color: BAI.inkMid, borderBottom: `1px solid ${BAI.border}` }}>
                        {row.label}
                        {row.tooltip && (
                          <span title={row.tooltip} style={{ marginLeft: 5, fontSize: 10, color: BAI.inkFaint, cursor: 'help' }}>ⓘ</span>
                        )}
                      </td>
                      {(['free', 'pro'] as const).map(pid => {
                        const val = row[pid]
                        const isCur = currentPlanId === pid
                        return (
                          <td key={pid} style={{
                            padding: '10px 20px', textAlign: 'center',
                            borderBottom: `1px solid ${BAI.border}`,
                            borderLeft: `1px solid ${BAI.border}`,
                            background: isCur ? `${BAI.caramel}08` : undefined,
                          }}>
                            {val === false ? (
                              <X style={{ width: 13, height: 13, color: BAI.border, margin: '0 auto' }} />
                            ) : val === true ? (
                              <Check style={{ width: 14, height: 14, color: BAI.tenant, margin: '0 auto' }} />
                            ) : (
                              <span style={{ fontSize: 12, color: isCur ? BAI.ink : BAI.inkMid, fontWeight: isCur ? 600 : 400 }}>{val}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>Questions fréquentes</p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, margin: '0 0 24px' }}>
              Tout savoir sur les plans
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, fontFamily: BAI.fontBody }}>{item.q}</span>
                    <span style={{ fontSize: 18, color: BAI.inkFaint, flexShrink: 0, lineHeight: 1 }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 18px 16px' }}>
                      <p style={{ margin: 0, fontSize: 13, color: BAI.inkMid, lineHeight: 1.7, fontFamily: BAI.fontBody }}>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>{/* end inner max-w */}
        </div>{/* end contenu light */}
      </div>{/* end root */}
    </Layout>
  )
}
