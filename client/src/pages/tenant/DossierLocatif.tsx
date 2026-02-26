import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, Trash2, CheckCircle, AlertCircle, FileText, User,
  Briefcase, TrendingUp, Home, Shield, ChevronDown, ChevronUp,
  Eye, Lock, Loader, Star, Award, Info,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Layout } from '../../components/layout/Layout'
import { dossierService, TenantDocument } from '../../services/dossierService'
import toast from 'react-hot-toast'

const SERVER_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ─── Document Catalogue ────────────────────────────────────────────────────

interface DocSpec {
  docType: string
  label: string
  hint: string
  required: boolean
  weight: number // contribution to score
}

interface Category {
  id: string
  label: string
  shortLabel: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  docs: DocSpec[]
}

const CATEGORIES: Category[] = [
  {
    id: 'IDENTITE',
    label: 'Identité & Profil',
    shortLabel: 'Identité',
    icon: User,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    docs: [
      { docType: 'CNI', label: "Carte d'identité (recto/verso)", hint: "Valide, non expirée. Recto et verso sur la même page PDF/image.", required: true, weight: 3 },
      { docType: 'PASSEPORT', label: 'Passeport (page photo)', hint: "Page comportant la photo et les données biométriques.", required: false, weight: 2 },
      { docType: 'JUSTIFICATIF_DOMICILE', label: 'Justificatif de domicile', hint: "Facture EDF/eau/gaz ou avis de taxe, daté de moins de 3 mois.", required: true, weight: 2 },
    ],
  },
  {
    id: 'SITUATION_PRO',
    label: 'Situation Professionnelle',
    shortLabel: 'Emploi',
    icon: Briefcase,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    docs: [
      { docType: 'CONTRAT_TRAVAIL', label: 'Contrat de travail', hint: "CDI, CDD, intérim ou convention de stage signée.", required: true, weight: 4 },
      { docType: 'ATTESTATION_EMPLOYEUR', label: "Attestation de l'employeur", hint: "Sur papier entête, précisant le poste, la date d'embauche et le salaire.", required: false, weight: 2 },
      { docType: 'DERNIER_BULLETIN', label: 'Dernier bulletin de salaire', hint: "Bulletin le plus récent (M-1).", required: true, weight: 3 },
      { docType: 'KBIS_SIRET', label: "Kbis ou numéro SIRET", hint: "Pour les travailleurs indépendants / auto-entrepreneurs.", required: false, weight: 2 },
    ],
  },
  {
    id: 'REVENUS',
    label: 'Ressources & Revenus',
    shortLabel: 'Revenus',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    docs: [
      { docType: 'BULLETIN_1', label: 'Bulletin de salaire M-1', hint: "Mois le plus récent.", required: true, weight: 3 },
      { docType: 'BULLETIN_2', label: 'Bulletin de salaire M-2', hint: "Avant-dernier mois.", required: true, weight: 3 },
      { docType: 'BULLETIN_3', label: 'Bulletin de salaire M-3', hint: "Il y a 3 mois.", required: true, weight: 3 },
      { docType: 'AVIS_IMPOSITION_1', label: "Avis d'imposition N-1", hint: "Dernier avis reçu (ou avis de non-imposition).", required: true, weight: 4 },
      { docType: 'AVIS_IMPOSITION_2', label: "Avis d'imposition N-2", hint: "Avant-dernier avis.", required: false, weight: 2 },
      { docType: 'RELEVE_BANCAIRE', label: 'Relevé bancaire (3 mois)', hint: "Relevés des 3 derniers mois, toutes pages.", required: false, weight: 2 },
    ],
  },
  {
    id: 'HISTORIQUE',
    label: 'Historique de Logement',
    shortLabel: 'Historique',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    docs: [
      { docType: 'QUITTANCE_1', label: 'Quittance de loyer M-1', hint: "Quittance la plus récente, signée par le propriétaire.", required: false, weight: 2 },
      { docType: 'QUITTANCE_2', label: 'Quittance de loyer M-2', hint: "Deuxième quittance.", required: false, weight: 2 },
      { docType: 'QUITTANCE_3', label: 'Quittance de loyer M-3', hint: "Troisième quittance.", required: false, weight: 2 },
      { docType: 'ATTESTATION_PAIEMENT', label: 'Attestation de bon paiement', hint: "Délivrée par l'ancien propriétaire ou gestionnaire.", required: false, weight: 3 },
      { docType: 'ASSURANCE_HABITATION', label: "Assurance habitation en cours", hint: "Attestation d'assurance multirisque habitation valide.", required: false, weight: 2 },
    ],
  },
  {
    id: 'GARANTIES',
    label: 'Garanties & Cautions',
    shortLabel: 'Garanties',
    icon: Shield,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    docs: [
      { docType: 'ATTESTATION_VISALE', label: 'Attestation Visale', hint: "Garantie Action Logement. Très appréciée des propriétaires.", required: false, weight: 5 },
      { docType: 'ACTE_CAUTION', label: 'Acte de cautionnement solidaire', hint: "Document signé par le garant et le locataire.", required: false, weight: 4 },
      { docType: 'CNI_GARANT', label: "Pièce d'identité du garant", hint: "CNI ou passeport valide du garant.", required: false, weight: 2 },
      { docType: 'BULLETINS_GARANT', label: 'Bulletins de salaire du garant', hint: "3 derniers bulletins de salaire du garant.", required: false, weight: 3 },
      { docType: 'AVIS_IMPOSITION_GARANT', label: "Avis d'imposition du garant", hint: "Dernier avis d'imposition du garant.", required: false, weight: 2 },
    ],
  },
]

