import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { Bell, Camera, Check, DocIcon, EuroIcon, Pencil, Pin } from '../components/Icons'
import { LAUNCH_OFFER, MONTHLY_PRICE, priceLabel } from '../config'

/**
 * Accueil : peu de texte, le produit montré. Un titre, une action, une maquette de l'espace propriétaire,
 * puis des repères visuels courts. Les titres de cette page sont en DM Sans (plus net qu'une italique pour
 * une page de présentation) ; le logo garde sa police.
 */

const h = (size: string, extra: CSSProperties = {}): CSSProperties => ({
  margin: 0,
  fontFamily: BAI.fontBody,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.05,
  letterSpacing: '-0.035em',
  color: BAI.ink,
  ...extra,
})

const FEATURES = [
  { icon: <Pencil size={22} color={BAI.owner} />, title: 'Annonce prête', text: 'Leboncoin, SeLoger, PAP' },
  { icon: <DocIcon size={24} />, title: 'Bail conforme', text: 'Contrat type à jour 2026' },
  { icon: <Check size={22} color={BAI.owner} strokeWidth={2} />, title: 'Signature en ligne', text: 'Locataire et garant' },
  { icon: <EuroIcon size={24} />, title: 'Quittances auto', text: 'Chaque mois, par email' },
  { icon: <Bell size={24} />, title: 'Rappels', text: 'Révision, assurance, congé' },
  { icon: <Camera size={24} />, title: 'États des lieux', text: 'Photos, entrée et sortie' },
]

const STEPS = ['Décrivez le logement', 'Choisissez le locataire', 'Signez en ligne']

const FAQ = [
  { q: 'Le bail est-il valable ?', a: 'Oui : il suit le contrat type officiel, dans sa version du 1er octobre 2026.' },
  { q: 'J’ai déjà un locataire.', a: 'Importez votre bail signé en photo : le suivi démarre tout de suite.' },
  { q: 'Mon locataire doit-il s’inscrire ?', a: 'Non. Il reçoit ses documents par email.' },
  { q: 'Où sont mes données ?', a: 'Sur un serveur en Suisse. Jamais revendues.' },
]

const Pill = ({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'blue' | 'gold' }) => {
  const c = tone === 'green' ? [BAI.green, BAI.greenLight] : tone === 'blue' ? [BAI.owner, BAI.ownerTint] : [BAI.caramelDark, BAI.caramelLight]
  return <span style={{ fontSize: 12, fontWeight: 700, color: c[0], background: c[1], padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{children}</span>
}

/** Façade dessinée : tient lieu de photo du logement dans la maquette. */
const Facade = () => (
  <svg aria-hidden viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', width: '100%', height: '100%' }}>
    <rect width="320" height="150" fill={BAI.ownerTint} />
    <rect x="0" y="118" width="320" height="32" fill={BAI.photoSand} />
    <rect x="70" y="30" width="180" height="92" rx="2" fill={BAI.surface} />
    <path d="M60 34 L160 4 L260 34 Z" fill={BAI.caramel} />
    {[92, 140, 188].map((x) => (
      <g key={x}>
        <rect x={x} y="46" width="30" height="24" rx="2" fill={BAI.photoCool} />
        <rect x={x} y="80" width="30" height="24" rx="2" fill={BAI.photoCool} />
      </g>
    ))}
    <rect x="148" y="84" width="24" height="38" rx="2" fill={BAI.owner} />
    <circle cx="36" cy="104" r="16" fill={BAI.greenLight} />
    <circle cx="288" cy="100" r="20" fill={BAI.greenLight} />
  </svg>
)

/** Maquette de l'espace propriétaire : un logement loué, son bail et le dernier loyer. */
function ProductMock() {
  return (
    <div className="home-mock" aria-label="Aperçu de l’espace propriétaire Bailio" role="img">
      <div className="home-mock-card">
        <div style={{ height: 150, borderRadius: 14, overflow: 'hidden' }}>
          <Facade />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: BAI.ink }}>T2 meublé, Sète</div>
            <div style={{ fontSize: 13, color: BAI.inkSoft, marginTop: 2 }}>42 m² · Thomas Martin</div>
          </div>
          <Pill>Loué</Pill>
        </div>
        <div className="home-mock-rows">
          {[
            ['Bail', <Pill key="b" tone="blue">Signé</Pill>],
            ['Loyer d’octobre', <span key="l" style={{ fontWeight: 700, color: BAI.ink }}>780 €</span>],
            ['Prochaine révision', <span key="r" style={{ color: BAI.inkMid }}>1er nov.</span>],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', fontSize: 14, color: BAI.inkMid }}>
              <span>{label}</span>
              {value}
            </div>
          ))}
        </div>
      </div>
      <div className="home-toast home-toast-a">
        <span className="home-toast-icon" style={{ background: BAI.greenLight }}>
          <Check size={16} />
        </span>
        <span>
          <strong style={{ display: 'block', fontSize: 14, color: BAI.ink }}>Loyer reçu</strong>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>Quittance envoyée</span>
        </span>
      </div>
      <div className="home-toast home-toast-b">
        <span className="home-toast-icon" style={{ background: BAI.ownerTint }}>
          <DocIcon size={18} />
        </span>
        <span>
          <strong style={{ display: 'block', fontSize: 14, color: BAI.ink }}>Bail signé</strong>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>par les 2 parties</span>
        </span>
      </div>
    </div>
  )
}

