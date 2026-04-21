import { useState } from 'react'
import { Check, CheckCheck, Trash2, FileText, Download, CalendarCheck, MapPin, Clock } from 'lucide-react'
import { Message } from '../../types/message.types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BAI } from '../../constants/bailio-tokens'

interface RdvSlot { date: string; time: string }
interface RdvProposal { __rdv: 'proposal'; propertyId: string; propertyTitle: string; slots: RdvSlot[]; duration: number }
interface RdvConfirmed { __rdv: 'confirmed'; propertyTitle: string; date: string; time: string; duration: number; bookingId?: string }

function parseRdv(content: string): RdvProposal | RdvConfirmed | null {
  if (!content.startsWith('{')) return null
  try {
    const obj = JSON.parse(content)
    if (obj.__rdv === 'proposal' || obj.__rdv === 'confirmed') return obj
  } catch { /* */ }
  return null
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  onDelete?: (messageId: string) => void
  onRdvSlotSelect?: (slot: RdvSlot, propertyId: string, duration: number) => Promise<void>
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  onDelete,
  onRdvSlotSelect,
}: MessageBubbleProps) => {
  const [confirmingSlot, setConfirmingSlot] = useState<number | null>(null)

  const formatTime = (dateString: string) => format(new Date(dateString), 'HH:mm')

  const senderUser = message.sender
  const rdv = parseRdv(message.content)

  async function handleSlotSelect(slot: RdvSlot, idx: number, propertyId: string, duration: number) {
    if (!onRdvSlotSelect) return
    setConfirmingSlot(idx)
    try {
      await onRdvSlotSelect(slot, propertyId, duration)
    } finally {
      setConfirmingSlot(null)
    }
  }

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {senderUser?.avatar ? (
            <img
              src={senderUser.avatar}
              alt={`${senderUser.firstName} ${senderUser.lastName}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
              <span className="text-xs font-semibold" style={{ color: BAI.inkMid }}>
                {senderUser?.firstName?.[0] || '?'}
                {senderUser?.lastName?.[0] || ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'min(85%, 480px)' }}>

        {/* ── RDV Proposal card ─────────────────────────────────────── */}
        {rdv?.__rdv === 'proposal' && (
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.ownerBorder}`,
            borderRadius: 14, overflow: 'hidden', minWidth: 260,
            boxShadow: '0 2px 8px rgba(13,12,10,0.08)',
          }}>
            <div style={{
              background: BAI.ownerLight, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `1px solid ${BAI.ownerBorder}`,
            }}>
              <CalendarCheck size={16} style={{ color: BAI.owner, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: BAI.owner, margin: 0 }}>Proposition de visite</p>
                <p style={{ fontSize: 11, color: '#4a6fa8', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={10} /> {rdv.propertyTitle}
                </p>
              </div>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rdv.slots.map((slot, i) => (
                <button
                  key={i}
                  disabled={isOwn || confirmingSlot !== null}
                  onClick={() => !isOwn && handleSlotSelect(slot, i, rdv.propertyId, rdv.duration)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    border: `1.5px solid ${isOwn ? BAI.border : BAI.ownerBorder}`,
                    background: isOwn ? BAI.bgMuted : confirmingSlot === i ? BAI.ownerLight : BAI.bgSurface,
                    cursor: isOwn ? 'default' : confirmingSlot !== null ? 'wait' : 'pointer',
                    width: '100%', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isOwn && confirmingSlot === null) (e.currentTarget as HTMLElement).style.background = BAI.ownerLight }}
                  onMouseLeave={e => { if (!isOwn) (e.currentTarget as HTMLElement).style.background = BAI.bgSurface }}
                >
                  <div style={{ textAlign: 'center', minWidth: 36 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: BAI.owner, margin: 0, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
                      {format(parseISO(slot.date), 'd')}
                    </p>
                    <p style={{ fontSize: 9, fontWeight: 600, color: BAI.owner, textTransform: 'uppercase', margin: 0 }}>
                      {format(parseISO(slot.date), 'MMM', { locale: fr })}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: BAI.ink, margin: 0 }}>
                      {format(parseISO(slot.date), 'EEEE d MMMM', { locale: fr })}
                    </p>
                    <p style={{ fontSize: 12, color: BAI.inkMid, margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {slot.time} · {rdv.duration} min
                    </p>
                  </div>
                  {!isOwn && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: BAI.owner, background: BAI.ownerLight,
                      border: `1px solid ${BAI.ownerBorder}`, borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                    }}>
                      {confirmingSlot === i ? '…' : 'Choisir'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {!isOwn && (
              <p style={{ fontSize: 11, color: BAI.inkFaint, padding: '0 14px 10px', margin: 0 }}>
                Cliquez sur un créneau pour confirmer votre visite.
              </p>
            )}
          </div>
        )}

        {/* ── RDV Confirmed card ─────────────────────────────────────── */}
        {rdv?.__rdv === 'confirmed' && (
          <div style={{
            background: BAI.bgSurface, border: `1px solid ${BAI.tenantBorder}`,
            borderRadius: 14, overflow: 'hidden', minWidth: 240,
            boxShadow: '0 2px 8px rgba(13,12,10,0.08)',
          }}>
            <div style={{
              background: BAI.tenantLight, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `1px solid ${BAI.tenantBorder}`,
            }}>
              <CalendarCheck size={16} style={{ color: BAI.tenant, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: BAI.tenant, margin: 0 }}>Visite confirmée ✓</p>
                <p style={{ fontSize: 11, color: '#3a8a5a', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={10} /> {rdv.propertyTitle}
                </p>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: BAI.ink, margin: '0 0 4px' }}>
                {format(parseISO(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
              <p style={{ fontSize: 13, color: BAI.inkMid, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {rdv.time} · {rdv.duration} min
              </p>
            </div>
          </div>
        )}

        {/* ── Standard text bubble ───────────────────────────────────── */}
        {!rdv && (
          <div
            className={`relative px-4 py-2 rounded-2xl group ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}
            style={isOwn
              ? { background: BAI.night, color: BAI.bgSurface }
              : { background: BAI.bgMuted, color: BAI.ink, border: `1px solid ${BAI.border}` }
            }
          >
            <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</p>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {message.attachments.map((attachment, index) => {
                  const fileName = decodeURIComponent(
                    attachment.split('/').pop()?.replace(/^\d+-/, '') || `fichier-${index + 1}`
                  )
                  return (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs"
                      style={isOwn
                        ? { background: 'rgba(255,255,255,0.15)', color: BAI.bgSurface }
                        : { background: BAI.border, color: BAI.inkMid }
                      }
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{fileName}</span>
                      <Download className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />
                    </a>
                  )
                })}
              </div>
            )}

            {isOwn && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: BAI.inkFaint }}
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Timestamp + read status */}
        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: BAI.inkFaint }}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            message.isRead
              ? <CheckCheck className="w-3.5 h-3.5" style={{ color: BAI.owner }} />
              : <Check className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {!showAvatar && <div className="w-8 flex-shrink-0" />}
    </div>
  )
}
