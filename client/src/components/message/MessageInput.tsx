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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="p-4 bg-white border-t">
      {/* Upload Error */}
      {uploadError && (
        <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
            >
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 max-w-[150px] truncate">{attachment.name}</span>
              <span className="text-gray-400 text-xs">({formatFileSize(attachment.size)})</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-600 ml-1"
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
        {/* Attachment Button */}
        <div className="flex items-center pb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Ajouter un fichier (max 5 Mo)"
            disabled={isSending || isUploading || attachments.length >= 5}
          >
            {isUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isSending}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '42px',
              maxHeight: '120px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && attachments.length === 0) || isSending}
          className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Envoyer (Enter)"
        >
          {isSending ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Entree</kbd> pour envoyer,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Maj + Entree</kbd> pour une
        nouvelle ligne
      </p>
    </div>
  )
}
