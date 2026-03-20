import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export const ImageUpload = ({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) => {
  const { uploadImages, isUploadingImages } = useProperties()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    // Check total number
    if (images.length + files.length > maxImages) {
      errors.push(`Maximum ${maxImages} images autorisées`)
      return { valid, errors }
    }

    files.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} n'est pas une image`)
        return
      }

      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} est trop volumineux (max 5MB)`)
        return
      }

      valid.push(file)
    })

    return { valid, errors }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    const fileArray = Array.from(files)

    const { valid, errors } = validateFiles(fileArray)

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    if (valid.length === 0) return

    try {
      const urls = await uploadImages(valid)
      onImagesChange([...images, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const { files } = e.dataTransfer
      await handleFiles(files)
    },
    [images] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    await handleFiles(e.target.files)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onImagesChange(newImages)
  }

  return (
    <div>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isUploadingImages ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={
          dragActive
            ? { borderColor: '#1a1a2e', background: '#eaf0fb' }
            : { borderColor: '#ccc9c3' }
        }
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleChange}
          disabled={isUploadingImages || images.length >= maxImages}
          className="hidden"
        />

        <label
          htmlFor="image-upload"
          className={`cursor-pointer ${
            images.length >= maxImages ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: '#9e9b96' }} />
          <p className="text-lg font-medium mb-2" style={{ color: '#0d0c0a' }}>
            {isUploadingImages
              ? 'Upload en cours...'
              : 'Glissez vos images ici ou cliquez pour sélectionner'}
          </p>
          <p className="text-sm" style={{ color: '#5a5754' }}>
            PNG, JPG, WebP jusqu'à 5MB • Maximum {maxImages} images
          </p>
          <p className="text-sm mt-2" style={{ color: '#9e9b96' }}>
            {images.length}/{maxImages} images uploadées
          </p>
        </label>

        {isUploadingImages && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.75)' }}
          >
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: '#1a1a2e' }}
            ></div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="mt-3 p-3 rounded-xl"
          style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}
        >
          <p className="text-sm" style={{ color: '#9b1c1c' }}>{error}</p>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl overflow-hidden"
              style={{ background: '#f4f2ee' }}
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.jpg'
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full"
                  style={{ background: '#9b1c1c', color: '#ffffff' }}
                  title="Supprimer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Move left */}
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full"
                    style={{ background: '#ffffff', color: '#0d0c0a' }}
                    title="Déplacer à gauche"
                  >
                    ←
                  </button>
                )}

                {/* Move right */}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full"
                    style={{ background: '#ffffff', color: '#0d0c0a' }}
                    title="Déplacer à droite"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Main image badge */}
              {index === 0 && (
                <div
                  className="absolute top-2 left-2 text-xs px-2 py-1 rounded"
                  style={{ background: '#1a1a2e', color: '#ffffff' }}
                >
                  Image principale
                </div>
              )}

              {/* Number badge */}
              <div
                className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#ffffff' }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {images.length > 0 && (
        <p className="mt-3 text-sm" style={{ color: '#5a5754' }}>
          <ImageIcon className="w-4 h-4 inline mr-1" />
          La première image sera utilisée comme image principale. Glissez pour réorganiser.
        </p>
      )}
    </div>
  )
}
