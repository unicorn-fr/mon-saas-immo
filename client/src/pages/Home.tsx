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
import EmailCapture from '../components/ui/EmailCapture'

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
    name: 'Marie Lefèvre',
    role: 'Locataire',
    city: 'Paris 11e',
    profession: 'Infirmière',
    detail: 'Appartement trouvé en 4 jours',
    quote: "Mon dossier numérique a été partagé à 6 propriétaires en un clic. J'ai eu ma réponse positive le lendemain. Impossible à faire aussi vite en agence.",
    stars: 5,
    date: 'Avril 2025',
  },
  {
    initials: 'TC',
    name: 'Thomas Cordier',
    role: 'Propriétaire',
    city: 'Lyon 6e',
    profession: 'Propriétaire 3 biens',
    detail: '1 200 € économisés vs agence',
    quote: "J'ai publié mon T3 un lundi, j'avais 11 candidatures qualifiées le mercredi. La signature électronique ALUR était prête en 48h. Zéro paperasse.",
    stars: 5,
    date: 'Mars 2025',
  },
  {
    initials: 'SC',
    name: 'Sophie Chambon',
    role: 'Locataire',
    city: 'Bordeaux Chartrons',
    profession: 'Designer freelance',
    detail: 'Bail signé en 3 jours',
    quote: "En tant qu'auto-entrepreneuse, j'avais du mal à convaincre les propriétaires. L'analyse de dossier de Bailio a mis en avant ma stabilité. Bail signé en 3 jours.",
    stars: 5,
    date: 'Mai 2025',
  },
]

// ─── SearchBox ────────────────────────────────────────────────────────────────

const BUDGET_PRESETS = [
  { label: '800 €', value: '800' },
  { label: '1 000 €', value: '1000' },
  { label: '1 500 €', value: '1500' },
  { label: '2 000 €+', value: '2000' },
]

const SUG_STYLE: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
  background: 'rgba(8,11,26,0.97)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 14, overflow: 'hidden',
  boxShadow: '0 12px 40px rgba(0,0,0,0.50)',
}

interface SearchBoxProps {
  city: string; setCity: (v: string) => void
  type: string; setType: (v: string) => void
  maxBudget: string; setMaxBudget: (v: string) => void
}

