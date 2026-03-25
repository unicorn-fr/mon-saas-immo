import { useState, useEffect, useRef, useCallback } from 'react'
import {
  User, Briefcase, TrendingUp, Home, Shield,
  Upload, Eye, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, BookOpen, Star, Info, ArrowRight,
} from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { dossierService, TenantDocument } from '../../services/dossierService'
import { DocumentViewerModal } from '../../components/document/DocumentViewerModal'
import toast from 'react-hot-toast'

// ── Design tokens ──────────────────────────────────────────────────────────────
const M = {
  bg:           '#fafaf8',
  surface:      '#ffffff',
  muted:        '#f4f2ee',
  inputBg:      '#f8f7f4',
  ink:          '#0d0c0a',
  inkMid:       '#5a5754',
  inkFaint:     '#9e9b96',
  tenant:       '#1b5e3b',
  tenantLight:  '#edf7f2',
  tenantBorder: '#9fd4ba',
  border:       '#e4e1db',
  borderMid:    '#ccc9c3',
  caramel:      '#c4976a',
  caramelLight: '#fdf5ec',
  danger:       '#9b1c1c',
  dangerBg:     '#fef2f2',
  display:      "'Cormorant Garamond', Georgia, serif",
  body:         "'DM Sans', system-ui, sans-serif",
  shadow:       '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)',
}

// ── Document categories & slots ────────────────────────────────────────────────
interface Slot { docType: string; label: string; required: boolean }
interface Category { id: string; label: string; hint: string; icon: React.ElementType; slots: Slot[] }

const CATEGORIES: Category[] = [
  {
    id: 'IDENTITE', label: 'Pièce d\'identité', icon: User,
    hint: 'Carte nationale d\'identité ou passeport en cours de validité.',
    slots: [
      { docType: 'CNI_RECTO',    label: 'CNI recto',       required: true  },
      { docType: 'CNI_VERSO',    label: 'CNI verso',        required: false },
      { docType: 'PASSEPORT',    label: 'Passeport',        required: false },
      { docType: 'TITRE_SEJOUR', label: 'Titre de séjour',  required: false },
    ],
  },
  {
    id: 'EMPLOI', label: 'Situation professionnelle', icon: Briefcase,
    hint: 'Contrat de travail ou équivalent prouvant votre activité.',
    slots: [
      { docType: 'CONTRAT_TRAVAIL',       label: 'Contrat de travail',        required: true  },
      { docType: 'PROMESSE_EMBAUCHE',     label: 'Promesse d\'embauche',      required: false },
      { docType: 'KBIS_EXTRAIT',          label: 'Extrait KBIS (indépendant)',required: false },
      { docType: 'JUSTIFICATIF_RETRAITE', label: 'Justificatif de retraite',  required: false },
    ],
  },
  {
    id: 'REVENUS', label: 'Revenus', icon: TrendingUp,
    hint: 'Trois derniers bulletins de salaire + dernier avis d\'imposition.',
    slots: [
      { docType: 'BULLETIN_PAIE_1',    label: 'Bulletin de salaire M-1', required: true  },
      { docType: 'BULLETIN_PAIE_2',    label: 'Bulletin de salaire M-2', required: true  },
      { docType: 'BULLETIN_PAIE_3',    label: 'Bulletin de salaire M-3', required: true  },
      { docType: 'AVIS_IMPOSITION',    label: 'Avis d\'imposition N-1',  required: true  },
      { docType: 'AVIS_IMPOSITION_N2', label: 'Avis d\'imposition N-2',  required: false },
    ],
  },
  {
    id: 'DOMICILE', label: 'Justificatif de domicile', icon: Home,
    hint: 'Quittance de loyer, taxe foncière ou facture de moins de 3 mois.',
    slots: [
      { docType: 'QUITTANCE_LOYER',         label: 'Quittance de loyer',       required: false },
      { docType: 'TAXE_FONCIERE',           label: 'Taxe foncière',            required: false },
      { docType: 'FACTURE_EDF',             label: 'Facture énergie / eau',    required: false },
      { docType: 'JUSTIFICATIF_DOMICILE',   label: 'Autre justificatif',       required: false },
    ],
  },
  {
    id: 'GARANTIES', label: 'Garant', icon: Shield,
    hint: 'Documents du garant (facultatif mais valorisant si revenus < 3× loyer).',
    slots: [
      { docType: 'GARANT_CNI',        label: 'CNI du garant',              required: false },
      { docType: 'GARANT_CONTRAT',    label: 'Contrat de travail du garant',required: false },
      { docType: 'GARANT_PAIE',       label: 'Bulletins de salaire garant', required: false },
      { docType: 'GARANT_IMPOSITION', label: 'Avis d\'imposition garant',   required: false },
      { docType: 'LETTRE_GARANT',     label: 'Lettre d\'engagement',        required: false },
    ],
  },
]

