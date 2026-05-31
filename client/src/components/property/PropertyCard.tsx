import { useNavigate } from 'react-router-dom'
import { Property } from '../../types/property.types'
import { MapPin, Bed, Square, Heart, Camera } from 'lucide-react'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useAuth } from '../../hooks/useAuth'
import { BAI } from '../../constants/bailio-tokens'

interface PropertyCardProps {
  property: Property
  variant?: 'default' | 'compact'
  showStats?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Appartement',
  HOUSE:     'Maison',
  STUDIO:    'Studio',
  DUPLEX:    'Duplex',
  LOFT:      'Loft',
  VILLA:     'Villa',
  LAND:      'Terrain',
  COMMERCIAL:'Local commercial',
  PARKING:   'Parking',
}

export const PropertyCard = ({ property, variant = 'default', showStats = false }: PropertyCardProps) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavoriteStore()

  const mainImage = property.images?.[0] || ''
  const fav = isFavorite(property.id)
  const typeLabel = TYPE_LABELS[property.type] ?? property.type

  const handleClick = () => navigate(`/property/${property.id}`)
  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    try { await toggleFavorite(property.id) } catch {}
  }

  // ── Compact (map popup, sidebar) ──────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        style={{
          display: 'flex', gap: 12, padding: '10px 12px',
          borderRadius: 10, cursor: 'pointer',
          background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
          transition: 'border-color 0.15s',
          fontFamily: BAI.fontBody,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.caramelBorder)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
      >
        <div style={{ width: 76, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: BAI.bgMuted }}>
          {mainImage && (
            <img src={mainImage} alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: BAI.caramel, margin: '0 0 2px', lineHeight: 1 }}>
            {Number(property.price).toLocaleString('fr-FR')} €
            <span style={{ fontFamily: BAI.fontBody, fontStyle: 'normal', fontSize: 11, fontWeight: 400, color: BAI.inkFaint, marginLeft: 3 }}>/mois</span>
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: BAI.ink, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: BAI.inkFaint }}>
            <MapPin size={10} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.city}</span>
            <span style={{ marginLeft: 6, color: BAI.border }}>·</span>
            <Square size={10} />
            <span>{property.surface} m²</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Default card ──────────────────────────────────────────────────────────
  return (
    <article
      onClick={handleClick}
      style={{
        background: BAI.bgSurface,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${BAI.border}`,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: BAI.fontBody,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = BAI.caramelBorder
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(13,12,10,0.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BAI.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Photo — 4:3 */}
      <div style={{ position: 'relative', paddingBottom: '66.66%', overflow: 'hidden', background: BAI.bgMuted }}>
        {mainImage ? (
          <img
            src={mainImage}
            alt={property.title}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Square size={32} color={BAI.inkFaint} style={{ opacity: 0.3 }} />
          </div>
        )}

        {/* Type — top left */}
        <span style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 6, padding: '3px 9px',
          fontSize: 11, fontWeight: 600, color: BAI.ink, letterSpacing: '0.02em',
        }}>
          {typeLabel}
        </span>

        {/* Favoris — top right */}
        <button
          onClick={handleFav}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'transform 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Heart size={14} fill={fav ? '#e11d48' : 'none'} color={fav ? '#e11d48' : BAI.inkMid} />
        </button>

        {/* Nb photos — bottom right */}
        {property.images?.length > 1 && (
          <span style={{
            position: 'absolute', bottom: 8, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(13,12,10,0.52)',
            borderRadius: 5, padding: '3px 7px',
            fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
          }}>
            <Camera size={10} />
            {property.images.length}
          </span>
        )}

        {/* Meublé tag */}
        {property.furnished && (
          <span style={{
            position: 'absolute', bottom: 8, left: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: BAI.tenantLight, color: BAI.tenant,
            borderRadius: 5, padding: '3px 7px',
          }}>
            Meublé
          </span>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '14px 16px 16px' }}>

        {/* Prix — élément dominant */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
          <span style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 26, color: BAI.caramel, lineHeight: 1,
          }}>
            {Number(property.price).toLocaleString('fr-FR')} €
          </span>
          <span style={{ fontSize: 12, color: BAI.inkFaint, fontWeight: 400 }}>/mois</span>
          {property.charges && property.charges > 0 && (
            <span style={{ fontSize: 11, color: BAI.inkFaint, marginLeft: 2 }}>
              + {Number(property.charges).toLocaleString('fr-FR')} € ch.
            </span>
          )}
        </div>

        {/* Localisation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <MapPin size={11} color={BAI.inkFaint} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: BAI.inkMid, fontWeight: 500 }}>
            {property.city}{property.postalCode ? ` (${property.postalCode.slice(0, 2)})` : ''}
          </span>
        </div>

        {/* Titre */}
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 17, color: BAI.ink, margin: '0 0 12px', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {property.title}
        </h3>

        {/* Specs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          borderTop: `1px solid ${BAI.border}`, paddingTop: 10,
          fontSize: 12, color: BAI.inkMid, fontWeight: 500,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Square size={12} color={BAI.inkFaint} />
            {property.surface} m²
          </span>
          {property.bedrooms > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bed size={12} color={BAI.inkFaint} />
              {property.bedrooms} ch.
            </span>
          )}
          {showStats && property.views > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: BAI.inkFaint }}>
              {property.views} vues
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
