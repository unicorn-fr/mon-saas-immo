import { useState, useEffect, useRef, useCallback, useId, useMemo } from 'react'
import {
  User, Briefcase, TrendingUp, Home, Shield,
  Upload, Eye, Trash2, CheckCircle2, Loader2, BookOpen, Star,
  ArrowRight, ArrowLeft, HelpCircle, CreditCard,
  LayoutGrid, ChevronDown, ChevronUp, Camera, FileText,
  GraduationCap, Building2, HandHelping, UserCheck, ShieldCheck, XCircle,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { dossierService, TenantDocument } from '../../services/dossier.service'
import { DocumentViewerModal } from '../../components/document/DocumentViewerModal'
import { CameraCapture, CaptureEntry } from '../../components/dossier/CameraCapture'
import { NationalitySearch } from '../../components/dossier/NationalitySearch'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Slot {
  docType:  string
  label:    string
  required: boolean
  help:     string
}
interface Category {
  id:    string
  label: string
  hint:  string
  icon:  React.ElementType
  slots: Slot[]
}

// ── Questionnaire types & key ──────────────────────────────────────────────────
const QUESTIONNAIRE_KEY = 'dossier_questionnaire_v1'

interface DossierQuestionnaire {
  idKind:     'cni' | 'permis' | 'passport' | 'sejour' | null
  emploiType: 'cdi' | 'cdd_embauche' | 'independant' | 'etudiant' | 'retraite' | 'sans_emploi' | null
  hasGarant:  'oui_physique' | 'oui_visale' | 'non' | null
}

// ── Questionnaire options ──────────────────────────────────────────────────────
const ID_OPTIONS: { value: string; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: 'cni',      label: "Carte nationale d'identité", sub: 'CNI française ou européenne — recto + verso', Icon: CreditCard },
  { value: 'permis',   label: 'Permis de conduire',         sub: 'Permis EU — recto + verso',                  Icon: FileText },
  { value: 'passport', label: 'Passeport',                  sub: 'Français ou étranger — page photo',           Icon: BookOpen },
  { value: 'sejour',   label: 'Titre de séjour',            sub: 'Carte de résident ou titre de voyage',        Icon: FileText },
]

const EMPLOI_OPTIONS: { value: string; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: 'cdi',          label: 'Salarié(e) en CDI',                 sub: 'Contrat à durée indéterminée',              Icon: Briefcase },
  { value: 'cdd_embauche', label: "CDD ou en cours d'embauche",         sub: "CDD, intérim, promesse d'embauche signée",  Icon: FileText },
  { value: 'independant',  label: 'Indépendant / Auto-entrepreneur',    sub: 'KBIS, micro-entreprise',                    Icon: Building2 },
  { value: 'etudiant',     label: 'Étudiant(e)',                        sub: 'Carte étudiant + bourse ou aide parentale', Icon: GraduationCap },
  { value: 'retraite',     label: 'Retraité(e)',                        sub: 'Pension de retraite',                       Icon: UserCheck },
  { value: 'sans_emploi',  label: 'Sans activité professionnelle',      sub: 'Revenus alternatifs (CAF, allocation…)',    Icon: HandHelping },
]

const GARANT_OPTIONS: { value: string; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: 'oui_physique', label: 'Oui — garant personnel',    sub: 'Parent, proche ou tiers physique',          Icon: ShieldCheck },
  { value: 'oui_visale',   label: 'Oui — Visale / CLé',         sub: 'Caution Action Logement',                   Icon: Building2 },
  { value: 'non',          label: 'Pas de garant',              sub: 'Je me porte seul(e) garant de mon dossier', Icon: XCircle },
]

// ── Stepper steps ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'identity',  label: 'Identité',   icon: User,       description: 'Vos informations personnelles' },
  { id: 'IDENTITE',  label: "Pièce d'ID", icon: CreditCard, description: 'CNI ou passeport' },
  { id: 'EMPLOI',    label: 'Emploi',     icon: Briefcase,  description: 'Contrat de travail' },
  { id: 'REVENUS',   label: 'Revenus',    icon: TrendingUp, description: 'Bulletins de salaire' },
  { id: 'DOMICILE',  label: 'Domicile',   icon: Home,       description: "Justificatif d'adresse" },
  { id: 'GARANTIES', label: 'Garant',     icon: Shield,     description: 'Documents garant (optionnel)' },
] as const

const STORAGE_KEY = 'dossier_stepper_v1'
const GUIDE_DONE_KEY = 'dossier_guide_done_v1'
const TOTAL_STEPS = STEPS.length // 6

// ── Document categories (for overview mode) ────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: 'IDENTITE', label: "Pièce d'identité", icon: CreditCard,
    hint: "Carte nationale d'identité ou passeport en cours de validité.",
    slots: [
      { docType: 'CNI_RECTO',    label: 'CNI recto',              required: true,  help: 'Photographiez le recto de votre CNI en entier.' },
      { docType: 'CNI_VERSO',    label: 'CNI verso',              required: false, help: 'Le verso confirme la date d\'expiration et la bande MRZ.' },
      { docType: 'PASSEPORT',    label: 'Passeport',              required: false, help: 'Page d\'identité principale avec photo.' },
      { docType: 'TITRE_SEJOUR', label: 'Titre de séjour',        required: false, help: 'Titre de séjour en cours de validité.' },
      { docType: 'PERMIS_RECTO', label: 'Permis recto',           required: false, help: 'Face avant du permis avec photo et données personnelles.' },
      { docType: 'PERMIS_VERSO', label: 'Permis verso',           required: false, help: 'Face arrière avec les catégories.' },
    ],
  },
  {
    id: 'EMPLOI', label: 'Situation professionnelle', icon: Briefcase,
    hint: 'Contrat de travail ou équivalent prouvant votre activité.',
    slots: [
      { docType: 'CONTRAT_TRAVAIL',    label: 'Contrat de travail',      required: true,  help: 'CDI, CDD ou contrat d\'apprentissage signé.' },
      { docType: 'PROMESSE_EMBAUCHE',  label: "Promesse d'embauche",     required: false, help: 'Valide si vous n\'avez pas encore commencé votre poste.' },
      { docType: 'KBIS_EXTRAIT',       label: 'Extrait KBIS',            required: false, help: 'Extrait Kbis de moins de 3 mois pour les indépendants.' },
      { docType: 'JUSTIFICATIF_RETRAITE', label: 'Justificatif de retraite', required: false, help: 'Notification de pension ou avis de paiement.' },
    ],
  },
  {
    id: 'REVENUS', label: 'Revenus', icon: TrendingUp,
    hint: "Trois derniers bulletins de salaire + dernier avis d'imposition.",
    slots: [
      { docType: 'BULLETIN_PAIE_1',    label: 'Bulletin de salaire M-1', required: true,  help: 'Dernier bulletin de paie.' },
      { docType: 'BULLETIN_PAIE_2',    label: 'Bulletin de salaire M-2', required: true,  help: 'Avant-dernier bulletin.' },
      { docType: 'BULLETIN_PAIE_3',    label: 'Bulletin de salaire M-3', required: true,  help: '3e bulletin.' },
      { docType: 'AVIS_IMPOSITION',    label: "Avis d'imposition N-1",   required: true,  help: 'Téléchargeable sur impots.gouv.fr.' },
      { docType: 'AVIS_IMPOSITION_N2', label: "Avis d'imposition N-2",   required: false, help: "Renforce la stabilité financière perçue." },
    ],
  },
  {
    id: 'DOMICILE', label: 'Justificatif de domicile', icon: Home,
    hint: 'Quittance de loyer, taxe foncière ou facture de moins de 3 mois.',
    slots: [
      { docType: 'QUITTANCE_LOYER',       label: 'Quittance de loyer',   required: false, help: 'Les 3 dernières quittances de loyer.' },
      { docType: 'TAXE_FONCIERE',         label: 'Taxe foncière',        required: false, help: 'Uniquement si vous êtes propriétaire.' },
      { docType: 'FACTURE_EDF',           label: 'Facture énergie / eau', required: false, help: 'Facture de moins de 3 mois à votre nom.' },
      { docType: 'JUSTIFICATIF_DOMICILE', label: 'Autre justificatif',   required: false, help: 'Attestation d\'hébergement ou autre justificatif.' },
    ],
  },
  {
    id: 'GARANTIES', label: 'Garant', icon: Shield,
    hint: 'Documents du garant (facultatif mais valorisant si revenus < 3× loyer).',
    slots: [
      { docType: 'GARANT_CNI',        label: 'CNI du garant',              required: false, help: 'Pièce d\'identité valide du garant.' },
      { docType: 'GARANT_CONTRAT',    label: 'Contrat de travail garant',  required: false, help: 'Idéalement un CDI confirmé.' },
      { docType: 'GARANT_PAIE',       label: 'Bulletins de salaire garant',required: false, help: 'Les 3 derniers bulletins.' },
      { docType: 'GARANT_IMPOSITION', label: "Avis d'imposition garant",   required: false, help: 'Dernier avis d\'imposition.' },
      { docType: 'LETTRE_GARANT',     label: "Lettre d'engagement",        required: false, help: 'Lettre signée d\'engagement.' },
      { docType: 'GARANT_VISALE',     label: 'Attestation Visale / CLé',   required: false, help: 'Attestation Action Logement.' },
    ],
  },
]

