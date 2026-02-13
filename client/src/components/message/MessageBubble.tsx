import { Check, CheckCheck, Trash2, FileText, Download } from 'lucide-react'
import { Message } from '../../types/message.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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

  // Always show the sender's info next to their message
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
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                {senderUser?.firstName?.[0] || '?'}
                {senderUser?.lastName?.[0] || ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            relative px-4 py-2 rounded-2xl group
            ${
              isOwn
                ? 'bg-primary-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
          `}
        >
          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

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
                    className={`
                      flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs
                      ${isOwn
                        ? 'bg-primary-700 text-white hover:bg-primary-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}
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
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Timestamp and Read Status */}
        <div
          className={`
            flex items-center gap-1 mt-1 text-xs
            ${isOwn ? 'text-gray-500' : 'text-gray-500'}
          `}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <>
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-primary-600" title="Lu" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-400" title="Envoyé" />
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
