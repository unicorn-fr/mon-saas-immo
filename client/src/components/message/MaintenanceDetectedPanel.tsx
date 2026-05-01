import { useState, useCallback } from 'react'
import { Wrench, MapPin, Phone, Globe, ExternalLink, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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
  // Generic maintenance keywords
  if (/panne|cassé|broken|problème|défaut|répar|brisé|abîm/i.test(lower)) return 'AUTRE'
  return null
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMBERIE: '🔧 Plomberie',
  ELECTRICITE: '⚡ Électricité',
  CHAUFFAGE: '🔥 Chauffage',
  SERRURERIE: '🔑 Serrurerie',
  AUTRE: '🛠️ Maintenance',
}

interface Contractor {
  id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  distance: number
  openingHours: string | null
}

interface Platform {
  name: string
  url: string
  description: string
}

interface Props {
  category: string
  propertyId: string
  propertyCity: string
  propertyLatitude?: number | null
  propertyLongitude?: number | null
  onDismiss: () => void
}

export function MaintenanceDetectedPanel({ category, propertyCity, propertyLatitude, propertyLongitude, onDismiss }: Props) {
  const [loading, setLoading] = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [searched, setSearched] = useState(false)
  const [showPlatforms, setShowPlatforms] = useState(false)

  const handleSearch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.findContractors({
        latitude: propertyLatitude,
        longitude: propertyLongitude,
        city: propertyCity,
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

  return (
    <div style={{
      margin: '8px 0 12px 48px',
      background: '#fdf5ec',
      border: `1px solid ${BAI.caramel}40`,
      borderRadius: 12,
      overflow: 'hidden',
      maxWidth: 480,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BAI.caramel}25` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench style={{ width: 15, height: 15, color: BAI.caramel }} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.caramel }}>
            {CATEGORY_LABELS[category] ?? '🛠️ Maintenance'} détecté
          </span>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, padding: 2 }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {!searched ? (
          <>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '0 0 10px', lineHeight: 1.5 }}>
              Votre locataire signale un problème. Trouvez les meilleurs artisans proches de <strong>{propertyCity}</strong> directement ici.
            </p>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: 'none', background: BAI.caramel, color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading
                ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                : <MapPin style={{ width: 14, height: 14 }} />
              }
              {loading ? 'Recherche en cours...' : 'Trouver des artisans à proximité'}
            </button>
          </>
        ) : (
          <>
            {contractors.length > 0 ? (
              <>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 10px' }}>
                  {contractors.length} artisan{contractors.length > 1 ? 's' : ''} trouvé{contractors.length > 1 ? 's' : ''} à proximité
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {contractors.map(c => (
                    <div key={c.id} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin style={{ width: 11, height: 11, color: BAI.inkFaint, flexShrink: 0 }} />
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</p>
                          </div>
                          {c.openingHours && (
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, color: BAI.inkFaint, margin: '2px 0 0' }}>🕒 {c.openingHours}</p>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: BAI.caramel }}>{c.distance} km</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {c.phone && (
                              <a
                                href={`tel:${c.phone}`}
                                style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', borderRadius: 6, background: `${BAI.owner}18`, border: `1px solid ${BAI.owner}30`, color: BAI.owner, textDecoration: 'none' }}
                              >
                                <Phone style={{ width: 11, height: 11 }} />
                              </a>
                            )}
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', borderRadius: 6, background: `${BAI.caramel}18`, border: `1px solid ${BAI.caramel}30`, color: BAI.caramel, textDecoration: 'none' }}
                              >
                                <Globe style={{ width: 11, height: 11 }} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '0 0 10px' }}>
                Aucun artisan trouvé dans OpenStreetMap pour cette zone. Utilisez les plateformes ci-dessous.
              </p>
            )}

            {/* Platform links */}
            {platforms.length > 0 && (
              <>
                <button
                  onClick={() => setShowPlatforms(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, padding: 0, marginBottom: showPlatforms ? 8 : 0 }}
                >
                  {showPlatforms ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                  Plateformes recommandées
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
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 10px', borderRadius: 6,
                          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                          fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600,
                          color: BAI.inkMid, textDecoration: 'none',
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
