import { useNavigate } from 'react-router-dom'
import { Property } from '../../types/property.types'
import { MapPin, Bed, Bath, Square, Heart, Eye } from 'lucide-react'
import { useFavoriteStore } from '../../store/favoriteStore'
import { useAuth } from '../../hooks/useAuth'

const M = {
  bg:          '#fafaf8',
  surface:     '#ffffff',
  muted:       '#f4f2ee',
  ink:         '#0d0c0a',
  inkMid:      '#5a5754',
  inkFaint:    '#9e9b96',
  tenant:      '#1b5e3b',
  tenantLight: '#edf7f2',
  tenantBorder:'#9fd4ba',
  caramel:     '#c4976a',
  caramelLight:'#fdf5ec',
  border:      '#e4e1db',
  borderMid:   '#ccc9c3',
  body:        "'DM Sans', system-ui, sans-serif",
  display:     "'Cormorant Garamond', Georgia, serif",
}

interface PropertyCardProps {
  property: Property
  variant?: 'default' | 'compact'
  showStats?: boolean
}

export const PropertyCard = ({
  property,
  variant = 'default',
  showStats = false,
}: PropertyCardProps) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite } = useFavoriteStore()

  const mainImage = property.images[0] || '/placeholder-property.jpg'

  const handleClick = () => {
    navigate(`/property/${property.id}`)
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await toggleFavorite(property.id)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  /* ── Compact variant ──────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        style={{
          display: 'flex', gap: 12, padding: 12, borderRadius: 10, cursor: 'pointer',
          background: M.surface, border: `1px solid ${M.border}`,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = M.tenantBorder
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,94,59,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = M.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <img
          src={mainImage}
          alt={property.title}
          style={{ width: 80, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: M.ink, margin: '0 0 2px',
            fontFamily: M.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {property.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: M.inkFaint, marginBottom: 6 }}>
            <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {property.city}, {property.postalCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: M.inkFaint }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Bed style={{ width: 11, height: 11 }} />{property.bedrooms}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Bath style={{ width: 11, height: 11 }} />{property.bathrooms}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Square style={{ width: 11, height: 11 }} />{property.surface}m²
            </span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: M.tenant, fontFamily: M.body }}>
              {property.price}€/mois
            </span>
          </div>
        </div>
      </div>
    )
  }

  /* ── Default variant ──────────────────────────────────────────── */
  return (
    <div
      onClick={handleClick}
      style={{
        background: M.surface,
        border: `1px solid ${M.border}`,
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        fontFamily: M.body,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = M.tenantBorder
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(27,94,59,0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = M.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={mainImage}
          alt={property.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
          onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        />

        {/* Favorite */}
        {isAuthenticated && (
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorite(property.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: `1px solid ${M.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Heart
              style={{
                width: 15, height: 15,
                fill: isFavorite(property.id) ? '#9b1c1c' : 'none',
                color: isFavorite(property.id) ? '#9b1c1c' : M.inkFaint,
              }}
            />
          </button>
        )}

        {/* Price badge */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(255,255,255,0.96)',
          border: `1px solid ${M.border}`,
          borderRadius: 8, padding: '4px 10px',
        }}>
          <span style={{ fontFamily: M.display, fontWeight: 700, fontSize: 17, color: M.ink }}>
            {property.price}€
          </span>
          <span style={{ fontSize: 11, color: M.inkFaint, marginLeft: 3 }}>/mois</span>
        </div>

        {/* Photo count */}
        {property.images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(13,12,10,0.55)',
            color: '#ffffff', fontSize: 10, fontWeight: 600,
            padding: '3px 8px', borderRadius: 6, fontFamily: M.body,
          }}>
            {property.images.length} photos
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600, color: M.ink,
          margin: '0 0 4px', fontFamily: M.body,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {property.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: M.inkMid, marginBottom: 12 }}>
          <MapPin style={{ width: 13, height: 13, flexShrink: 0, color: M.inkFaint }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.address}, {property.city}
          </span>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 12, color: M.inkMid,
          paddingBottom: 12, marginBottom: 12,
          borderBottom: `1px solid ${M.border}`,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Bed style={{ width: 13, height: 13, color: M.inkFaint }} />{property.bedrooms} ch.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Bath style={{ width: 13, height: 13, color: M.inkFaint }} />{property.bathrooms} sdb.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Square style={{ width: 13, height: 13, color: M.inkFaint }} />{property.surface}m²
          </span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {property.furnished && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
              background: M.tenantLight, color: M.tenant, border: `1px solid ${M.tenantBorder}`,
            }}>
              Meublé
            </span>
          )}
          {property.hasParking && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
              background: M.muted, color: M.inkMid, border: `1px solid ${M.border}`,
            }}>
              Parking
            </span>
          )}
          {property.hasBalcony && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
              background: M.muted, color: M.inkMid, border: `1px solid ${M.border}`,
            }}>
              Balcon
            </span>
          )}
          {property.hasElevator && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20,
              background: M.muted, color: M.inkMid, border: `1px solid ${M.border}`,
            }}>
              Ascenseur
            </span>
          )}
        </div>

        {/* Description or stats */}
        {showStats ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: M.inkFaint }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye style={{ width: 12, height: 12 }} />{property.views} vues
            </span>
            <span>·</span>
            <span>{property.contactCount} contacts</span>
          </div>
        ) : (
          <p style={{
            fontSize: 12, color: M.inkMid, margin: 0, lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {property.description}
          </p>
        )}
      </div>
    </div>
  )
}
