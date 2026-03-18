import { Check, CheckCheck, Trash2, FileText, Download } from 'lucide-react'
import { Message } from '../../types/message.types'
import { format } from 'date-fns'

const M = {
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  muted: '#f4f2ee',
  border: '#e4e1db',
  owner: '#1a3270',
  surface: '#ffffff',
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  onDelete?: (messageId: string) => void
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar = true,
  onDelete,
}: MessageBubbleProps) => {
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const senderUser = message.sender

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
              style={{ background: M.muted, border: `1px solid ${M.border}` }}>
              <span className="text-xs font-semibold" style={{ color: M.inkMid }}>
                {senderUser?.firstName?.[0] || '?'}
                {senderUser?.lastName?.[0] || ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'min(70%, 480px)' }}>
        <div
          className={`relative px-4 py-2 rounded-2xl group ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={isOwn
            ? { background: M.night, color: M.surface }
            : { background: M.muted, color: M.ink, border: `1px solid ${M.border}` }
          }
        >
          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</p>

          {/* Attachments */}
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
                      ? { background: 'rgba(255,255,255,0.15)', color: M.surface }
                      : { background: M.border, color: M.inkMid }
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

          {/* Delete Button (own messages only) */}
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: M.inkFaint }}
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: M.inkFaint }}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <>
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5" style={{ color: M.owner }} />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Spacer for alignment when no avatar */}
      {!showAvatar && <div className="w-8 flex-shrink-0" />}
    </div>
  )
}
