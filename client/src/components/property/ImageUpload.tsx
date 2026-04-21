import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react'
import { useProperties } from '../../hooks/useProperties'
import { BAI } from '../../constants/bailio-tokens'

// Minimum dimensions that trigger the crop modal
const MIN_WIDTH = 800
const MIN_HEIGHT = 600
const CROP_ASPECT = 4 / 3 // output aspect ratio

// ── ImageCropModal ─────────────────────────────────────────────────────────────
interface CropModalProps {
  file: File
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

function ImageCropModal({ file, onConfirm, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  // Output canvas size (displayed crop frame)
  const FRAME_W = 480
  const FRAME_H = Math.round(FRAME_W / CROP_ASPECT)

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImgEl(img)
      // Fit image into frame by default
      const scale = Math.max(FRAME_W / img.width, FRAME_H / img.height)
      setZoom(scale)
      setOffset({ x: 0, y: 0 })
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Draw on canvas
  useEffect(() => {
    if (!imgEl || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, FRAME_W, FRAME_H)
    const w = imgEl.width * zoom
    const h = imgEl.height * zoom
    const x = (FRAME_W - w) / 2 + offset.x
    const y = (FRAME_H - h) / 2 + offset.y
    ctx.drawImage(imgEl, x, y, w, h)
  }, [imgEl, zoom, offset])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    })
  }
  const handleMouseUp = () => setDragging(false)

  const handleReset = () => {
    if (!imgEl) return
    const scale = Math.max(FRAME_W / imgEl.width, FRAME_H / imgEl.height)
    setZoom(scale)
    setOffset({ x: 0, y: 0 })
  }

  const handleConfirm = () => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
      onConfirm(croppedFile)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div
        className="rounded-2xl max-w-xl w-full"
        style={{ background: BAI.bgSurface, boxShadow: '0 8px 32px rgba(13,12,10,0.16)' }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: BAI.border }}>
          <h3 className="text-base font-semibold" style={{ color: BAI.ink }}>Recadrer l'image</h3>
          <p className="text-sm mt-0.5" style={{ color: BAI.inkMid }}>
            L'image est trop petite — recadrez-la pour un rendu optimal (ratio 4:3)
          </p>
        </div>

        {/* Canvas crop area */}
        <div className="p-5">
          <div
            className="relative overflow-hidden rounded-xl mx-auto"
            style={{ width: FRAME_W, height: FRAME_H, background: '#111', cursor: dragging ? 'grabbing' : 'grab', maxWidth: '100%' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={FRAME_W}
              height={FRAME_H}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
            {/* crop guide overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ border: '2px solid rgba(255,255,255,0.5)', borderRadius: 10 }} />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.2))}
              className="p-2 rounded-lg border transition-colors"
              style={{ borderColor: BAI.border, color: BAI.inkMid }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={20}
              max={400}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
              className="flex-1 accent-[#1a1a2e]"
            />
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.1, 4))}
              className="p-2 rounded-lg border transition-colors"
              style={{ borderColor: BAI.border, color: BAI.inkMid }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg border transition-colors ml-1"
              style={{ borderColor: BAI.border, color: BAI.inkMid }}
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: BAI.inkFaint }}>
            Glissez pour repositionner · zoom {Math.round(zoom * 100)}%
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="btn btn-secondary flex-1"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmer le recadrage
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ImageUpload ────────────────────────────────────────────────────────────────
interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export const ImageUpload = ({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) => {
  const { uploadImages, isUploadingImages } = useProperties()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Queue of files awaiting crop confirmation
  const [cropQueue, setCropQueue] = useState<File[]>([])
  // Files already approved (cropped or passed dimension check)
  const pendingUpload = useRef<File[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const checkDimensions = (file: File): Promise<boolean> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false) }
      img.src = url
    })

  const doUpload = async (files: File[]) => {
    if (files.length === 0) return
    try {
      const urls = await uploadImages(files)
      onImagesChange([...images, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)

    const fileArray = Array.from(files)

    // Number check
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`)
      return
    }

    // Type + size filter
    const invalid: string[] = []
    const valid: File[] = []
    for (const f of fileArray) {
      if (!f.type.startsWith('image/')) { invalid.push(`${f.name} n'est pas une image`); continue }
      if (f.size > 10 * 1024 * 1024) { invalid.push(`${f.name} dépasse 10 Mo`); continue }
      valid.push(f)
    }
    if (invalid.length > 0) { setError(invalid.join(' · ')); return }
    if (valid.length === 0) return

    // Dimension check — images below threshold go to crop queue
    const toUpload: File[] = []
    const toCrop: File[] = []
    for (const f of valid) {
      const ok = await checkDimensions(f)
      if (ok) toUpload.push(f)
      else toCrop.push(f)
    }

    pendingUpload.current = toUpload
    if (toCrop.length > 0) {
      setCropQueue(toCrop)
    } else {
      await doUpload(toUpload)
      pendingUpload.current = []
    }
  }

  // Called when user confirms crop for cropQueue[0]
  const handleCropConfirm = async (croppedFile: File) => {
    pendingUpload.current = [...pendingUpload.current, croppedFile]
    const remaining = cropQueue.slice(1)
    setCropQueue(remaining)
    if (remaining.length === 0) {
      await doUpload(pendingUpload.current)
      pendingUpload.current = []
    }
  }

  const handleCropCancel = () => {
    // Skip this image, move to next
    const remaining = cropQueue.slice(1)
    setCropQueue(remaining)
    if (remaining.length === 0 && pendingUpload.current.length > 0) {
      doUpload(pendingUpload.current)
      pendingUpload.current = []
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    await handleFiles(e.dataTransfer.files)
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    await handleFiles(e.target.files)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const next = [...images]
    const [removed] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, removed)
    onImagesChange(next)
  }

  return (
    <div>
      {/* Crop Modal */}
      {cropQueue.length > 0 && (
        <ImageCropModal
          file={cropQueue[0]}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isUploadingImages ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={dragActive ? { borderColor: BAI.night, background: '#eaf0fb' } : { borderColor: BAI.borderStrong }}
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
          className={`cursor-pointer block ${images.length >= maxImages ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: BAI.inkFaint }} />
          <p className="text-base font-medium mb-1" style={{ color: BAI.ink }}>
            {isUploadingImages ? 'Upload en cours…' : 'Glissez vos images ici ou cliquez pour sélectionner'}
          </p>
          <p className="text-sm" style={{ color: BAI.inkMid }}>
            JPG, PNG, WebP — max 10 Mo · {images.length}/{maxImages} images
          </p>
          <p className="text-xs mt-1" style={{ color: BAI.inkFaint }}>
            Dimensions recommandées : 1200 × 900 px minimum
          </p>
        </label>

        {isUploadingImages && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.8)' }}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: BAI.night }} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 rounded-xl" style={{ background: BAI.errorLight, border: '1px solid #fca5a5' }}>
          <p className="text-sm" style={{ color: BAI.error }}>{error}</p>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-[4/3] rounded-xl overflow-hidden"
              style={{ background: BAI.bgMuted }}
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-1.5">
                <button
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full"
                  style={{ background: BAI.error, color: '#fff' }}
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: '#fff', color: BAI.ink }}
                    title="Vers la gauche"
                  >←</button>
                )}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: '#fff', color: BAI.ink }}
                    title="Vers la droite"
                  >→</button>
                )}
              </div>

              {index === 0 && (
                <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: BAI.night, color: '#fff' }}>
                  Principale
                </div>
              )}
              <div className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="mt-3 text-sm" style={{ color: BAI.inkMid }}>
          <ImageIcon className="w-4 h-4 inline mr-1" />
          La première image est l'image principale. Utilisez les flèches pour réorganiser.
        </p>
      )}
    </div>
  )
}
