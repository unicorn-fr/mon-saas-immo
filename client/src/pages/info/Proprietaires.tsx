import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
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
  caramelHover: '#b07f54',
  owner:     '#1a3270',
  ownerLight: '#eaf0fb',
  ownerBorder: '#b8ccf0',
  border:    '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const FEATURES = [
  {
    title: 'Annonce optimisée.',
    desc: 'Tu remplis les informations essentielles — surface, loyer, équipements. La plateforme structure ton annonce pour qu\'elle soit lisible et complète. Tu visualises avant publication.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
  },
  {
    title: 'Filtre intelligent.',
    desc: 'Chaque candidature arrive avec une analyse : taux d\'effort, stabilité professionnelle, cohérence des justificatifs. Tu compares en un coup d\'œil, sans dossier papier.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 11-3-3"/><path d="m19 8-3 3"/></svg>
    ),
  },
  {
    title: 'Encaissement automatique.',
    desc: 'Prélèvement SEPA le 5 du mois, virement sur ton compte le 7. Quittance envoyée au locataire dans la foulée. Zéro intervention de ta part.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
  {
    title: 'Bail 100 % en ligne.',
    desc: 'Conforme loi ALUR, signé via signature électronique à valeur probante (eIDAS). Généré automatiquement à partir des informations du dossier.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    ),
  },
  {
    title: 'État des lieux guidé.',
    desc: 'Pièce par pièce, photo par photo, depuis ton téléphone. Le locataire valide, tout est horodaté et archivé. À la sortie, on compare avec l\'entrée.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5z"/><path d="M22 19H2"/></svg>
    ),
  },
  {
    title: 'Garantie loyers (option).',
    desc: 'Jusqu\'à 96 000 € par sinistre, procédure juridique incluse. Activable en un clic depuis ton tableau de bord, proposé en partenariat avec un assureur agréé.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    ),
  },
]

const STEPS = [
  { n: '01', title: 'Publie ton annonce.', desc: 'Tu remplis les informations du bien, tu téléverses tes photos. En quelques minutes, l\'annonce est en ligne.' },
  { n: '02', title: 'Reçois les candidatures.', desc: 'Les dossiers arrivent avec une analyse de solvabilité. Tu consultes, tu compares, tu choisis.' },
  { n: '03', title: 'Signe le bail.', desc: 'Bail généré automatiquement, signé électroniquement par les deux parties. L\'entrée dans les lieux est planifiée.' },
  { n: '04', title: 'Encaisse chaque mois.', desc: 'SEPA automatique le 5, quittance envoyée dans la foulée. Tu reçois une notification si un paiement pose problème.' },
]

