import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Building2,
  Users,
  Shield,
  FileText,
  MessageSquare,
  TrendingUp,
  MapPin,
  Bed,
  Maximize2,
  Euro,
  Menu,
  X,
  Check,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { propertyService } from '../services/property.service'
import { Property } from '../types/property.types'

// ─── Design tokens ───────────────────────────────────────────────────────────
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
  shadow:    '0 1px 2px rgba(13,12,10,0.05), 0 4px 16px rgba(13,12,10,0.06)',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '2 500+',  label: 'Propriétaires' },
  { value: '15 000+', label: 'Locataires' },
  { value: '98%',     label: 'Satisfaction' },
  { value: '0 €',     label: "Frais d'agence" },
]

const FEATURES: { ordinal: string; icon: React.ElementType; title: string; description: string }[] = [
  {
    ordinal: '01',
    icon: Building2,
    title: 'Annonces vérifiées',
    description: 'Chaque bien est validé par notre équipe. Fini les fausses annonces et les arnaques.',
  },
  {
    ordinal: '02',
    icon: FileText,
    title: 'Contrats automatiques',
    description: 'Générez un bail conforme à la loi Alur en quelques secondes, avec signature électronique.',
  },
  {
    ordinal: '03',
    icon: Shield,
    title: 'Dossier sécurisé',
    description: 'Vos documents sont chiffrés AES-256 et hébergés en France. Conformité RGPD garantie.',
  },
  {
    ordinal: '04',
    icon: MessageSquare,
    title: 'Messagerie intégrée',
    description: 'Communiquez directement sans exposer vos coordonnées personnelles.',
  },
  {
    ordinal: '05',
    icon: TrendingUp,
    title: 'Statistiques temps réel',
    description: 'Suivez vues, candidatures et performances depuis votre tableau de bord.',
  },
  {
    ordinal: '06',
    icon: Users,
    title: 'Matching intelligent',
    description: 'Notre algorithme vous propose les profils les plus adaptés à vos critères.',
  },
]

const OWNER_STEPS = [
  { title: 'Créez votre annonce',   description: "Ajoutez vos photos, décrivez votre bien et fixez votre loyer. C'est rapide et 100% gratuit." },
  { title: 'Recevez des profils',   description: 'Notre algorithme vous propose les locataires dont le dossier correspond à vos critères.' },
  { title: 'Étudiez les dossiers',  description: 'Discutez avec les candidats et analysez leurs dossiers sécurisés directement en ligne.' },
  { title: 'Signez le contrat',     description: "Une fois le locataire choisi, générez et signez le bail électroniquement. C'est fait !" },
]

