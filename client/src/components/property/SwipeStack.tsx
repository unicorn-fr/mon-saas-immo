import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, MapPin, Bed, Bath, Square, Home, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Property } from '../../types/property.types'
import { Link } from 'react-router-dom'

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement', HOUSE: 'Maison', STUDIO: 'Studio',
  LOFT: 'Loft', DUPLEX: 'Duplex', VILLA: 'Villa', ROOM: 'Chambre',
}

interface SwipeStackProps {
  properties: Property[]
  onFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
  onClose: () => void
}

interface HistoryEntry { property: Property; wasFavorited: boolean }

// ── Draggable card ──────────────────────────────────────────────────────────────
function DragCard({
  property, onSwipeRight, onSwipeLeft, dragX,
}: {
  property: Property
  onSwipeRight: () => void
  onSwipeLeft: () => void
  dragX: ReturnType<typeof useMotionValue<number>>
}) {
  const controls = useAnimation()
  const images = property.images?.length ? property.images : ['/placeholder-property.jpg']
  const [imgIdx, setImgIdx] = useState(0)

  const likeOpacity  = useTransform(dragX, [20, 110], [0, 1])
  const nopeOpacity  = useTransform(dragX, [-110, -20], [1, 0])
  const cardRotate   = useTransform(dragX, [-300, 300], [-9, 9])

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 110) {
      await controls.start({ x: 700, rotate: 18, opacity: 0, transition: { duration: 0.3 } })
      dragX.set(0); onSwipeRight()
    } else if (info.offset.x < -110) {
      await controls.start({ x: -700, rotate: -18, opacity: 0, transition: { duration: 0.3 } })
      dragX.set(0); onSwipeLeft()
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } })
    }
  }

  const typeLabel = PROPERTY_TYPE_LABELS[property.type ?? ''] ?? property.type

  return (
    <motion.div
      drag="x"
      dragElastic={0.12}
      style={{ x: dragX, rotate: cardRotate, position: 'absolute', inset: 0, cursor: 'grab', willChange: 'transform', touchAction: 'none' }}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 0, overflow: 'hidden', background: '#0d0c0a', position: 'relative', userSelect: 'none' }}>

        {/* Full-screen image */}
        <img
          src={images[imgIdx]}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          draggable={false}
          onError={e => { e.currentTarget.src = '/placeholder-property.jpg' }}
        />

        {/* Image nav — prev/next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
              style={{ position: 'absolute', left: 12, top: '42%', zIndex: 10, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronLeft style={{ width: 18, height: 18, color: '#fff' }} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
              style={{ position: 'absolute', right: 12, top: '42%', zIndex: 10, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronRight style={{ width: 18, height: 18, color: '#fff' }} />
            </button>
            {/* Dots */}
            <div style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 10 }}>
              {images.map((_, i) => (
                <div key={i} style={{ width: i === imgIdx ? 18 : 5, height: 5, borderRadius: 999, background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }} />
              ))}
            </div>
          </>
        )}

        {/* Deep gradient — bottom 60% */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,9,8,0.97) 0%, rgba(10,9,8,0.72) 35%, rgba(10,9,8,0.18) 58%, transparent 75%)', pointerEvents: 'none' }} />

        {/* COUP DE CŒUR badge */}
        <motion.div style={{
          opacity: likeOpacity, position: 'absolute', top: 36, left: 20, zIndex: 10,
          background: '#1b5e3b', color: '#fff', borderRadius: 10, padding: '10px 18px',
          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 16,
          border: '2px solid #9fd4ba', transform: 'rotate(-8deg)',
          boxShadow: '0 4px 16px rgba(27,94,59,0.4)',
        }}>
          ❤️ Coup de cœur
        </motion.div>

        {/* PASSER badge */}
        <motion.div style={{
          opacity: nopeOpacity, position: 'absolute', top: 36, right: 20, zIndex: 10,
          background: '#9b1c1c', color: '#fff', borderRadius: 10, padding: '10px 18px',
          fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 16,
          border: '2px solid #fca5a5', transform: 'rotate(8deg)',
          boxShadow: '0 4px 16px rgba(155,28,28,0.4)',
        }}>
          ✕ Passer
        </motion.div>

        {/* Info panel — bottom of card */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 72px', zIndex: 5 }}>

          {/* Type badge */}
          <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600,
              color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>{typeLabel}</span>
            {property.furnished && (
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                background: 'rgba(159,212,186,0.25)', border: '1px solid rgba(159,212,186,0.5)',
                fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600,
                color: '#9fd4ba', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>Meublé</span>
            )}
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {Number(property.price).toLocaleString('fr-FR')} €
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>/mois</span>
            {property.charges && property.charges > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                + {property.charges}€ charges
              </span>
            )}
          </div>

          {/* Title */}
          <p style={{
            fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 17, fontWeight: 600,
            color: '#fff', margin: '0 0 10px',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {property.title}
          </p>

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
            <MapPin style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {property.address ? `${property.address}, ` : ''}{property.city}{property.postalCode ? ` ${property.postalCode}` : ''}
            </span>
          </div>

          {/* Spec pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { Icon: Square,  label: `${property.surface} m²` },
              { Icon: Bed,     label: `${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}` },
              { Icon: Bath,    label: `${property.bathrooms} sdb` },
              ...(property.floor != null ? [{ Icon: Home, label: `Étage ${property.floor}` }] : []),
            ].map(({ Icon, label }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 8, padding: '5px 10px',
              }}>
                <Icon style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.7)' }} />
                <span style={{ fontSize: 12, color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Deposit + amenities row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {property.deposit && property.deposit > 0 && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Dépôt {property.deposit.toLocaleString('fr-FR')}€
                </span>
              )}
              {property.hasParking && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>🚗 Parking</span>}
              {property.hasBalcony && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>🌿 Balcon</span>}
              {property.hasGarden  && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>🌳 Jardin</span>}
              {property.hasElevator && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>🛗 Ascenseur</span>}
            </div>
            <Link
              to={`/property/${property.id}`}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#c4976a', fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 600, textDecoration: 'none',
              }}
            >
              <ExternalLink style={{ width: 12, height: 12 }} />
              Voir l'annonce
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── SwipeStack — fullscreen overlay ────────────────────────────────────────────
export function SwipeStack({ properties, onFavorite, isFavorite, onClose }: SwipeStackProps) {
  const [stackIndex, setStackIndex] = useState(0)
  const [history, setHistory]       = useState<HistoryEntry[]>([])
  const dragX = useMotionValue(0)

  const current   = properties[stackIndex]
  const next1     = properties[stackIndex + 1]
  const next2     = properties[stackIndex + 2]
  const remaining = properties.length - stackIndex
  const savedCount = history.filter(h => isFavorite(h.property.id)).length

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
    if (!last.wasFavorited && isFavorite(last.property.id)) await onFavorite(last.property.id)
    setHistory(h => h.slice(0, -1))
    setStackIndex(i => i - 1)
    dragX.set(0)
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#fafaf8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X style={{ width: 20, height: 20, color: '#5a5754' }} />
        </button>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: '#edf7f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Home style={{ width: 32, height: 32, color: '#1b5e3b' }} />
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontStyle: 'italic', fontWeight: 700, color: '#0d0c0a' }}>Vous avez tout vu !</p>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: '#9e9b96', textAlign: 'center', maxWidth: 260, margin: 0 }}>
          Modifiez vos filtres pour découvrir d'autres biens.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {history.length > 0 && (
            <button onClick={handleUndo} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #e4e1db', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, cursor: 'pointer', color: '#5a5754' }}>
              ↩ Revoir le dernier
            </button>
          )}
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1a1a2e', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, cursor: 'pointer', color: '#fff', fontWeight: 600 }}>
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0d0c0a', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar — counter + close */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>{remaining}</span> à explorer
          </span>
          {savedCount > 0 && (
            <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              · {savedCount} ❤️
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.28)', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
        >
          <X style={{ width: 20, height: 20, color: '#ffffff', strokeWidth: 2.5 }} />
        </button>
      </div>

      {/* Card stack — fills entire screen */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Background card 2 */}
        {next2 && (
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.91) translateY(14px)', transformOrigin: 'bottom center', transition: 'transform 0.3s ease', opacity: 0.45, zIndex: 1 }}>
            <img src={next2.images?.[0] || '/placeholder-property.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} alt="" />
          </div>
        )}
        {/* Background card 1 */}
        {next1 && (
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.96) translateY(7px)', transformOrigin: 'bottom center', transition: 'transform 0.3s ease', opacity: 0.7, zIndex: 2 }}>
            <img src={next1.images?.[0] || '/placeholder-property.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} alt="" />
          </div>
        )}

        {/* Top draggable card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            style={{ position: 'absolute', inset: 0, zIndex: 3 }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
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

      {/* Bottom hint + undo */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: '12px 20px max(16px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.32)', margin: 0, letterSpacing: '0.04em' }}>
          ← Passer · Sauvegarder →
        </p>
        <button onClick={handleUndo} disabled={history.length === 0} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: history.length === 0 ? 'not-allowed' : 'pointer',
          opacity: history.length === 0 ? 0.25 : 0.65, padding: '4px 0',
        }}>
          <RotateCcw style={{ width: 13, height: 13, color: '#fff' }} />
          <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: '#fff' }}>Annuler</span>
        </button>
      </div>
    </div>
  )
}