function SearchBox({ city, setCity, type, setType, maxBudget, setMaxBudget }: SearchBoxProps) {
  const [focused, setFocused] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSug, setShowSug] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const handleCityChange = (val: string) => {
    setCity(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); setShowSug(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(val)}&fields=nom&boost=population&limit=5`)
        const data: { nom: string }[] = await r.json()
        setSuggestions(data.map(c => c.nom))
        setShowSug(true)
      } catch { /* silent */ }
    }, 220)
  }

  const selectCity = (name: string) => {
    setCity(name)
    setSuggestions([])
    setShowSug(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSug(false)
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (type) params.set('type', type)
    if (maxBudget) params.set('maxPrice', maxBudget)
    navigate(`/search?${params.toString()}`)
  }

  const motionProps = {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.45, delay: 0.30, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.09)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16,
  }

  const inputBase: React.CSSProperties = {
    background: 'transparent', border: 'none', outline: 'none',
    fontFamily: BAI.fontBody, color: '#ffffff', width: '100%', minWidth: 0,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.11em', textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 5,
  }

  const SuggestionsDropdown = showSug && suggestions.length > 0 ? (
    <div style={SUG_STYLE}>
      {suggestions.map(name => (
        <button
          key={name} type="button"
          onMouseDown={e => { e.preventDefault(); selectCity(name) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '11px 16px', border: 'none',
            background: 'transparent', cursor: 'pointer', textAlign: 'left',
            color: 'rgba(255,255,255,0.88)', fontFamily: BAI.fontBody, fontSize: 14,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <MapPin size={13} color={BAI.caramel} style={{ flexShrink: 0 }} />
          {name}
        </button>
      ))}
    </div>
  ) : null

  /* ── MOBILE ─────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <motion.form onSubmit={handleSubmit} {...motionProps}
        style={{ ...glassCard, padding: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {/* Ville */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 16px', position: 'relative' }}>
          <span style={labelStyle}>Où cherchez-vous ?</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={16} color={focused === 'city' ? BAI.caramel : 'rgba(255,255,255,0.40)'} style={{ flexShrink: 0 }} />
            <input
              type="text" placeholder="Paris, Lyon, Marseille…"
              value={city}
              onChange={e => handleCityChange(e.target.value)}
              onFocus={() => { setFocused('city'); if (suggestions.length) setShowSug(true) }}
              onBlur={() => { setFocused(null); setTimeout(() => setShowSug(false), 120) }}
              style={{ ...inputBase, fontSize: 16 }}
            />
          </div>
          {SuggestionsDropdown}
        </div>

        {/* Type + Budget côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Type */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px' }}>
            <span style={labelStyle}>Type de bien</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={15} color='rgba(255,255,255,0.38)' style={{ flexShrink: 0 }} />
              <select
                value={type} onChange={e => setType(e.target.value)}
                style={{ ...inputBase, fontSize: 15, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', color: type ? '#fff' : 'rgba(255,255,255,0.50)' }}
              >
                {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value} style={{ background: '#111827', color: '#fff' }}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Budget max */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 14px' }}>
            <span style={labelStyle}>Budget max. / mois</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Euro size={15} color={focused === 'budget' ? BAI.caramel : 'rgba(255,255,255,0.38)'} style={{ flexShrink: 0 }} />
              <input
                type="number" inputMode="numeric" placeholder="ex. 1 200"
                value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                onFocus={() => setFocused('budget')} onBlur={() => setFocused(null)}
                min="0" step="50"
                style={{ ...inputBase, fontSize: 16, color: maxBudget ? '#fff' : 'rgba(255,255,255,0.50)' }}
              />
            </div>
          </div>
        </div>

        {/* Budget presets */}
        <div style={{ display: 'flex', gap: 8, paddingLeft: 2 }}>
          {BUDGET_PRESETS.map(({ label: lbl, value: v }) => {
            const active = maxBudget === v
            return (
              <button
                type="button" key={v}
                onClick={() => setMaxBudget(active ? '' : v)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${active ? 'rgba(196,151,106,0.55)' : 'rgba(255,255,255,0.18)'}`,
                  background: active ? 'rgba(196,151,106,0.20)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.58)',
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {lbl}
              </button>
            )
          })}
        </div>

        {/* Submit */}
        <motion.button
          type="submit" whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: BAI.caramel, border: 'none', borderRadius: 14,
            height: 56, marginTop: 2,
            fontFamily: BAI.fontBody, fontSize: 16, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(196,151,106,0.42)',
          }}
        >
          <Search size={18} /> Rechercher un logement
        </motion.button>
      </motion.form>
    )
  }

  /* ── DESKTOP ──────────────────────────────────────────────────────────────── */
  return (
    <motion.form onSubmit={handleSubmit} {...motionProps}
      style={{
        ...glassCard,
        padding: 8, display: 'flex', gap: 0,
        alignItems: 'stretch', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Ville */}
      <div style={{ flex: 2, position: 'relative', minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 18px', height: 54, borderRadius: 10,
          background: focused === 'city' ? 'rgba(255,255,255,0.10)' : 'transparent',
          transition: 'background 0.18s',
        }}>
          <MapPin size={15} color={focused === 'city' ? BAI.caramel : 'rgba(255,255,255,0.38)'} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
          <input
            type="text" placeholder="Ville, code postal…"
            value={city}
            onChange={e => handleCityChange(e.target.value)}
            onFocus={() => { setFocused('city'); if (suggestions.length) setShowSug(true) }}
            onBlur={() => { setFocused(null); setTimeout(() => setShowSug(false), 120) }}
            style={{ ...inputBase, fontSize: 15 }}
          />
        </div>
        {SuggestionsDropdown}
      </div>

      <div style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '10px 0', flexShrink: 0 }} />

      {/* Type */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', height: 54, borderRadius: 10, minWidth: 0,
        background: focused === 'type' ? 'rgba(255,255,255,0.10)' : 'transparent',
        transition: 'background 0.18s',
      }}>
        <Building2 size={15} color={focused === 'type' ? BAI.caramel : 'rgba(255,255,255,0.38)'} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
        <select
          value={type} onChange={e => setType(e.target.value)}
          onFocus={() => setFocused('type')} onBlur={() => setFocused(null)}
          style={{ ...inputBase, fontSize: 14, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', color: type ? '#fff' : 'rgba(255,255,255,0.45)' }}
        >
          {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value} style={{ background: '#111827', color: '#fff' }}>{o.label}</option>)}
        </select>
      </div>

      <div style={{ width: 1, background: 'rgba(255,255,255,0.10)', margin: '10px 0', flexShrink: 0 }} />

      {/* Budget max */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', height: 54, borderRadius: 10, minWidth: 0,
        background: focused === 'budget' ? 'rgba(255,255,255,0.10)' : 'transparent',
        transition: 'background 0.18s',
      }}>
        <Euro size={15} color={focused === 'budget' ? BAI.caramel : 'rgba(255,255,255,0.38)'} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
        <input
          type="number" inputMode="numeric" placeholder="Budget max. (€/mois)"
          value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
          onFocus={() => setFocused('budget')} onBlur={() => setFocused(null)}
          min="0" step="50"
          style={{ ...inputBase, fontSize: 14, color: maxBudget ? '#fff' : 'rgba(255,255,255,0.45)' }}
        />
      </div>

      {/* CTA */}
      <motion.button
        type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: BAI.caramel, border: 'none', borderRadius: 10,
          padding: '0 26px', height: 54, flexShrink: 0,
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
  const [maxBudget, setMaxBudget] = useState('')
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
    if (maxBudget) filters.maxPrice = Number(maxBudget)
    return filters
  }

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated && (user?.role === 'OWNER' || user?.role === 'TENANT')) return
    setAllProperties([])
    setPage(1)
    fetchProperties(buildFilters(), { page: 1, limit: LIMIT }).catch(() => {})
  }, [type, maxBudget, authLoading])

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

        /* ── Hero search — hide number spinners ── */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

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
                  maxBudget={maxBudget} setMaxBudget={setMaxBudget}
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
          6. FEATURE — Pour les propriétaires (visuel)
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgBase, padding: 'clamp(64px,8vh,96px) clamp(20px,5vw,48px)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="feature-grid">

            {/* Photo gauche avec overlay glass */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block"
              style={{ order: 0, position: 'relative' }}
            >
              {/* Photo principale */}
              <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3' }}>
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
                  alt="Appartement moderne"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Gradient de bas pour lisibilité */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,13,26,0.60) 0%, transparent 50%)' }} />

                {/* Badge glass flottant bas */}
                <div style={{
                  position: 'absolute', bottom: 20, left: 20, right: 20,
                  background: 'rgba(10,13,26,0.72)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                }}>
                  {[
                    { v: '14', l: 'Candidatures' },
                    { v: '6', l: 'Visites' },
                    { v: '312', l: 'Vues' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.caramel, lineHeight: 1 }}>{s.v}</div>
                      <div style={{ fontFamily: BAI.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Petite photo en surimpression */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.28, duration: 0.4 }}
                style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 140, height: 100,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: `3px solid ${BAI.bgBase}`,
                  boxShadow: BAI.shadowLg,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=280&q=80"
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </motion.div>
            </motion.div>

            {/* Texte droite — épuré */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 14px' }}>
                Pour les propriétaires
              </p>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 'clamp(30px, 4vw, 46px)', color: BAI.ink,
                margin: '0 0 16px', lineHeight: 1.05,
              }}>
                Louez sereinement,<br />gérez en quelques clics.
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 16, color: BAI.inkMid, lineHeight: 1.65, margin: '0 0 32px', maxWidth: 400 }}>
                Publiez votre bien en 5 minutes, recevez des candidatures qualifiées et signez vos contrats en ligne.
              </p>

              {/* 3 pictos horizontal */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 36, flexWrap: 'wrap' }}>
                {[
                  { emoji: '📸', text: 'Publication rapide' },
                  { emoji: '👥', text: 'Candidats vérifiés' },
                  { emoji: '✍️', text: 'Contrat ALUR' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <Link to="/register?role=OWNER"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: BAI.night, color: '#fff',
                  borderRadius: 10, padding: '14px 28px',
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                  textDecoration: 'none', transition: 'opacity 0.18s',
                  boxShadow: '0 4px 20px rgba(26,26,46,0.18)',
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

          {/* Header avec note agrégée */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
              Avis utilisateurs
            </p>
            <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: BAI.ink, margin: '0 0 20px', lineHeight: 1.1 }}>
              Ce qu'ils ont vécu.
            </h2>
            {/* Rating agrégé */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 40, padding: '8px 18px', boxShadow: BAI.shadowSm }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: 15, color: BAI.caramel }}>★</span>
                ))}
              </div>
              <span style={{ fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15, color: BAI.ink }}>4,9</span>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint }}>sur 5 · 2 400+ utilisateurs</span>
            </div>
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
                {/* Header: stars + badge résultat */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <span key={si} style={{ fontSize: 13, color: BAI.caramel }}>★</span>
                    ))}
                  </div>
                  <span style={{
                    fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600,
                    color: BAI.tenant, background: BAI.tenantLight,
                    border: `1px solid ${BAI.tenantBorder}`,
                    borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
                  }}>
                    ✓ {t.detail}
                  </span>
                </div>

                {/* Citation */}
                <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 16, color: BAI.ink, margin: 0, lineHeight: 1.55, flex: 1 }}>
                  "{t.quote}"
                </p>

                {/* Auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, borderTop: `1px solid ${BAI.border}` }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${BAI.caramel}22, ${BAI.caramel}44)`,
                    border: `1px solid ${BAI.caramel}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: BAI.caramel }}>{t.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14, color: BAI.ink }}>{t.name}</div>
                    <div style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 1 }}>
                      {t.profession} · {t.city}
                    </div>
                  </div>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, flexShrink: 0 }}>{t.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7b. PRICING PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#0a0d1a', padding: 'clamp(48px,7vh,72px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>
            Tarifs
          </p>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', margin: '0 0 12px', lineHeight: 1.1 }}>
            Simple. Transparent. <span style={{ color: BAI.caramel }}>Sans surprise.</span>
          </h2>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 40px', lineHeight: 1.6 }}>
            Commencez gratuitement. Passez au PRO quand vous êtes prêt.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {/* FREE */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '28px 24px', textAlign: 'left' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>Gratuit</p>
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#fff', margin: '0 0 16px', lineHeight: 1 }}>0 €</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['1 bien en gestion', 'Messagerie sécurisée', 'Candidatures illimitées', 'Signature électronique'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: BAI.caramel, fontSize: 13 }}>✓</span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRO */}
            <div style={{ background: 'rgba(196,151,106,0.08)', border: `2px solid ${BAI.caramel}`, borderRadius: 16, padding: '28px 24px', textAlign: 'left', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -12, left: 24, background: BAI.caramel, color: '#fff', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 12px', borderRadius: 20 }}>LE PLUS POPULAIRE</span>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>Pro</p>
              <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#fff', margin: '0 0 4px', lineHeight: 1 }}>9,90 €<span style={{ fontSize: 16, fontStyle: 'normal', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/mois</span></p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>Soit 118 €/an · Sans engagement</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Biens illimités', 'Bail loi ALUR + eIDAS', 'Quittances automatiques', 'IA analyse dossiers', 'Analytics & rentabilité'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: BAI.caramel, fontSize: 13 }}>✓</span>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/pricing"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: BAI.caramel, fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Voir le détail des fonctionnalités <ArrowRight size={15} />
          </Link>
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
              <button onClick={() => { setCity(''); setType(''); setMaxBudget('') }} style={{ background: BAI.night, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
          12. EMAIL CAPTURE — alertes nouveaux biens
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgMuted, borderTop: `1px solid ${BAI.border}`, padding: 'clamp(48px,7vh,80px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 10px' }}>Alertes</p>
          <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,3.5vw,36px)', color: BAI.ink, margin: '0 0 10px' }}>
            Soyez le premier informé
          </h2>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: BAI.inkMid, margin: '0 0 28px', lineHeight: 1.6 }}>
            Recevez une alerte dès qu'un bien correspond à vos critères. Aucun spam, désinscription en un clic.
          </p>
          <EmailCapture
            variant="light"
            placeholder="votre@email.fr"
            ctaLabel="Créer mon alerte"
            source="home_section"
            successMessage="Parfait ! Vous serez alerté dès qu'un bien correspond à votre recherche."
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          13. BADGES DE CONFIANCE
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: BAI.bgSurface, borderTop: `1px solid ${BAI.border}`, padding: 'clamp(28px,4vh,44px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px,4vw,48px)', flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', label: 'Données chiffrées', sub: 'HTTPS & chiffrement AES-256' },
              { icon: '🇫🇷', label: 'Hébergé en France', sub: 'Serveurs Railway EU-West' },
              { icon: '📋', label: 'Conforme RGPD', sub: 'Données non revendues' },
              { icon: '✍️', label: 'Signature eIDAS', sub: 'Valeur légale reconnue' },
              { icon: '💳', label: 'Paiements sécurisés', sub: 'Certifié Stripe PCI-DSS' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0, lineHeight: 1.3 }}>{b.label}</p>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          14. CTA FINAL — dark, 2 boutons
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
