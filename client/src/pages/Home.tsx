import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Home as HomeIcon,
  Search,
  Key,
  MapPin,
  MessageSquare,
  Shield,
  Headphones,
  Building2,
  Star,
  ArrowRight,
  Menu,
  X,
  Check,
  Bed,
  Bath,
  Square,
  Loader2,
  TrendingUp,
  Tag,
  FileText,
  Zap,
  BarChart2,
  Lock,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useReveal } from '../hooks/useReveal'
import { propertyService } from '../services/property.service'
import { Property } from '../types/property.types'

const OWNER_STEPS = [
  {
    title: "Créez votre annonce",
    description: "Ajoutez vos photos, décrivez votre bien et fixez votre loyer. C'est rapide et 100% gratuit.",
  },
  {
    title: 'Recevez des profils',
    description: 'Notre algorithme vous propose les locataires dont le dossier correspond à vos critères.',
  },
  {
    title: 'Étudiez les dossiers',
    description: 'Discutez avec les candidats et analysez leurs dossiers sécurisés directement en ligne.',
  },
  {
    title: 'Signez le contrat',
    description: "Une fois le locataire choisi, générez et signez le bail électroniquement. C'est fait !",
  },
]

const TENANT_STEPS = [
  {
    title: 'Inscrivez-vous',
    description: 'Créez votre compte en 2 minutes et définissez vos critères de recherche (budget, secteur, type).',
  },
  {
    title: 'Trouvez votre bien',
    description: "Parcourez des milliers d'annonces vérifiées et contactez les propriétaires directement.",
  },
  {
    title: 'Constituez votre dossier',
    description: 'Téléchargez vos documents sécurisés une seule fois et candidatez à plusieurs biens.',
  },
  {
    title: 'Signez en ligne',
    description: 'Votre bail est généré automatiquement. Signez électroniquement en quelques clics.',
  },
]

const FEATURES = [
  {
    icon: Building2,
    title: 'Annonces vérifiées',
    description: 'Chaque bien est validé par notre équipe. Fini les fausses annonces et les arnaques.',
  },
  {
    icon: FileText,
    title: 'Bail automatique',
    description: 'Générez un contrat conforme à la loi Alur en quelques secondes, avec signature électronique.',
  },
  {
    icon: Shield,
    title: 'Dossier sécurisé',
    description: 'Vos documents sont chiffrés AES-256 et hébergés en France. Conformité RGPD garantie.',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie intégrée',
    description: 'Communiquez directement avec les propriétaires ou locataires sans exposer vos coordonnées.',
  },
  {
    icon: BarChart2,
    title: 'Statistiques en temps réel',
    description: 'Suivez les vues, candidatures et performances de vos annonces depuis votre tableau de bord.',
  },
  {
    icon: Zap,
    title: 'Réponse rapide',
    description: "Un algorithme intelligent vous propose les profils les plus adaptés pour accélérer la mise en location.",
  },
]

