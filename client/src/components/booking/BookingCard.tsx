import {
  Calendar, Clock, MapPin, User, MessageSquare,
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  FolderOpen,
} from 'lucide-react'
import { Booking, BookingStatus } from '../../types/booking.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

interface BookingCardProps {
  booking: Booking
  viewMode: 'owner' | 'tenant'
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  isLoading?: boolean
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; icon: typeof CheckCircle; color: string; bgColor: string; borderColor: string; accent: string }
> = {
  PENDING: {
    label: 'En attente',
    icon: AlertCircle,
    color: '#92400e',
    bgColor: '#fdf5ec',
    borderColor: '#f3c99a',
    accent: '#f59e0b',
  },
  CONFIRMED: {
    label: 'Confirmée',
    icon: CheckCircle,
    color: BAI.tenant,
    bgColor: BAI.tenantLight,
    borderColor: BAI.tenantBorder,
    accent: BAI.tenant,
  },
  CANCELLED: {
    label: 'Annulée',
    icon: XCircle,
    color: BAI.error,
    bgColor: BAI.errorLight,
    borderColor: '#fca5a5',
    accent: BAI.error,
  },
  COMPLETED: {
    label: 'Terminée',
    icon: CheckCircle,
    color: BAI.inkMid,
    bgColor: BAI.bgMuted,
    borderColor: BAI.border,
    accent: BAI.inkFaint,
  },
}