export default function Proprietaires() {
  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes cloud1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-60px)} }
        @keyframes cloud2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(50px)} }
        @keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(196,151,106,0.6)} 70%{box-shadow:0 0 0 10px rgba(196,151,106,0)} 100%{box-shadow:0 0 0 0 rgba(196,151,106,0)} }
        @media (max-width: 768px) {
          .hero-grid  { grid-template-columns: 1fr !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .dash-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .dash-bot   { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', background: T.night, color: '#fff', overflow: 'hidden', padding: 'clamp(64px,10vh,110px) 0 clamp(80px,12vh,130px)' }}>
        <div style={{ position: 'absolute', width: 340, height: 100, top: '12%', right: -80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud1 22s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 260, height: 80, top: '48%', left: '50%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud2 28s ease-in-out infinite', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 2 }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.35)', color: T.caramel, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.caramel, animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
                Pour les propriétaires
              </span>
              <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(38px,6vw,72px)', lineHeight: 1.02, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px', maxWidth: '16ch' }}>
                Loue ton bien <em style={{ color: T.caramel }}>sans agence.</em>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 520, margin: '0 0 40px' }}>
                Publie ton annonce. Reçois des candidatures vérifiées. Signe le bail en ligne. Les loyers tombent automatiquement. C'est tout.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register?role=OWNER" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.caramelHover }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.caramel }}
                >
                  Publier mon annonce <ArrowRight size={16} />
                </Link>
                <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                >
                  Voir la tarification
                </Link>
              </div>
            </div>

            {/* Calcul rapide card */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28 }}>
              <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.caramel, fontWeight: 700, margin: '0 0 16px' }}>Calcul rapide</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>Pour un loyer mensuel de 1 200 €</p>
              <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: '#fff', margin: '0', lineHeight: 1 }}>
                12 €<span style={{ fontFamily: T.fontBody, fontStyle: 'normal', fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 400, marginLeft: 6 }}>/mois</span>
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '8px 0 20px' }}>soit <strong style={{ color: T.caramel }}>144 €/an</strong> · contre ~1 100 € en agence classique</p>
              <div style={{ background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.3)', borderRadius: 8, padding: 14, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                <strong style={{ color: T.caramel }}>Économie estimée :</strong> plus de 950 € sur la première année par rapport à une agence classique.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CE QUE FAIT BAILIO ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Ce que fait Bailio</p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 16px' }}>
            Tout. <em style={{ color: T.caramel }}>Sauf à ta place.</em>
          </h2>
          <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, maxWidth: '60ch', margin: '0 0 52px' }}>
            Tu décides du loyer, tu choisis le locataire, tu signes. Bailio s'occupe du reste — vérification des dossiers, génération du bail, encaissement des loyers, envoi des quittances.
          </p>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))', gap: 20 }}>
            {FEATURES.map(feat => (
              <div key={feat.title}
                style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, transition: 'all .25s cubic-bezier(0.16,1,0.3,1)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10)'; el.style.borderColor = '#e8ccaa' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = T.border }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: T.ownerLight, color: T.owner, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {feat.icon}
                </div>
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, margin: '0 0 10px', color: T.ink }}>{feat.title}</h4>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Processus</p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 48px' }}>
            Quatre étapes. <em style={{ color: T.caramel }}>Pas une de plus.</em>
          </h2>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 42, color: T.caramel, margin: '0 0 0', lineHeight: 1 }}>{step.n}</p>
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, margin: '12px 0 8px', color: T.ink }}>{step.title}</h4>
                <p style={{ fontSize: 13.5, color: T.inkMid, margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APERÇU DASHBOARD ── */}
      <section style={{ padding: 'clamp(64px,10vh,110px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>Ton espace</p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 0 16px' }}>
            Un tableau de bord pour <em style={{ color: T.caramel }}>tout piloter.</em>
          </h2>
          <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, maxWidth: '56ch', margin: '0 0 40px' }}>
            Tes biens, tes loyers, tes candidatures, ta rentabilité — sur un seul écran. Accessible aussi depuis ton téléphone.
          </p>

          {/* Maquette dashboard */}
          <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(13,12,10,0.05), 0 4px 16px rgba(13,12,10,0.06)' }}>
            <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Loyers ce mois', value: '—', sub: 'Selon vos biens', color: T.owner },
                { label: 'Biens en gestion', value: '—', sub: 'Tableau de bord', color: T.owner },
                { label: 'Candidatures', value: '—', sub: 'En attente', color: T.caramel },
                { label: 'Rentabilité brute', value: '—', sub: 'Calculée en temps réel', color: '#1b5e3b' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: T.bgBase, border: `1px solid ${T.border}`, borderTop: `3px solid ${kpi.color}`, borderRadius: 10, padding: 18 }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.inkFaint, fontWeight: 600, margin: '0 0 8px' }}>{kpi.label}</p>
                  <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, margin: 0, color: T.ink }}>{kpi.value}</p>
                  <p style={{ fontSize: 12, color: T.inkMid, margin: '4px 0 0' }}>{kpi.sub}</p>
                </div>
              ))}
            </div>
            <div className="dash-bot" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 12px' }}>Activité récente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '✓', bg: '#edf7f2', col: '#1b5e3b', title: 'Loyer encaissé automatiquement', sub: 'SEPA · Le 5 du mois' },
                    { icon: '✉', bg: '#eaf0fb', col: T.owner, title: 'Nouvelle candidature reçue', sub: 'Dossier à consulter' },
                    { icon: '📄', bg: '#eaf0fb', col: T.owner, title: 'Bail signé électroniquement', sub: 'Conforme loi ALUR' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: T.bgBase, borderRadius: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, color: item.col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>{item.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.ink }}>{item.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: T.inkFaint }}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 12px' }}>Évolution des loyers</p>
                <div style={{ background: T.bgBase, borderRadius: 8, padding: 18, height: 160, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  {[55, 62, 58, 71, 75, 80, 88].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: i === 6 ? T.owner : T.ownerLight, height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: T.night, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', margin: '0 0 18px', lineHeight: 1.1 }}>
            Et si ton prochain locataire <em style={{ color: T.caramel }}>arrivait rapidement ?</em>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, margin: '0 auto 32px', maxWidth: '50ch' }}>
            Crée ton annonce gratuitement. Publie, reçois des candidatures, signe — tout depuis ton espace.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=OWNER" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}>
              Publier mon annonce <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              Voir les tarifs
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Gratuit pour commencer · Pas d'engagement
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
