import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProperties } from '../../hooks/useProperties'
import { useContractStore } from '../../store/contractStore'
import { useAuth } from '../../hooks/useAuth'
import { Property, PropertyStatus } from '../../types/property.types'
import {
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
  Building2,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { StatusChangeModal } from '../../components/property/StatusChangeModal'
import { BAI } from '../../constants/bailio-tokens'
import toast from 'react-hot-toast'

type TabKey = 'tous' | 'disponibles' | 'en-location' | 'hors-marche'

const TAB_STATUSES: Record<TabKey, PropertyStatus[] | null> = {
  'tous':        null,
  'disponibles': ['AVAILABLE'],
  'en-location': ['OCCUPIED'],
  'hors-marche': ['DRAFT', 'RESERVED'],
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
    const property = myProperties.find(p => p.id === id)
    if (property?.status === 'OCCUPIED') {
      window.alert(`Impossible de supprimer "${title}" : ce bien est actuellement en location. Résiliez d'abord le bail.`)
      return
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) return
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
      try {
        await createContract({
          propertyId: statusModalProperty.id,
          tenantId,
          startDate: now.toISOString().split('T')[0],
          endDate: oneYearLater.toISOString().split('T')[0],
          monthlyRent: statusModalProperty.price,
          charges: statusModalProperty.charges || undefined,
          deposit: statusModalProperty.deposit || undefined,
        })
      } catch (e: any) {
        toast.error(e?.message ?? 'Erreur lors de la création du contrat')
        return
      }
    }
    await changePropertyStatus(statusModalProperty.id, status)
  }

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    AVAILABLE: { label: 'Disponible',  bg: BAI.successLight,  color: BAI.success },
    OCCUPIED:  { label: 'En location', bg: BAI.ownerLight,    color: BAI.owner },
    DRAFT:     { label: 'Hors marché', bg: BAI.bgMuted,       color: BAI.inkMid },
    RESERVED:  { label: 'Réservé',     bg: BAI.caramelLight,  color: BAI.caramel },
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

  const PropertyCardItem = ({ property, delay = 0 }: { property: Property; delay?: number }) => {
    const cfg = statusConfig[property.status] || statusConfig['DRAFT']
    const mainImage = property.images[0] || '/placeholder-property.jpg'

    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay }}
        whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(13,12,10,0.12), 0 16px 40px rgba(13,12,10,0.08)' }}
        style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: BAI.shadowMd,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* Image */}
        <div className="relative" style={{ height: 180, background: BAI.bgMuted }}>
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-property.jpg' }}
          />
          {/* Price badge */}
          <div
            className="absolute bottom-3 left-3 px-3 py-1 rounded-xl"
            style={{
              background: BAI.bgSurface,
              boxShadow: '0 2px 8px rgba(13,12,10,0.14)',
            }}
          >
            <span style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontWeight: 700, fontStyle: 'italic', color: BAI.ink }}>
              {property.price}€
            </span>
            <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>/mois</span>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span
              className="px-2.5 py-1 rounded-full"
              style={{
                background: cfg.bg,
                color: cfg.color,
                fontFamily: BAI.fontBody,
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${cfg.color}22`,
              }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h3
            className="mb-1 line-clamp-1"
            style={{
              fontFamily: BAI.fontBody,
              fontSize: 13.5,
              fontWeight: 600,
              color: BAI.ink,
            }}
          >
            {property.title}
          </h3>
          <div className="flex items-center mb-3" style={{ gap: 4 }}>
            <MapPin style={{ width: 12, height: 12, color: BAI.inkFaint, flexShrink: 0 }} />
            <span
              className="line-clamp-1"
              style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}
            >
              {property.city}, {property.postalCode}
            </span>
          </div>

          {/* Characteristics */}
          <div
            className="flex items-center gap-3 mb-3 pb-3"
            style={{
              borderBottom: `1px solid ${BAI.border}`,
              fontFamily: BAI.fontBody,
              fontSize: 12,
              color: BAI.inkMid,
            }}
          >
            <span className="flex items-center gap-1"><Bed style={{ width: 12, height: 12 }} />{property.bedrooms} ch.</span>
            <span className="flex items-center gap-1"><Bath style={{ width: 12, height: 12 }} />{property.bathrooms} sdb</span>
            <span className="flex items-center gap-1"><Square style={{ width: 12, height: 12 }} />{property.surface}m²</span>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-3 mb-4"
            style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}
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
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 8,
                fontFamily: BAI.fontBody,
                fontSize: 13,
                fontWeight: 500,
                color: BAI.inkMid,
                cursor: 'pointer',
                transition: 'background 0.15s',
                minHeight: 36,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.bgSurface)}
            >
              <Eye style={{ width: 13, height: 13 }} />
              Voir
            </button>
            <button
              onClick={() => navigate(`/properties/${property.id}/edit`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{
                background: BAI.owner,
                border: 'none',
                borderRadius: 8,
                fontFamily: BAI.fontBody,
                fontSize: 13,
                fontWeight: 500,
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.15s',
                minHeight: 36,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = BAI.ownerHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BAI.owner; e.currentTarget.style.transform = 'translateY(0)' }}
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
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 8,
                fontFamily: BAI.fontBody,
                fontSize: 12,
                fontWeight: 500,
                color: BAI.inkMid,
                cursor: 'pointer',
                transition: 'background 0.15s',
                minHeight: 34,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = BAI.bgMuted)}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.bgSurface)}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Changer le statut
            </button>
            <button
              onClick={() => handleDelete(property.id, property.title)}
              disabled={deletingId === property.id}
              title="Supprimer"
              style={{
                background: BAI.errorLight,
                border: `1px solid ${BAI.error}44`,
                borderRadius: 8,
                padding: '0.375rem 0.625rem',
                color: BAI.error,
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: deletingId === property.id ? 0.5 : 1,
                minHeight: 34,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca')}
              onMouseLeave={(e) => (e.currentTarget.style.background = BAI.errorLight)}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <Layout>
      <div style={{ background: BAI.bgBase, minHeight: '100vh', fontFamily: BAI.fontBody }}>

        {/* ── Page Header ── */}
        <div style={{ background: BAI.bgSurface, borderBottom: `1px solid ${BAI.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,3vw,32px)' }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                <p style={{
                  fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, marginBottom: 6,
                }}>
                  Mes biens
                </p>
                <h1 style={{
                  fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px,4vw,40px)',
                  fontWeight: 700, fontStyle: 'italic', color: BAI.ink, lineHeight: 1.1, marginBottom: 6,
                }}>
                  {isLoading ? 'Chargement…' : `${myPropertiesTotal} bien${myPropertiesTotal > 1 ? 's' : ''} en gestion`}
                </h1>
                <div className="flex items-center gap-3 flex-wrap" style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.inkMid }}>
                  {counts['en-location'] > 0 && (
                    <span><strong style={{ color: BAI.owner }}>{counts['en-location']}</strong> en location</span>
                  )}
                  {counts['disponibles'] > 0 && (
                    <span><strong style={{ color: BAI.success }}>{counts['disponibles']}</strong> disponible{counts['disponibles'] > 1 ? 's' : ''}</span>
                  )}
                  {counts['hors-marche'] > 0 && (
                    <span><strong style={{ color: BAI.inkMid }}>{counts['hors-marche']}</strong> hors marché</span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.24 }}
              >
                <Link
                  to="/properties/new"
                  className="inline-flex items-center gap-2"
                  style={{
                    background: BAI.night,
                    borderRadius: 8,
                    fontFamily: BAI.fontBody,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '11px 20px',
                    minHeight: 44,
                    transition: 'opacity 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  Ajouter un bien
                </Link>
              </motion.div>
            </div>

            {/* ── Tab bar ── */}
            {myProperties.length > 0 && (
              <div style={{ display: 'flex', gap: 0, marginTop: 24, marginBottom: -1 }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 13.5,
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? BAI.ink : BAI.inkMid,
                        borderBottom: isActive ? `2px solid ${BAI.caramel}` : '2px solid transparent',
                        background: 'none',
                        border: 'none',
                        borderBottomWidth: 2,
                        borderBottomStyle: 'solid',
                        borderBottomColor: isActive ? BAI.caramel : 'transparent',
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 10,
                        paddingBottom: 12,
                        cursor: 'pointer',
                        transition: 'color 0.15s, border-bottom-color 0.15s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {tab.label}
                      {counts[tab.key] > 0 && (
                        <span
                          style={{
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isActive ? BAI.caramel : BAI.bgMuted,
                            color: isActive ? '#ffffff' : BAI.inkMid,
                            borderRadius: 10,
                            padding: '1px 7px',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                        >
                          {counts[tab.key]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: BAI.errorLight, border: `1px solid ${BAI.error}44` }}
            >
              <AlertCircle style={{ width: 18, height: 18, color: BAI.error, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error }}>{error}</p>
                <button
                  onClick={() => setError(null)}
                  style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.error, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
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
                style={{ width: 40, height: 40, borderWidth: 2, borderStyle: 'solid', borderColor: BAI.border, borderTopColor: BAI.owner }}
              />
            </div>
          )}

          {/* Empty state — no properties at all */}
          {!isLoading && myProperties.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: 'clamp(48px,8vw,96px) 24px' }}
            >
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: BAI.bgMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Building2 style={{ width: 32, height: 32, color: BAI.inkFaint }} />
              </div>
              <h2 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 24, color: BAI.ink, marginBottom: 10,
              }}>
                Vous n'avez pas encore de bien
              </h2>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, marginBottom: 28 }}>
                Commencez par ajouter votre premier bien immobilier.
              </p>
              <Link
                to="/properties/new"
                className="inline-flex items-center gap-2"
                style={{
                  background: BAI.night, borderRadius: 9,
                  fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
                  color: '#ffffff', textDecoration: 'none', padding: '12px 24px',
                }}
              >
                <Plus style={{ width: 16, height: 16 }} />
                Ajouter votre premier bien
              </Link>
            </motion.div>
          )}

          {/* Empty state — tab filter yields nothing */}
          {!isLoading && myProperties.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13.5, color: BAI.inkMid }}>
                Aucun bien dans cette catégorie.
              </p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((property, i) => (
                <PropertyCardItem key={property.id} property={property} delay={i * 0.05} />
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
