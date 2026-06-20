import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Info, ArrowRight, ChevronDown, TrendingUp, Calculator } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import { PLANS, FEATURE_TABLE, FAQ_ITEMS, type PlanId } from '../config/pricing'

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ borderBottom: `1px solid ${BAI.border}`, cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', gap: 16 }}>
        <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 17, color: BAI.ink, margin: 0, flex: 1 }}>
          {q}
        </p>
        <ChevronDown size={16} color={BAI.caramel} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 18px', paddingRight: 32 }}
        >
          {a}
        </motion.p>
      )}
    </div>
  )
}

// ─── Feature cell ─────────────────────────────────────────────────────────────
function FeatureCell({ value, isHighlight }: { value: boolean | string; isHighlight?: boolean }) {
  if (value === true)  return <Check size={15} color={isHighlight ? BAI.caramel : '#16a34a'} style={{ margin: '0 auto', display: 'block' }} />
  if (value === false) return <X size={14} color={BAI.inkFaint} style={{ margin: '0 auto', display: 'block' }} />
  return <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: isHighlight ? BAI.caramel : BAI.owner, textAlign: 'center', display: 'block' }}>{value}</span>
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────
function RoiCalculator() {
  const [rent, setRent] = useState(900)
  const agencyFee = Math.round(rent * 1)         // ~1 mois de loyer (hypothèse basse)
  const agencyFeeHigh = Math.round(rent * 1.5)   // jusqu'à 1,5 mois
  const proYear = 9.90 * 12                       // 118,80€/an
  const roi = Math.round(((agencyFee - proYear) / proYear) * 100)

  return (
    <div style={{
      background: BAI.bgSurface,
      border: `1px solid ${BAI.border}`,
      borderRadius: 16,
      padding: 'clamp(24px,4vw,40px)',
      maxWidth: 640,
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: BAI.caramelLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Calculator size={18} color={BAI.caramel} />
        </div>
        <div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
            Calculateur ROI
          </p>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: BAI.ink, margin: 0 }}>
            Combien vous économisez vs une agence ?
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span>Votre loyer mensuel</span>
          <span style={{ color: BAI.caramel }}>{rent} €/mois</span>
        </label>
        <input
          type="range" min={300} max={3000} step={50} value={rent}
          onChange={e => setRent(Number(e.target.value))}
          style={{ width: '100%', accentColor: BAI.caramel, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>300 €</span>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>3 000 €</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{ background: BAI.bgMuted, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: '0 0 4px' }}>
            {agencyFee} – {agencyFeeHigh} €
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, margin: 0, lineHeight: 1.4 }}>
            Frais d'agence évités (1 mise en location)
          </p>
        </div>
        <div style={{ background: BAI.caramelLight, border: `1px solid rgba(196,151,106,0.25)`, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.caramel, margin: '0 0 4px' }}>
            {proYear.toFixed(0)} €
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.caramel, margin: 0, lineHeight: 1.4 }}>
            Bailio Pro / an
          </p>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: '#15803d', margin: '0 0 4px' }}>
            {roi > 0 ? `+${roi}` : roi} %
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: '#15803d', margin: 0, lineHeight: 1.4 }}>
            ROI dès la 1ère location
          </p>
        </div>
      </div>

      <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '16px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
        Calcul basé sur 1 à 1,5 mois de loyer pour les frais d'agence (locataire) selon la loi ALUR.
        Hors frais propriétaire (agence de gestion : 7 – 10 %/an).
      </p>
    </div>
  )
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────
export default function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
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
      toast.error('Les abonnements sont réservés aux propriétaires.', { duration: 5000 })
      return
    }

    if (!isAuthenticated) {
      navigate(`/register?plan=${planId}&billing=${billing}`)
      return
    }

    if (!priceId) {
      toast.error('Ce plan n\'est pas encore disponible. Revenez bientôt.')
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

  // Colonnes pour la table de comparaison
  const PLAN_IDS: PlanId[] = ['free', 'solo', 'pro', 'expert']
  const PLAN_NAMES = { free: 'Gratuit', solo: 'Solo', pro: 'Pro', expert: 'Expert' }

  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin-left: auto !important; margin-right: auto !important; }
        }
        @media (max-width: 768px) {
          .compare-table { display: none; }
        }
      `}</style>

      <Header />

      {/* ── HERO DARK ─────────────────────────────────────────────────────── */}
      <section style={{
        background: '#0a0d1a',
        padding: 'clamp(64px,9vw,104px) 0 clamp(48px,7vw,80px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(196,151,106,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 1 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 16px' }}
          >
            Tarifs
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.07 }}
            style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(34px,5vw,58px)', lineHeight: 1.05, color: '#ffffff', margin: '0 0 16px' }}
          >
            Simple. Transparent.{' '}
            <em style={{ color: BAI.caramel }}>Sans surprise.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.13 }}
            style={{ fontFamily: BAI.fontBody, fontSize: 15, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, maxWidth: '50ch', margin: '0 auto 36px' }}
          >
            Commencez gratuitement, évoluez quand vous êtes prêt.
            Zéro engagement, annulez à tout moment.
          </motion.p>

          {/* Toggle mensuel / annuel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, delay: 0.18 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px', padding: '4px',
            }}
          >
            {(['annual', 'monthly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '9px 22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                  background: billing === b ? '#ffffff' : 'transparent',
                  color: billing === b ? BAI.night : 'rgba(255,255,255,0.58)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.18s, color 0.18s', minHeight: 40,
                }}
              >
                {b === 'annual' ? 'Annuel' : 'Mensuel'}
                {b === 'annual' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: billing === 'annual' ? BAI.caramel : 'rgba(196,151,106,0.22)',
                    color: billing === 'annual' ? '#fff' : BAI.caramel,
                    padding: '2px 7px', borderRadius: '999px',
                    transition: 'background 0.18s, color 0.18s',
                  }}>
                    −20%
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PLANS GRID ────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px,5vw,64px) clamp(16px,5vw,40px)', maxWidth: 1260, margin: '0 auto' }}>
        <div
          className="pricing-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}
        >
          {PLANS.map((plan, i) => {
            const saving = getSaving(plan)
            const isHL = plan.highlight
            const price = getPrice(plan)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-16px' }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                style={{
                  background: BAI.bgSurface,
                  border: isHL ? `2px solid ${BAI.caramel}` : `1px solid ${BAI.border}`,
                  borderRadius: 16,
                  padding: isHL ? '28px 22px 24px' : '24px 20px',
                  position: 'relative',
                  boxShadow: isHL
                    ? `0 0 0 4px rgba(196,151,106,0.09), 0 6px 28px rgba(196,151,106,0.16)`
                    : BAI.shadowMd,
                  transform: isHL ? 'translateY(-8px)' : 'none',
                  zIndex: isHL ? 1 : 0,
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: BAI.caramel, color: '#fff',
                    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    padding: '4px 14px', borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Nom + description */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.color, flexShrink: 0 }} />
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: 0 }}>
                      {plan.name}
                    </p>
                  </div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0, lineHeight: 1.45 }}>
                    {plan.description}
                  </p>
                </div>

                {/* Prix */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{
                      fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                      fontSize: plan.monthlyPrice === 0 ? 28 : 36,
                      color: isHL ? BAI.caramel : BAI.ink, lineHeight: 1,
                    }}>
                      {plan.monthlyPrice === 0 ? 'Gratuit' : `${price} €`}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginBottom: 4 }}>
                        /mois
                      </span>
                    )}
                  </div>
                  {billing === 'annual' && plan.monthlyPrice > 0 && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: BAI.inkMid, margin: '3px 0 0' }}>
                      Facturé {plan.annualPrice} €/an
                    </p>
                  )}
                  {billing === 'annual' && saving && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 600, color: '#16a34a', margin: '2px 0 0' }}>
                      Économie {saving} €/an
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan.id)}
                  disabled={loadingPlan === plan.id}
                  style={{
                    width: '100%', padding: '11px 0', borderRadius: 9,
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    marginBottom: 16, minHeight: 42,
                    border: plan.ctaStyle === 'ghost'
                      ? `1px solid ${BAI.border}`
                      : plan.ctaStyle === 'secondary'
                        ? `1px solid ${BAI.night}`
                        : 'none',
                    background: plan.ctaStyle === 'primary'
                      ? BAI.caramel
                      : plan.ctaStyle === 'secondary'
                        ? 'transparent'
                        : 'transparent',
                    color: plan.ctaStyle === 'primary' ? '#fff' : BAI.ink,
                    opacity: loadingPlan === plan.id ? 0.7 : 1,
                    transition: 'opacity 0.15s, background 0.15s',
                  }}
                >
                  {loadingPlan === plan.id ? 'Chargement…' : plan.cta}
                </button>

                {plan.trialDays && (
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: BAI.inkFaint, textAlign: 'center', margin: '-10px 0 14px' }}>
                    {plan.trialDays} jours gratuits, sans CB
                  </p>
                )}

                {/* Limite biens */}
                <div style={{ padding: '8px 12px', background: BAI.bgMuted, borderRadius: 8, marginBottom: 14 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.ink, margin: 0 }}>
                    {plan.propertyLimit === null
                      ? '∞ Biens illimités'
                      : `${plan.propertyLimit} bien${plan.propertyLimit > 1 ? 's' : ''} maximum`}
                  </p>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <Check size={13} color={isHL ? BAI.caramel : '#16a34a'} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, lineHeight: 1.4 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Bannière Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            marginTop: 32,
            padding: '14px 24px',
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 28, flexWrap: 'wrap',
          }}
        >
          {[
            { icon: '🔒', text: 'Paiement sécurisé Stripe' },
            { icon: '✕', text: 'Sans engagement, annulez quand vous voulez' },
            { icon: '📞', text: 'Support français disponible' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── ROI CALCULATOR ────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(32px,4vw,56px) clamp(16px,5vw,40px)', background: BAI.bgMuted }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
              Votre économie réelle
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: 0 }}>
              Calculez ce que vous économisez
            </h2>
          </div>
          <RoiCalculator />
        </div>
      </section>

      {/* ── TABLE DE COMPARAISON ──────────────────────────────────────────── */}
      <section className="compare-table" style={{ padding: 'clamp(48px,6vw,80px) clamp(16px,5vw,40px)', maxWidth: 1260, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
            Tout comparer
          </p>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: 0 }}>
            Comparaison détaillée des plans
          </h2>
        </div>

        <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* En-tête */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', borderBottom: `2px solid ${BAI.border}` }}>
            <div style={{ padding: '14px 20px' }} />
            {PLAN_IDS.map(id => {
              const plan = PLANS.find(p => p.id === id)!
              return (
                <div key={id} style={{
                  padding: '14px 10px', textAlign: 'center',
                  background: plan.highlight ? BAI.caramelLight : 'transparent',
                  borderLeft: `1px solid ${BAI.border}`,
                }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: plan.highlight ? BAI.caramel : BAI.ink, margin: '0 0 2px' }}>
                    {PLAN_NAMES[id]}
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: plan.highlight ? BAI.caramel : BAI.inkFaint, margin: 0 }}>
                    {plan.monthlyPrice === 0 ? 'Gratuit' : `${plan.monthlyPrice.toFixed(2).replace('.', ',')} €/mois`}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Lignes */}
          {(() => {
            const rows: JSX.Element[] = []
            let lastSection = ''
            FEATURE_TABLE.forEach((row, idx) => {
              if (row.section && row.section !== lastSection) {
                lastSection = row.section
                rows.push(
                  <div
                    key={`section-${row.section}`}
                    style={{
                      padding: '8px 20px',
                      background: '#f8f7f4',
                      borderBottom: `1px solid ${BAI.border}`,
                    }}
                  >
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, color: BAI.inkMid, textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                      {row.section}
                    </span>
                  </div>
                )
              }
              rows.push(
                <div
                  key={row.label}
                  style={{
                    display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr',
                    borderBottom: idx < FEATURE_TABLE.length - 1 ? `1px solid ${BAI.border}` : 'none',
                    background: idx % 2 === 0 ? BAI.bgSurface : BAI.bgBase,
                  }}
                >
                  <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.ink }}>{row.label}</span>
                    {row.tooltip && (
                      <span title={row.tooltip} style={{ cursor: 'help', display: 'flex' }}>
                        <Info size={12} color={BAI.inkFaint} />
                      </span>
                    )}
                  </div>
                  {PLAN_IDS.map(planId => {
                    const plan = PLANS.find(p => p.id === planId)!
                    return (
                      <div key={planId} style={{
                        padding: '11px 10px', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderLeft: `1px solid ${BAI.border}`,
                        background: plan.highlight ? `${BAI.caramelLight}80` : 'transparent',
                      }}>
                        <FeatureCell value={row[planId]} isHighlight={plan.highlight} />
                      </div>
                    )
                  })}
                </div>
              )
            })
            return rows
          })()}

          {/* Footer CTA dans la table */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', borderTop: `2px solid ${BAI.border}`, background: BAI.bgMuted }}>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                Commencer maintenant
              </p>
            </div>
            {PLAN_IDS.map(id => {
              const plan = PLANS.find(p => p.id === id)!
              return (
                <div key={id} style={{ padding: '12px 8px', borderLeft: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleCta(id)}
                    disabled={loadingPlan === id}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: plan.highlight ? 'none' : `1px solid ${BAI.border}`,
                      background: plan.highlight ? BAI.caramel : 'transparent',
                      color: plan.highlight ? '#fff' : BAI.inkMid,
                      whiteSpace: 'nowrap', minHeight: 36,
                    }}
                  >
                    {plan.cta.split(' ').slice(0, 2).join(' ')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(32px,4vw,56px) clamp(16px,5vw,40px) 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
            FAQ
          </p>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: 0 }}>
            Questions fréquentes
          </h2>
        </div>
        {FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
      </section>

      {/* ── CTA FOOTER DARK ──────────────────────────────────────────────── */}
      <section style={{
        background: '#0a0d1a',
        padding: 'clamp(56px,7vw,88px) clamp(16px,5vw,48px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(196,151,106,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} color={BAI.caramel} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BAI.caramel, margin: 0 }}>
              Prêt à commencer ?
            </p>
          </div>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,44px)', color: '#fff', margin: '0 0 12px' }}>
            Gérez vos biens comme un professionnel.
          </h2>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.52)', margin: '0 0 32px' }}>
            14 jours gratuits. Sans engagement. Sans carte bancaire.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCta('pro')}
              style={{
                padding: '13px 28px', borderRadius: 10, border: 'none',
                background: BAI.caramel, color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', minHeight: 46, display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = BAI.caramelHover)}
              onMouseLeave={e => (e.currentTarget.style.background = BAI.caramel)}
            >
              Essayer Pro gratuitement <ArrowRight size={15} />
            </button>
            <Link
              to="/register"
              style={{
                padding: '13px 24px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'transparent', color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 46,
              }}
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
