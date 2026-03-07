import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Home as HomeIcon,
  Search,
  Key,
  MapPin,
  Euro,
  MessageSquare,
  Shield,
  Headphones,
  ChevronRight,
  Building2,
  Users,
  Star,
  Info,
  ArrowRight,
  Menu,
  X,
  Check,
  Bed,
  Bath,
  Square,
  Loader2,
  Sun,
  Moon,
  TrendingUp,
  Tag,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useThemeStore } from '../store/themeStore'
import { useReveal } from '../hooks/useReveal'
import { propertyService } from '../services/property.service'
import { Property } from '../types/property.types'

const OWNER_STEPS = [
  {
    title: 'Créez votre annonce',
    description: 'Ajoutez vos photos, décrivez votre bien et fixez votre loyer. C\'est rapide et 100% gratuit.',
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
    description: 'Une fois le locataire choisi, générez et signez le bail électroniquement. C\'est fait !',
  },
]

const TENANT_STEPS = [
  {
    title: 'Inscrivez-vous',
    description: 'Créez votre compte en 2 minutes et définissez vos critères de recherche (budget, secteur, type).',
  },
  {
    title: 'Trouvez votre bien',
    description: 'Parcourez nos annonces validées et enregistrez vos coups de coeur pour ne rien rater.',
  },
  {
    title: 'Préparez votre dossier',
    description: 'Compilez vos documents en ligne via notre outil sécurisé, certifié par nos équipes.',
  },
  {
    title: 'Louez sans agence',
    description: 'Contactez les propriétaires, visitez, et signez votre bail en ligne. Pas de frais d\'agence !',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { isDark, toggleDark } = useThemeStore()
  const [searchCity, setSearchCity] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchBudget, setSearchBudget] = useState('')
  const [activeTab, setActiveTab] = useState<'owner' | 'tenant'>('owner')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  const heroReveal = useReveal()
  const statsReveal = useReveal()
  const featuresReveal = useReveal()
  const aboutReveal = useReveal()
  const ctaReveal = useReveal()

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />
    if (user.role === 'OWNER') return <Navigate to="/dashboard/owner" replace />
    if (user.role === 'TENANT') return <Navigate to="/dashboard/tenant" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  }

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const result = await propertyService.getProperties(
          { status: 'AVAILABLE' },
          { page: 1, limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }
        )
        setFeaturedProperties(result.properties)
      } catch {
        // Silently fail - section just won't show
      } finally {
        setLoadingProperties(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchCity) params.append('city', searchCity)
    if (searchType) params.append('type', searchType)
    if (searchBudget) params.append('maxPrice', searchBudget)
    navigate(`/search?${params.toString()}`)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-gradient)' }}>

      {/* ─── BLOBS FIXES (suivent le scroll avec position:fixed) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.18] dark:opacity-[0.22]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)', filter: 'blur(110px)' }} />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.14] dark:opacity-[0.18]"
          style={{ background: 'radial-gradient(circle, #1e40af 0%, transparent 65%)', filter: 'blur(110px)' }} />
      </div>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderBottomColor: 'var(--glass-border)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}
              >
                <HomeIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold hidden sm:block font-heading text-gradient-brand">
                ImmoParticuliers
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-5">
              <button onClick={() => scrollTo('hero')} className="text-sm font-medium transition-colors hover:text-primary-600" style={{ color: 'var(--text-secondary)' }}>
                Accueil
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium transition-colors hover:text-primary-600" style={{ color: 'var(--text-secondary)' }}>
                Comment ça marche
              </button>
              <button onClick={() => scrollTo('featured')} className="text-sm font-medium transition-colors hover:text-primary-600" style={{ color: 'var(--text-secondary)' }}>
                Les biens
              </button>
              <Link to="/calculateur" className="text-sm font-medium transition-colors hover:text-primary-600 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <TrendingUp className="w-3.5 h-3.5" /> Calculateur
              </Link>
              <Link to="/pricing" className="text-sm font-medium transition-colors hover:text-primary-600 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Tag className="w-3.5 h-3.5" /> Tarifs
              </Link>
              <button
                onClick={toggleDark}
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Basculer le mode sombre"
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <Link to="/login" className="btn-neon-emerald text-sm px-4 py-2">
                Connexion
              </Link>
              <Link to="/register" className="btn btn-primary text-sm px-4 py-2">
                Inscription
              </Link>
            </nav>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-2">
              <button onClick={toggleDark} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-1" style={{ borderTopColor: 'var(--glass-border)' }}>
              <button onClick={() => scrollTo('hero')} className="block w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Accueil</button>
              <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Comment ça marche</button>
              <button onClick={() => scrollTo('featured')} className="block w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Les biens</button>
              <Link to="/calculateur" className="block w-full text-left px-4 py-2.5 rounded-xl font-medium" style={{ color: 'var(--text-primary)' }} onClick={() => setMobileMenuOpen(false)}>Calculateur de rentabilité</Link>
              <Link to="/pricing" className="block w-full text-left px-4 py-2.5 rounded-xl font-medium" style={{ color: 'var(--text-primary)' }} onClick={() => setMobileMenuOpen(false)}>Tarifs</Link>
              <div className="flex flex-col gap-2 pt-3">
                <Link to="/login" className="btn-neon-emerald w-full text-center justify-center" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
                <Link to="/register" className="btn btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>Inscription</Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tout le contenu en z-10 par rapport aux blobs fixes */}
      <div className="relative" style={{ zIndex: 1 }}>

        {/* ─── ALERT BANNER ─────────────────────────────────────── */}
        <div className="border-b" style={{ borderBottomColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-center">
            <p className="text-sm text-warning-700 font-medium">
              Nouveau : découvrez notre nouvelle garantie loyers impayés{' '}
              <ChevronRight className="w-4 h-4 inline-block" />
            </p>
          </div>
        </div>

        {/* ─── HERO SECTION ─────────────────────────────────────── */}
        <section
          id="hero"
          ref={heroReveal.ref as React.RefObject<HTMLElement>}
          className={`py-16 md:py-24 transition-all duration-700 ${heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
              <span style={{ color: 'var(--text-primary)' }}>Location </span>
              <span className="text-gradient-brand">entre particuliers</span>
            </h1>
            <p className="text-lg md:text-xl font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              La plateforme n°1 en France de l'immobilier sans agence
            </p>
            <p className="max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-tertiary)' }}>
              Propriétaires et locataires se rencontrent directement sur notre plateforme.
              Zéro frais d'agence, communication simplifiée, 100% sécurisé.
            </p>

            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Commencez par choisir votre profil :</p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>
              Êtes-vous à la recherche d'un bien ou souhaitez-vous mettre le vôtre en location ?
            </p>

            {/* Profile Cards — glass + neon */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

              {/* Owner Card — Blue sobre */}
              <div
                className="text-left transition-all duration-300 cursor-default"
                style={{
                  background: 'var(--glass-bg-heavy)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(59,130,246,0.22)',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.60) inset, 0 16px 36px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{ background: '#2563eb' }}
                  >
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Je suis Propriétaire</h3>
                </div>
                <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Trouvez le locataire idéal et gérez votre location en toute simplicité.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Mise en ligne de votre annonce gratuite',
                    'Filtrage et vérification des dossiers',
                    'Contrat de location pré-rempli inclus',
                    'Garantie loyers impayés en option',
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=OWNER" className="btn-cyan-gradient w-full text-center block">
                  Publier une annonce
                </Link>
              </div>

              {/* Tenant Card — Navy sobre */}
              <div
                className="text-left transition-all duration-300 cursor-default"
                style={{
                  background: 'var(--glass-bg-heavy)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(30,64,175,0.28)',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.60) inset, 0 16px 36px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{ background: '#1e40af' }}
                  >
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Je suis Locataire</h3>
                </div>
                <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Accédez à des milliers de biens exclusifs sans payer le moindre frais d'agence.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Recherche par critères personnalisés',
                    'Contact direct avec les propriétaires',
                    'Création de votre dossier locataire',
                    'Alertes personnalisées en temps réel',
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Check className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/register?role=TENANT" className="btn-magenta-gradient w-full text-center block">
                  Trouver mon bien
                </Link>
              </div>
            </div>

            {/* Calculateur teaser */}
            <div className="mt-8 py-4 border-t" style={{ borderTopColor: 'var(--glass-border)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                Propriétaire bailleur ou investisseur ?
              </p>
              <Link
                to="/calculateur"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
              >
                <TrendingUp className="w-4 h-4" />
                Calculez votre rentabilité locative gratuitement
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="mx-4" style={{ color: 'var(--glass-border)' }}>·</span>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors group"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <Tag className="w-3.5 h-3.5" />
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* ─── QUICK SEARCH ─────────────────────────────────────── */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Ou lancez directement une recherche
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-tertiary)' }}>
              Trouvez le bien qui correspond à vos critères parmi nos annonces validées
            </p>

            <form
              onSubmit={handleSearch}
              className="rounded-2xl p-6 border"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderColor: 'var(--glass-border)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.70), 0 8px 32px rgba(0,0,0,0.07)',
              }}
            >
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="relative flex-1">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Où ? (Ex: Paris, Lyon, Marseille...)"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <div className="relative md:w-48">
                  <HomeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    className="input pl-10 appearance-none"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="">Type de bien</option>
                    <option value="APARTMENT">Appartement</option>
                    <option value="HOUSE">Maison</option>
                    <option value="STUDIO">Studio</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="LOFT">Loft</option>
                  </select>
                </div>
                <div className="relative md:w-44">
                  <Euro className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    placeholder="Budget max"
                    value={searchBudget}
                    onChange={(e) => setSearchBudget(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <button type="submit" className="btn btn-primary flex items-center gap-2 justify-center whitespace-nowrap">
                  <Search className="w-5 h-5" />
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ─── STATISTICS BAR ───────────────────────────────────── */}
        <section
          ref={statsReveal.ref as React.RefObject<HTMLElement>}
          className={`py-12 transition-all duration-700 delay-100 ${statsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Building2 className="w-7 h-7 text-blue-500" />, bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)', glow: 'rgba(59,130,246,0.08)', value: '2 000+', label: 'Biens loués', sub: 'cette année' },
                { icon: <Users className="w-7 h-7 text-blue-600" />, bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.18)', glow: 'rgba(37,99,235,0.08)', value: '15 000+', label: 'Utilisateurs', sub: 'actifs' },
                { icon: <Star className="w-7 h-7 text-slate-500" />, bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.18)', glow: 'rgba(100,116,139,0.06)', value: '4.8/5', label: 'Note moyenne', sub: 'sur Trustpilot' },
              ].map(({ icon, bg, border, glow, value, label, sub }) => (
                <div
                  key={label}
                  className="text-center rounded-2xl p-6 transition-all duration-300 "
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${border}`,
                    boxShadow: `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.70)`,
                  }}
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: bg }}>
                    {icon}
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURED PROPERTIES ──────────────────────────────── */}
        <section id="featured" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Découvrez nos biens d'exception
              </h2>
              <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Une sélection de biens uniques et de qualité. Visitez virtuellement nos dernières
                pépites ou contactez les propriétaires en un clic pour organiser une visite.
              </p>
            </div>

            {loadingProperties ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : featuredProperties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="overflow-hidden transition-all duration-300 cursor-pointer group rounded-3xl"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60), 0 8px 32px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="relative h-52 bg-slate-200 overflow-hidden rounded-t-3xl">
                      <img
                        src={property.images[0] || '/placeholder-property.jpg'}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
                      <span className="absolute top-3 left-3 bg-accent-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Nouveau
                      </span>
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/50 shadow-sm">
                        <span className="text-base font-bold text-slate-900">{property.price}€</span>
                        <span className="text-xs text-slate-500 ml-1">/ mois</span>
                      </div>
                      {property.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium">
                          {property.images.length} photos
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-primary-600 transition-colors line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {property.title}
                      </h3>
                      <div className="flex items-center text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0 text-blue-400" />
                        {property.city}
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{property.surface} m²</span>
                        <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} ch.</span>
                        <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} sdb</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p style={{ color: 'var(--text-tertiary)' }}>Aucun bien disponible pour le moment.</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Revenez bientôt pour découvrir nos nouvelles annonces !</p>
              </div>
            )}

            <div className="text-center mt-10">
              <Link to="/search" className="btn-neon-emerald inline-flex items-center gap-2 px-6 py-3">
                Voir tous les biens
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Comment ça marche ?
              </h2>
              <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                Que vous soyez propriétaire ou locataire, notre plateforme simplifie vos démarches.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-3 mb-10">
              <button
                onClick={() => setActiveTab('owner')}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'owner' ? 'text-white' : 'btn-neon-cyan'
                }`}
                style={activeTab === 'owner'
                  ? { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', boxShadow: '0 6px 24px rgba(37,99,235,0.28), 0 0 0 1px rgba(37,99,235,0.18)' }
                  : {}}
              >
                Pour un propriétaire
              </button>
              <button
                onClick={() => setActiveTab('tenant')}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'tenant' ? 'text-white' : 'btn-neon-cyan'
                }`}
                style={activeTab === 'tenant'
                  ? { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.25), 0 0 0 1px rgba(59,130,246,0.15)' }
                  : {}}
              >
                Pour un locataire
              </button>
            </div>

            {/* Steps — glass cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'owner' ? OWNER_STEPS : TENANT_STEPS).map((step, index) => (
                <div
                  key={step.title}
                  className="text-center relative rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 8px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    className="w-12 h-12 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-lg"
                    style={{
                      background: activeTab === 'owner'
                        ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      boxShadow: activeTab === 'owner'
                        ? '0 4px 16px rgba(37,99,235,0.28)'
                        : '0 4px 16px rgba(59,130,246,0.25)',
                    }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES / WHY US ────────────────────────────────── */}
        <section
          id="features"
          ref={featuresReveal.ref as React.RefObject<HTMLElement>}
          className={`py-16 transition-all duration-700 ${featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Pourquoi choisir ImmoParticuliers ?
              </h2>
              <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
                La première plateforme pensée à 100% pour les particuliers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Euro className="w-7 h-7 text-blue-500" />, iconBg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', glow: 'transparent', title: '100% Gratuit', desc: 'Aucun frais d\'agence pour le locataire. Publication de l\'annonce gratuite pour le propriétaire.' },
                { icon: <MessageSquare className="w-7 h-7 text-blue-500" />, iconBg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', glow: 'transparent', title: 'Contact Direct', desc: 'Discutez sans intermédiaire via notre messagerie intégrée. Fini les pertes de temps.' },
                { icon: <Shield className="w-7 h-7 text-blue-600" />, iconBg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.15)', glow: 'transparent', title: '100% Sécurisé', desc: 'Identités vérifiées, dossiers certifiés et paiements en ligne protégés.' },
                { icon: <Headphones className="w-7 h-7 text-slate-500" />, iconBg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)', glow: 'transparent', title: 'Support & Garantie', desc: 'Des experts à votre écoute et des assurances optionnelles pour louer en toute tranquillité.' },
              ].map(({ icon, iconBg, border, glow, title, desc }) => (
                <div
                  key={title}
                  className="text-center rounded-2xl p-6 transition-all duration-300 "
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${border}`,
                    boxShadow: `0 0 16px ${glow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
                  }}
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: iconBg }}>
                    {icon}
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Calculateur promo strip — glass */}
            <div
              className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(59,130,246,0.20)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 8px 24px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Calculateur de rentabilité locative
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Rentabilité brute, nette, cash-flow mensuel et retour sur investissement — en quelques secondes.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link to="/pricing" className="btn-neon-emerald whitespace-nowrap px-5 py-2.5">
                  Voir les tarifs
                </Link>
                <Link to="/calculateur" className="btn btn-primary whitespace-nowrap inline-flex items-center gap-2">
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ABOUT SECTION ────────────────────────────────────── */}
        <section
          id="about"
          ref={aboutReveal.ref as React.RefObject<HTMLElement>}
          className={`py-16 transition-all duration-700 ${aboutReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                À propos d'ImmoParticuliers
              </h2>
              <p className="text-sm uppercase tracking-widest font-medium" style={{ color: 'var(--text-tertiary)' }}>
                La plateforme qui révolutionne l'immobilier entre particuliers
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div
                className="rounded-2xl p-6 md:col-span-2 border-l-4 border-l-blue-500"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid var(--glass-border)',
                  borderLeftWidth: '4px',
                  borderLeftColor: '#3b82f6',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Notre mission</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Née d'un constat simple : la location immobilière coûte cher et prend du temps. Nous avons créé
                      ImmoParticuliers pour redonner le pouvoir aux particuliers. Notre objectif est de fluidifier
                      le marché locatif en supprimant les intermédiaires tout en garantissant une sécurité maximale.
                    </p>
                  </div>
                </div>
              </div>

              {[
                { title: 'Ce qui nous différencie', desc: 'Pas de frais cachés, pas d\'attente interminable. Une plateforme intuitive pensée pour une expérience utilisateur irréprochable et transparente.' },
                { title: 'Notre Promesse', desc: 'Une mise en relation rapide et pertinente. Des outils numériques de pointe pour sécuriser les dossiers et la gestion de votre location de A à Z.' },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Stats Banner */}
            <div
              className="rounded-2xl p-8 text-white mb-12 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}
            >
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.30) 0%, transparent 60%)' }} />
              <h3 className="text-xl font-bold text-center mb-8 relative z-10">ImmoParticuliers en chiffres</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
                {[
                  { val: '10 000+', label: 'Annonces' },
                  { val: '5 000+', label: 'Propriétaires' },
                  { val: '98%', label: 'Satisfaction' },
                  { val: '24h', label: 'Délai moyen' },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-bold">{val}</p>
                    <p className="text-white/80 text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Rejoignez notre réseau de membres satisfaits</p>
              <Link to="/register" className="btn-neon-emerald inline-flex items-center gap-2 px-8 py-3 text-base">
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ────────────────────────────────────────── */}
        <section
          ref={ctaReveal.ref as React.RefObject<HTMLElement>}
          className={`py-20 relative overflow-hidden transition-all duration-700 ${ctaReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)' }}
        >
          {/* Glass overlay for depth */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.40)' }}>
              <HomeIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à démarrer votre projet immobilier ?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Rejoignez la communauté ImmoParticuliers et facilitez-vous la vie. Que vous soyez locataire ou
              propriétaire, trouvez votre bonheur sans frais d'agence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.40)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(255,255,255,0.10)',
                }}
              >
                <Tag className="w-4 h-4" />
                Voir les formules
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ───────────────────────────────────────────── */}
        <footer
          style={{
            background: 'rgba(5,10,24,0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          className="text-slate-400 pt-16 pb-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                    <HomeIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">ImmoParticuliers</span>
                </div>
                <p className="text-sm">La plateforme n°1 en France de l'immobilier entre particuliers.</p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Navigation</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => scrollTo('hero')} className="hover:text-blue-400 transition-colors">Accueil</button></li>
                  <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-blue-400 transition-colors">Comment ça marche</button></li>
                  <li><Link to="/search" className="hover:text-blue-400 transition-colors">Trouver un bien</Link></li>
                  <li><Link to="/calculateur" className="hover:text-blue-400 transition-colors">Calculateur</Link></li>
                  <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Tarifs</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Légal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/mentions-legales" className="hover:text-blue-400 transition-colors">Mentions légales</Link></li>
                  <li><Link to="/cgu" className="hover:text-blue-400 transition-colors">CGU</Link></li>
                  <li><Link to="/confidentialite" className="hover:text-blue-400 transition-colors">Politique de confidentialité</Link></li>
                  <li><Link to="/cookies" className="hover:text-blue-400 transition-colors">Cookies</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/faq" className="hover:text-blue-400 transition-colors">FAQ</Link></li>
                  <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Nous contacter</Link></li>
                  <li><Link to="/support" className="hover:text-blue-400 transition-colors">Support</Link></li>
                  <li><Link to="/presse" className="hover:text-blue-400 transition-colors">Presse</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-8 text-center text-sm" style={{ borderTopColor: 'rgba(255,255,255,0.08)' }}>
              <p>© 2026 ImmoParticuliers. Tous droits réservés. Réalisé en France.</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
