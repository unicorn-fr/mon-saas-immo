import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useDarkSection } from '../../hooks/useDarkSection'

const STEPS = [
  {
    num: '1',
    title: 'Constituez votre dossier.',
    desc: "Identite, bulletins de salaire, avis d'imposition, garant si necessaire. Vous televersez une fois, on verifie la coherence des documents.",
  },
  {
    num: '2',
    title: 'Postulez en un clic.',
    desc: "Vous voyez un bien qui vous interesse, vous postulez. Le proprietaire recoit votre dossier deja complet, pas de relance, pas de PDF par mail.",
  },
  {
    num: '3',
    title: 'Visitez et echangez.',
    desc: "Messagerie directe avec le proprietaire integree a la plateforme. La visite se programme sans exposer vos coordonnees personnelles.",
  },
  {
    num: '4',
    title: 'Signez et emmenagez.',
    desc: "Bail electronique conforme loi ALUR, etat des lieux guide depuis votre telephone. Vous virez votre loyer directement et recevez votre quittance automatiquement.",
  },
]

const DOSSIER_DOCS = [
  { label: "Piece d'identite", status: 'verified' },
  { label: '3 derniers bulletins de salaire', status: 'verified' },
  { label: "Avis d'imposition", status: 'verified' },
  { label: 'Garant (optionnel)', status: 'pending' },
]

export default function Locataires() {
  const heroRef = useRef<HTMLElement>(null)
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
        @media (max-width: 768px) {
          .hero-grid   { grid-template-columns: 1fr !important; gap: 28px !important; }
          .loc-hero-sec { padding: 56px 0 64px !important; }
          .loc-cta-sec  { padding: 56px 0 !important; }
        }
        @media (max-width: 480px) {
          .loc-btn-group { flex-direction: column !important; }
          .loc-btn-group a { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO dark ── */}
      <section ref={heroRef} className="loc-hero-sec" style={{ background: '#0a0d1a', color: '#fff', padding: '80px 0 100px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

            {/* Left — copy */}
            <div>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: BAI.caramel, margin: '0 0 14px',
              }}>
                Locataires
              </p>
              <h1 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(38px,6vw,72px)', lineHeight: 1.02,
                letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px',
                maxWidth: '16ch', paddingBottom: 2,
              }}>
                Louez plus vite.{' '}
                <em style={{ color: BAI.caramel }}>Sans dossier papier.</em>
              </h1>

              <p style={{
                fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6, maxWidth: 520, margin: '0 0 40px',
              }}>
                Constituez votre dossier numerique une fois pour toutes. Postulez en un clic.
                Communiquez en direct avec le proprietaire. Signez votre bail en ligne, depuis votre canape.
              </p>

              <div className="loc-btn-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
                <Link
                  to="/search"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '14px 26px', borderRadius: 8,
                    fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                    background: BAI.caramel, color: '#fff', textDecoration: 'none',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.caramelHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.caramel }}
                >
                  Chercher mon logement <ArrowRight size={16} />
                </Link>

                <Link
                  to="/register?role=TENANT"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '14px 26px', borderRadius: 8,
                    fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                    border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)' }}
                >
                  Creer mon dossier
                </Link>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                100 % gratuit, pour toujours, garanti
              </p>
            </div>

            {/* Right — dossier preview card */}
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 28,
            }}>
              <p style={{
                color: BAI.caramel, fontSize: 12, textTransform: 'uppercase',
                letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 18px',
                fontFamily: BAI.fontBody,
              }}>
                Mon dossier locatif
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DOSSIER_DOCS.map(doc => (
                  <div
                    key={doc.label}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 12, background: 'rgba(255,255,255,0.06)',
                      borderRadius: 8, fontSize: 13, color: '#fff',
                    }}
                  >
                    <span>{doc.label}</span>
                    {doc.status === 'verified' ? (
                      <span style={{ color: BAI.caramel, fontWeight: 600 }}>Verifie</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>A ajouter</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Score de fiabilite */}
              <div style={{
                marginTop: 20, paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'baseline', gap: 6,
              }}>
                <span style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 36, color: BAI.caramel, lineHeight: 1,
                }}>
                  87%
                </span>
                <span style={{
                  marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)',
                  fontFamily: BAI.fontBody,
                }}>
                  Score de fiabilite
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROCESSUS: editorial numbered list ── */}
      <section style={{ padding: 'clamp(48px,8vh,96px) 0', background: BAI.bgBase }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 48px', paddingBottom: 2,
          }}>
            Du clic <em style={{ color: BAI.caramel }}>aux cles.</em>
          </h2>

          {/* Editorial numbered items */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: 'clamp(16px,3vw,40px)',
                  padding: 'clamp(24px,3vh,36px) 0',
                  borderBottom: i < STEPS.length - 1 ? `1px solid ${BAI.border}` : 'none',
                  alignItems: 'start',
                }}
              >
                {/* Number editorial */}
                <span style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(40px,5vw,56px)', color: BAI.caramel,
                  lineHeight: 1, display: 'block', paddingTop: 2,
                }}>
                  {step.num}
                </span>
                {/* Content */}
                <div>
                  <h3 style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(18px,2.2vw,24px)', color: BAI.ink,
                    margin: '0 0 10px', lineHeight: 1.2, paddingBottom: 1,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: BAI.inkMid, margin: 0, lineHeight: 1.7, maxWidth: '56ch' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA dark ── */}
      <section className="loc-cta-sec" style={{ background: '#0a0d1a', padding: '80px 0' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px,5vw,48px)', textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', color: '#fff',
            margin: '0 0 18px', lineHeight: 1.1, paddingBottom: 2,
          }}>
            Trouvez votre <em style={{ color: BAI.caramel }}>chez-vous.</em>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 16,
            margin: '0 auto 32px', maxWidth: '46ch', lineHeight: 1.65,
          }}>
            Inscrivez-vous, constituez votre dossier une fois, postulez partout.
            Gratuit, rapide, serieux.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/search"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '14px 26px', borderRadius: 8,
                fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                background: BAI.caramel, color: '#fff', textDecoration: 'none',
                minHeight: 44,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.caramelHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = BAI.caramel }}
            >
              Lancer ma recherche <ArrowRight size={16} />
            </Link>
            <Link
              to="/register?role=TENANT"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '14px 26px', borderRadius: 8,
                fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                background: 'transparent', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none',
                minHeight: 44,
              }}
            >
              Creer mon dossier
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
