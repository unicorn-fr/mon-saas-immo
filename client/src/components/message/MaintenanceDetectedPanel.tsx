import { useState, useCallback, useMemo } from 'react'
import { Wrench, MapPin, Phone, Globe, X, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { maintenanceService } from '../../services/maintenance.service'

// Keyword detection
const MAINTENANCE_KEYWORDS: Record<string, string[]> = {
  PLOMBERIE: ['plomb', 'fuit', 'fuite', 'robinet', 'évier', 'wc', 'toilette', "chasse d'eau", 'dégât des eaux', 'tuyau', 'canalisation', 'douche', 'baignoire', 'eau chaude', 'froid eau'],
  ELECTRICITE: ['électr', 'lumière', 'prise', 'disjoncteur', 'court-circuit', 'ampoule', 'interrupteur', 'courant', 'fusible', 'tableau électrique'],
  CHAUFFAGE: ['chauff', 'chaudière', 'radiateur', 'froid', 'température', 'thermostat', 'gaz', 'pas chaud', 'chauffage ne', 'chauffage fonctionne'],
  SERRURERIE: ['serrur', 'clé', 'clef', 'verrou', 'porte bloquée', 'fermé à clé', 'serrure', 'poignée'],
}

export function detectMaintenanceCategory(content: string): string | null {
  const lower = content.toLowerCase()
  for (const [category, keywords] of Object.entries(MAINTENANCE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category
  }
  if (/panne|cassé|broken|problème|défaut|répar|brisé|abîm/i.test(lower)) return 'AUTRE'
  return null
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMBERIE: 'Plomberie',
  ELECTRICITE: 'Electricite',
  CHAUFFAGE: 'Chauffage',
  SERRURERIE: 'Serrurerie',
  AUTRE: 'Maintenance',
}

const CATEGORY_SPECIALTY: Record<string, string> = {
  PLOMBERIE: 'Plombier',
  ELECTRICITE: 'Electricien',
  CHAUFFAGE: 'Chauffagiste',
  SERRURERIE: 'Serrurier',
  AUTRE: 'Artisan',
}

interface Contractor {
  name: string
  address?: string | null
  distance?: number | null
  phone?: string | null
  website?: string | null
  openingHours?: string | null
  rating?: number | null
  reviewCount?: number | null
}

interface Platform {
  name: string
  url: string
  description: string
}

type SortMode = 'rating' | 'distance'

interface Props {
  category: string
  propertyId: string
  propertyCity: string
  propertyLatitude?: number | null
  propertyLongitude?: number | null
  onDismiss: () => void
}

function StarRating({ rating, reviewCount }: { rating?: number | null; reviewCount?: number | null }) {
  if (rating == null) return null
  const rounded = Math.round(rating * 2) / 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => {
          const filled = i <= Math.floor(rounded)
          const half   = !filled && i === Math.ceil(rounded) && rounded % 1 !== 0
          return (
            <span
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1,
                color: filled || half ? '#d97706' : BAI.border,
              }}
            >
              ★
            </span>
          )
        })}
      </div>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: '#d97706' }}>
        {rating.toFixed(1)}
      </span>
      {reviewCount != null && (
        <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}

function ContractorCard({ contractor, specialty }: { contractor: Contractor; specialty: string }) {
  const contactHref = contractor.phone
    ? `tel:${contractor.phone}`
    : contractor.website ?? null

  return (
    <div
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: BAI.radiusLg,
        padding: '14px 16px',
        minWidth: 220,
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: BAI.shadowSm,
      }}
    >
      {/* Header: name + specialty */}
      <div>
        <p
          style={{
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 700,
            color: BAI.ink,
            margin: '0 0 2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contractor.name}
        </p>
        <span
          style={{
            display: 'inline-block',
            fontFamily: BAI.fontBody,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: BAI.caramel,
            background: BAI.caramelLight,
            border: `1px solid ${BAI.caramelBorder}`,
            borderRadius: BAI.radiusSm,
            padding: '2px 6px',
          }}
        >
          {specialty}
        </span>
      </div>

      {/* Rating */}
      <StarRating rating={contractor.rating} reviewCount={contractor.reviewCount} />

      {/* Distance */}
      {contractor.distance != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin style={{ width: 12, height: 12, color: BAI.inkFaint, flexShrink: 0 }} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
            {contractor.distance < 1
              ? `${Math.round(contractor.distance * 1000)} m`
              : `${contractor.distance.toFixed(1)} km`}
          </span>
        </div>
      )}

      {/* Optional icons row: phone + website */}
      {(contractor.phone || contractor.website) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {contractor.phone && (
            <a
              href={`tel:${contractor.phone}`}
              title={contractor.phone}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: BAI.radius,
                background: BAI.ownerLight,
                border: `1px solid ${BAI.ownerBorder}`,
                color: BAI.owner,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Phone style={{ width: 13, height: 13 }} />
            </a>
          )}
          {contractor.website && (
            <a
              href={contractor.website}
              target="_blank"
              rel="noopener noreferrer"
              title="Site web"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: BAI.radius,
                background: BAI.caramelLight,
                border: `1px solid ${BAI.caramelBorder}`,
                color: BAI.caramel,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Globe style={{ width: 13, height: 13 }} />
            </a>
          )}
        </div>
      )}

      {/* CTA */}
      {contactHref && (
        <a
          href={contactHref}
          target={contractor.phone ? undefined : '_blank'}
          rel={contractor.phone ? undefined : 'noopener noreferrer'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '9px 0',
            borderRadius: BAI.radius,
            background: BAI.night,
            color: '#fff',
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            minHeight: BAI.touchMin,
            marginTop: 'auto',
          }}
        >
          {contractor.phone
            ? <Phone style={{ width: 13, height: 13 }} />
            : <ExternalLink style={{ width: 13, height: 13 }} />}
          Contacter
        </a>
      )}
    </div>
  )
}

