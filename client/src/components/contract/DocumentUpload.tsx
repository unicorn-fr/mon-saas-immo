import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  validateAndCompressFile,
  formatFileSize,
  getFileIcon,
} from '../../utils/fileUtils'

export interface UploadedFile {
  id?: string
  fileName: string
  fileSize: number
  mimeType: string
  file: Blob
  category: string
  status?: 'PENDING' | 'UPLOADED' | 'ERROR'
  error?: string
}

interface DocumentUploadProps {
  contractId?: string
  onFilesSelected: (files: UploadedFile[]) => void
  maxFiles?: number
  category?: string
}

export default function DocumentUpload({
  onFilesSelected,
  maxFiles = 5,
  category = 'CONTRACT',
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    setIsProcessing(true)

    const newFiles: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate and compress
      const result = await validateAndCompressFile(file)

      if ('error' in result) {
        newFiles.push({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          file: file,
          category,
          status: 'ERROR',
          error: result.error.message,
        })
      } else {
        newFiles.push({
          fileName: file.name,
          fileSize: result.blob.size,
          mimeType: file.type,
          file: result.blob,
          category,
          status: 'PENDING',
        })
      }
    }

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesSelected(updatedFiles.filter((f) => f.status !== 'ERROR'))

    // Filter and show success/error messages
    const successFiles = newFiles.filter((f) => f.status !== 'ERROR')
    const errorFiles = newFiles.filter((f) => f.status === 'ERROR')

    if (successFiles.length > 0) {
      toast.success(`${successFiles.length} fichier(s) ajouté(s) ✓`)
    }

    if (errorFiles.length > 0) {
      errorFiles.forEach((file) => {
        toast.error(`${file.fileName}: ${file.error}`)
      })
    }

    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (fileName: string) => {
    const updated = uploadedFiles.filter((f) => f.fileName !== fileName)
    setUploadedFiles(updated)
    onFilesSelected(updated.filter((f) => f.status !== 'ERROR'))
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Traitement des fichiers...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">
                  Cliquez pour ajouter des fichiers
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 5 KB par fichier · Formats: PDF, JPG, PNG, WebP, DOC, DOCX
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Size Info Bar */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Limite de taille: 5 KB</p>
          <p className="text-xs text-amber-700 mt-1">
            Les images seront automatiquement compressées. Les fichiers trop volumineux seront rejetés.
          </p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Fichiers ajoutés ({uploadedFiles.length}/{maxFiles})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.fileName}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  file.status === 'ERROR'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <span className="text-lg">{getFileIcon(file.mimeType)}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.fileSize)}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.status === 'ERROR' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}

                  <button
                    onClick={() => removeFile(file.fileName)}
                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {uploadedFiles.filter((f) => f.status !== 'ERROR').length === 0 && (
            <p className="text-xs text-gray-500 italic">
              Veuillez corriger les erreurs ci-dessus
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {uploadedFiles.length > 0 && (
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>
            {uploadedFiles.filter((f) => f.status !== 'ERROR').length} fichier(s)
            prêt(s) à envoyer
          </span>
        </div>
      )}
    </div>
  )
}
