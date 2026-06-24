import { useState, useRef, useCallback } from 'react'
import {
  Upload, CheckCircle, AlertTriangle, Trash2, Camera,
  ScanLine, FileX, RotateCcw, ChevronRight,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useFaceApi } from '../../hooks/useFaceApi'
import { useDocumentOCR } from '../../hooks/useDocumentOCR'
import type { ExtractedDocument } from '../../hooks/useDocumentOCR'
import { apiClient } from '../../services/api.service'

interface DocumentCaptureProps {
  onComplete: (data: { firstName: string; lastName: string }) => void
}

type DocType = 'CNI' | 'PERMIS_CONDUIRE'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const REJECTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
  'application/msword': 'Word (.doc)',
  'application/vnd.oasis.opendocument.text': 'ODT',
  'text/plain': 'Fichier texte',
}

// ─── Field display config ─────────────────────────────────────────────────────

const FIELD_ICONS: Record<string, string> = {
  lastName: '👤',
  firstName: '👤',
  birthDate: '📅',
  documentNumber: '🔢',
  nationality: '🌍',
  documentExpiry: '📆',
  mrzValid: '✅',
  birthPlace: '📍',
  sex: '⚧',
  issuedDate: '📅',
  licenseCategories: '🚗',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{
      height: 4, background: BAI.bgMuted, borderRadius: 4, overflow: 'hidden', marginTop: 10,
    }}>
      <div style={{
        height: '100%', width: `${value}%`, background: BAI.night,
        borderRadius: 4, transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

function FieldBadge({ label, icon, found }: { label: string; icon: string; found: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', borderRadius: 8,
      background: found ? BAI.tenantLight : '#fff',
      border: `1px solid ${found ? BAI.tenantBorder : '#fca5a5'}`,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: found ? BAI.tenant : BAI.error, fontWeight: 600 }}>
        {label}
      </span>
      {found
        ? <CheckCircle size={12} color={BAI.tenant} />
        : <AlertTriangle size={12} color={BAI.error} />
      }
    </div>
  )
}

