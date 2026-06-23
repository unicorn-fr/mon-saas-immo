import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'
import { useDarkSection } from '../../hooks/useDarkSection'

const STEPS = [
  {
    num: '01',
    title: 'Publiez votre bien',
    desc: 'Photos, surface, loyer. Votre annonce est en ligne en 8 minutes.',
  },
  {
    num: '02',
    title: 'Choisissez votre locataire',
    desc: 'Les candidats arrivent avec dossiers vérifiés. Vous choisissez.',
  },
  {
    num: '03',
    title: 'Gérez en ligne',
    desc: 'Loyers, quittances, contrats. Tout centralisé sur Bailio.',
  },
]

const PERKS = [
  'Bail conforme loi ALUR signé en ligne',
  'Messagerie sécurisée avec vos locataires',
  'Visites organisées avec créneaux en ligne',
  'Zéro frais d\'agence',
]

export default function Proprietaires() {
  const heroRef = useRef<HTMLDivElement>(null)
  useDarkSection(heroRef)

  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        .prop-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        .prop-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          min-height: 480px;
        }

        .prop-btn-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: #c4976a;
          color: #fff;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background .18s;
          min-height: 48px;
        }
        .prop-btn-main:hover { background: #b07f54; }

        .prop-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          text-decoration: none;
          cursor: pointer;
          transition: background .18s;
          min-height: 48px;
        }
        .prop-btn-ghost:hover { background: rgba(255,255,255,0.15); }

        .prop-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          text-decoration: none;
          cursor: pointer;
          transition: border-color .18s, background .18s;
          min-height: 48px;
        }
        .prop-btn-outline:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.5); }

        @media (max-width: 768px) {
          .prop-steps { grid-template-columns: 1fr !important; }
          .prop-split { grid-template-columns: 1fr !important; }
          .prop-split-img { min-height: 280px !important; order: -1; }
          .prop-hero-btns { flex-direction: column !important; }
          .prop-btn-main, .prop-btn-ghost, .prop-btn-outline { width: 100% !important; justify-content: center !important; }
        }
        @media (max-width: 640px) {
          .prop-steps { gap: 0 !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        position: 'relative',
        background: '#0a0d1a',
        color: '#fff',
        overflow: 'hidden',
        padding: 'clamp(64px,10vh,100px) 0 clamp(64px,9vh,96px)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: '-20%', right: '-80px',
          width: 500, height: 160, borderRadius: '50%',
          background: 'rgba(196,151,106,0.07)', filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)', position: 'relative', zIndex: 2 }}>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 16px',
          }}>
            Pour les propriétaires
          </p>

          <h1 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(36px,6vw,68px)', lineHeight: 1.04,
            color: '#fff', margin: '0 0 20px',
          }}>
            Gérez votre patrimoine{' '}
            <span style={{ color: BAI.caramel }}>sans agence.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px,1.4vw,18px)', color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.65, maxWidth: 520, margin: '0 0 40px',
          }}>
            Annonce, candidats, bail, loyers. Tout en un seul endroit.
          </p>

          <div className="prop-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register?role=OWNER" className="prop-btn-main">
              Commencer gratuitement <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="prop-btn-ghost">
              Voir les tarifs
            </Link>
          </div>

          {/* Stats inline */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 52 }}>
            {[
              { val: '8 min', label: 'pour publier' },
              { val: '0 €', label: 'de frais d\'agence' },
              { val: '100%', label: 'en ligne' },
            ].map(s => (
              <div key={s.val}>
                <p style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(22px,3vw,32px)', color: BAI.caramel,
                  margin: 0, lineHeight: 1,
                }}>
                  {s.val}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 ÉTAPES ── */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(48px,7vh,80px) 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(26px,3.5vw,40px)', color: BAI.ink,
            margin: '0 0 clamp(32px,5vh,52px)', textAlign: 'center',
          }}>
            Simple comme <span style={{ color: BAI.caramel }}>1, 2, 3.</span>
          </h2>

          <div className="prop-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  padding: 'clamp(24px,4vw,40px) clamp(20px,3vw,36px)',
                  borderRight: i < STEPS.length - 1 ? `1px solid ${BAI.border}` : 'none',
                  position: 'relative',
                }}
              >
                <p style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 48, color: BAI.border, lineHeight: 1, margin: '0 0 16px',
                }}>
                  {step.num}
                </p>
                <h3 style={{
                  fontFamily: BAI.fontBody, fontSize: 17, fontWeight: 700,
                  color: BAI.ink, margin: '0 0 10px',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.65, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT: PHOTO + LISTE ── */}
      <section style={{ background: BAI.bgMuted }}>
        <div className="prop-split" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Photo */}
          <div
            className="prop-split-img"
            style={{
              position: 'relative',
              overflow: 'hidden',
              minHeight: 420,
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80"
              alt="Appartement bien géré"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}
            />
            {/* Glass badge */}
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              background: 'rgba(10,13,26,0.72)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '14px 18px',
              color: '#fff',
            }}>
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 26, margin: 0, color: BAI.caramel, lineHeight: 1 }}>
                +14
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                candidatures reçues
              </p>
            </div>
          </div>

          {/* Texte */}
          <div style={{
            padding: 'clamp(40px,6vw,72px) clamp(24px,5vw,60px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 14px',
            }}>
              Ce que vous gagnez
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(24px,3vw,36px)', color: BAI.ink,
              margin: '0 0 28px', lineHeight: 1.15,
            }}>
              Tout ce qu'une agence fait,{' '}
              <span style={{ color: BAI.caramel }}>sans les 8 %.</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PERKS.map(perk => (
                <div key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: BAI.ownerLight, color: BAI.owner,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Check size={13} strokeWidth={2.5} />
                  </div>
                  <p style={{ fontSize: 15, color: BAI.ink, margin: 0, lineHeight: 1.5 }}>
                    {perk}
                  </p>
                </div>
              ))}
            </div>

            <Link
              to="/register?role=OWNER"
              className="prop-btn-main"
              style={{ alignSelf: 'flex-start', marginTop: 36 }}
            >
              Essayer gratuitement <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Réassurance juridique ── */}
      <section style={{ background: BAI.bgSurface, borderTop: `1px solid ${BAI.border}`, padding: 'clamp(48px,7vh,80px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
              Protection juridique
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,38px)', color: BAI.ink, margin: '0 0 12px', lineHeight: 1.1 }}>
              Louer en toute sérénité.
            </h2>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 16, color: BAI.inkMid, margin: 0, lineHeight: 1.6, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
              Chaque bail généré sur Bailio respecte le cadre légal français. Vous êtes protégé à chaque étape.
            </p>
          </div>

          {/* Grille de garanties */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
            {[
              {
                icon: '⚖️',
                title: 'Bail loi ALUR conforme',
                desc: 'Chaque contrat est généré à partir du modèle officiel loi ALUR du 24 mars 2014. Clauses légales incluses, erreurs de rédaction évitées.',
                badge: 'Modèle officiel',
                badgeColor: BAI.ownerLight,
                badgeBorder: BAI.ownerBorder,
                badgeText: BAI.owner,
              },
              {
                icon: '✍️',
                title: 'Signature eIDAS certifiée',
                desc: "La signature électronique a la même valeur légale qu'une signature manuscrite. Horodatée, non répudiable, archivée.",
                badge: 'Valeur légale',
                badgeColor: BAI.tenantLight,
                badgeBorder: BAI.tenantBorder,
                badgeText: BAI.tenant,
              },
              {
                icon: '🔒',
                title: 'Données chiffrées RGPD',
                desc: 'Vos données et celles de vos locataires sont chiffrées AES-256 et hébergées en Europe. Conformité CNIL totale.',
                badge: 'RGPD / CNIL',
                badgeColor: BAI.caramelLight,
                badgeBorder: BAI.caramelBorder,
                badgeText: BAI.inkMid,
              },
              {
                icon: '📋',
                title: 'État des lieux numérique',
                desc: 'Réalisé depuis votre téléphone, signé électroniquement par les deux parties. Valeur probante en cas de litige.',
                badge: 'Double signature',
                badgeColor: BAI.bgMuted,
                badgeBorder: BAI.border,
                badgeText: BAI.inkMid,
              },
              {
                icon: '🧾',
                title: 'Quittances automatiques',
                desc: 'Générées et envoyées automatiquement à chaque loyer payé. Obligation légale respectée sans effort (art. 21 loi 1989).',
                badge: 'Automatique',
                badgeColor: BAI.tenantLight,
                badgeBorder: BAI.tenantBorder,
                badgeText: BAI.tenant,
              },
              {
                icon: '📈',
                title: 'Révision IRL encadrée',
                desc: 'Outil de calcul basé sur les indices INSEE publiés chaque trimestre. Révision dans les limites légales, jamais au-delà.',
                badge: 'Indice INSEE',
                badgeColor: BAI.ownerLight,
                badgeBorder: BAI.ownerBorder,
                badgeText: BAI.owner,
              },
            ].map((item) => (
              <div key={item.title} style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 16,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: BAI.shadowMd,
              }}>
                <div style={{ fontSize: 28 }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink, margin: '0 0 4px' }}>
                    {item.title}
                  </h3>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: item.badgeColor, border: `1px solid ${item.badgeBorder}`,
                    color: item.badgeText, padding: '2px 8px', borderRadius: 4,
                  }}>
                    {item.badge}
                  </span>
                </div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.6, flex: 1 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bandeau bas — conformité */}
          <div style={{
            background: BAI.bgMuted,
            border: `1px solid ${BAI.border}`,
            borderRadius: 12,
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: BAI.ink, margin: '0 0 4px' }}>
                Conformité mise à jour automatiquement
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.5 }}>
                Notre équipe juridique surveille les évolutions du droit locatif français. Vos contrats sont toujours à jour.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['Loi ALUR', 'Loi Élan', 'Loi Boutin', 'Décret 2019-650'].map(law => (
                <span key={law} style={{
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                  color: BAI.inkMid, background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`, borderRadius: 6,
                  padding: '4px 10px',
                }}>
                  {law}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(56px,9vh,96px) 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4.5vw,52px)', color: '#fff',
            margin: '0 0 16px', lineHeight: 1.08,
          }}>
            Votre prochain locataire{' '}
            <span style={{ color: BAI.caramel }}>vous attend.</span>
          </h2>
          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.6)',
            margin: '0 auto 36px', lineHeight: 1.65,
          }}>
            Rejoignez les propriétaires qui gèrent tout depuis Bailio.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=OWNER" className="prop-btn-main">
              Publier mon bien <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="prop-btn-outline">
              Voir les tarifs
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '24px 0 0' }}>
            14 jours d'essai · Sans carte bancaire · Résiliable à tout moment
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