const STATS = [
  { value: '2 500+', label: 'Propriétaires actifs' },
  { value: '15 000+', label: 'Locataires inscrits' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '0 €', label: "Frais d'agence" },
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const heroReveal = useReveal()
  const featuresReveal = useReveal()
  const howReveal = useReveal()

  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [activeTab, setActiveTab] = useState<'owner' | 'tenant'>('owner')

  useEffect(() => {
    propertyService
      .searchProperties('', { page: 1, limit: 3 })
      .then((data: any) => {
        setFeaturedProperties(Array.isArray(data) ? data.slice(0, 3) : data?.properties?.slice(0, 3) ?? [])
      })
      .catch(() => setFeaturedProperties([]))
      .finally(() => setLoadingProperties(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  if (isAuthenticated && user) {
    if (user.role === 'OWNER') return <Navigate to="/owner/dashboard" replace />
    if (user.role === 'TENANT') return <Navigate to="/tenant/dashboard" replace />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7', fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#d2d2d7]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#007AFF] rounded-xl flex items-center justify-center">
                <HomeIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#1d1d1f]">ImmoParticuliers</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/search" className="text-sm font-medium text-[#515154] hover:text-[#1d1d1f] transition-colors">Annonces</Link>
              <Link to="/calculateur" className="text-sm font-medium text-[#515154] hover:text-[#1d1d1f] transition-colors">Calculateur</Link>
              <Link to="/pricing" className="text-sm font-medium text-[#515154] hover:text-[#1d1d1f] transition-colors">Tarifs</Link>
              <Link to="/faq" className="text-sm font-medium text-[#515154] hover:text-[#1d1d1f] transition-colors">FAQ</Link>
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-[#515154] hover:text-[#1d1d1f] px-4 py-2 rounded-xl transition-colors">
                Connexion
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors"
                style={{ backgroundColor: '#007AFF' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0066d6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007AFF')}
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Mobile */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl text-[#515154]">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#d2d2d7] py-4 space-y-1">
              <Link to="/search" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#515154] hover:bg-[#f5f5f7]" onClick={() => setMobileMenuOpen(false)}>Annonces</Link>
              <Link to="/calculateur" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#515154] hover:bg-[#f5f5f7]" onClick={() => setMobileMenuOpen(false)}>Calculateur</Link>
              <Link to="/pricing" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#515154] hover:bg-[#f5f5f7]" onClick={() => setMobileMenuOpen(false)}>Tarifs</Link>
              <Link to="/faq" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-[#515154] hover:bg-[#f5f5f7]" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
              <div className="flex flex-col gap-2 pt-3 px-4">
                <Link to="/login" className="w-full text-center py-2.5 rounded-xl border border-[#d2d2d7] text-sm font-semibold text-[#515154]" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
                <Link to="/register" className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-[#007AFF]" onClick={() => setMobileMenuOpen(false)}>Commencer gratuitement</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        id="hero"
        ref={heroReveal.ref as React.RefObject<HTMLElement>}
        className="relative overflow-hidden"
        style={{ backgroundColor: '#1d1d1f' }}
      >
        {/* City skyline silhouette */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, pointerEvents: 'none' }}
        >
          {/* Building outlines */}
          <g fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
            <rect x="8"    y="148" width="48"  height="52" />
            <rect x="60"   y="68"  width="38"  height="132" />
            <rect x="63"   y="46"  width="6"   height="22" />
            <rect x="102"  y="94"  width="58"  height="106" />
            <rect x="164"  y="118" width="42"  height="82" />
            <rect x="212"  y="44"  width="78"  height="156" />
            <rect x="234"  y="15"  width="8"   height="29" />
            <rect x="295"  y="104" width="52"  height="96" />
            <rect x="352"  y="74"  width="62"  height="126" />
            <rect x="355"  y="54"  width="6"   height="20" />
            <rect x="420"  y="88"  width="48"  height="112" />
            <rect x="472"  y="50"  width="90"  height="150" />
            <rect x="514"  y="24"  width="8"   height="26" />
            <rect x="566"  y="96"  width="46"  height="104" />
            <rect x="616"  y="66"  width="54"  height="134" />
            <rect x="676"  y="26"  width="44"  height="174" />
            <rect x="677"  y="4"   width="5"   height="22" />
            <rect x="724"  y="76"  width="74"  height="124" />
            <rect x="802"  y="46"  width="56"  height="154" />
            <rect x="862"  y="96"  width="70"  height="104" />
            <rect x="938"  y="60"  width="64"  height="140" />
            <rect x="940"  y="40"  width="8"   height="20" />
            <rect x="1006" y="90"  width="50"  height="110" />
            <rect x="1060" y="36"  width="84"  height="164" />
            <rect x="1096" y="10"  width="10"  height="26" />
            <rect x="1148" y="70"  width="54"  height="130" />
            <rect x="1208" y="96"  width="50"  height="104" />
            <rect x="1262" y="58"  width="64"  height="142" />
            <rect x="1264" y="36"  width="8"   height="22" />
            <rect x="1330" y="110" width="54"  height="90" />
            <rect x="1388" y="130" width="44"  height="70" />
          </g>
          {/* Blue-tinted windows */}
          <g fill="rgba(0,122,255,0.20)" stroke="none">
            {/* Tall building center-left x=60 */}
            <rect x="66" y="74"  width="7" height="5" /><rect x="77" y="74"  width="7" height="5" />
            <rect x="66" y="86"  width="7" height="5" /><rect x="77" y="86"  width="7" height="5" />
            <rect x="66" y="98"  width="7" height="5" /><rect x="77" y="98"  width="7" height="5" />
            <rect x="66" y="110" width="7" height="5" /><rect x="77" y="110" width="7" height="5" />
            <rect x="66" y="122" width="7" height="5" /><rect x="77" y="122" width="7" height="5" />
            {/* Tall building x=212 */}
            <rect x="219" y="52" width="9" height="6" /><rect x="233" y="52" width="9" height="6" />
            <rect x="247" y="52" width="9" height="6" /><rect x="261" y="52" width="9" height="6" />
            <rect x="219" y="65" width="9" height="6" /><rect x="233" y="65" width="9" height="6" />
            <rect x="247" y="65" width="9" height="6" /><rect x="261" y="65" width="9" height="6" />
            <rect x="219" y="78" width="9" height="6" /><rect x="233" y="78" width="9" height="6" />
            <rect x="247" y="78" width="9" height="6" /><rect x="261" y="78" width="9" height="6" />
            {/* Center tallest x=676 */}
            <rect x="681" y="33" width="7" height="5" /><rect x="692" y="33" width="7" height="5" />
            <rect x="703" y="33" width="7" height="5" /><rect x="714" y="33" width="7" height="5" />
            <rect x="681" y="45" width="7" height="5" /><rect x="692" y="45" width="7" height="5" />
            <rect x="703" y="45" width="7" height="5" /><rect x="714" y="45" width="7" height="5" />
            <rect x="681" y="57" width="7" height="5" /><rect x="692" y="57" width="7" height="5" />
            <rect x="703" y="57" width="7" height="5" /><rect x="714" y="57" width="7" height="5" />
            <rect x="681" y="69" width="7" height="5" /><rect x="692" y="69" width="7" height="5" />
            <rect x="703" y="69" width="7" height="5" /><rect x="714" y="69" width="7" height="5" />
            {/* Right tall x=1060 */}
            <rect x="1067" y="43" width="9" height="6" /><rect x="1081" y="43" width="9" height="6" />
            <rect x="1095" y="43" width="9" height="6" /><rect x="1109" y="43" width="9" height="6" />
            <rect x="1067" y="56" width="9" height="6" /><rect x="1081" y="56" width="9" height="6" />
            <rect x="1095" y="56" width="9" height="6" /><rect x="1109" y="56" width="9" height="6" />
            <rect x="1067" y="69" width="9" height="6" /><rect x="1081" y="69" width="9" height="6" />
            <rect x="1095" y="69" width="9" height="6" /><rect x="1109" y="69" width="9" height="6" />
            <rect x="1067" y="82" width="9" height="6" /><rect x="1081" y="82" width="9" height="6" />
            <rect x="1095" y="82" width="9" height="6" /><rect x="1109" y="82" width="9" height="6" />
          </g>
          {/* Ground line */}
          <line x1="0" y1="199" x2="1440" y2="199" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Star className="w-4 h-4 text-[#007AFF]" />
            <span className="text-sm font-medium text-white/80">Plateforme n°1 de location entre particuliers</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 text-white">
            Gérez votre patrimoine<br />
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #5ac8fa 0%, #007AFF 55%, #0051d5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              immobilier avec intelligence
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Propriétaires et locataires se rencontrent directement. Zéro frais d'agence, communication simplifiée, 100% sécurisé.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/register?role=OWNER"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ backgroundColor: '#007AFF' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0066d6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007AFF')}
            >
              <Key className="w-5 h-5" />
              Je suis propriétaire
            </Link>
            <Link
              to="/register?role=TENANT"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-white/30 text-white hover:bg-white/10 transition-all"
            >
              <Search className="w-5 h-5" />
              Je cherche un bien
            </Link>
          </div>

          {/* Floating search card */}
          <div
            className="max-w-2xl mx-auto rounded-2xl p-6"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            }}
          >
            <p className="text-sm font-semibold text-[#1d1d1f] mb-4 text-left">Rechercher un bien</p>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Paris, Lyon, Marseille…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] placeholder-[#86868b] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition-all"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ backgroundColor: '#007AFF' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0066d6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007AFF')}
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            </form>
            <div className="flex gap-2 mt-3">
              {['Paris', 'Lyon', 'Bordeaux', 'Marseille'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => navigate(`/search?q=${city}`)}
                  className="text-xs font-medium text-[#007AFF] bg-[#e8f0fe] px-3 py-1 rounded-full hover:bg-[#e0e7ff] transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="bg-white border-t border-b border-[#d2d2d7]">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-extrabold text-[#007AFF]">{stat.value}</p>
              <p className="text-sm text-[#515154] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        id="features"
        ref={featuresReveal.ref as React.RefObject<HTMLElement>}
        className={`py-20 transition-all duration-700 ${featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ backgroundColor: '#f5f5f7' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#007AFF] mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1d1d1f] mb-4">
              Tout ce dont vous avez besoin,<br />en un seul endroit
            </h2>
            <p className="text-[#515154] max-w-xl mx-auto">
              De la publication d'annonce à la signature du bail, notre plateforme couvre chaque étape de la location.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="bg-white rounded-2xl border border-[#d2d2d7] p-6 hover:-translate-y-1 transition-all duration-200"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}
                >
                  <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <h3 className="font-bold text-[#1d1d1f] mb-2">{feat.title}</h3>
                  <p className="text-sm text-[#515154] leading-relaxed">{feat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        ref={howReveal.ref as React.RefObject<HTMLElement>}
        className={`py-20 bg-white transition-all duration-700 ${howReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#007AFF] mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1d1d1f] mb-4">Simple et rapide</h2>
          </div>

          {/* Tab toggle */}
          <div className="flex justify-center mb-10">
            <div className="flex bg-[#f5f5f7] rounded-xl border border-[#d2d2d7] p-1 gap-1">
              <button
                onClick={() => setActiveTab('owner')}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'owner' ? 'bg-white text-[#1d1d1f] shadow-sm border border-[#d2d2d7]' : 'text-[#515154]'}`}
              >
                Propriétaire
              </button>
              <button
                onClick={() => setActiveTab('tenant')}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'tenant' ? 'bg-white text-[#1d1d1f] shadow-sm border border-[#d2d2d7]' : 'text-[#515154]'}`}
              >
                Locataire
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(activeTab === 'owner' ? OWNER_STEPS : TENANT_STEPS).map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] border-2 border-[#007AFF]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-extrabold text-[#007AFF]">{i + 1}</span>
                </div>
                <h3 className="font-bold text-[#1d1d1f] mb-2">{step.title}</h3>
                <p className="text-sm text-[#515154] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section className="py-20" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#007AFF] mb-2">Annonces récentes</p>
              <h2 className="text-3xl font-extrabold text-[#1d1d1f]">Biens disponibles</h2>
            </div>
            <Link
              to="/search"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#007AFF] hover:text-[#0066d6] transition-colors"
            >
              Voir toutes les annonces <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingProperties ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-16 text-[#86868b]">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucun bien disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden hover:-translate-y-1 transition-all duration-200 group"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)' }}
                >
                  <div className="aspect-video bg-[#f0f0f2] relative overflow-hidden">
                    {property.images && property.images[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-[#b0b0b8]" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-bold text-[#007AFF] bg-[#e8f0fe] px-2.5 py-1 rounded-full">
                        {property.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#1d1d1f] mb-1 truncate">{property.title}</h3>
                    <div className="flex items-center gap-1 text-[#515154] text-sm mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{property.city}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#86868b] mb-4">
                      <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms} ch.</span>
                      <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms} sdb</span>
                      <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" /> {property.surface} m²</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-extrabold text-[#007AFF]">
                        {property.price} €<span className="text-sm font-normal text-[#86868b]">/mois</span>
                      </span>
                      <span className="text-xs font-semibold text-[#007AFF] bg-[#e8f0fe] px-3 py-1 rounded-full">
                        Voir
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#007AFF] hover:text-[#0066d6] transition-colors sm:hidden"
            >
              Voir toutes les annonces <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="py-16 bg-white border-y border-[#d2d2d7]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#007AFF] mb-3">Tarifs</p>
          <h2 className="text-3xl font-extrabold text-[#1d1d1f] mb-4">Une formule pour chaque besoin</h2>
          <p className="text-[#515154] mb-8 max-w-lg mx-auto">
            Démarrez gratuitement. Passez à Pro quand vous en avez besoin. Aucun engagement, aucune surprise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{ backgroundColor: '#007AFF' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0066d6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007AFF')}
            >
              Voir les tarifs <Tag className="w-4 h-4" />
            </Link>
            <Link
              to="/calculateur"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-[#d2d2d7] text-[#515154] hover:bg-[#f5f5f7] transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Calculer ma rentabilité
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ backgroundColor: '#1d1d1f' }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Prêt à louer sans intermédiaire ?
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Rejoignez plus de 15 000 utilisateurs qui font confiance à ImmoParticuliers pour leur gestion locative.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-white transition-all"
              style={{ backgroundColor: '#007AFF' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0066d6')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007AFF')}
            >
              Créer mon compte gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold border border-white/30 text-white hover:bg-white/10 transition-all"
            >
              <Search className="w-5 h-5" />
              Parcourir les annonces
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Inscription gratuite</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> Données sécurisées</span>
            <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-emerald-400" /> Support 7j/7</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#d2d2d7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#007AFF] rounded-xl flex items-center justify-center">
                  <HomeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[#1d1d1f]">ImmoParticuliers</span>
              </Link>
              <p className="text-sm text-[#86868b] leading-relaxed">
                La plateforme de location immobilière entre particuliers.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-4">Plateforme</p>
              <ul className="space-y-2.5">
                {[{ to: '/search', label: 'Recherche' }, { to: '/pricing', label: 'Tarifs' }, { to: '/calculateur', label: 'Calculateur' }].map(l => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-[#515154] hover:text-[#1d1d1f] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-4">Aide</p>
              <ul className="space-y-2.5">
                {[{ to: '/faq', label: 'FAQ' }, { to: '/support', label: 'Support' }, { to: '/contact', label: 'Contact' }, { to: '/presse', label: 'Presse' }].map(l => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-[#515154] hover:text-[#1d1d1f] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-4">Légal</p>
              <ul className="space-y-2.5">
                {[{ to: '/cgu', label: 'CGU' }, { to: '/confidentialite', label: 'Confidentialité' }, { to: '/cookies', label: 'Cookies' }, { to: '/mentions-legales', label: 'Mentions légales' }].map(l => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-[#515154] hover:text-[#1d1d1f] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#d2d2d7] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#86868b]">© {new Date().getFullYear()} ImmoParticuliers. Tous droits réservés.</p>
            <div className="flex items-center gap-4 text-sm text-[#86868b]">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> RGPD conforme</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Hébergé en France</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
