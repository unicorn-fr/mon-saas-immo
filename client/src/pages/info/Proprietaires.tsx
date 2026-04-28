import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconUserX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m22 11-3-3"/><path d="m19 8-3 3"/>
  </svg>
)
const IconDollar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

/* ─── Data ───────────────────────────────────────────────────────────────── */
const FEATURES_3 = [
  {
    icon: <IconStar />,
    title: 'Annonce premium.',
    desc: "Tu remplis les informations essentielles — surface, loyer, équipements. L'IA optimise le titre et la description pour maximiser la visibilité. Tu visualises avant publication.",
  },
  {
    icon: <IconUserX />,
    title: 'Filtre intelligent.',
    desc: "Chaque candidature arrive avec une analyse : taux d'effort, stabilité professionnelle, cohérence des justificatifs. Tu compares en un coup d'œil, sans dossier papier.",
  },
  {
    icon: <IconDollar />,
    title: 'Encaissement auto.',
    desc: 'Prélèvement SEPA le 5 du mois, virement sur ton compte le 7. Quittance envoyée au locataire dans la foulée. Zéro intervention de ta part.',
  },
]

const KPI_CARDS = [
  { label: 'Loyers ce mois',   value: '3 870 €', sub: '+4 % vs mois dernier', color: BAI.owner },
  { label: 'Biens en gestion', value: '3',        sub: '2 loués · 1 en attente', color: BAI.owner },
  { label: 'Candidatures',     value: '12',       sub: '4 à examiner',          color: BAI.caramel },
  { label: 'Rentabilité brute',value: '5,8 %',    sub: 'Calculée en temps réel', color: BAI.tenant },
]

const ACTIVITY = [
  { dot: '✓', bg: BAI.tenantLight, col: BAI.tenant, title: 'Loyer encaissé automatiquement', sub: 'SEPA · Le 5 du mois' },
  { dot: '✉', bg: BAI.ownerLight,  col: BAI.owner,  title: 'Nouvelle candidature reçue',       sub: 'Dossier à consulter' },
  { dot: '📄', bg: BAI.ownerLight, col: BAI.owner,  title: 'Bail signé électroniquement',      sub: 'Conforme loi ALUR' },
]

