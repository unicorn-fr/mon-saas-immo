import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Header } from '../../components/layout/Header'

const T = {
  bgBase:    '#fafaf8',
  bgSurface: '#ffffff',
  bgMuted:   '#f4f2ee',
  ink:       '#0d0c0a',
  inkMid:    '#5a5754',
  inkFaint:  '#9e9b96',
  night:     '#1a1a2e',
  caramel:   '#c4976a',
  caramelHover: '#b07f54',
  tenant:    '#1b5e3b',
  tenantLight: '#edf7f2',
  border:    '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const STEPS = [
  {
    n: '01',
    title: 'Crée ton dossier.',
    desc: 'Identité, bulletins de salaire, avis d\'imposition, garant si nécessaire. Tu téléverses une fois, on vérifie la cohérence des documents.',
  },
  {
    n: '02',
    title: 'Postule en un clic.',
    desc: 'Tu vois un bien qui t\'intéresse, tu postules. Le propriétaire reçoit ton dossier déjà complet — pas de relance, pas de PDF par mail.',
  },
  {
    n: '03',
    title: 'Visite et échange.',
    desc: 'Messagerie directe avec le propriétaire intégrée à la plateforme. La visite se programme sans exposer tes coordonnées personnelles.',
  },
  {
    n: '04',
    title: 'Signe et emménage.',
    desc: 'Bail électronique conforme loi ALUR, état des lieux guidé depuis ton téléphone, prélèvement SEPA mis en place. Tu peux te concentrer sur les cartons.',
  },
]

const BENEFITS = [
  { title: 'Dossier unique.', desc: 'Tu le crées une fois. Il te suit pour toutes tes candidatures, sur tous les biens Bailio. Pas de scan, pas de PDF par mail.' },
  { title: 'Messagerie sécurisée.', desc: 'Tu communiques directement avec le propriétaire sans exposer ton numéro ou ton adresse. Tout l\'historique reste dans ton espace.' },
  { title: 'Bail en ligne.', desc: 'Signé électroniquement via un prestataire certifié eIDAS. Il a la même valeur légale qu\'un bail papier — et tu y accèdes à vie.' },
  { title: '100 % gratuit.', desc: 'Pas de frais de dossier, pas de frais d\'agence côté locataire. La loi ALUR l\'interdit — et on le respecte scrupuleusement.' },
]

const DOSSIER_DOCS = [
  { label: 'Pièce d\'identité', status: 'verified' },
  { label: '3 derniers bulletins de salaire', status: 'verified' },
  { label: 'Avis d\'imposition', status: 'verified' },
  { label: 'Garant (optionnel)', status: 'pending' },
]

export default function Locataires() {
  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes cloud1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-60px)} }
        @keyframes cloud2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(50px)} }
        @keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(196,151,106,0.6)} 70%{box-shadow:0 0 0 10px rgba(196,151,106,0)} 100%{box-shadow:0 0 0 0 rgba(196,151,106,0)} }
        @media (max-width: 768px) {
          .hero-grid  { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .bene-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', background: T.night, color: '#fff', overflow: 'hidden', padding: 'clamp(64px,10vh,110px) 0 clamp(80px,12vh,130px)' }}>
        <div style={{ position: 'absolute', width: 340, height: 100, top: '12%', right: -80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud1 22s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 260, height: 80, top: '48%', left: '50%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud2 28s ease-in-out infinite', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 2 }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.35)', color: T.caramel, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.caramel, animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                Pour les locataires
              </span>
              <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(38px,6vw,72px)', lineHeight: 1.02, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px', maxWidth: '16ch' }}>
                Loue plus vite. <em style={{ color: T.caramel }}>Sans dossier papier.</em>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 520, margin: '0 0 40px' }}>
                Constitue ton dossier numérique une fois pour toutes. Postule en un clic. Communique directement avec le propriétaire. Signe ton bail en ligne.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.caramelHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.caramel }}
                >
                  Chercher mon logement <ArrowRight size={16} />
                </Link>
                <Link to="/register?role=TENANT" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                >
                  Créer mon dossier
                </Link>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                100 % gratuit · pour toujours · garanti
              </p>
            </div>

            {/* Dossier preview card */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28 }}>
              <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.caramel, fontWeight: 700, margin: '0 0 18px' }}>Mon dossier locatif</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DOSSIER_DOCS.map(doc => (
                  <div key={doc.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13, color: '#fff' }}>
                    <span>{doc.label}</span>
                    {doc.status === 'verified' ? (
                      <span style={{ color: T.caramel, fontWeight: 600 }}>✓ Vérifié</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>À ajouter</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Complétude du dossier</p>
                <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: '75%', background: T.caramel, borderRadius: 3 }} />
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>3 documents sur 4 vérifiés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESSUS ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Processus</p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 16px' }}>
            Du clic <em style={{ color: T.caramel }}>aux clés.</em>
          </h2>
          <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, maxWidth: '56ch', margin: '0 0 48px' }}>
            Quatre étapes, pas une de plus. Et tout reste dans ton espace, à vie.
          </p>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 42, color: T.caramel, margin: 0, lineHeight: 1 }}>{step.n}</p>
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, margin: '12px 0 8px', color: T.ink }}>{step.title}</h4>
                <p style={{ fontSize: 13.5, color: T.inkMid, margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Pourquoi Bailio</p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 48px' }}>
            Conçu pour <em style={{ color: T.caramel }}>ta tranquillité.</em>
          </h2>
          <div className="bene-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            {BENEFITS.map(b => (
              <div key={b.title}
                style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, transition: 'all .25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10)'; el.style.borderColor = '#9fd4ba' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = T.border }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.tenant, marginBottom: 16 }} />
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, margin: '0 0 10px', color: T.ink }}>{b.title}</h4>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: T.night, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', margin: '0 0 18px', lineHeight: 1.1 }}>
            Trouve ton <em style={{ color: T.caramel }}>chez-toi.</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto 32px', maxWidth: '46ch' }}>
            Inscris-toi, constitue ton dossier une fois, postule partout. C'est gratuit, c'est rapide, c'est pour de vrai.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}>
              Lancer ma recherche <ArrowRight size={16} />
            </Link>
            <Link to="/register?role=TENANT" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              Créer mon dossier
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ background: T.night, padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>© {new Date().getFullYear()} Bailio. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[{ to: '/cgu', label: 'CGU' }, { to: '/confidentialite', label: 'Confidentialité' }, { to: '/mentions-legales', label: 'Mentions légales' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