const TENANT_STEPS = [
  { title: 'Inscrivez-vous',          description: 'Créez votre compte en 2 minutes et définissez vos critères de recherche.' },
  { title: 'Trouvez votre bien',      description: "Parcourez des milliers d'annonces vérifiées et contactez les propriétaires directement." },
  { title: 'Constituez votre dossier', description: 'Téléchargez vos documents une seule fois et candidatez à plusieurs biens.' },
  { title: 'Signez en ligne',         description: 'Votre bail est généré automatiquement. Signez électroniquement en quelques clics.' },
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const featuresReveal = useReveal()
  const howReveal      = useReveal()
  const propsReveal    = useReveal()
  const ctaReveal      = useReveal()

  const [searchQuery, setSearchQuery]         = useState('')
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties]   = useState(true)
  const [activeTab, setActiveTab]             = useState<'owner' | 'tenant'>('owner')
  const [scrolled, setScrolled]               = useState(false)

  // Scroll listener for sticky nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Featured properties
  useEffect(() => {
    propertyService
      .searchProperties('', { page: 1, limit: 3 })
      .then((data: unknown) => {
        const d = data as { properties?: Property[] } | Property[]
        setFeaturedProperties(
          Array.isArray(d)
            ? (d as Property[]).slice(0, 3)
            : ((d as { properties?: Property[] })?.properties?.slice(0, 3) ?? [])
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          transition: 'background 0.25s, box-shadow 0.25s, border-color 0.25s',
          backgroundColor: scrolled ? T.bgSurface : 'transparent',
          borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
          boxShadow: scrolled ? T.shadow : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: 17, color: T.night, letterSpacing: '-0.02em' }}>
              Immo
            </span>
            <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 19, color: T.night }}>
              Particuliers
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hide-mobile">
            {[
              { to: '/',           label: 'Accueil' },
              { to: '/search',     label: 'Annonces' },
              { to: '/calculateur', label: 'Calculateur' },
              { to: '/pricing',    label: 'Tarifs' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{ fontFamily: T.fontBody, fontWeight: 500, fontSize: 13, color: T.inkMid, textDecoration: 'none', letterSpacing: '0.01em' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
                onMouseLeave={e => (e.currentTarget.style.color = T.inkMid)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="hide-mobile">
            <Link
              to="/login"
              style={{
                fontFamily: T.fontBody,
                fontWeight: 500,
                fontSize: 13,
                color: T.night,
                border: `1px solid ${T.night}`,
                borderRadius: 8,
                padding: '7px 18px',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${T.night}0d` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Connexion
            </Link>
            <Link
              to="/register"
              style={{
                fontFamily: T.fontBody,
                fontWeight: 600,
                fontSize: 13,
                color: '#ffffff',
                backgroundColor: T.night,
                borderRadius: 8,
                padding: '7px 18px',
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              S'inscrire
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ink, padding: 4, display: 'none' }}
            className="show-mobile"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ backgroundColor: T.bgSurface, borderTop: `1px solid ${T.border}`, padding: '12px 24px 20px' }}>
            {[
              { to: '/',            label: 'Accueil' },
              { to: '/search',      label: 'Annonces' },
              { to: '/calculateur', label: 'Calculateur' },
              { to: '/pricing',     label: 'Tarifs' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', padding: '10px 0', fontWeight: 500, fontSize: 15, color: T.inkMid, textDecoration: 'none', borderBottom: `1px solid ${T.border}` }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textAlign: 'center', padding: '10px 0', border: `1px solid ${T.night}`, borderRadius: 8, fontSize: 14, fontWeight: 500, color: T.night, textDecoration: 'none' }}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textAlign: 'center', padding: '10px 0', backgroundColor: T.night, borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}
              >
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Responsive CSS helpers */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .hero-grid   { flex-direction: column !important; }
          .hero-left   { width: 100% !important; text-align: center !important; align-items: center !important; }
          .hero-right  { width: 100% !important; min-height: 260px !important; }
          .hero-h1     { font-size: 44px !important; }
          .stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .feat-grid   { grid-template-columns: 1fr !important; }
          .steps-grid  { grid-template-columns: 1fr !important; }
          .props-grid  { grid-template-columns: 1fr !important; }
          .cta-grid    { flex-direction: column !important; }
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-brand { grid-column: span 2 !important; }
          .search-row  { flex-direction: column !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
        @media (min-width: 1024px) {
          .feat-grid  { grid-template-columns: repeat(3, 1fr) !important; }
          .steps-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .props-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '92vh', backgroundColor: T.bgBase, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px 80px', width: '100%' }}>
          <div
            className="hero-grid"
            style={{ display: 'flex', gap: 48, alignItems: 'center' }}
          >
            {/* Left column */}
            <div
              className="hero-left"
              style={{ flex: '0 0 55%', maxWidth: '55%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              {/* Overline */}
              <p style={{
                fontFamily: T.fontBody,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: T.caramel,
                textTransform: 'uppercase',
                marginBottom: 20,
              }}>
                La location sans intermédiaire
              </p>

              {/* Headline */}
              <h1
                className="hero-h1"
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 72,
                  lineHeight: 1.1,
                  color: T.ink,
                  letterSpacing: '-0.02em',
                  margin: '0 0 28px',
                }}
              >
                L'immobilier<br />
                entre particuliers,<br />
                <span style={{ color: T.caramel }}>autrement.</span>
              </h1>

              {/* Subtitle */}
              <p style={{
                fontFamily: T.fontBody,
                fontSize: 18,
                fontWeight: 400,
                color: T.inkMid,
                lineHeight: 1.6,
                maxWidth: 460,
                margin: '0 0 36px',
              }}>
                Propriétaires et locataires se rencontrent directement. Zéro frais d'agence, 100% sécurisé.
              </p>

              {/* CTA row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
                <Link
                  to="/search"
                  style={{
                    fontFamily: T.fontBody,
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#fff',
                    backgroundColor: T.night,
                    borderRadius: 10,
                    padding: '14px 28px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Trouver un bien
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/register?role=OWNER"
                  style={{
                    fontFamily: T.fontBody,
                    fontWeight: 500,
                    fontSize: 15,
                    color: T.night,
                    border: `1.5px solid ${T.night}`,
                    borderRadius: 10,
                    padding: '14px 28px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${T.night}0d` }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  Je suis propriétaire
                </Link>
              </div>

              {/* Search bar */}
              <div style={{
                backgroundColor: T.bgSurface,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: '16px 16px',
                boxShadow: T.shadow,
                width: '100%',
                maxWidth: 500,
              }}>
                <p style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 500, color: T.inkFaint, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
                        style={{
                          width: '100%',
                          paddingLeft: 34,
                          paddingRight: 12,
                          paddingTop: 10,
                          paddingBottom: 10,
                          borderRadius: 8,
                          border: `1px solid ${T.border}`,
                          fontFamily: T.fontBody,
                          fontSize: 14,
                          color: T.ink,
                          outline: 'none',
                          backgroundColor: T.bgBase,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        backgroundColor: T.caramel,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 20px',
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                      <Search size={14} />
                      Chercher
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right column — architectural SVG illustration */}
            <div
              className="hero-right"
              style={{ flex: '0 0 45%', maxWidth: '45%', minHeight: 440, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg
                viewBox="0 0 520 480"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', maxHeight: 480 }}
                aria-hidden="true"
              >
                {/* Ground */}
                <line x1="20" y1="440" x2="500" y2="440" stroke={T.border} strokeWidth="1.5" />

                {/* Building A — far left, 3-floor */}
                <rect x="30" y="340" width="64" height="100" fill={T.bgMuted} stroke={T.border} strokeWidth="1.2" />
                <rect x="38" y="352" width="10" height="14" fill={T.caramel} opacity="0.25" />
                <rect x="54" y="352" width="10" height="14" fill={T.caramel} opacity="0.18" />
                <rect x="70" y="352" width="10" height="14" fill={T.caramel} opacity="0.25" />
                <rect x="38" y="374" width="10" height="14" fill={T.caramel} opacity="0.18" />
                <rect x="54" y="374" width="10" height="14" fill={T.caramel} opacity="0.25" />
                <rect x="70" y="374" width="10" height="14" fill={T.caramel} opacity="0.18" />
                <rect x="38" y="396" width="10" height="14" fill={T.caramel} opacity="0.25" />
                <rect x="54" y="396" width="10" height="14" fill={T.caramel} opacity="0.18" />
                <rect x="70" y="396" width="10" height="14" fill={T.caramel} opacity="0.25" />
                {/* Roof */}
                <polygon points="30,340 62,304 94,340" fill={T.bgMuted} stroke={T.border} strokeWidth="1.2" />

                {/* Building B — tall tower left-center */}
                <rect x="120" y="200" width="80" height="240" fill={T.night} opacity="0.92" />
                {/* Window grid */}
                {[210, 232, 254, 276, 298, 320, 342, 364, 386].map(y => (
                  [128, 148, 168, 188].map(x => (
                    <rect key={`${x}-${y}`} x={x} y={y} width="10" height="14" fill="#ffffff" opacity={Math.random() > 0.35 ? 0.55 : 0.15} rx="1" />
                  ))
                ))}
                {/* Spire */}
                <line x1="160" y1="200" x2="160" y2="168" stroke={T.night} strokeWidth="2.5" />
                <rect x="154" y="164" width="12" height="6" fill={T.night} />
                {/* Entrance arch */}
                <rect x="148" y="412" width="24" height="28" rx="12" fill={T.caramel} opacity="0.3" />

                {/* Building C — mid width, Haussmann style */}
                <rect x="226" y="270" width="100" height="170" fill={T.bgSurface} stroke={T.border} strokeWidth="1.2" />
                {/* Cornice band */}
                <rect x="222" y="264" width="108" height="10" fill={T.bgMuted} stroke={T.border} strokeWidth="1" />
                {/* Attic floor */}
                <rect x="234" y="240" width="84" height="28" fill={T.bgSurface} stroke={T.border} strokeWidth="1" />
                {/* Roof line */}
                <polygon points="226,240 276,210 352,240" fill={T.bgMuted} stroke={T.border} strokeWidth="1.2" />
                {/* Windows */}
                {[280, 304, 328, 352, 376, 400].map(y => (
                  [236, 260, 296, 320].map(x => (
                    <rect key={`c-${x}-${y}`} x={x} y={y} width="12" height="16" rx="6" fill={T.caramel} opacity="0.18" stroke={T.border} strokeWidth="0.8" />
                  ))
                ))}
                {/* Door */}
                <rect x="264" y="410" width="24" height="30" rx="2" fill={T.border} stroke={T.inkFaint} strokeWidth="0.8" />

                {/* Building D — right, contemporary */}
                <rect x="352" y="300" width="70" height="140" fill={T.bgSurface} stroke={T.border} strokeWidth="1.2" />
                {/* Horizontal bands */}
                <line x1="352" y1="320" x2="422" y2="320" stroke={T.border} strokeWidth="1" />
                <line x1="352" y1="360" x2="422" y2="360" stroke={T.border} strokeWidth="1" />
                <line x1="352" y1="400" x2="422" y2="400" stroke={T.border} strokeWidth="1" />
                {/* Windows */}
                {[308, 330, 368, 390, 408].map(y => (
                  [360, 382, 404].map(x => (
                    <rect key={`d-${x}-${y}`} x={x} y={y} width="10" height="12" rx="1" fill={T.night} opacity="0.15" />
                  ))
                ))}
                {/* Flat roof detail */}
                <rect x="348" y="294" width="78" height="10" fill={T.border} stroke={T.border} strokeWidth="1" />

                {/* Building E — far right, small */}
                <rect x="446" y="360" width="50" height="80" fill={T.bgMuted} stroke={T.border} strokeWidth="1.2" />
                <rect x="452" y="370" width="10" height="14" fill={T.caramel} opacity="0.20" />
                <rect x="468" y="370" width="10" height="14" fill={T.caramel} opacity="0.28" />
                <rect x="484" y="370" width="6" height="14" fill={T.caramel} opacity="0.15" />
                <rect x="452" y="392" width="10" height="14" fill={T.caramel} opacity="0.28" />
                <rect x="468" y="392" width="10" height="14" fill={T.caramel} opacity="0.20" />
                <polygon points="446,360 471,336 496,360" fill={T.bgMuted} stroke={T.border} strokeWidth="1.2" />

                {/* Moon / circle accent top-right */}
                <circle cx="460" cy="80" r="38" fill={T.night} opacity="0.06" />
                <circle cx="460" cy="80" r="26" fill="none" stroke={T.caramel} strokeWidth="1" opacity="0.35" />

                {/* Floating label card */}
                <rect x="310" y="60" width="130" height="56" rx="10" fill={T.bgSurface} stroke={T.border} strokeWidth="1" />
                <rect x="318" y="72" width="6" height="6" rx="1" fill={T.caramel} />
                <rect x="330" y="72" width="64" height="6" rx="2" fill={T.night} opacity="0.12" />
                <rect x="318" y="85" width="48" height="5" rx="2" fill={T.border} />
                <rect x="318" y="96" width="32" height="5" rx="2" fill={T.caramel} opacity="0.5" />

                {/* Floating stat bubble */}
                <rect x="40" y="260" width="110" height="52" rx="10" fill={T.night} opacity="0.92" />
                <text x="55" y="283" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="rgba(255,255,255,0.55)">Frais d'agence</text>
                <text x="55" y="302" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="18" fontWeight="700" fill={T.caramel}>0 €</text>

                {/* Tree / plant accents */}
                <ellipse cx="104" cy="435" rx="12" ry="18" fill={T.night} opacity="0.08" />
                <line x1="104" y1="440" x2="104" y2="453" stroke={T.border} strokeWidth="1.5" />
                <ellipse cx="340" cy="432" rx="10" ry="14" fill={T.night} opacity="0.08" />
                <line x1="340" y1="440" x2="340" y2="453" stroke={T.border} strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: T.bgMuted, padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div
            className="stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0,
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  textAlign: 'center',
                  padding: '0 32px',
                  borderRight: i < STATS.length - 1 ? `1px solid ${T.border}` : 'none',
                }}
              >
                <p style={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 700,
                  fontSize: 64,
                  lineHeight: 1,
                  color: T.ink,
                  margin: '0 0 10px',
                  letterSpacing: '-0.02em',
                }}>
                  {stat.value}
                </p>
                <p style={{
                  fontFamily: T.fontBody,
                  fontSize: 13,
                  color: T.inkFaint,
                  margin: 0,
                  letterSpacing: '0.03em',
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={featuresReveal.ref as React.RefObject<HTMLElement>}
        style={{
          backgroundColor: T.bgBase,
          padding: '96px 24px',
          transition: 'opacity 0.7s, transform 0.7s',
          opacity: featuresReveal.visible ? 1 : 0,
          transform: featuresReveal.visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ marginBottom: 56, maxWidth: 560 }}>
            <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: T.caramel, textTransform: 'uppercase', marginBottom: 16 }}>
              Fonctionnalités
            </p>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 48, lineHeight: 1.15, color: T.ink, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Tout ce dont vous<br />avez besoin.
            </h2>
            <p style={{ fontFamily: T.fontBody, fontWeight: 400, fontSize: 16, color: T.inkMid, lineHeight: 1.65, margin: 0 }}>
              De la publication d'annonce à la signature du bail, notre plateforme couvre chaque étape de la location entre particuliers.
            </p>
          </div>

          {/* Grid */}
          <div
            className="feat-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
          >
            {FEATURES.map(feat => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  style={{
                    backgroundColor: T.bgSurface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: '28px 28px 28px',
                    boxShadow: T.shadow,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow = '0 4px 20px rgba(13,12,10,0.10), 0 1px 4px rgba(13,12,10,0.06)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = T.shadow
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontSize: 24, fontWeight: 600, color: T.caramel, lineHeight: 1 }}>
                      {feat.ordinal}
                    </span>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${T.night}0f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={T.night} />
                    </div>
                  </div>
                  <h3 style={{ fontFamily: T.fontBody, fontWeight: 600, fontSize: 15, color: T.ink, marginBottom: 8, margin: '0 0 8px' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkMid, lineHeight: 1.6, margin: 0 }}>
                    {feat.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={howReveal.ref as React.RefObject<HTMLElement>}
        style={{
          backgroundColor: T.night,
          padding: '96px 24px',
          transition: 'opacity 0.7s, transform 0.7s',
          opacity: howReveal.visible ? 1 : 0,
          transform: howReveal.visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Heading */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: T.caramel, textTransform: 'uppercase', marginBottom: 16 }}>
              Comment ça marche
            </p>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 48, lineHeight: 1.15, color: '#f5f4f0', margin: 0, letterSpacing: '-0.02em' }}>
              Simple et rapide.
            </h2>
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
            <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 40, padding: 4, gap: 4 }}>
              {(['owner', 'tenant'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontFamily: T.fontBody,
                    fontWeight: 500,
                    fontSize: 14,
                    padding: '9px 28px',
                    borderRadius: 32,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                    color: activeTab === tab ? T.night : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {tab === 'owner' ? 'Propriétaire' : 'Locataire'}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div
            className="steps-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}
          >
            {(activeTab === 'owner' ? OWNER_STEPS : TENANT_STEPS).map((step, i) => (
              <div
                key={step.title}
                style={{
                  padding: '32px 32px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  gap: 24,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: 52,
                    lineHeight: 1,
                    color: T.caramel,
                    opacity: 0.7,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontFamily: T.fontBody, fontWeight: 600, fontSize: 16, color: '#f5f4f0', marginBottom: 10, margin: '0 0 10px', lineHeight: 1.3 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.65, margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURED PROPERTIES
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={propsReveal.ref as React.RefObject<HTMLElement>}
        style={{
          backgroundColor: T.bgMuted,
          padding: '96px 24px',
          transition: 'opacity 0.7s, transform 0.7s',
          opacity: propsReveal.visible ? 1 : 0,
          transform: propsReveal.visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: T.caramel, textTransform: 'uppercase', marginBottom: 12 }}>
                Annonces récentes
              </p>
              <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 40, lineHeight: 1.15, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>
                Biens disponibles
              </h2>
            </div>
            <Link
              to="/search"
              style={{ fontFamily: T.fontBody, fontWeight: 500, fontSize: 14, color: T.inkMid, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.color = T.ink }}
              onMouseLeave={e => { e.currentTarget.style.color = T.inkMid }}
            >
              Voir toutes les annonces
              <ArrowRight size={15} />
            </Link>
          </div>

          {loadingProperties ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="props-grid">
              {[1, 2, 3].map(n => (
                <div key={n} style={{ backgroundColor: T.bgSurface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div style={{ height: 200, backgroundColor: T.border, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ height: 18, backgroundColor: T.border, borderRadius: 4, marginBottom: 12, width: '70%' }} />
                    <div style={{ height: 14, backgroundColor: T.border, borderRadius: 4, width: '50%' }} />
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
            <div
              className="props-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}
            >
              {featuredProperties.map(property => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      backgroundColor: T.bgSurface,
                      borderRadius: 16,
                      border: `1px solid ${T.border}`,
                      overflow: 'hidden',
                      boxShadow: T.shadow,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(-4px)'
                      el.style.boxShadow = '0 8px 32px rgba(13,12,10,0.12)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = T.shadow
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: 200, backgroundColor: T.bgMuted, overflow: 'hidden' }}>
                      {property.images && property.images[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={40} color={T.inkFaint} />
                        </div>
                      )}
                      {/* Price overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        backgroundColor: T.night,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '5px 12px',
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Euro size={12} />
                        {property.price.toLocaleString('fr-FR')}/mois
                      </div>
                      {/* Type badge */}
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        backgroundColor: `${T.caramel}e6`,
                        color: '#fff',
                        borderRadius: 6,
                        padding: '3px 10px',
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: '0.04em',
                      }}>
                        {property.type}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '18px 20px 20px' }}>
                      <h3 style={{ fontFamily: T.fontBody, fontWeight: 600, fontSize: 15, color: T.ink, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {property.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.inkMid, fontSize: 13, marginBottom: 14 }}>
                        <MapPin size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.city}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.inkFaint }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Bed size={13} />
                          {property.bedrooms} ch.
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Maximize2 size={13} />
                          {property.surface} m²
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Mobile CTA */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              to="/search"
              style={{
                fontFamily: T.fontBody,
                fontWeight: 600,
                fontSize: 14,
                color: T.night,
                border: `1.5px solid ${T.night}`,
                borderRadius: 10,
                padding: '12px 28px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Voir toutes les annonces
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA SPLIT
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={ctaReveal.ref as React.RefObject<HTMLElement>}
        style={{
          padding: '80px 24px',
          backgroundColor: T.bgBase,
          transition: 'opacity 0.7s, transform 0.7s',
          opacity: ctaReveal.visible ? 1 : 0,
          transform: ctaReveal.visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="cta-grid"
            style={{ display: 'flex', gap: 20 }}
          >
            {/* Owners card */}
            <div
              style={{
                flex: 1,
                backgroundColor: T.night,
                borderRadius: 20,
                padding: '48px 44px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: T.caramel, textTransform: 'uppercase', marginBottom: 16 }}>
                Propriétaires
              </p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#f5f4f0', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                Louez vite,<br />louez bien.
              </h3>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OWNER_BENEFITS.map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
                    <Check size={14} color={T.caramel} strokeWidth={2.5} />
                    {b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                <Link
                  to="/register?role=OWNER"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: T.fontBody,
                    fontWeight: 600,
                    fontSize: 14,
                    color: T.night,
                    backgroundColor: '#f5f4f0',
                    borderRadius: 10,
                    padding: '12px 24px',
                    textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Mettre en location
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Tenants card */}
            <div
              style={{
                flex: 1,
                backgroundColor: T.caramel,
                borderRadius: 20,
                padding: '48px 44px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.70)', textTransform: 'uppercase', marginBottom: 16 }}>
                Locataires
              </p>
              <h3 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#fff', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
                Trouvez votre<br />prochain chez-vous.
              </h3>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TENANT_BENEFITS.map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.80)' }}>
                    <Check size={14} color="#fff" strokeWidth={2.5} />
                    {b}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
                <Link
                  to="/register?role=TENANT"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: T.fontBody,
                    fontWeight: 600,
                    fontSize: 14,
                    color: T.caramel,
                    backgroundColor: '#ffffff',
                    borderRadius: 10,
                    padding: '12px 24px',
                    textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Trouver un bien
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: T.night, padding: '64px 24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            className="footer-grid"
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: 16, color: '#f5f4f0', letterSpacing: '-0.02em' }}>Immo</span>
                <span style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: '#f5f4f0' }}>Particuliers</span>
              </Link>
              <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.65, maxWidth: 260, margin: '0 0 24px' }}>
                La plateforme de location immobilière entre particuliers. Simple, sécurisée, sans intermédiaire.
              </p>
              <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.caramel, opacity: 0.8, margin: 0, fontStyle: 'italic' }}>
                Hébergé en France · RGPD conforme
              </p>
            </div>

            {/* Plateforme */}
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 20 }}>
                Plateforme
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { to: '/search',      label: 'Annonces' },
                  { to: '/pricing',     label: 'Tarifs' },
                  { to: '/calculateur', label: 'Calculateur' },
                  { to: '/register',    label: 'S\'inscrire' },
                ].map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f5f4f0' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 20 }}>
                Ressources
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { to: '/faq',     label: 'FAQ' },
                  { to: '/support', label: 'Support' },
                  { to: '/presse',  label: 'Presse' },
                  { to: '/blog',    label: 'Blog' },
                ].map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f5f4f0' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 20 }}>
                Légal
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { to: '/cgu',              label: 'CGU' },
                  { to: '/confidentialite',  label: 'Confidentialité' },
                  { to: '/cookies',          label: 'Cookies' },
                  { to: '/mentions-legales', label: 'Mentions légales' },
                ].map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f5f4f0' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 28px', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>
              © {new Date().getFullYear()} ImmoParticuliers. Tous droits réservés.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { to: '/cgu',             label: 'CGU' },
                { to: '/confidentialite', label: 'Vie privée' },
                { to: '/cookies',         label: 'Cookies' },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.28)', textDecoration: 'none' }}
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
