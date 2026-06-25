import { useState, useRef, useCallback } from 'react'
import {
  Upload, CheckCircle, AlertTriangle, Trash2, Camera,
  ScanLine, FileX, RotateCcw, ChevronRight, Folder,
} from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { useFaceApi } from '../../hooks/useFaceApi'
import { useDocumentOCR } from '../../hooks/useDocumentOCR'
import type { ExtractedDocument } from '../../hooks/useDocumentOCR'
import { LiveDocumentScanner } from './LiveDocumentScanner'
import { apiClient } from '../../services/api.service'

interface DocumentCaptureProps {
  onComplete: (data: { firstName: string; lastName: string }) => void
}

type DocType = 'CNI' | 'PERMIS_CONDUIRE'
type InputMode = 'choose' | 'scan' | 'upload'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const REJECTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
  'application/msword': 'Word (.doc)',
  'application/vnd.oasis.opendocument.text': 'ODT',
  'text/plain': 'Fichier texte',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
}

const FIELD_ICONS: Record<string, string> = {
  lastName: '👤', firstName: '👤', birthDate: '📅', documentNumber: '🔢',
  nationality: '🌍', documentExpiry: '📆', mrzValid: '✅',
  birthPlace: '📍', sex: '⚧', issuedDate: '📅', licenseCategories: '🚗',
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 4, background: BAI.bgMuted, borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
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
      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8,
      background: found ? BAI.tenantLight : '#fff5f5',
      border: `1px solid ${found ? BAI.tenantBorder : '#fca5a5'}`,
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: found ? BAI.tenant : BAI.error, fontWeight: 600 }}>
        {label}
      </span>
      {found ? <CheckCircle size={11} color={BAI.tenant} /> : <AlertTriangle size={11} color={BAI.error} />}
    </div>
  )
}