// ── Tips ───────────────────────────────────────────────────────────────────────
const TIPS = [
  { icon: Star,     title: 'Complétez au maximum',         body: 'Un dossier complet est traité en priorité.' },
  { icon: Eye,      title: 'Lisibilité avant tout',         body: 'Scannez en haute résolution, sans reflets.' },
  { icon: Shield,   title: 'Un garant augmente vos chances', body: 'Si vos revenus sont < 3× le loyer, joindre un garant peut être décisif.' },
  { icon: BookOpen, title: 'Cohérence des données',         body: 'Nom, adresse et revenus doivent être cohérents.' },
]

// ── QuestionCard — outside the page component ─────────────────────────────────
interface QuestionCardProps {
  question: string
  options:  { value: string; label: string; sub: string; Icon: React.ElementType }[]
  value:    string | null
  onChange: (v: string) => void
}

function QuestionCard({ question, options, value, onChange }: QuestionCardProps) {
  if (value !== null && value !== '') {
    const chosen = options.find(o => o.value === value)
    if (!chosen) return null
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderRadius: 10, border: `1px solid ${BAI.tenantBorder}`, background: BAI.tenantLight,
        marginBottom: 16,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <chosen.Icon style={{ width: 16, height: 16, color: BAI.tenant }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>{question}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: BAI.tenant, fontFamily: BAI.fontBody }}>{chosen.label}</p>
        </div>
        <button
          onClick={() => onChange('')}
          style={{
            padding: '5px 10px', borderRadius: 7, border: `1px solid ${BAI.tenantBorder}`,
            background: BAI.bgSurface, color: BAI.inkMid, fontSize: 11,
            fontFamily: BAI.fontBody, cursor: 'pointer',
          }}
        >
          Modifier
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink, margin: '0 0 14px' }}>
        {question}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 10, border: `1.5px solid ${BAI.border}`, background: BAI.bgSurface,
              cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: BAI.fontBody,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BAI.tenant; e.currentTarget.style.background = BAI.tenantLight }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.background = BAI.bgSurface }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 9, background: BAI.bgMuted,
              border: `1px solid ${BAI.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <opt.Icon style={{ width: 18, height: 18, color: BAI.inkMid }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: BAI.ink }}>{opt.label}</p>
              <p style={{ margin: 0, fontSize: 12, color: BAI.inkFaint }}>{opt.sub}</p>
            </div>
            <ArrowRight style={{ width: 15, height: 15, color: BAI.inkFaint, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── HelpTooltip component ──────────────────────────────────────────────────────
function HelpTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Aide sur ce document"
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 20, height: 20, borderRadius: '50%', border: `1px solid ${BAI.borderStrong}`,
          background: open ? BAI.bgMuted : BAI.bgSurface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, flexShrink: 0,
          color: open ? BAI.inkMid : BAI.inkFaint,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <HelpCircle style={{ width: 11, height: 11 }} />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)',
            width: 260, padding: '10px 12px', borderRadius: 10,
            background: BAI.ink, color: '#ffffff',
            fontSize: 12, fontFamily: BAI.fontBody, lineHeight: 1.55,
            boxShadow: '0 8px 24px rgba(13,12,10,0.25)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {content}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 6,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${BAI.ink}`,
          }} />
        </div>
      )}
    </div>
  )
}

