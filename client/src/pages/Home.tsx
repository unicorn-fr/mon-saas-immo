import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { useFavoriteStore } from '../store/favoriteStore'
import { PropertyCard } from '../components/property/PropertyCard'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useDarkSection } from '../hooks/useDarkSection'
import { Search, SlidersHorizontal, ArrowRight, Building2 } from 'lucide-react'
import { Property } from '../types/property.types'

const T = {
  bgBase:      '#fafaf8',
  bgSurface:   '#ffffff',
  bgMuted:     '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  night:       '#1a1a2e',
  caramel:     '#c4976a',
  border:      '#e4e1db',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const PROPERTY_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'LOFT', label: 'Loft' },
]

const PRICE_RANGES = [
  { value: '', label: 'Tous prix' },
  { value: '0-500', label: '< 500 €' },
  { value: '500-800', label: '500 – 800 €' },
  { value: '800-1200', label: '800 – 1 200 €' },
  { value: '1200-2000', label: '1 200 – 2 000 €' },
  { value: '2000-', label: '> 2 000 €' },
]

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const heroRef = useRef<HTMLElement>(null)
  useDarkSection(heroRef)

  const {
    properties: storeProperties,
    totalProperties,
    hasMore: storeHasMore,
    isLoading,
    fetchProperties,
  } = useProperties()
  const { loadFavorites } = useFavoriteStore()

  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const LIMIT = 12

  useEffect(() => {
    if (isAuthenticated) loadFavorites()
  }, [isAuthenticated])

  const buildFilters = () => {
    const filters: Record<string, unknown> = { status: 'AVAILABLE' }
    if (city.trim()) filters.city = city.trim()
    if (type) filters.type = type
    if (priceRange) {
      const [min, max] = priceRange.split('-')
      if (min) filters.minPrice = Number(min)
      if (max) filters.maxPrice = Number(max)
    }
    return filters
  }

  useEffect(() => {
    setAllProperties([])
    setPage(1)
    fetchProperties(buildFilters(), { page: 1, limit: LIMIT })
  }, [type, priceRange])

  useEffect(() => {
    if (page === 1) {
      setAllProperties(storeProperties)
    } else {
      setAllProperties(prev => {
        const ids = new Set(prev.map(p => p.id))
        return [...prev, ...storeProperties.filter(p => !ids.has(p.id))]
      })
    }
  }, [storeProperties])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setAllProperties([])
    setPage(1)
    fetchProperties(buildFilters(), { page: 1, limit: LIMIT })
  }

  const handleLoadMore = async () => {
    if (loadingMore || !storeHasMore) return
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    await fetchProperties(buildFilters(), { page: next, limit: LIMIT })
    setLoadingMore(false)
  }

  if (isAuthenticated && user) {
    if (user.role === 'OWNER')  return <Navigate to="/dashboard/owner"  replace />
    if (user.role === 'TENANT') return <Navigate to="/dashboard/tenant" replace />
  }

  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .home-input:focus { outline: none; border-color: ${T.caramel} !important; }
        .home-select:focus { outline: none; border-color: ${T.caramel} !important; }
        .prop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
          gap: 20px;
        }
        @media (max-width: 640px) {
          .hero-filters { flex-direction: column !important; }
          .hero-filters select { width: 100% !important; }
        }
      `}</style>

      <Header />

      {/* ── HERO compact ── */}
      <section
        ref={heroRef}
        style={{
          background: T.night,
          paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 80px), clamp(72px,11vh,120px))',
          paddingBottom: 'clamp(40px,6vh,64px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambiance orb */}
        <div aria-hidden style={{ position: 'absolute', top: -100, right: -60, width: 600, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.25) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)', position: 'relative', zIndex: 1 }}>
          {/* Titre court */}
          <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,56px)', color: '#fff', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Trouvez votre prochain logement.
          </h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: 'rgba(255,255,255,0.60)', margin: '0 0 28px' }}>
            Annonces entre particuliers · Zéro frais d'agence
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '8px 8px 8px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Search size={16} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
              <input
                className="home-input"
                type="text"
                placeholder="Ville, code postal…"
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ flex: 1, minWidth: 140, background: 'transparent', border: 'none', outline: 'none', fontFamily: T.fontBody, fontSize: 15, color: '#fff', padding: '6px 0' }}
              />
              <div className="hero-filters" style={{ display: 'flex', gap: 8 }}>
                <select
                  className="home-select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, fontFamily: T.fontBody, fontSize: 13, color: '#fff', padding: '8px 12px', cursor: 'pointer' }}
                >
                  {PROPERTY_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: T.night }}>{opt.label}</option>
                  ))}
                </select>
                <select
                  className="home-select"
                  value={priceRange}
                  onChange={e => setPriceRange(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, fontFamily: T.fontBody, fontSize: 13, color: '#fff', padding: '8px 12px', cursor: 'pointer' }}
                >
                  {PRICE_RANGES.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: T.night }}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{ background: T.caramel, border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', flexShrink: 0, transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Rechercher
              </button>
            </div>
          </form>

          {/* Liens rapides */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
            <Link to="/search" style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              <SlidersHorizontal size={12} /> Recherche avancée & carte
            </Link>
            <Link to="/register?role=OWNER" style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.caramel)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              <ArrowRight size={12} /> Publier une annonce
            </Link>
          </div>
        </div>

        {/* Wave transition */}
        <div aria-hidden style={{ position: 'absolute', bottom: -2, left: 0, right: 0, lineHeight: 0 }}>
          <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 40 }}>
            <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,8 1440,20 L1440,40 L0,40 Z" fill={T.bgBase}/>
          </svg>
        </div>
      </section>

      {/* ── Villes populaires ── */}
      <section style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Rechercher par ville</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { name: 'Paris', count: '2 400+', slug: 'paris' },
              { name: 'Lyon', count: '890+', slug: 'lyon' },
              { name: 'Marseille', count: '650+', slug: 'marseille' },
              { name: 'Bordeaux', count: '420+', slug: 'bordeaux' },
              { name: 'Toulouse', count: '510+', slug: 'toulouse' },
              { name: 'Nantes', count: '380+', slug: 'nantes' },
            ].map(ville => (
              <Link key={ville.slug} to={`/location/${ville.slug}`} style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 20px', background: BAI.bgMuted, borderRadius: 10,
                border: `1px solid ${BAI.border}`, textDecoration: 'none', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
              >
                <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>{ville.name}</span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>{ville.count} annonces</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(16px,5vw,40px) 80px' }}>

        {/* En-tête résultats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: T.ink, margin: 0 }}>
              {isLoading && allProperties.length === 0
                ? 'Chargement…'
                : totalProperties > 0
                  ? `${totalProperties} bien${totalProperties > 1 ? 's' : ''} disponible${totalProperties > 1 ? 's' : ''}`
                  : 'Aucun bien trouvé'
              }
            </h2>
            {(city || type || priceRange) && (
              <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkFaint, margin: '4px 0 0' }}>
                {[city, PROPERTY_TYPES.find(t => t.value === type)?.label, PRICE_RANGES.find(p => p.value === priceRange)?.label]
                  .filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <Link
            to="/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, color: T.inkMid, textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.ink; e.currentTarget.style.borderColor = T.ink }}
            onMouseLeave={e => { e.currentTarget.style.color = T.inkMid; e.currentTarget.style.borderColor = T.border }}
          >
            <SlidersHorizontal size={13} /> Filtres avancés
          </Link>
        </div>

        {/* Grille */}
        {isLoading && allProperties.length === 0 ? (
          <div className="prop-grid">
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ background: T.bgSurface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ height: 220, background: T.bgMuted }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 16, background: T.bgMuted, borderRadius: 4, marginBottom: 10, width: '65%' }} />
                  <div style={{ height: 13, background: T.bgMuted, borderRadius: 4, width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : allProperties.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: T.inkFaint }}>
            <Building2 size={48} style={{ opacity: 0.25, margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontSize: 22, color: T.inkMid, marginBottom: 8 }}>Aucun bien pour ces critères.</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Essayez de modifier ou de supprimer vos filtres.</p>
            <button
              onClick={() => { setCity(''); setType(''); setPriceRange('') }}
              style={{ background: T.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="prop-grid">
              {allProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Charger plus */}
            {storeHasMore && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 32px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: T.ink, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1, transition: 'all .15s' }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.borderColor = T.ink }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
                >
                  {loadingMore ? 'Chargement…' : 'Voir plus de biens'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Mini CTA ── */}
      <section style={{ background: T.night, padding: 'clamp(40px,6vh,64px) clamp(16px,5vw,40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 8px' }}>
              Vous êtes propriétaire ?
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Publiez votre bien en 8 minutes · Zéro commission sur le loyer
            </p>
          </div>
          <Link
            to="/register?role=OWNER"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.caramel, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0, transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Publier mon annonce <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Guide immobilier ── */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(40px,5vh,64px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 4 }}>Ressources</p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: BAI.ink, margin: 0 }}>Le guide de la location</h2>
            </div>
            <Link to="/guide" style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 600, textDecoration: 'none' }}>Tous les articles →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { tag: 'DOSSIER', title: 'Comment préparer un dossier locatif solide', temps: '5 min', slug: 'dossier-locatif' },
              { tag: 'JURIDIQUE', title: 'Comprendre le bail : les points clés', temps: '8 min', slug: 'comprendre-bail' },
              { tag: 'VISITE', title: 'Visite : 20 questions à poser', temps: '4 min', slug: 'questions-visite' },
              { tag: 'PROPRIÉTAIRE', title: 'Fixer le bon loyer pour son bien', temps: '6 min', slug: 'fixer-loyer' },
            ].map(article => (
              <Link key={article.slug} to={`/guide/${article.slug}`} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '20px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
              >
                <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.tenant, background: BAI.tenantLight, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>{article.tag}</span>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: BAI.ink, margin: '0 0 12px', lineHeight: 1.3 }}>{article.title}</p>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>📖 {article.temps} de lecture</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
