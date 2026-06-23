import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, MapPin, FolderOpen, MessageSquare, FileText, Search, Clock, Users } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useDarkSection } from '../../hooks/useDarkSection'

const STEPS = [
  {
    num: '1',
    title: 'Constituez votre dossier.',
    desc: "Identité, bulletins de salaire, avis d'imposition, garant si nécessaire. Vous téléversez une fois, on vérifie la cohérence des documents.",
  },
  {
    num: '2',
    title: 'Postulez en un clic.',
    desc: "Vous voyez un bien qui vous intéresse, vous postulez. Le propriétaire reçoit votre dossier déjà complet, pas de relance, pas de PDF par mail.",
  },
  {
    num: '3',
    title: 'Visitez et échangez.',
    desc: "Messagerie directe avec le propriétaire intégrée à la plateforme. La visite se programme sans exposer vos coordonnées personnelles.",
  },
  {
    num: '4',
    title: 'Signez et emménagez.',
    desc: "Bail électronique conforme loi ALUR, état des lieux guidé depuis votre téléphone. Vous virez votre loyer directement et recevez votre quittance automatiquement.",
  },
]

const DOSSIER_DOCS = [
  { label: "Pièce d'identité", status: 'verified' },
  { label: '3 derniers bulletins de salaire', status: 'verified' },
  { label: "Avis d'imposition", status: 'verified' },
  { label: 'Garant (optionnel)', status: 'pending' },
]

const STATS_DARK = [
  { value: '0 €',   label: 'De frais d\'agence',           icon: <MapPin size={20} /> },
  { value: 'eIDAS', label: 'Signature électronique légale', icon: <Users size={20} /> },
  { value: '5 min', label: 'Pour constituer son dossier',   icon: <Clock size={20} /> },
]

const FEATURE_TENANT = [
  { icon: <FolderOpen size={20} />, title: 'Dossier numérique', desc: 'Un dossier complet, constitué une fois, réutilisable pour toutes vos candidatures sur la plateforme.', color: BAI.tenant },
  { icon: <Search size={20} />, title: 'Recherche intelligente', desc: 'Filtrez par ville, budget, surface, équipements. Créez des alertes pour être notifié en temps réel.', color: BAI.caramel },
  { icon: <MessageSquare size={20} />, title: 'Messagerie directe', desc: 'Échangez directement avec les propriétaires sans intermédiaire, en toute confidentialité.', color: BAI.owner },
  { icon: <FileText size={20} />, title: 'Signature du bail', desc: 'Bail électronique conforme loi ALUR avec signature eIDAS, accessible depuis votre téléphone.', color: BAI.tenant },
]

