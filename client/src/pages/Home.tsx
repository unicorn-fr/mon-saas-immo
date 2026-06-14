import React, { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { useFavoriteStore } from '../store/favoriteStore'
import { PropertyCard } from '../components/property/PropertyCard'
import { Header } from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useDarkSection } from '../hooks/useDarkSection'
import {
  Search, ArrowRight, MapPin, Building2, TrendingUp, Shield,
  Clock, ChevronRight, Check, FolderOpen, Send, FileSignature, Euro,
  ChevronDown,
} from 'lucide-react'
import { Property } from '../types/property.types'
import { BAI } from '../constants/bailio-tokens'

// ─── Fond hero commun ─────────────────────────────────────────────────────────
const HERO_BG = '#0a0d1a'

// ─── Données statiques ────────────────────────────────────────────────────────

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
  { name: 'Paris', slug: 'paris', count: '1 200+', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&h=160&q=80' },
  { name: 'Lyon', slug: 'lyon', count: '340+', img: 'https://images.unsplash.com/photo-1524397057410-1e775ed476f3?auto=format&fit=crop&w=300&h=160&q=80' },
  { name: 'Marseille', slug: 'marseille', count: '280+', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&h=160&q=80' },
  { name: 'Bordeaux', slug: 'bordeaux', count: '190+', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&h=160&q=80' },
  { name: 'Toulouse', slug: 'toulouse', count: '220+', img: 'https://images.unsplash.com/photo-1508050919630-b135583b29ab?auto=format&fit=crop&w=300&h=160&q=80' },
  { name: 'Nantes', slug: 'nantes', count: '160+', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&h=160&q=80' },
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

// ─── Photos marquee ───────────────────────────────────────────────────────────

const MARQUEE_ROW1 = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&h=260&q=80',
]

const MARQUEE_ROW2 = [
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=260&q=80',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=400&h=260&q=80',
]

// ─── Témoignages ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    initials: 'ML',
    name: 'Marie L.',
    role: 'Locataire',
    city: 'Paris',
    quote: "J'ai trouvé mon appartement en 3 jours. Le dossier partageable m'a sauvé la mise.",
    stars: 5,
  },
  {
    initials: 'TM',
    name: 'Thomas M.',
    role: 'Propriétaire',
    city: 'Lyon',
    quote: "La signature électronique est un gain de temps fou. Plus jamais sans Bailio.",
    stars: 5,
  },
  {
    initials: 'SK',
    name: 'Sophie K.',
    role: 'Locataire',
    city: 'Bordeaux',
    quote: "L'interface est tellement intuitive. J'ai postulé à 5 appartements en 10 minutes.",
    stars: 5,
  },
]

// ─── SearchBox ────────────────────────────────────────────────────────────────

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
      className="hero-searchbox"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.30, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 16,
        padding: 8,
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Location */}
      <div style={{
        flex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        background: focused === 'city' ? 'rgba(255,255,255,0.08)' : 'transparent',
        transition: 'background 0.2s',
        cursor: 'text',
      }}>
        <MapPin size={15} color={focused === 'city' ? BAI.caramel : 'rgba(255,255,255,0.40)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          type="text"
          placeholder="Ville, code postal…"
          value={city}
          onChange={e => setCity(e.target.value)}
          onFocus={() => setFocused('city')}
          onBlur={() => setFocused(null)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: BAI.fontBody, fontSize: 15, color: '#ffffff',
            width: '100%', minWidth: 0,
          }}
        />
      </div>

      {/* Separator */}
      <div className="hero-sep" style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '8px 0', flexShrink: 0 }} />

      {/* Type */}
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        onFocus={() => setFocused('type')}
        onBlur={() => setFocused(null)}
        style={{
          flex: 1,
          background: focused === 'type' ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none', outline: 'none',
          fontFamily: BAI.fontBody, fontSize: 14,
          color: type ? '#ffffff' : 'rgba(255,255,255,0.45)',
          padding: '12px 14px',
          borderRadius: 10,
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
      <div className="hero-sep" style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '8px 0', flexShrink: 0 }} />

      {/* Budget */}
      <select
        value={priceRange}
        onChange={e => setPriceRange(e.target.value)}
        onFocus={() => setFocused('budget')}
        onBlur={() => setFocused(null)}
        style={{
          flex: 1,
          background: focused === 'budget' ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none', outline: 'none',
          fontFamily: BAI.fontBody, fontSize: 14,
          color: priceRange ? '#ffffff' : 'rgba(255,255,255,0.45)',
          padding: '12px 14px',
          borderRadius: 10,
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
          background: BAI.caramel,
          border: 'none', borderRadius: 10,
          padding: '0 24px', height: 52, flexShrink: 0,
          fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(196,151,106,0.40)',
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
          .hero-searchbox { flex-direction: column !important; border-radius: 14px !important; padding: 6px !important; }
          .hero-sep { display: none !important; }
          .hero-searchbox select, .hero-searchbox input { border-radius: 8px !important; background: rgba(255,255,255,0.08) !important; }
        }

        /* ── Bento grid ── */
        .bento-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 16px;
          margin-top: 40px;
        }
        .bento-card-tall { grid-row: 1 / 3; }
        .bento-card-wide { grid-column: 2 / 4; }
        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
          .bento-card-tall { grid-row: auto; }
          .bento-card-wide { grid-column: auto; }
        }

        /* ── Feature sections ── */
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(32px,5vw,80px); align-items: center; }
        @media (max-width: 768px) { .feature-grid { grid-template-columns: 1fr; gap: 32px; } }

        /* ── Cities grid ── */
        .cities-grid { display: flex; flex-wrap: wrap; gap: 12px; }

        /* ── Guide grid ── */
        .guide-grid { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; gap: 16px; }
        .guide-featured { grid-row: 1 / 3; }
        @media (max-width: 768px) { .guide-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; } .guide-featured { grid-row: auto; grid-column: 1 / -1; } }
        @media (max-width: 480px) { .guide-grid { grid-template-columns: 1fr; } }
        .guide-featured-img { width: 100%; object-fit: cover; display: block; }
        @media (min-width: 769px) { .guide-featured-img { height: 100%; min-height: 340px; } }
        @media (max-width: 768px) { .guide-featured-img { height: 220px; } }
        @media (max-width: 480px) { .guide-featured-img { height: 180px; } }

        /* ── Results header mobile ── */
        @media (max-width: 480px) {
          .results-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .results-header a { align-self: flex-start; }
        }

        /* ── Hero 2-col grid ── */
        .hero-layout {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,480px);
          gap: 48px;
          align-items: center;
        }
        .hero-images-col { display: block; }
        @media (max-width: 900px) {
          .hero-layout { grid-template-columns: 1fr; }
          .hero-images-col { display: none; }
        }

        /* ── Marquee keyframes ── */
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-left { animation: marquee-left 40s linear infinite; }
        .marquee-right { animation: marquee-right 45s linear infinite; }
        .marquee-left:hover, .marquee-right:hover { animation-play-state: paused; }

        /* ── Scroll indicator bounce ── */
        @keyframes bounce-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .scroll-bounce { animation: bounce-y 1.8s ease-in-out infinite; }

        /* ── Testimonials grid ── */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* ── Steps connection line ── */
        .steps-grid { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 640px) { .steps-grid { grid-template-columns: 1fr; } }
        .steps-line { position: absolute; top: 54px; left: calc(16.66% + 22px); right: calc(16.66% + 22px); height: 1px; background: rgba(255,255,255,0.08); pointer-events: none; }
        @media (max-width: 640px) { .steps-line { display: none; } }
      `}</style>

      <Header />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — full viewport, 2-col desktop
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          background: HERO_BG,
          minHeight: '100dvh',
          paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 80px), 100px)',
          paddingBottom: 'clamp(48px,8vh,96px)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Ambient glows */}
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 600, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.16) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -80, width: 460, height: 380, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(26,50,112,0.18) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)', position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="hero-layout">

            {/* Colonne gauche — texte + search */}
            <div>
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 style={{
                  fontFamily: BAI.fontDisplay,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: 'clamp(56px, 8vw, 96px)',
                  lineHeight: 0.95,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  <span style={{ display: 'block' }}>Trouvez<span style={{ color: BAI.caramel }}>.</span></span>
                  <span style={{ display: 'block' }}>Postulez<span style={{ color: BAI.caramel }}>.</span></span>
                  <span style={{ display: 'block' }}>Emménagez<span style={{ color: BAI.caramel }}>.</span></span>
                </h1>
              </motion.div>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.22 }}
                style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  color: 'rgba(255,255,255,0.65)',
                  maxWidth: 480,
                  marginTop: 24,
                  marginBottom: 0,
                  lineHeight: 1.55,
                }}
              >
                De la recherche à la signature du bail, sans agence, sans frais.
              </motion.p>

              {/* Boutons CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.30 }}
                style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}
              >
                <Link to="/search"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: BAI.caramel, color: '#fff',
                    borderRadius: 8, padding: '14px 28px',
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 16,
                    textDecoration: 'none', border: 'none',
                    transition: 'opacity 0.18s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                  Trouver un logement
                  <ArrowRight size={16} />
                </Link>
                <Link to="/register?role=OWNER"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'transparent', color: 'rgba(255,255,255,0.85)',
                    borderRadius: 8, padding: '14px 28px',
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 16,
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.30)',
                    transition: 'background 0.18s, border-color 0.18s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.50)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.30)' }}>
                  Publier une annonce
                </Link>
              </motion.div>

              {/* SearchBox */}
              <div style={{ marginTop: 48, maxWidth: 720 }}>
                <SearchBox
                  city={city} setCity={setCity}
                  type={type} setType={setType}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                />
              </div>

              {/* Stat chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.50 }}
                style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}
              >
                {[
                  '12 000+ annonces',
                  '0€ de frais d\'agence',
                  'Signature électronique',
                ].map((label, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.52 + i * 0.06 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 50,
                      fontFamily: BAI.fontBody, fontSize: 13,
                      color: 'rgba(255,255,255,0.70)',
                    }}
                  >
                    {label}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* Colonne droite — grille photos desktop */}
            <div className="hero-images-col" style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative' }}>
                {/* Photo 1 — grande gauche */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  style={{ gridRow: '1 / 3', borderRadius: 16, overflow: 'hidden', height: 360 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"
                    alt="Appartement moderne"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </motion.div>
                {/* Photo 2 — haut droite */}
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  style={{ borderRadius: 16, overflow: 'hidden', height: 170 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
                    alt="Salon lumineux"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </motion.div>
                {/* Photo 3 — bas droite décalé */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  style={{ borderRadius: 16, overflow: 'hidden', height: 170, marginTop: 8 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"
                    alt="Chambre élégante"
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </motion.div>
              </div>

              {/* Badge glass overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.75 }}
                style={{
                  position: 'absolute',
                  bottom: -16,
                  left: -16,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  borderRadius: 14,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,151,106,0.20)', border: '1px solid rgba(196,151,106,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Euro size={16} color={BAI.caramel} />
                </div>
                <div>
                  <div style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.caramel }}>0€ de frais</div>
                  <div style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>sans agence</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>Découvrir</span>
          <div className="scroll-bounce" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <ChevronDown size={20} />
          </div>
        </div>

        {/* Bottom fade */}
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${HERO_BG})`, pointerEvents: 'none' }} />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. BENTO GRID — Pourquoi Bailio
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header section */}
          <div style={{ maxWidth: 500 }}>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 12px',
            }}>
              Pourquoi Bailio
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 44px)', color: BAI.ink,
              margin: 0, lineHeight: 1.1,
            }}>
              Tout ce qu'une agence fait, en mieux.
            </h2>
          </div>

          {/* Bento grid */}
          <div className="bento-grid">

            {/* Carte 1 — Grande (col 1, row 1-2) avec image */}
            <div className="bento-card-tall"
              style={{
                background: BAI.night, borderRadius: 16,
                padding: 'clamp(20px, 2.5vw, 32px)',
                display: 'flex', flexDirection: 'column', gap: 12,
                minHeight: 300,
                overflow: 'hidden',
              }}>
              {/* Image en tête */}
              <div style={{ height: 180, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80"
                  alt="Appartement"
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <FolderOpen size={32} color={BAI.caramel} />
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(20px, 2vw, 26px)', color: '#ffffff',
                margin: '8px 0 0', lineHeight: 1.15,
              }}>
                Votre dossier,<br />votre clé
              </h3>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.62)', margin: 0, lineHeight: 1.6 }}>
                Passeports, fiches de paie, avis d'imposition. Tout centralisé, partagé en un clic auprès des propriétaires.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <Link to="/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                    color: BAI.caramel, textDecoration: 'none',
                  }}>
                  Créer mon dossier <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Carte 2 — Postulez partout */}
            <div
              style={{
                background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
                borderRadius: 16, padding: 'clamp(20px, 2.5vw, 28px)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
              <Send size={24} color={BAI.owner} />
              <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 16, color: BAI.ink, margin: 0 }}>
                Postulez partout
              </h3>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.55 }}>
                Un dossier, des dizaines de candidatures. En quelques secondes.
              </p>
            </div>

            {/* Carte 3 — Signez en ligne */}
            <div
              style={{
                background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                borderRadius: 16, padding: 'clamp(20px, 2.5vw, 28px)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
              <FileSignature size={24} color={BAI.tenant} />
              <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 16, color: BAI.ink, margin: 0 }}>
                Signez en ligne
              </h3>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.55 }}>
                Bail conforme loi ALUR, signature eIDAS certifiée. 100% légal.
              </p>
            </div>

            {/* Carte 4 — Zéro frais (col 2-4) */}
            <div className="bento-card-wide"
              style={{
                background: BAI.caramel, borderRadius: 16,
                padding: 'clamp(20px, 2.5vw, 28px)',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
              <Euro size={28} color="#ffffff" />
              <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 17, color: '#ffffff', margin: 0 }}>
                Zéro frais d'agence
              </h3>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.80)', margin: 0 }}>
                Entre particuliers, de bout en bout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. MARQUEE PHOTOS — Logements en vedette
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(48px,6vh,72px) 0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)', marginBottom: 40 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 12px' }}>
            Logements en vedette
          </p>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
            Des biens qui vous ressemblent.
          </h2>
        </div>

        {/* Fades bords */}
        <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, #0a0d1a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, background: 'linear-gradient(to left, #0a0d1a, transparent)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Rangée 1 — vers la gauche */}
        <div style={{ overflow: 'hidden', marginBottom: 14 }}>
          <div className="marquee-left" style={{ display: 'flex', width: 'max-content', gap: 14 }}>
            {[...MARQUEE_ROW1, ...MARQUEE_ROW1].map((src, i) => (
              <div key={i} style={{ width: 300, height: 200, flexShrink: 0, borderRadius: 14, overflow: 'hidden' }}>
                <img src={src} alt="Logement" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Rangée 2 — vers la droite */}
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-right" style={{ display: 'flex', width: 'max-content', gap: 14 }}>
            {[...MARQUEE_ROW2, ...MARQUEE_ROW2].map((src, i) => (
              <div key={i} style={{ width: 300, height: 200, flexShrink: 0, borderRadius: 14, overflow: 'hidden' }}>
                <img src={src} alt="Logement" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. COMMENT CA MARCHE — fond sombre glass
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(48px,7vh,80px) clamp(20px,5vw,48px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.07) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>
              Comment ça marche
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: '#ffffff', margin: 0, lineHeight: 1.1 }}>
              Simple. Rapide. Transparent.
            </h2>
          </div>

          <div className="steps-grid">
            {/* Ligne de connexion desktop */}
            <div className="steps-line" />

            {[
              { step: '01', icon: Search, title: 'Cherchez', desc: 'Filtres par ville, budget, surface. Carte interactive disponible.', color: BAI.caramel },
              { step: '02', icon: TrendingUp, title: 'Postulez', desc: 'Dossier locataire digital complet. L\'IA analyse et valorise vos documents.', color: BAI.caramel },
              { step: '03', icon: Shield, title: 'Signez', desc: 'Bail ALUR conforme, signature eIDAS. 100% légal, 100% en ligne.', color: BAI.caramel },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 20,
                  padding: '28px 24px',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', top: 16, right: 18, fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 52, fontWeight: 700, color: 'rgba(255,255,255,0.06)', lineHeight: 1, userSelect: 'none' }}>{s.step}</span>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(196,151,106,0.15)', border: '1px solid rgba(196,151,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <h3 style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 18, color: '#ffffff', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.62)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. FEATURE — Pour les locataires (dark)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: HERO_BG, padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,48px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -60, left: -40, width: 400, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(196,151,106,0.12) 0%, transparent 65%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="feature-grid">

            {/* Texte gauche */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45 }}
            >
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 12px' }}>
                Pour les locataires
              </p>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)', color: '#ffffff',
                margin: '0 0 20px', lineHeight: 1.1,
              }}>
                Trouvez le bien idéal,<br />postulez en 2 minutes.
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  'Annonces de particuliers uniquement',
                  'Dossier locatif en ligne, partageable',
                  'Messagerie directe avec le propriétaire',
                ].map(point => (
                  <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(196,151,106,0.20)', border: `1px solid ${BAI.caramel}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color={BAI.caramel} />
                    </div>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 15, color: 'rgba(255,255,255,0.78)' }}>{point}</span>
                  </div>
                ))}
              </div>

              <Link to="/search"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: BAI.caramel, color: '#fff',
                  borderRadius: 8, padding: '13px 24px',
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                  textDecoration: 'none', transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                Commencer ma recherche <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Mockup droite — vraie image avec overlay */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="hidden md:block"
            >
              <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 380 }}>
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"
                  alt="Appartement disponible"
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Overlay gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,13,26,0.85) 0%, rgba(10,13,26,0.20) 60%, transparent 100%)' }} />
                {/* Info card glass en bas */}
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div>
                    <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 20, color: '#ffffff', lineHeight: 1 }}>890 €/mois</div>
                    <div style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> Lyon 3e — 45 m²
                    </div>
                  </div>
                  <div style={{ background: 'rgba(27,94,59,0.70)', border: '1px solid rgba(159,212,186,0.40)', borderRadius: 8, padding: '5px 10px', flexShrink: 0 }}>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: '#7de4aa' }}>DISPONIBLE</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. FEATURE — Pour les propriétaires (clair)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="feature-grid">

            {/* Mockup gauche — dashboard simplifié */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45 }}
              className="hidden md:block"
              style={{ order: 0 }}
            >
              <div style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 20,
                padding: 20,
                boxShadow: BAI.shadowLg,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {/* Header du mockup */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>Mes biens</span>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>2 publiés</span>
                </div>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Candidatures', value: '14', color: BAI.owner },
                    { label: 'Visites', value: '6', color: BAI.tenant },
                    { label: 'Vues', value: '312', color: BAI.caramel },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: BAI.bgMuted, borderRadius: 10, padding: '12px 10px' }}>
                      <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                {/* Liste de candidatures */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Marie L.', status: 'Nouveau', color: BAI.ownerLight, textColor: BAI.owner },
                    { name: 'Thomas M.', status: 'En cours', color: BAI.tenantLight, textColor: BAI.tenant },
                    { name: 'Sophie K.', status: 'Validé', color: BAI.caramelLight, textColor: BAI.caramel },
                  ].map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: BAI.bgBase, borderRadius: 8, border: `1px solid ${BAI.border}` }}>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink }}>{item.name}</span>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, background: item.color, color: item.textColor, padding: '3px 8px', borderRadius: 4 }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Texte droite */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 12px' }}>
                Pour les propriétaires
              </p>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)', color: BAI.ink,
                margin: '0 0 20px', lineHeight: 1.1,
              }}>
                Gérez tout depuis<br />un seul endroit.
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  'Publiez en 5 minutes, visible immédiatement',
                  'Sélectionnez vos locataires sereinement',
                  'Contrats signés en ligne, conformes loi ALUR',
                ].map(point => (
                  <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color={BAI.owner} />
                    </div>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 15, color: BAI.inkMid }}>{point}</span>
                  </div>
                ))}
              </div>

              <Link to="/register?role=OWNER"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: BAI.night, color: '#fff',
                  borderRadius: 8, padding: '13px 24px',
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                  textDecoration: 'none', transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
                Publier mon bien <ArrowRight size={15} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. TÉMOIGNAGES
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,48px)', borderTop: `1px solid ${BAI.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
              Ils nous font confiance
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
              Ce que disent nos utilisateurs.
            </h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.35 }}
                style={{
                  background: BAI.bgSurface,
                  border: `1px solid ${BAI.border}`,
                  borderRadius: 16,
                  padding: '28px 24px',
                  boxShadow: BAI.shadowMd,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {/* Étoiles */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <span key={si} style={{ fontSize: 14, color: BAI.caramel }}>★</span>
                  ))}
                </div>

                {/* Citation */}
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 17, color: BAI.ink, margin: 0, lineHeight: 1.5, flex: 1 }}>
                  "{t.quote}"
                </p>

                {/* Auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 17, fontWeight: 700, color: BAI.caramel }}>{t.initials}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>{t.name}</div>
                    <div style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>{t.role} · {t.city}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. VILLES — cards avec images
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgSurface, padding: 'clamp(48px,6vh,72px) clamp(20px,5vw,48px)', borderTop: `1px solid ${BAI.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
                Villes populaires
              </p>
              <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(22px,3vw,32px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
                Cherchez près de chez vous
              </h2>
            </div>
            <Link to="/search" style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.caramel, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Voir toutes les annonces <ChevronRight size={13} />
            </Link>
          </div>

          <div className="cities-grid">
            {CITIES.map((c, i) => (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.06, duration: 0.28 }}
              >
                <Link
                  to={`/location/${c.slug}`}
                  style={{
                    display: 'block',
                    width: 'clamp(140px, 20vw, 200px)',
                    height: 120,
                    borderRadius: 14,
                    overflow: 'hidden',
                    position: 'relative',
                    textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = BAI.shadowLg }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
                >
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Overlay gradient */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,13,26,0.75) 0%, transparent 60%)' }} />
                  {/* Texte */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 14, color: '#ffffff' }}>{c.name}</div>
                    <div style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{c.count} annonces</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. TRUST TICKER
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgBase, borderTop: `1px solid ${BAI.border}`, borderBottom: `1px solid ${BAI.border}`, overflow: 'hidden', position: 'relative' }}>
        <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to right, ${BAI.bgBase}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${BAI.bgBase}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
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
          10. ANNONCES RÉCENTES
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgBase, maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(20px,5vw,48px) 80px' }}>

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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.caramel, textDecoration: 'none', border: `1px solid ${BAI.caramelBorder}`, borderRadius: 8, padding: '8px 16px', transition: 'all .15s', background: BAI.caramelLight }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            Voir tout <ChevronRight size={13} />
          </Link>
        </div>

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
                    style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '14px 36px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1, boxShadow: BAI.shadowMd }}
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
          11. GUIDE ÉDITORIAL
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgMuted, padding: 'clamp(40px,6vh,72px) 0 calc(clamp(40px,6vh,72px) + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${BAI.border}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)' }}>
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

      {/* ══════════════════════════════════════════════════════════════════════
          12. CTA FINAL — dark, 2 boutons
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(64px,9vh,112px) clamp(20px,5vw,48px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        {/* Glow ambient caramel */}
        <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 360, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(196,151,106,0.18) 0%, transparent 60%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h2 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(36px, 5vw, 60px)', color: '#ffffff',
            margin: '0 0 18px', lineHeight: 1.05,
          }}>
            Prêt à trouver votre<br />prochain logement ?
          </h2>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: 'rgba(255,255,255,0.62)', margin: '0 0 40px' }}>
            Créez votre compte gratuitement et commencez dès aujourd'hui.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register?role=TENANT"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: BAI.caramel, color: '#fff',
                borderRadius: 8, padding: '14px 28px',
                fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 16,
                textDecoration: 'none', transition: 'opacity 0.18s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              Je suis locataire <ArrowRight size={16} />
            </Link>
            <Link to="/register?role=OWNER"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: 'rgba(255,255,255,0.85)',
                borderRadius: 8, padding: '14px 28px',
                fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 16,
                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.30)',
                transition: 'background 0.18s, border-color 0.18s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.borderColor = 'rgba(255,255,255,0.50)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.30)' }}>
              Je suis propriétaire
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
