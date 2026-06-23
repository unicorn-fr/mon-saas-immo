import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useFaceApi } from '../../hooks/useFaceApi'
import { apiClient } from '../../services/api.service'

interface DocumentCaptureProps {
  onComplete: (data: { firstName: string; lastName: string }) => void
}

type DocType = 'CNI' | 'PERMIS_CONDUIRE'
type StepState = 'upload' | 'embedding' | 'uploading' | 'done' | 'error'

export function DocumentCapture({ onComplete }: DocumentCaptureProps) {
  const [docType, setDocType] = useState<DocType>('CNI')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [idImageEl, setIdImageEl] = useState<HTMLImageElement | null>(null)
  const [step, setStep] = useState<StepState>('upload')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ firstName: string; lastName: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isLoaded, isLoading: modelsLoading, extractEmbedding } = useFaceApi()

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setError(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
    // Créer l'élément image pour face-api
    const img = new Image()
    img.src = url
    img.onload = () => setIdImageEl(img)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !idImageEl) return
    setError(null)

    // 1. Extraire l'embedding facial de la pièce d'identité (client-side)
    setStep('embedding')
    let embedding: number[] | null = null
    if (isLoaded) {
      embedding = await extractEmbedding(idImageEl)
      if (!embedding) {
        setError('Aucun visage détecté sur la pièce d\'identité. Assurez-vous que la photo est bien visible.')
        setStep('upload')
        return
      }
    }

    // 2. Envoyer au serveur (fichier + embedding)
    setStep('uploading')
    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', docType)
    if (embedding) formData.append('faceEmbedding', JSON.stringify(embedding))

    try {
      const res = await apiClient.post('/kyc/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { firstName, lastName } = res.data.data as { firstName: string; lastName: string; documentDeleted?: boolean }
      setResult({ firstName, lastName })
      setStep('done')
      // Libérer l'URL du preview
      if (preview) URL.revokeObjectURL(preview)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors de l\'analyse'
      setError(msg)
      setStep('upload')
    }
  }

  if (step === 'done' && result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: BAI.tenantLight, border: `2px solid ${BAI.tenantBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle size={32} color={BAI.tenant} />
        </div>
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 24, color: BAI.ink, margin: '0 0 8px',
        }}>
          Document vérifié
        </h3>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: BAI.inkMid, margin: '0 0 4px' }}>
          {result.firstName} {result.lastName}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
          borderRadius: 8, padding: '6px 12px', marginTop: 12,
        }}>
          <Trash2 size={13} color={BAI.tenant} />
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.tenant, fontWeight: 600 }}>
            Fichier supprimé du serveur (RGPD)
          </span>
        </div>
        <div style={{ marginTop: 28 }}>
          <button
            onClick={() => onComplete(result)}
            style={{
              background: BAI.night, color: '#fff', border: 'none',
              borderRadius: 8, padding: '13px 28px',
              fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            Continuer →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{
        fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
        fontSize: 24, color: BAI.ink, margin: '0 0 6px',
      }}>
        Votre pièce d'identité
      </h3>
      <p style={{
        fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid,
        margin: '0 0 24px', lineHeight: 1.6,
      }}>
        Le fichier est analysé puis immédiatement supprimé. Seules les données textuelles sont conservées.
      </p>

      {/* Sélecteur type document */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {(['CNI', 'PERMIS_CONDUIRE'] as DocType[]).map(type => (
          <button
            key={type}
            onClick={() => setDocType(type)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              border: `2px solid ${docType === type ? BAI.night : BAI.border}`,
              background: docType === type ? BAI.night : BAI.bgSurface,
              color: docType === type ? '#fff' : BAI.inkMid,
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {type === 'CNI' ? '🪪 Carte Nationale d\'Identité' : '🚗 Permis de conduire'}
          </button>
        ))}
      </div>

      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${file ? BAI.tenant : BAI.border}`,
          borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
          background: file ? BAI.tenantLight : BAI.bgMuted,
          transition: 'all 0.2s',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Apercu document"
            style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
          />
        ) : (
          <>
            <Upload size={36} color={BAI.inkFaint} style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: BAI.ink, fontWeight: 600, margin: '0 0 4px' }}>
              Déposez votre document ici
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
              JPG, PNG, WebP ou PDF — max 10 MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {error && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          background: BAI.errorLight, border: '1px solid #fca5a5',
          borderRadius: 8, padding: '10px 14px', marginTop: 12,
        }}>
          <AlertTriangle size={16} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{error}</p>
        </div>
      )}

      {modelsLoading && (
        <p style={{
          fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint,
          textAlign: 'center', marginTop: 12,
        }}>
          Chargement des modèles IA de reconnaissance faciale…
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || step === 'uploading' || step === 'embedding'}
        style={{
          width: '100%', marginTop: 20,
          background: (!file || step !== 'upload') ? BAI.border : BAI.night,
          color: (!file || step !== 'upload') ? BAI.inkFaint : '#fff',
          border: 'none', borderRadius: 8, padding: '14px',
          fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
          cursor: (!file || step !== 'upload') ? 'default' : 'pointer',
        }}
      >
        {step === 'embedding' ? 'Analyse du visage…' :
         step === 'uploading' ? 'Analyse en cours, fichier en suppression…' :
         'Analyser le document'}
      </button>

      <p style={{
        fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint,
        textAlign: 'center', marginTop: 10, lineHeight: 1.5,
      }}>
        Conformité RGPD — Le fichier est supprimé immédiatement après extraction des données textuelles.
      </p>
    </div>
  )
}
