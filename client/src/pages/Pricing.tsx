import { useState } from 'react'
import { Check, X, Info, Zap, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import { PLANS, FEATURE_TABLE, FAQ_ITEMS, type PlanId } from '../config/pricing'

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ borderBottom: `1px solid ${BAI.border}`, cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', gap: 16 }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: BAI.ink, margin: 0, flex: 1 }}>
          {q}
        </p>
        <span style={{ color: BAI.caramel, fontSize: 22, fontWeight: 300, lineHeight: 1, flexShrink: 0 }}>
          {open ? '−' : '+'}
        </span>
      </div>
      {open && (
        <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 20px', paddingRight: 32 }}>
          {a}
        </p>
      )}
    </div>
  )
}

// ─── Feature value cell ───────────────────────────────────────────────────────
function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check style={{ width: 16, height: 16, color: '#16a34a', margin: '0 auto', display: 'block' }} />
  if (value === false) return <X style={{ width: 15, height: 15, color: BAI.inkFaint, margin: '0 auto', display: 'block' }} />
  return <span style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner }}>{value}</span>
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────
export default function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual') // annuel par défaut
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCta = async (planId: PlanId) => {
    if (planId === 'free') {
      navigate('/register')
      return
    }

    const plan = PLANS.find(p => p.id === planId)!
    const priceId = plan.priceIds?.[billing]

    if (!isAuthenticated) {
      navigate(`/register?plan=${planId}&billing=${billing}`)
      return
    }

    if (!priceId) {
      toast.error('Ce plan n\'est pas encore disponible. Revenez dans quelques jours.')
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await apiClient.post<{ url: string }>('/stripe/checkout', { priceId })
      window.location.href = res.data.url
    } catch {
      toast.error('Une erreur est survenue. Réessaie dans un instant.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const getPrice = (plan: typeof PLANS[number]) => {
    if (plan.monthlyPrice === 0) return '0'
    return billing === 'annual'
      ? plan.annualMonthlyEquiv.toFixed(2).replace('.', ',')
      : plan.monthlyPrice.toFixed(2).replace('.', ',')
  }

  const getSaving = (plan: typeof PLANS[number]) => {
    if (plan.monthlyPrice === 0) return null
    const saving = plan.monthlyPrice * 12 - plan.annualPrice
    return saving > 0 ? saving.toFixed(0) : null
  }

  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @media (max-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin-left: auto !important; margin-right: auto !important; }
          .feat-table { display: none !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ padding: '72px 0 56px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 16px' }}>
            Tarifs
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.05, color: BAI.ink, margin: '0 0 18px' }}>
            Simple, transparent.{' '}
            <em style={{ color: BAI.caramel }}>Sans surprise.</em>
          </h1>
          <p style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.65, maxWidth: '52ch', margin: '0 auto 36px' }}>
            Commence gratuitement. Essai 14 jours sans carte bancaire pour tous les plans payants.
          </p>

          {/* Toggle annuel / mensuel */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 999, padding: '4px' }}>
            {(['annual', 'monthly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '8px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                  background: billing === b ? BAI.night : 'transparent',
                  color: billing === b ? '#fff' : BAI.inkMid,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {b === 'annual' ? 'Annuel' : 'Mensuel'}
                {b === 'annual' && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#16a34a', color: '#fff', padding: '2px 7px', borderRadius: 999 }}>
                    2 mois offerts
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS GRID ── */}
      <section style={{ padding: '0 clamp(16px,5vw,48px) 64px', maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="pricing-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}
        >
          {PLANS.map(plan => {
            const saving = getSaving(plan)
            const isHighlight = plan.highlight
            const isDimmed = plan.dimmed

            return (
              <div
                key={plan.id}
                style={{
                  background: BAI.bgSurface,
                  border: isHighlight
                    ? '2px solid #16a34a'
                    : isDimmed
                    ? `1px dashed ${BAI.border}`
                    : `1px solid ${BAI.border}`,
                  borderRadius: 16,
                  padding: '28px 24px 24px',
                  position: 'relative',
                  opacity: isDimmed ? 0.88 : 1,
                  boxShadow: isHighlight
                    ? '0 4px 24px rgba(22,163,74,0.12), 0 1px 4px rgba(13,12,10,0.06)'
                    : '0 1px 3px rgba(13,12,10,0.04)',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* Badge meilleur rapport */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#16a34a', color: '#fff',
                    fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                    padding: '5px 14px', borderRadius: 999, whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Header plan */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: isDimmed ? BAI.inkMid : BAI.ink, margin: '0 0 4px' }}>
                    {plan.name}
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 16px', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>

                  {/* Prix */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: BAI.fontDisplay, fontSize: plan.monthlyPrice === 0 ? 32 : 36, fontWeight: 700, color: BAI.ink, lineHeight: 1 }}>
                      {plan.monthlyPrice === 0 ? 'Gratuit' : `${getPrice(plan)} €`}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, marginBottom: 4 }}>
                        /mois
                      </span>
                    )}
                  </div>
                  {billing === 'annual' && plan.monthlyPrice > 0 && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, margin: '0 0 2px' }}>
                      Facturé {plan.annualPrice} €/an
                    </p>
                  )}
                  {billing === 'annual' && saving && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: '#16a34a', margin: 0 }}>
                      Économie : {saving} €/an
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan.id)}
                  disabled={loadingPlan === plan.id}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 10,
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    marginBottom: 20,
                    border: plan.ctaStyle === 'primary' ? 'none'
                      : plan.ctaStyle === 'ghost' ? `1px solid ${BAI.border}`
                      : `1px solid ${BAI.border}`,
                    background: plan.ctaStyle === 'primary' ? BAI.owner
                      : 'transparent',
                    color: plan.ctaStyle === 'primary' ? '#fff' : BAI.inkMid,
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                  }}
                >
                  {loadingPlan === plan.id ? 'Chargement...' : plan.cta}
                </button>

                {/* Essai gratuit */}
                {plan.trialDays && (
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, textAlign: 'center', margin: '-14px 0 16px' }}>
                    {plan.trialDays} jours gratuits — sans CB
                  </p>
                )}

                {/* Limite biens + SEPA */}
                <div style={{ padding: '10px 12px', background: BAI.bgMuted, borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink, margin: '0 0 2px' }}>
                    {plan.propertyLimit === null ? 'Biens illimités' : `${plan.propertyLimit} bien${plan.propertyLimit > 1 ? 's' : ''} maximum`}
                  </p>
                  {plan.sepaRatePct ? (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, margin: 0 }}>
                      SEPA loyers automatiques ({plan.sepaRatePct} commission)
                    </p>
                  ) : (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
                      Pas de paiement SEPA
                    </p>
                  )}
                </div>

                {/* Features list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 14, height: 14, color: isHighlight ? '#16a34a' : BAI.inkMid, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* ── Ligne de déclenchement Solo→Pro ── */}
        <div style={{
          marginTop: 24,
          padding: '16px 24px',
          background: BAI.ownerLight,
          border: `1px solid ${BAI.ownerBorder}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <Zap style={{ width: 18, height: 18, color: BAI.owner, flexShrink: 0 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, margin: 0, flex: 1 }}>
            <strong>Pro vs Solo :</strong> pour 5 € de plus par mois — 5 biens au lieu d'1, SEPA automatique, analyse IA et analytics.
            {' '}
            <span style={{ color: BAI.inkMid }}>Le Solo est pensé pour 1 bien et 0 automatisation SEPA.</span>
          </p>
          <button
            onClick={() => handleCta('pro')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: BAI.owner, color: '#fff', fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Commencer avec Pro <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </section>

      {/* ── TABLEAU DE COMPARAISON ── */}
      <section className="feat-table" style={{ padding: '0 clamp(16px,5vw,48px) 80px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, textAlign: 'center', marginBottom: 32 }}>
          Comparaison détaillée
        </h2>
        <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: `1px solid ${BAI.border}` }}>
            <div style={{ padding: '16px 20px' }} />
            {(['Gratuit', 'Solo', 'Pro', 'Expert'] as const).map((name, i) => (
              <div key={name} style={{
                padding: '16px 12px', textAlign: 'center',
                background: name === 'Pro' ? '#f0fdf4' : 'transparent',
                borderLeft: `1px solid ${BAI.border}`,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>{name}</p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
                  {[0, 4.90, 9.90, 24.90][i] === 0 ? 'Gratuit' : `${[0, 4.90, 9.90, 24.90][i].toFixed(2).replace('.', ',')} €/mois`}
                </p>
              </div>
            ))}
          </div>
          {/* Rows */}
          {FEATURE_TABLE.map((row, idx) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: idx < FEATURE_TABLE.length - 1 ? `1px solid ${BAI.border}` : 'none',
                background: idx % 2 === 0 ? BAI.bgSurface : BAI.bgBase,
              }}
            >
              <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink }}>{row.label}</span>
                {row.tooltip && (
                  <span title={row.tooltip} style={{ cursor: 'help', display: 'flex' }}>
                    <Info style={{ width: 13, height: 13, color: BAI.inkFaint }} />
                  </span>
                )}
              </div>
              {(['free', 'solo', 'pro', 'expert'] as const).map(planId => (
                <div key={planId} style={{
                  padding: '12px 12px', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderLeft: `1px solid ${BAI.border}`,
                  background: planId === 'pro' ? '#f0fdf4' : 'transparent',
                }}>
                  <FeatureCell value={row[planId]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 clamp(16px,5vw,48px) 96px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, textAlign: 'center', marginBottom: 40 }}>
          Questions fréquentes
        </h2>
        {FAQ_ITEMS.map(item => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '64px clamp(16px,5vw,48px) 96px', textAlign: 'center', background: BAI.night }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 16px' }}>
          Prêt à commencer ?
        </p>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', color: '#fff', margin: '0 0 12px' }}>
          Gérez vos biens comme un professionnel.
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px' }}>
          14 jours gratuits. Sans engagement. Sans carte bancaire.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCta('pro')}
            style={{ padding: '13px 32px', borderRadius: 10, border: 'none', background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Commencer avec Pro — 9,90 €/mois
          </button>
          <Link
            to="/register"
            style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
