/**
 * DossierWizard — Modal étape par étape pour constituer le dossier locatif
 * Apple style · 5 étapes · aucune donnée sensible demandée
 */
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ChevronLeft, Upload, CheckCircle,
  User, Briefcase, TrendingUp, Home, Shield, Loader2, Check, Lock,
} from 'lucide-react'
import { dossierService, TenantDocument } from '../../services/dossierService'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UploadSlot {
  docType:  string
  category: string
  label:    string
  hint:     string
  required: boolean
}

interface TextField {
  key:         string
  label:       string
  type:        'text' | 'date' | 'select' | 'number'
  required:    boolean
  placeholder: string
  options?:    string[]
}

interface WizardStep {
  id:       string
  title:    string
  subtitle: string
  icon:     React.ElementType
  fields:   TextField[]
  uploads:  UploadSlot[]
  note?:    string
}

type SlotState = { file?: File; uploading: boolean; done: boolean; error?: string }

// ── Step definitions ───────────────────────────────────────────────────────────

const STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Informations personnelles',
    subtitle: 'Nom, prénom et quelques informations de base',
    icon: User,
    fields: [
      { key: 'firstName',   label: 'Prénom',            type: 'text', required: true,  placeholder: 'Marie' },
      { key: 'lastName',    label: 'Nom de famille',    type: 'text', required: true,  placeholder: 'DUPONT' },
      { key: 'birthDate',   label: 'Date de naissance', type: 'date', required: false, placeholder: '' },
      { key: 'birthCity',   label: 'Ville de naissance',type: 'text', required: false, placeholder: 'Paris' },
      { key: 'nationality', label: 'Nationalité',       type: 'text', required: false, placeholder: 'Française' },
    ],
    uploads: [],
    note: "Aucun numéro de sécurité sociale ni numéro de document n'est requis. Vos données sont chiffrées.",
  },
  {
    id: 'identity',
    title: "Pièce d'identité",
    subtitle: 'CNI, passeport ou titre de séjour en cours de validité',
    icon: User,
    fields: [],
    uploads: [
      { docType: 'CNI_RECTO',     category: 'IDENTITE', label: 'CNI – Face avant',            hint: 'Photo, nom, prénom',   required: true  },
      { docType: 'CNI_VERSO',     category: 'IDENTITE', label: 'CNI – Face arrière',           hint: 'Zone MRZ au dos',      required: false },
      { docType: 'PASSEPORT',     category: 'IDENTITE', label: 'Passeport (si pas de CNI)',    hint: 'Page biométrique',     required: false },
      { docType: 'TITRE_SEJOUR',  category: 'IDENTITE', label: 'Titre de séjour (si applicable)', hint: 'En cours de validité', required: false },
    ],
    note: "Votre numéro de pièce d'identité n'est jamais affiché ni stocké en clair. Seule l'image est conservée de façon sécurisée.",
  },
  {
    id: 'employment',
    title: 'Situation professionnelle',
    subtitle: 'Votre contrat de travail ou justificatif d\'activité',
    icon: Briefcase,
    fields: [
      {
        key: 'contractType', label: 'Type de contrat', type: 'select', required: false, placeholder: '',
        options: ['CDI', 'CDD', 'Alternance / Apprentissage', 'Indépendant / Auto-entrepreneur', 'Fonctionnaire', 'Étudiant', 'Retraité', 'Sans emploi'],
      },
      { key: 'employerName', label: "Nom de l'employeur", type: 'text',   required: false, placeholder: 'Société XYZ' },
      { key: 'netSalary',    label: 'Salaire net mensuel (€)',type: 'number', required: false, placeholder: '2 500' },
    ],
    uploads: [
      { docType: 'CONTRAT_TRAVAIL',    category: 'EMPLOI', label: 'Contrat de travail',       hint: 'CDI, CDD, alternance…',         required: true  },
      { docType: 'KBIS',               category: 'EMPLOI', label: 'Kbis (si indépendant)',     hint: 'Extrait < 3 mois',              required: false },
      { docType: 'ATTESTATION_EMPLOI', category: 'EMPLOI', label: 'Attestation employeur',     hint: 'Sur papier à en-tête',          required: false },
    ],
  },
  {
    id: 'income',
    title: 'Justificatifs de revenus',
    subtitle: 'Bulletins de salaire et avis d\'imposition',
    icon: TrendingUp,
    fields: [],
    uploads: [
      { docType: 'BULLETIN_1',        category: 'REVENUS', label: 'Bulletin de salaire M-1',       hint: 'Le mois le plus récent',  required: true  },
      { docType: 'BULLETIN_2',        category: 'REVENUS', label: 'Bulletin de salaire M-2',       hint: 'Avant-dernier mois',      required: true  },
      { docType: 'BULLETIN_3',        category: 'REVENUS', label: 'Bulletin de salaire M-3',       hint: 'Il y a 3 mois',           required: false },
      { docType: 'AVIS_IMPOSITION_1', category: 'REVENUS', label: "Avis d'imposition N-1",         hint: 'Dernier avis reçu',       required: true  },
    ],
    note: 'Vos bulletins sont chiffrés AES-256. Seuls les propriétaires que vous choisissez y ont accès.',
  },
  {
    id: 'address',
    title: 'Justificatif de domicile',
    subtitle: 'Facture ou quittance de moins de 3 mois',
    icon: Home,
    fields: [],
    uploads: [
      { docType: 'JUSTIFICATIF_DOMICILE', category: 'DOMICILE', label: 'Justificatif de domicile', hint: 'Facture EDF, eau, Internet…', required: true  },
      { docType: 'QUITTANCE_1',           category: 'DOMICILE', label: 'Quittance de loyer',        hint: 'La plus récente (optionnel)', required: false },
    ],
  },
  {
    id: 'guarantees',
    title: 'Garanties (optionnel)',
    subtitle: 'Attestation Visale ou acte de cautionnement',
    icon: Shield,
    fields: [],
    uploads: [
      { docType: 'ATTESTATION_VISALE',   category: 'GARANTIES', label: 'Attestation Visale',      hint: 'Garantie Action Logement', required: false },
      { docType: 'ACTE_CAUTION',         category: 'GARANTIES', label: 'Acte de cautionnement',   hint: 'Signé par le garant',      required: false },
      { docType: 'ASSURANCE_HABITATION', category: 'GARANTIES', label: 'Assurance habitation',    hint: 'Attestation valide',       required: false },
    ],
    note: 'Cette étape est entièrement optionnelle. Elle renforce significativement votre dossier.',
  },
]