function buildGoogleCalendarUrl(booking: Booking): string {
  const visitDate = new Date(booking.visitDate)
  const [h, m] = (booking.visitTime || '10:00').split(':').map(Number)
  visitDate.setHours(h, m, 0, 0)
  const endDate = new Date(visitDate.getTime() + (booking.duration || 30) * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const title = encodeURIComponent(`Visite — ${booking.property.title}`)
  const location = encodeURIComponent(
    [booking.property.address, booking.property.city].filter(Boolean).join(', ')
  )
  const details = encodeURIComponent(
    `Visite du bien "${booking.property.title}" à ${booking.property.city}.\nRéservation #${booking.id.slice(0, 8)}`
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(visitDate)}/${fmt(endDate)}&details=${details}&location=${location}`
}

function downloadIcal(booking: Booking) {
  const visitDate = new Date(booking.visitDate)
  const [h, m] = (booking.visitTime || '10:00').split(':').map(Number)
  visitDate.setHours(h, m, 0, 0)
  const endDate = new Date(visitDate.getTime() + (booking.duration || 30) * 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const location = [booking.property.address, booking.property.city].filter(Boolean).join(', ')
  const uid = `booking-${booking.id}@bailio.fr`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bailio//Visite//FR',
    'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(visitDate)}`, `DTEND:${fmt(endDate)}`,
    `SUMMARY:Visite — ${booking.property.title}`, `LOCATION:${location}`,
    `DESCRIPTION:Réservation #${booking.id.slice(0, 8)} via Bailio`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `visite-${booking.property.title.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export const BookingCard = ({
  booking,
  viewMode,
  onConfirm,
  onCancel,
  isLoading = false,
}: BookingCardProps) => {
  const navigate = useNavigate()
  const s = STATUS_CONFIG[booking.status]
  const StatusIcon = s.icon

  const visitDate = new Date(booking.visitDate)
  const formattedDate = format(visitDate, "EEEE d MMMM yyyy", { locale: fr })
  const isPast = visitDate < new Date()
  const canConfirm = viewMode === 'owner' && booking.status === 'PENDING' && !isPast
  const canCancel = booking.status === 'PENDING' && !isPast
  const canAddToCalendar = (booking.status === 'CONFIRMED' || (viewMode === 'tenant' && booking.status === 'PENDING')) && !isPast

  // Jour de la visite pour le badge date
  const dayNum = format(visitDate, 'd')
  const monthShort = format(visitDate, 'MMM', { locale: fr })

  return (
    <div
      style={{
        background: BAI.bgSurface,
        border: `1px solid ${BAI.border}`,
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
        overflow: 'hidden',
        fontFamily: BAI.fontBody,
      }}
    >
      {/* Accent bar statut */}
      <div style={{ height: 3, background: s.accent }} />

      <div style={{ padding: 'clamp(14px, 4vw, 20px)' }}>

        {/* ── Header : badge date + titre + statut ── */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>

          {/* Badge date */}
          <div style={{
            flexShrink: 0, width: 52, height: 52,
            borderRadius: 12,
            background: s.bgColor,
            border: `1px solid ${s.borderColor}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.color, lineHeight: 1 }}>
              {monthShort}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1, fontFamily: BAI.fontDisplay, fontStyle: 'italic' }}>
              {dayNum}
            </span>
          </div>

          {/* Titre + sous-titre */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={() => navigate(`/property/${booking.property.id}`)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', width: '100%',
              }}
            >
              <p style={{
                fontSize: 16, fontWeight: 700,
                color: BAI.ink, lineHeight: 1.25, margin: '0 0 4px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {booking.property.title}
              </p>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: BAI.inkMid }}>
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: BAI.inkFaint }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[booking.property.address, booking.property.city].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>

          {/* Badge statut */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20, flexShrink: 0,
            background: s.bgColor, color: s.color,
            border: `1px solid ${s.borderColor}`,
            fontSize: 11, fontWeight: 600,
          }}>
            <StatusIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        </div>

        {/* ── Infos : date / horaire / visiteur ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
          }}>
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.owner }} />
            <div>
              <p style={{ fontSize: 10, color: BAI.inkFaint, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Date</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: BAI.ink, textTransform: 'capitalize' }}>
                {formattedDate}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
          }}>
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.owner }} />
            <div>
              <p style={{ fontSize: 10, color: BAI.inkFaint, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Horaire</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: BAI.ink }}>
                {booking.visitTime} <span style={{ color: BAI.inkFaint, fontWeight: 400 }}>· {booking.duration} min</span>
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
          }}>
            <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BAI.owner }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, color: BAI.inkFaint, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {viewMode === 'owner' ? 'Visiteur' : 'Propriétaire'}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: BAI.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {viewMode === 'owner'
                  ? `${booking.tenant.firstName} ${booking.tenant.lastName}`
                  : booking.property.owner
                  ? `${booking.property.owner.firstName} ${booking.property.owner.lastName}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Dossier locataire (owner uniquement) ── */}
        {viewMode === 'owner' && (
          <button
            onClick={() => navigate(`/owner/tenants/${booking.tenantId}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '9px 14px', marginBottom: 14,
              borderRadius: 10, cursor: 'pointer',
              background: BAI.ownerLight,
              border: `1px solid ${BAI.ownerBorder}`,
              color: BAI.owner,
              fontSize: 13, fontWeight: 600,
              fontFamily: BAI.fontBody,
              transition: 'filter 0.12s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(0.95)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'none' }}
          >
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
            <span style={{ flex: 1 }}>
              Dossier de {booking.tenant.firstName} {booking.tenant.lastName}
            </span>
            <ExternalLink className="w-3.5 h-3.5" style={{ color: BAI.ownerBorder, flexShrink: 0 }} />
          </button>
        )}

        {/* ── Notes ── */}
        {booking.tenantNotes && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 12px', marginBottom: 12, borderRadius: 10,
            background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
          }}>
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BAI.inkMid }} />
            <div>
              <p style={{ fontSize: 10, color: BAI.inkFaint, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Note du visiteur
              </p>
              <p style={{ fontSize: 13, color: BAI.ink, lineHeight: 1.5 }}>{booking.tenantNotes}</p>
            </div>
          </div>
        )}

        {/* ── Raison annulation ── */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 12px', marginBottom: 12, borderRadius: 10,
            background: BAI.errorLight, border: `1px solid #fca5a5`,
          }}>
            <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BAI.error }} />
            <div>
              <p style={{ fontSize: 10, color: BAI.error, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Raison de l'annulation
              </p>
              <p style={{ fontSize: 13, color: BAI.error, lineHeight: 1.5 }}>{booking.cancellationReason}</p>
              {booking.cancelledAt && (
                <p style={{ fontSize: 11, color: BAI.error, opacity: 0.65, marginTop: 3 }}>
                  Le {format(new Date(booking.cancelledAt), 'Pp', { locale: fr })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Agenda CTA ── */}
        {canAddToCalendar && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            padding: '10px 12px', marginBottom: 12, borderRadius: 10,
            background: booking.status === 'CONFIRMED' ? BAI.tenantLight : BAI.bgMuted,
            border: `1px solid ${booking.status === 'CONFIRMED' ? BAI.tenantBorder : BAI.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: booking.status === 'CONFIRMED' ? BAI.tenant : BAI.inkMid }} />
              <p style={{ fontSize: 12, color: booking.status === 'CONFIRMED' ? BAI.tenant : BAI.inkMid, fontWeight: 500 }}>
                {booking.status === 'CONFIRMED' ? 'Ajouter à votre agenda' : 'Enregistrer ce créneau'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => downloadIcal(booking)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  background: BAI.bgSurface, color: BAI.inkMid,
                  border: `1px solid ${BAI.border}`,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: BAI.fontBody,
                }}
              >
                <ExternalLink className="w-3 h-3" />
                iCal
              </button>
              <a
                href={buildGoogleCalendarUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  background: booking.status === 'CONFIRMED' ? BAI.tenant : BAI.night,
                  color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: BAI.fontBody,
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Google Cal
              </a>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {(canConfirm || canCancel) && (
          <div style={{
            display: 'flex', gap: 8, paddingTop: 12,
            borderTop: `1px solid ${BAI.border}`,
          }}>
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: BAI.night, color: '#ffffff',
                  fontSize: 13, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1, fontFamily: BAI.fontBody,
                  minHeight: 42,
                }}
              >
                {isLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                Confirmer
              </button>
            )}
            {canCancel && onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isLoading}
                style={{
                  flex: canConfirm ? '0 0 auto' : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10,
                  background: BAI.bgSurface, color: BAI.error,
                  border: `1px solid #fca5a5`,
                  fontSize: 13, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1, fontFamily: BAI.fontBody,
                  minHeight: 42,
                }}
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 10, marginTop: (canConfirm || canCancel) ? 8 : 0,
          borderTop: `1px solid ${BAI.border}`,
          fontSize: 11, color: BAI.inkFaint,
        }}>
          <span>#{booking.id.slice(0, 8)}</span>
          <span>Créée le {format(new Date(booking.createdAt), 'd MMM yyyy', { locale: fr })}</span>
        </div>

      </div>
    </div>
  )
}
