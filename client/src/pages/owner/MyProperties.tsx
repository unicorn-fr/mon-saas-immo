import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Property, PropertyStatus } from '../../types/property.types'
import {
  Home,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Square,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { StatusChangeModal } from '../../components/property/StatusChangeModal'

type TabKey = 'tous' | 'disponibles' | 'en-location' | 'hors-marche'

const TAB_STATUSES: Record<TabKey, PropertyStatus[] | null> = {
  'tous':        null,
  'disponibles': ['AVAILABLE'],
  'en-location': ['OCCUPIED'],
  'hors-marche': ['DRAFT', 'RESERVED'],
}

// ─── Maison tokens ────────────────────────────────────────────────────────────
const M = {
  bg:           '#fafaf8',
  surface:      '#ffffff',
  muted:        '#f4f2ee',
  ink:          '#0d0c0a',
  inkMid:       '#5a5754',
  inkFaint:     '#9e9b96',
  owner:        '#1a3270',
  ownerLight:   '#eaf0fb',
  ownerBorder:  '#b8ccf0',
  border:       '#e4e1db',
  borderMid:    '#ccc9c3',
  caramel:      '#c4976a',
  caramelLight: '#fdf5ec',
  danger:       '#9b1c1c',
  dangerBg:     '#fef2f2',
  warning:      '#92400e',
  warningBg:    '#fdf5ec',
  success:      '#1b5e3b',
  successBg:    '#edf7f2',
}

export default function MyProperties() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    myProperties,
    myPropertiesTotal,
    isLoading,
    error,
    fetchMyProperties,
    deleteProperty,
    changePropertyStatus,
    setError,
  } = useProperties()
  const { createContract } = useContractStore()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusModalProperty, setStatusModalProperty] = useState<Property | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('tous')

  useEffect(() => {
    fetchMyProperties()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Etes-vous sur de vouloir supprimer "${title}" ?`)) return
    setDeletingId(id)
    try {
      await deleteProperty(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangeStatus = async (status: PropertyStatus, tenantId?: string) => {
    if (!statusModalProperty) return
    if (status === 'OCCUPIED' && tenantId && user) {
      const now = new Date()
      const oneYearLater = new Date(now)
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
      await createContract({
        propertyId: statusModalProperty.id,
        tenantId,
        startDate: now.toISOString().split('T')[0],
        endDate: oneYearLater.toISOString().split('T')[0],
        monthlyRent: statusModalProperty.price,
        charges: statusModalProperty.charges || undefined,
        deposit: statusModalProperty.deposit || undefined,
      })
    }
    await changePropertyStatus(statusModalProperty.id, status)
  }

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    AVAILABLE: { label: 'Disponible',  bg: M.successBg,    color: M.success },
    OCCUPIED:  { label: 'En location', bg: M.ownerLight,   color: M.owner },
    DRAFT:     { label: 'Hors marché', bg: M.muted,        color: M.inkMid },
    RESERVED:  { label: 'Réservé',     bg: M.caramelLight, color: M.caramel },
  }

  const counts: Record<TabKey, number> = {
    'tous':        myProperties.length,
    'disponibles': myProperties.filter(p => p.status === 'AVAILABLE').length,
    'en-location': myProperties.filter(p => p.status === 'OCCUPIED').length,
    'hors-marche': myProperties.filter(p => ['DRAFT','RESERVED'].includes(p.status)).length,
  }

  const filtered = TAB_STATUSES[activeTab]
    ? myProperties.filter(p => (TAB_STATUSES[activeTab] as PropertyStatus[]).includes(p.status))
    : myProperties

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'tous',        label: 'Tous' },
    { key: 'disponibles', label: 'Disponibles' },
    { key: 'en-location', label: 'En location' },
    { key: 'hors-marche', label: 'Hors marché' },
  ]

  const PropertyCard = ({ property }: { property: Property }) => {
    const cfg = statusConfig[property.status] || statusConfig['DRAFT']
    const mainImage = property.images[0] || '/placeholder-property.jpg'
    const [hovered, setHovered] = useState(false)

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: M.surface,
          border: `1px solid ${M.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 4px 16px rgba(13,12,10,0.10), 0 12px 32px rgba(13,12,10,0.08)'
            : '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'box-shadow 0.2s, transform 0.2s',
        }}
      >
        {/* Image */}
        <div className="relative" style={{ height: 176, background: M.muted }}>
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
          />
          {/* Price badge */}
          <div
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl"
            style={{
              background: M.surface,
              boxShadow: '0 1px 4px rgba(13,12,10,0.12)',
            }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: M.ink }}>
              {property.price}€
            </span>
            <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: M.inkFaint }}>/mois</span>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span
              className="px-2.5 py-1 rounded-full"
              style={{
                background: cfg.bg,
                color: cfg.color,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 11,
                fontWeight: 500,
                border: `1px solid ${cfg.color}22`,
              }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className="mb-1 line-clamp-1"
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: M.ink,
            }}
          >
            {property.title}
          </h3>
          <div className="flex items-center mb-3" style={{ gap: 4 }}>
            <MapPin style={{ width: 12, height: 12, color: M.inkFaint, flexShrink: 0 }} />
            <span
              className="line-clamp-1"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: M.inkFaint }}
            >
              {property.city}, {property.postalCode}
            </span>
          </div>

          {/* Characteristics */}
          <div
            className="flex items-center gap-3 mb-3 pb-3"
            style={{
              borderBottom: `1px solid ${M.border}`,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 12,
              color: M.inkMid,
            }}
          >
            <span className="flex items-center gap-1"><Bed style={{ width: 12, height: 12 }} />{property.bedrooms} ch.</span>
            <span className="flex items-center gap-1"><Bath style={{ width: 12, height: 12 }} />{property.bathrooms} sdb</span>
            <span className="flex items-center gap-1"><Square style={{ width: 12, height: 12 }} />{property.surface}m²</span>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: M.inkFaint }}
          >
            <span className="flex items-center gap-1"><Eye style={{ width: 12, height: 12 }} />{property.views} vues</span>
            <span className="flex items-center gap-1"><MessageSquare style={{ width: 12, height: 12 }} />{property.contactCount} contacts</span>
          </div>

          {/* Primary actions */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => navigate(`/properties/${property.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{
                background: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: M.inkMid,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
            >
              <Eye style={{ width: 13, height: 13 }} />
              Voir
            </button>
            <button
              onClick={() => navigate(`/properties/${property.id}/edit`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{
                background: M.owner,
                border: 'none',
                borderRadius: 8,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#142860'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = M.owner; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Edit style={{ width: 13, height: 13 }} />
              Modifier
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusModalProperty(property)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5"
              style={{
                background: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: 8,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: M.inkMid,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = M.muted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = M.surface)}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Changer le statut
            </button>
            <button
              onClick={() => handleDelete(property.id, property.title)}
              disabled={deletingId === property.id}
              title="Supprimer"
              style={{
                background: M.dangerBg,
                border: `1px solid ${M.danger}44`,
                borderRadius: 8,
                padding: '0.375rem 0.5rem',
                color: M.danger,
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: deletingId === property.id ? 0.5 : 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca')}
              onMouseLeave={(e) => (e.currentTarget.style.background = M.dangerBg)}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: M.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── Page Header ── */}
        <div style={{ background: M.surface, borderBottom: `1px solid ${M.border}` }}>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-start justify-between">
              <div>
                {/* Overline */}
                <p
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: M.inkFaint,
                    marginBottom: 6,
                  }}
                >
                  Propriétaire — Patrimoine
                </p>
                {/* Title */}
                <h1
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 40,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: M.ink,
                    lineHeight: 1.1,
                    marginBottom: 6,
                  }}
                >
                  Mes biens
                </h1>
                {/* Subtitle */}
                <div className="flex items-center gap-3" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, color: M.inkMid }}>
                  <span>
                    <strong style={{ color: M.ink }}>{myPropertiesTotal}</strong> bien{myPropertiesTotal > 1 ? 's' : ''} au total
                  </span>
                  {counts['en-location'] > 0 && (
                    <>
                      <span style={{ color: M.borderMid }}>·</span>
                      <span><strong style={{ color: M.owner }}>{counts['en-location']}</strong> en location</span>
                    </>
                  )}
                  {counts['disponibles'] > 0 && (
                    <>
                      <span style={{ color: M.borderMid }}>·</span>
                      <span><strong style={{ color: M.success }}>{counts['disponibles']}</strong> disponible{counts['disponibles'] > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>

              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2"
                style={{
                  background: M.owner,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#142860'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = M.owner; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                Ajouter un bien
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        {myProperties.length > 0 && (
          <div style={{ background: M.surface, borderBottom: `1px solid ${M.border}` }}>
            <div className="container mx-auto px-4">
              <div className="flex gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="flex items-center gap-2 px-5 py-4"
                      style={{
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? M.owner : M.inkMid,
                        borderBottom: isActive ? `2px solid ${M.owner}` : '2px solid transparent',
                        background: 'none',
                        border: 'none',
                        borderBottomWidth: 2,
                        borderBottomStyle: 'solid',
                        borderBottomColor: isActive ? M.owner : 'transparent',
                        cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                    >
                      {tab.label}
                      {counts[tab.key] > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            background: isActive ? M.owner : M.muted,
                            color: isActive ? '#ffffff' : M.inkMid,
                          }}
                        >
                          {counts[tab.key]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="container mx-auto px-4 py-8">

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: M.dangerBg, border: `1px solid ${M.danger}44` }}
            >
              <AlertCircle style={{ width: 18, height: 18, color: M.danger, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: M.danger }}>{error}</p>
                <button
                  onClick={() => setError(null)}
                  style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: M.danger, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div
                className="animate-spin rounded-full"
                style={{ width: 40, height: 40, borderWidth: 2, borderStyle: 'solid', borderColor: M.border, borderTopColor: M.owner }}
              />
            </div>
          )}

          {/* Empty state — no properties at all */}
          {!isLoading && myProperties.length === 0 && (
            <div className="text-center py-24">
              <div
                className="flex items-center justify-center mx-auto mb-5"
                style={{ width: 72, height: 72, borderRadius: '50%', background: M.muted }}
              >
                <Home style={{ width: 32, height: 32, color: M.inkFaint }} />
              </div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 22,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: M.ink,
                  marginBottom: 8,
                }}
              >
                Aucune propriété
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: M.inkMid,
                  marginBottom: 24,
                }}
              >
                Commencez par ajouter votre premier bien immobilier.
              </p>
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2 px-5 py-2.5"
                style={{
                  background: M.owner,
                  borderRadius: 8,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#ffffff',
                  textDecoration: 'none',
                }}
              >
                <Plus style={{ width: 15, height: 15 }} />
                Ajouter un bien
              </Link>
            </div>
          )}

          {/* Empty state — tab filter yields nothing */}
          {!isLoading && myProperties.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16">
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: M.inkMid }}>
                Aucun bien dans cette catégorie.
              </p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      {statusModalProperty && (
        <StatusChangeModal
          isOpen={true}
          onClose={() => setStatusModalProperty(null)}
          onConfirm={handleChangeStatus}
          propertyTitle={statusModalProperty.title}
          currentStatus={statusModalProperty.status}
        />
      )}
    </Layout>
  )
}