function ExtractedValue({ label, value }: { label: string; value: string | number | boolean | string[] }) {
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  if (!display || display === 'false') return null
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: `1px solid ${BAI.border}` }}>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, minWidth: 140 }}>{label}</span>
      <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.ink, fontWeight: 600 }}>{display}</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DocumentCapture({ onComplete }: DocumentCaptureProps) {
  const [docType, setDocType] = useState<DocType>('CNI')
  const [inputMode, setInputMode] = useState<InputMode>('choose')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [idImageEl, setIdImageEl] = useState<HTMLImageElement | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedDocument | null>(null)
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isLoaded: faceApiLoaded, extractEmbedding } = useFaceApi()
  const { isProcessing, progress, stage, result, error: ocrError, analyzeDocument, reset: resetOCR, FIELD_LABELS } = useDocumentOCR()

  // ─── Reset all state ─────────────────────────────────────────────────────────

  const fullReset = useCallback((keepMode?: InputMode) => {
    setFile(null)
    setPreview(null)
    setIdImageEl(null)
    setFormatError(null)
    setExtracted(null)
    setUploadStep('idle')
    setUploadError(null)
    resetOCR() // ← clé du fix : réinitialise aussi le result du hook
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (keepMode !== undefined) setInputMode(keepMode)
    else setInputMode('choose')
  }, [resetOCR])

  // ─── File handling ───────────────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    resetOCR() // reset hook result AVANT d'accepter le nouveau fichier
    setFormatError(null)
    setExtracted(null)
    setUploadStep('idle')
    setUploadError(null)

    const rejectedLabel = REJECTED_TYPES[f.type]
    if (rejectedLabel || !ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      setFormatError(
        rejectedLabel
          ? `Les fichiers ${rejectedLabel} ne permettent pas la reconnaissance automatique.\n` +
            `Prenez une photo JPG/PNG/WebP de votre document.`
          : `Format "${f.type || 'inconnu'}" non supporté. Utilisez une photo JPG, PNG ou WebP.`
      )
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFormatError('Fichier trop volumineux (max 10 Mo).')
      return
    }

    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    const img = new Image()
    img.src = url
    img.onload = () => setIdImageEl(img)
  }, [resetOCR])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) { setInputMode('upload'); handleFile(f) }
  }

  // ─── Scan live ───────────────────────────────────────────────────────────────

  const handleScanCapture = useCallback((f: File) => {
    setInputMode('upload') // affiche l'interface de validation
    handleFile(f)
  }, [handleFile])

  // ─── OCR ─────────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!file) return
    const res = await analyzeDocument(file, docType)
    if (res) setExtracted(res)
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!file) return
    const data = extracted || result
    setUploadStep('uploading')
    setUploadError(null)

    let embedding: number[] | null = null
    if (faceApiLoaded && idImageEl) {
      embedding = await extractEmbedding(idImageEl)
    }

    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', docType)
    if (data) formData.append('extractedData', JSON.stringify(data))
    if (embedding) formData.append('faceEmbedding', JSON.stringify(embedding))

    try {
      const res = await apiClient.post('/kyc/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const d = res.data.data as { firstName?: string; lastName?: string }
      if (preview) URL.revokeObjectURL(preview)
      onComplete({
        firstName: d.firstName || data?.firstName || '',
        lastName: d.lastName || data?.lastName || '',
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'Erreur lors de l\'envoi. Réessayez.'
      setUploadError(msg)
      setUploadStep('error')
    }
  }

  const currentResult = extracted || result
  const hasResult = !!currentResult

  // ─── Render: choose mode ─────────────────────────────────────────────────────

  if (inputMode === 'choose') {
    return (
      <div>
        <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 24, color: BAI.ink, margin: '0 0 6px' }}>
          Votre pièce d'identité
        </h3>
        <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, margin: '0 0 22px', lineHeight: 1.6 }}>
          Choisissez comment fournir votre document.
        </p>

        {/* Doc type selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {(['CNI', 'PERMIS_CONDUIRE'] as DocType[]).map(type => (
            <button key={type} onClick={() => setDocType(type)} style={{
              flex: 1, padding: '9px 10px', borderRadius: 8,
              border: `2px solid ${docType === type ? BAI.night : BAI.border}`,
              background: docType === type ? BAI.night : BAI.bgSurface,
              color: docType === type ? '#fff' : BAI.inkMid,
              fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {type === 'CNI' ? '🪪 Carte d\'identité' : '🚗 Permis de conduire'}
            </button>
          ))}
        </div>

        {/* Mode buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => setInputMode('scan')}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 12,
              background: BAI.night, border: 'none', cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Camera size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>
                Scanner avec la caméra
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                Guidage automatique · Capture quand c'est net · Recommandé
              </p>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </button>

          <button
            onClick={() => setInputMode('upload')}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 12,
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`, cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: BAI.bgMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Folder size={20} color={BAI.inkMid} />
            </div>
            <div>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700, color: BAI.ink, margin: '0 0 3px' }}>
                Importer une photo
              </p>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: 0 }}>
                JPG, PNG ou WebP — PDF et Word non acceptés
              </p>
            </div>
            <ChevronRight size={18} color={BAI.inkFaint} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </button>
        </div>
      </div>
    )
  }

  // ─── Render: scan mode ───────────────────────────────────────────────────────

  if (inputMode === 'scan') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => fullReset('choose')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid,
          }}>
            ← Retour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['CNI', 'PERMIS_CONDUIRE'] as DocType[]).map(type => (
              <button key={type} onClick={() => setDocType(type)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                border: `1.5px solid ${docType === type ? BAI.night : BAI.border}`,
                background: docType === type ? BAI.night : 'transparent',
                color: docType === type ? '#fff' : BAI.inkMid,
                fontFamily: BAI.fontBody, fontWeight: 600, cursor: 'pointer',
              }}>
                {type === 'CNI' ? 'CNI' : 'Permis'}
              </button>
            ))}
          </div>
        </div>
        <LiveDocumentScanner
          docType={docType}
          onCapture={handleScanCapture}
          onCancel={() => setInputMode('upload')}
        />
      </div>
    )
  }

  // ─── Render: upload + OCR mode ───────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={() => fullReset('choose')} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid,
        }}>
          ← Retour
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['CNI', 'PERMIS_CONDUIRE'] as DocType[]).map(type => (
            <button key={type} onClick={() => { setDocType(type); fullReset('upload') }} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11,
              border: `1.5px solid ${docType === type ? BAI.night : BAI.border}`,
              background: docType === type ? BAI.night : 'transparent',
              color: docType === type ? '#fff' : BAI.inkMid,
              fontFamily: BAI.fontBody, fontWeight: 600, cursor: 'pointer',
            }}>
              {type === 'CNI' ? 'CNI' : 'Permis'}
            </button>
          ))}
        </div>
      </div>

      {/* Format error */}
      {formatError && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: '#fff5f5', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '12px 14px', marginBottom: 14,
        }}>
          <FileX size={18} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, color: BAI.error, margin: '0 0 4px' }}>
              Format non accepté
            </p>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0, lineHeight: 1.5 }}>
              {formatError}
            </p>
            <button onClick={() => setInputMode('scan')} style={{
              marginTop: 8, background: 'none', border: 'none', padding: 0,
              fontFamily: BAI.fontBody, fontSize: 12, color: BAI.night,
              cursor: 'pointer', textDecoration: 'underline',
            }}>
              Utiliser la caméra à la place →
            </button>
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
            padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
            background: BAI.bgMuted,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = BAI.night)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = BAI.border)}
        >
          <Upload size={36} color={BAI.inkFaint} style={{ marginBottom: 12 }} />
          <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.ink, fontWeight: 600, margin: '0 0 4px' }}>
            Déposez ou cliquez pour choisir
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, margin: '0 0 10px' }}>
            JPG, PNG ou WebP — max 10 Mo
          </p>
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.error, margin: 0, fontWeight: 600 }}>
            ✗ PDF, Word, Excel non acceptés
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

      {/* File loaded */}
      {file && (
        <div>
          {/* Preview */}
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${BAI.border}`, marginBottom: 12 }}>
            {preview && (
              <img src={preview} alt="Document"
                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block', background: BAI.bgMuted }} />
            )}
            <button onClick={() => fullReset('upload')} style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer', color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 11,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <RotateCcw size={11} /> Changer
            </button>
          </div>

          {/* OCR trigger */}
          {!hasResult && !isProcessing && !ocrError && (
            <button onClick={handleAnalyze} style={{
              width: '100%', padding: '13px',
              background: BAI.night, color: '#fff', border: 'none',
              borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <ScanLine size={18} /> Analyser le document
            </button>
          )}

          {/* OCR progress */}
          {isProcessing && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>{stage}</span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.night, fontWeight: 700 }}>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, marginTop: 6 }}>
                Première analyse : téléchargement des données Tesseract (~10 Mo) si non en cache
              </p>
            </div>
          )}

          {/* OCR format error */}
          {ocrError && !isProcessing && (
            <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: '0 0 8px', lineHeight: 1.5 }}>
                {ocrError}
              </p>
              <button onClick={() => setInputMode('scan')} style={{
                width: '100%', padding: '10px', background: BAI.night, color: '#fff',
                border: 'none', borderRadius: 8, fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                📷 Utiliser la caméra
              </button>
            </div>
          )}

          {/* OCR results */}
          {hasResult && !isProcessing && currentResult && (
            <div style={{ marginTop: 14 }}>
              {/* Score banner */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                borderRadius: 10, marginBottom: 14,
                background: currentResult.isValid ? BAI.tenantLight : '#fff5f5',
                border: `1px solid ${currentResult.isValid ? BAI.tenantBorder : '#fca5a5'}`,
              }}>
                {currentResult.isValid
                  ? <CheckCircle size={18} color={BAI.tenant} style={{ flexShrink: 0, marginTop: 2 }} />
                  : <AlertTriangle size={18} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
                }
                <div>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 700, margin: '0 0 2px',
                    color: currentResult.isValid ? BAI.tenant : BAI.error }}>
                    {currentResult.isValid
                      ? `Document reconnu — ${Math.round(currentResult.validationScore * 100)}% des champs`
                      : `Reconnaissance insuffisante (${Math.round(currentResult.validationScore * 100)}%)`
                    }
                  </p>
                  {!currentResult.isValid && (
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid, margin: 0 }}>
                      Essayez avec la caméra pour un meilleur résultat.
                    </p>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {[...currentResult.validFields, ...currentResult.missingFields].map(field => (
                  <FieldBadge key={field}
                    label={FIELD_LABELS[field] || field}
                    icon={FIELD_ICONS[field] || '📋'}
                    found={currentResult.validFields.includes(field)}
                  />
                ))}
              </div>

              {/* Moteur OCR utilisé */}
              {currentResult._engine && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 100,
                    background: currentResult._engine === 'gemini-vision' ? '#e8f5e9'
                      : currentResult._engine === 'mindee' ? '#e3f2fd'
                      : BAI.bgMuted,
                    color: currentResult._engine === 'gemini-vision' ? '#1b5e3b'
                      : currentResult._engine === 'mindee' ? '#1a3270'
                      : BAI.inkMid,
                  }}>
                    Moteur : {currentResult._engine}
                  </span>
                </div>
              )}

              {/* Values */}
              <div style={{ marginBottom: 14 }}>
                {currentResult.lastName && <ExtractedValue label="Nom" value={currentResult.lastName} />}
                {currentResult.firstName && <ExtractedValue label="Prénom(s)" value={currentResult.firstName} />}
                {currentResult.birthDate && <ExtractedValue label="Date de naissance" value={currentResult.birthDate} />}
                {currentResult.birthPlace && <ExtractedValue label="Lieu de naissance" value={currentResult.birthPlace} />}
                {currentResult.documentNumber && <ExtractedValue label="N° de document" value={currentResult.documentNumber} />}
                {currentResult.documentExpiry && <ExtractedValue label="Valable jusqu'au" value={currentResult.documentExpiry} />}
                {currentResult.nationality && <ExtractedValue label="Nationalité" value={currentResult.nationality} />}
                {currentResult.mrzValid && <ExtractedValue label="Zone MRZ" value="✓ Validée" />}
                {currentResult.licenseCategories && currentResult.licenseCategories.length > 0 &&
                  <ExtractedValue label="Catégories" value={currentResult.licenseCategories} />}
              </div>

              {/* Retry with camera if poor result */}
              {!currentResult.isValid && (
                <button onClick={() => setInputMode('scan')} style={{
                  width: '100%', padding: '11px',
                  background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 8,
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 13, color: BAI.ink,
                  cursor: 'pointer', marginBottom: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Camera size={15} /> Scanner avec la caméra (meilleure qualité)
                </button>
              )}

              {/* RGPD */}
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                background: BAI.bgMuted, borderRadius: 8, padding: '7px 11px', marginBottom: 14,
              }}>
                <Trash2 size={12} color={BAI.inkFaint} />
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, lineHeight: 1.4 }}>
                  Photo supprimée immédiatement · Données chiffrées AES-256 · Conformité RGPD
                </span>
              </div>

              {/* Upload error */}
              {uploadStep === 'error' && uploadError && (
                <div style={{ display: 'flex', gap: 8, background: '#fff5f5', border: '1px solid #fca5a5',
                  borderRadius: 8, padding: '9px 12px', marginBottom: 10 }}>
                  <AlertTriangle size={14} color={BAI.error} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.error, margin: 0 }}>{uploadError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={uploadStep === 'uploading'}
                style={{
                  width: '100%', padding: '14px',
                  background: uploadStep === 'uploading' ? BAI.inkFaint
                    : currentResult.isValid ? BAI.night : BAI.inkMid,
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontFamily: BAI.fontBody, fontWeight: 700, fontSize: 15,
                  cursor: uploadStep === 'uploading' ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {uploadStep === 'uploading' ? (
                  <><Upload size={15} /> Envoi en cours…</>
                ) : currentResult.isValid ? (
                  <><CheckCircle size={15} /> Confirmer et continuer</>
                ) : (
                  <><ChevronRight size={15} /> Continuer malgré tout</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
