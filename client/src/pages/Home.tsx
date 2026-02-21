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
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
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
  const [searchCity, setSearchCity] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchBudget, setSearchBudget] = useState('')
  const [activeTab, setActiveTab] = useState<'owner' | 'tenant'>('owner')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
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
    <div className="min-h-screen bg-white">
      {/* ─── HEADER ───────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <HomeIcon className="w-7 h-7 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">ImmoParticuliers</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollTo('hero')} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Accueil
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Comment ça marche
              </button>
              <button onClick={() => scrollTo('featured')} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Les biens
              </button>
              <button onClick={() => scrollTo('features')} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Avantages
              </button>
              <Link to="/login" className="btn btn-primary">
                Se connecter
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <button onClick={() => scrollTo('hero')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Accueil
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Comment ça marche
              </button>
              <button onClick={() => scrollTo('featured')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Les biens
              </button>
              <button onClick={() => scrollTo('features')} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                Avantages
              </button>
              <Link to="/login" className="block px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Se connecter
              </Link>
              <Link to="/register" className="block px-4 py-2 text-secondary-600 font-medium hover:bg-secondary-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Inscription
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ─── ALERT BANNER ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-center">
          <p className="text-sm text-warning-700 font-medium">
            Nouveau : découvrez notre nouvelle garantie loyers impayés{' '}
            <ChevronRight className="w-4 h-4 inline-block" />
          </p>
        </div>
      </div>

      {/* ─── HERO SECTION ─────────────────────────────────────────── */}
      <section id="hero" className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Location entre particuliers
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium mb-3">
            La plateforme n°1 en France de l'immobilier sans agence
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto mb-10">
            Propriétaires et locataires se rencontrent directement sur notre plateforme.
            Zéro frais d'agence, communication simplifiée, 100% sécurisé.
          </p>

          <p className="text-lg font-semibold text-gray-800 mb-2">Commencez par choisir votre profil :</p>
          <p className="text-sm text-gray-500 mb-8">
            Êtes-vous à la recherche d'un bien ou souhaitez-vous mettre le vôtre en location ?
          </p>

          {/* Profile Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Owner Card */}
            <div className="card border-2 border-transparent hover:border-primary-200 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Je suis Propriétaire</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Trouvez le locataire idéal et gérez votre location en toute simplicité.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Mise en ligne de votre annonce gratuite',
                  'Filtrage et vérification des dossiers',
                  'Contrat de location pré-rempli inclus',
                  'Garantie loyers impayés en option',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=OWNER" className="btn btn-primary w-full text-center block">
                Publier une annonce
              </Link>
            </div>

            {/* Tenant Card */}
            <div className="card border-2 border-transparent hover:border-secondary-200 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-secondary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Je suis Locataire</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Accédez à des milliers de biens exclusifs sans payer le moindre frais d'agence.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Recherche par critères personnalisés',
                  'Contact direct avec les propriétaires',
                  'Création de votre dossier locataire',
                  'Alertes personnalisées en temps réel',
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=TENANT" className="btn btn-secondary w-full text-center block">
                Trouver mon bien
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK SEARCH ─────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Ou lancez directement une recherche
          </h2>
          <p className="text-gray-500 mb-8">
            Trouvez le bien qui correspond à vos critères parmi nos annonces validées
          </p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-card-hover p-6 border border-gray-100">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="relative flex-1">
                <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Où ? (Ex: Paris, Lyon, Marseille...)"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="relative md:w-48">
                <HomeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                <Euro className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
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

      {/* ─── STATISTICS BAR ───────────────────────────────────────── */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-7 h-7 text-primary-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">2 000+</p>
              <p className="text-gray-700 font-medium">Biens loués</p>
              <p className="text-sm text-gray-500">cette année</p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-secondary-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">15 000+</p>
              <p className="text-gray-700 font-medium">Utilisateurs</p>
              <p className="text-sm text-gray-500">actifs</p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-7 h-7 text-warning-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">4.8/5</p>
              <p className="text-gray-700 font-medium">Note moyenne</p>
              <p className="text-sm text-gray-500">sur Trustpilot</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES (from API) ───────────────────────── */}
      <section id="featured" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Découvrez nos biens d'exception
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Une sélection de biens uniques et de qualité. Visitez virtuellement nos dernières
              pépites ou contactez les propriétaires en un clic pour organiser une visite.
            </p>
          </div>

          {loadingProperties ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="card overflow-hidden hover:shadow-lg transition-all cursor-pointer group p-0"
                >
                  <div className="relative h-52 bg-gray-200 overflow-hidden">
                    <img
                      src={property.images[0] || '/placeholder-property.jpg'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
                    />
                    <span className="absolute top-3 left-3 bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Nouveau
                    </span>
                    <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-lg shadow-md">
                      <span className="text-lg font-bold text-primary-600">{property.price}€</span>
                      <span className="text-sm text-gray-600"> / mois</span>
                    </div>
                    {property.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {property.images.length} photos
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      {property.city}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Square className="w-3.5 h-3.5" />
                        {property.surface} m²
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        {property.bedrooms} ch.
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        {property.bathrooms} sdb
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun bien disponible pour le moment.</p>
              <p className="text-sm text-gray-400 mt-1">Revenez bientôt pour découvrir nos nouvelles annonces !</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/search" className="btn btn-outline inline-flex items-center gap-2">
              Voir tous les biens
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Comment ça marche ?
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Que vous soyez propriétaire ou locataire, notre plateforme simplifie vos démarches.
              Suivez le guide étape par étape pour louer en toute sérénité.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTab('owner')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'owner'
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pour un propriétaire
            </button>
            <button
              onClick={() => setActiveTab('tenant')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'tenant'
                  ? 'bg-secondary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pour un locataire
            </button>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(activeTab === 'owner' ? OWNER_STEPS : TENANT_STEPS).map((step, index) => (
              <div key={step.title} className="card text-center relative">
                <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold ${
                  activeTab === 'owner' ? 'bg-primary-500' : 'bg-secondary-500'
                }`}>
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES / WHY US ────────────────────────────────────── */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Pourquoi choisir ImmoParticuliers ?
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              La première plateforme pensée à 100% pour les particuliers. Plus facile, plus rapide,
              plus économique pour les propriétaires et les locataires.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="w-14 h-14 bg-success-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Euro className="w-7 h-7 text-success-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Gratuit</h3>
              <p className="text-sm text-gray-600">Aucun frais d'agence pour le locataire. Publication de l'annonce gratuite pour le propriétaire.</p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Direct</h3>
              <p className="text-sm text-gray-600">Discutez sans intermédiaire via notre messagerie intégrée. Fini les pertes de temps.</p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-secondary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-secondary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Sécurisé</h3>
              <p className="text-sm text-gray-600">Identités vérifiées, dossiers certifiés et paiements en ligne protégés par nos partenaires bancaires.</p>
            </div>
            <div className="card text-center">
              <div className="w-14 h-14 bg-warning-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-7 h-7 text-warning-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support et garantie</h3>
              <p className="text-sm text-gray-600">Des experts à votre écoute et des assurances optionnelles pour louer en toute tranquillité.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION ────────────────────────────────────────── */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                À propos d'ImmoParticuliers
              </span>
            </h2>
            <p className="text-sm uppercase tracking-widest text-gray-500 font-medium">
              La plateforme qui révolutionne l'immobilier entre particuliers
            </p>
          </div>

          {/* Content Boxes */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card border-l-4 border-l-primary-500 md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Notre mission</h3>
                  <p className="text-gray-600">
                    Née d'un constat simple : la location immobilière coûte cher et prend du temps. Nous avons créé
                    ImmoParticuliers pour redonner le pouvoir aux particuliers. Notre objectif est de fluidifier
                    le marché locatif en supprimant les intermédiaires tout en garantissant une sécurité maximale
                    à chaque étape du processus.
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ce qui nous différencie</h3>
              <p className="text-gray-600 text-sm">
                Pas de frais cachés, pas d'attente interminable. Une plateforme intuitive pensée pour
                une expérience utilisateur irréprochable et transparente.
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Notre Promesse</h3>
              <p className="text-gray-600 text-sm">
                Une mise en relation rapide et pertinente. Des outils numériques de pointe pour sécuriser
                les dossiers et la gestion de votre location de A à Z.
              </p>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white mb-12">
            <h3 className="text-xl font-bold text-center mb-8">ImmoParticuliers en chiffres</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold">10 000+</p>
                <p className="text-white/80 text-sm">Annonces</p>
              </div>
              <div>
                <p className="text-3xl font-bold">5 000+</p>
                <p className="text-white/80 text-sm">Propriétaires</p>
              </div>
              <div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-white/80 text-sm">Taux de satisfaction</p>
              </div>
              <div>
                <p className="text-3xl font-bold">24h</p>
                <p className="text-white/80 text-sm">Délai moyen de location</p>
              </div>
            </div>
          </div>

          {/* Join CTA */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Rejoignez notre réseau de membres satisfaits</p>
            <Link to="/register" className="btn btn-secondary inline-flex items-center gap-2 px-8 py-3 text-base">
              Créer mon compte gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-secondary-600 via-primary-600 to-secondary-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HomeIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à démarrer votre projet immobilier ?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Rejoignez la communauté ImmoParticuliers et facilitez-vous la vie. Que vous soyez locataire ou
            propriétaire, trouvez votre bonheur sans frais d'agence.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-secondary-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Créer mon compte gratuitement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HomeIcon className="w-7 h-7 text-primary-400" />
                <span className="text-xl font-bold text-white">ImmoParticuliers</span>
              </div>
              <p className="text-sm">
                La plateforme n°1 en France de l'immobilier entre particuliers.
                Simplifiez vos démarches de location.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollTo('hero')} className="hover:text-primary-400 transition-colors">Accueil</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-primary-400 transition-colors">Comment ça marche</button></li>
                <li><Link to="/search" className="hover:text-primary-400 transition-colors">Trouver un bien</Link></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-primary-400 transition-colors">Avantages</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/mentions-legales" className="hover:text-primary-400 transition-colors">Mentions légales</Link></li>
                <li><Link to="/cgu" className="hover:text-primary-400 transition-colors">CGU</Link></li>
                <li><Link to="/confidentialite" className="hover:text-primary-400 transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/cookies" className="hover:text-primary-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Nous contacter</Link></li>
                <li><Link to="/support" className="hover:text-primary-400 transition-colors">Support</Link></li>
                <li><Link to="/presse" className="hover:text-primary-400 transition-colors">Presse</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 ImmoParticuliers. Tous droits réservés. Réalisé en France.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
