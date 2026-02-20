import { useRef, useState, useEffect, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { X, Eraser, PenTool } from 'lucide-react'

interface SignaturePadProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signatureBase64: string) => void
  signerName: string
}

export const SignaturePad = ({
  isOpen,
  onClose,
  onConfirm,
  signerName,
}: SignaturePadProps) => {
  const sigPad = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 450, height: 200 })

  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCanvasSize({ width: Math.floor(rect.width), height: 200 })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Wait for modal to render then measure container
      const timer = setTimeout(updateCanvasSize, 50)
      window.addEventListener('resize', updateCanvasSize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateCanvasSize)
      }
    }
  }, [isOpen, updateCanvasSize])

  const handleClear = () => {
    sigPad.current?.clear()
    setError('')
  }

  const handleClose = () => {
    sigPad.current?.clear()
    setAccepted(false)
    setError('')
    onClose()
  }

  const handleConfirm = () => {
    if (!accepted) {
      setError('Vous devez cocher "Lu et approuve" pour signer')
      return
    }

    if (!sigPad.current || sigPad.current.isEmpty()) {
      setError('Veuillez dessiner votre signature')
      return
    }

    const base64 = sigPad.current
      .getTrimmedCanvas()
      .toDataURL('image/png')

    if (base64) {
      setAccepted(false)
      setError('')
      onConfirm(base64)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Signer le contrat</h2>
            <p className="text-sm text-gray-600 mt-1">Signature de {signerName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal text + checkbox */}
        <div className="px-6 pt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              En signant electroniquement ce document, je declare avoir lu l'integralite du contrat
              et en accepter toutes les clauses et conditions. Cette signature a valeur d'engagement
              contractuel conformement au reglement eIDAS (UE 910/2014).
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                if (e.target.checked) setError('')
              }}
              className="mt-0.5 h-5 w-5 text-primary-600 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-900">
              Lu et approuve - Bon pour accord
            </span>
          </label>
        </div>

        {/* Signature canvas */}
        <div className="p-6" ref={containerRef}>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
            <SignatureCanvas
              ref={sigPad}
              penColor="black"
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                style: {
                  width: '100%',
                  height: '200px',
                  borderRadius: '0.5rem',
                },
              }}
              onBegin={() => setError('')}
            />
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-300 pointer-events-none">
              Signez dans cette zone
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t">
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Eraser className="w-4 h-4" />
            Effacer
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn btn-primary flex items-center gap-2 ${!accepted ? 'opacity-60' : ''}`}
          >
            <PenTool className="w-4 h-4" />
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  )
}
