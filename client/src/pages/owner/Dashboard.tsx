import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'
import { applicationService } from '../../services/application.service'
import { bookingService } from '../../services/booking.service'
import { Layout } from '../../components/layout/Layout'
import { PropertyCard } from '../../components/property/PropertyCard'
import { BAI } from '../../constants/bailio-tokens'
import { Plus, ArrowRight, ShieldAlert, Calendar } from 'lucide-react'
import { apiClient } from '../../services/api.service'
import type { Application } from '../../types/application.types'
import type { Booking } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const { myProperties, statistics, fetchMyProperties, fetchMyStatistics, isLoading } = useProperties()

  const [pendingApps, setPendingApps] = useState<Application[]>([])
  const [upcomingVisits, setUpcomingVisits] = useState<Booking[]>([])
  const [identityVerified, setIdentityVerified] = useState(true)

  useEffect(() => {
    fetchMyProperties()
    fetchMyStatistics()

    applicationService.list().then((apps) => {
      setPendingApps(apps.filter((a) => a.status === 'PENDING'))
    }).catch(() => {})

    bookingService.getBookings({ status: 'CONFIRMED' }, { page: 1, limit: 20 }).then((res) => {
      const now = new Date()
      const future = res.bookings
        .filter((b) => new Date(`${b.visitDate}T${b.visitTime}`) > now)
        .sort((a, b) => new Date(`${a.visitDate}T${a.visitTime}`).getTime() - new Date(`${b.visitDate}T${b.visitTime}`).getTime())
        .slice(0, 3)
      setUpcomingVisits(future)
    }).catch(() => {})

    apiClient.get('/stripe/identity-status').then((res) => {
      setIdentityVerified(res.data?.data?.verified ?? true)
    }).catch(() => {})
  }, [])

  const displayedProperties = myProperties.slice(0, 6)
  const totalProps = statistics?.totalProperties ?? myProperties.length

  return (
    <Layout>
      <div style={{
        background: BAI.bgBase,
        minHeight: '100vh',
        padding: 'clamp(16px, 4vw, 40px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: BAI.fontBody,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BAI.caramel,
              marginBottom: 6,
            }}>
              Espace bailleur
            </p>
            <h1 style={{
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: BAI.ink,
              margin: 0,
            }}>
              Bonjour {user?.firstName} 👋
            </h1>
          </div>

          {/* ── Barre de 3 stats ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}>
            {[
              { label: 'Biens actifs', value: isLoading ? '—' : totalProps },
              { label: 'Candidatures en attente', value: pendingApps.length },
              { label: 'Visites à venir', value: upcomingVisits.length },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 16,
                padding: 'clamp(16px, 2vw, 24px)',
                boxShadow: BAI.shadowMd,
              }}>
                <div style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 700,
                  color: BAI.ink,
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 13,
                  color: BAI.inkMid,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Alerte identité ── */}
          {!identityVerified && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: BAI.warningLight,
              border: `1px solid ${BAI.caramelBorder}`,
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 32,
            }}>
              <ShieldAlert size={18} color={BAI.warning} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.warning, flex: 1 }}>
                Vérifiez votre identité pour activer les candidatures.
              </span>
              <Link to="/verify-identity" style={{
                fontFamily: BAI.fontBody,
                fontSize: 13,
                fontWeight: 600,
                color: BAI.warning,
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}>
                Vérifier maintenant
              </Link>
            </div>
          )}

          {/* ── Section Mes annonces ── */}
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{
                fontFamily: BAI.fontDisplay,
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: BAI.ink,
                margin: 0,
              }}>
                Mes annonces
              </h2>
              <Link
                to="/properties/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: BAI.night,
                  color: '#ffffff',
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 18px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  minHeight: 44,
                }}
              >
                <Plus size={16} />
                Ajouter
              </Link>
            </div>

            {isLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    background: BAI.bgMuted,
                    borderRadius: 16,
                    height: 260,
                  }} />
                ))}
              </div>
            ) : displayedProperties.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: BAI.bgSurface,
                border: `1px dashed ${BAI.border}`,
                borderRadius: 16,
              }}>
                <p style={{
                  fontFamily: BAI.fontBody,
                  fontSize: 15,
                  color: BAI.inkMid,
                  marginBottom: 20,
                }}>
                  Vous n'avez pas encore d'annonces publiées.
                </p>
                <Link
                  to="/properties/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: BAI.night,
                    color: '#ffffff',
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '12px 24px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    minHeight: 44,
                  }}
                >
                  <Plus size={16} />
                  Publiez votre première annonce
                </Link>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 20,
                }}>
                  {displayedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                {myProperties.length > 6 && (
                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <Link
                      to="/dashboard/owner/properties"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: BAI.fontBody,
                        fontSize: 14,
                        fontWeight: 600,
                        color: BAI.caramel,
                        textDecoration: 'none',
                      }}
                    >
                      Voir tous mes biens
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Section Candidatures récentes ── */}
          {pendingApps.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{
                  fontFamily: BAI.fontDisplay,
                  fontSize: 'clamp(20px, 3vw, 26px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: BAI.ink,
                  margin: 0,
                }}>
                  Candidatures récentes
                </h2>
                <Link
                  to="/applications/manage"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    fontWeight: 600,
                    color: BAI.caramel,
                    textDecoration: 'none',
                  }}
                >
                  Tout voir
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: BAI.shadowMd,
              }}>
                {pendingApps.slice(0, 5).map((app, idx) => {
                  const tenant = app.tenant
                  const initials = tenant
                    ? `${tenant.firstName?.[0] ?? ''}${tenant.lastName?.[0] ?? ''}`.toUpperCase()
                    : '?'
                  const name = tenant
                    ? `${tenant.firstName} ${tenant.lastName}`
                    : 'Locataire inconnu'

                  return (
                    <div
                      key={app.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 20px',
                        borderBottom: idx < Math.min(pendingApps.length, 5) - 1
                          ? `1px solid ${BAI.border}`
                          : 'none',
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: BAI.ownerLight,
                        border: `1px solid ${BAI.ownerBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: BAI.fontBody,
                        fontSize: 13,
                        fontWeight: 700,
                        color: BAI.owner,
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 14,
                          fontWeight: 600,
                          color: BAI.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {name}
                        </div>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 12,
                          color: BAI.inkFaint,
                          marginTop: 2,
                        }}>
                          {format(new Date(app.createdAt), 'd MMM yyyy', { locale: fr })}
                        </div>
                      </div>

                      <span style={{
                        fontFamily: BAI.fontBody,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: BAI.warning,
                        background: BAI.warningLight,
                        border: `1px solid ${BAI.caramelBorder}`,
                        borderRadius: 6,
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}>
                        En attente
                      </span>

                      <Link
                        to="/applications/manage"
                        style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          fontWeight: 600,
                          color: BAI.night,
                          textDecoration: 'none',
                          padding: '8px 14px',
                          border: `1px solid ${BAI.border}`,
                          borderRadius: 8,
                          whiteSpace: 'nowrap',
                          minHeight: 36,
                          display: 'inline-flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        Voir
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Section Visites à venir ── */}
          {upcomingVisits.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{
                fontFamily: BAI.fontDisplay,
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: BAI.ink,
                margin: '0 0 20px',
              }}>
                Visites à venir
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingVisits.map((visit) => {
                  const visitDt = new Date(`${visit.visitDate}T${visit.visitTime}`)
                  const tenant = visit.tenant
                  const tenantName = tenant
                    ? `${tenant.firstName} ${tenant.lastName}`
                    : 'Locataire inconnu'

                  return (
                    <div
                      key={visit.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        background: BAI.bgSurface,
                        border: `1px solid ${BAI.border}`,
                        borderRadius: 14,
                        padding: '16px 20px',
                        boxShadow: BAI.shadowMd,
                      }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: BAI.tenantLight,
                        border: `1px solid ${BAI.tenantBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Calendar size={20} color={BAI.tenant} />
                      </div>

                      <div style={{ minWidth: 120, flexShrink: 0 }}>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 14,
                          fontWeight: 700,
                          color: BAI.ink,
                        }}>
                          {format(visitDt, 'EEE d MMM', { locale: fr })}
                        </div>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          color: BAI.inkMid,
                          marginTop: 2,
                        }}>
                          {format(visitDt, 'HH:mm', { locale: fr })}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 14,
                          fontWeight: 600,
                          color: BAI.ink,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {visit.property?.title ?? 'Bien'}
                        </div>
                        <div style={{
                          fontFamily: BAI.fontBody,
                          fontSize: 13,
                          color: BAI.inkFaint,
                          marginTop: 2,
                        }}>
                          {tenantName}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      </div>
    </Layout>
  )
}
