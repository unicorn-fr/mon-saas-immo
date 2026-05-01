import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion'
import { Heart, X, RotateCcw, MapPin, Bed, Square, Home } from 'lucide-react'
import { Property } from '../../types/property.types'
import { Link } from 'react-router-dom'

interface SwipeStackProps {
  properties: Property[]
  onFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
}

interface HistoryEntry { property: Property; wasFavorited: boolean }

function DragCard({ property, onSwipeRight, onSwipeLeft, dragX }: {
  property: Property
  onSwipeRight: () => void
  onSwipeLeft: () => void
  dragX: ReturnType<typeof useMotionValue<number>>
}) {
  const controls = useAnimation()
  const images = property.images?.length ? property.images : ['/placeholder-property.jpg']
  const [imgIdx, setImgIdx] = useState(0)

  const likeOpacity = useTransform(dragX, [20, 120], [0, 1])
  const nopeOpacity = useTransform(dragX, [-120, -20], [1, 0])
  const cardRotate = useTransform(dragX, [-300, 300], [-10, 10])

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 120) {
      await controls.start({ x: 650, rotate: 18, opacity: 0, transition: { duration: 0.32 } })
      dragX.set(0)
      onSwipeRight()
    } else if (info.offset.x < -120) {
      await controls.start({ x: -650, rotate: -18, opacity: 0, transition: { duration: 0.32 } })
      dragX.set(0)
      onSwipeLeft()
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } })
    }
  }

  return (
    <motion.div
      drag="x"
      dragElastic={0.15}
      style={{ x: dragX, rotate: cardRotate, position: 'absolute', inset: 0, cursor: 'grab', willChange: 'transform', touchAction: 'none' }}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div style={{
        width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(13,12,10,0.18)',
        background: '#0d0c0a', position: 'relative', userSelect: 'none',
      }}>
        {/* Image */}
        <img
          src={images[imgIdx]}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          draggable={false}
          onError={e => { e.currentTarget.src = '/placeholder-property.jpg' }}
        />

        {/* Image nav dots */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                style={{ width: i === imgIdx ? 20 : 6, height: 6, borderRadius: 999, background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
            ))}
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,12,10,0.92) 0%, rgba(13,12,10,0.4) 40%, transparent 70%)', pointerEvents: 'none' }} />

        {/* COUP DE COEUR badge */}
        <motion.div style={{
          opacity: likeOpacity, position: 'absolute', top: 28, left: 24, zIndex: 10,
          background: '#1b5e3b', color: '#fff', borderRadius: 8, padding: '8px 16px',
          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15,
          border: '2px solid #9fd4ba', transform: 'rotate(-8deg)',
        }}>
          ❤️ Coup de cœur
        </motion.div>

        {/* PASSER badge */}
        <motion.div style={{
          opacity: nopeOpacity, position: 'absolute', top: 28, right: 24, zIndex: 10,
          background: '#9b1c1c', color: '#fff', borderRadius: 8, padding: '8px 16px',
          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15,
          border: '2px solid #fca5a5', transform: 'rotate(8deg)',
        }}>
          ✕ Passer
        </motion.div>

        {/* Property info at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 24px', zIndex: 5 }}>
          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {Number(property.price).toLocaleString('fr-FR')} €
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>/mois</span>
          </div>

          {/* Title */}
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {property.title}
          </p>

          {/* Location + specs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)' }}>
              <MapPin style={{ width: 13, height: 13 }} />
              <span style={{ fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{property.city}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)' }}>
              <Bed style={{ width: 13, height: 13 }} />
              <span style={{ fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{property.bedrooms} ch.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)' }}>
              <Square style={{ width: 13, height: 13 }} />
              <span style={{ fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{property.surface} m²</span>
            </div>
            {property.furnished && (
              <span style={{ fontSize: 11, fontFamily: "'DM Sans', system-ui, sans-serif", background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>Meublé</span>
            )}
          </div>

          {/* Voir le bien link */}
          <Link to={`/property/${property.id}`}
            onClick={e => e.stopPropagation()}
            style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: 'underline' }}>
            Voir l'annonce complète →
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function SwipeStack({ properties, onFavorite, isFavorite }: SwipeStackProps) {
  const [stackIndex, setStackIndex] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const dragX = useMotionValue(0)

  const current = properties[stackIndex]
  const next1 = properties[stackIndex + 1]
  const next2 = properties[stackIndex + 2]
  const remaining = properties.length - stackIndex

  async function handleSwipeRight() {
    if (!current) return
    const wasFav = isFavorite(current.id)
    if (!wasFav) await onFavorite(current.id)
    setHistory(h => [...h, { property: current, wasFavorited: wasFav }])
    setStackIndex(i => i + 1)
  }

  async function handleSwipeLeft() {
    if (!current) return
    setHistory(h => [...h, { property: current, wasFavorited: false }])
    setStackIndex(i => i + 1)
  }

  async function handleUndo() {
    const last = history[history.length - 1]
    if (!last) return
    if (!last.wasFavorited && isFavorite(last.property.id)) {
      await onFavorite(last.property.id)
    }
    setHistory(h => h.slice(0, -1))
    setStackIndex(i => i - 1)
    dragX.set(0)
  }

  async function triggerSwipeRight() {
    if (!current) return
    const wasFav = isFavorite(current.id)
    if (!wasFav) await onFavorite(current.id)
    setHistory(h => [...h, { property: current, wasFavorited: wasFav }])
    setStackIndex(i => i + 1)
    dragX.set(0)
  }

  async function triggerSwipeLeft() {
    if (!current) return
    setHistory(h => [...h, { property: current, wasFavorited: false }])
    setStackIndex(i => i + 1)
    dragX.set(0)
  }

  if (!current) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70dvh', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: '#edf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Home style={{ width: 32, height: 32, color: '#1b5e3b' }} />
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontStyle: 'italic', fontWeight: 700, color: '#0d0c0a' }}>
          Vous avez tout vu !
        </p>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: '#9e9b96', textAlign: 'center', maxWidth: 260 }}>
          Modifiez vos filtres pour découvrir d'autres biens.
        </p>
        {history.length > 0 && (
          <button onClick={handleUndo} style={{ marginTop: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #e4e1db', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, cursor: 'pointer', color: '#5a5754' }}>
            ↩ Revoir le dernier bien
          </button>
        )}
      </div>
    )
  }

  const savedCount = history.filter(h => isFavorite(h.property.id)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, userSelect: 'none' }}>
      {/* Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 4 }}>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: '#9e9b96' }}>
          <span style={{ fontWeight: 700, color: '#0d0c0a' }}>{remaining}</span> bien{remaining > 1 ? 's' : ''} à explorer
        </p>
        {history.length > 0 && (
          <span style={{ fontSize: 12, color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {savedCount} ❤️ sauvegardé{savedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', height: 'clamp(440px, 68dvh, 620px)', overflow: 'hidden' }}>
        {/* Background cards */}
        {next2 && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
            transform: 'scale(0.90) translateY(16px)', transformOrigin: 'bottom center',
            transition: 'transform 0.3s ease', opacity: 0.5, zIndex: 1,
            background: '#e4e1db',
          }}>
            <img src={next2.images?.[0] || '/placeholder-property.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} alt="" />
          </div>
        )}
        {next1 && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
            transform: 'scale(0.95) translateY(8px)', transformOrigin: 'bottom center',
            transition: 'transform 0.3s ease', opacity: 0.75, zIndex: 2,
            background: '#ccc9c3',
          }}>
            <img src={next1.images?.[0] || '/placeholder-property.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} alt="" />
          </div>
        )}

        {/* Top draggable card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            style={{ position: 'absolute', inset: 0, zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DragCard
              property={current}
              dragX={dragX}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {/* Dismiss */}
        <button onClick={triggerSwipeLeft} style={{
          width: 58, height: 58, borderRadius: '50%', border: '2px solid #fca5a5',
          background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(155,28,28,0.12)', transition: 'transform 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <X style={{ width: 24, height: 24, color: '#9b1c1c' }} />
        </button>

        {/* Undo */}
        <button onClick={handleUndo} disabled={history.length === 0} style={{
          width: 44, height: 44, borderRadius: '50%', border: '1px solid #e4e1db',
          background: '#fff', cursor: history.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: history.length === 0 ? 0.4 : 1, transition: 'opacity 0.2s, transform 0.15s',
        }}
          onMouseEnter={e => { if (history.length > 0) e.currentTarget.style.transform = 'scale(1.08)' }}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <RotateCcw style={{ width: 18, height: 18, color: '#5a5754' }} />
        </button>

        {/* Favorite */}
        <button onClick={triggerSwipeRight} style={{
          width: 58, height: 58, borderRadius: '50%', border: '2px solid #9fd4ba',
          background: isFavorite(current.id) ? '#1b5e3b' : '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(27,94,59,0.18)', transition: 'transform 0.15s, background 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Heart style={{ width: 24, height: 24, color: isFavorite(current.id) ? '#fff' : '#1b5e3b', fill: isFavorite(current.id) ? '#fff' : 'none' }} />
        </button>
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#9e9b96', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        Glisse → pour sauvegarder · Glisse ← pour passer
      </p>
    </div>
  )
}
