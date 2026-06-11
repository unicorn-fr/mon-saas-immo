import { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { useFavoriteStore } from '../store/favoriteStore'
import { PropertyCard } from '../components/property/PropertyCard'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useDarkSection } from '../hooks/useDarkSection'
import { Search, ArrowRight, MapPin, Home as HomeIcon, Building2, TrendingUp, Shield, Clock, ChevronRight } from 'lucide-react'
import { Property } from '../types/property.types'
import { BAI } from '../constants/bailio-tokens'

// ─── Design tokens locaux (dark hero) ─────────────────────────────────────────

const H = {
  bg:      'linear-gradient(145deg, #0a0d14 0%, #111827 50%, #0f1419 100%)',
  glass:   'rgba(255,255,255,0.07)',
  glassHover: 'rgba(255,255,255,0.11)',
  border:  'rgba(255,255,255,0.12)',
  borderFocus: 'rgba(196,151,106,0.6)',
  caramel: '#c4976a',
  white:   '#ffffff',
  white70: 'rgba(255,255,255,0.70)',
  white45: 'rgba(255,255,255,0.45)',
  white25: 'rgba(255,255,255,0.25)',
  font:    "'DM Sans', system-ui, sans-serif",
  display: "'Cormorant Garamond', Georgia, serif",
} as const

const PROPERTY_TYPES = [
  { value: '', label: 'Tout type' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'LOFT', label: 'Loft' },
]

const PRICE_RANGES = [
  { value: '', label: 'Tout budget' },
  { value: '0-500', label: '< 500 €/mois' },
  { value: '500-800', label: '500 – 800 €' },
  { value: '800-1200', label: '800 – 1 200 €' },
  { value: '1200-2000', label: '1 200 – 2 000 €' },
  { value: '2000-', label: '> 2 000 €' },
]

const CITIES = [
  { name: 'Paris', slug: 'paris', count: '1 200+' },
  { name: 'Lyon', slug: 'lyon', count: '340+' },
  { name: 'Marseille', slug: 'marseille', count: '280+' },
  { name: 'Bordeaux', slug: 'bordeaux', count: '190+' },
  { name: 'Toulouse', slug: 'toulouse', count: '220+' },
  { name: 'Nantes', slug: 'nantes', count: '160+' },
]