// ── DocSlot ────────────────────────────────────────────────────────────────────
function DocSlot({
  slot, doc,
  onUpload, onDelete, onView,
}: {
  slot:     Slot
  doc:      TenantDocument | undefined
  onUpload: (file: File, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView:   (doc: TenantDocument) => void
}) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const isImage = doc && (doc.fileUrl?.match(/\.(jpe?g|png|webp|gif)/i) || doc.fileName?.match(/\.(jpe?g|png|webp|gif)/i))

  const handleFile = async (file: File, overrideDocType?: string) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!ALLOWED.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG, WebP ou PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo).')
      return
    }
    setUploading(true)
    try { await onUpload(file, overrideDocType ?? slot.docType) } finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try { await onDelete(doc.id) } finally { setDeleting(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (doc) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        border: `1px solid ${BAI.tenantBorder}`,
        borderRadius: 12,
        background: BAI.tenantLight,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
          background: BAI.bgMuted, border: `1px solid ${BAI.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isImage ? (
            <img
              src={doc.fileUrl} alt={doc.fileName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <FileText style={{ width: 22, height: 22, color: BAI.inkFaint }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <CheckCircle2 style={{ width: 13, height: 13, color: BAI.tenant, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: BAI.tenant, fontFamily: BAI.fontBody }}>
              {slot.label}
            </span>
          </div>
          <p style={{
            fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {doc.fileName}
          </p>
        </div>

        <HelpTooltip content={slot.help} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => onView(doc)}
            style={{
              padding: '5px 10px', borderRadius: 7, border: `1px solid ${BAI.tenantBorder}`,
              background: BAI.bgSurface, color: BAI.tenant,
              fontSize: 12, fontFamily: BAI.fontBody, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Eye style={{ width: 12, height: 12 }} /> Voir
          </button>
          <button
            onClick={handleDelete} disabled={deleting}
            style={{
              padding: '5px 8px', borderRadius: 7, border: `1px solid ${BAI.border}`,
              background: BAI.bgSurface, color: deleting ? BAI.inkFaint : '#9b1c1c',
              fontSize: 12, cursor: deleting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            {deleting
              ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              : <Trash2 style={{ width: 12, height: 12 }} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {showCamera && (
        <CameraCapture
          docType={slot.docType}
          onComplete={async (captures: CaptureEntry[]) => {
            setShowCamera(false)
            setUploading(true)
            try {
              for (const { file, docType: dt } of captures) {
                const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
                if (!ALLOWED.includes(file.type)) { toast.error('Format non supporté.'); continue }
                if (file.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo).'); continue }
                await onUpload(file, dt)
              }
            } catch {
              toast.error("Erreur lors de l'envoi d'un document. Réessayez.")
            } finally {
              setUploading(false)
            }
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div
        onDragEnter={() => setDragging(true)}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 12,
          border: `1.5px dashed ${dragging ? BAI.tenant : uploading ? BAI.caramel : BAI.border}`,
          background: dragging ? BAI.tenantLight : BAI.bgSurface,
          transition: 'all 0.15s',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px 8px',
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${slot.required ? BAI.caramel : BAI.border}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: slot.required ? 600 : 400, color: BAI.ink, fontFamily: BAI.fontBody }}>
              {slot.label}
            </span>
            {slot.required && (
              <span style={{ marginLeft: 6, fontSize: 10, color: BAI.caramel, fontWeight: 600 }}>requis</span>
            )}
          </div>
          <HelpTooltip content={slot.help} />
        </div>

        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            padding: '10px',
            borderRadius: 8,
            background: dragging ? 'rgba(27,94,59,0.06)' : BAI.bgMuted,
            textAlign: 'center',
            fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody,
            transition: 'background 0.15s',
          }}>
            {uploading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                  Envoi en cours…
                </span>
              : dragging
                ? 'Relâcher pour ajouter'
                : 'Glisser-déposer un fichier ici'
            }
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              ref={inputRef} type="file"
              accept=".pdf,image/jpeg,image/png,image/webp,image/heic"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) { handleFile(f); e.target.value = '' }
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${BAI.border}`,
                background: BAI.bgSurface, color: BAI.inkMid,
                fontSize: 12, fontFamily: BAI.fontBody, cursor: uploading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = BAI.inkMid; e.currentTarget.style.background = BAI.bgMuted } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.background = BAI.bgSurface }}
            >
              <Upload style={{ width: 12, height: 12 }} />
              Importer
            </button>

            <button
              onClick={() => setShowCamera(true)}
              disabled={uploading}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${BAI.border}`,
                background: BAI.bgSurface, color: BAI.inkMid,
                fontSize: 12, fontFamily: BAI.fontBody, cursor: uploading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = BAI.caramel; e.currentTarget.style.color = BAI.caramel } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BAI.border; e.currentTarget.style.color = BAI.inkMid }}
            >
              <Camera style={{ width: 12, height: 12 }} />
              Caméra
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── CategoryAccordion (used in overview) ───────────────────────────────────────
function CategoryAccordion({
  cat, documents, onUpload, onDelete, onView,
}: {
  cat:      Category
  documents: TenantDocument[]
  onUpload: (file: File, category: string, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView:   (doc: TenantDocument) => void
}) {
  const [open, setOpen] = useState(true)
  const CatIcon = cat.icon
  const filled  = cat.slots.filter(s => documents.find(d => d.docType === s.docType)).length
  const total   = cat.slots.length
  const allDone = filled === total
  const hasDocs = filled > 0

  return (
    <div style={{
      border: `1px solid ${BAI.border}`, borderRadius: 12,
      overflow: 'hidden', background: BAI.bgSurface, boxShadow: BAI.shadowMd,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: hasDocs ? BAI.tenantLight : BAI.bgMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CatIcon style={{ width: 16, height: 16, color: hasDocs ? BAI.tenant : BAI.inkFaint }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: BAI.fontBody, color: BAI.ink }}>
              {cat.label}
            </p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: BAI.fontBody, color: BAI.inkFaint, marginTop: 1 }}>
              {filled}/{total} document{total > 1 ? 's' : ''} · {cat.hint}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone && (
            <span style={{
              fontSize: 11, fontFamily: BAI.fontBody, color: BAI.tenant, fontWeight: 600,
              background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
              borderRadius: 20, padding: '2px 8px',
            }}>
              Complet
            </span>
          )}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: BAI.inkFaint }} />
            : <ChevronDown style={{ width: 16, height: 16, color: BAI.inkFaint }} />
          }
        </div>
      </button>
      {open && (
        <div style={{
          padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8,
          borderTop: `1px solid ${BAI.border}`,
        }}>
          <div style={{ height: 8 }} />
          {cat.slots.map(slot => (
            <DocSlot
              key={slot.docType}
              slot={slot}
              doc={documents.find(d => d.docType === slot.docType)}
              onUpload={(file, docType) => onUpload(file, cat.id, docType)}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stepper header ─────────────────────────────────────────────────────────────
function StepperHeader({ current }: { current: number }) {
  const pct = Math.round((current / TOTAL_STEPS) * 100)

  return (
    <div style={{ marginBottom: 32 }}>
      <div className="sm:hidden" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: BAI.inkFaint, fontFamily: BAI.fontBody, margin: '0 0 2px' }}>
          Étape {current + 1} sur {TOTAL_STEPS}
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: BAI.fontBody, color: BAI.ink, margin: 0 }}>
          {STEPS[current]?.label ?? 'Récapitulatif'}
        </p>
      </div>

      <div className="hidden sm:flex" style={{ alignItems: 'flex-start', gap: 0, marginBottom: 16 }}>
        {STEPS.map((step, i) => {
          const done   = i < current
          const active = i === current
          const StepIcon = step.icon
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: done ? BAI.tenant : active ? BAI.tenantLight : BAI.bgMuted,
                  border: `2px solid ${done ? BAI.tenant : active ? BAI.tenant : BAI.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s',
                }}>
                  {done
                    ? <CheckCircle2 style={{ width: 16, height: 16, color: '#ffffff' }} />
                    : <StepIcon style={{ width: 14, height: 14, color: active ? BAI.tenant : BAI.inkFaint }} />
                  }
                </div>
                <span style={{
                  fontSize: 10, fontFamily: BAI.fontBody,
                  fontWeight: active ? 700 : 500,
                  color: active ? BAI.tenant : done ? BAI.inkMid : BAI.inkFaint,
                  whiteSpace: 'nowrap', textAlign: 'center',
                }}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 6px',
                  marginBottom: 24,
                  background: i < current ? BAI.tenant : BAI.border,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ height: 4, borderRadius: 99, background: BAI.border }}>
        <div style={{
          height: '100%', borderRadius: 99, background: BAI.tenant,
          width: `${pct}%`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ── Step nav buttons ───────────────────────────────────────────────────────────
function StepNav({
  onBack, onContinue, onSkip, isFirst, isLast, saving, continueLabel,
}: {
  onBack:         () => void
  onContinue:     () => void
  onSkip?:        () => void
  isFirst:        boolean
  isLast:         boolean
  saving?:        boolean
  continueLabel?: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BAI.border}`,
      flexWrap: 'wrap', gap: 10,
    }}>
      <button
        onClick={onBack} disabled={isFirst}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', borderRadius: 9,
          border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
          color: isFirst ? BAI.inkFaint : BAI.inkMid,
          fontSize: 13, fontFamily: BAI.fontBody, fontWeight: 500,
          cursor: isFirst ? 'default' : 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Retour
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              padding: '10px 16px', borderRadius: 9,
              border: 'none', background: 'none',
              color: BAI.inkFaint, fontSize: 13, fontFamily: BAI.fontBody,
              cursor: 'pointer',
            }}
          >
            Passer
          </button>
        )}
        <button
          onClick={onContinue} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 22px', borderRadius: 9,
            border: 'none',
            background: saving ? BAI.inkFaint : BAI.tenant,
            color: '#ffffff',
            fontSize: 13, fontFamily: BAI.fontBody, fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving
            ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Enregistrement…</>
            : <>{continueLabel ?? (isLast ? 'Terminer' : 'Continuer')}<ArrowRight style={{ width: 14, height: 14 }} /></>
          }
        </button>
      </div>
    </div>
  )
}

// ── FormField — outside the page component to keep stable identity ─────────────
function FormField({
  value, onChange, label, type = 'text', placeholder = '', required = false,
}: {
  value:       string
  onChange:    (val: string) => void
  label:       string
  type?:       string
  placeholder?: string
  required?:   boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, fontFamily: BAI.fontBody, color: BAI.inkMid }}>
        {label}
        {required && <span style={{ color: BAI.caramel, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '9px 12px', borderRadius: 8, border: `1px solid ${BAI.border}`,
          background: BAI.bgInput, fontSize: 16, fontFamily: BAI.fontBody, color: BAI.ink,
          outline: 'none',
        }}
      />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DossierLocatif() {
  const { user, updateProfile } = useAuth()

  // ── Stepper state (persisted) ───────────────────────────────────────────────
  const guideDone = (() => { try { return localStorage.getItem(GUIDE_DONE_KEY) === '1' } catch { return false } })()
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (guideDone) return 0
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) return Number(saved)
    } catch { /* ignore */ }
    return 0
  })
  const [showOverview, setShowOverview] = useState<boolean>(() => {
    if (guideDone) return true
    try { return localStorage.getItem(STORAGE_KEY) === String(TOTAL_STEPS) } catch { return false }
  })

  const goToStep = (n: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS, n))
    setCurrentStep(clamped)
    if (clamped >= TOTAL_STEPS) {
      setShowOverview(true)
      try {
        localStorage.setItem(STORAGE_KEY, String(TOTAL_STEPS))
        localStorage.setItem(GUIDE_DONE_KEY, '1')
      } catch { /* ignore */ }
    } else {
      setShowOverview(false)
      try { localStorage.setItem(STORAGE_KEY, String(clamped)) } catch { /* ignore */ }
    }
  }

  // ── Questionnaire state (persisted) ────────────────────────────────────────
  const [questionnaire, setQuestionnaire] = useState<DossierQuestionnaire>(() => {
    try {
      const saved = localStorage.getItem(QUESTIONNAIRE_KEY)
      return saved ? (JSON.parse(saved) as DossierQuestionnaire) : { idKind: null, emploiType: null, hasGarant: null }
    } catch {
      return { idKind: null, emploiType: null, hasGarant: null }
    }
  })

  const updateQuestionnaire = useCallback(<K extends keyof DossierQuestionnaire>(key: K, val: string) => {
    setQuestionnaire(prev => {
      const next = { ...prev, [key]: val || null } as DossierQuestionnaire
      try { localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // ── Camera state for identity step ─────────────────────────────────────────
  const [showIdentityCamera, setShowIdentityCamera] = useState(false)

  // ── Documents ──────────────────────────────────────────────────────────────
  const [documents,   setDocuments]   = useState<TenantDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [viewerDoc,   setViewerDoc]   = useState<TenantDocument | null>(null)

  // ── OCR state ───────────────────────────────────────────────────────────────
  const [ocrResult,   setOcrResult]   = useState<Record<string, string> | null>(null)
  const [ocrSide,     setOcrSide]     = useState<'recto' | 'verso' | 'unknown' | null>(null)
  const [nameWarning, setNameWarning] = useState('')

  useEffect(() => {
    dossierService.getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger vos documents'))
      .finally(() => setLoadingDocs(false))
  }, [])

  const OCR_DOC_TYPES = new Set(['CNI_RECTO', 'PASSEPORT', 'TITRE_SEJOUR'])

  const handleUpload = useCallback(async (file: File, category: string, docType: string) => {
    const doc = await dossierService.uploadDocument(category, docType, file)
    setDocuments(prev => {
      const filtered = prev.filter(d => !(d.category === category && d.docType === docType))
      return [doc, ...filtered]
    })
    toast.success('Document ajouté')

    if (OCR_DOC_TYPES.has(docType) && file.type.startsWith('image/')) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('docType', docType)
        const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken') ?? ''
        const res = await fetch('/api/v1/ocr/extract', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        })
        if (res.ok) {
          const json = await res.json()
          const d = json.data as Record<string, string | boolean>

          if (d.isIdDocument === false) {
            const reason = String(d.rejectReason || "Ce document ne semble pas être une pièce d'identité valide.")
            toast.error(`Document refusé — ${reason}`, { duration: 6000 })
            return
          }

          if (d && (d.nom || d.prenom)) {
            setOcrResult(d as Record<string, string>)
            setForm(prev => ({
              firstName:   prev.firstName   || (String(d.prenom ?? '')),
              lastName:    prev.lastName    || (String(d.nom    ?? '')),
              birthDate:   prev.birthDate   || (String(d.dob   ?? '')),
              birthCity:   prev.birthCity,
              nationality: prev.nationality || (String(d.nationality ?? '')),
            }))
            const side = String(d.side ?? 'unknown')
            if (side === 'recto' || side === 'verso' || side === 'unknown') {
              setOcrSide(side as 'recto' | 'verso' | 'unknown')
            }
            const mrzRaw = String(d.mrz ?? '')
            if (mrzRaw) {
              try {
                const { parse } = await import('mrz')
                const lines = mrzRaw.split('|').map(l => l.trim()).filter(Boolean)
                if (lines.length >= 2) {
                  const parsed = parse(lines)
                  if (parsed.valid) {
                    toast.success('MRZ validée — document authentifié', { duration: 3000 })
                  }
                }
              } catch { /* mrz parse failure is silent */ }
            }
            const norm = (s: string) => s.trim().toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z\s-]/g, '').replace(/\s+/g, ' ')
            const docNom    = norm(String(d.nom    ?? ''))
            const docPrenom = norm(String(d.prenom ?? ''))
            const regNom    = norm(user?.lastName  ?? '')
            const regPrenom = norm(user?.firstName ?? '')
            const nomOk    = !docNom    || !regNom    || docNom.includes(regNom)    || regNom.includes(docNom)
            const prenomOk = !docPrenom || !regPrenom || docPrenom.includes(regPrenom) || regPrenom.includes(docPrenom)
            if (!nomOk || !prenomOk) {
              setNameWarning(
                `Nom sur le document : ${String(d.prenom || '—')} ${String(d.nom || '—')}. Cela ne correspond pas au profil enregistré. Vérifiez vos informations.`
              )
            } else {
              setNameWarning('')
            }
          }
        }
      } catch {
        // OCR failure is silent — user fills manually
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async (id: string) => {
    await dossierService.deleteDocument(id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    toast.success('Document supprimé')
  }, [])

  // ── Profile form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName:   user?.firstName   ?? '',
    lastName:    user?.lastName    ?? '',
    birthDate:   user?.birthDate   ? user.birthDate.slice(0, 10) : '',
    birthCity:   user?.birthCity   ?? '',
    nationality: user?.nationality ?? '',
  })
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (user) setForm({
      firstName:   user.firstName   ?? '',
      lastName:    user.lastName    ?? '',
      birthDate:   user.birthDate   ? user.birthDate.slice(0, 10) : '',
      birthCity:   user.birthCity   ?? '',
      nationality: user.nationality ?? '',
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async (): Promise<boolean> => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Le prénom et le nom sont obligatoires.')
      return false
    }
    setFormError('')
    setSaving(true)
    try {
      await updateProfile({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        birthDate:   form.birthDate  || undefined,
        birthCity:   form.birthCity.trim()   || undefined,
        nationality: form.nationality.trim() || undefined,
      })
      toast.success('Informations enregistrées')
      return true
    } catch {
      toast.error('Erreur lors de la sauvegarde')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── Dynamic slots based on questionnaire ───────────────────────────────────
  const idSlots = useMemo((): Slot[] => {
    const q = questionnaire.idKind
    if (!q) return []
    const ALL_ID_SLOTS: Record<string, Slot[]> = {
      cni: [
        { docType: 'CNI_RECTO', label: 'CNI — Recto', required: true,  help: "Face avant de votre carte nationale d'identité avec photo." },
        { docType: 'CNI_VERSO', label: 'CNI — Verso', required: false, help: 'Face arrière avec la bande MRZ (chiffres et lettres).' },
      ],
      permis: [
        { docType: 'PERMIS_RECTO', label: 'Permis — Recto', required: true,  help: 'Face avant du permis avec photo et données personnelles.' },
        { docType: 'PERMIS_VERSO', label: 'Permis — Verso', required: false, help: 'Face arrière avec les catégories (A, B, C…).' },
      ],
      passport: [
        { docType: 'PASSEPORT', label: 'Page photo du passeport', required: true, help: 'Page biographique avec votre photo.' },
      ],
      sejour: [
        { docType: 'TITRE_SEJOUR', label: 'Titre de séjour', required: true, help: 'Titre en cours de validité, recto uniquement.' },
      ],
    }
    return ALL_ID_SLOTS[q] ?? []
  }, [questionnaire.idKind])

  const emploiSlots = useMemo((): Slot[] => {
    const q = questionnaire.emploiType
    if (!q) return []
    const MAP: Record<string, Slot[]> = {
      cdi:          [{ docType: 'CONTRAT_TRAVAIL', label: 'Contrat de travail (CDI)', required: true, help: 'Contrat signé par les deux parties mentionnant poste, salaire et employeur.' }],
      cdd_embauche: [
        { docType: 'CONTRAT_TRAVAIL',   label: 'Contrat de travail (CDD)', required: false, help: 'Contrat CDD ou intérim signé.' },
        { docType: 'PROMESSE_EMBAUCHE', label: "Promesse d'embauche",      required: false, help: "Lettre signée par l'employeur précisant le poste et le salaire." },
      ],
      independant:  [{ docType: 'KBIS_EXTRAIT', label: 'Extrait KBIS (< 3 mois)', required: true, help: "Téléchargeable sur infogreffe.fr — prouve l'existence de votre activité." }],
      etudiant:     [],
      retraite:     [{ docType: 'JUSTIFICATIF_RETRAITE', label: 'Justificatif de retraite', required: true, help: 'Notification de pension ou dernier avis de paiement CARSAT/Agirc-Arrco.' }],
      sans_emploi:  [],
    }
    return MAP[q] ?? []
  }, [questionnaire.emploiType])

  const revenusSlots = useMemo((): Slot[] => {
    const q = questionnaire.emploiType
    if (!q) return []
    const MAP: Record<string, Slot[]> = {
      cdi: [
        { docType: 'BULLETIN_PAIE_1', label: 'Bulletin de salaire M-1',    required: true,  help: 'Dernier bulletin de paie.' },
        { docType: 'BULLETIN_PAIE_2', label: 'Bulletin de salaire M-2',    required: true,  help: 'Avant-dernier bulletin.' },
        { docType: 'BULLETIN_PAIE_3', label: 'Bulletin de salaire M-3',    required: true,  help: '3e bulletin.' },
        { docType: 'AVIS_IMPOSITION', label: "Avis d'imposition N-1",      required: true,  help: 'Téléchargeable sur impots.gouv.fr.' },
      ],
      cdd_embauche: [
        { docType: 'BULLETIN_PAIE_1', label: 'Bulletin de salaire M-1',    required: true,  help: 'Dernier bulletin disponible.' },
        { docType: 'BULLETIN_PAIE_2', label: 'Bulletin de salaire M-2',    required: false, help: 'Avant-dernier bulletin si disponible.' },
        { docType: 'AVIS_IMPOSITION', label: "Avis d'imposition N-1",      required: true,  help: 'Téléchargeable sur impots.gouv.fr.' },
      ],
      independant: [
        { docType: 'AVIS_IMPOSITION',    label: "Avis d'imposition N-1",   required: true,  help: 'Dernier avis.' },
        { docType: 'AVIS_IMPOSITION_N2', label: "Avis d'imposition N-2",   required: false, help: 'Avant-dernier pour consolider le dossier.' },
      ],
      etudiant: [
        { docType: 'AVIS_IMPOSITION', label: "Avis d'imposition (ou des parents)", required: true, help: "Votre propre avis ou celui de vos parents si vous êtes rattaché(e) à leur foyer fiscal." },
      ],
      retraite: [
        { docType: 'JUSTIFICATIF_RETRAITE', label: 'Attestation de pension',   required: true, help: 'Dernière notification CARSAT ou caisse de retraite.' },
        { docType: 'AVIS_IMPOSITION',       label: "Avis d'imposition N-1",    required: true, help: 'Téléchargeable sur impots.gouv.fr.' },
      ],
      sans_emploi: [
        { docType: 'AVIS_IMPOSITION', label: "Avis d'imposition N-1", required: true, help: 'Ou tout justificatif de revenus (CAF, allocation…).' },
      ],
    }
    return MAP[q] ?? []
  }, [questionnaire.emploiType])

  const garantSlots = useMemo((): Slot[] => {
    const q = questionnaire.hasGarant
    if (!q || q === 'non') return []
    if (q === 'oui_visale') return [
      { docType: 'GARANT_VISALE', label: 'Attestation Visale / CLé', required: true, help: 'Attestation Action Logement téléchargeable sur visale.fr ou cle.actionlogement.fr.' },
    ]
    return [
      { docType: 'GARANT_CNI',        label: "Pièce d'identité du garant",    required: true,  help: 'CNI ou passeport en cours de validité.' },
      { docType: 'GARANT_CONTRAT',    label: 'Contrat de travail du garant',  required: false, help: 'Idéalement un CDI confirmé.' },
      { docType: 'GARANT_PAIE',       label: 'Bulletins de paie du garant',   required: false, help: '3 derniers bulletins.' },
      { docType: 'GARANT_IMPOSITION', label: "Avis d'imposition du garant",   required: false, help: 'Dernier avis.' },
      { docType: 'LETTRE_GARANT',     label: "Lettre d'engagement",           required: false, help: "Lettre signée d'engagement." },
    ]
  }, [questionnaire.hasGarant])

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalDocs  = CATEGORIES.reduce((n, c) => n + c.slots.length, 0)
  const filledDocs = CATEGORIES.reduce(
    (n, c) => n + c.slots.filter(s => documents.find(d => d.docType === s.docType)).length, 0,
  )
  const pct = totalDocs ? Math.round((filledDocs / totalDocs) * 100) : 0

  // ── Card wrapper ───────────────────────────────────────────────────────────
  const stepCard = (children: React.ReactNode) => (
    <div style={{
      background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
      borderRadius: 16, padding: '28px 28px 24px',
      boxShadow: BAI.shadowLg,
    }}>
      {children}
    </div>
  )

  // ── Info banner helper ──────────────────────────────────────────────────────
  const InfoBanner = ({ text }: { text: string }) => (
    <div style={{ padding: '12px 14px', borderRadius: 9, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, marginBottom: 14 }}>
      <p style={{ margin: 0, fontSize: 12, color: BAI.inkMid, lineHeight: 1.6, fontFamily: BAI.fontBody }}>{text}</p>
    </div>
  )

  // ── OVERVIEW MODE ──────────────────────────────────────────────────────────
  if (showOverview) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', background: BAI.bgBase, padding: '32px 0 64px', fontFamily: BAI.fontBody }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.tenant, margin: '0 0 6px' }}>
                  Locataire
                </p>
                <h1 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(30px,5vw,42px)', color: BAI.ink, margin: '0 0 6px', lineHeight: 1.1 }}>
                  Mon Dossier Locatif
                </h1>
                <p style={{ fontSize: 13, color: BAI.inkFaint, margin: 0 }}>
                  {filledDocs}/{totalDocs} documents · {pct}% complété
                </p>
              </div>
              <button
                onClick={() => goToStep(0)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                  color: BAI.inkMid, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Reprendre le guide
              </button>
            </div>

            {/* Progress bar */}
            {!loadingDocs && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ height: 5, borderRadius: 99, background: BAI.border }}>
                  <div style={{ height: '100%', borderRadius: 99, background: BAI.tenant, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {/* Profile summary */}
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.tenantBorder}`,
              borderRadius: 12, padding: '18px 20px',
              boxShadow: BAI.shadowMd, marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: BAI.tenantLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User style={{ width: 18, height: 18, color: BAI.tenant }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: BAI.inkFaint, marginTop: 2 }}>
                    {user?.birthDate ? `Né·e le ${new Date(user.birthDate).toLocaleDateString('fr-FR')}` : ''}
                    {user?.birthCity ? ` · ${user.birthCity}` : ''}
                    {user?.nationality ? ` · ${user.nationality}` : ''}
                  </p>
                </div>
              </div>
              <a href="/settings" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: BAI.tenant, textDecoration: 'none', fontWeight: 500, flexShrink: 0,
              }}>
                Modifier <ArrowRight style={{ width: 13, height: 13 }} />
              </a>
            </div>

            {/* Documents grid */}
            {loadingDocs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
                <Loader2 style={{ width: 22, height: 22, color: BAI.tenant }} className="animate-spin" />
                <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <CategoryAccordion
                    key={cat.id}
                    cat={cat}
                    documents={documents.filter(d => d.category === cat.id)}
                    onUpload={handleUpload}
                    onDelete={handleDelete}
                    onView={setViewerDoc}
                  />
                ))}
              </div>
            )}

            {/* Tips */}
            <div style={{
              background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
              borderRadius: 14, padding: '24px', boxShadow: BAI.shadowMd, marginTop: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <BookOpen style={{ width: 18, height: 18, color: BAI.caramel }} />
                <h2 style={{ margin: 0, fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: BAI.ink }}>
                  Constituer un dossier solide
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TIPS.map(tip => {
                  const TipIcon = tip.icon
                  return (
                    <div key={tip.title} style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <TipIcon style={{ width: 13, height: 13, color: BAI.caramel, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: BAI.fontBody, color: BAI.ink }}>{tip.title}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: BAI.inkMid, lineHeight: 1.6 }}>{tip.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        {viewerDoc && (
          <DocumentViewerModal
            fileUrl={viewerDoc.fileUrl}
            fileName={viewerDoc.fileName}
            onClose={() => setViewerDoc(null)}
          />
        )}
      </Layout>
    )
  }

  // ── STEPPER MODE ───────────────────────────────────────────────────────────
  // Step icons for the header row in each doc step
  const STEP_ICONS: Record<number, React.ElementType> = {
    1: CreditCard,
    2: Briefcase,
    3: TrendingUp,
    4: Home,
    5: Shield,
  }
  const CurrentStepIcon = STEP_ICONS[currentStep]

  const STEP_LABELS: Record<number, string> = {
    1: "Pièce d'identité",
    2: 'Situation professionnelle',
    3: 'Revenus',
    4: 'Justificatif de domicile',
    5: 'Garant',
  }

  const DOMICILE_SLOTS: Slot[] = [
    { docType: 'QUITTANCE_LOYER',       label: 'Quittance de loyer',    required: false, help: 'Les 3 dernières quittances de loyer de votre logement actuel.' },
    { docType: 'TAXE_FONCIERE',         label: 'Taxe foncière',         required: false, help: 'Uniquement si vous êtes propriétaire occupant.' },
    { docType: 'FACTURE_EDF',           label: 'Facture énergie / eau', required: false, help: 'Facture de moins de 3 mois à votre nom.' },
    { docType: 'JUSTIFICATIF_DOMICILE', label: 'Autre justificatif',    required: false, help: "Attestation d'hébergement manuscrite signée + CNI de l'hébergeant." },
  ]

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: BAI.bgBase, padding: '32px 0 64px', fontFamily: BAI.fontBody }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.tenant, margin: '0 0 6px' }}>
              Locataire
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(28px,5vw,40px)', color: BAI.ink, margin: 0, lineHeight: 1.1 }}>
                Mon Dossier Locatif
              </h1>
              <button
                onClick={() => goToStep(TOTAL_STEPS)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${BAI.border}`, background: BAI.bgSurface,
                  color: BAI.inkMid, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                <LayoutGrid style={{ width: 13, height: 13 }} />
                Voir tout
              </button>
            </div>
          </div>

          {/* Stepper header */}
          <StepperHeader current={currentStep} />

          {/* ── Step 0: Identité civile ───────────────────────────────────── */}
          {currentStep === 0 && stepCard(
            <>
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                  Qui êtes-vous ?
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                  Commençons par vos informations personnelles. Ces données ne vous seront demandées qu'une fois.
                </p>
              </div>

              {ocrResult && (
                <div style={{
                  marginBottom: 16, padding: '12px 16px', borderRadius: 10,
                  background: BAI.tenantLight, border: `1px solid ${BAI.tenantBorder}`,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: BAI.tenant, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: BAI.tenant }}>
                      Données extraites automatiquement
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: BAI.inkMid }}>
                      Vérifiez et corrigez si nécessaire avant de continuer.
                    </p>
                  </div>
                  <button
                    onClick={() => setOcrResult(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, flexShrink: 0 }}
                  >×</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
                <FormField
                  label="Prénom" value={form.firstName} required placeholder="Marie"
                  onChange={v => setForm(p => ({ ...p, firstName: v }))}
                />
                <FormField
                  label="Nom de famille" value={form.lastName} required placeholder="Martin"
                  onChange={v => setForm(p => ({ ...p, lastName: v }))}
                />
              </div>

              <div style={{ height: 1, background: BAI.border, margin: '4px 0 20px' }} />
              <p style={{ fontSize: 12, color: BAI.inkFaint, margin: '0 0 16px', fontStyle: 'italic' }}>
                Informations complémentaires (recommandées pour un dossier complet)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Date de naissance" type="date" value={form.birthDate}
                  onChange={v => setForm(p => ({ ...p, birthDate: v }))}
                />
                <FormField
                  label="Ville de naissance" placeholder="Paris" value={form.birthCity}
                  onChange={v => setForm(p => ({ ...p, birthCity: v }))}
                />
                <NationalitySearch
                  value={form.nationality}
                  onChange={v => setForm(p => ({ ...p, nationality: v }))}
                />
              </div>

              {formError && (
                <p style={{ marginTop: 12, fontSize: 12, color: '#9b1c1c' }}>{formError}</p>
              )}

              <StepNav
                isFirst={true}
                isLast={false}
                saving={saving}
                onBack={() => {}}
                onContinue={async () => {
                  const ok = await handleSaveProfile()
                  if (ok) goToStep(1)
                }}
              />
            </>,
          )}

          {/* ── Step 1: Pièce d'identité ──────────────────────────────────── */}
          {currentStep === 1 && stepCard(
            <>
              {/* Step header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CurrentStepIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CurrentStepIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {STEP_LABELS[1]}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    {questionnaire.idKind
                      ? 'Importez les documents correspondant à votre choix.'
                      : 'Sélectionnez le type de document que vous souhaitez fournir.'}
                  </p>
                </div>
              </div>

              {/* OCR banners */}
              {ocrSide === 'recto' && !documents.some(d => d.docType === 'CNI_VERSO') && (
                <div style={{
                  marginBottom: 10, padding: '12px 16px', borderRadius: 10,
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ArrowLeft style={{ width: 15, height: 15, color: '#1e40af', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e40af', fontFamily: BAI.fontBody }}>
                      Recto scanné — retournez votre carte
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#3b82f6', fontFamily: BAI.fontBody }}>
                      Photographiez maintenant le verso pour compléter votre dossier.
                    </p>
                  </div>
                  <button onClick={() => setOcrSide(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )}

              {nameWarning && (
                <div style={{
                  marginBottom: 10, padding: '12px 16px', borderRadius: 10,
                  background: BAI.errorLight, border: `1px solid rgba(155,28,28,0.25)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: BAI.error, fontFamily: BAI.fontBody }}>
                      Vérification d'identité
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: BAI.inkMid, fontFamily: BAI.fontBody }}>{nameWarning}</p>
                  </div>
                  <button onClick={() => setNameWarning('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BAI.inkFaint, fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              )}

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <>
                  {/* Questionnaire */}
                  <QuestionCard
                    question="Quel document d'identité souhaitez-vous fournir ?"
                    options={ID_OPTIONS}
                    value={questionnaire.idKind}
                    onChange={v => updateQuestionnaire('idKind', v)}
                  />

                  {questionnaire.idKind && (
                    <>
                      {/* Scanner CTA */}
                      <button
                        onClick={() => setShowIdentityCamera(true)}
                        style={{
                          width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none',
                          background: BAI.night, color: '#fff', fontSize: 13, fontWeight: 700,
                          fontFamily: BAI.fontBody, cursor: 'pointer', marginBottom: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        <Camera style={{ width: 16, height: 16 }} />
                        Scanner en live — détection automatique
                      </button>

                      {/* Separator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ flex: 1, height: 1, background: BAI.border }} />
                        <span style={{ fontSize: 11, color: BAI.inkFaint, fontFamily: BAI.fontBody }}>ou importer manuellement</span>
                        <div style={{ flex: 1, height: 1, background: BAI.border }} />
                      </div>

                      {/* Dynamic slots */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {idSlots.map(slot => (
                          <DocSlot
                            key={slot.docType}
                            slot={slot}
                            doc={documents.find(d => d.docType === slot.docType)}
                            onUpload={(file, docType) => handleUpload(file, 'IDENTITE', docType)}
                            onDelete={handleDelete}
                            onView={setViewerDoc}
                          />
                        ))}
                      </div>

                      {/* Camera capture */}
                      {showIdentityCamera && (
                        <CameraCapture
                          initialFamily={questionnaire.idKind as 'cni' | 'permis' | 'passport' | 'sejour'}
                          onComplete={async (captures: CaptureEntry[]) => {
                            setShowIdentityCamera(false)
                            for (const { file, docType: dt } of captures) {
                              await handleUpload(file, 'IDENTITE', dt).catch(() => toast.error("Erreur d'envoi"))
                            }
                          }}
                          onClose={() => setShowIdentityCamera(false)}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              <StepNav
                isFirst={false}
                isLast={false}
                onBack={() => goToStep(0)}
                onContinue={() => goToStep(2)}
              />
            </>,
          )}

          {/* ── Step 2: Emploi ────────────────────────────────────────────── */}
          {currentStep === 2 && stepCard(
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CurrentStepIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CurrentStepIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {STEP_LABELS[2]}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    {questionnaire.emploiType
                      ? 'Importez le justificatif correspondant à votre situation.'
                      : 'Sélectionnez votre situation professionnelle actuelle.'}
                  </p>
                </div>
              </div>

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <>
                  <QuestionCard
                    question="Quelle est votre situation professionnelle ?"
                    options={EMPLOI_OPTIONS}
                    value={questionnaire.emploiType}
                    onChange={v => updateQuestionnaire('emploiType', v)}
                  />

                  {questionnaire.emploiType && emploiSlots.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {emploiSlots.map(slot => (
                        <DocSlot
                          key={slot.docType}
                          slot={slot}
                          doc={documents.find(d => d.docType === slot.docType)}
                          onUpload={(file, docType) => handleUpload(file, 'EMPLOI', docType)}
                          onDelete={handleDelete}
                          onView={setViewerDoc}
                        />
                      ))}
                    </div>
                  )}

                  {questionnaire.emploiType === 'etudiant' && emploiSlots.length === 0 && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
                      <p style={{ margin: 0, fontSize: 13, color: BAI.inkMid, fontFamily: BAI.fontBody, lineHeight: 1.6 }}>
                        Pour un dossier étudiant, aucun contrat de travail n'est requis. Vos revenus seront justifiés à l'étape suivante.
                      </p>
                    </div>
                  )}

                  {questionnaire.emploiType === 'sans_emploi' && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
                      <p style={{ margin: 0, fontSize: 13, color: BAI.inkMid, fontFamily: BAI.fontBody, lineHeight: 1.6 }}>
                        Vous pouvez passer directement à l'étape Revenus pour justifier vos ressources (allocations, CAF…).
                      </p>
                    </div>
                  )}
                </>
              )}

              <StepNav
                isFirst={false}
                isLast={false}
                onBack={() => goToStep(1)}
                onContinue={() => goToStep(3)}
              />
            </>,
          )}

          {/* ── Step 3: Revenus ───────────────────────────────────────────── */}
          {currentStep === 3 && stepCard(
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CurrentStepIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CurrentStepIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {STEP_LABELS[3]}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    Justifiez vos revenus selon votre situation professionnelle.
                  </p>
                </div>
              </div>

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <>
                  {!questionnaire.emploiType && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}`, marginBottom: 14 }}>
                      <p style={{ margin: 0, fontSize: 13, color: BAI.inkMid, fontFamily: BAI.fontBody }}>
                        Définissez d'abord votre situation professionnelle (étape précédente) pour voir les documents adaptés.
                      </p>
                    </div>
                  )}

                  {questionnaire.emploiType && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {revenusSlots.map(slot => (
                        <DocSlot
                          key={slot.docType}
                          slot={slot}
                          doc={documents.find(d => d.docType === slot.docType)}
                          onUpload={(file, docType) => handleUpload(file, 'REVENUS', docType)}
                          onDelete={handleDelete}
                          onView={setViewerDoc}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <StepNav
                isFirst={false}
                isLast={false}
                onBack={() => goToStep(2)}
                onContinue={() => goToStep(4)}
              />
            </>,
          )}

          {/* ── Step 4: Domicile ──────────────────────────────────────────── */}
          {currentStep === 4 && stepCard(
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CurrentStepIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CurrentStepIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {STEP_LABELS[4]}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    Quittance de loyer, taxe foncière ou facture de moins de 3 mois.
                  </p>
                </div>
              </div>

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <>
                  <InfoBanner text="Fournissez UN justificatif de domicile à votre nom de moins de 3 mois. Choisissez celui que vous avez disponible." />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {DOMICILE_SLOTS.map(slot => (
                      <DocSlot
                        key={slot.docType}
                        slot={slot}
                        doc={documents.find(d => d.docType === slot.docType)}
                        onUpload={(file, docType) => handleUpload(file, 'DOMICILE', docType)}
                        onDelete={handleDelete}
                        onView={setViewerDoc}
                      />
                    ))}
                  </div>
                </>
              )}

              <StepNav
                isFirst={false}
                isLast={false}
                onBack={() => goToStep(3)}
                onContinue={() => goToStep(5)}
              />
            </>,
          )}

          {/* ── Step 5: Garanties ─────────────────────────────────────────── */}
          {currentStep === 5 && stepCard(
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                {CurrentStepIcon && (
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: BAI.tenantLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CurrentStepIcon style={{ width: 20, height: 20, color: BAI.tenant }} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontSize: 26, fontWeight: 700, color: BAI.ink }}>
                    {STEP_LABELS[5]}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: BAI.inkFaint }}>
                    {questionnaire.hasGarant
                      ? 'Importez les documents du garant ci-dessous.'
                      : 'Documents du garant (facultatif mais valorisant si revenus < 3× loyer).'}
                  </p>
                </div>
              </div>

              {loadingDocs ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
                  <Loader2 style={{ width: 20, height: 20, color: BAI.tenant }} className="animate-spin" />
                  <span style={{ fontSize: 13, color: BAI.inkFaint }}>Chargement…</span>
                </div>
              ) : (
                <>
                  <QuestionCard
                    question="Avez-vous un garant pour votre dossier ?"
                    options={GARANT_OPTIONS}
                    value={questionnaire.hasGarant}
                    onChange={v => updateQuestionnaire('hasGarant', v)}
                  />

                  {questionnaire.hasGarant === 'non' && (
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: BAI.bgMuted, border: `1px solid ${BAI.border}` }}>
                      <p style={{ margin: 0, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, fontFamily: BAI.fontBody }}>
                        Sans garant, il est recommandé que vos revenus soient supérieurs à 3 fois le loyer mensuel.
                      </p>
                    </div>
                  )}

                  {questionnaire.hasGarant && questionnaire.hasGarant !== 'non' && garantSlots.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {garantSlots.map(slot => (
                        <DocSlot
                          key={slot.docType}
                          slot={slot}
                          doc={documents.find(d => d.docType === slot.docType)}
                          onUpload={(file, docType) => handleUpload(file, 'GARANTIES', docType)}
                          onDelete={handleDelete}
                          onView={setViewerDoc}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <StepNav
                isFirst={false}
                isLast={true}
                onBack={() => goToStep(4)}
                onContinue={() => goToStep(TOTAL_STEPS)}
                onSkip={() => goToStep(TOTAL_STEPS)}
                continueLabel="Terminer"
              />
            </>,
          )}

          {/* Footer hint */}
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: BAI.inkFaint }}>
            Vous pouvez revenir à tout moment compléter ou modifier votre dossier.
          </p>
        </div>
      </div>

      {viewerDoc && (
        <DocumentViewerModal
          fileUrl={viewerDoc.fileUrl}
          fileName={viewerDoc.fileName}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </Layout>
  )
}
