import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { BAI } from '../../constants/bailio-tokens'

const PRINCIPLES = [
  {
    title: 'Simple avant tout.',
    desc: "Chercher un appartement ou gérer une location ne devrait pas demander des heures. Chaque fonctionnalité de Bailio est là pour que tu en passes moins.",
  },
  {
    title: 'Aucune commission cachée.',
    desc: "Pas de frais d'agence côté locataire. Un seul prix transparent côté propriétaire : 1 % du loyer mensuel, suspendu si le bien est vacant.",
  },
  {
    title: 'Données en France.',
    desc: "Hébergement sécurisé. Aucune revente. RGPD strict. Tu peux exporter ou supprimer ton compte en deux clics.",
  },
]

export default function APropos() {
  return (
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <Header />

      {/* ── SECTION 1 — Intro ── */}
      <section style={{ padding: '80px 0 60px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ maxWidth: 720 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 14px',
            }}>
              À propos
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1.05,
              color: BAI.ink, margin: '0 0 24px',
            }}>
              Louer ne devrait pas{' '}
              <em style={{ color: BAI.caramel }}>faire mal.</em>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: BAI.inkMid, margin: '0 0 20px' }}>
              Bailio est né d'un constat simple : chercher un appartement en France, c'est une épreuve. Dossiers refusés sans explication, agences qui prennent des centaines d'euros, bails imprimés en triple exemplaire. Ce n'est pas normal.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: BAI.inkMid, margin: 0 }}>
              La plateforme existe pour que ça change — pour les locataires comme pour les propriétaires.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — Principes ── */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(72px,12vh,130px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 40px',
          }}>
            Nos principes.
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {PRINCIPLES.map(p => (
              <div key={p.title} style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: 12, padding: 28,
                boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
              }}>
                <h4 style={{
                  fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                  fontSize: 22, color: BAI.ink, margin: '0 0 10px',
                }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.65, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — Fondateur ── */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(72px,12vh,130px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1,
            color: BAI.ink, margin: '0 0 48px',
          }}>
            Le fondateur.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 'clamp(32px,5vw,64px)',
            alignItems: 'start',
            maxWidth: 800,
          }}>
            {/* Avatar */}
            <div style={{
              width: 'clamp(100px,14vw,148px)',
              aspectRatio: '1',
              background: `linear-gradient(135deg, #fdf5ec, #e8ccaa)`,
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(48px,7vw,80px)', color: '#b07f54', lineHeight: 1,
              }}>
                E
              </span>
            </div>

            {/* Bio */}
            <div>
              <p style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(22px,3vw,32px)', color: BAI.ink, margin: '0 0 4px',
              }}>
                Enzo
              </p>
              <p style={{ fontSize: 13, color: BAI.inkFaint, margin: '0 0 24px' }}>
                Fondateur & développeur · Étudiant entrepreneur
              </p>

              <p style={{ fontSize: 16, lineHeight: 1.75, color: BAI.inkMid, margin: '0 0 18px' }}>
                J'ai conçu et développé Bailio seul, parce que le marché locatif m'a toujours intrigué. Plus tard, quand j'en aurai la possibilité, j'aimerais acheter des appartements — et avoir un outil vraiment adapté à ça.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: BAI.inkMid, margin: '0 0 18px' }}>
                Mais le déclencheur concret, c'est ma recherche d'appartement à Montpellier pour mes études. Une galère pas possible : dossiers mal lus, agences injoignables, processus kafkaïens. Trop de temps perdu pour quelque chose qui devrait être simple.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: BAI.inkMid, margin: '0 0 32px' }}>
                Bailio, c'est la réponse à ça. Une plateforme pensée pour les deux côtés — locataires qui méritent un processus clair, propriétaires qui méritent un outil efficace — sans intermédiaires inutiles, sans frais absurdes.
              </p>

              <Link
                to="/contact"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 8,
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                  background: BAI.night, color: '#fff', textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
              >
                Écrire à Enzo <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
