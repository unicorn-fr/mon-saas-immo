import { useRef, useState } from 'react'
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
  const [error, setError] = useState('')

  const handleClear = () => {
    sigPad.current?.clear()
    setError('')
  }

  const handleConfirm = () => {
    if (sigPad.current?.isEmpty()) {
      setError('Veuillez dessiner votre signature')
      return
    }

    const base64 = sigPad.current
      ?.getTrimmedCanvas()
      .toDataURL('image/png')

    if (base64) {
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
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signature canvas */}
        <div className="p-6">
          <SignatureCanvas
            ref={sigPad}
            penColor="black"
            canvasProps={{
              className: 'border rounded bg-white w-full h-64',
            }}
            onBegin={() => setError('')}
          />
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
            onClick={onClose}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  )
}