export function MaintenanceDetectedPanel({ category, propertyCity, propertyLatitude, propertyLongitude, onDismiss }: Props) {
  const [loading, setLoading]       = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [platforms, setPlatforms]   = useState<Platform[]>([])
  const [searched, setSearched]     = useState(false)
  const [showPlatforms, setShowPlatforms] = useState(false)
  const [sortMode, setSortMode]     = useState<SortMode>('rating')

  const handleSearch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.findContractors({
        latitude:  propertyLatitude,
        longitude: propertyLongitude,
        city:      propertyCity,
        category,
      })
      setContractors(result.contractors)
      setPlatforms(result.platforms)
      setSearched(true)
    } catch {
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [category, propertyCity, propertyLatitude, propertyLongitude])

  const sortedContractors = useMemo(() => {
    return [...contractors].sort((a, b) => {
      if (sortMode === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      return (a.distance ?? Infinity) - (b.distance ?? Infinity)
    })
  }, [contractors, sortMode])

  const specialty = CATEGORY_SPECIALTY[category] ?? 'Artisan'
  const label     = CATEGORY_LABELS[category]    ?? 'Maintenance'

  return (
    <div
      style={{
        margin: '8px 0 12px 48px',
        background: BAI.caramelLight,
        border: `1px solid ${BAI.caramelBorder}`,
        borderRadius: BAI.radiusLg,
        overflow: 'hidden',
        maxWidth: 560,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${BAI.caramelBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench style={{ width: 15, height: 15, color: BAI.caramel }} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.caramel }}>
            {label} detecte
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, padding: 4, lineHeight: 1 }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {!searched ? (
          <>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '0 0 12px', lineHeight: 1.6 }}>
              Votre locataire signale un probleme. Trouvez les meilleurs artisans proches de{' '}
              <strong style={{ color: BAI.ink }}>{propertyCity}</strong> directement ici.
            </p>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: BAI.radius,
                border: 'none',
                background: BAI.caramel,
                color: '#fff',
                fontFamily: BAI.fontBody,
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                minHeight: BAI.touchMin,
              }}
            >
              {loading
                ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                : <MapPin style={{ width: 14, height: 14 }} />
              }
              {loading ? 'Recherche en cours...' : 'Trouver des artisans a proximite'}
            </button>
          </>
        ) : (
          <>
            {sortedContractors.length > 0 ? (
              <>
                {/* Count + sort toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, margin: 0 }}>
                    {sortedContractors.length} artisan{sortedContractors.length > 1 ? 's' : ''} a proximite
                  </p>

                  {/* Sort toggle pill */}
                  <div
                    style={{
                      display: 'flex',
                      background: BAI.bgSurface,
                      border: `1px solid ${BAI.border}`,
                      borderRadius: 20,
                      padding: 2,
                      gap: 2,
                    }}
                  >
                    {(['rating', 'distance'] as SortMode[]).map(mode => {
                      const active = sortMode === mode
                      return (
                        <button
                          key={mode}
                          onClick={() => setSortMode(mode)}
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 16,
                            border: 'none',
                            cursor: 'pointer',
                            background: active ? BAI.night : 'transparent',
                            color: active ? '#fff' : BAI.inkMid,
                            transition: BAI.transition,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {mode === 'rating' ? 'Mieux notes' : 'Les plus proches'}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Horizontal scroll grid */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    marginBottom: 12,
                    scrollbarWidth: 'thin' as const,
                  }}
                >
                  {sortedContractors.map((c, i) => (
                    <ContractorCard key={`${c.name}-${i}`} contractor={c} specialty={specialty} />
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '0 0 12px', lineHeight: 1.5 }}>
                Aucun artisan trouve dans OpenStreetMap pour cette zone. Utilisez les plateformes ci-dessous.
              </p>
            )}

            {/* Platform links */}
            {platforms.length > 0 && (
              <>
                <button
                  onClick={() => setShowPlatforms(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    fontWeight: 600,
                    color: BAI.inkMid,
                    padding: 0,
                    marginBottom: showPlatforms ? 8 : 0,
                  }}
                >
                  {showPlatforms
                    ? <ChevronUp style={{ width: 13, height: 13 }} />
                    : <ChevronDown style={{ width: 13, height: 13 }} />}
                  Plateformes recommandees
                </button>
                {showPlatforms && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {platforms.map(p => (
                      <a
                        key={p.name}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 10px',
                          borderRadius: BAI.radius,
                          border: `1px solid ${BAI.border}`,
                          background: BAI.bgSurface,
                          fontFamily: BAI.fontBody,
                          fontSize: 11,
                          fontWeight: 600,
                          color: BAI.inkMid,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink style={{ width: 10, height: 10 }} />
                        {p.name}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
