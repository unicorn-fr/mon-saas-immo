import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Building2,
  MapPin,
  Bed,
  Maximize2,
  Euro,
  Check,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { propertyService } from '../services/property.service'
import { Property } from '../types/property.types'
import { Header } from '../components/layout/Header'

const T = {
  bgBase:      '#fafaf8',
  bgSurface:   '#ffffff',
  bgMuted:     '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  night:       '#1a1a2e',
  caramel:     '#c4976a',
  caramelHover:'#b07f54',
  border:      '#e4e1db',
  shadow:      '0 1px 2px rgba(13,12,10,0.05), 0 4px 16px rgba(13,12,10,0.06)',
  shadowHover: '0 4px 8px rgba(13,12,10,0.08), 0 12px 32px rgba(13,12,10,0.10)',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const STATS = [
  { value: '+12 400',    label: 'Inscrits sur la plateforme' },
  { value: '0 €',        label: "Frais d'agence" },
  { value: '8 min',      label: 'Pour publier une annonce' },
  { value: '96 k€',      label: 'Garantie loyers (option)' },
]

const STEPS = [
  {
    n: '1',
    title: 'Publie ton annonce.',
    desc: 'Photos, description, loyer. On optimise ton annonce avec l\'IA pour qu\'elle sorte du lot. Huit minutes chrono.',
  },
  {
    n: '2',
    title: 'Choisis ton locataire.',
    desc: 'Candidatures déjà vérifiées et scorées par IA. Tu ouvres, tu compares, tu sélectionnes. Zéro paperasse.',
  },
  {
    n: '3',
    title: 'Signe ton bail.',
    desc: 'Signature électronique à valeur probante, état des lieux guidé, prélèvements SEPA. Tu n\'as plus rien à faire.',
  },
]

const FEATURES = [
  {
    title: 'Zéro frais d\'agence.',
    desc: 'Tu publies, tu signes, tu économises. Pas de commission, pas de frais cachés, pas de semaine à négocier avec un intermédiaire.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
  {
    title: 'Dossiers vérifiés par IA.',
    desc: 'Chaque candidature passe au crible : identité, revenus, garant. Tu reçois un score de fiabilité et un dossier déjà propre.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
  },
  {
    title: 'Bail 100 % en ligne.',
    desc: 'Conforme loi ALUR, valeur probante, signé en quelques clics. Les quittances partent automatiquement, mois après mois.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    ),
  },
  {
    title: 'État des lieux guidé.',
    desc: 'Photo par photo, pièce par pièce. Horodaté, signé, archivé. Le jour de la sortie, tout est déjà documenté.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5z"/><path d="M22 19H2"/></svg>
    ),
  },
  {
    title: 'SEPA automatique.',
    desc: 'Le loyer tombe le 5 du mois. La quittance part dans la foulée. Si un prélèvement rate, on te prévient avant.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><path d="M2 13v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4"/><line x1="6" x2="6.01" y1="11" y2="11"/><line x1="10" x2="10.01" y1="11" y2="11"/></svg>
    ),
  },
  {
    title: 'Garantie loyers (option).',
    desc: 'Jusqu\'à 96 000 € couverts par sinistre, procédure incluse. Activable en un clic, par un assureur français agréé.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    ),
  },
]

const TESTIMONIALS = [
  {
    quote: 'J\'ai relogé mon studio en huit jours. Bailio a filtré les profils, j\'ai juste eu à choisir. Les quittances partent toutes seules.',
    name: 'Camille L.',
    role: 'Propriétaire · Paris 11e',
    initials: 'CL',
    bg: '#1a3270',
  },
  {
    quote: 'Trouvé un T2 à Lyon depuis Marseille. Aucun déplacement, dossier numérique, bail signé en deux jours. Surréaliste.',
    name: 'Théo M.',
    role: 'Locataire · Lyon',
    initials: 'TM',
    bg: '#1b5e3b',
  },
  {
    quote: 'Trois biens en gestion, plus aucun rendez-vous d\'agence. La rentabilité affichée en temps réel, j\'arbitre vraiment.',
    name: 'Sophie R.',
    role: 'Propriétaire · Bordeaux',
    initials: 'SR',
    bg: '#1a3270',
  },
]

