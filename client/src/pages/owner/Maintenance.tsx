import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Layout } from '../../components/layout/Layout'
import { BAI } from '../../constants/bailio-tokens'
import { useMaintenanceStore } from '../../store/maintenanceStore'
import { usePropertyStore } from '../../store/propertyStore'
import { maintenanceService } from '../../services/maintenance.service'
import { apiClient } from '../../services/api.service'
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  CreateMaintenanceInput,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
} from '../../types/maintenance.types'
import {
  Wrench,
  PlusCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Droplets,
  Lock,
  Hammer,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  Globe,
  Search,
  List,
  Map,
  Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Category keywords ────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string> = {
  PLOMBERIE:   'plombier',
  ELECTRICITE: 'électricien',
  SERRURERIE:  'serrurier',
  CHAUFFAGE:   'chauffagiste',
  AUTRE:       'artisan',
  ALL:         'artisan dépannage',
}

// ── Leaflet icon helpers ──────────────────────────────────────────────────────

function makePropertyIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:#1a3270;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1;">🏠</span></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })
}

function makeContractorIcon(rank: number, highlight: boolean): L.DivIcon {
  const bg = highlight ? '#c4976a' : '#5a5754'
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${bg};border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;color:#fff;
    ">${rank}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

// Helper: re-center map when center changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], map.getZoom()) }, [lat, lng, map])
  return null
}

// ── Emergency craftsmen links per category ─────────────────────────────────

