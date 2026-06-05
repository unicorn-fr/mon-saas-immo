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
import { Search, SlidersHorizontal, ArrowRight, Building2, Clock } from 'lucide-react'
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
  { value: '500-800', label: '500 - 800 €' },
  { value: '800-1200', label: '800 - 1 200 €' },
  { value: '1200-2000', label: '1 200 - 2 000 €' },
  { value: '2000-', label: '> 2 000 €' },
]

/* Guide articles data — slugs alignés avec GuideArticle.tsx */
const GUIDE_ARTICLES = [
  {
    tag: 'DOSSIER',
    title: 'Comment rédiger un dossier locatif solide',
    desc: 'Les pièces indispensables, les erreurs à éviter et les conseils pour maximiser vos chances face à des dizaines de candidats.',
    temps: '5 min',
    slug: 'dossier-locatif-solide',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    tag: 'JURIDIQUE',
    title: 'Comprendre le bail : tout ce que dit la loi',
    temps: '8 min',
    slug: 'comprendre-bail-loi',
    featured: false,
  },
  {
    tag: 'VISITE',
    title: 'Visite appartement : 20 questions à poser',
    temps: '4 min',
    slug: 'visite-appartement-questions',
    featured: false,
  },
  {
    tag: 'PROPRIÉTAIRE',
    title: 'Fixer le bon loyer pour son bien',
    temps: '6 min',
    slug: 'fixer-bon-loyer',
    featured: false,
  },
]

