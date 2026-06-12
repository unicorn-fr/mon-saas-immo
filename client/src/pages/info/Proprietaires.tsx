import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'
import { useDarkSection } from '../../hooks/useDarkSection'

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconUserX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 11-3-3"/><path d="m19 8-3 3"/>
  </svg>
)
const IconDollar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <IconStar />,
    title: 'Annonce premium.',
    desc: "Remplissez les informations essentielles : surface, loyer, equipements. L'IA optimise le titre et la description pour maximiser la visibilite. Vous visualisez avant publication.",
    stat: '3x',
    statLabel: 'plus de candidatures qu\'une annonce classique',
    reverse: false,
  },
  {
    icon: <IconUserX />,
    title: 'Filtre intelligent.',
    desc: "Chaque candidature arrive avec une analyse : taux d'effort, stabilite professionnelle, coherence des justificatifs. Vous comparez en un coup d'oeil, sans dossier papier.",
    stat: '87%',
    statLabel: 'des dossiers traites en moins de 24 h',
    reverse: true,
  },
  {
    icon: <IconDollar />,
    title: 'Encaissement automatique.',
    desc: 'Votre locataire verse le loyer directement. Vous le marquez comme recu en 1 clic, la quittance part automatiquement. Zero paperasse.',
    stat: '1 200 €',
    statLabel: 'economises en moyenne sur la premiere annee',
    reverse: false,
  },
]

const KPI_CARDS = [
  { label: 'Loyers ce mois',   value: '3 870 €', sub: '+4 % vs mois dernier', color: BAI.owner },
  { label: 'Biens en gestion', value: '3',        sub: '2 loues - 1 en attente', color: BAI.owner },
  { label: 'Candidatures',     value: '12',       sub: '4 a examiner',          color: BAI.caramel },
  { label: 'Rentabilite brute',value: '5,8 %',    sub: 'Calculee en temps reel', color: BAI.tenant },
]

const ACTIVITY = [
  { dot: '✓', bg: BAI.tenantLight, col: BAI.tenant, title: 'Loyer recu, quittance envoyee', sub: 'Mai 2026' },
  { dot: '✉', bg: BAI.ownerLight,  col: BAI.owner,  title: 'Nouvelle candidature recue',    sub: 'Dossier a consulter' },
  { dot: '✎', bg: BAI.ownerLight,  col: BAI.owner,  title: 'Bail signe electroniquement',   sub: 'Conforme loi ALUR' },
]

