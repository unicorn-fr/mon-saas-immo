import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Header } from '../components/layout/Header'

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
  caramelLight: '#fdf5ec',
  caramelBorder: '#e8ccaa',
  owner:     '#1a3270',
  ownerLight: '#eaf0fb',
  tenant:    '#1b5e3b',
  tenantLight: '#edf7f2',
  success:   '#1b5e3b',
  border:    '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const OWNER_FEATURES = [
  'Annonce publiée sur Bailio',
  'Analyse des candidatures',
  'Bail généré automatiquement (conforme loi ALUR)',
  'État des lieux guidé (entrée + sortie)',
  'Encaissement SEPA + quittances automatiques',
  'Garantie loyers impayés (option à 2,5 %)',
]

const TENANT_FEATURES = [
  'Dossier locatif numérique',
  'Candidature en un clic',
  'Messagerie directe avec le propriétaire',
  'Quittances et bail dans ton espace',
  'Accompagnement état des lieux',
  'Historique des locations conservé à vie',
]

const COMPARISON = [
  { label: 'Frais de mise en location', agency: '~ 1 100 €', bailio: '0 €', bailioGood: true },
  { label: 'Honoraires de gestion mensuels (loyer 1 200 €)', agency: '7 % · 84 €/mois', bailio: '1 % · 12 €/mois', bailioGood: true },
  { label: 'Renouvellement de bail', agency: '~ 250 €', bailio: '0 €', bailioGood: true },
  { label: 'Coût total — 1ère année', agency: '~ 2 358 €', bailio: '144 €', bailioGood: true, highlight: true },
]

const FAQ = [
  { q: 'Quand suis-je facturé en tant que propriétaire ?', a: 'Jamais avant la signature du bail. Une fois ton locataire installé, 1 % du loyer mensuel est prélevé sur chaque quittance. Si le bien est vacant, la facturation est suspendue automatiquement.' },
  { q: 'Bailio est vraiment gratuit pour les locataires ?', a: 'Oui, totalement. La loi ALUR interdit les frais à la charge du locataire lors de la mise en location. Nous allons plus loin : aucun frais, aucune surprise, pour toujours.' },
  { q: 'Comment fonctionne la garantie loyers impayés ?', a: 'C\'est une option activable depuis ton tableau de bord. Elle couvre jusqu\'à 96 000 € par sinistre, procédure juridique incluse, en partenariat avec un assureur agréé. Son coût est de 2,5 % du loyer mensuel.' },
  { q: 'Y a-t-il des frais cachés ?', a: 'Non. Le seul prélèvement est 1 % du loyer mensuel, visible sur chaque quittance. Aucun frais d\'entrée, aucun frais de dossier, aucun frais de sortie.' },
]