export default function Locataires() {
  const heroRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
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
          .hero-grid    { grid-template-columns: 1fr !important; gap: 28px !important; }
          .loc-hero-sec { padding: 56px 0 64px !important; }
          .loc-cta-sec  { padding: 56px 0 !important; }
          .loc-feat-grid { grid-template-columns: 1fr 1fr !important; }
          .loc-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .loc-btn-group { flex-direction: column !important; }
          .loc-btn-group a { width: 100% !important; justify-content: center !important; }
          .loc-feat-grid { grid-template-columns: 1fr !important; }
        }
        .loc-feat-grid  { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
        .loc-stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
      `}</style>

      <Header />

      {/* ── HERO dark ── */}
      <section ref={heroRef} className="loc-hero-sec" style={{ background: '#0a0d1a', color: '#fff', padding: '80px 0 100px', overflow: 'hidden', position: 'relative' }}>
        {/* Ambient orb */}
        <div aria-hidden style={{
          position: 'absolute', top: '15%', left: '-40px',
          width: 360, height: 100, borderRadius: '50%',
          background: 'rgba(27,94,59,0.12)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, transparent, rgba(10,13,26,0.6))',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 2 }}>
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
                Trouvez votre{' '}
                <em style={{ color: BAI.caramel }}>logement idéal.</em>
              </h1>

              <p style={{
                fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6, maxWidth: 520, margin: '0 0 28px',
              }}>
                Constituez votre dossier numérique une fois pour toutes. Postulez en un clic.
                Communiquez en direct avec le propriétaire. Signez votre bail en ligne.
              </p>

              {/* Search bar — glassmorphisme dans le hero */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/search')}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate('/search')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, padding: '12px 16px',
                  cursor: 'pointer', marginBottom: 24,
                  maxWidth: 440,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              >
                <MapPin size={16} color={BAI.caramel} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', flex: 1 }}>
                  Ville, quartier, code postal…
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7,
                  background: BAI.caramel, color: '#fff',
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                  flexShrink: 0,
                }}>
                  <Search size={12} />
                  Rechercher
                </div>
              </div>

              <div className="loc-btn-group" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                <Link
                  to="/register?role=TENANT"
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
                  Créer mon dossier <ArrowRight size={16} />
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
                      <span style={{ color: '#5fcf96', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} />
                        Vérifié
                      </span>
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

      {/* ── PROCESSUS: editorial numbered list ── */}
      <section style={{ padding: 'clamp(48px,8vh,96px) 0', background: BAI.bgBase }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 48px', paddingBottom: 2,
          }}>
            Du clic <em style={{ color: BAI.caramel }}>aux clés.</em>
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

      {/* ── STATS SOMBRES ── */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(48px,6vh,72px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 10px',
            }}>
              En chiffres
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(24px,4vw,38px)', color: '#fff',
              margin: 0, lineHeight: 1.1,
            }}>
              Bailio,{' '}<em style={{ color: BAI.caramel }}>ça marche.</em>
            </h2>
          </div>

          <div className="loc-stats-grid">
            {STATS_DARK.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '28px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(27,94,59,0.28)',
                  color: '#5fcf96',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <p style={{
                    fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                    fontSize: 'clamp(26px,4vw,38px)', color: '#fff',
                    margin: 0, lineHeight: 1,
                  }}>
                    {stat.value}
                  </p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.50)', margin: '6px 0 0' }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES LOCATAIRE ── */}
      <section style={{ padding: 'clamp(48px,6vh,80px) 0', background: BAI.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 12px',
            }}>
              Pour vous
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(26px,4vw,40px)', color: BAI.ink,
              margin: 0, lineHeight: 1.1,
            }}>
              Tout pour faciliter <em style={{ color: BAI.caramel }}>votre recherche.</em>
            </h2>
          </div>

          <div className="loc-feat-grid">
            {FEATURE_TENANT.map((feat) => (
              <div
                key={feat.title}
                style={{
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 12,
                  padding: '22px 20px',
                  boxShadow: BAI.shadowSm,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: feat.color === BAI.caramel ? BAI.caramelLight : feat.color === BAI.tenant ? BAI.tenantLight : BAI.ownerLight,
                  color: feat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  {feat.icon}
                </div>
                <h4 style={{
                  fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700,
                  color: BAI.ink, margin: '0 0 8px',
                }}>
                  {feat.title}
                </h4>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IA Dossier highlight ── */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(48px,7vh,80px) clamp(20px,5vw,48px)', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div aria-hidden style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.08) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.30)', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: BAI.caramel }}>✦ Intelligence Artificielle</span>
            </span>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,42px)', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
              Votre dossier, optimisé par l'IA.
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 16, color: 'rgba(255,255,255,0.55)', marginTop: 12, lineHeight: 1.6 }}>
              Téléchargez vos documents une fois. Notre IA les analyse, les vérifie et constitue un dossier professionnel prêt à partager.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              {
                icon: '📄',
                title: 'Lecture OCR automatique',
                desc: "L'IA extrait les informations clés de vos documents : nom, revenus, dates. Fini la saisie manuelle.",
              },
              {
                icon: '✅',
                title: 'Vérification de cohérence',
                desc: 'Les documents sont croisés entre eux. Une incohérence ? Vous êtes alerté avant d\'envoyer.',
              },
              {
                icon: '📤',
                title: 'Partage en un clic',
                desc: 'Un lien sécurisé. Le propriétaire consulte votre dossier complet sans email, sans PDF.',
              },
              {
                icon: '🔄',
                title: 'Réutilisable partout',
                desc: 'Constituez-le une fois, postulez pour tous les biens qui vous intéressent sur Bailio.',
              },
            ].map((f) => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 16,
                padding: '24px 20px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: '#ffffff', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/register?role=TENANT"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: BAI.caramel, color: '#fff',
                borderRadius: 8, padding: '14px 28px',
                fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                textDecoration: 'none',
              }}>
              Créer mon dossier gratuitement <ArrowRight size={15} />
            </Link>
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
            Commencez votre <em style={{ color: BAI.caramel }}>recherche.</em>
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 16,
            margin: '0 auto 32px', maxWidth: '46ch', lineHeight: 1.65,
          }}>
            Inscrivez-vous, constituez votre dossier une fois, postulez partout.
            Gratuit, rapide, sérieux.
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