const TOTAL_WEIGHT = CATEGORIES.flatMap((c) => c.docs).reduce((sum, d) => sum + d.weight, 0)

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getStrength(score: number, hasVisale: boolean): {
  label: string
  color: string
  bg: string
  icon: React.ElementType
} {
  if (score >= 90 && hasVisale) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Award }
  if (score >= 65) return { label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-100', icon: Star }
  if (score >= 35) return { label: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle }
  return { label: 'Faible', color: 'text-red-500', bg: 'bg-red-100', icon: AlertCircle }
}

// ─── Drop Zone ───────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (file: File) => void
  uploading: boolean
}

function DropZone({ onFile, uploading }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 transition-all cursor-pointer select-none
        ${dragging ? 'border-primary-400 bg-primary-50' : 'hover:border-primary-300 hover:bg-primary-50/40'}
      `}
      style={{ borderColor: dragging ? undefined : 'var(--border)' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        disabled={uploading}
      />
      {uploading ? (
        <Loader className="w-5 h-5 text-primary-500 animate-spin" />
      ) : (
        <Upload className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
      )}
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {uploading ? 'Envoi en cours...' : 'Glissez ou cliquez'}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-placeholder)' }}>PDF, JPEG, PNG — 5 Mo max</p>
    </div>
  )
}

// ─── Document Row ─────────────────────────────────────────────────────────────

interface DocRowProps {
  spec: DocSpec
  doc: TenantDocument | undefined
  onUpload: (docType: string, file: File) => Promise<void>
  onDelete: (id: string) => void
  uploadingKey: string | null
}

function DocRow({ spec, doc, onUpload, onDelete, uploadingKey }: DocRowProps) {
  const [showHint, setShowHint] = useState(false)
  const uploading = uploadingKey === spec.docType

  const statusBadge = () => {
    if (!doc) return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        <AlertCircle className="w-3 h-3" /> Manquant
      </span>
    )
    if (doc.status === 'VALIDATED') return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" /> Validé
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        <CheckCircle className="w-3 h-3" /> Uploadé
      </span>
    )
  }

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        backgroundColor: doc ? 'var(--surface-card)' : 'var(--surface-subtle)',
        borderColor: doc ? 'var(--border)' : 'var(--border)',
      }}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: doc ? 'var(--surface-subtle)' : 'var(--surface-page)' }}>
          <FileText className="w-4 h-4" style={{ color: doc ? 'var(--text-secondary)' : 'var(--text-placeholder)' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {spec.label}
            </p>
            {spec.required && (
              <span className="text-xs text-red-500 font-medium">*</span>
            )}
            <button
              onClick={() => setShowHint((v) => !v)}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors"
              title="Info"
            >
              <Info className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>

          {showHint && (
            <p className="text-xs mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>
              {spec.hint}
            </p>
          )}

          {doc && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
              {doc.fileName} · {formatFileSize(doc.fileSize)}
            </p>
          )}
        </div>

        {/* Status + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {statusBadge()}

          {doc ? (
            <div className="flex gap-1">
              <a
                href={`${SERVER_BASE}${doc.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Voir"
              >
                <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </a>
              <button
                onClick={() => onDelete(doc.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Upload zone if doc not yet present */}
      {!doc && (
        <div className="px-3 pb-3">
          <DropZone
            uploading={uploading}
            onFile={(file) => onUpload(spec.docType, file)}
          />
        </div>
      )}

      {/* Replace button if doc present */}
      {doc && (
        <div className="px-3 pb-3">
          <DropZone
            uploading={uploading}
            onFile={(file) => onUpload(spec.docType, file)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const strength = getStrength(score, false)
  const clampedScore = Math.min(100, Math.max(0, score))

  // SVG arc gauge
  const R = 54
  const cx = 64
  const cy = 64
  const circumference = Math.PI * R
  const offset = circumference * (1 - clampedScore / 100)

  const strokeColor =
    score >= 90 ? '#10b981' :
    score >= 65 ? '#3b82f6' :
    score >= 35 ? '#f59e0b' :
    '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg width={128} height={72} viewBox="0 0 128 76">
        {/* Background arc */}
        <path
          d="M 10 64 A 54 54 0 0 1 118 64"
          fill="none"
          stroke="var(--border)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 64 A 54 54 0 0 1 118 64"
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s' }}
        />
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight="bold" fill={strokeColor}>
          {clampedScore}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">
          complétude
        </text>
      </svg>
      <span className={`text-sm font-semibold mt-1 ${strength.color}`}>{strength.label}</span>
    </div>
  )
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category
  docs: TenantDocument[]
  onUpload: (category: string, docType: string, file: File) => Promise<void>
  onDelete: (id: string) => void
  uploadingKey: string | null // "CATEGORY:docType"
}

function CategoryCard({ category, docs, onUpload, onDelete, uploadingKey }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true)
  const Icon = category.icon

  const docsByType = Object.fromEntries(docs.map((d) => [d.docType, d]))
  const uploadedCount = category.docs.filter((d) => docsByType[d.docType]).length
  const total = category.docs.length
  const pct = total > 0 ? Math.round((uploadedCount / total) * 100) : 0

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-opacity-50 transition-colors"
        style={{ backgroundColor: 'var(--surface-card)' }}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category.bgColor}`}>
          <Icon className={`w-5 h-5 ${category.color}`} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{category.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b' }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {uploadedCount}/{total}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded
            ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          }
        </div>
      </button>

      {/* Docs list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3 space-y-3">
            {category.docs.map((spec) => (
              <DocRow
                key={spec.docType}
                spec={spec}
                doc={docsByType[spec.docType]}
                onUpload={(docType, file) => onUpload(category.id, docType, file)}
                onDelete={onDelete}
                uploadingKey={uploadingKey === `${category.id}:${spec.docType}` ? spec.docType : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DossierLocatif() {
  useAuth()
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null) // "CATEGORY:docType"

  // Load documents
  useEffect(() => {
    setIsLoading(true)
    dossierService
      .getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger le dossier'))
      .finally(() => setIsLoading(false))
  }, [])

  // Compute score
  const score = Math.round(
    (CATEGORIES.flatMap((c) => c.docs)
      .filter((spec) => documents.some((d) => d.category === CATEGORIES.find((c) => c.docs.includes(spec))?.id && d.docType === spec.docType))
      .reduce((sum, spec) => sum + spec.weight, 0) /
      TOTAL_WEIGHT) *
      100
  )

  const hasVisale = documents.some((d) => d.docType === 'ATTESTATION_VISALE')
  const strength = getStrength(score, hasVisale)
  const StrengthIcon = strength.icon

  const handleUpload = useCallback(
    async (category: string, docType: string, file: File) => {
      const key = `${category}:${docType}`
      setUploadingKey(key)
      try {
        const doc = await dossierService.uploadDocument(category, docType, file)
        setDocuments((prev) => {
          const filtered = prev.filter((d) => !(d.category === category && d.docType === docType))
          return [doc, ...filtered]
        })
        toast.success('Document ajouté')
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de l\'upload')
      } finally {
        setUploadingKey(null)
      }
    },
    []
  )

  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  const uploadedTotal = documents.length
  const requiredDocs = CATEGORIES.flatMap((c) => c.docs).filter((d) => d.required)
  const requiredUploaded = requiredDocs.filter((spec) =>
    documents.some((d) => {
      const cat = CATEGORIES.find((c) => c.docs.includes(spec))
      return d.category === cat?.id && d.docType === spec.docType
    })
  ).length

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Mon Dossier Locatif
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Centralisez tous vos documents. Un dossier complet multiplie vos chances d'obtenir un logement.
          </p>
        </div>

        {/* Score + summary banner */}
        <div
          className="rounded-2xl border p-5 mb-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
        >
          {/* Gauge */}
          <div className="flex-shrink-0">
            <ScoreGauge score={score} />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            {/* Strength badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${strength.bg} ${strength.color}`}>
              <StrengthIcon className="w-4 h-4" />
              Dossier {strength.label}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Documents fournis : </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{uploadedTotal}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Obligatoires : </span>
                <span className={`font-semibold ${requiredUploaded === requiredDocs.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {requiredUploaded}/{requiredDocs.length}
                </span>
              </div>
              {hasVisale && (
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Shield className="w-4 h-4" />
                  Garantie Visale
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  background:
                    score >= 90 ? '#10b981' :
                    score >= 65 ? '#3b82f6' :
                    score >= 35 ? '#f59e0b' :
                    '#ef4444',
                }}
              />
            </div>

            {/* Security notice */}
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              Documents sécurisés — accès réservé à vous et aux propriétaires que vous contactez
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                docs={documents.filter((d) => d.category === category.id)}
                onUpload={handleUpload}
                onDelete={handleDelete}
                uploadingKey={uploadingKey}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        <div
          className="mt-8 rounded-2xl border p-5 flex gap-3"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border)' }}
        >
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conseils pour un dossier solide</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Fournissez des documents récents (- 3 mois pour les justificatifs de domicile)</li>
              <li>Une garantie Visale ou un garant solide rassure fortement les propriétaires</li>
              <li>Vos 3 derniers bulletins de salaire et vos 2 derniers avis d'imposition sont essentiels</li>
              <li>Un dossier complet vous permet d'être prioritaire sur les biens populaires</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
