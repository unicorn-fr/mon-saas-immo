import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip, X, Loader, FileText } from 'lucide-react'
import { apiClient } from '../../services/api.service'

interface UploadedFile {
  url: string
  name: string
  size: number
}

interface MessageInputProps {
  onSend: (content: string, attachments?: string[]) => Promise<void>
  isSending?: boolean
  placeholder?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

const M = {
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  muted: '#f4f2ee',
  border: '#e4e1db',
  surface: '#ffffff',
  inputBg: '#f8f7f4',
  dangerBg: '#fef2f2',
  dangerBorder: '#fca5a5',
  danger: '#9b1c1c',
}

export const MessageInput = ({
  onSend,
  isSending = false,
  placeholder = 'Ecrivez votre message...',
}: MessageInputProps) => {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || isSending) return

    try {
      const attachmentUrls = attachments.length > 0 ? attachments.map((a) => a.url) : undefined
      await onSend(content.trim() || '(piece jointe)', attachmentUrls)
      setContent('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" depasse la limite de 5 Mo`)
        continue
      }

      if (attachments.length >= 5) {
        setUploadError('Maximum 5 fichiers par message')
        break
      }

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiClient.post<{
          success: boolean
          data: { url: string; name: string; size: number }
        }>('/upload/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        setAttachments((prev) => [
          ...prev,
          {
            url: response.data.data.url,
            name: response.data.data.name,
            size: response.data.data.size,
          },
        ])
      } catch (err) {
        setUploadError(`Erreur lors de l'envoi de "${file.name}"`)
        console.error('Upload error:', err)
      } finally {
        setIsUploading(false)
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  return (
    <div
      className="border-t"
      style={{
        background: M.surface,
        borderColor: M.border,
        /* Safe-area iOS bottom padding */
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: 10,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      {/* Upload Error */}
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-xl flex items-center justify-between"
          style={{ background: M.dangerBg, border: `1px solid ${M.dangerBorder}` }}>
          <p className="text-sm" style={{ color: M.danger }}>{uploadError}</p>
          <button onClick={() => setUploadError(null)} style={{ color: M.inkFaint }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
              style={{ background: M.muted, border: `1px solid ${M.border}` }}
            >
              <FileText className="w-4 h-4" style={{ color: M.inkMid }} />
              <span className="max-w-[120px] truncate" style={{ color: M.inkMid }}>{attachment.name}</span>
              <span className="text-xs" style={{ color: M.inkFaint }}>({formatFileSize(attachment.size)})</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1"
                style={{ color: M.inkFaint, minWidth: 24, minHeight: 24 }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button — 44px touch target */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            color: M.inkFaint,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            background: 'transparent',
            border: 'none',
            flexShrink: 0,
            cursor: isSending || isUploading || attachments.length >= 5 ? 'not-allowed' : 'pointer',
            opacity: isSending || isUploading || attachments.length >= 5 ? 0.4 : 1,
          }}
          title="Ajouter un fichier (max 5 Mo)"
          disabled={isSending || isUploading || attachments.length >= 5}
        >
          {isUploading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        {/* Text Input — fontSize 16px to prevent iOS zoom */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isSending}
            className="w-full px-3 py-2.5 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontSize: 16, /* prevents iOS auto-zoom */
              lineHeight: 1.4,
              minHeight: 44,
              maxHeight: 120,
              overflowY: 'auto',
              resize: 'none',
              background: M.inputBg,
              border: `1px solid ${M.border}`,
              color: M.ink,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
        </div>

        {/* Send Button — 44x44px */}
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && attachments.length === 0) || isSending}
          style={{
            background: M.night,
            color: M.surface,
            minWidth: 44,
            minHeight: 44,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: 'none',
            cursor: (!content.trim() && attachments.length === 0) || isSending ? 'not-allowed' : 'pointer',
            opacity: (!content.trim() && attachments.length === 0) || isSending ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
          title="Envoyer (Enter)"
        >
          {isSending ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper Text — hidden on mobile to save space */}
      <p className="hidden sm:block text-xs mt-2" style={{ color: M.inkFaint }}>
        <kbd className="px-1 py-0.5 rounded text-xs"
          style={{ background: M.muted, color: M.inkMid, border: `1px solid ${M.border}` }}>Entree</kbd>{' '}
        pour envoyer,{' '}
        <kbd className="px-1 py-0.5 rounded text-xs"
          style={{ background: M.muted, color: M.inkMid, border: `1px solid ${M.border}` }}>Maj + Entree</kbd>{' '}
        pour une nouvelle ligne
      </p>
    </div>
  )
}
