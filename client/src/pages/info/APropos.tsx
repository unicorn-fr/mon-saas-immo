import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Header } from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

const T = {
  bgBase:    '#fafaf8',
  bgSurface: '#ffffff',
  bgMuted:   '#f4f2ee',
  ink:       '#0d0c0a',
  inkMid:    '#5a5754',
  inkFaint:  '#9e9b96',
  night:     '#1a1a2e',
  caramel:   '#c4976a',
  border:    '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const PRINCIPLES = [
  {
    title: 'Tutoiement.',
    desc: 'On parle comme à un ami. Pas de jargon notarial, pas de formules marketing creuses. La loi ALUR expliquée en clair.',
  },
  {
    title: 'Aucune commission.',
    desc: 'Pas de frais d\'agence, pas de pourcentage caché côté locataire. Un seul prix transparent côté propriétaire.',
  },
  {
    title: 'Données en France.',
    desc: 'Hébergement sécurisé, aucune revente. RGPD strict. Tu peux exporter ou supprimer ton compte en deux clics.',
  },
]

const VALUES = [
  {
    title: 'Transparence.',
    desc: 'Les tarifs sont affichés, les dossiers expliqués, les décisions justifiées. Pas de boîte noire.',
  },
  {
    title: 'Sobriété.',
    desc: 'On ne construit pas de fonctionnalités pour grossir un pitch deck. Chaque écran existe parce qu\'il résout un problème réel.',
  },
  {
    title: 'Confiance.',
    desc: 'Propriétaire et locataire doivent pouvoir se faire confiance. Bailio est le cadre neutre qui rend ça possible.',
  },
]

export default function APropos() {
  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0 clamp(40px,6vh,64px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>
              À propos
            </p>
            <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1.05, margin: '0 0 24px' }}>
              Louer ne devrait pas <em style={{ color: T.caramel }}>faire mal.</em>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: T.inkMid, maxWidth: '60ch', margin: 0 }}>
              Bailio est né d'un constat simple : entre les agences à 1 100 €, les dossiers refusés sans explication, les bails imprimés en triple exemplaire et les quittances oubliées, louer en France reste une corvée. On a décidé de la réécrire.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRINCIPES ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 40px' }}>
            Nos <em style={{ color: T.caramel }}>principes.</em>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: 24 }}>
            {PRINCIPLES.map(p => (
              <div key={p.title} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 }}>
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, margin: '0 0 10px', color: T.ink }}>{p.title}</h4>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px,100%),1fr))', gap: 64, alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Notre mission</p>
              <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1, color: T.ink, margin: '0 0 24px' }}>
                Moins d'intermédiaires. <em style={{ color: T.caramel }}>Plus de confiance.</em>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: T.inkMid, margin: '0 0 16px' }}>
                On croit que propriétaires et locataires peuvent se faire confiance sans avoir besoin d'un intermédiaire payant entre eux. Bailio est le cadre technique, légal et humain qui rend ça possible.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: T.inkMid, margin: 0 }}>
                Chaque fonctionnalité a été conçue pour éliminer une friction réelle : la vérification de dossier évite les allers-retours, la signature électronique supprime le rendez-vous, l'encaissement automatique efface la relance mensuelle.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {VALUES.map(v => (
                <div key={v.title} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px 28px' }}>
                  <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, margin: '0 0 8px', color: T.ink }}>{v.title}</h4>
                  <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONFORMITÉ ── */}
      <section style={{ padding: 'clamp(48px,8vh,80px) 0', background: T.bgMuted, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%),1fr))', gap: 32 }}>
            {[
              { label: 'Conforme', sub: 'Loi ALUR · bail électronique à valeur probante' },
              { label: 'RGPD', sub: 'Données hébergées en France, exportables et supprimables' },
              { label: 'eIDAS', sub: 'Signature électronique certifiée niveau avancé' },
              { label: '0 €', sub: 'Frais pour les locataires, à vie' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1, color: T.ink, margin: '0 0 8px' }}>{item.label}</p>
                <p style={{ fontSize: 12, color: T.inkFaint, margin: 0, lineHeight: 1.5 }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: T.night, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,3.5vw,40px)', color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
              Prêt à essayer <em style={{ color: T.caramel }}>autrement ?</em>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, margin: 0 }}>Inscris-toi en quelques minutes. Locataires : c'est gratuit, pour toujours.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}>
              Créer mon compte <ArrowRight size={16} />
            </Link>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