const GUIDE_ARTICLES = [
  {
    tag: 'DOSSIER',
    title: 'Comment rédiger un dossier locatif solide',
    desc: 'Les pièces indispensables, les erreurs à éviter et les conseils pour maximiser vos chances.',
    temps: '5 min',
    slug: 'dossier-locatif-solide',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  { tag: 'JURIDIQUE', title: 'Comprendre le bail : tout ce que dit la loi', temps: '8 min', slug: 'comprendre-bail-loi', featured: false },
  { tag: 'VISITE', title: 'Visite appartement : 20 questions à poser', temps: '4 min', slug: 'visite-appartement-questions', featured: false },
  { tag: 'PROPRIÉTAIRE', title: 'Fixer le bon loyer pour son bien', temps: '6 min', slug: 'fixer-bon-loyer', featured: false },
]

// ─── Composant SearchBox (SeLoger style + verre) ───────────────────────────────

interface SearchBoxProps {
  city: string; setCity: (v: string) => void
  type: string; setType: (v: string) => void
  priceRange: string; setPriceRange: (v: string) => void
}

function SearchBox({ city, setCity, type, setType, priceRange, setPriceRange }: SearchBoxProps) {
  const [focused, setFocused] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (type) params.set('type', type)
    if (priceRange) {
      const [min, max] = priceRange.split('-')
      if (min) params.set('minPrice', min)
      if (max) params.set('maxPrice', max)
    }
    navigate(`/search?${params.toString()}`)
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backdropFilter: 'blur(28px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 20,
        padding: 8,
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Location */}
      <div style={{
        flex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 13,
        background: focused === 'city' ? 'rgba(255,255,255,0.10)' : 'transparent',
        transition: 'background 0.2s',
        cursor: 'text',
      }}>
        <MapPin size={16} color={focused === 'city' ? H.caramel : H.white45} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          type="text"
          placeholder="Ville, code postal…"
          value={city}
          onChange={e => setCity(e.target.value)}
          onFocus={() => setFocused('city')}
          onBlur={() => setFocused(null)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: H.font, fontSize: 15, color: H.white,
            width: '100%', minWidth: 0,
          }}
        />
      </div>

      {/* Separator */}
      <div style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '8px 0', flexShrink: 0 }} />

      {/* Type */}
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        onFocus={() => setFocused('type')}
        onBlur={() => setFocused(null)}
        style={{
          flex: 1,
          background: focused === 'type' ? 'rgba(255,255,255,0.10)' : 'transparent',
          border: 'none', outline: 'none',
          fontFamily: H.font, fontSize: 14,
          color: type ? H.white : H.white45,
          padding: '12px 14px',
          borderRadius: 13,
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          transition: 'background 0.2s',
          minWidth: 100,
        }}
      >
        {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value} style={{ background: '#111827', color: '#fff' }}>{o.label}</option>)}
      </select>

      {/* Separator */}
      <div style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '8px 0', flexShrink: 0 }} />

      {/* Budget */}
      <select
        value={priceRange}
        onChange={e => setPriceRange(e.target.value)}
        onFocus={() => setFocused('budget')}
        onBlur={() => setFocused(null)}
        style={{
          flex: 1,
          background: focused === 'budget' ? 'rgba(255,255,255,0.10)' : 'transparent',
          border: 'none', outline: 'none',
          fontFamily: H.font, fontSize: 14,
          color: priceRange ? H.white : H.white45,
          padding: '12px 14px',
          borderRadius: 13,
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          transition: 'background 0.2s',
          minWidth: 120,
        }}
      >
        {PRICE_RANGES.map(o => <option key={o.value} value={o.value} style={{ background: '#111827', color: '#fff' }}>{o.label}</option>)}
      </select>

      {/* CTA */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: H.caramel,
          border: 'none', borderRadius: 14,
          padding: '0 24px', height: 52, flexShrink: 0,
          fontFamily: H.font, fontSize: 15, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(196,151,106,0.4)',
          transition: 'box-shadow 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        <Search size={16} /> Rechercher
      </motion.button>
    </motion.form>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const heroRef = useRef<HTMLElement>(null)
  useDarkSection(heroRef)

  const { properties: storeProperties, totalProperties, hasMore: storeHasMore, isLoading, fetchProperties } = useProperties()
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
    <div style={{ backgroundColor: BAI.bgBase, fontFamily: BAI.fontBody, color: BAI.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ── Property grid ── */
        .prop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
          gap: 20px;
        }
        @media (max-width: 480px) { .prop-grid { grid-template-columns: 1fr; gap: 14px; } }

        /* ── Skeleton shimmer ── */
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .skel {
          background: linear-gradient(90deg, #f4f2ee 0%, #ebe8e2 40%, #f4f2ee 100%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }

        /* ── Ticker ── */
        @keyframes ticker-slide { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker-track { animation: ticker-slide 36s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        /* ── Hero search responsive ── */
        @media (max-width: 700px) {
          .hero-searchbox { flex-direction: column !important; border-radius: 16px !important; padding: 6px !important; }
          .hero-sep { display: none !important; }
          .hero-searchbox select, .hero-searchbox input { border-radius: 10px !important; background: rgba(255,255,255,0.09) !important; }
        }

        /* ── Cities scroll mobile ── */
        .cities-scroll { display: flex; gap: 10px; flex-wrap: wrap; }
        @media (max-width: 640px) {
          .cities-scroll { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }
          .cities-scroll::-webkit-scrollbar { display: none; }
          .city-chip { flex-shrink: 0; }
        }

        /* ── Guide grid ── */
        .guide-grid { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; gap: 16px; }
        .guide-featured { grid-row: 1 / 3; }
        @media (max-width: 768px) { .guide-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; } .guide-featured { grid-row: auto; grid-column: 1 / -1; } }
        @media (max-width: 480px) { .guide-grid { grid-template-columns: 1fr; } }
        .guide-featured-img { width: 100%; object-fit: cover; display: block; }
        @media (min-width: 769px) { .guide-featured-img { height: 100%; min-height: 340px; } }
        @media (max-width: 768px) { .guide-featured-img { height: 220px; } }
        @media (max-width: 480px) { .guide-featured-img { height: 180px; } }

        /* ── CTA strip mobile ── */
        @media (max-width: 640px) {
          .owner-cta-strip { flex-direction: column !important; align-items: stretch !important; }
          .owner-cta-btn { width: 100% !important; justify-content: center !important; }
        }

        /* ── Results header mobile ── */
        @media (max-width: 480px) {
          .results-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .results-header a { align-self: flex-start; }
        }

        /* ── Stat chips mobile ── */
        @media (max-width: 640px) {
          .hero-stats { gap: 8px !important; }
          .hero-stat-chip { padding: 6px 12px !important; font-size: 12px !important; }
        }
      `}</style>

      <Header />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — full viewport, fond sombre, glassmorphisme
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          background: H.bg,
          minHeight: '100dvh',
          paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 80px), 96px)',
          paddingBottom: 'clamp(48px,8vh,80px)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Ambient glows */}
        <div aria-hidden style={{ position: 'absolute', top: -120, right: -80, width: 700, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.18) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -100, width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(26,50,112,0.20) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)', position: 'relative', zIndex: 1, width: '100%' }}>

          {/* Overline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: H.font, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: H.caramel, margin: '0 0 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ width: 20, height: 1, background: H.caramel, display: 'inline-block' }} />
            Plateforme de location entre particuliers
          </motion.p>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: H.display, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(36px,6vw,68px)', color: H.white,
              margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-0.02em',
            }}
          >
            Trouvez votre logement<br />
            <span style={{ color: H.caramel }}>sans intermédiaire.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            style={{ fontFamily: H.font, fontSize: 16, color: H.white45, margin: '0 0 32px', lineHeight: 1.6 }}
          >
            Annonces directes entre propriétaires et locataires — 0 € de frais d'agence
          </motion.p>

          {/* Search box */}
          <SearchBox
            city={city} setCity={setCity}
            type={type} setType={setType}
            priceRange={priceRange} setPriceRange={setPriceRange}
          />

          {/* Stats glass chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.40 }}
            className="hero-stats"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}
          >
            {[
              { icon: '✦', text: '0 € de frais' },
              { icon: '⚡', text: 'Bail signé en ligne' },
              { icon: '🛡', text: 'Documents sécurisés' },
              { icon: '📄', text: 'Conforme loi ALUR' },
            ].map((s, i) => (
              <motion.span
                key={s.text}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.44 + i * 0.06, duration: 0.22 }}
                className="hero-stat-chip"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 999,
                  fontFamily: H.font, fontSize: 13, color: H.white70,
                }}
              >
                <span style={{ fontSize: 12 }}>{s.icon}</span>
                {s.text}
              </motion.span>
            ))}
          </motion.div>

          {/* Popular cities */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{ marginTop: 36 }}
          >
            <p style={{ fontFamily: H.font, fontSize: 11, fontWeight: 600, color: H.white25, letterSpacing: '0.10em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Villes populaires
            </p>
            <div className="cities-scroll">
              {CITIES.map((c, i) => (
                <motion.div
                  key={c.slug}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.58 + i * 0.05 }}
                  className="city-chip"
                >
                  <Link
                    to={`/location/${c.slug}`}
                    style={{
                      display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '10px 16px',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'background 0.18s, border-color 0.18s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(196,151,106,0.45)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    }}
                  >
                    <span style={{ fontFamily: H.font, fontWeight: 600, fontSize: 14, color: H.white }}>{c.name}</span>
                    <span style={{ fontFamily: H.font, fontSize: 11, color: H.white45 }}>{c.count} annonces</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom fade to base color */}
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, rgba(10,13,20,0.5))', pointerEvents: 'none' }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TRUST TICKER
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to right, ${BAI.bgSurface}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${BAI.bgSurface}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div className="ticker-track" style={{ display: 'flex', width: 'max-content', padding: '14px 0' }}>
          {[...Array(2)].flatMap(() => [
            { stat: '0 €', label: 'de frais d\'agence' },
            { stat: '8 min', label: 'pour publier une annonce' },
            { stat: 'eIDAS', label: 'signature électronique certifiée' },
            { stat: 'Loi ALUR', label: 'bail conforme' },
            { stat: '100%', label: 'gestion en ligne' },
            { stat: 'Entre particuliers', label: 'sans intermédiaire' },
            { stat: 'Gratuit', label: 'pour créer un compte' },
          ]).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', borderRight: `1px solid ${BAI.border}`, flexShrink: 0 }}>
              <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: BAI.caramel }}>{item.stat}</span>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LISTINGS
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(16px,5vw,40px) 80px' }}>

        {/* Header */}
        <div className="results-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>
              Annonces
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,3vw,34px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
              {(authLoading || (isLoading && allProperties.length === 0))
                ? 'Chargement…'
                : totalProperties > 0
                  ? `${totalProperties} bien${totalProperties > 1 ? 's' : ''} disponible${totalProperties > 1 ? 's' : ''}`
                  : 'Aucun bien trouvé'
              }
            </h2>
          </div>
          <Link
            to="/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.caramel, textDecoration: 'none', border: `1px solid ${BAI.caramelBorder ?? '#e8c59a'}`, borderRadius: 8, padding: '8px 16px', transition: 'all .15s', background: BAI.caramelLight ?? '#fdf5ec' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Voir tout <ChevronRight size={13} />
          </Link>
        </div>

        {/* Grid / Skeleton / Empty */}
        <AnimatePresence mode="wait">
          {(authLoading || (isLoading && allProperties.length === 0)) ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="prop-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ background: BAI.bgSurface, borderRadius: 12, border: `1px solid ${BAI.border}`, overflow: 'hidden' }}>
                  <div className="skel" style={{ height: 200, borderRadius: 0 }} />
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skel" style={{ height: 22, width: '55%' }} />
                    <div className="skel" style={{ height: 13, width: '40%' }} />
                    <div className="skel" style={{ height: 15, width: '80%' }} />
                    <div className="skel" style={{ height: 13, width: '60%', marginTop: 4 }} />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : allProperties.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '80px 0' }}>
              <Building2 size={48} color={BAI.inkFaint} style={{ opacity: 0.25, margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, color: BAI.inkMid, marginBottom: 8 }}>Aucun bien pour ces critères.</p>
              <p style={{ fontSize: 14, color: BAI.inkFaint, marginBottom: 24 }}>Essayez de modifier vos filtres.</p>
              <button onClick={() => { setCity(''); setType(''); setPriceRange('') }} style={{ background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Effacer les filtres
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="prop-grid">
                {allProperties.map((property, i) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: (i % 3) * 0.06, duration: 0.28 }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>
              {storeHasMore && (
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                  <motion.button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    whileHover={{ y: -2, boxShadow: `0 4px 20px rgba(13,12,10,0.10)` }}
                    whileTap={{ scale: 0.97 }}
                    style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '14px 36px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1, transition: 'border-color .15s', boxShadow: BAI.shadowMd }}
                  >
                    {loadingMore ? 'Chargement…' : 'Voir plus de biens'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          OWNER CTA — glass panel on dark
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: H.bg, padding: 'clamp(48px,7vh,80px) clamp(16px,5vw,40px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -80, left: -60, width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.15) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="owner-cta-strip"
          style={{
            maxWidth: 900, margin: '0 auto',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 28,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20, padding: 'clamp(24px,4vw,40px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,151,106,0.18)', border: '1px solid rgba(196,151,106,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HomeIcon size={16} color={H.caramel} />
              </div>
              <span style={{ fontFamily: H.font, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: H.caramel }}>
                Propriétaires
              </span>
            </div>
            <h2 style={{ fontFamily: H.display, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,34px)', color: H.white, margin: '0 0 8px', lineHeight: 1.1 }}>
              Publiez votre bien gratuitement
            </h2>
            <p style={{ fontFamily: H.font, fontSize: 14, color: H.white45, margin: 0, maxWidth: '48ch', lineHeight: 1.6 }}>
              Bail ALUR, signature eIDAS, dossiers locataires analysés par IA — tout inclus. Zéro commission sur les loyers.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {['8 min pour publier', 'Aucun abonnement requis', 'Support 7j/7'].map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: H.font, fontSize: 12, color: H.white70, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', padding: '4px 10px', borderRadius: 999 }}>
                  <span style={{ color: '#4ade80', fontSize: 10 }}>✓</span> {s}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/register?role=OWNER"
            className="owner-cta-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: H.caramel, color: '#fff', border: 'none', borderRadius: 12, padding: '16px 28px', fontFamily: H.font, fontSize: 15, fontWeight: 700, textDecoration: 'none', flexShrink: 0, transition: 'opacity .15s, transform .15s', minHeight: 52, boxShadow: '0 4px 20px rgba(196,151,106,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            Déposer une annonce <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 étapes visuelles
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgSurface, padding: 'clamp(48px,7vh,80px) clamp(16px,5vw,40px)', borderTop: `1px solid ${BAI.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>Comment ça marche</p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
              Simple. Rapide. Transparent.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: Search, title: 'Cherchez', desc: 'Filtres par ville, budget, surface. Carte interactive disponible.', color: BAI.owner, bg: BAI.ownerLight },
              { step: '02', icon: TrendingUp, title: 'Postulez', desc: 'Dossier locataire digital complet. L\'IA analyse et valorise vos documents.', color: BAI.caramel, bg: '#fdf5ec' },
              { step: '03', icon: Shield, title: 'Signez', desc: 'Bail ALUR conforme, signature eIDAS. 100% légal, 100% en ligne.', color: BAI.tenant, bg: BAI.tenantLight },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                whileHover={{ y: -4, boxShadow: BAI.shadowLg ?? '0 8px 24px rgba(13,12,10,0.10)' }}
                style={{
                  background: BAI.bgBase,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 16, padding: '28px 24px',
                  boxShadow: BAI.shadowMd,
                  position: 'relative',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
              >
                <span style={{ position: 'absolute', top: 18, right: 20, fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 48, fontWeight: 700, color: BAI.border, lineHeight: 1, userSelect: 'none' }}>{s.step}</span>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 17, color: BAI.ink, margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          GUIDE ÉDITORIAL
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(40px,6vh,72px) 0 calc(clamp(40px,6vh,72px) + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${BAI.border}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>Guide</p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,30px)', color: BAI.ink, margin: 0 }}>Le guide de la location</h2>
            </div>
            <Link to="/guide" style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Tous les articles <ChevronRight size={13} />
            </Link>
          </div>

          <div className="guide-grid">
            {(() => {
              const featured = GUIDE_ARTICLES.find(a => a.featured)!
              return (
                <Link to={`/guide/${featured.slug}`} className="guide-featured"
                  style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${BAI.border}`, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramel)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
                >
                  <img src={featured.image ?? 'https://picsum.photos/seed/rental-dossier/800/500'} alt={featured.title} className="guide-featured-img" loading="lazy" />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(13,12,10,0.90) 0%, rgba(13,12,10,0.45) 60%, transparent 100%)', padding: 'clamp(16px,3vw,28px)' }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.caramel, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.35)', padding: '3px 9px', borderRadius: 4, display: 'inline-block', marginBottom: 10 }}>{featured.tag}</span>
                    <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(18px,2.5vw,24px)', color: '#fff', margin: '0 0 8px', lineHeight: 1.25 }}>{featured.title}</h3>
                    {featured.desc && <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: '0 0 10px', lineHeight: 1.5 }}>{featured.desc}</p>}
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.50)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {featured.temps} de lecture
                    </span>
                  </div>
                </Link>
              )
            })()}

            {GUIDE_ARTICLES.filter(a => !a.featured).map(article => (
              <Link key={article.slug} to={`/guide/${article.slug}`}
                style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BAI.caramel; e.currentTarget.style.boxShadow = BAI.shadowMd }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.tenant, background: BAI.tenantLight, padding: '3px 9px', borderRadius: 4, display: 'inline-block', alignSelf: 'flex-start' }}>{article.tag}</span>
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 17, fontWeight: 700, color: BAI.ink, margin: 0, lineHeight: 1.3, flex: 1 }}>{article.title}</p>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
