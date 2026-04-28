import { useState } from 'react'
import { Check, Zap, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api.service'
import { PLANS, FAQ_ITEMS } from '../config/pricing'

// ─── FAQ Accordion item ───────────────────────────────────────────────────────
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

// ─── Pricing Page ─────────────────────────────────────────────────────────────
export default function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCta = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId)
    if (!plan || plan.id === 'essentiel') return navigate('/register')

    const priceId = plan.priceIds?.[billing]

    if (!isAuthenticated) {
      navigate(`/register?plan=${planId}&billing=${billing}`)
      return
    }

    if (!priceId) {
      toast.error('Ce plan n\'est pas encore disponible.')
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

  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 480px !important; margin-left: auto !important; margin-right: auto !important; }
          .pricing-grid > div:nth-child(2) { order: -1; }
        }
        @media (max-width: 640px) {
          .cmp-grid { grid-template-columns: 1fr 1fr !important; }
          .cmp-label { grid-column: span 2; font-size: 12px !important; font-weight: 600; padding-bottom: 4px; }
          .cmp-header { display: none !important; }
          .cmp-mobile-header { display: flex !important; }
        }
        @media (max-width: 480px) {
          .pricing-grid { max-width: 100% !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ padding: '72px 0 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 16px' }}>
            Tarifs
          </p>
          <h1 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.05, color: BAI.ink, margin: '0 0 18px' }}>
            Simple, transparent.{' '}
            <em style={{ color: BAI.caramel }}>Sans surprise.</em>
          </h1>
          <p style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.65, maxWidth: '52ch', margin: '0 auto 36px' }}>
            Commence gratuitement, passe à un plan payant quand tu en as besoin. Essai 14 jours sans CB.
          </p>

          {/* Toggle annuel / mensuel */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 999, padding: '4px 6px' }}>
            {(['monthly', 'annual'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                  background: billing === b ? BAI.night : 'transparent',
                  color: billing === b ? '#fff' : BAI.inkMid,
                  transition: 'all 0.2s',
                }}
                aria-pressed={billing === b}
              >
                {b === 'annual' ? 'Annuel' : 'Mensuel'}
                {b === 'annual' && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                    background: BAI.caramel, color: '#fff',
                    padding: '2px 7px', borderRadius: 999,
                  }}>
                    −2 mois
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── GRILLE PLANS ── */}
      <section style={{ padding: '0 0 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div
            className="pricing-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1.08fr 1fr', gap: 20, alignItems: 'start' }}
          >
            {PLANS.map(plan => {
              const isHighlight = plan.highlight
              const price = billing === 'annual' ? plan.annualMonthlyEquiv : plan.monthlyPrice
              const isLoading = loadingPlan === plan.id

              return (
                <div
                  key={plan.id}
                  style={{
                    background: isHighlight ? BAI.night : BAI.bgSurface,
                    border: isHighlight ? `2px solid ${BAI.caramel}` : `1px solid ${BAI.border}`,
                    borderRadius: 16,
                    padding: isHighlight ? '36px 32px' : '32px 28px',
                    position: 'relative',
                    boxShadow: isHighlight
                      ? '0 8px 40px rgba(13,12,10,0.18)'
                      : '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: BAI.caramel, color: '#fff',
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                      padding: '4px 14px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Nom */}
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: isHighlight ? BAI.caramel : BAI.inkFaint,
                    margin: '0 0 10px',
                  }}>
                    {plan.name}
                  </p>

                  {/* Prix */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '0 0 4px' }}>
                    {price === 0 ? (
                      <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 48, color: isHighlight ? '#fff' : BAI.ink, lineHeight: 1 }}>
                        Gratuit
                      </span>
                    ) : (
                      <>
                        <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 48, color: isHighlight ? '#fff' : BAI.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>
                          {price?.toFixed(2).replace('.', ',')} €
                        </span>
                        <span style={{ fontSize: 13, color: isHighlight ? 'rgba(255,255,255,0.55)' : BAI.inkFaint }}>
                          /mois HT
                        </span>
                      </>
                    )}
                  </div>

                  {/* Sous-titre prix annuel */}
                  {billing === 'annual' && plan.annualPrice !== null && plan.annualPrice > 0 && (
                    <p style={{ fontSize: 12, color: isHighlight ? 'rgba(255,255,255,0.5)' : BAI.inkFaint, margin: '0 0 6px' }}>
                      soit {plan.annualPrice} € HT/an · 2 mois offerts
                    </p>
                  )}
                  {billing === 'monthly' && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                    <p style={{ fontSize: 12, color: isHighlight ? 'rgba(255,255,255,0.5)' : BAI.inkFaint, margin: '0 0 6px' }}>
                      facturation mensuelle
                    </p>
                  )}
                  {price === 0 && (
                    <p style={{ fontSize: 12, color: isHighlight ? 'rgba(255,255,255,0.5)' : BAI.inkFaint, margin: '0 0 6px' }}>
                      pour toujours
                    </p>
                  )}

                  {/* Limite biens */}
                  <p style={{ fontSize: 13, fontWeight: 600, color: isHighlight ? 'rgba(255,255,255,0.7)' : BAI.inkMid, margin: '0 0 24px' }}>
                    {plan.propertyLimit}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleCta(plan.id)}
                    disabled={isLoading}
                    aria-label={`${plan.cta} — plan ${plan.name}`}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 8,
                      fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                      cursor: isLoading ? 'wait' : 'pointer',
                      border: isHighlight ? 'none' : `1px solid ${BAI.night}`,
                      background: isHighlight ? BAI.caramel : 'transparent',
                      color: isHighlight ? '#fff' : BAI.night,
                      transition: 'opacity 0.2s',
                      opacity: isLoading ? 0.7 : 1,
                      marginBottom: 24,
                    }}
                    onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                  >
                    {isLoading ? 'Redirection…' : plan.cta}
                  </button>

                  {/* Essai */}
                  {plan.trialDays && (
                    <p style={{ fontSize: 11, textAlign: 'center', color: isHighlight ? 'rgba(255,255,255,0.45)' : BAI.inkFaint, margin: '0 0 24px' }}>
                      {plan.trialDays} jours d'essai gratuit · sans CB
                    </p>
                  )}

                  {/* Features */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <Check
                          size={15}
                          strokeWidth={2.5}
                          style={{ flexShrink: 0, marginTop: 2, color: isHighlight ? BAI.caramel : BAI.tenant }}
                        />
                        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: isHighlight ? 'rgba(255,255,255,0.82)' : BAI.inkMid }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARATIF vs agences ── */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(64px,10vh,96px) 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: '0 0 48px' }}>
            Comparé aux agences classiques.
          </h2>
          <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, overflow: 'hidden', textAlign: 'left' }}>
            {/* Header */}
            <div className="cmp-grid cmp-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: BAI.bgMuted, padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint }}>
              <span>Pour un loyer de 1 200 €</span>
              <span style={{ textAlign: 'center' }}>Agence</span>
              <span style={{ textAlign: 'center', color: BAI.caramel }}>Bailio</span>
            </div>
            {[
              { label: 'Frais de mise en location', agency: '~ 1 100 €', bailio: '0 €', bailioColor: BAI.tenant },
              { label: 'Frais de gestion mensuels', agency: '7 % · 84 €/mois', bailio: '9,99 €/mois', bailioColor: BAI.caramel },
              { label: 'Renouvellement de bail', agency: '~ 250 €', bailio: '0 €', bailioColor: BAI.tenant },
            ].map((row, i) => (
              <div key={row.label} className="cmp-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '15px 24px', borderTop: `1px solid ${BAI.border}`, fontSize: 14, background: i % 2 === 0 ? BAI.bgSurface : BAI.bgBase, alignItems: 'center' }}>
                <span className="cmp-label" style={{ color: BAI.ink }}>{row.label}</span>
                <span style={{ textAlign: 'center', color: BAI.inkMid }}>{row.agency}</span>
                <span style={{ textAlign: 'center', color: row.bailioColor, fontWeight: 600 }}>{row.bailio}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '20px 0 0', fontSize: 12, color: BAI.inkFaint }}>
            Estimation sur 12 mois, basée sur un loyer de 1 200 €/mois et les tarifs moyens des agences de gestion locative.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(64px,10vh,96px) 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: '0 0 40px', textAlign: 'center' }}>
            Questions fréquentes.
          </h2>
          {FAQ_ITEMS.map(item => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── RÉASSURANCE ── */}
      <section style={{ background: BAI.bgMuted, borderTop: `1px solid ${BAI.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, color: BAI.inkFaint, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Lock size={13} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
          Paiement sécurisé par Stripe
          <span style={{ color: BAI.border }}>·</span>
          Facturation conforme (TVA 20 %)
          <span style={{ color: BAI.border }}>·</span>
          Sans engagement
          <span style={{ color: BAI.border }}>·</span>
          Résiliable à tout moment
          <span style={{ color: BAI.border }}>·</span>
          <Link to="/confidentialite" style={{ color: BAI.caramel, textDecoration: 'none' }}>Politique de confidentialité</Link>
        </p>
      </section>

      {/* ── CTA bas de page ── */}
      <section style={{ background: BAI.night, padding: 'clamp(64px,10vh,96px) 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <Zap size={28} style={{ color: BAI.caramel, marginBottom: 20 }} />
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,44px)', color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>
            Prêt à simplifier ta gestion ?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 36px', lineHeight: 1.65 }}>
            Démarre avec le plan Essentiel — gratuit, sans CB, sans limite de durée.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              aria-label="Créer un compte gratuit sur Bailio"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, background: BAI.caramel, color: '#fff', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              Commencer gratuitement
            </Link>
            <Link
              to="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
            >
              Une question ? On répond.
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
