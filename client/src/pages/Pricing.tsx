import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Info, Zap, ArrowRight, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import { PLANS, FEATURE_TABLE, FAQ_ITEMS, type PlanId } from '../config/pricing'

/* ─── FAQ Accordion ──────────────────────────────────────────────────────── */
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
        <ChevronDown
          style={{
            width: '18px', height: '18px', color: BAI.caramel, flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 20px', paddingRight: 32 }}
        >
          {a}
        </motion.p>
      )}
    </div>
  )
}

/* ─── Feature value cell ─────────────────────────────────────────────────── */
function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check style={{ width: 16, height: 16, color: '#16a34a', margin: '0 auto', display: 'block' }} />
  if (value === false) return <X style={{ width: 15, height: 15, color: BAI.inkFaint, margin: '0 auto', display: 'block' }} />
  return <span style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner }}>{value}</span>
}

/* ─── Pricing Page ───────────────────────────────────────────────────────── */
export default function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const handleCta = async (planId: PlanId) => {
    if (planId === 'free') {
      navigate('/register')
      return
    }

    const plan = PLANS.find(p => p.id === planId)!
    const priceId = plan.priceIds?.[billing]

    if (isAuthenticated && user?.role === 'TENANT') {
      toast.error('Les abonnements sont réservés aux propriétaires. En tant que locataire, l\'accès à la plateforme est gratuit.', { duration: 5000 })
      return
    }

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
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'Erreur inconnue'
      toast.error(`Erreur : ${msg}`, { duration: 6000 })
      console.error('[Pricing checkout]', err)
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
        @media (max-width: 640px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; margin-left: auto !important; margin-right: auto !important; }
          .feat-table { display: none !important; }
          .feat-table.open { display: block !important; }
          .feat-table-toggle { display: flex !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO DARK ── */}
      <section style={{
        background: '#0a0d1a',
        padding: 'clamp(72px, 10vw, 112px) 0 clamp(56px, 8vw, 96px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glows décoratifs */}
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(196,151,106,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', right: '10%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,26,46,0.6) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px, 5vw, 48px)', position: 'relative', zIndex: 1 }}>
          {/* Overline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 18px',
            }}
          >
            Tarifs
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.05,
              color: '#ffffff', margin: '0 0 18px',
            }}
          >
            Simple. Transparent.{' '}
            <em style={{ color: BAI.caramel }}>Sans surprise.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            style={{
              fontFamily: BAI.fontBody, fontSize: 16, color: 'rgba(255,255,255,0.60)',
              lineHeight: 1.65, maxWidth: '52ch', margin: '0 auto 40px',
            }}
          >
            Commencez gratuitement, évoluez quand vous êtes prêt.
          </motion.p>

          {/* Toggle mensuel/annuel — style glass pill sur fond dark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              padding: '4px',
            }}
          >
            {(['annual', 'monthly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '9px 24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                  background: billing === b ? '#ffffff' : 'transparent',
                  color: billing === b ? BAI.night : 'rgba(255,255,255,0.60)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.2s, color 0.2s',
                  minHeight: '40px',
                }}
              >
                {b === 'annual' ? 'Annuel' : 'Mensuel'}
                {b === 'annual' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: billing === 'annual' ? BAI.caramel : 'rgba(196,151,106,0.25)',
                    color: billing === 'annual' ? '#fff' : BAI.caramel,
                    padding: '2px 7px', borderRadius: '999px',
                    transition: 'background 0.2s, color 0.2s',
                  }}>
                    −20%
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PLANS GRID ── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="pricing-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, alignItems: 'start', maxWidth: 800, margin: '0 auto' }}
        >
          {PLANS.map((plan, i) => {
            const saving = getSaving(plan)
            const isHighlight = plan.highlight

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: i * 0.08, duration: 0.32 }}
                style={{
                  background: BAI.bgSurface,
                  border: isHighlight ? `2px solid ${BAI.caramel}` : `1px solid ${BAI.border}`,
                  borderRadius: '16px',
                  padding: isHighlight ? '32px 28px' : '28px 24px',
                  position: 'relative',
                  boxShadow: isHighlight
                    ? `0 0 0 4px rgba(196,151,106,0.10), 0 4px 24px rgba(196,151,106,0.14)`
                    : BAI.shadowMd,
                  transform: isHighlight ? 'scale(1.02)' : 'none',
                  zIndex: isHighlight ? 1 : 0,
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: BAI.caramel, color: '#fff',
                    fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '5px 16px', borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 4px' }}>
                    {plan.name}
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 20px', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>

                  {/* Prix */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                      fontSize: plan.monthlyPrice === 0 ? '36px' : '48px',
                      color: BAI.ink, lineHeight: 1,
                    }}>
                      {plan.monthlyPrice === 0 ? 'Gratuit' : `${getPrice(plan)} €`}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, marginBottom: 6 }}>
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
                    width: '100%', padding: '12px 0', borderRadius: '10px',
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    marginBottom: 20, minHeight: '44px',
                    border: plan.ctaStyle === 'primary' ? 'none' : `1px solid ${BAI.border}`,
                    background: plan.ctaStyle === 'primary'
                      ? (isHighlight ? BAI.caramel : BAI.night)
                      : 'transparent',
                    color: plan.ctaStyle === 'primary' ? '#fff' : BAI.inkMid,
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loadingPlan === plan.id ? 'Chargement...' : plan.cta}
                </button>

                {/* Essai gratuit */}
                {plan.trialDays && (
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, textAlign: 'center', margin: '-14px 0 16px' }}>
                    {plan.trialDays} jours gratuits, sans CB
                  </p>
                )}

                {/* Limite biens */}
                <div style={{ padding: '10px 14px', background: BAI.bgMuted, borderRadius: '8px', marginBottom: '16px' }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                    {plan.propertyLimit === null ? 'Biens illimités' : `${plan.propertyLimit} bien${plan.propertyLimit > 1 ? 's' : ''} maximum`}
                  </p>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check style={{ width: 14, height: 14, color: isHighlight ? BAI.caramel : BAI.inkMid, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Bannière Pro */}
        <div style={{
          marginTop: '28px', maxWidth: 800, margin: '28px auto 0',
          padding: '16px 24px',
          background: BAI.ownerLight,
          border: `1px solid ${BAI.ownerBorder}`,
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <Zap style={{ width: 18, height: 18, color: BAI.owner, flexShrink: 0 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, margin: 0, flex: 1 }}>
            <strong>Pro à 9,90 €/mois</strong> : biens illimités, bail ALUR, signature eIDAS, quittances auto, analyse IA. Tout inclus, sans surprise.
          </p>
          <button
            onClick={() => handleCta('pro')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: BAI.owner, color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '44px',
            }}
          >
            Commencer avec Pro <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </section>

      {/* Toggle tableau mobile */}
      <div className="feat-table-toggle" style={{ display: 'none', justifyContent: 'center', padding: '0 16px 24px' }}>
        <button
          onClick={() => setShowTable(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: '40px',
            background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
            fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 500,
            color: BAI.inkMid, cursor: 'pointer',
            boxShadow: BAI.shadowSm,
          }}
        >
          {showTable ? '↑ Masquer' : '↓ Voir la comparaison détaillée'}
        </button>
      </div>

      {/* ── TABLEAU DE COMPARAISON ── */}
      <section className={`feat-table${showTable ? ' open' : ''}`} style={{ padding: '0 clamp(16px, 5vw, 48px) 80px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, textAlign: 'center', marginBottom: 32 }}>
          Comparaison détaillée
        </h2>
        <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: `1px solid ${BAI.border}` }}>
            <div style={{ padding: '16px 20px' }} />
            {(['Gratuit', 'Pro'] as const).map((name) => (
              <div key={name} style={{
                padding: '16px 12px', textAlign: 'center',
                background: name === 'Pro' ? '#f0fdf4' : 'transparent',
                borderLeft: `1px solid ${BAI.border}`,
              }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>{name}</p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>
                  {name === 'Gratuit' ? 'Gratuit' : '9,90 €/mois'}
                </p>
              </div>
            ))}
          </div>
          {FEATURE_TABLE.map((row, idx) => (
            <div
              key={row.label}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
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
              {(['free', 'pro'] as const).map(planId => (
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
      <section style={{ padding: '0 clamp(16px, 5vw, 48px) 80px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, textAlign: 'center', marginBottom: 40 }}>
          Questions fréquentes
        </h2>
        {FAQ_ITEMS.map(item => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </section>

      {/* ── CTA FOOTER DARK ── */}
      <section style={{
        background: '#0a0d1a',
        padding: 'clamp(64px, 8vw, 96px) clamp(16px, 5vw, 48px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(196,151,106,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 18px',
          }}>
            Prêt à commencer ?
          </p>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', margin: '0 0 14px',
          }}>
            Gérez vos biens comme un professionnel.
          </h2>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 36px' }}>
            14 jours gratuits. Sans engagement. Sans carte bancaire.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCta('pro')}
              style={{
                padding: '14px 32px', borderRadius: '10px', border: 'none',
                background: BAI.caramel, color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', minHeight: '48px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = BAI.caramelHover)}
              onMouseLeave={e => (e.currentTarget.style.background = BAI.caramel)}
            >
              Commencer avec Pro, 9,90 €/mois
            </button>
            <Link
              to="/register"
              style={{
                padding: '14px 28px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'transparent', color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                minHeight: '48px',
              }}
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
