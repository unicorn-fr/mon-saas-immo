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
      .getCanvas()
      .toDataURL('image/png')

    if (base64) {
      setAccepted(false)
      setError('')
      onConfirm(base64)
    }
  }

  if (!isOpen) return null

  const font = "'DM Sans', system-ui, sans-serif"

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(13,12,10,0.55)',
        display: 'flex', alignItems: 'flex-end',
        fontFamily: font,
      }}
      className="sm:items-center sm:justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: 560,
          /* Bottom sheet sur mobile, modal centré sur sm+ */
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 40px rgba(13,12,10,0.18)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '95dvh', overflowY: 'auto',
        }}
        className="sm:rounded-2xl sm:shadow-2xl"
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e4e1db' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e4e1db' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontStyle: 'italic', fontSize: 22, color: '#0d0c0a', margin: 0 }}>
              Signer
            </h2>
            <p style={{ fontSize: 13, color: '#5a5754', margin: '2px 0 0' }}>
              {signerName}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              minWidth: 44, minHeight: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a5754',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f4f2ee')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal text + checkbox */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ borderRadius: 10, padding: '12px 14px', marginBottom: 14, background: '#f4f2ee', border: '1px solid #e4e1db' }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#5a5754', margin: 0 }}>
              En signant electroniquement ce document, je declare avoir lu l'integralite du contrat
              et en accepter toutes les clauses. Cette signature a valeur contractuelle (eIDAS UE 910/2014).
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', minHeight: 44 }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                if (e.target.checked) setError('')
              }}
              style={{ width: 20, height: 20, accentColor: '#1a1a2e', flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0d0c0a' }}>
              Lu et approuvé — Bon pour accord
            </span>
          </label>
        </div>

        {/* Signature canvas */}
        <div style={{ padding: '0 20px 16px' }} ref={containerRef}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9e9b96', marginBottom: 8 }}>
            Votre signature
          </p>
          <div style={{ border: '2px dashed #ccc9c3', borderRadius: 12, background: '#fafaf8', position: 'relative', overflow: 'hidden' }}>
            <SignatureCanvas
              ref={sigPad}
              penColor="black"
              minWidth={1.5}
              maxWidth={3}
              canvasProps={{
                width: canvasSize.width,
                height: 240,
                style: {
                  width: '100%',
                  height: '240px',
                  display: 'block',
                  touchAction: 'none',
                },
              }}
              onBegin={() => setError('')}
            />
            <p style={{
              position: 'absolute', bottom: 8, left: 0, right: 0,
              textAlign: 'center', fontSize: 11, color: '#9e9b96',
              pointerEvents: 'none',
            }}>
              Tracez votre signature ici
            </p>
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#9b1c1c', marginTop: 8 }}>{error}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 20px 20px',
          borderTop: '1px solid #e4e1db',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0 16px', minHeight: 44, borderRadius: 10,
              background: '#f4f2ee', border: '1px solid #e4e1db',
              color: '#5a5754', fontFamily: font, fontWeight: 500, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Eraser className="w-4 h-4" />
            Effacer
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '0 16px', minHeight: 44, borderRadius: 10,
              background: 'transparent', border: '1px solid #e4e1db',
              color: '#5a5754', fontFamily: font, fontWeight: 500, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0 20px', minHeight: 44, borderRadius: 10,
              background: '#1a1a2e', color: '#ffffff',
              fontFamily: font, fontWeight: 600, fontSize: 14,
              border: 'none', cursor: 'pointer',
              opacity: accepted ? 1 : 0.5,
            }}
          >
            <PenTool className="w-4 h-4" />
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