export default function Pricing() {
  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
      @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr !important; } .cmp-row { grid-template-columns: 1fr 1fr !important; gap: 4px !important; } .cmp-row span:first-child { grid-column: span 2; font-weight: 600; font-size: 12px; } }
      `}</style>

      <Header />

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(64px,10vh,100px) 0 clamp(32px,5vh,48px)', background: T.bgBase, textAlign: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>
            Tarifs simples
          </p>
          <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(36px,5vw,60px)', margin: '0 auto 18px', maxWidth: '18ch', lineHeight: 1.05 }}>
            Un prix juste. <em style={{ color: T.caramel }}>Pour tout le monde.</em>
          </h1>
          <p style={{ fontSize: 16, color: T.inkMid, maxWidth: '54ch', margin: '0 auto', lineHeight: 1.65 }}>
            Pas de frais d'entrée, pas de palier mystère. Tu paies seulement 1 % du loyer mensuel une fois ton bail signé — et les locataires ne paient rien, jamais.
          </p>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section style={{ padding: 'clamp(16px,3vh,24px) 0 clamp(64px,10vh,100px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 920, margin: '0 auto' }}>

            {/* Propriétaire */}
            <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.owner}`, borderRadius: 12, padding: 40 }}>
              <p style={{ fontSize: 13, color: T.owner, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Propriétaire</p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, margin: '0 0 14px', color: T.ink }}>Bailio Serein</h3>
              <div style={{ margin: '0 0 6px' }}>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: T.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>1</span>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, verticalAlign: 'super', color: T.inkFaint }}>%</span>
                <span style={{ fontFamily: T.fontBody, fontStyle: 'normal', fontSize: 15, color: T.inkFaint, fontWeight: 400, marginLeft: 8 }}>/ mois de loyer</span>
              </div>
              <p style={{ fontSize: 13, color: T.inkMid, margin: '0 0 28px', lineHeight: 1.55 }}>
                Prélevé automatiquement sur chaque quittance. Suspendu si le bien est vacant. Aucun frais si le bail n'est pas signé.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {OWNER_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 12, fontSize: 14, color: T.ink, padding: '10px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
                    <Check size={18} color={T.success} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=OWNER" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 8, fontFamily: T.fontBody, fontWeight: 600, fontSize: 15, background: T.night, color: '#fff', textDecoration: 'none', transition: 'opacity .15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Publier mon annonce <ArrowRight size={16} />
              </Link>
            </div>

            {/* Locataire */}
            <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.tenant}`, borderRadius: 12, padding: 40 }}>
              <p style={{ fontSize: 13, color: T.tenant, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Locataire</p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, margin: '0 0 14px', color: T.ink }}>Accès libre</h3>
              <div style={{ margin: '0 0 6px' }}>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 56, color: T.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>0</span>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, verticalAlign: 'super', color: T.inkFaint }}>€</span>
                <span style={{ fontFamily: T.fontBody, fontStyle: 'normal', fontSize: 15, color: T.inkFaint, fontWeight: 400, marginLeft: 8 }}>toujours</span>
              </div>
              <p style={{ fontSize: 13, color: T.inkMid, margin: '0 0 28px', lineHeight: 1.55 }}>
                Tu cherches, tu postules, tu signes. Rien à payer, jamais. La loi ALUR interdit les frais à ta charge et nous l'appliquons strictement.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {TENANT_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 12, fontSize: 14, color: T.ink, padding: '10px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
                    <Check size={18} color={T.success} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 8, fontFamily: T.fontBody, fontWeight: 600, fontSize: 15, background: T.tenant, color: '#fff', textDecoration: 'none', transition: 'opacity .15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Chercher un logement <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Garantie loyers */}
          <div style={{ maxWidth: 920, margin: '48px auto 0', background: T.bgMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: T.caramelLight, color: T.caramelHover, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, margin: '0 0 6px', color: T.ink }}>Garantie loyers impayés — option propriétaire</h4>
              <p style={{ margin: 0, fontSize: 14, color: T.inkMid, lineHeight: 1.6 }}>2,5 % du loyer mensuel · jusqu'à 96 000 € par sinistre · procédure juridique incluse. Activable en un clic depuis ton tableau de bord, en partenariat avec un assureur agréé.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIF ── */}
      <section style={{ padding: 'clamp(64px,10vh,100px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1, color: T.ink, margin: '0 auto 56px', maxWidth: '18ch' }}>
            Comparé aux <em style={{ color: T.caramel }}>agences classiques.</em>
          </h2>

          <div style={{ maxWidth: 780, margin: '0 auto', background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: T.bgMuted, padding: '16px 24px', fontSize: 12, fontWeight: 600, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>
              <span>Pour un loyer de 1 200 €</span>
              <span style={{ textAlign: 'center' }}>Agence</span>
              <span style={{ textAlign: 'center', color: T.caramel }}>Bailio</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.label} className="cmp-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '16px 24px', borderTop: `${row.highlight ? '2px' : '1px'} solid ${T.border}`, fontSize: row.highlight ? 15 : 14, textAlign: 'left', alignItems: 'center', background: row.highlight ? T.caramelLight : i % 2 === 1 ? T.bgBase : T.bgSurface, fontWeight: row.highlight ? 700 : 400 }}>
                <span style={{ color: T.ink }}>{row.label}</span>
                <span style={{ textAlign: 'center', color: T.inkMid }}>{row.agency}</span>
                <span style={{ textAlign: 'center', color: row.bailioGood ? T.success : T.ink, fontWeight: 600 }}>{row.bailio}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '24px auto 0', fontSize: 14, color: T.inkMid }}>
            Soit <strong style={{ color: T.caramelHover }}>plus de 2 200 € d'économie</strong> sur la première année par rapport à une agence classique.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: 'clamp(64px,10vh,100px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,3.5vw,36px)', lineHeight: 1.1, color: T.ink, margin: '0 0 40px', textAlign: 'center' }}>
            Questions <em style={{ color: T.caramel }}>fréquentes.</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FAQ.map((item, i) => (
              <div key={item.q} style={{ borderBottom: `1px solid ${T.border}`, padding: '22px 0' }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 19, color: T.ink, margin: '0 0 10px', lineHeight: 1.3 }}>{item.q}</p>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, background: T.bgMuted, border: `1px solid ${T.border}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, margin: '0 0 8px', color: T.ink }}>Encore une question ?</p>
            <p style={{ fontSize: 14, color: T.inkMid, margin: '0 0 20px' }}>On répond en moins de 4 heures ouvrées.</p>
            <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 8, fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, background: T.night, color: '#fff', textDecoration: 'none' }}>
              Nous contacter <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: T.night, padding: '72px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,3.5vw,40px)', color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
              Prêt à <em style={{ color: T.caramel }}>commencer ?</em>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, margin: 0 }}>Inscris-toi gratuitement. Locataires : c'est gratuit pour toujours.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none' }}>
              Créer mon compte <ArrowRight size={16} />
            </Link>
            <Link to="/faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              Voir toutes les questions
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
