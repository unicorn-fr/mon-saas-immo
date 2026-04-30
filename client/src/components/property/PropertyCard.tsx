import { useNavigate } from 'react-router-dom'
import { Property } from '../../types/property.types'
import { MapPin, Bed, Bath, Square, Heart, Eye, Camera } from 'lucide-react'
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
  HOUSE: 'Maison',
  STUDIO: 'Studio',
  LOFT: 'Loft',
  VILLA: 'Villa',
  LAND: 'Terrain',
  COMMERCIAL: 'Local',
  PARKING: 'Parking',
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
  const fav = isFavorite(property.id)

  const handleClick = () => navigate(`/property/${property.id}`)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    try { await toggleFavorite(property.id) } catch {}
  }

  /* ── Compact variant (sidebar / map popup) ──────────────────── */
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        style={{
          display: 'flex', gap: 12, padding: 12, borderRadius: 10, cursor: 'pointer',
          background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          fontFamily: BAI.fontBody,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = BAI.tenantBorder
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,94,59,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = BAI.border
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ width: 80, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={mainImage}
            alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.src = '/placeholder-property.jpg' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: BAI.ink, margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {property.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: BAI.inkFaint, marginBottom: 6 }}>
            <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {property.city}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: BAI.inkFaint }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Bed style={{ width: 11, height: 11 }} />{property.bedrooms}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Square style={{ width: 11, height: 11 }} />{property.surface}m²
            </span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: BAI.ink, whiteSpace: 'nowrap', fontFamily: BAI.fontDisplay, fontSize: 14 }}>
              {Number(property.price).toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>
      </div>
    )
  }

  /* ── Default variant — carte éditoriale moderne ─────────────── */
  return (
    <article
      onClick={handleClick}
      style={{
        background: BAI.bgSurface,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: BAI.fontBody,
        border: `1px solid ${BAI.border}`,
        boxShadow: '0 1px 3px rgba(13,12,10,0.05), 0 6px 20px rgba(13,12,10,0.06)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,12,10,0.13)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(13,12,10,0.05), 0 6px 20px rgba(13,12,10,0.06)'
      }}
    >

      {/* ── Image wrapper — ratio 1:1 ────────────────────────── */}
      <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
        <img
          src={mainImage}
          alt={property.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onError={e => { e.currentTarget.src = '/placeholder-property.jpg' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        />

        {/* Gradient bottom overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,12,10,0.62) 0%, rgba(13,12,10,0.18) 45%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Type badge — top left */}
        {property.type && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(4px)',
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: 11, fontWeight: 600,
            color: BAI.ink,
            letterSpacing: '0.03em',
          }}>
            {TYPE_LABELS[property.type] ?? property.type}
          </div>
        )}

        {/* Favorite — top right */}
        <button
          onClick={handleFavoriteClick}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s, background 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <Heart style={{ width: 16, height: 16, fill: fav ? '#e11d48' : 'none', color: fav ? '#e11d48' : BAI.inkMid, transition: 'fill 0.15s, color 0.15s' }} />
        </button>

        {/* Price — bottom left, over gradient */}
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <span style={{
            fontFamily: BAI.fontDisplay, fontWeight: 700,
            fontSize: 22, color: '#ffffff',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            lineHeight: 1,
          }}>
            {Number(property.price).toLocaleString('fr-FR')} €
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', marginLeft: 4 }}>/mois</span>
        </div>

        {/* Photo count — bottom right */}
        {property.images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(13,12,10,0.5)',
            borderRadius: 20, padding: '3px 8px',
            fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
          }}>
            <Camera style={{ width: 11, height: 11 }} />
            {property.images.length}
          </div>
        )}
      </div>

      {/* ── Info block ──────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 16px' }}>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <MapPin style={{ width: 12, height: 12, color: BAI.caramel, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: BAI.caramel, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {property.city}{property.postalCode ? ` · ${property.postalCode}` : ''}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: BAI.ink,
          margin: '0 0 12px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: BAI.fontBody,
          lineHeight: 1.3,
        }}>
          {property.title}
        </h3>

        {/* Stats row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          borderTop: `1px solid ${BAI.border}`, paddingTop: 12,
        }}>
          {[
            { icon: <Bed style={{ width: 13, height: 13 }} />, label: `${property.bedrooms} ch.` },
            { icon: <Bath style={{ width: 13, height: 13 }} />, label: `${property.bathrooms} sdb.` },
            { icon: <Square style={{ width: 13, height: 13 }} />, label: `${property.surface} m²` },
          ].map(({ icon, label }, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: BAI.inkMid, fontWeight: 500,
              borderLeft: i > 0 ? `1px solid ${BAI.border}` : 'none',
              paddingLeft: i > 0 ? 12 : 0,
            }}>
              <span style={{ color: BAI.inkFaint }}>{icon}</span>
              {label}
            </div>
          ))}

          {/* Furnished tag */}
          {property.furnished && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
              padding: '3px 8px', borderRadius: 20,
              background: BAI.tenantLight, color: BAI.tenant,
              border: `1px solid ${BAI.tenantBorder}`,
              whiteSpace: 'nowrap',
            }}>
              Meublé
            </span>
          )}
        </div>

        {/* Vues / contacts si showStats */}
        {showStats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: BAI.inkFaint, marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye style={{ width: 12, height: 12 }} />{property.views} vues
            </span>
            <span>·</span>
            <span>{property.contactCount} contacts</span>
          </div>
        )}
      </div>
    </article>
  )
}