const BAR_HEIGHTS = [55, 62, 58, 71, 75, 80, 88]

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Proprietaires() {
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes cloud1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-60px)} }
        @keyframes cloud2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(50px)} }
        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(196,151,106,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(196,151,106,0); }
          100% { box-shadow: 0 0 0 0 rgba(196,151,106,0); }
        }

        .prop-hero-grid   { display:grid; grid-template-columns:1.3fr 1fr; gap:60px; align-items:center; }
        .prop-feat-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
        .prop-kpi-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .prop-dash-bot    { display:grid; grid-template-columns:1.2fr 1fr; gap:24px; }

        @media (max-width: 1024px) {
          .prop-feat-grid { grid-template-columns: 1fr 1fr !important; }
          .prop-kpi-grid  { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .prop-hero-grid  { grid-template-columns: 1fr !important; gap: 28px !important; }
          .prop-feat-grid  { grid-template-columns: 1fr !important; }
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

        .prop-feat-card {
          background: #ffffff;
          border: 1px solid #e4e1db;
          border-radius: 12px;
          padding: 28px;
          transition: all .25s cubic-bezier(0.16,1,0.3,1);
        }
        .prop-feat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10);
          border-color: #b8ccf0;
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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="prop-hero-sec" style={{
        position: 'relative',
        background: BAI.night,
        color: '#fff',
        overflow: 'hidden',
        padding: '80px 0 100px',
      }}>
        {/* Animated clouds */}
        <div style={{
          position: 'absolute', top: '8%', right: '-60px',
          width: 420, height: 120, borderRadius: '50%',
          background: 'rgba(196,151,106,0.06)', filter: 'blur(40px)',
          animation: 'cloud1 22s ease-in-out infinite', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '55%', left: '40%',
          width: 320, height: 90, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)',
          animation: 'cloud2 28s ease-in-out infinite', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 2 }}>
          <div className="prop-hero-grid">

            {/* Left — copy */}
            <div>
              {/* Eyebrow pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.35)',
                color: BAI.caramel, padding: '6px 14px', borderRadius: 999,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                marginBottom: 28,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: BAI.caramel,
                  display: 'inline-block', animation: 'pulse-dot 2s infinite',
                }} />
                POUR LES PROPRIÉTAIRES
              </span>

              <h1 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(42px,7vw,80px)', lineHeight: 1.02,
                color: '#fff', margin: '0 0 22px',
              }}>
                Loue ton bien <em style={{ color: BAI.caramel }}>sans agence.</em>
              </h1>

              <p style={{
                fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6, maxWidth: 560, margin: '0 0 40px',
              }}>
                Publie ton annonce en huit minutes. Reçois des candidatures déjà vérifiées.
                Signe le bail en ligne. Les loyers tombent tout seuls. C'est tout.
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

            {/* Right — calcul rapide card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 28,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}>
              <p style={{
                fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: BAI.caramel, fontWeight: 700, margin: '0 0 16px',
              }}>
                Calcul rapide
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>
                Abonnement Starter — tout inclus
              </p>
              <p style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 48, color: '#fff', margin: 0, lineHeight: 1,
              }}>
                9,99 €
                <span style={{
                  fontSize: 18, color: 'rgba(255,255,255,0.6)',
                  fontWeight: 400, fontStyle: 'normal',
                }}> /mois</span>
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '8px 0 24px' }}>
                soit <strong style={{ color: BAI.caramel }}>99,99 €/an</strong> · contre 1 100 € en agence classique
              </p>
              <div style={{
                background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.3)',
                borderRadius: 8, padding: 14, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5,
              }}>
                🎁 <strong style={{ color: BAI.caramel }}>Économie estimée :</strong> plus de 1 000 € sur la première année.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CE QUE FAIT BAILIO — 3 cols ──────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: BAI.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 14px',
          }}>
            CE QUE FAIT BAILIO
          </p>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 16px',
          }}>
            Tout. <em style={{ color: BAI.caramel }}>Sauf à ta place.</em>
          </h2>
          <p style={{
            fontSize: 16, color: BAI.inkMid, lineHeight: 1.65,
            maxWidth: '64ch', margin: '0 0 52px',
          }}>
            Tu décides du loyer, tu choisis le locataire, tu signes. Bailio fait tout le reste — l'IA optimise ton annonce,
            vérifie les dossiers, génère le bail, encaisse les loyers, envoie les quittances.
          </p>

          <div className="prop-feat-grid">
            {FEATURES_3.map(feat => (
              <div key={feat.title} className="prop-feat-card">
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: BAI.ownerLight, color: BAI.owner,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {feat.icon}
                </div>
                <h4 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 22, margin: '0 0 10px', color: BAI.ink,
                }}>
                  {feat.title}
                </h4>
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.65, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD MOCKUP ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: BAI.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 14px',
          }}>
            TON ESPACE
          </p>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 16px',
          }}>
            Un dashboard pour <em style={{ color: BAI.caramel }}>tout piloter.</em>
          </h2>
          <p style={{
            fontSize: 16, color: BAI.inkMid, lineHeight: 1.65,
            maxWidth: '56ch', margin: '0 0 40px',
          }}>
            Tes biens, tes loyers encaissés, tes candidatures, ta rentabilité — sur un seul écran, sur ton téléphone aussi.
          </p>

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
                    fontSize: 28, margin: 0, color: BAI.ink,
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
                  Activité récente
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
                  Évolution des loyers
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

      {/* ── CTA STRIP ────────────────────────────────────────────────────── */}
      <section className="prop-cta-sec" style={{ background: BAI.night, padding: '80px 0' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px,5vw,48px)', textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,52px)', color: '#fff',
            margin: '0 0 18px', lineHeight: 1.1,
          }}>
            Et si ton prochain locataire{' '}
            <em style={{ color: BAI.caramel }}>arrivait demain ?</em>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.72)', fontSize: 17,
            margin: '0 auto 36px', maxWidth: '52ch', lineHeight: 1.6,
          }}>
            Crée ton annonce, on s'occupe du reste. La plateforme est en accès anticipé — rejoins les premiers propriétaires à simplifier leur gestion.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link to="/register?role=OWNER" className="prop-btn-caramel">
              Publier mon annonce maintenant <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="prop-btn-outline-dark">
              Voir les tarifs
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Essai 14 jours sans CB · À partir de 9,99 €/mois · Pas d'engagement
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