function ExtractedValue({ label, value }: { label: string; value: string | number | boolean | string[] }) {
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  if (!display || display === 'false') return null
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'baseline',
      padding: '6px 0', borderBottom: `1px solid ${BAI.border}`,
    }}>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, minWidth: 130 }}>
        {label}
      </span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, fontWeight: 600 }}>
        {display}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentCapture({ onComplete }: DocumentCaptureProps) {
  const [docType, setDocType] = useState<DocType>('CNI')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [idImageEl, setIdImageEl] = useState<HTMLImageElement | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isLoaded: faceApiLoaded, extractEmbedding } = useFaceApi()
  const { isProcessing, progress, stage, result, error: ocrError, analyzeDocument, FIELD_LABELS } = useDocumentOCR()

  const hasResult = !!result

  const handleFile = useCallback((f: File) => {
    setFormatError(null)
    setExtracted(null)
    setUploadStep('idle')
    setUploadError(null)

    // Reject non-image types with clear message
    const rejectedLabel = REJECTED_TYPES[f.type]
    if (rejectedLabel || !ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setFormatError(
        rejectedLabel
          ? `Les fichiers ${rejectedLabel} ne permettent pas la reconnaissance automatique. ` +
            `Veuillez prendre une photo JPG, PNG ou WebP de votre document d'identité.`
          : `Format non reconnu (${f.type || 'inconnu'}). Utilisez une photo JPG, PNG ou WebP.`
      )
      return
    }

    if (f.size > 10 * 1024 * 1024) {
      setFormatError('Fichier trop volumineux (max 10 Mo). Compressez votre image.')
      return
    }

    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)

    const img = new Image()
    img.src = url
    img.onload = () => setIdImageEl(img)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) return
    const res = await analyzeDocument(file, docType)
    if (res) setExtracted(res)
  }

  const handleSubmit = async () => {
    if (!file || !extracted) return
    setUploadStep('uploading')
    setUploadError(null)

    // Extract face embedding from document photo (optionnel)
    let embedding: number[] | null = null
    if (faceApiLoaded && idImageEl) {
      embedding = await extractEmbedding(idImageEl)
    }

    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', docType)
    formData.append('extractedData', JSON.stringify(extracted))
    if (embedding) formData.append('faceEmbedding', JSON.stringify(embedding))

    try {
      const res = await apiClient.post('/kyc/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = res.data.data as { firstName?: string; lastName?: string }
      setUploadStep('done')
      if (preview) URL.revokeObjectURL(preview)
      onComplete({
        firstName: data.firstName || extracted.firstName || '',
        lastName: data.lastName || extracted.lastName || '',
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'Erreur lors de l\'envoi. Réessayez.'
      setUploadError(msg)
      setUploadStep('error')
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setIdImageEl(null)
    setExtracted(null)
    setFormatError(null)
    setUploadStep('idle')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Render states ──────────────────────────────────────────────────────────

  return (
    <div>
      <h3 style={{
        fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
        fontSize: 24, color: BAI.ink, margin: '0 0 6px',
      }}>
        Votre pièce d'identité
      </h3>
      <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 20px', lineHeight: 1.6 }}>
        Fournissez une <strong>photo nette</strong> de votre document. Le fichier est analysé puis immédiatement supprimé (RGPD).
      </p>

      {/* Document type selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {(['CNI', 'PERMIS_CONDUIRE'] as DocType[]).map(type => (
          <button
            key={type}
            onClick={() => { setDocType(type); handleReset() }}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8,
              border: `2px solid ${docType === type ? BAI.night : BAI.border}`,
              background: docType === type ? BAI.night : BAI.bgSurface,
              color: docType === type ? '#fff' : BAI.inkMid,
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {type === 'CNI' ? '🪪 Carte Nationale d\'Identité' : '🚗 Permis de conduire'}
          </button>
        ))}
      </div>

      {/* Format error */}
      {formatError && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: '#fff5f5', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '12px 14px', marginBottom: 16,
        }}>
          <FileX size={18} color={BAI.error} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: '0 0 6px', fontWeight: 700 }}>
              Format non supporté
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0, lineHeight: 1.5 }}>
              {formatError}
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${BAI.border}`, borderRadius: 12,
            padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            background: BAI.bgMuted, transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.night)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
        >
          <Camera size={40} color={BAI.inkFaint} style={{ marginBottom: 14 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 15, color: BAI.ink, fontWeight: 600, margin: '0 0 6px' }}>
            Déposez votre document ici ou cliquez pour choisir
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
            Photo JPG, PNG ou WebP — max 10 Mo
          </p>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, marginTop: 8, fontWeight: 600,
          }}>
            ✗ PDF, Word, Excel non acceptés — photo obligatoire
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* Preview + OCR panel */}
      {file && (
        <div>
          {/* Image preview */}
          <div style={{
            position: 'relative', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${BAI.border}`, marginBottom: 16,
          }}>
            {preview && (
              <img
                src={preview}
                alt="Aperçu du document"
                style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', background: BAI.bgMuted }}
              />
            )}
            {/* Reset button */}
            <button
              onClick={handleReset}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.5)', border: 'none',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: '#fff', fontFamily: BAI.fontBody, fontSize: 12,
              }}
            >
              <RotateCcw size={12} /> Changer
            </button>
          </div>

          {/* OCR trigger */}
          {!hasResult && !isProcessing && !ocrError && (
            <button
              onClick={handleAnalyze}
              style={{
                width: '100%', padding: '13px',
                background: BAI.night, color: '#fff', border: 'none',
                borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600,
                fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <ScanLine size={18} />
              Analyser le document
            </button>
          )}

          {/* OCR progress */}
          {isProcessing && (
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>{stage}</span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.night, fontWeight: 700 }}>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {/* OCR error (format) */}
          {ocrError && !isProcessing && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fca5a5',
              borderRadius: 10, padding: '12px 14px', marginTop: 8,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <FileX size={16} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0, lineHeight: 1.5 }}>
                  {ocrError}
                </p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  marginTop: 10, width: '100%', padding: '10px',
                  background: BAI.error, color: '#fff', border: 'none',
                  borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Essayer avec une autre photo
              </button>
            </div>
          )}

          {/* OCR results */}
          {result && !isProcessing && (
            <div style={{ marginTop: 16 }}>

              {/* Validation score banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                background: result.isValid ? BAI.tenantLight : '#fff5f5',
                border: `1px solid ${result.isValid ? BAI.tenantBorder : '#fca5a5'}`,
              }}>
                {result.isValid
                  ? <CheckCircle size={20} color={BAI.tenant} />
                  : <AlertTriangle size={20} color={BAI.error} />
                }
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 700, margin: 0,
                    color: result.isValid ? BAI.tenant : BAI.error }}>
                    {result.isValid
                      ? `Document reconnu — ${Math.round(result.validationScore * 100)}% des champs extraits`
                      : `Document insuffisamment reconnu (${Math.round(result.validationScore * 100)}%)`
                    }
                  </p>
                  {!result.isValid && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: '2px 0 0' }}>
                      Prenez une photo plus nette, bien éclairée, sans reflet.
                    </p>
                  )}
                </div>
              </div>

              {/* Field validation badges */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: BAI.inkFaint, margin: '0 0 10px' }}>
                  Champs détectés
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[...result.validFields, ...result.missingFields].map(field => (
                    <FieldBadge
                      key={field}
                      label={FIELD_LABELS[field] || field}
                      icon={FIELD_ICONS[field] || '📋'}
                      found={result.validFields.includes(field)}
                    />
                  ))}
                </div>
              </div>

              {/* Extracted values display */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: BAI.inkFaint, margin: '0 0 10px' }}>
                  Informations extraites
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {result.lastName && <ExtractedValue label="Nom" value={result.lastName} />}
                  {result.firstName && <ExtractedValue label="Prénom(s)" value={result.firstName} />}
                  {result.birthDate && <ExtractedValue label="Date de naissance" value={result.birthDate} />}
                  {result.birthPlace && <ExtractedValue label="Lieu de naissance" value={result.birthPlace} />}
                  {result.documentNumber && <ExtractedValue label="N° de document" value={result.documentNumber} />}
                  {result.documentExpiry && <ExtractedValue label="Valable jusqu'au" value={result.documentExpiry} />}
                  {result.nationality && <ExtractedValue label="Nationalité" value={result.nationality} />}
                  {result.mrzValid && <ExtractedValue label="Zone MRZ" value="✓ Validée" />}
                  {result.licenseCategories && result.licenseCategories.length > 0 && (
                    <ExtractedValue label="Catégories" value={result.licenseCategories} />
                  )}
                </div>
              </div>

              {/* Retry if failed */}
              {!result.isValid && (
                <button
                  onClick={handleReset}
                  style={{
                    width: '100%', padding: '12px',
                    background: BAI.bgMuted, color: BAI.ink,
                    border: `1px solid ${BAI.border}`, borderRadius: 8,
                    fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', marginBottom: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <RotateCcw size={16} /> Reprendre avec une meilleure photo
                </button>
              )}

              {/* RGPD notice */}
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                background: BAI.bgMuted, borderRadius: 8, padding: '8px 12px', marginBottom: 16,
              }}>
                <Trash2 size={13} color={BAI.inkFaint} />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, lineHeight: 1.4 }}>
                  La photo est supprimée immédiatement après envoi. Seules les données textuelles sont conservées (chiffrées AES-256).
                </span>
              </div>

              {/* Submit */}
              {uploadStep === 'error' && uploadError && (
                <div style={{
                  display: 'flex', gap: 8, background: '#fff5f5',
                  border: '1px solid #fca5a5', borderRadius: 8,
                  padding: '10px 12px', marginBottom: 12,
                }}>
                  <AlertTriangle size={14} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{uploadError}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={uploadStep === 'uploading'}
                style={{
                  width: '100%', padding: '14px',
                  background: uploadStep === 'uploading'
                    ? BAI.inkFaint
                    : result.isValid ? BAI.night : BAI.inkMid,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15,
                  cursor: uploadStep === 'uploading' ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (!result.isValid && uploadStep !== 'uploading') ? 0.7 : 1,
                }}
              >
                {uploadStep === 'uploading' ? (
                  <>
                    <Upload size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    {result.isValid ? <CheckCircle size={16} /> : <ChevronRight size={16} />}
                    {result.isValid ? 'Confirmer et continuer' : 'Continuer malgré tout'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {!file && (
        <div style={{ marginTop: 20, padding: '12px 14px', background: BAI.bgMuted, borderRadius: 10 }}>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.ink, margin: '0 0 8px',
            letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Conseils pour une bonne reconnaissance
          </p>
          <ul style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Photographiez sur fond sombre, bien éclairé</li>
            <li>Document entier visible, pas de coins coupés</li>
            <li>Évitez les reflets et l'ombre sur le document</li>
            <li>Résolution minimale recommandée : 1 MP</li>
            {docType === 'CNI' && <li>Incluez le recto ET le verso si possible (zone MRZ)</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