// ── WizardUploadSlot — sub-component with its own ref ─────────────────────────

function WizardUploadSlot({
  slot, state, existing, onFileSelect,
}: {
  slot: UploadSlot
  state: SlotState | undefined
  existing: TenantDocument | undefined
  onFileSelect: (slot: UploadSlot, file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isDone = state?.done || !!existing
  const isUploading = state?.uploading ?? false

  return (
    <div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: '#1d1d1f' }}>
        {slot.label}
        {slot.required && <span className="text-red-400 ml-1 text-xs">*</span>}
        {!slot.required && <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b]">Optionnel</span>}
      </p>
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
          isDone
            ? 'border-emerald-300 bg-emerald-50 cursor-pointer'
            : isUploading
            ? 'border-blue-200 bg-blue-50/40 cursor-wait'
            : 'border-dashed border-[#e4e1db] hover:border-[#1b5e3b] hover:bg-[#edf7f2]/30 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(slot, f); e.target.value = '' }}
        />
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDone ? 'bg-emerald-100' : 'bg-[#f5f5f7]'
        }`}>
          {isUploading
            ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            : isDone
            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
            : <Upload className="w-4 h-4 text-[#86868b]" />}
        </div>

        <div className="flex-1 min-w-0">
          {isDone ? (
            <>
              <p className="text-sm font-medium text-emerald-700 truncate">
                {state?.file?.name ?? existing?.fileName ?? 'Document ajouté'}
              </p>
              <p className="text-[11px] text-emerald-600">Enregistré avec succès</p>
            </>
          ) : isUploading ? (
            <>
              <p className="text-sm font-medium text-blue-600 truncate">{state?.file?.name}</p>
              <p className="text-[11px] text-blue-500">Envoi en cours…</p>
            </>
          ) : (
            <>
              <p className="text-sm text-[#515154]">{slot.hint}</p>
              <p className="text-[11px] text-[#86868b]">PDF, JPG ou PNG · max 5 Mo</p>
            </>
          )}
        </div>

        {isDone && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            className="text-[11px] font-medium text-[#1b5e3b] hover:underline flex-shrink-0 px-2 py-1"
          >
            Remplacer
          </button>
        )}
      </div>
      {state?.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function DossierWizard({
  onClose,
  onDocumentUploaded,
  existingDocs,
}: {
  onClose:             () => void
  onDocumentUploaded:  (doc: TenantDocument) => void
  existingDocs:        TenantDocument[]
}) {
  const [step,         setStep]         = useState(0)
  const [direction,    setDirection]    = useState<1 | -1>(1)
  const [formData,     setFormData]     = useState<Record<string, string>>({})
  const [slotStates,   setSlotStates]   = useState<Record<string, SlotState>>({})
  const [savingProfile,setSavingProfile]= useState(false)

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  // ── Field change ────────────────────────────────────────────────────────────
  const handleField = useCallback((key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }))
  }, [])

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (slot: UploadSlot, file: File) => {
    setSlotStates((p) => ({ ...p, [slot.docType]: { file, uploading: true, done: false } }))
    try {
      const doc = await dossierService.uploadDocument(slot.category, slot.docType, file)
      onDocumentUploaded(doc)
      setSlotStates((p) => ({ ...p, [slot.docType]: { file, uploading: false, done: true } }))
      toast.success(`${slot.label} enregistré`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi'
      setSlotStates((p) => ({ ...p, [slot.docType]: { file, uploading: false, done: false, error: msg } }))
      toast.error(msg)
    }
  }, [onDocumentUploaded])

  // ── Save profile (non-blocking) ─────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    const hasData = Object.values(formData).some(Boolean)
    if (!hasData) return
    try {
      const salary = formData.netSalary ? parseFloat(formData.netSalary.replace(/\s/g, '').replace(',', '.')) : undefined
      await dossierService.saveProfile({
        firstName:    formData.firstName    || undefined,
        lastName:     formData.lastName     || undefined,
        birthDate:    formData.birthDate    || undefined,
        birthCity:    formData.birthCity    || undefined,
        nationality:  formData.nationality  || undefined,
        contractType: formData.contractType || undefined,
        employerName: formData.employerName || undefined,
        netSalary:    salary && !isNaN(salary) ? salary : undefined,
      })
    } catch { /* non-blocking — wizard continues */ }
  }, [formData])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const canProceed = () => {
    return current.fields
      .filter((f) => f.required)
      .every((f) => !!formData[f.key]?.trim())
  }

  const goNext = async () => {
    if (step === 0 || step === 2) void saveProfile()
    if (isLast) {
      setSavingProfile(true)
      await saveProfile()
      setSavingProfile(false)
      toast.success('Dossier constitué !', { icon: '🎉' })
      onClose()
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goPrev = () => {
    if (step === 0) { onClose(); return }
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const allOptional = !current.fields.some((f) => f.required) && current.uploads.every((u) => !u.required)
  const anyUploading = Object.values(slotStates).some((s) => s.uploading)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          backgroundColor: '#ffffff',
          maxHeight: '90vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #d2d2d7' }}>
          {/* Step pills */}
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200"
                  style={{
                    backgroundColor: i < step ? '#10b981' : i === step ? '#1b5e3b' : '#f5f5f7',
                    color:           i < step || i === step ? '#ffffff' : '#86868b',
                  }}
                >
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-0.5 w-4 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i < step ? '#10b981' : '#d2d2d7' }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold leading-snug" style={{ color: '#1d1d1f' }}>{current.title}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#515154' }}>{current.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl flex-shrink-0 transition-colors hover:bg-[#f5f5f7]"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" style={{ color: '#86868b' }} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* Text fields */}
              {current.fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.fields.map((field) => (
                    <div key={field.key} className={field.key === 'birthDate' || field.key === 'nationality' ? '' : ''}>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1d1d1f' }}>
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={(e) => handleField(field.key, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all"
                          style={{
                            border: '1px solid #d2d2d7',
                            color: formData[field.key] ? '#1d1d1f' : '#86868b',
                          }}
                          onFocus={(e) => { e.currentTarget.style.border = '1px solid #1b5e3b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,94,59,0.12)' }}
                          onBlur={(e)  => { e.currentTarget.style.border = '1px solid #d2d2d7'; e.currentTarget.style.boxShadow = '' }}
                        >
                          <option value="">Sélectionner…</option>
                          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] ?? ''}
                          onChange={(e) => handleField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all placeholder-[#86868b]"
                          style={{ border: '1px solid #d2d2d7', color: '#1d1d1f' }}
                          onFocus={(e) => { e.currentTarget.style.border = '1px solid #1b5e3b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,94,59,0.12)' }}
                          onBlur={(e)  => { e.currentTarget.style.border = '1px solid #d2d2d7'; e.currentTarget.style.boxShadow = '' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload slots */}
              {current.uploads.map((slot) => (
                <WizardUploadSlot
                  key={slot.docType}
                  slot={slot}
                  state={slotStates[slot.docType]}
                  existing={existingDocs.find((d) => d.docType === slot.docType)}
                  onFileSelect={handleFileSelect}
                />
              ))}

              {/* Security note */}
              {current.note && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: '#f5f5f7', border: '1px solid #d2d2d7' }}
                >
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#1b5e3b' }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: '#515154' }}>{current.note}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid #d2d2d7' }}
        >
          <button
            onClick={goPrev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f5f5f7]"
            style={{ color: '#515154' }}
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Annuler' : 'Retour'}
          </button>

          <div className="flex items-center gap-2">
            {allOptional && !isLast && (
              <button
                onClick={() => { setDirection(1); setStep((s) => s + 1) }}
                className="px-4 py-2.5 rounded-xl text-sm transition-colors hover:bg-[#f5f5f7]"
                style={{ color: '#86868b' }}
              >
                Passer
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed() || anyUploading || savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: '#1b5e3b' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0066d6' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1b5e3b' }}
            >
              {(savingProfile || anyUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLast ? 'Terminer' : 'Suivant'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