const OWNER_BENEFITS = [
  'Publiez gratuitement',
  'Sélection des dossiers simplifiée',
  'Bail généré automatiquement',
  'Zéro frais d\'agence',
]

const TENANT_BENEFITS = [
  'Accès à toutes les annonces',
  'Dossier numérique sécurisé',
  'Candidature en un clic',
  'Signature électronique incluse',
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  useEffect(() => {
    propertyService
      .searchProperties('', { page: 1, limit: 4 })
      .then((data: unknown) => {
        const d = data as { properties?: Property[] } | Property[]
        setFeaturedProperties(
          Array.isArray(d)
            ? (d as Property[]).slice(0, 4)
            : ((d as { properties?: Property[] })?.properties?.slice(0, 4) ?? [])
        )
      })
      .catch(() => setFeaturedProperties([]))
      .finally(() => setLoadingProperties(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  if (isAuthenticated && user) {
    if (user.role === 'OWNER')  return <Navigate to="/dashboard/owner"  replace />
    if (user.role === 'TENANT') return <Navigate to="/dashboard/tenant" replace />
  }

  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(196,151,106,0.6)} 70%{box-shadow:0 0 0 10px rgba(196,151,106,0)} 100%{box-shadow:0 0 0 0 rgba(196,151,106,0)} }
        @keyframes cloud1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-60px)} }
        @keyframes cloud2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(50px)} }
        @media (max-width: 768px) {
          .hero-inner  { flex-direction: column !important; }
          .stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid  { grid-template-columns: 1fr !important; }
          .feat-grid   { grid-template-columns: 1fr !important; }
          .props-grid  { grid-template-columns: 1fr !important; }
          .testi-grid  { grid-template-columns: 1fr !important; }
          .cta-grid    { flex-direction: column !important; }
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-brand { grid-column: span 2 !important; }
          .search-row  { flex-direction: column !important; }
          .trust-badges { flex-direction: column !important; gap: 12px !important; }
          .hero-right  { display: none !important; }
        }
        @media (min-width: 1024px) {
          .feat-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .props-grid  { grid-template-columns: repeat(4, 1fr) !important; }
          .testi-grid  { grid-template-columns: repeat(3, 1fr) !important; }
          .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: T.night, color: '#fff', overflow: 'hidden', padding: 'clamp(70px,12vh,130px) 0 clamp(90px,14vh,160px)' }}>
        {/* Animated clouds */}
        <div style={{ position: 'absolute', width: 340, height: 100, top: '12%', right: -80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud1 22s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 260, height: 80, top: '48%', left: '50%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(40px)', animation: 'cloud2 28s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* Skyline SVG */}
        <svg viewBox="0 0 1400 160" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, opacity: 0.18, pointerEvents: 'none', zIndex: 1 }}>
          <g fill="#ffffff">
            <rect x="0" y="100" width="60" height="60"/><rect x="70" y="70" width="40" height="90"/>
            <rect x="115" y="90" width="80" height="70"/><rect x="200" y="50" width="55" height="110"/>
            <polygon points="255,50 285,30 285,160 255,160"/><rect x="290" y="80" width="70" height="80"/>
            <rect x="365" y="35" width="55" height="125"/><rect x="425" y="100" width="90" height="60"/>
            <rect x="520" y="55" width="45" height="105"/><rect x="570" y="82" width="70" height="78"/>
            <rect x="645" y="45" width="40" height="115"/><rect x="690" y="95" width="95" height="65"/>
            <rect x="790" y="60" width="55" height="100"/><rect x="850" y="30" width="50" height="130"/>
            <polygon points="900,30 925,15 925,160 900,160"/><rect x="930" y="75" width="65" height="85"/>
            <rect x="1000" y="50" width="45" height="110"/><rect x="1050" y="92" width="85" height="68"/>
            <rect x="1140" y="40" width="50" height="120"/><rect x="1195" y="68" width="60" height="92"/>
            <rect x="1260" y="95" width="80" height="65"/><rect x="1345" y="55" width="55" height="105"/>
          </g>
          <g fill="#c4976a" opacity="0.7">
            <rect x="78" y="80" width="4" height="6"/><rect x="90" y="95" width="4" height="6"/><rect x="78" y="115" width="4" height="6"/>
            <rect x="210" y="65" width="4" height="6"/><rect x="225" y="80" width="4" height="6"/>
            <rect x="375" y="50" width="4" height="6"/><rect x="395" y="70" width="4" height="6"/>
            <rect x="530" y="70" width="4" height="6"/><rect x="655" y="60" width="4" height="6"/>
            <rect x="800" y="75" width="4" height="6"/><rect x="860" y="50" width="4" height="6"/>
            <rect x="1010" y="65" width="4" height="6"/><rect x="1150" y="55" width="4" height="6"/>
          </g>
        </svg>

        <div className="hero-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 48 }}>
          {/* Left */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {/* Badge */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(196,151,106,0.12)', border: '1px solid rgba(196,151,106,0.35)', color: T.caramel, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.caramel, animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
              Disponible maintenant
            </span>

            <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(42px,7vw,80px)', lineHeight: 1.02, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 22px', maxWidth: '16ch' }}>
              La clé de ta <em style={{ color: T.caramel }}>prochaine location.</em>
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.3vw,17px)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, maxWidth: 560, margin: '0 0 40px' }}>
              Publie ton annonce, reçois des candidatures vérifiées et signe ton bail en ligne. Sans frais d'agence, sans paperasse, sans prise de tête.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link
                to="/register?role=OWNER"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = T.caramelHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = T.caramel; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Publier mon annonce <ArrowRight size={16} />
              </Link>
              <Link
                to="/search"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              >
                Chercher un logement
              </Link>
            </div>

            {/* Trust badges */}
            <div className="trust-badges" style={{ display: 'flex', gap: 32, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} color={T.caramel} strokeWidth={2.5} />
                150 premiers · frais à vie offerts
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} color={T.caramel} strokeWidth={2.5} />
                Conforme loi ALUR
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} color={T.caramel} strokeWidth={2.5} />
                Données hébergées en France
              </span>
            </div>
          </div>

          {/* Right — search card */}
          <div className="hero-right" style={{ width: 380, flexShrink: 0 }}>
            <div style={{ background: T.bgSurface, borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(13,12,10,0.28)' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, marginBottom: 16 }}>
                Rechercher un bien
              </p>
              <form onSubmit={handleSearch}>
                <div className="search-row" style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.inkFaint }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Paris, Lyon, Marseille…"
                      style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 12, paddingBottom: 12, borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.fontBody, fontSize: 14, color: T.ink, outline: 'none', background: T.bgBase, boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ background: T.caramel, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px', fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, transition: 'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.caramelHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.caramel; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <Search size={14} />
                    Chercher
                  </button>
                </div>
              </form>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkFaint, marginBottom: 12 }}>Accès rapide</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nantes'].map(city => (
                    <Link key={city} to={`/search?q=${city}`} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${T.border}`, fontFamily: T.fontBody, fontSize: 12, color: T.inkMid, textDecoration: 'none', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.caramel; e.currentTarget.style.color = T.caramel }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkMid }}
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${T.border}`, padding: 'clamp(48px,8vh,80px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {STATS.map((stat, i) => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '0 clamp(8px,2vw,24px)', borderRight: i < STATS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,48px)', lineHeight: 1, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkMid, margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px,12vh,130px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>
            Comment ça marche
          </p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1.05, letterSpacing: '-0.015em', color: T.ink, margin: '0 0 16px', maxWidth: '18ch' }}>
            Trois étapes. <em style={{ color: T.caramel }}>Pas une de plus.</em>
          </h2>
          <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, maxWidth: '56ch', margin: '0 0 56px' }}>
            Tu es propriétaire ? Tu publies, tu choisis ton locataire, tu signes. Tu cherches un logement ? Tu postules, tu signes, tu emménages.
          </p>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '36px 28px 28px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -18, left: 28, width: 44, height: 44, borderRadius: '50%', background: T.night, color: '#fff', fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.n}
                </div>
                <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 24, margin: '10px 0 10px', color: T.ink }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px,12vh,130px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}>
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 10px' }}>À la une cette semaine</p>
              <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.1, color: T.ink, margin: 0 }}>
                Des biens triés <em style={{ color: T.caramel }}>sur le volet.</em>
              </h2>
            </div>
            <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fontBody, fontWeight: 500, fontSize: 14, color: T.inkMid, textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 18px', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.borderColor = T.ink }}
              onMouseLeave={e => { e.currentTarget.style.color = T.inkMid; e.currentTarget.style.borderColor = T.border }}
            >
              Voir tous les biens <ArrowRight size={14} />
            </Link>
          </div>

          {loadingProperties ? (
            <div className="props-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{ background: T.bgSurface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div style={{ height: 200, background: T.border }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ height: 18, background: T.border, borderRadius: 4, marginBottom: 12, width: '70%' }} />
                    <div style={{ height: 14, background: T.border, borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: T.inkFaint }}>
              <Building2 size={48} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: T.fontBody, fontSize: 15 }}>Aucun bien disponible pour le moment.</p>
            </div>
          ) : (
            <div className="props-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {featuredProperties.map(property => (
                <Link key={property.id} to={`/properties/${property.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{ background: T.bgSurface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow, transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = T.shadowHover; el.style.borderColor = '#e8ccaa' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = T.shadow; el.style.borderColor = T.border }}
                  >
                    <div style={{ position: 'relative', height: 200, background: T.bgMuted, overflow: 'hidden' }}>
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={40} color={T.inkFaint} />
                        </div>
                      )}
                      {/* Price */}
                      <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.96)', padding: '6px 12px', borderRadius: 8, fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: T.ink, border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {Number(property.price).toLocaleString('fr-FR')} €<span style={{ fontFamily: T.fontBody, fontStyle: 'normal', fontWeight: 500, fontSize: 11, color: T.inkMid }}>/mois</span>
                      </div>
                      {/* Type */}
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(26,26,46,0.92)', color: '#fff', borderRadius: 6, padding: '5px 10px', fontFamily: T.fontBody, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em' }}>
                        {property.type}
                      </div>
                    </div>
                    <div style={{ padding: '18px 18px 20px' }}>
                      <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: T.ink, margin: '0 0 8px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.inkMid, fontSize: 13, marginBottom: 14 }}>
                        <MapPin size={13} color={T.caramel} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.city}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: T.inkMid, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Bed size={13} color={T.inkFaint} />{property.bedrooms} ch.</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Maximize2 size={13} color={T.inkFaint} />{property.surface} m²</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Euro size={13} color={T.inkFaint} />{Number(property.price).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px,12vh,130px) 0', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>
            Pourquoi Bailio
          </p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1.05, letterSpacing: '-0.015em', color: T.ink, margin: '0 0 16px', maxWidth: '18ch' }}>
            Moins d'intermédiaires. <em style={{ color: T.caramel }}>Plus de confiance.</em>
          </h2>
          <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, maxWidth: '56ch', margin: '0 0 56px' }}>
            On a construit Bailio comme on aurait aimé louer. Sans commission, sans rendez-vous d'agence à 18h, sans dossier papier perdu dans un tiroir.
          </p>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {FEATURES.map(feat => (
              <div key={feat.title}
                style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28, transition: 'all .25s cubic-bezier(0.16,1,0.3,1)', cursor: 'default' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = T.shadowHover; el.style.borderColor = '#e8ccaa' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = T.border }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fdf5ec', color: T.caramelHover, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {feat.icon}
                </div>
                <h4 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, margin: '0 0 10px', color: T.ink }}>{feat.title}</h4>
                <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(72px,12vh,130px) 0', background: T.bgMuted }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px', textAlign: 'center' }}>
            Ce qu'ils en disent
          </p>
          <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1.1, color: T.ink, margin: '0 auto 56px', textAlign: 'center', maxWidth: '22ch' }}>
            Des propriétaires <em style={{ color: T.caramel }}>sereins.</em><br />Des locataires <em style={{ color: T.caramel }}>respectés.</em>
          </h2>

          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 }}>
                {/* Quote mark */}
                <svg width="32" height="24" viewBox="0 0 32 24" fill={T.caramel} style={{ marginBottom: 18, opacity: 0.5 }}>
                  <path d="M0 24V14C0 6 4 1 12 0V5C7 6.5 5 9 5 13H10V24H0ZM18 24V14C18 6 22 1 30 0V5C25 6.5 23 9 23 13H28V24H18Z"/>
                </svg>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontSize: 20, lineHeight: 1.4, color: T.ink, margin: '0 0 24px' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.bg, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.ink }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.inkFaint }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SPLIT ────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: T.bgBase }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="cta-grid" style={{ display: 'flex', gap: 20 }}>
            {/* Owners */}
            <div style={{ flex: 1, background: T.night, borderRadius: 20, padding: '48px 44px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: T.caramel, textTransform: 'uppercase', marginBottom: 16 }}>Propriétaires</p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#f5f4f0', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                Louez vite,<br />louez bien.
              </h3>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OWNER_BENEFITS.map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
                    <Check size={14} color={T.caramel} strokeWidth={2.5} />{b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                <Link
                  to="/register?role=OWNER"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, color: T.night, background: '#f5f4f0', borderRadius: 10, padding: '12px 24px', textDecoration: 'none', transition: 'opacity .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Mettre en location <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tenants */}
            <div style={{ flex: 1, background: T.caramel, borderRadius: 20, padding: '48px 44px', display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.70)', textTransform: 'uppercase', marginBottom: 16 }}>Locataires</p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#fff', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                Trouvez votre<br />prochain chez-vous.
              </h3>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TENANT_BENEFITS.map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.80)' }}>
                    <Check size={14} color="#fff" strokeWidth={2.5} />{b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                <Link
                  to="/register?role=TENANT"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, color: T.caramel, background: '#ffffff', borderRadius: 10, padding: '12px 24px', textDecoration: 'none', transition: 'opacity .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Trouver un bien <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ────────────────────────────────────────────────── */}
      <section style={{ background: T.night, padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(28px,4vw,42px)', color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
              Prêt à <em style={{ color: T.caramel }}>commencer ?</em>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: 0 }}>
              Inscris-toi gratuitement. Tu publies ou tu cherches en moins de cinq minutes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: T.caramel, color: '#fff', textDecoration: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.caramelHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = T.caramel; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Créer mon compte <ArrowRight size={16} />
            </Link>
            <Link
              to="/pricing"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '14px 26px', borderRadius: 8, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: T.night, padding: '64px 24px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="footer-brand">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: '#f5f4f0', letterSpacing: '-0.01em' }}>Bailio<span style={{ color: T.caramel }}>.</span></span>
              </Link>
              <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.65, maxWidth: 260, margin: '0 0 24px' }}>
                La plateforme de location immobilière entre particuliers. Simple, sécurisée, sans intermédiaire.
              </p>
              <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.caramel, opacity: 0.8, margin: 0, fontStyle: 'italic' }}>
                Hébergé en France · RGPD conforme
              </p>
            </div>

            {[
              { title: 'Plateforme', links: [{ to: '/search', label: 'Annonces' }, { to: '/pricing', label: 'Tarifs' }, { to: '/register', label: "S'inscrire" }] },
              { title: 'Ressources', links: [{ to: '/faq', label: 'FAQ' }, { to: '/support', label: 'Support' }, { to: '/contact', label: 'Contact' }, { to: '/presse', label: 'Presse' }] },
              { title: 'Légal', links: [{ to: '/cgu', label: 'CGU' }, { to: '/confidentialite', label: 'Confidentialité' }, { to: '/cookies', label: 'Cookies' }, { to: '/mentions-legales', label: 'Mentions légales' }] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', margin: '0 0 20px' }}>{col.title}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => (
                    <li key={l.to}>
                      <Link to={l.to} style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.60)', textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.60)' }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>
              © {new Date().getFullYear()} Bailio. Tous droits réservés.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {[{ to: '/cgu', label: 'CGU' }, { to: '/confidentialite', label: 'Vie privée' }, { to: '/cookies', label: 'Cookies' }].map(l => (
                <Link key={l.to} to={l.to} style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.28)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