const btn: CSSProperties = { textDecoration: 'none', height: 56, padding: '0 28px', borderRadius: 14, fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }

export default function Home() {
  const navigate = useNavigate()
  const [address, setAddress] = useState('')

  function start(e: FormEvent) {
    e.preventDefault()
    navigate('/commencer', { state: { address: address.trim() || undefined } })
  }

  return (
    <div style={{ background: BAI.surface, color: BAI.ink }}>
      <SiteHeader />

      <main>
        {/* Héros : le titre, l'adresse, la maquette */}
        <section className="container home-hero">
          <div className="stack" style={{ gap: 24 }}>
            <span style={{ alignSelf: 'flex-start' }}>
              <Pill tone="gold">Nouveau contrat type 2026 inclus</Pill>
            </span>
            <h1 style={h('clamp(40px, 5.6vw, 68px)')}>Louez votre logement, sans paperasse.</h1>
            <p style={{ margin: 0, fontSize: 'clamp(17px, 1.6vw, 19px)', lineHeight: 1.5, color: BAI.inkMid, maxWidth: 460 }}>Annonce, bail, signature et quittances. Tout est prêt, tout est conforme.</p>
            <form onSubmit={start} className="col-md home-form">
              <label htmlFor="home-address" className="sr-only">
                Adresse du logement
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, width: '100%' }}>
                <span style={{ marginLeft: 12, display: 'flex' }}>
                  <Pin />
                </span>
                <input
                  id="home-address"
                  placeholder="Adresse du logement"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: 54, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', padding: '0 10px' }}
                />
              </div>
              <button type="submit" className="full-md home-cta" style={{ flexShrink: 0, background: BAI.owner, color: BAI.surface, height: 54, padding: '0 24px', borderRadius: 12, fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>
                Commencer gratuitement
              </button>
            </form>
            <div className="home-checks">
              {['Premier bail offert', 'Sans engagement', 'Sans carte bancaire'].map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={15} />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ProductMock />
        </section>

        {/* Fonctions : une icône, deux mots */}
        <section className="container" style={{ paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
          <h2 style={h('clamp(28px, 3.2vw, 40px)', { marginBottom: 32 })}>Tout pour louer, au même endroit.</h2>
          <ul className="home-features">
            {FEATURES.map((f) => (
              <li key={f.title} className="home-feature">
                <span className="home-feature-icon">{f.icon}</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{f.title}</span>
                <span style={{ fontSize: 14, color: BAI.inkSoft }}>{f.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Trois étapes */}
        <section style={{ background: BAI.ownerLight }}>
          <div className="container" style={{ paddingTop: 'clamp(56px, 7vw, 96px)', paddingBottom: 'clamp(56px, 7vw, 96px)' }}>
            <h2 style={h('clamp(28px, 3.2vw, 40px)', { marginBottom: 32 })}>Prêt en 3 étapes.</h2>
            <ol className="home-steps">
              {STEPS.map((s, i) => (
                <li key={s}>
                  <span className="home-step-n">{i + 1}</span>
                  <span style={{ fontSize: 19, fontWeight: 700 }}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tarif */}
        <section id="tarifs" className="container" style={{ paddingTop: 'clamp(64px, 8vw, 112px)', paddingBottom: 'clamp(64px, 8vw, 112px)', scrollMarginTop: 24 }}>
          <h2 style={h('clamp(28px, 3.2vw, 40px)', { marginBottom: 32, textAlign: 'center' })}>Un prix simple.</h2>
          <div className="home-prices">
            <div className="home-price">
              <span style={{ fontSize: 15, fontWeight: 600, color: BAI.inkMid }}>Premier bail</span>
              <span style={h('48px')}>Gratuit</span>
              <Link to="/commencer" className="home-cta-ghost" style={{ ...btn, marginTop: 'auto', border: `1.5px solid ${BAI.owner}`, color: BAI.owner }}>
                Créer mon bail
              </Link>
            </div>
            <div className="home-price" style={{ background: BAI.night, borderColor: BAI.night }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: BAI.onDark }}>Tout inclus</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={h('48px', { color: BAI.surface })}>{priceLabel()}</span>
                {MONTHLY_PRICE ? <span style={{ fontSize: 15, color: BAI.onDarkMuted }}>/ mois</span> : null}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: BAI.caramel }}>{LAUNCH_OFFER}</span>
              <Link to="/commencer" className="home-cta-gold" style={{ ...btn, marginTop: 'auto', background: BAI.caramel, color: BAI.night }}>
                Essayer
              </Link>
            </div>
          </div>
        </section>

        {/* Questions : fermées par défaut */}
        <section className="container" style={{ paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
          <h2 style={h('clamp(24px, 2.6vw, 32px)', { marginBottom: 20, textAlign: 'center' })}>Questions fréquentes</h2>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {FAQ.map((f) => (
              <details key={f.q} className="home-faq">
                <summary>{f.q}</summary>
                <p style={{ margin: '0 0 18px', fontSize: 16, color: BAI.inkMid }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Dernier appel */}
        <section className="container" style={{ paddingBottom: 'clamp(64px, 8vw, 112px)' }}>
          <div className="col-md home-final">
            <h2 style={h('clamp(28px, 3.4vw, 44px)', { color: BAI.surface })}>Votre premier bail est offert.</h2>
            <Link to="/commencer" className="full-md home-cta-light" style={{ ...btn, flexShrink: 0, background: BAI.surface, color: BAI.owner, fontWeight: 700 }}>
              Commencer gratuitement
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
