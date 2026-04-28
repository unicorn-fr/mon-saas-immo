import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const STEPS = [
  {
    n: '01',
    title: 'Crée ton dossier.',
    desc: "Identité, bulletins de salaire, avis d'imposition, garant si nécessaire. Tu téléverses une fois, on vérifie la cohérence des documents.",
  },
  {
    n: '02',
    title: 'Postule en un clic.',
    desc: "Tu vois un bien qui t'intéresse, tu postules. Le propriétaire reçoit ton dossier déjà complet — pas de relance, pas de PDF par mail.",
  },
  {
    n: '03',
    title: 'Visite et échange.',
    desc: "Messagerie directe avec le propriétaire intégrée à la plateforme. La visite se programme sans exposer tes coordonnées personnelles.",
  },
  {
    n: '04',
    title: 'Signe et emménage.',
    desc: "Bail électronique conforme loi ALUR, état des lieux guidé depuis ton téléphone, prélèvement SEPA mis en place. Tu peux te concentrer sur les cartons.",
  },
]

const DOSSIER_DOCS = [
  { label: "Pièce d'identité", status: 'verified' },
  { label: '3 derniers bulletins de salaire', status: 'verified' },
  { label: "Avis d'imposition", status: 'verified' },
  { label: 'Garant (optionnel)', status: 'pending' },
]

export default function Locataires() {
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
          .hero-grid  { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO dark ── */}
      <section style={{ background: BAI.night, color: '#fff', padding: '80px 0 100px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

            {/* Left — copy */}
            <div>
              {/* eyebrow pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.35)',
                color: BAI.caramel, padding: '6px 14px', borderRadius: 999,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: 28,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: BAI.caramel,
                  animation: 'pulse-dot 2s infinite', display: 'inline-block',
                }} />
                Pour les locataires
              </span>

              <h1 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(38px,6vw,72px)', lineHeight: 1.02,
                letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px', maxWidth: '16ch',
              }}>
                Loue plus vite.{' '}
                <em style={{ color: BAI.caramel }}>Sans dossier papier.</em>
              </h1>

              <p style={{
                fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6, maxWidth: 520, margin: '0 0 40px',
              }}>
                Constitue ton dossier numérique une fois pour toutes. Postule en un clic.
                Communique en direct avec le propriétaire. Signe ton bail en ligne, depuis ton canapé.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
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
                  Créer mon dossier
                </Link>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                100 % gratuit · pour toujours · garanti
              </p>
            </div>

            {/* Right — dossier preview card */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
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
                      <span style={{ color: BAI.caramel, fontWeight: 600 }}>✓ Vérifié</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>À ajouter</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Score de fiabilité */}
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
                  Score de fiabilité
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PROCESSUS light ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: BAI.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 14px',
          }}>
            Processus
          </p>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 16px',
          }}>
            Du clic <em style={{ color: BAI.caramel }}>aux clés.</em>
          </h2>
          <p style={{
            fontSize: 16, color: BAI.inkMid, lineHeight: 1.65,
            maxWidth: '56ch', margin: '0 0 48px',
          }}>
            Quatre étapes, pas une de plus. Et tout reste dans ton espace, à vie.
          </p>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {STEPS.map(step => (
              <div
                key={step.n}
                style={{
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <p style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 42, color: BAI.caramel, margin: 0, lineHeight: 1,
                }}>
                  {step.n}
                </p>
                <h4 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 20, margin: '12px 0 8px', color: BAI.ink,
                }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: 13.5, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA dark ── */}
      <section style={{ background: BAI.night, padding: '80px 0' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px,5vw,48px)', textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', color: '#fff',
            margin: '0 0 18px', lineHeight: 1.1,
          }}>
            Trouve ton <em style={{ color: BAI.caramel }}>chez-toi.</em>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 16,
            margin: '0 auto 32px', maxWidth: '46ch',
          }}>
            Inscris-toi, constitue ton dossier une fois, postule partout.
            C'est gratuit, c'est rapide, c'est pour de vrai.
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
              Créer mon dossier
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