// ── Tips ───────────────────────────────────────────────────────────────────────
const TIPS = [
  {
    icon: Star,
    title: 'Complétez au maximum',
    body: 'Un dossier complet est traité en priorité. Même sans garant, ajouter tous vos justificatifs rassure immédiatement le propriétaire.',
  },
  {
    icon: Eye,
    title: 'Lisibilité avant tout',
    body: 'Scannez en haute résolution ou photographiez à plat, avec un éclairage uniforme. Un document flou ou coupé est souvent refusé sans même être lu.',
  },
  {
    icon: Shield,
    title: 'Un garant augmente vos chances',
    body: 'Si vos revenus sont inférieurs à 3× le loyer, joindre un garant solide (parent, employeur, organisme type Visale) peut être décisif.',
  },
  {
    icon: BookOpen,
    title: 'Soignez la cohérence',
    body: 'Assurez-vous que votre adresse, votre nom et vos revenus sont cohérents entre tous vos documents. Les incohérences créent des doutes.',
  },
  {
    icon: Info,
    title: 'Anticipez les demandes',
    body: 'Certains propriétaires demandent aussi une attestation employeur ou un relevé de compte. Préparez-les à l\'avance pour répondre vite.',
  },
]

// ── Sub-component: single document slot ───────────────────────────────────────
function DocSlot({
  slot, doc,
  onUpload, onDelete, onView,
}: {
  slot: Slot
  doc: TenantDocument | undefined
  onUpload: (file: File, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView: (doc: TenantDocument) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try { await onUpload(file, slot.docType) }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!doc) return
    setDeleting(true)
    try { await onDelete(doc.id) }
    finally { setDeleting(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 14px',
      border: `1px solid ${doc ? M.tenantBorder : M.border}`,
      borderRadius: 10,
      background: doc ? M.tenantLight : M.surface,
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Label + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {doc
          ? <CheckCircle2 style={{ width: 15, height: 15, color: M.tenant, flexShrink: 0 }} />
          : <div style={{
              width: 15, height: 15, borderRadius: '50%',
              border: `2px solid ${slot.required ? M.caramel : M.borderMid}`,
              flexShrink: 0,
            }} />
        }
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontFamily: M.body, margin: 0,
            color: doc ? M.tenant : M.ink,
            fontWeight: doc ? 600 : slot.required ? 500 : 400,
          }}>
            {slot.label}
            {slot.required && !doc && (
              <span style={{ marginLeft: 4, fontSize: 11, color: M.caramel }}>·&nbsp;requis</span>
            )}
          </p>
          {doc && (
            <p style={{ fontSize: 11, color: M.inkFaint, fontFamily: M.body, margin: 0, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
              {doc.fileName}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {doc ? (
          <>
            <button
              onClick={() => onView(doc)}
              style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${M.tenantBorder}`, background: M.surface, color: M.tenant, fontSize: 12, fontFamily: M.body, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Eye style={{ width: 12, height: 12 }} />
              Voir
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${M.border}`, background: M.surface, color: deleting ? M.inkFaint : M.danger, fontSize: 12, cursor: deleting ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {deleting ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Trash2 style={{ width: 12, height: 12 }} />}
            </button>
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { handleFile(f); e.target.value = '' }
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '5px 12px', borderRadius: 7,
                border: `1px solid ${M.borderMid}`,
                background: uploading ? M.muted : M.surface,
                color: uploading ? M.inkFaint : M.inkMid,
                fontSize: 12, fontFamily: M.body, cursor: uploading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {uploading
                ? <><Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />Envoi…</>
                : <><Upload style={{ width: 12, height: 12 }} />Ajouter</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-component: category accordion ─────────────────────────────────────────
function CategorySection({
  cat, documents, onUpload, onDelete, onView,
}: {
  cat: Category
  documents: TenantDocument[]
  onUpload: (file: File, category: string, docType: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onView: (doc: TenantDocument) => void
}) {
  const [open, setOpen] = useState(true)
  const CatIcon = cat.icon

  const filled = cat.slots.filter(s => documents.find(d => d.docType === s.docType)).length
  const total  = cat.slots.length
  const allDone = filled === total
  const hasDocs = filled > 0

  return (
    <div style={{ border: `1px solid ${M.border}`, borderRadius: 12, overflow: 'hidden', background: M.surface, boxShadow: M.shadow }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: hasDocs ? M.tenantLight : M.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CatIcon style={{ width: 16, height: 16, color: hasDocs ? M.tenant : M.inkFaint }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, fontFamily: M.body, color: M.ink }}>{cat.label}</p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: M.body, color: M.inkFaint, marginTop: 1 }}>
              {filled}/{total} document{total > 1 ? 's' : ''} · {cat.hint}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone && <span style={{ fontSize: 11, fontFamily: M.body, color: M.tenant, fontWeight: 600, background: M.tenantLight, border: `1px solid ${M.tenantBorder}`, borderRadius: 20, padding: '2px 8px' }}>Complet</span>}
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: M.inkFaint }} />
            : <ChevronDown style={{ width: 16, height: 16, color: M.inkFaint }} />
          }
        </div>
      </button>

      {/* Slots */}
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${M.border}` }}>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DossierLocatif() {
  const { user, updateProfile } = useAuth()
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [viewerDoc, setViewerDoc] = useState<TenantDocument | null>(null)

  // Civil info form state
  const profileComplete = !!(user?.birthDate && user?.birthCity && user?.nationality)
  const [form, setForm] = useState({
    firstName:  user?.firstName  ?? '',
    lastName:   user?.lastName   ?? '',
    birthDate:  user?.birthDate  ? user.birthDate.slice(0, 10) : '',
    birthCity:  user?.birthCity  ?? '',
    nationality: user?.nationality ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Load documents on mount
  useEffect(() => {
    dossierService.getDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Impossible de charger vos documents'))
      .finally(() => setLoadingDocs(false))
  }, [])

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      setForm({
        firstName:   user.firstName  ?? '',
        lastName:    user.lastName   ?? '',
        birthDate:   user.birthDate  ? user.birthDate.slice(0, 10) : '',
        birthCity:   user.birthCity  ?? '',
        nationality: user.nationality ?? '',
      })
    }
  }, [user?.id])

  const handleSaveProfile = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || !form.birthCity.trim() || !form.nationality.trim()) {
      setFormError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      await updateProfile({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        birthDate:   form.birthDate,
        birthCity:   form.birthCity.trim(),
        nationality: form.nationality.trim(),
      })
      toast.success('Informations enregistrées')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = useCallback(async (file: File, category: string, docType: string) => {
    try {
      const doc = await dossierService.uploadDocument(category, docType, file)
      setDocuments(prev => {
        const filtered = prev.filter(d => !(d.category === category && d.docType === docType))
        return [doc, ...filtered]
      })
      toast.success('Document ajouté')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'upload'
      toast.error(msg)
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await dossierService.deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Impossible de supprimer ce document')
    }
  }, [])

  const field = (id: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, fontFamily: M.body, color: M.inkMid }}>
        {label} <span style={{ color: M.caramel }}>*</span>
      </label>
      <input
        type={type}
        value={form[id]}
        onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
        placeholder={placeholder}
        style={{
          padding: '9px 12px', borderRadius: 8, border: `1px solid ${M.border}`,
          background: M.inputBg, fontSize: 13, fontFamily: M.body, color: M.ink,
          outline: 'none',
        }}
      />
    </div>
  )

  const totalDocs = CATEGORIES.reduce((n, c) => n + c.slots.length, 0)
  const filledDocs = CATEGORIES.reduce((n, c) => n + c.slots.filter(s => documents.find(d => d.docType === s.docType)).length, 0)
  const pct = totalDocs ? Math.round((filledDocs / totalDocs) * 100) : 0

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: M.bg, padding: '32px 0 64px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 10, fontFamily: M.body, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: M.tenant, margin: '0 0 6px' }}>
              Locataire
            </p>
            <h1 style={{ fontFamily: M.display, fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(32px, 6vw, 44px)', color: M.ink, margin: '0 0 8px', lineHeight: 1.1 }}>
              Mon Dossier Locatif
            </h1>
            <p style={{ fontSize: 14, fontFamily: M.body, color: M.inkMid, margin: 0 }}>
              Constituez votre dossier à votre rythme — enregistrez vos informations et ajoutez vos pièces justificatives quand vous êtes prêt.
            </p>

            {/* Progress bar */}
            {!loadingDocs && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: M.body, color: M.inkFaint }}>Avancement</span>
                  <span style={{ fontSize: 12, fontFamily: M.body, color: M.tenant, fontWeight: 600 }}>{filledDocs}/{totalDocs} pièces · {pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: M.border }}>
                  <div style={{ height: '100%', borderRadius: 99, background: M.tenant, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* ── Civil Info Section ───────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            {profileComplete ? (
              /* Summary card */
              <div style={{ background: M.surface, border: `1px solid ${M.tenantBorder}`, borderRadius: 12, padding: '18px 20px', boxShadow: M.shadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: M.tenantLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User style={{ width: 18, height: 18, color: M.tenant }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: M.body, fontSize: 14, fontWeight: 600, color: M.ink }}>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p style={{ margin: 0, fontFamily: M.body, fontSize: 12, color: M.inkFaint, marginTop: 2 }}>
                      Né·e le {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : '—'}
                      {user?.birthCity ? ` · ${user.birthCity}` : ''}
                      {user?.nationality ? ` · ${user.nationality}` : ''}
                    </p>
                  </div>
                </div>
                <a
                  href="/settings"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: M.body, color: M.tenant, textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}
                >
                  Modifier <ArrowRight style={{ width: 13, height: 13 }} />
                </a>
              </div>
            ) : (
              /* Inline form for new users */
              <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 14, padding: '24px', boxShadow: M.shadow }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ margin: '0 0 4px', fontFamily: M.display, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: M.ink }}>
                    Informations civiles
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, fontFamily: M.body, color: M.inkFaint }}>
                    Ces informations ne vous seront demandées qu'une seule fois. Vous pourrez les modifier dans vos <a href="/settings" style={{ color: M.tenant, textDecoration: 'none' }}>Paramètres</a>.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {field('firstName',   'Prénom',                  'text', 'Marie')}
                  {field('lastName',    'Nom de famille',           'text', 'Martin')}
                  {field('birthDate',   'Date de naissance',        'date')}
                  {field('birthCity',   'Ville de naissance',       'text', 'Paris')}
                  {field('nationality', 'Nationalité',              'text', 'Française')}
                </div>

                {formError && (
                  <p style={{ marginTop: 12, fontSize: 12, fontFamily: M.body, color: M.danger }}>{formError}</p>
                )}

                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{
                      padding: '10px 22px', borderRadius: 9, border: 'none',
                      background: saving ? M.inkFaint : M.tenant,
                      color: '#ffffff', fontSize: 13, fontFamily: M.body, fontWeight: 600,
                      cursor: saving ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                  >
                    {saving
                      ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Enregistrement…</>
                      : <>Enregistrer mes informations</>
                    }
                  </button>
                  <p style={{ margin: 0, fontSize: 12, fontFamily: M.body, color: M.inkFaint }}>
                    Vous pouvez ajouter vos documents maintenant ou plus tard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Documents Section ────────────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: M.display, fontStyle: 'italic', fontSize: 24, fontWeight: 700, color: M.ink, margin: '0 0 4px' }}>
              Pièces justificatives
            </h2>
            <p style={{ fontSize: 13, fontFamily: M.body, color: M.inkFaint, margin: '0 0 18px' }}>
              PDF, JPEG, PNG ou WebP · 5 Mo max par fichier. Formats acceptés&nbsp;: scan, photo ou export numérique.
            </p>

            {loadingDocs ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
                <Loader2 style={{ width: 22, height: 22, color: M.tenant }} className="animate-spin" />
                <span style={{ fontSize: 13, fontFamily: M.body, color: M.inkFaint }}>Chargement…</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {CATEGORIES.map(cat => (
                  <CategorySection
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
          </div>

          {/* ── Tips Section ─────────────────────────────────────────────── */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: 14, padding: '24px', boxShadow: M.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <BookOpen style={{ width: 18, height: 18, color: M.caramel }} />
              <h2 style={{ margin: 0, fontFamily: M.display, fontStyle: 'italic', fontSize: 22, fontWeight: 700, color: M.ink }}>
                Constituer un dossier solide
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {TIPS.map(tip => {
                const TipIcon = tip.icon
                return (
                  <div key={tip.title} style={{ padding: '14px 16px', borderRadius: 10, background: M.muted, border: `1px solid ${M.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <TipIcon style={{ width: 14, height: 14, color: M.caramel, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: M.body, color: M.ink }}>{tip.title}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontFamily: M.body, color: M.inkMid, lineHeight: 1.6 }}>{tip.body}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Document viewer */}
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