const EMERGENCY_LINKS: Record<string, Array<{ label: string; url: string; badge?: string }>> = {
  PLOMBERIE: [
    { label: 'MesDépanneurs — Plomberie', url: 'https://www.mesdepanneurs.fr/plomberie', badge: 'Urgence 24h' },
    { label: 'Depanneo — Plombier', url: 'https://www.depanneo.com/plombier/', badge: '7j/7' },
    { label: 'Dépanneurs.fr', url: 'https://www.depanneurs.fr/demande-devis?service=plomberie' },
    { label: 'Pages Jaunes — Plombiers', url: 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=plombier' },
  ],
  ELECTRICITE: [
    { label: 'MesDépanneurs — Électricité', url: 'https://www.mesdepanneurs.fr/electricite', badge: 'Urgence 24h' },
    { label: 'Depanneo — Électricien', url: 'https://www.depanneo.com/electricien/', badge: '7j/7' },
    { label: 'Dépanneurs.fr', url: 'https://www.depanneurs.fr/demande-devis?service=electricite' },
    { label: 'Pages Jaunes — Électriciens', url: 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=electricien' },
  ],
  SERRURERIE: [
    { label: 'MesDépanneurs — Serrurerie', url: 'https://www.mesdepanneurs.fr/serrurerie', badge: 'Urgence 24h' },
    { label: 'Depanneo — Serrurier', url: 'https://www.depanneo.com/serrurier/', badge: '7j/7' },
    { label: 'Dépanneurs.fr', url: 'https://www.depanneurs.fr/demande-devis?service=serrurerie' },
    { label: 'Pages Jaunes — Serruriers', url: 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=serrurier' },
  ],
  CHAUFFAGE: [
    { label: 'MesDépanneurs — Chauffage', url: 'https://www.mesdepanneurs.fr/chauffage', badge: 'Urgence 24h' },
    { label: 'Depanneo — Chauffagiste', url: 'https://www.depanneo.com/chauffagiste/', badge: '7j/7' },
    { label: "ENGIE Dépan'Express", url: 'https://particuliers.engie.fr/electricite-gaz/depan-express.html' },
    { label: 'Pages Jaunes — Chauffagistes', url: 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=chauffagiste' },
  ],
  AUTRE: [
    { label: 'MesDépanneurs.fr', url: 'https://www.mesdepanneurs.fr/', badge: 'Urgence 24h' },
    { label: 'Depanneo', url: 'https://www.depanneo.com/', badge: '7j/7' },
    { label: 'Habitissimo', url: 'https://www.habitissimo.fr/' },
    { label: 'Pages Jaunes — Artisans', url: 'https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=artisan' },
  ],
}

// ── Types ───────────────────────────────────────────────────────────────────

interface Contractor {
  id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  distance: number
  openingHours: string | null
  rating?: number | null
  reviewCount?: number | null
  lat?: number | null
  lon?: number | null
  googleMapsUrl?: string | null
}

interface ContractorResult {
  contractors: Contractor[]
  platforms: Array<{ name: string; url: string; description: string }>
  searchLocation?: { lat: number; lon: number }
  googleMapsSearchUrl?: string
}

type ViewMode = 'liste' | 'carte' | 'bien'
type StatusFilter = 'ALL' | MaintenanceStatus
type CategoryFilter = 'ALL' | MaintenanceCategory

// ── Status helpers ──────────────────────────────────────────────────────────

function statusBg(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#fef9ec'
  if (s === 'IN_PROGRESS') return BAI.ownerLight
  if (s === 'RESOLVED')    return BAI.tenantLight
  return BAI.bgMuted
}
function statusColor(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#92400e'
  if (s === 'IN_PROGRESS') return BAI.owner
  if (s === 'RESOLVED')    return BAI.tenant
  return BAI.inkFaint
}
function statusBorder(s: MaintenanceStatus): string {
  if (s === 'OPEN')        return '#f3c99a'
  if (s === 'IN_PROGRESS') return BAI.ownerBorder
  if (s === 'RESOLVED')    return BAI.tenantBorder
  return BAI.border
}

function StatusBadge({ s }: { s: MaintenanceStatus }) {
  const icons = {
    OPEN: <AlertTriangle style={{ width: 12, height: 12 }} />,
    IN_PROGRESS: <Clock style={{ width: 12, height: 12 }} />,
    RESOLVED: <CheckCircle style={{ width: 12, height: 12 }} />,
    CLOSED: <XCircle style={{ width: 12, height: 12 }} />,
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        background: statusBg(s),
        border: `1px solid ${statusBorder(s)}`,
        fontFamily: BAI.fontBody,
        fontSize: 11,
        fontWeight: 700,
        color: statusColor(s),
        whiteSpace: 'nowrap',
      }}
    >
      {icons[s]}
      {MAINTENANCE_STATUS_LABELS[s]}
    </span>
  )
}

// ── Category icon ──────────────────────────────────────────────────────────

function CategoryIcon({ category, size = 16 }: { category: MaintenanceCategory; size?: number }) {
  const style = { width: size, height: size }
  if (category === 'PLOMBERIE')   return <Droplets style={{ ...style, color: '#1a6caf' }} />
  if (category === 'ELECTRICITE') return <Zap style={{ ...style, color: '#c4976a' }} />
  if (category === 'SERRURERIE')  return <Lock style={{ ...style, color: '#5a5754' }} />
  return <Hammer style={{ ...style, color: BAI.caramel }} />
}

// ── Priority helpers ───────────────────────────────────────────────────────

function priorityColor(p: MaintenancePriority): string {
  if (p === 'URGENT') return '#9b1c1c'
  if (p === 'HIGH')   return BAI.caramel
  if (p === 'MEDIUM') return BAI.owner
  return BAI.inkFaint
}
function priorityBg(p: MaintenancePriority): string {
  if (p === 'URGENT') return BAI.errorLight
  if (p === 'HIGH')   return BAI.caramelLight
  if (p === 'MEDIUM') return BAI.ownerLight
  return BAI.bgMuted
}

// ── AI severity ────────────────────────────────────────────────────────────

function severityLabel(s: string): string {
  if (s === 'low')    return 'Faible'
  if (s === 'medium') return 'Moyen'
  if (s === 'high')   return 'Élevé'
  return 'Critique'
}
function severityColor(s: string): string {
  if (s === 'low')    return BAI.tenant
  if (s === 'medium') return BAI.caramel
  if (s === 'high')   return BAI.error
  return '#7b0000'
}

// ── Signaled message helper ────────────────────────────────────────────────

const SIGNALED_RE = /🔧\s*\[PROBLÈME SIGNALÉ\]/i

// ── Shared contractor card list ────────────────────────────────────────────

function ContractorList({
  category, contractors, loadingContractors,
}: {
  category: string; contractors: Contractor[]; loadingContractors: boolean
}) {
  const sorted = [...contractors].sort((a, b) => {
    const ra = a.rating ?? 0; const rb = b.rating ?? 0
    if (rb !== ra) return rb - ra
    return (a.distance ?? 999) - (b.distance ?? 999)
  })

  if (loadingContractors) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 13 }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${BAI.border}`, borderTopColor: BAI.owner, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Recherche d'artisans en cours...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.length === 0 ? (
        <div style={{ padding: '12px 14px', background: BAI.bgMuted, borderRadius: 10 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: '0 0 2px' }}>Aucun artisan trouvé dans OpenStreetMap.</p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>Utilisez les plateformes d'urgence ci-dessous.</p>
        </div>
      ) : sorted.map((c, i) => (
        <div key={c.id} style={{ background: i === 0 ? BAI.ownerLight : BAI.bgSurface, border: `1px solid ${i === 0 ? BAI.ownerBorder : BAI.border}`, borderRadius: 10, padding: '10px 12px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, right: 10, width: 22, height: 22, borderRadius: 999, background: i === 0 ? BAI.owner : BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: i === 0 ? '#fff' : BAI.inkFaint }}>{i + 1}</div>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 4px', paddingRight: 30, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
          {c.rating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= Math.round(c.rating!) ? '#f59e0b' : BAI.border }}>★</span>)}
              </div>
              <span style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.ink }}>{c.rating.toFixed(1)}</span>
              {c.reviewCount != null && <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>({c.reviewCount} avis)</span>}
            </div>
          )}
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
            {c.distance < 1 ? `${Math.round(c.distance * 1000)} m` : `${c.distance.toFixed(1)} km`}
            {c.address ? ` · ${c.address}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {c.phone && <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: BAI.owner }}><Phone style={{ width: 10, height: 10 }} /> Appeler</a>}
            {c.googleMapsUrl && <a href={c.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: '#e8f0fe', border: '1px solid #aecbfa', textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: '#1a73e8' }}><ExternalLink style={{ width: 10, height: 10 }} /> Google Maps</a>}
            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 7, background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 600, color: BAI.caramel }}><Globe style={{ width: 10, height: 10 }} /> Site</a>}
          </div>
        </div>
      ))}

      {/* Platform fallback when few results */}
      {sorted.length < 3 && (
        <div style={{ marginTop: 4 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 6px' }}>Plateformes d'urgence :</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(EMERGENCY_LINKS[category] ?? EMERGENCY_LINKS['AUTRE']).slice(0, 3).map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, textDecoration: 'none' }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink }}>{link.label}</span>
                {link.badge && <span style={{ padding: '2px 7px', borderRadius: 999, background: BAI.errorLight, border: '1px solid #fca5a5', fontSize: 10, fontWeight: 700, color: BAI.error }}>{link.badge}</span>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Leaflet map + contractors panel ───────────────────────────────────────────

function MapAndContractors({
  category, city, address, lat, lng, contractors, loadingContractors,
}: {
  category: string; city: string; address?: string
  lat?: number | null; lng?: number | null
  contractors: Contractor[]; loadingContractors: boolean
}) {
  const sorted = [...contractors].sort((a, b) => {
    const ra = a.rating ?? 0; const rb = b.rating ?? 0
    if (rb !== ra) return rb - ra
    return (a.distance ?? 999) - (b.distance ?? 999)
  })
  const hasCoords = !!(lat && lng)
  // Default to Paris centre if no coords
  const centerLat = lat ?? 48.8566
  const centerLng = lng ?? 2.3522

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {/* Leaflet map */}
      <div style={{ flex: '1 1 280px' }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin style={{ width: 11, height: 11 }} /> {address ? `${address}, ` : ''}{city}
        </p>
        <div style={{ height: 320, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BAI.border}` }}>
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            <MapRecenter lat={centerLat} lng={centerLng} />
            {/* Property pin */}
            {hasCoords && (
              <Marker position={[lat!, lng!]} icon={makePropertyIcon()}>
                <Popup>
                  <strong style={{ fontFamily: 'DM Sans,sans-serif' }}>
                    {address ?? city}
                  </strong>
                  <br /><span style={{ fontSize: 12, color: '#5a5754' }}>Votre logement</span>
                </Popup>
              </Marker>
            )}
            {/* Contractor pins */}
            {sorted.map((c, i) => c.lat && c.lon ? (
              <Marker key={c.id} position={[c.lat, c.lon]} icon={makeContractorIcon(i + 1, i === 0)}>
                <Popup>
                  <strong style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>#{i + 1} {c.name}</strong>
                  {c.rating != null && <><br /><span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(c.rating))}</span> {c.rating.toFixed(1)} {c.reviewCount != null ? `(${c.reviewCount} avis)` : ''}</>}
                  <br /><span style={{ fontSize: 11, color: '#5a5754' }}>{c.distance < 1 ? `${Math.round(c.distance * 1000)} m` : `${c.distance.toFixed(1)} km`}</span>
                  {c.phone && <><br /><a href={`tel:${c.phone}`} style={{ fontSize: 12, color: '#1a3270' }}>{c.phone}</a></>}
                </Popup>
              </Marker>
            ) : null)}
          </MapContainer>
        </div>
        {!hasCoords && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle style={{ width: 11, height: 11 }} />
            Ajoutez les coordonnées GPS du bien pour centrer la carte sur votre logement.
          </p>
        )}
      </div>

      {/* Contractor ranked list */}
      <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 2px' }}>
          Classement — {MAINTENANCE_CATEGORY_LABELS[category as MaintenanceCategory] ?? 'Artisans'}
        </p>
        <ContractorList category={category} contractors={sorted} loadingContractors={loadingContractors} />
      </div>
    </div>
  )
}

// ── Full map view (Google Maps embed) ──────────────────────────────────────

interface FullMapViewProps {
  properties: Array<{ id: string; title: string; city: string; address?: string; lat?: number | null; lng?: number | null }>
  categoryFilter: CategoryFilter
  onCategoryChange: (c: CategoryFilter) => void
}

function FullMapView({ properties, categoryFilter, onCategoryChange }: FullMapViewProps) {
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id ?? '')
  const [hoveredPill, setHoveredPill] = useState<CategoryFilter | null>(null)
  const [mapContractors, setMapContractors] = useState<Contractor[]>([])
  const [mapLoadingContractors, setMapLoadingContractors] = useState(false)

  const selectedProp = properties.find(p => p.id === selectedPropId) ?? properties[0]

  const categoryOptions: Array<{ value: CategoryFilter; label: string }> = [
    { value: 'ALL', label: 'Artisans' },
    { value: 'PLOMBERIE', label: 'Plomberie' },
    { value: 'ELECTRICITE', label: 'Électricité' },
    { value: 'SERRURERIE', label: 'Serrurerie' },
    { value: 'CHAUFFAGE', label: 'Chauffage' },
    { value: 'AUTRE', label: 'Travaux' },
  ]

  // Auto-fetch contractors when property or category changes
  useEffect(() => {
    if (!selectedProp) return
    setMapContractors([])
    setMapLoadingContractors(true)
    maintenanceService.findContractors({
      category: categoryFilter === 'ALL' ? 'AUTRE' : categoryFilter,
      city: selectedProp.city,
      latitude: selectedProp.lat,
      longitude: selectedProp.lng,
    }).then(res => {
      setMapContractors(res.contractors as Contractor[])
    }).catch(() => {}).finally(() => setMapLoadingContractors(false))
  }, [selectedPropId, categoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {categoryOptions.map(opt => {
          const isActive = categoryFilter === opt.value
          const isHovered = hoveredPill === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onCategoryChange(opt.value)}
              onMouseEnter={() => setHoveredPill(opt.value)}
              onMouseLeave={() => setHoveredPill(null)}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: isActive ? 'none' : `1px solid ${BAI.border}`,
                background: isActive ? BAI.night : isHovered ? BAI.bgMuted : 'transparent',
                color: isActive ? '#fff' : isHovered ? BAI.ink : BAI.inkMid,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 36,
                transition: BAI.transition,
              }}
            >
              {opt.label}
            </button>
          )
        })}
        {properties.length > 1 && (
          <select
            value={selectedPropId}
            onChange={e => setSelectedPropId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: `1px solid ${BAI.border}`,
              background: BAI.bgMuted,
              fontFamily: BAI.fontBody,
              fontSize: 12,
              color: BAI.ink,
              outline: 'none',
              cursor: 'pointer',
              minHeight: 36,
              marginLeft: 'auto',
            }}
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} — {p.address ? `${p.address}, ` : ''}{p.city}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Map + contractors side by side */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Leaflet map */}
        <div style={{ flex: '2 1 400px' }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin style={{ width: 12, height: 12 }} />
            {selectedProp?.address ? `${selectedProp.address}, ${selectedProp.city}` : selectedProp?.city}
          </p>
          <div style={{ height: 'clamp(380px, calc(100vh - 320px), 600px)', borderRadius: 12, overflow: 'hidden', border: `1px solid ${BAI.border}`, boxShadow: BAI.shadowMd }}>
            {selectedProp && (
              <MapContainer
                center={[selectedProp.lat ?? 48.8566, selectedProp.lng ?? 2.3522]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <MapRecenter lat={selectedProp.lat ?? 48.8566} lng={selectedProp.lng ?? 2.3522} />
                {/* Property pin */}
                {selectedProp.lat && selectedProp.lng && (
                  <Marker position={[selectedProp.lat, selectedProp.lng]} icon={makePropertyIcon()}>
                    <Popup>
                      <strong style={{ fontFamily: 'DM Sans,sans-serif' }}>{selectedProp.title}</strong>
                      <br /><span style={{ fontSize: 12, color: '#5a5754' }}>{selectedProp.address ?? selectedProp.city}</span>
                    </Popup>
                  </Marker>
                )}
                {/* Contractor pins */}
                {[...mapContractors]
                  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.distance ?? 999) - (b.distance ?? 999))
                  .map((c, i) => c.lat && c.lon ? (
                    <Marker key={c.id} position={[c.lat, c.lon]} icon={makeContractorIcon(i + 1, i === 0)}>
                      <Popup>
                        <strong style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13 }}>#{i + 1} {c.name}</strong>
                        {c.rating != null && <><br /><span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(c.rating))}</span> {c.rating.toFixed(1)}</>}
                        <br /><span style={{ fontSize: 11, color: '#5a5754' }}>{c.distance < 1 ? `${Math.round(c.distance * 1000)} m` : `${c.distance.toFixed(1)} km`}</span>
                        {c.phone && <><br /><a href={`tel:${c.phone}`} style={{ color: '#1a3270' }}>{c.phone}</a></>}
                      </Popup>
                    </Marker>
                  ) : null)
                }
              </MapContainer>
            )}
          </div>
        </div>

        {/* Contractor list */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 2px' }}>
            Classement — {categoryFilter === 'ALL' ? 'Artisans' : MAINTENANCE_CATEGORY_LABELS[categoryFilter as MaintenanceCategory] ?? 'Artisans'}
          </p>
          <ContractorList
            category={categoryFilter === 'ALL' ? 'AUTRE' : categoryFilter}
            contractors={mapContractors}
            loadingContractors={mapLoadingContractors}
          />
        </div>
      </div>
    </div>
  )
}

// ── ByProperty group type ──────────────────────────────────────────────────

interface ByPropertyGroup {
  property: {
    id: string
    title: string
    address: string
    city: string
    postalCode: string
    surface: number
    price: number
    images: string[]
    furnished: boolean
    type: string
  } | null
  requests: Array<{
    id: string
    title: string
    description: string
    category: MaintenanceCategory
    priority: MaintenancePriority
    status: MaintenanceStatus
    createdAt: string
    aiAnalysis?: {
      severity: string
      estimatedCost: { min: number; max: number }
      advice?: string
      platforms: Array<{ name: string; url: string; description: string }>
    } | null
    property?: { title: string } | null
    tenant?: { firstName: string; lastName: string } | null
  }>
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    estimatedCostMin: number
    estimatedCostMax: number
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Maintenance() {
  const [viewMode, setViewMode] = useState<ViewMode>('liste')
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [contractorsMap, setContractorsMap] = useState<Record<string, ContractorResult>>({})
  const [loadingContractors, setLoadingContractors] = useState<string | null>(null)
  const [mapCategoryFilter, setMapCategoryFilter] = useState<CategoryFilter>('ALL')

  // Detail panel
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null)

  // Par bien view
  const [byProperty, setByProperty] = useState<ByPropertyGroup[]>([])
  const [byPropertyLoading, setByPropertyLoading] = useState(false)
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null)

  const [form, setForm] = useState<CreateMaintenanceInput>({
    propertyId: '',
    title: '',
    description: '',
    category: 'PLOMBERIE',
    priority: 'MEDIUM',
  })

  const { requests, isLoading, isAnalyzing, fetchRequests, createRequest, updateStatus, analyzeWithAI } =
    useMaintenanceStore()
  const { myProperties, fetchMyProperties } = usePropertyStore()

  useEffect(() => {
    fetchRequests()
    fetchMyProperties()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewMode !== 'bien') return
    setByPropertyLoading(true)
    apiClient.get<{ success: boolean; data: { byProperty: ByPropertyGroup[] } }>('/maintenance/by-property')
      .then(res => setByProperty(res.data.data.byProperty))
      .catch(() => {})
      .finally(() => setByPropertyLoading(false))
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const openCount = requests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length

  const filtered = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    return true
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createRequest(form)
      setShowForm(false)
      setForm({ propertyId: '', title: '', description: '', category: 'PLOMBERIE', priority: 'MEDIUM' })
    } catch {}
  }

  async function handleFindContractors(req: {
    id: string
    category: MaintenanceCategory
    property?: { title: string; city?: string; latitude?: number | null; longitude?: number | null }
  }) {
    if (contractorsMap[req.id]) {
      setContractorsMap(m => { const n = { ...m }; delete n[req.id]; return n })
      return
    }
    const fullProp = myProperties.find(p => {
      return req.property?.title && p.title === req.property.title
    })
    setLoadingContractors(req.id)
    try {
      const result = await maintenanceService.findContractors({
        category: req.category,
        city: fullProp?.city ?? (req.property as { city?: string } | undefined)?.city ?? '',
        latitude: fullProp?.latitude ?? (req.property as { latitude?: number | null } | undefined)?.latitude ?? null,
        longitude: fullProp?.longitude ?? (req.property as { longitude?: number | null } | undefined)?.longitude ?? null,
      })
      setContractorsMap(m => ({ ...m, [req.id]: result }))
      if (result.contractors.length === 0)
        toast('Aucun artisan trouvé à proximité — essayez les plateformes ci-dessous.', { icon: 'ℹ️' })
    } catch {
      toast.error("Erreur lors de la recherche d'artisans")
    } finally {
      setLoadingContractors(null)
    }
  }

  // Auto-trigger contractor search on card expand
  async function handleExpandCard(reqId: string) {
    const alreadyExpanded = expandedId === reqId
    setExpandedId(alreadyExpanded ? null : reqId)
    if (!alreadyExpanded && !contractorsMap[reqId]) {
      const req = requests.find(r => r.id === reqId)
      if (req) {
        const fullProp = myProperties.find(p => req.property?.title && p.title === req.property.title)
        setLoadingContractors(reqId)
        try {
          const result = await maintenanceService.findContractors({
            category: req.category,
            city: fullProp?.city ?? '',
            latitude: fullProp?.latitude ?? null,
            longitude: fullProp?.longitude ?? null,
          })
          setContractorsMap(m => ({ ...m, [reqId]: result }))
        } catch {
          // silent fail — user can retry with button
        } finally {
          setLoadingContractors(null)
        }
      }
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${BAI.border}`,
    background: BAI.bgMuted,
    fontFamily: BAI.fontBody,
    fontSize: 14,
    color: BAI.ink,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: BAI.fontBody,
    fontSize: 12,
    fontWeight: 600,
    color: BAI.inkMid,
    display: 'block',
    marginBottom: 4,
  }

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL',         label: 'Tous' },
    { value: 'OPEN',        label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'RESOLVED',    label: 'Résolu' },
    { value: 'CLOSED',      label: 'Fermé' },
  ]

  return (
    <Layout>
      <div style={{ maxWidth: viewMode === 'carte' ? 1100 : 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: BAI.caramel,
                margin: '0 0 6px',
              }}
            >
              Propriétaire
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1
                style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(28px,5vw,38px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: BAI.ink,
                  margin: 0,
                }}
              >
                Maintenance
              </h1>
              {openCount > 0 && (
                <span
                  style={{
                    background: BAI.errorLight,
                    border: `1px solid #fca5a5`,
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    fontWeight: 700,
                    color: BAI.error,
                  }}
                >
                  {openCount} en attente
                </span>
              )}
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '8px 0 0' }}>
              Suivez les demandes et laissez l'IA trouver les meilleurs artisans
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* View toggle */}
            <div
              style={{
                display: 'flex',
                borderRadius: 10,
                border: `1px solid ${BAI.border}`,
                overflow: 'hidden',
                background: BAI.bgMuted,
              }}
            >
              <button
                onClick={() => setViewMode('liste')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  border: 'none',
                  borderRight: `1px solid ${BAI.border}`,
                  background: viewMode === 'liste' ? BAI.night : 'transparent',
                  color: viewMode === 'liste' ? '#fff' : BAI.inkMid,
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                  transition: BAI.transition,
                }}
              >
                <List style={{ width: 15, height: 15 }} />
                Liste
              </button>
              <button
                onClick={() => setViewMode('carte')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  border: 'none',
                  borderRight: `1px solid ${BAI.border}`,
                  background: viewMode === 'carte' ? BAI.night : 'transparent',
                  color: viewMode === 'carte' ? '#fff' : BAI.inkMid,
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                  transition: BAI.transition,
                }}
              >
                <Map style={{ width: 15, height: 15 }} />
                Carte
              </button>
              <button
                onClick={() => setViewMode('bien')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  border: 'none',
                  background: viewMode === 'bien' ? BAI.night : 'transparent',
                  color: viewMode === 'bien' ? '#fff' : BAI.inkMid,
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                  transition: BAI.transition,
                }}
              >
                <Building2 style={{ width: 15, height: 15 }} />
                Par bien
              </button>
            </div>

            <button
              onClick={() => setShowForm(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: BAI.night,
                color: '#fff',
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 44,
              }}
            >
              <PlusCircle style={{ width: 16, height: 16 }} />
              Nouvelle demande
            </button>
          </div>
        </div>

        {/* ── Create form ─────────────────────────────────────────────────── */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: BAI.fontBody,
                fontSize: 14,
                fontWeight: 700,
                color: BAI.ink,
                margin: '0 0 16px',
              }}
            >
              Déclarer un problème
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Bien concerné</label>
                <select
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  style={inputStyle}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {myProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as MaintenanceCategory }))}
                  style={inputStyle}
                >
                  {(Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[]).map(k => (
                    <option key={k} value={k}>
                      {MAINTENANCE_CATEGORY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priorité</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as MaintenancePriority }))}
                  style={inputStyle}
                >
                  {(Object.keys(MAINTENANCE_PRIORITY_LABELS) as MaintenancePriority[]).map(k => (
                    <option key={k} value={k}>
                      {MAINTENANCE_PRIORITY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Titre</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={inputStyle}
                placeholder="Ex: Fuite sous l'évier"
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description détaillée</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Décrivez le problème en détail pour que l'IA puisse analyser et trouver les bons artisans..."
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: `1px solid ${BAI.border}`,
                  background: 'transparent',
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  color: BAI.inkMid,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: BAI.night,
                  color: '#fff',
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Créer la demande
              </button>
            </div>
          </form>
        )}

        {/* ── Carte view ─────────────────────────────────────────────────── */}
        {viewMode === 'carte' && (
          <FullMapView
            properties={myProperties.map(p => ({ id: p.id, title: p.title, city: p.city, address: p.address, lat: p.latitude, lng: p.longitude }))}
            categoryFilter={mapCategoryFilter}
            onCategoryChange={setMapCategoryFilter}
          />
        )}

        {/* ── Par bien view ────────────────────────────────────────────────── */}
        {viewMode === 'bien' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {byPropertyLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 14 }}>Chargement...</div>
            ) : byProperty.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16 }}>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>Aucune demande</p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: 0 }}>Créez votre première demande de maintenance.</p>
              </div>
            ) : byProperty.map(group => {
              const prop = group.property
              if (!prop) return null
              const isExpanded = expandedPropertyId === prop.id
              const hasOpen = group.stats.open + group.stats.inProgress > 0
              return (
                <div key={prop.id} style={{
                  background: BAI.bgSurface,
                  border: `1px solid ${hasOpen ? '#fca5a5' : BAI.border}`,
                  borderLeft: hasOpen ? `4px solid ${BAI.error}` : `1px solid ${BAI.border}`,
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: BAI.shadowSm,
                }}>
                  {/* Header — clickable */}
                  <div
                    onClick={() => setExpandedPropertyId(isExpanded ? null : prop.id)}
                    style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                  >
                    {prop.images?.[0] ? (
                      <img src={prop.images[0]} alt={prop.title} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 style={{ width: 28, height: 28, color: BAI.inkFaint }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontFamily: BAI.fontDisplay, fontSize: 20, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 4px' }}>{prop.title}</p>
                          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin style={{ width: 12, height: 12 }} />{prop.address}, {prop.city}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {group.stats.open > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: BAI.errorLight, border: '1px solid #fca5a5', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.error }}><AlertTriangle style={{ width: 12, height: 12 }} />{group.stats.open} ouvert{group.stats.open > 1 ? 's' : ''}</span>}
                          {group.stats.inProgress > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.owner }}><Clock style={{ width: 12, height: 12 }} />{group.stats.inProgress} en cours</span>}
                          {group.stats.resolved > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`, fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.tenant }}><CheckCircle style={{ width: 12, height: 12 }} />{group.stats.resolved} résolu{group.stats.resolved > 1 ? 's' : ''}</span>}
                          {isExpanded ? <ChevronUp style={{ width: 16, height: 16, color: BAI.inkFaint }} /> : <ChevronDown style={{ width: 16, height: 16, color: BAI.inkFaint }} />}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{prop.surface} m²</span>
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{prop.price?.toLocaleString('fr-FR')} €/mois</span>
                        {group.stats.estimatedCostMax > 0 && <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.caramel, fontWeight: 600 }}>Coût estimé : {group.stats.estimatedCostMin.toLocaleString('fr-FR')}–{group.stats.estimatedCostMax.toLocaleString('fr-FR')} €</span>}
                        <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{group.stats.total} demande{group.stats.total > 1 ? 's' : ''} au total</span>
                      </div>
                    </div>
                  </div>
                  {/* Expanded list */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${BAI.border}`, background: BAI.bgBase }}>
                      {group.requests.length === 0 ? (
                        <p style={{ padding: '20px 24px', fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: 0 }}>Aucune demande.</p>
                      ) : group.requests.map((req, i) => (
                        <div
                          key={req.id}
                          onClick={() => setSelectedReqId(req.id)}
                          style={{ padding: '14px 24px', borderBottom: i < group.requests.length - 1 ? `1px solid ${BAI.border}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: BAI.transition, background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <CategoryIcon category={req.category} size={18} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</p>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>{new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <StatusBadge s={req.status} />
                          <span style={{ padding: '2px 8px', borderRadius: 999, background: priorityBg(req.priority), fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: priorityColor(req.priority) }}>{MAINTENANCE_PRIORITY_LABELS[req.priority]}</span>
                          <ChevronDown style={{ width: 14, height: 14, color: BAI.inkFaint, flexShrink: 0, transform: 'rotate(-90deg)' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Liste view ─────────────────────────────────────────────────── */}
        {viewMode === 'liste' && (
          <>
            {/* ── Stats summary bar ──────────────────────────────────────── */}
            {requests.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '14px 18px', background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { label: 'Ouverts', count: requests.filter(r => r.status === 'OPEN').length, color: BAI.error, bg: BAI.errorLight },
                  { label: 'En cours', count: requests.filter(r => r.status === 'IN_PROGRESS').length, color: BAI.owner, bg: BAI.ownerLight },
                  { label: 'Résolus', count: requests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length, color: BAI.tenant, bg: BAI.tenantLight },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: item.color }}>{item.count}</span>
                    </div>
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>{item.label}</span>
                  </div>
                ))}
                {requests.filter(r => r.priority === 'URGENT' && (r.status === 'OPEN' || r.status === 'IN_PROGRESS')).length > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: BAI.errorLight, border: `1px solid #fca5a5` }}>
                    <AlertTriangle style={{ width: 12, height: 12, color: BAI.error }} />
                    <span style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.error }}>
                      {requests.filter(r => r.priority === 'URGENT' && (r.status === 'OPEN' || r.status === 'IN_PROGRESS')).length} urgent{requests.filter(r => r.priority === 'URGENT' && (r.status === 'OPEN' || r.status === 'IN_PROGRESS')).length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Filter bar ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 999,
                    border: statusFilter === opt.value ? 'none' : `1px solid ${BAI.border}`,
                    background: statusFilter === opt.value ? BAI.night : 'transparent',
                    color: statusFilter === opt.value ? '#fff' : BAI.inkMid,
                    fontFamily: BAI.fontBody,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: BAI.transition,
                    minHeight: 36,
                  }}
                >
                  {opt.label}
                  {opt.value !== 'ALL' && (
                    <span
                      style={{
                        marginLeft: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: statusFilter === opt.value ? 'rgba(255,255,255,0.20)' : BAI.bgMuted,
                        fontSize: 10,
                        fontWeight: 700,
                        color: statusFilter === opt.value ? '#fff' : BAI.inkFaint,
                      }}
                    >
                      {requests.filter(r => r.status === opt.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Request list ──────────────────────────────────────────── */}
            {isLoading && requests.length === 0 ? (
              <div
                style={{
                  padding: 60,
                  textAlign: 'center',
                  color: BAI.inkFaint,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                }}
              >
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Wrench style={{ width: 28, height: 28, color: BAI.inkFaint }} />
                </div>
                <p style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 8px' }}>
                  Aucune demande
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkFaint, margin: '0 0 20px' }}>
                  {statusFilter !== 'ALL' ? 'Aucune demande avec ce statut.' : 'Déclarez un problème pour commencer.'}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: BAI.night, color: '#fff', fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <PlusCircle style={{ width: 16, height: 16 }} />
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(req => {
                  const expanded = expandedId === req.id
                  const analyzing = isAnalyzing === req.id
                  const isFromChat = req.description ? SIGNALED_RE.test(req.description) : false
                  const fullProp = myProperties.find(p => req.property?.title && p.title === req.property.title)

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: BAI.bgSurface,
                        border: `1px solid ${req.priority === 'URGENT' ? '#fca5a5' : BAI.border}`,
                        borderLeft: req.priority === 'URGENT' ? `4px solid ${BAI.error}` : req.priority === 'HIGH' ? `4px solid ${BAI.caramel}` : `1px solid ${BAI.border}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                        boxShadow: BAI.shadowSm,
                        transition: BAI.transition,
                      }}
                    >
                      {/* From chat badge */}
                      {isFromChat && (
                        <div
                          style={{
                            padding: '6px 16px',
                            background: BAI.caramelLight,
                            borderBottom: `1px solid ${BAI.caramelBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 12 }}>🔧</span>
                          <span
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 11,
                              fontWeight: 700,
                              color: BAI.caramel,
                              letterSpacing: '0.04em',
                            }}
                          >
                            Signalé par le locataire via la messagerie
                          </span>
                        </div>
                      )}

                      {/* Card header */}
                      <div
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                        }}
                      >
                        {/* Category icon circle */}
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background: BAI.bgMuted,
                            border: `1px solid ${BAI.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CategoryIcon category={req.category} size={20} />
                        </div>

                        {/* Main content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginBottom: 6,
                            }}
                          >
                            <p
                              onClick={() => setSelectedReqId(req.id)}
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 15,
                                fontWeight: 700,
                                color: BAI.ink,
                                margin: 0,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationColor: BAI.border,
                              }}
                            >
                              {req.title}
                            </p>
                            <StatusBadge s={req.status} />
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: priorityBg(req.priority),
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                fontWeight: 700,
                                color: priorityColor(req.priority),
                              }}
                            >
                              {MAINTENANCE_PRIORITY_LABELS[req.priority]}
                            </span>
                          </div>

                          {/* Meta row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 12,
                                color: BAI.inkMid,
                                fontWeight: 600,
                              }}
                            >
                              {MAINTENANCE_CATEGORY_LABELS[req.category]}
                            </span>
                            {req.property && (
                              <>
                                <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                                <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                                  {req.property.title}
                                </span>
                              </>
                            )}
                            {req.tenant && (
                              <>
                                <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                                <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>
                                  {req.tenant.firstName} {req.tenant.lastName}
                                </span>
                              </>
                            )}
                            <span style={{ color: BAI.border, fontSize: 10 }}>·</span>
                            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                              {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Description preview */}
                          <p
                            style={{
                              fontFamily: BAI.fontBody,
                              fontSize: 13,
                              color: BAI.inkMid,
                              margin: 0,
                              lineHeight: 1.6,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: expanded ? undefined : 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {req.description}
                          </p>

                          {/* Action buttons row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginTop: 12,
                            }}
                          >
                            {/* AI analyze button */}
                            <button
                              onClick={() => {
                                analyzeWithAI(req.id)
                                setExpandedId(req.id)
                              }}
                              disabled={analyzing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: `1px solid ${BAI.caramelBorder}`,
                                background: analyzing ? BAI.caramelLight : 'transparent',
                                fontFamily: BAI.fontBody,
                                fontSize: 12,
                                fontWeight: 600,
                                color: BAI.caramel,
                                cursor: analyzing ? 'wait' : 'pointer',
                                whiteSpace: 'nowrap',
                                minHeight: 36,
                              }}
                            >
                              <Sparkles style={{ width: 13, height: 13 }} />
                              {analyzing ? 'Analyse...' : req.aiAnalysis ? "Ré-analyser avec l'IA" : "Analyser avec l'IA"}
                            </button>

                            {/* Expand toggle — always visible for description + map */}
                            <button
                              onClick={() => handleExpandCard(req.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'none',
                                border: `1px solid ${BAI.border}`,
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontFamily: BAI.fontBody,
                                fontSize: 12,
                                fontWeight: 600,
                                color: BAI.inkMid,
                                padding: '7px 14px',
                                minHeight: 36,
                              }}
                            >
                              {expanded ? (
                                <ChevronUp style={{ width: 13, height: 13 }} />
                              ) : (
                                <ChevronDown style={{ width: 13, height: 13 }} />
                              )}
                              {expanded ? 'Réduire' : 'Détails & artisans'}
                            </button>
                          </div>
                        </div>

                        {/* Right: status select */}
                        <div style={{ flexShrink: 0 }}>
                          <select
                            value={req.status}
                            onChange={e =>
                              updateStatus(req.id, { status: e.target.value as MaintenanceStatus })
                            }
                            onClick={e => e.stopPropagation()}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: `1px solid ${BAI.border}`,
                              background: BAI.bgMuted,
                              fontFamily: BAI.fontBody,
                              fontSize: 12,
                              color: BAI.ink,
                              outline: 'none',
                              cursor: 'pointer',
                              minHeight: 36,
                            }}
                          >
                            {(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map(k => (
                              <option key={k} value={k}>
                                {MAINTENANCE_STATUS_LABELS[k]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* ── Expanded panel ────────────────────────────────────────── */}
                      {expanded && (
                        <div
                          style={{
                            borderTop: `1px solid ${BAI.border}`,
                            padding: '20px',
                            background: BAI.bgBase,
                          }}
                        >
                          {/* Full description */}
                          <div style={{ marginBottom: 20 }}>
                            <p
                              style={{
                                fontFamily: BAI.fontBody,
                                fontSize: 11,
                                fontWeight: 700,
                                color: BAI.inkFaint,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                margin: '0 0 8px',
                              }}
                            >
                              Message du locataire
                            </p>
                            <div
                              style={{
                                background: BAI.bgSurface,
                                border: `1px solid ${BAI.border}`,
                                borderRadius: 10,
                                padding: '14px 16px',
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: BAI.fontBody,
                                  fontSize: 13,
                                  color: BAI.ink,
                                  margin: 0,
                                  lineHeight: 1.7,
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {req.description}
                              </p>
                            </div>
                          </div>

                          {/* Map + ranked contractors */}
                          <div style={{ marginBottom: 20 }}>
                            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: BAI.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                              Carte & artisans à proximité
                            </p>
                            <MapAndContractors
                              category={req.category}
                              city={fullProp?.city ?? 'France'}
                              address={fullProp?.address}
                              lat={fullProp?.latitude}
                              lng={fullProp?.longitude}
                              contractors={contractorsMap[req.id]?.contractors ?? []}
                              loadingContractors={loadingContractors === req.id}
                            />
                          </div>

                          {/* Contractor cards */}
                          {contractorsMap[req.id] && (() => {
                            const res = contractorsMap[req.id]
                            return (
                              <div>
                                {res.contractors.length > 0 ? (
                                  <>
                                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.inkMid, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                      {res.contractors.length} artisan{res.contractors.length > 1 ? 's' : ''} à proximité
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                      {res.contractors.map(c => (
                                        <div key={c.id} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0, background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: 14 }}>
                                          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                          {c.distance != null && (
                                            <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                              <MapPin style={{ width: 11, height: 11 }} />
                                              {c.distance < 1 ? `${Math.round(c.distance * 1000)} m` : `${c.distance.toFixed(1)} km`}
                                            </p>
                                          )}
                                          {c.address && (
                                            <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</p>
                                          )}
                                          <div style={{ display: 'flex', gap: 6 }}>
                                            {c.phone && (
                                              <a href={`tel:${c.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.owner, minHeight: 36 }}>
                                                <Phone style={{ width: 12, height: 12 }} /> Appeler
                                              </a>
                                            )}
                                            {c.website && (
                                              <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, background: BAI.caramelLight, border: `1px solid ${BAI.caramelBorder}`, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.caramel, minHeight: 36 }}>
                                                <Globe style={{ width: 12, height: 12 }} /> Site
                                              </a>
                                            )}
                                            {!c.phone && !c.website && (
                                              <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>Aucun contact disponible</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: '0 0 10px' }}>
                                    Aucun artisan trouvé via OpenStreetMap. Consultez ces plateformes :
                                  </p>
                                )}

                                {/* Platform links */}
                                {res.platforms.length > 0 && (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: res.contractors.length > 0 ? 12 : 0 }}>
                                    {res.platforms.map(p => (
                                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, minHeight: 34 }}>
                                        <ExternalLink style={{ width: 11, height: 11 }} /> {p.name}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {/* Google Maps fallback */}
                                {res.googleMapsSearchUrl && (
                                  <a
                                    href={res.googleMapsSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      padding: '8px 16px', borderRadius: 8,
                                      background: '#1a73e8', color: '#fff',
                                      fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                                      textDecoration: 'none', marginTop: 12,
                                    }}
                                  >
                                    Rechercher sur Google Maps
                                  </a>
                                )}
                              </div>
                            )
                          })()}

                          {/* Manual search button if auto-load failed or no contractors loaded yet */}
                          {!contractorsMap[req.id] && loadingContractors !== req.id && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BAI.border}` }}>
                              <button
                                onClick={() => handleFindContractors(req)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 7,
                                  padding: '9px 18px', borderRadius: 8, border: 'none',
                                  background: BAI.night, color: '#fff',
                                  fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
                                  cursor: 'pointer', minHeight: 40,
                                }}
                              >
                                <Search style={{ width: 14, height: 14 }} />
                                Rechercher des artisans
                              </button>
                            </div>
                          )}

                          {/* AI Analysis panel */}
                          {req.aiAnalysis && (
                            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BAI.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Sparkles style={{ width: 15, height: 15, color: BAI.caramel }} />
                                <p
                                  style={{
                                    fontFamily: BAI.fontBody,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: BAI.ink,
                                    margin: 0,
                                  }}
                                >
                                  Analyse IA
                                </p>
                              </div>

                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                                <div
                                  style={{
                                    background: BAI.bgSurface,
                                    border: `1px solid ${BAI.border}`,
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    flex: 1,
                                    minWidth: 140,
                                  }}
                                >
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>
                                    Sévérité
                                  </p>
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: severityColor(req.aiAnalysis.severity), margin: 0 }}>
                                    {severityLabel(req.aiAnalysis.severity)}
                                  </p>
                                </div>
                                <div
                                  style={{
                                    background: BAI.bgSurface,
                                    border: `1px solid ${BAI.border}`,
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    flex: 1,
                                    minWidth: 140,
                                  }}
                                >
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>
                                    Coût estimé
                                  </p>
                                  <p style={{ fontFamily: BAI.fontDisplay, fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>
                                    {req.aiAnalysis.estimatedCost.min.toLocaleString('fr-FR')} –{' '}
                                    {req.aiAnalysis.estimatedCost.max.toLocaleString('fr-FR')} €
                                  </p>
                                </div>
                              </div>

                              <div
                                style={{
                                  background: BAI.bgSurface,
                                  border: `1px solid ${BAI.border}`,
                                  borderRadius: 10,
                                  padding: '14px 16px',
                                  marginBottom: 16,
                                }}
                              >
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 6px' }}>
                                  Conseil
                                </p>
                                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, margin: 0, lineHeight: 1.6 }}>
                                  {req.aiAnalysis.advice}
                                </p>
                              </div>

                              {/* AI platforms */}
                              {req.aiAnalysis.platforms.length > 0 && (
                                <div>
                                  <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.inkMid, margin: '0 0 8px' }}>
                                    Plateformes recommandées par l'IA
                                  </p>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {req.aiAnalysis.platforms.map(p => (
                                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1px solid ${BAI.caramelBorder}`, background: BAI.caramelLight, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.caramel, minHeight: 36 }}>
                                        <ExternalLink style={{ width: 11, height: 11 }} /> {p.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Panel ────────────────────────────────────────────────── */}
      {selectedReqId && (() => {
        const req = requests.find(r => r.id === selectedReqId)
        if (!req) return null
        const fullProp = myProperties.find(p => req.property?.title && p.title === req.property.title)
        const propAny = req.property as (typeof req.property & { address?: string; city?: string; surface?: number; price?: number; images?: string[] }) | null

        return (
          <>
            <div
              onClick={() => setSelectedReqId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(13,12,10,0.4)', zIndex: 200 }}
            />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'clamp(320px, 45vw, 580px)', background: BAI.bgBase, zIndex: 201, boxShadow: '-4px 0 32px rgba(13,12,10,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Panel header */}
              <div style={{ padding: '20px 24px', background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 4px' }}>Fiche intervention</p>
                  <h2 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</h2>
                </div>
                <button onClick={() => setSelectedReqId(null)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${BAI.border}`, background: 'transparent', cursor: 'pointer', color: BAI.inkMid, display: 'flex', flexShrink: 0 }}>
                  <XCircle style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge s={req.status} />
                  <span style={{ padding: '3px 10px', borderRadius: 999, background: priorityBg(req.priority), fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700, color: priorityColor(req.priority) }}>{MAINTENANCE_PRIORITY_LABELS[req.priority]}</span>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginLeft: 'auto' }}>{new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                {/* Property card */}
                {propAny && (
                  <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 10px' }}>Appartement concerné</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {fullProp?.images?.[0] ? (
                        <img src={fullProp.images[0]} alt={propAny.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 8, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 style={{ width: 22, height: 22, color: BAI.inkFaint }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>{propAny.title}</p>
                        {propAny.address && <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 11, height: 11 }} />{propAny.address}, {propAny.city}</p>}
                        <div style={{ display: 'flex', gap: 12 }}>
                          {propAny.surface && <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint }}>{propAny.surface} m²</span>}
                          {propAny.price && <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.tenant, fontWeight: 600 }}>{propAny.price.toLocaleString('fr-FR')} €/mois</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tenant */}
                {req.tenant && (
                  <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.owner }}>{req.tenant.firstName[0]}{req.tenant.lastName[0]}</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 2px' }}>Signalé par le locataire</p>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink, margin: 0 }}>{req.tenant.firstName} {req.tenant.lastName}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 8px' }}>Description</p>
                  <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{req.description}</p>
                  </div>
                </div>

                {/* Map + ranked contractors */}
                {fullProp && (
                  <div>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 10px' }}>Carte & artisans à proximité</p>
                    <MapAndContractors
                      category={req.category}
                      city={fullProp.city}
                      address={fullProp.address}
                      lat={fullProp.latitude}
                      lng={fullProp.longitude}
                      contractors={contractorsMap[req.id]?.contractors ?? []}
                      loadingContractors={loadingContractors === req.id}
                    />
                  </div>
                )}

                {/* Emergency links */}
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 10px' }}>Trouver un artisan rapidement</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(EMERGENCY_LINKS[req.category] ?? EMERGENCY_LINKS['AUTRE']).map(link => (
                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgSurface, textDecoration: 'none', fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, color: BAI.ink }}>
                        {link.badge && (
                          <span style={{ padding: '2px 7px', borderRadius: 999, background: BAI.errorLight, border: '1px solid #fca5a5', fontSize: 10, fontWeight: 700, color: BAI.error }}>{link.badge}</span>
                        )}
                        {link.label}
                        <ExternalLink style={{ width: 11, height: 11, color: BAI.inkFaint }} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* AI Analysis */}
                {req.aiAnalysis ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Sparkles style={{ width: 15, height: 15, color: BAI.caramel }} />
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.ink, margin: 0 }}>Analyse IA</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 120, background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>Sévérité</p>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, color: severityColor(req.aiAnalysis.severity), margin: 0 }}>{severityLabel(req.aiAnalysis.severity)}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 120, background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: '10px 14px' }}>
                        <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: '0 0 4px' }}>Coût estimé</p>
                        <p style={{ fontFamily: BAI.fontDisplay, fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: 0 }}>{req.aiAnalysis.estimatedCost.min.toLocaleString('fr-FR')}–{req.aiAnalysis.estimatedCost.max.toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>
                    {req.aiAnalysis.advice && <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, margin: 0, lineHeight: 1.6 }}><strong style={{ color: BAI.ink }}>Conseil · </strong>{req.aiAnalysis.advice}</p>}
                  </div>
                ) : (
                  <button onClick={() => analyzeWithAI(req.id)} disabled={isAnalyzing === req.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: `1px solid ${BAI.caramelBorder}`, background: BAI.caramelLight, fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.caramel, cursor: 'pointer' }}>
                    <Sparkles style={{ width: 14, height: 14 }} />
                    {isAnalyzing === req.id ? 'Analyse en cours...' : "Analyser avec l'IA"}
                  </button>
                )}

                {/* Update status */}
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 8px' }}>Statut</p>
                  <select value={req.status} onChange={e => updateStatus(req.id, { status: e.target.value as MaintenanceStatus })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${BAI.border}`, background: BAI.bgMuted, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, outline: 'none', cursor: 'pointer' }}>
                    {(Object.keys(MAINTENANCE_STATUS_LABELS) as MaintenanceStatus[]).map(k => (
                      <option key={k} value={k}>{MAINTENANCE_STATUS_LABELS[k]}</option>
                    ))}
                  </select>
                </div>

                {/* History — other requests for same property */}
                {(() => {
                  const samePropertyReqs = requests.filter(r => r.property?.title === req.property?.title && r.id !== req.id)
                  if (samePropertyReqs.length === 0) return null
                  return (
                    <div>
                      <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkFaint, margin: '0 0 10px' }}>Historique — {samePropertyReqs.length} autre{samePropertyReqs.length > 1 ? 's' : ''} intervention{samePropertyReqs.length > 1 ? 's' : ''} sur ce bien</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {samePropertyReqs.slice(0, 6).map(r => (
                          <div key={r.id} onClick={() => setSelectedReqId(r.id)} style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: BAI.transition }} onMouseEnter={e => (e.currentTarget.style.background = BAI.bgMuted)} onMouseLeave={e => (e.currentTarget.style.background = BAI.bgSurface)}>
                            <CategoryIcon category={r.category} size={14} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, color: BAI.ink, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, margin: 0 }}>{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <StatusBadge s={r.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </>
        )
      })()}
    </Layout>
  )
}