const BAR_HEIGHTS = [55, 62, 58, 71, 75, 80, 88]

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Proprietaires() {
  const heroRef = useRef<HTMLDivElement>(null)
  useDarkSection(heroRef)
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(196,151,106,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(196,151,106,0); }
          100% { box-shadow: 0 0 0 0 rgba(196,151,106,0); }
        }

        /* Hero asymmetric */
        .prop-hero-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 60px;
          align-items: center;
        }
        .prop-hero-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          min-width: 200px;
        }

        /* Feature zig-zag */
        .prop-feat-row {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 0;
          border-bottom: 1px solid ${BAI.border};
          padding: clamp(28px,4vh,52px) 0;
          align-items: start;
        }
        .prop-feat-row.reverse { grid-template-columns: 2fr 3fr; }
        .prop-feat-row:last-child { border-bottom: none; }

        /* KPI and dashboard grids */
        .prop-kpi-grid    { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .prop-dash-bot    { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }

        @media (max-width: 1024px) {
          .prop-kpi-grid  { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .prop-hero-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .prop-hero-stat  { align-items: flex-start !important; text-align: left !important; }
          .prop-feat-row, .prop-feat-row.reverse { grid-template-columns: 1fr !important; gap: 20px; }
          .prop-feat-row.reverse .prop-feat-text-col { order: -1; }
          .prop-kpi-grid   { grid-template-columns: 1fr 1fr !important; }
          .prop-dash-bot   { grid-template-columns: 1fr !important; }
          .prop-hero-sec   { padding: 56px 0 64px !important; }
          .prop-cta-sec    { padding: 56px 0 !important; }
          .prop-btn-group  { justify-content: flex-start !important; }
        }
        @media (max-width: 480px) {
          .prop-kpi-grid   { grid-template-columns: 1fr 1fr !important; }
          .prop-btn-group  { flex-direction: column !important; width: 100% !important; }
          .prop-btn-caramel, .prop-btn-ghost, .prop-btn-outline-dark { width: 100% !important; justify-content: center !important; }
        }

        .prop-btn-caramel {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 26px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: #c4976a;
          color: #fff;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background .18s ease;
          min-height: 44px;
        }
        .prop-btn-caramel:hover { background: #b07f54; }

        .prop-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 26px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          text-decoration: none;
          cursor: pointer;
          transition: background .18s ease;
          min-height: 44px;
        }
        .prop-btn-ghost:hover { background: rgba(255,255,255,0.14); }

        .prop-btn-outline-dark {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 26px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          text-decoration: none;
          cursor: pointer;
          transition: border-color .18s ease, background .18s ease;
          min-height: 44px;
        }
        .prop-btn-outline-dark:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.5); }
      `}</style>

      <Header />

      {/* ── HERO: asymmetric — H1 left, big stat right ── */}
      <section ref={heroRef} className="prop-hero-sec" style={{
        position: 'relative',
        background: '#0a0d1a',
        color: '#fff',
        overflow: 'hidden',
        padding: '80px 0 100px',
      }}>
        {/* Ambient orb */}
        <div aria-hidden style={{
          position: 'absolute', top: '8%', right: '-60px',
          width: 420, height: 120, borderRadius: '50%',
          background: 'rgba(196,151,106,0.06)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 2 }}>
          <div className="prop-hero-grid">

            {/* Left — copy */}
            <div>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: BAI.caramel, margin: '0 0 14px',
              }}>
                Propriétaires
              </p>
              <h1 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(38px,6vw,72px)', lineHeight: 1.02,
                color: '#fff', margin: '0 0 22px', paddingBottom: 2,
              }}>
                Louez votre bien{' '}
                <em style={{ color: BAI.caramel }}>sans agence.</em>
              </h1>

              <p style={{
                fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6, maxWidth: 560, margin: '0 0 40px',
              }}>
                Publiez votre annonce en huit minutes. Recevez des candidatures deja verifiees.
                Signez le bail en ligne. Les loyers tombent automatiquement.
              </p>

              <div className="prop-btn-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register?role=OWNER" className="prop-btn-caramel">
                  Publier mon annonce <ArrowRight size={16} />
                </Link>
                <Link to="/pricing" className="prop-btn-ghost">
                  Voir la tarification
                </Link>
              </div>
            </div>

            {/* Right — big stat asymmetric */}
            <div className="prop-hero-stat">
              <span style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(52px,8vw,96px)', color: BAI.caramel, lineHeight: 1,
              }}>
                1 200 €
              </span>
              <span style={{
                fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.55)',
                marginTop: 8, maxWidth: '18ch', lineHeight: 1.4,
              }}>
                economises en moyenne par an face a une agence classique
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ── CE QUE FAIT BAILIO — zig-zag ── */}
      <section style={{ padding: 'clamp(40px,6vh,80px) 0', background: BAI.bgBase }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 48px', paddingBottom: 2,
          }}>
            Tout. <em style={{ color: BAI.caramel }}>Sauf a votre place.</em>
          </h2>

          {FEATURES.map((feat, i) => (
            <div key={i} className={`prop-feat-row${feat.reverse ? ' reverse' : ''}`}>
              {/* Icon + title col */}
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 20,
                  order: feat.reverse ? 2 : 1,
                  padding: feat.reverse ? '0 0 0 clamp(20px,4vw,60px)' : '0 clamp(20px,4vw,60px) 0 0',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: BAI.ownerLight, color: BAI.owner,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {feat.icon}
                </div>
                <h3 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(20px,2.5vw,28px)', color: BAI.ink,
                  margin: '6px 0 0', paddingBottom: 2, lineHeight: 1.15,
                }}>
                  {feat.title}
                </h3>
              </div>

              {/* Text + stat col */}
              <div
                className="prop-feat-text-col"
                style={{ order: feat.reverse ? 1 : 2, paddingTop: 4 }}
              >
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.7, margin: '0 0 16px' }}>
                  {feat.desc}
                </p>
                <p style={{ margin: 0 }}>
                  <span style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(24px,3vw,32px)', color: BAI.caramel, lineHeight: 1,
                  }}>
                    {feat.stat}
                  </span>
                  {' '}
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                    {feat.statLabel}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD MOCKUP ── */}
      <section style={{ padding: 'clamp(48px,8vh,96px) 0', background: BAI.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 36px', paddingBottom: 2,
          }}>
            Un tableau de bord pour <em style={{ color: BAI.caramel }}>tout piloter.</em>
          </h2>

          {/* Dashboard mockup card */}
          <div style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 16,
            padding: 24,
            boxShadow: BAI.shadowMd,
          }}>
            {/* KPI row */}
            <div className="prop-kpi-grid">
              {KPI_CARDS.map(kpi => (
                <div key={kpi.label} style={{
                  background: BAI.bgBase,
                  border: `1px solid ${BAI.border}`,
                  borderTop: `3px solid ${kpi.color}`,
                  borderRadius: 10,
                  padding: 18,
                }}>
                  <p style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: BAI.inkFaint, fontWeight: 600, margin: '0 0 8px',
                  }}>
                    {kpi.label}
                  </p>
                  <p style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(20px, 4vw, 28px)', margin: 0, color: BAI.ink, paddingBottom: 1,
                  }}>
                    {kpi.value}
                  </p>
                  <p style={{ fontSize: 12, color: BAI.inkMid, margin: '4px 0 0' }}>
                    {kpi.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom row: activity + bar chart */}
            <div className="prop-dash-bot">
              {/* Activity list */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: '0 0 12px' }}>
                  Activite recente
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ACTIVITY.map(item => (
                    <div key={item.title} style={{
                      display: 'flex', gap: 12, alignItems: 'center',
                      padding: 12, background: BAI.bgBase, borderRadius: 8,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: item.bg, color: item.col,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 14,
                      }}>
                        {item.dot}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: BAI.ink }}>
                          {item.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: BAI.inkFaint }}>
                          {item.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar chart */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: '0 0 12px' }}>
                  Evolution des loyers
                </p>
                <div style={{
                  background: BAI.bgBase, borderRadius: 8, padding: 18, height: 160,
                  display: 'flex', alignItems: 'flex-end', gap: 6,
                }}>
                  {BAR_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: i === BAR_HEIGHTS.length - 1 ? BAI.owner : BAI.ownerLight,
                        height: `${h}%`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'background .18s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="prop-cta-sec" style={{ background: '#0a0d1a', padding: '80px 0' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px,5vw,48px)', textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,52px)', color: '#fff',
            margin: '0 0 18px', lineHeight: 1.1, paddingBottom: 2,
          }}>
            Et si votre prochain locataire{' '}
            <em style={{ color: BAI.caramel }}>arrivait demain ?</em>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.72)', fontSize: 17,
            margin: '0 auto 36px', maxWidth: '52ch', lineHeight: 1.6,
          }}>
            Creez votre annonce, on s'occupe du reste. Rejoignez les premiers proprietaires qui simplifient leur gestion.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link to="/register?role=OWNER" className="prop-btn-caramel">
              Publier mon annonce <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="prop-btn-outline-dark">
              Voir les tarifs
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Essai 14 jours sans CB, a partir de 9,90 €/mois, sans engagement
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