export default function Home() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
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
    if (authLoading) return
    if (isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')) return
    setAllProperties([])
    setPage(1)
    fetchProperties(buildFilters(), { page: 1, limit: LIMIT }).catch(() => {})
  }, [type, priceRange, authLoading])

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
    fetchProperties(buildFilters(), { page: 1, limit: LIMIT }).catch(() => {})
  }

  const handleLoadMore = async () => {
    if (loadingMore || !storeHasMore) return
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    await fetchProperties(buildFilters(), { page: next, limit: LIMIT }).catch(() => {})
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
        .home-input:focus { outline: none; }
        .home-select:focus { outline: none; }

        /* ── Property grid ── */
        .prop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
          gap: 20px;
        }
        @media (max-width: 480px) {
          .prop-grid { grid-template-columns: 1fr; gap: 14px; }
        }

        /* ── Hero search ── */
        .hero-search-wrap {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 6px 6px 6px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
        }
        .hero-search-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-family: ${T.fontBody};
          font-size: 16px; /* 16px = pas de zoom iOS */
          color: #fff;
          padding: 8px 0;
        }
        .hero-search-input::placeholder { color: rgba(255,255,255,0.40); }
        .hero-filters-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .hero-filters-row select {
          flex: 1;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          font-family: ${T.fontBody};
          font-size: 14px;
          color: #fff;
          padding: 11px 10px;
          min-height: 44px;
          cursor: pointer;
          -webkit-appearance: none;
        }
        .hero-search-btn {
          background: ${T.caramel};
          border: none;
          border-radius: 10px;
          padding: 0 20px;
          height: 44px;
          font-family: ${T.fontBody};
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          flex-shrink: 0;
          white-space: nowrap;
        }
        @media (max-width: 500px) {
          .hero-search-btn { padding: 0 14px; font-size: 13px; }
        }

        /* ── Ticker ── */
        @keyframes ticker-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { animation: ticker-slide 32s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        /* ── Villes — scroll horizontal sur mobile ── */
        .villes-scroll {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .villes-scroll {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .villes-scroll::-webkit-scrollbar { display: none; }
          .ville-chip { flex-shrink: 0; }
        }

        /* ── Guide editorial grid ── */
        .guide-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-template-rows: auto auto;
          gap: 16px;
        }
        .guide-featured { grid-row: 1 / 3; }
        @media (max-width: 768px) {
          .guide-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
          .guide-featured { grid-row: auto; grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .guide-grid { grid-template-columns: 1fr; }
        }
        .guide-small-card:hover { border-color: ${T.caramel} !important; }

        /* featured image height responsive */
        .guide-featured-img { width: 100%; object-fit: cover; display: block; }
        @media (min-width: 769px) { .guide-featured-img { height: 100%; min-height: 340px; } }
        @media (max-width: 768px) { .guide-featured-img { height: 220px; } }
        @media (max-width: 480px) { .guide-featured-img { height: 180px; } }

        /* ── CTA strip mobile ── */
        @media (max-width: 640px) {
          .owner-cta-strip { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .owner-cta-btn { width: 100% !important; justify-content: center !important; }
        }

        /* ── Quick links mobile ── */
        .hero-quick-links { display: flex; gap: 16px; margin-top: 20px; flex-wrap: wrap; }
        @media (max-width: 480px) {
          .hero-quick-links { gap: 12px; }
          .hero-quick-links a { font-size: 12px !important; min-height: 36px; }
        }

        /* ── Résultats header mobile ── */
        @media (max-width: 480px) {
          .results-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .results-header a { align-self: flex-start; }
        }
      `}</style>

      <Header />

      {/* ── HERO ── */}
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
          {/* Overline */}
          <p style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 12px' }}>
            Nouvelle façon de louer
          </p>

          <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(32px,5vw,56px)', color: '#fff', margin: '0 0 10px', lineHeight: 1.1, letterSpacing: '-0.02em', paddingBottom: 2 }}>
            Trouvez votre prochain logement.
          </h1>

          <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 6px' }}>
            Annonces entre particuliers, zéro frais d'agence
          </p>
          <p style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '0 0 28px', letterSpacing: '0.01em' }}>
            0 € de frais d'agence &nbsp;·&nbsp; Bail signé en ligne &nbsp;·&nbsp; Entre particuliers
          </p>

          {/* Search bar — ligne ville + bouton, filtres en dessous */}
          <form onSubmit={handleSearch}>
            {/* Ligne principale : icône + input + bouton */}
            <div className="hero-search-wrap">
              <Search size={16} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
              <input
                className="hero-search-input"
                type="text"
                inputMode="search"
                autoComplete="off"
                placeholder="Ville, code postal..."
                value={city}
                onChange={e => setCity(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">
                Rechercher
              </button>
            </div>

            {/* Filtres type + budget — ligne séparée, toujours visible */}
            <div className="hero-filters-row">
              <select
                className="home-select"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {PROPERTY_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: T.night }}>{opt.label}</option>
                ))}
              </select>
              <select
                className="home-select"
                value={priceRange}
                onChange={e => setPriceRange(e.target.value)}
              >
                {PRICE_RANGES.map(opt => (
                  <option key={opt.value} value={opt.value} style={{ background: T.night }}>{opt.label}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Quick links */}
          <div className="hero-quick-links">
            <Link to="/search"
              style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              <SlidersHorizontal size={12} /> Carte &amp; filtres avancés
            </Link>
            <Link to="/register?role=OWNER"
              style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44 }}
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

      {/* ── Ticker social proof ── */}
      <section style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to right, ${BAI.bgSurface}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${BAI.bgSurface}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div className="ticker-track" style={{ display: 'flex', width: 'max-content', padding: '14px 0' }}>
          {[...Array(2)].flatMap(() => [
            { stat: '0 €', label: 'de frais d\'agence' },
            { stat: '8 min', label: 'pour publier une annonce' },
            { stat: 'eIDAS', label: 'signature électronique certifiée' },
            { stat: 'loi ALUR', label: 'bail conforme' },
            { stat: '100%', label: 'gestion en ligne' },
            { stat: 'Entre particuliers', label: 'sans intermédiaire' },
            { stat: 'Gratuit', label: 'pour créer un compte' },
            { stat: 'Illimité', label: 'candidatures reçues' },
          ]).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', borderRight: `1px solid ${BAI.border}`, flexShrink: 0 }}>
              <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: BAI.caramel }}>{item.stat}</span>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ── Popular cities ── */}
      <section style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, borderTop: `1px solid ${BAI.border}`, padding: '24px 0', marginTop: 'clamp(24px,3vh,40px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Rechercher par ville</p>
          <div className="villes-scroll">
            {[
              { name: 'Paris', slug: 'paris' },
              { name: 'Lyon', slug: 'lyon' },
              { name: 'Marseille', slug: 'marseille' },
              { name: 'Bordeaux', slug: 'bordeaux' },
              { name: 'Toulouse', slug: 'toulouse' },
              { name: 'Nantes', slug: 'nantes' },
            ].map(ville => (
              <Link key={ville.slug} to={`/location/${ville.slug}`} className="ville-chip" style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 20px', background: BAI.bgMuted, borderRadius: 10,
                border: `1px solid ${BAI.border}`, textDecoration: 'none', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
              >
                <span style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>{ville.name}</span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>Voir les annonces</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTINGS ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(16px,5vw,40px) 80px' }}>

        {/* Header results */}
        <div className="results-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: T.ink, margin: 0 }}>
              {(authLoading || (isLoading && allProperties.length === 0))
                ? 'Chargement...'
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

        {/* Grid */}
        {(authLoading || (isLoading && allProperties.length === 0)) ? (
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
        ) : allProperties.length === 0 && !isLoading && !authLoading ? (
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

            {storeHasMore && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 32px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: T.ink, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1, transition: 'all .15s' }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.borderColor = T.ink }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}
                >
                  {loadingMore ? 'Chargement...' : 'Voir plus de biens'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Owner CTA strip ── */}
      <section style={{ background: T.night, padding: 'clamp(40px,6vh,64px) clamp(16px,5vw,40px)' }}>
        <div className="owner-cta-strip" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: '#fff', margin: '0 0 8px', paddingBottom: 2 }}>
              Vous êtes propriétaire ?
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              Publiez votre bien en 8 minutes — zéro commission sur le loyer
            </p>
          </div>
          <Link
            to="/register?role=OWNER"
            className="owner-cta-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.caramel, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, textDecoration: 'none', flexShrink: 0, transition: 'opacity .15s', minHeight: 48 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Publier mon annonce <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Guide editorial: 1 featured + 3 small ── */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(32px,5vh,64px) 0 calc(clamp(32px,5vh,64px) + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: BAI.ink, margin: 0, paddingBottom: 2 }}>Le guide de la location</h2>
            <Link to="/guide" style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 600, textDecoration: 'none' }}>Tous les articles</Link>
          </div>

          <div className="guide-grid">
            {/* Featured article */}
            {(() => {
              const featured = GUIDE_ARTICLES.find(a => a.featured)!
              return (
                <Link
                  to={`/guide/${featured.slug}`}
                  className="guide-featured guide-featured-card"
                  style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${BAI.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
                >
                  <img
                    src={featured.image ?? 'https://picsum.photos/seed/rental-dossier-documents/800/500'}
                    alt={featured.title}
                    className="guide-featured-img"
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(13,12,10,0.88) 0%, rgba(13,12,10,0.40) 60%, transparent 100%)', padding: 'clamp(16px,3vw,28px)' }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.caramel, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.35)', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>{featured.tag}</span>
                    <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(18px,2.5vw,24px)', color: '#fff', margin: '0 0 8px', lineHeight: 1.25, paddingBottom: 1 }}>
                      {featured.title}
                    </h3>
                    {featured.desc && (
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '0 0 10px', lineHeight: 1.5 }}>
                        {featured.desc}
                      </p>
                    )}
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.55)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {featured.temps} de lecture
                    </span>
                  </div>
                </Link>
              )
            })()}

            {/* 3 small articles */}
            {GUIDE_ARTICLES.filter(a => !a.featured).map(article => (
              <Link
                key={article.slug}
                to={`/guide/${article.slug}`}
                className="guide-small-card"
                style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s' }}
              >
                <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.tenant, background: BAI.tenantLight, padding: '2px 8px', borderRadius: 4, display: 'inline-block', alignSelf: 'flex-start' }}>{article.tag}</span>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 17, fontWeight: 700, color: BAI.ink, margin: 0, lineHeight: 1.3, paddingBottom: 1 }}>{article.title}</p>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                  <Clock size={11} /> {article.temps} de lecture
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
