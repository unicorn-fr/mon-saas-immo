import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { BAI } from '../constants/bailio-tokens'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const OWNER_FEATURES = [
  'Annonce optimisée par IA',
  'Candidatures vérifiées & scorées',
  'Bail + état des lieux + SEPA',
  'Quittances automatiques',
  'Garantie loyers impayés (option)',
]

const TENANT_FEATURES = [
  'Dossier locatif numérique',
  'Candidature en un clic',
  'Messagerie directe propriétaire',
  'Quittances et bail dans ton espace',
  'Accompagnement état des lieux',
]

interface ComparisonRow {
  label: string
  agency: string
  bailio: string
  bailioColor: string
  bg: string
  fontWeight: number
}

const COMPARISON: ComparisonRow[] = [
  {
    label: 'Frais de mise en location',
    agency: '~ 1 100 €',
    bailio: '0 €',
    bailioColor: BAI.success,
    bg: BAI.bgSurface,
    fontWeight: 400,
  },
  {
    label: 'Honoraires de gestion mensuels',
    agency: '7 % · 84 €',
    bailio: '9,99 €',
    bailioColor: BAI.caramel,
    bg: BAI.bgBase,
    fontWeight: 400,
  },
  {
    label: 'Renouvellement de bail',
    agency: '~ 250 €',
    bailio: '0 €',
    bailioColor: BAI.success,
    bg: BAI.bgSurface,
    fontWeight: 400,
  },
  {
    label: 'Coût total an 1',
    agency: '2 358 €',
    bailio: '144 €',
    bailioColor: BAI.caramelHover,
    bg: BAI.caramelLight,
    fontWeight: 700,
  },
]

export default function Pricing() {
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .cmp-row { grid-template-columns: 1fr 1fr !important; }
          .cmp-row-label { grid-column: span 2; font-weight: 600; font-size: 12px; margin-bottom: 4px; }
        }
      `}</style>

      <Header />

      {/* ── SECTION 1 — Header léger ── */}
      <section style={{ padding: '80px 0 40px', background: BAI.bgBase, textAlign: 'center' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 clamp(16px, 5vw, 48px)' }}>
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BAI.caramel,
            margin: '0 0 16px',
          }}>
            Tarifs simples
          </p>
          <h1 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(28px, 5vw, 40px)',
            lineHeight: 1.1,
            color: BAI.ink,
            margin: '0 auto 20px',
            maxWidth: '20ch',
          }}>
            Un prix juste.{' '}
            <em style={{ color: BAI.caramel }}>Pour tout le monde.</em>
          </h1>
          <p style={{
            fontFamily: BAI.fontBody,
            fontSize: 16,
            color: BAI.inkMid,
            lineHeight: 1.65,
            maxWidth: '58ch',
            margin: '0 auto',
          }}>
            Pas d'abonnement, pas de palier mystère. Tu paies seulement quand ton bail est
            signé — et encore, pas toi si tu loues.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — Grid 2 cartes ── */}
      <section style={{ padding: '40px 0 64px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 clamp(16px, 5vw, 48px)' }}>
          <div
            className="pricing-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
          >
            {/* Propriétaire */}
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderTop: `3px solid ${BAI.owner}`,
              borderRadius: 12,
              padding: 40,
            }}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BAI.owner,
                margin: '0 0 10px',
              }}>
                Propriétaire
              </p>
              <h3 style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 28,
                color: BAI.ink,
                margin: '0 0 18px',
              }}>
                Bailio Serenin
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 10px' }}>
                <span style={{
                  fontFamily: BAI.fontDisplay,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 56,
                  color: BAI.ink,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}>
                  9,99 €
                </span>
                <span style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 15,
                  color: BAI.inkFaint,
                  fontWeight: 400,
                }}>
                  / mois
                </span>
              </div>
              <p style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 28px' }}>
                Par bien géré. Suspendu automatiquement si le bien est vacant.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {OWNER_FEATURES.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      fontSize: 14,
                      color: BAI.ink,
                      padding: '10px 0',
                      borderBottom: `1px solid ${BAI.border}`,
                    }}
                  >
                    <Check size={16} color={BAI.success} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=OWNER"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 0',
                  borderRadius: 8,
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 15,
                  background: BAI.night,
                  color: '#fff',
                  textDecoration: 'none',
                  minHeight: 44,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Publier mon annonce
              </Link>
            </div>

            {/* Locataire */}
            <div style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderTop: `3px solid ${BAI.tenant}`,
              borderRadius: 12,
              padding: 40,
            }}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BAI.tenant,
                margin: '0 0 10px',
              }}>
                Locataire
              </p>
              <h3 style={{
                fontFamily: BAI.fontDisplay,
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: 28,
                color: BAI.ink,
                margin: '0 0 18px',
              }}>
                Accès libre
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 10px' }}>
                <span style={{
                  fontFamily: BAI.fontDisplay,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 56,
                  color: BAI.ink,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}>
                  0€
                </span>
                <span style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 15,
                  color: BAI.inkFaint,
                  fontWeight: 400,
                }}>
                  toujours
                </span>
              </div>
              <p style={{ fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 28px' }}>
                Tu cherches, tu postules, tu signes. Rien à payer, jamais. Promis.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TENANT_FEATURES.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      fontSize: 14,
                      color: BAI.ink,
                      padding: '10px 0',
                      borderBottom: `1px solid ${BAI.border}`,
                    }}
                  >
                    <Check size={16} color={BAI.success} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/search"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 0',
                  borderRadius: 8,
                  fontFamily: BAI.fontBody,
                  fontWeight: 600,
                  fontSize: 15,
                  background: BAI.tenant,
                  color: '#fff',
                  textDecoration: 'none',
                  minHeight: 44,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Chercher un logement
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 4 — Comparatif ── */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(64px, 10vh, 100px) 0' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 clamp(16px, 5vw, 48px)', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(24px, 4vw, 36px)',
            color: BAI.ink,
            margin: '0 auto 48px',
          }}>
            Comparé aux agences classiques.
          </h2>

          <div style={{
            maxWidth: 780,
            margin: '0 auto',
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              background: BAI.bgMuted,
              padding: '14px 24px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: BAI.inkFaint,
              textAlign: 'left',
            }}>
              <span>Pour un loyer de 1 200 €</span>
              <span style={{ textAlign: 'center' }}>Agence</span>
              <span style={{ textAlign: 'center', color: BAI.caramel }}>Bailio</span>
            </div>

            {COMPARISON.map(row => (
              <div
                key={row.label}
                className="cmp-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  padding: '15px 24px',
                  borderTop: `1px solid ${BAI.border}`,
                  fontSize: row.fontWeight === 700 ? 15 : 14,
                  fontWeight: row.fontWeight,
                  alignItems: 'center',
                  background: row.bg,
                  textAlign: 'left',
                }}
              >
                <span className="cmp-row-label" style={{ color: BAI.ink }}>{row.label}</span>
                <span style={{ textAlign: 'center', color: BAI.inkMid }}>{row.agency}</span>
                <span style={{ textAlign: 'center', color: row.bailioColor, fontWeight: 600 }}>{row.bailio}</span>
              </div>
            ))}
          </div>

          <p style={{ margin: '24px auto 0', fontSize: 13, color: BAI.inkFaint }}>
            Estimation sur 12 mois, basée sur un loyer de 1 200 €/mois et les tarifs moyens des agences de gestion locative.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
